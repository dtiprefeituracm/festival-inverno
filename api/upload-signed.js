// ================================================================
// api/upload-signed.js
// Gera URL assinada para upload DIRETO ao Supabase Storage
// Contorna o limite de 4.5MB da Vercel — o arquivo vai
// diretamente do browser para o Supabase, sem passar aqui.
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

  const { nome, bucket } = req.body || {};
  if (!nome || !bucket) {
    return res.status(400).json({ erro: 'nome e bucket são obrigatórios' });
  }

  const BUCKETS_OK = ['alimentos', 'galeria', 'trofeus', 'videos-pesca'];
  const bucketFinal = BUCKETS_OK.includes(bucket) ? bucket : 'galeria';

  try {
    // Pede ao Supabase uma URL assinada para upload direto
    const r = await fetch(
      `${SUPABASE_URL}/storage/v1/object/upload/sign/${bucketFinal}/${nome}`,
      {
        method: 'POST',
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type':  'application/json',
        },
      }
    );

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ erro: 'Supabase recusou a URL assinada', detalhe: data });
    }

    // data.signedURL já é o path relativo; montar URL completa
    const signedURL = `${SUPABASE_URL}${data.signedURL}`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketFinal}/${nome}`;

    return res.status(200).json({ ok: true, signedURL, publicUrl });

  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno', detalhe: err.message });
  }
}
