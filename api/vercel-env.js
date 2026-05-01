// ================================================================
// api/vercel-env.js
// Gerencia variáveis de ambiente na Vercel via API oficial
// Permite adicionar/remover operadores sem deploy manual
// Festival de Inverno 2026 — Costa Marques/RO
// ================================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const VERCEL_TOKEN    = process.env.VERCEL_TOKEN;
  const VERCEL_PROJECT  = process.env.VERCEL_PROJECT_ID;
  const VERCEL_TEAM     = process.env.VERCEL_TEAM_ID; // opcional, para contas team

  if (!VERCEL_TOKEN || !VERCEL_PROJECT) {
    return res.status(500).json({
      erro: 'VERCEL_TOKEN ou VERCEL_PROJECT_ID não configurados.',
      ajuda: 'Adicione VERCEL_TOKEN (token da API Vercel) e VERCEL_PROJECT_ID nas variáveis de ambiente deste projeto.'
    });
  }

  const { acao } = req.body;
  const baseUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT}/env`;
  const teamParam = VERCEL_TEAM ? `?teamId=${VERCEL_TEAM}` : '';

  const headers = {
    'Authorization': `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json'
  };

  // ── Listar todas as variáveis OPERADOR_N ──────────────────────
  if (acao === 'listar') {
    try {
      const r = await fetch(`${baseUrl}${teamParam}`, { headers });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ erro: data.error?.message || 'Erro ao listar variáveis' });

      const envs = (data.envs || []).filter(e => /^OPERADOR_\d+$/.test(e.key));
      return res.status(200).json({ ok: true, variaveis: envs.map(e => ({ id: e.id, key: e.key })) });
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  }

  // ── Adicionar variável OPERADOR_N ─────────────────────────────
  if (acao === 'adicionar') {
    const { key, value } = req.body;
    if (!key || !value) return res.status(400).json({ erro: 'key e value são obrigatórios' });
    if (!/^OPERADOR_\d+$/.test(key)) return res.status(400).json({ erro: 'Chave inválida. Use o formato OPERADOR_N' });

    try {
      // Verifica se já existe com essa chave
      const rList = await fetch(`${baseUrl}${teamParam}`, { headers });
      const dataList = await rList.json();
      const existente = (dataList.envs || []).find(e => e.key === key);

      let r;
      if (existente) {
        // PATCH para atualizar
        r = await fetch(`${baseUrl}/${existente.id}${teamParam}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ value, target: ['production', 'preview', 'development'], type: 'encrypted' })
        });
      } else {
        // POST para criar
        r = await fetch(`${baseUrl}${teamParam}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ key, value, target: ['production', 'preview', 'development'], type: 'encrypted' })
        });
      }

      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ erro: data.error?.message || 'Erro ao salvar variável' });
      return res.status(200).json({ ok: true, acao: existente ? 'atualizado' : 'criado' });
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  }

  // ── Remover variável OPERADOR_N pelo ID ───────────────────────
  if (acao === 'remover') {
    const { envId } = req.body;
    if (!envId) return res.status(400).json({ erro: 'envId é obrigatório' });

    try {
      const r = await fetch(`${baseUrl}/${envId}${teamParam}`, {
        method: 'DELETE',
        headers
      });
      if (r.ok || r.status === 204) return res.status(200).json({ ok: true });
      let data = {};
      try { data = await r.json(); } catch {}
      return res.status(r.status).json({ erro: data.error?.message || 'Erro ao remover variável' });
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  }

  // ── Alterar senha do admin master ────────────────────────────
  if (acao === 'alterarSenhaAdmin') {
    const { novaSenha } = req.body;
    if (!novaSenha || novaSenha.length < 8) return res.status(400).json({ erro: 'Nova senha invalida (minimo 8 caracteres)' });

    try {
      const rList = await fetch(`${baseUrl}${teamParam}`, { headers });
      const dataList = await rList.json();
      const existente = (dataList.envs || []).find(e => e.key === 'ADMIN_SENHA');

      // Se existir, deleta primeiro — Vercel nao permite alterar type de variavel existente
      if (existente) {
        await fetch(`${baseUrl}/${existente.id}${teamParam}`, { method: 'DELETE', headers });
      }

      // Recria com novo valor
      const r = await fetch(`${baseUrl}${teamParam}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          key: 'ADMIN_SENHA',
          value: novaSenha,
          target: ['production', 'preview', 'development'],
          type: 'encrypted'
        })
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ erro: data.error?.message || 'Erro ao salvar senha' });
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  }

  // ── Acionar novo deploy (necessário para as vars entrarem em vigor) ──
  if (acao === 'redeploy') {
    try {
      // Busca o último deployment do projeto
      const rDep = await fetch(
        `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT}&limit=1${VERCEL_TEAM ? '&teamId=' + VERCEL_TEAM : ''}`,
        { headers }
      );
      const depData = await rDep.json();
      const ultimo = depData.deployments?.[0];
      if (!ultimo) return res.status(404).json({ erro: 'Nenhum deployment encontrado' });

      // Refaz o último deployment com as novas variáveis
      const rRedep = await fetch(`https://api.vercel.com/v13/deployments${VERCEL_TEAM ? '?teamId=' + VERCEL_TEAM : ''}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name:   ultimo.name,
          deploymentId: ultimo.uid,
          target: 'production'
        })
      });
      const redepData = await rRedep.json();
      if (!rRedep.ok) return res.status(rRedep.status).json({ erro: redepData.error?.message || 'Erro ao acionar redeploy' });
      return res.status(200).json({ ok: true, deploymentUrl: redepData.url });
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  }

  return res.status(400).json({ erro: 'Ação não reconhecida' });
}
