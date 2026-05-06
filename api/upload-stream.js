// ================================================================
// api/upload-stream.js
// Upload por streaming — sem limite de tamanho
// O arquivo vai do browser → aqui → Supabase em stream
// sem body parser do Vercel (evita o limite de 4.5MB)
// Festival de Inverno 2026 — Costa Marques/RO
// ================================================================

export const config = {
  api: {
    bodyParser: false,   // desabilita body parser → sem limite de tamanho
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ erro: 'Configuração incompleta' });
  }

  // Parâmetros vêm na query string (não no body, pois body parser está desativado)
  const { nome, bucket, tipo } = req.query;
  if (!nome || !bucket) {
    return res.status(400).json({ erro: 'nome e bucket são obrigatórios na query string' });
  }

  const BUCKETS_OK = ['alimentos', 'galeria', 'trofeus', 'videos-pesca'];
  const bucketFinal = BUCKETS_OK.includes(bucket) ? bucket : 'galeria';

  const storageUrl  = `${SUPABASE_URL}/storage/v1/object/${bucketFinal}/${nome}`;
  const contentType = tipo || req.headers['content-type'] || 'application/octet-stream';

  try {
    // Transmite o body do request diretamente para o Supabase (sem buffer em memória)
    const supaResp = await fetch(storageUrl, {
      method: 'POST',
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type':  contentType,
        'x-upsert':      'true',
      },
      // @ts-ignore — Node 18+ suporta ReadableStream como body
      body: req,
      duplex: 'half',
    });

    if (supaResp.ok) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketFinal}/${nome}`;
      return res.status(200).json({ ok: true, url: publicUrl });
    }

    let errData = {};
    try { errData = await supaResp.json(); } catch {}
    console.error('[upload-stream] Supabase erro:', supaResp.status, errData);
    return res.status(supaResp.status).json({
      erro: `Supabase recusou (HTTP ${supaResp.status})`,
      detalhe: errData,
    });

  } catch (err) {
    console.error('[upload-stream] Erro interno:', err);
    return res.status(500).json({ erro: 'Erro interno', detalhe: err.message });
  }
}
