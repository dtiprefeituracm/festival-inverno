// ============================================================
//  api/supabase.js — Serverless Function (Vercel)
//  Sistema de Inscrições — Festival de Inverno 2026
//  © 2026 Ewerson Luiz de Oliveira — Prefeitura de Costa Marques / RO
// ============================================================
//
//  PROPÓSITO:
//  Intermediário seguro entre o front-end e o Supabase.
//  As chaves do banco ficam APENAS aqui (variáveis de ambiente do Vercel)
//  e NUNCA chegam ao navegador do usuário.
//
//  VARIÁVEIS DE AMBIENTE NECESSÁRIAS (configurar no Vercel):
//  → SUPABASE_URL  = https://pjjqmoxccggsvfjjckhp.supabase.co
//  → SUPABASE_KEY  = sb_publishable_NG9lP5x2hkiU_rCIgCTkeA_O29A7aN1
//
//  COMO CONFIGURAR NO VERCEL:
//  1. Acesse vercel.com > seu projeto > Settings > Environment Variables
//  2. Adicione SUPABASE_URL com o valor da URL do projeto
//  3. Adicione SUPABASE_KEY com a chave publishable
//  4. Clique em Save e faça um novo deploy
// ============================================================

export default async function handler(req, res) {

  // ── Chaves seguras — vindas do servidor, nunca do browser ──
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ erro: 'Variáveis de ambiente não configuradas.' });
  }

  // ── CORS — só aceita do domínio oficial ──────────────────
  const origensPermitidas = [
    'https://festival-inverno.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500'
  ];
  const origem = req.headers.origin;
  if (origensPermitidas.includes(origem)) {
    res.setHeader('Access-Control-Allow-Origin', origem);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido. Use POST.' });
  }

  // ── Validar body ─────────────────────────────────────────
  const { acao, tabela, query, dados } = req.body || {};

  // Tabelas permitidas — whitelist de segurança
  const tabelasPermitidas = ['participantes', 'inscricoes', 'modalidades'];
  if (tabela && !tabelasPermitidas.includes(tabela)) {
    return res.status(403).json({ erro: 'Tabela não autorizada: ' + tabela });
  }

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  };

  try {

    // ── BUSCAR dados (GET no Supabase) ────────────────────
    if (acao === 'buscar') {
      const tabelaAlvo = tabela || dados?.tabela;
      const queryStr   = query  || dados?.query || '';

      if (!tabelaAlvo) {
        return res.status(400).json({ erro: 'Parâmetro "tabela" obrigatório.' });
      }

      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/${tabelaAlvo}?${queryStr}`,
        { headers }
      );
      const resultado = await resp.json();
      return res.status(resp.status).json(resultado);
    }

    // ── INSERIR dados (POST no Supabase) ──────────────────
    if (acao === 'inserir') {
      const tabelaAlvo = tabela;
      const dadosAlvo  = dados;

      if (!tabelaAlvo || !dadosAlvo) {
        return res.status(400).json({ erro: 'Parâmetros "tabela" e "dados" obrigatórios.' });
      }

      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/${tabelaAlvo}`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(dadosAlvo)
        }
      );
      const resultado = await resp.json();
      return res.status(resp.status).json(resultado);
    }

    return res.status(400).json({ erro: 'Ação inválida. Use: buscar ou inserir.' });

  } catch (err) {
    console.error('[api/supabase] Erro interno:', err);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}
