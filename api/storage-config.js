// ================================================================
// api/storage-config.js
// Retorna URL e anon key do Supabase para upload direto do browser.
// A anon key é projetada para uso público no cliente — não é segredo.
// O controle de acesso é feito pelas políticas RLS do bucket.
// Festival de Inverno 2026 — Costa Marques/RO
// ================================================================

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ erro: 'Configuração incompleta' });
  }

  // Cache curto — não precisa chamar em todo upload
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).json({ url: SUPABASE_URL, key: SUPABASE_KEY });
}
