// ================================================================
// api/admin-auth.js
// Autenticação segura do painel administrativo
// As credenciais ficam no servidor (Vercel), NUNCA no navegador
// Festival de Inverno 2026 — Costa Marques/RO
// ================================================================

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { usuario, senha } = req.body;

  // Credenciais definidas nas variáveis de ambiente da Vercel
  const ADMIN_USER  = process.env.ADMIN_USER  || 'admin';
  const ADMIN_SENHA = process.env.ADMIN_SENHA || 'festival2026';

  if (usuario === ADMIN_USER && senha === ADMIN_SENHA) {
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2);
    return res.status(200).json({ ok: true, token });
  }

  return res.status(401).json({ ok: false, erro: 'Usuário ou senha incorretos' });
}
