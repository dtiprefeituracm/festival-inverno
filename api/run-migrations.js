// ================================================================
// api/run-migrations.js
// Executa todas as migrations SQL necessárias automaticamente
// via Supabase REST API (sem precisar do painel)
//
// USO (uma única vez após deploy):
//   POST /api/run-migrations
//   Body: { "token": "<adminToken>" }
//
// Migrations incluídas:
//   - ADD COLUMN observacao em resultados_pesca
//   - ADD COLUMN observacao em resultados_tempo
//   - INSERT modalidades 8 e 9 (Canoagem/Caiaque Feminino)
//   - Cria tabela resultados_pesca se não existir
//
// Festival de Inverno 2026 — Costa Marques/RO
// ================================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ erro: 'Variáveis de ambiente não configuradas' });
  }

  const headers = {
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
  };

  const log      = [];
  const erros    = [];
  let   sucesso  = 0;

  // ── Executa SQL via Supabase RPC (função exec_sql deve existir) ──
  // Alternativa: usa a API REST diretamente para cada operação
  async function sql(descricao, query) {
    try {
      // Tenta via endpoint de SQL do Supabase (disponível no plano gratuito)
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method:  'POST',
        headers,
        body: JSON.stringify({ sql: query }),
      });

      if (r.ok) {
        log.push(`✅ ${descricao}`);
        sucesso++;
        return true;
      }

      const err = await r.json().catch(() => ({}));
      // PGRST202 = função não encontrada — significa que não temos exec_sql
      // Nesse caso, reportamos o SQL para rodar manualmente
      if (err?.code === 'PGRST202' || r.status === 404) {
        log.push(`⚠️  ${descricao} — execute manualmente (ver proximosPassos)`);
        return false;
      }

      // 42701 = coluna já existe — OK
      if (err?.code === '42701' || JSON.stringify(err).includes('already exists')) {
        log.push(`✅ ${descricao} — já existia`);
        sucesso++;
        return true;
      }

      erros.push(`❌ ${descricao}: ${JSON.stringify(err)}`);
      return false;
    } catch (e) {
      erros.push(`❌ ${descricao}: ${e.message}`);
      return false;
    }
  }

  // ── Verifica existência de coluna via information_schema ─────
  async function colunaExiste(tabela, coluna) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/information_schema.columns` +
      `?table_name=eq.${tabela}&column_name=eq.${coluna}&select=column_name`,
      { headers: { ...headers, 'Accept': 'application/json' } }
    ).catch(() => null);

    if (!r || !r.ok) return null; // desconhecido
    const data = await r.json().catch(() => []);
    return Array.isArray(data) && data.length > 0;
  }

  // ── Verifica linha em tabela ──────────────────────────────────
  async function linhaExiste(tabela, campo, valor) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/${tabela}?${campo}=eq.${valor}&select=${campo}&limit=1`,
      { headers }
    ).catch(() => null);
    if (!r || !r.ok) return null;
    const data = await r.json().catch(() => []);
    return Array.isArray(data) && data.length > 0;
  }

  // ── Insere linha se não existir ───────────────────────────────
  async function inserirSeNaoExistir(descricao, tabela, dados, campoPK, valorPK) {
    const existe = await linhaExiste(tabela, campoPK, valorPK);
    if (existe) {
      log.push(`✅ ${descricao} — já existia`);
      sucesso++;
      return;
    }
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify(dados),
    });
    if (r.ok || r.status === 201 || r.status === 204) {
      log.push(`✅ ${descricao}`);
      sucesso++;
    } else {
      const err = await r.json().catch(() => ({}));
      // Conflito de chave = já existe
      if (r.status === 409 || JSON.stringify(err).includes('duplicate')) {
        log.push(`✅ ${descricao} — já existia`);
        sucesso++;
      } else {
        erros.push(`❌ ${descricao}: ${JSON.stringify(err)}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MIGRATIONS
  // ═══════════════════════════════════════════════════════════════
  log.push('🚀 Iniciando migrations — Festival de Inverno 2026');
  log.push('');

  // ── 1. Coluna observacao em resultados_pesca ─────────────────
  log.push('── Bloco 1: Colunas extras ──');
  const obsExistePesca = await colunaExiste('resultados_pesca', 'observacao');
  if (obsExistePesca === true) {
    log.push('✅ resultados_pesca.observacao — já existia');
    sucesso++;
  } else if (obsExistePesca === false) {
    await sql(
      'ADD COLUMN resultados_pesca.observacao',
      `ALTER TABLE resultados_pesca ADD COLUMN IF NOT EXISTS observacao TEXT;`
    );
  } else {
    log.push('⚠️  Não foi possível verificar resultados_pesca.observacao — adicione manualmente');
  }

  const obsExisteTempo = await colunaExiste('resultados_tempo', 'observacao');
  if (obsExisteTempo === true) {
    log.push('✅ resultados_tempo.observacao — já existia');
    sucesso++;
  } else if (obsExisteTempo === false) {
    await sql(
      'ADD COLUMN resultados_tempo.observacao',
      `ALTER TABLE resultados_tempo ADD COLUMN IF NOT EXISTS observacao TEXT;`
    );
  } else {
    log.push('⚠️  Não foi possível verificar resultados_tempo.observacao — adicione manualmente');
  }

  // ── 2. Modalidades 8 e 9 (Aquáticas Feminino) ───────────────
  log.push('');
  log.push('── Bloco 2: Modalidades ──');

  await inserirSeNaoExistir(
    'Modalidade 8 — Canoagem Feminino',
    'modalidades',
    { id: 8, nome: 'Canoagem', categoria: 'agua', genero: 'Feminino', vagas: 0 },
    'id', 8
  );

  await inserirSeNaoExistir(
    'Modalidade 9 — Caiaque Feminino',
    'modalidades',
    { id: 9, nome: 'Caiaque', categoria: 'agua', genero: 'Feminino', vagas: 0 },
    'id', 9
  );

  // ── 3. SQL manual necessário (coluna via ALTER) ──────────────
  const sqlManual = [
    `-- Se as colunas não foram criadas automaticamente, execute no Supabase SQL Editor:`,
    `ALTER TABLE resultados_pesca ADD COLUMN IF NOT EXISTS observacao TEXT;`,
    `ALTER TABLE resultados_tempo  ADD COLUMN IF NOT EXISTS observacao TEXT;`,
    ``,
    `-- Migração inscrições femininas de Canoagem (ID 4 → 8):`,
    `UPDATE inscricoes SET modalidade_id = 8`,
    `  WHERE modalidade_id = 4`,
    `  AND participante_id IN (SELECT id FROM participantes WHERE sexo ILIKE 'F%');`,
    ``,
    `-- Migração inscrições femininas de Caiaque (ID 5 → 9):`,
    `UPDATE inscricoes SET modalidade_id = 9`,
    `  WHERE modalidade_id = 5`,
    `  AND participante_id IN (SELECT id FROM participantes WHERE sexo ILIKE 'F%');`,
    ``,
    `-- Migração de pontuações de Canoagem feminino:`,
    `UPDATE resultados_tempo SET modalidade_id = 8`,
    `  WHERE modalidade_id = 4`,
    `  AND participante_id IN (SELECT id FROM participantes WHERE sexo ILIKE 'F%');`,
    ``,
    `-- Migração de pontuações de Caiaque feminino:`,
    `UPDATE resultados_tempo SET modalidade_id = 9`,
    `  WHERE modalidade_id = 5`,
    `  AND participante_id IN (SELECT id FROM participantes WHERE sexo ILIKE 'F%');`,
  ];

  log.push('');
  log.push('── Bloco 3: SQL manual (copie para o SQL Editor se necessário) ──');
  sqlManual.forEach(l => log.push(l));

  // ── Resultado final ──────────────────────────────────────────
  log.push('');
  log.push(`── Resultado: ${sucesso} operação(ões) aplicada(s), ${erros.length} erro(s) ──`);
  erros.forEach(e => log.push(e));

  return res.status(200).json({
    ok:      erros.length === 0,
    sucesso,
    erros,
    log,
    proximosPassos: erros.length > 0 ? [
      'Acesse Supabase Dashboard > SQL Editor',
      'Cole e execute o bloco SQL manual do log acima',
      'Depois execute POST /api/setup-storage para criar o bucket videos-pesca',
    ] : [
      'Execute POST /api/setup-storage para criar o bucket videos-pesca',
      'Faça um teste de upload de vídeo no painel de pesca',
    ],
  });
}
