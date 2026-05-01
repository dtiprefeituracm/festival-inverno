// ================================================================
// api/admin-auth.js
// Autenticação — admin master + operadores configurados
// Festival de Inverno 2026 — Costa Marques/RO
// ================================================================

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { usuario, senha } = req.body;

  // ── Admin master (variáveis de ambiente) ──────────────────
  const ADMIN_USER  = process.env.ADMIN_USER  || 'admin';
  const ADMIN_SENHA = process.env.ADMIN_SENHA || 'festival2026';

  if (usuario === ADMIN_USER && senha === ADMIN_SENHA) {
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2);
    return res.status(200).json({
      ok: true, token,
      perfil: 'admin',
      nome: 'Administrador',
      podeExcluir: true
    });
  }

  // ── Operadores (até 10, em variáveis de ambiente) ──────────
  // Formato: OPERADOR_1=usuario:senha:nome:podeExcluir
  // Ex:      OPERADOR_1=joao:senha123:João Silva:false
  for (let i = 1; i <= 10; i++) {
    const op = process.env[`OPERADOR_${i}`];
    if (!op) continue;
    const partes = op.split(':');
    if (partes.length < 3) continue;
    const [opUser, opSenha, opNome, opExcluir] = partes;
    if (usuario === opUser && senha === opSenha) {
      const token = Date.now().toString(36) + Math.random().toString(36).slice(2);
      return res.status(200).json({
        ok: true, token,
        perfil: 'operador',
        nome: opNome || opUser,
        podeExcluir: opExcluir === 'true'
      });
    }
  }

  return res.status(401).json({ ok: false, erro: 'Usuário ou senha incorretos' });
}
