// ================================================================
// api/visitas.js
// Contador de acessos ao Portal da Transparência
// GET  → retorna total de acessos (público)
// POST → registra 1 acesso e retorna novo total
// Festival de Inverno 2026 — Costa Marques/RO
// ================================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ ok: false, erro: 'Configuração ausente' });
  }

  const headers = {
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
  };

  const CHAVE = 'portal_transparencia';
  const url   = `${SUPABASE_URL}/rest/v1/contadores?chave=eq.${CHAVE}&select=valor,atualizado_em`;

  try {
    // ── GET: apenas retorna o total atual ──
    if (req.method === 'GET') {
      const r    = await fetch(url, { headers });
      const data = await r.json();
      const val  = Array.isArray(data) && data[0] ? data[0].valor : 0;
      return res.status(200).json({ ok: true, visitas: val });
    }

    // ── POST: incrementa +1 e retorna novo total ──
    if (req.method === 'POST') {
      // 1. Lê valor atual
      const rGet = await fetch(url, { headers });
      const atual = await rGet.json();
      const existe = Array.isArray(atual) && atual.length > 0;
      const novoValor = existe ? (atual[0].valor || 0) + 1 : 1;
      const agora = new Date().toISOString();

      if (existe) {
        // Atualiza linha existente
        const rPatch = await fetch(
          `${SUPABASE_URL}/rest/v1/contadores?chave=eq.${CHAVE}`,
          { method: 'PATCH', headers,
            body: JSON.stringify({ valor: novoValor, atualizado_em: agora }) }
        );
        if (!rPatch.ok) throw new Error('PATCH falhou: ' + rPatch.status);
      } else {
        // Cria primeira linha
        const rPost = await fetch(
          `${SUPABASE_URL}/rest/v1/contadores`,
          { method: 'POST', headers,
            body: JSON.stringify({ chave: CHAVE, valor: novoValor, atualizado_em: agora }) }
        );
        if (!rPost.ok) throw new Error('INSERT falhou: ' + rPost.status);
      }

      return res.status(200).json({ ok: true, visitas: novoValor });
    }

    return res.status(405).json({ ok: false, erro: 'Método não permitido' });

  } catch(err) {
    console.error('[visitas]', err.message);
    // Retorna 0 sem quebrar o portal
    return res.status(200).json({ ok: false, visitas: 0, erro: err.message });
  }
}
