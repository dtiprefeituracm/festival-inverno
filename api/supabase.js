// ================================================================
// api/supabase.js
// Endpoint seguro — todas as operações no banco passam por aqui
// As chaves do Supabase ficam no servidor, NUNCA no navegador
// Festival de Inverno 2026 — Costa Marques/RO
// ================================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ erro: 'Configuração do servidor incompleta' });
  }

  const { acao, tabela, query, dados, id } = req.body;

  const baseUrl = `${SUPABASE_URL}/rest/v1/${tabela}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    if (acao === 'buscar') {
      const url = query ? `${baseUrl}?${query}` : `${baseUrl}?select=*`;
      const r = await fetch(url, { headers });
      const data = await r.json();
      return res.status(200).json(data);
    }

    if (acao === 'inserir') {
      const r = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(dados)
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    if (acao === 'atualizar') {
      const url = `${baseUrl}?id=eq.${id}`;
      const r = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(dados)
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    if (acao === 'deletar') {
      const url = `${baseUrl}?id=eq.${id}`;
      const r = await fetch(url, { method: 'DELETE', headers });
      if (r.status === 204) return res.status(200).json({ ok: true });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    return res.status(400).json({ erro: 'Ação não reconhecida' });

  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno do servidor', detalhe: err.message });
  }
}
