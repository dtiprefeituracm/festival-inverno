// ================================================================
// api/upload.js
// Upload genérico para Supabase Storage
// Buckets: alimentos | galeria | trofeus | videos-pesca
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

  const { base64, nome, tipo, bucket } = req.body;

  if (!base64 || !nome) {
    return res.status(400).json({ erro: 'base64 e nome são obrigatórios' });
  }

  // Buckets permitidos por segurança
  const BUCKETS_OK = ['alimentos', 'galeria', 'trofeus', 'videos-pesca'];
  const bucketFinal = BUCKETS_OK.includes(bucket) ? bucket : 'alimentos';

  try {
    const buffer      = Buffer.from(base64, 'base64');
    const storageUrl  = `${SUPABASE_URL}/storage/v1/object/${bucketFinal}/${nome}`;
    const contentType = tipo || 'image/jpeg';

    const r = await fetch(storageUrl, {
      method: 'POST',
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type':  contentType,
        'x-upsert':      'true',
      },
      body: buffer,
    });

    if (r.ok) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketFinal}/${nome}`;
      return res.status(200).json({ ok: true, url: publicUrl });
    }

    let errData = {};
    try { errData = await r.json(); } catch {}
    return res.status(r.status).json({ erro: 'Falha no upload', detalhe: errData });

  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno', detalhe: err.message });
  }
}
