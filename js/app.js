// js/app.js — Versão melhorada

let selecionados = new Set();

// ==================== API ====================
async function get(tabela, query = '') {
  const res = await fetch('/api/supabase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acao: 'buscar', tabela, query })
  });
  return res.json();
}

async function post(tabela, dados) {
  const res = await fetch('/api/supabase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acao: 'inserir', tabela, dados })
  });
  return res.json();
}

// ==================== MUDAR ABA ====================
function mudarTab(aba) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('ativo'));
  if (aba === 'inscricao') {
    document.getElementById('tab-inscricao').classList.add('ativo');
    document.getElementById('aba-inscricao').style.display = 'block';
    document.getElementById('secao-consulta').style.display = 'none';
  } else {
    document.getElementById('tab-consulta').classList.add('ativo');
    document.getElementById('aba-inscricao').style.display = 'none';
    document.getElementById('secao-consulta').style.display = 'block';
  }
}

// ==================== SELECIONAR SEXO ====================
function selecionarSexo(s) {
  document.getElementById('sexo').value = s;
  document.getElementById('sexo-btn-m').classList.toggle('ativo-m', s === 'M');
  document.getElementById('sexo-btn-f').classList.toggle('ativo-f', s === 'F');

  const isM = s === 'M';
  document.querySelectorAll('.evento-wrapper').forEach(w => {
    const id = parseInt(w.id.replace('wrapper-ev', '')) || 0;
    if (!id) return;
    w.classList.toggle('oculto', (isM && [2,7].includes(id)) || (!isM && [1,6].includes(id)));
  });

  document.getElementById('eventos-bloqueio').classList.remove('visivel');
  document.getElementById('eventos-conteudo').classList.add('visivel');
}

// ==================== TOGGLE EVENTO ====================
function toggleEvento(id) {
  const card = document.getElementById('ev' + id);
  if (!card) return;

  if (selecionados.has(id)) {
    selecionados.delete(id);
    card.classList.remove('selecionado', 'feminino-selecionado');
  } else {
    selecionados.add(id);
    const isFem = document.getElementById('sexo').value === 'F';
    card.classList.add(isFem ? 'feminino-selecionado' : 'selecionado');
  }
}

// ==================== ENVIAR INSCRIÇÃO ====================
async function enviarInscricao() {
  const btn = document.getElementById('btn-enviar');
  const erro = document.getElementById('erro');
  erro.style.display = 'none';

  const nome = document.getElementById('nome').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  const sexo = document.getElementById('sexo').value;
  const tel = document.getElementById('telefone').value.trim();
  const cidade = document.getElementById('cidade-valor').value.trim() || document.getElementById('cidade').value.trim();

  if (!nome || !cpf || !sexo || !tel || !cidade) {
    erro.textContent = "Preencha todos os campos obrigatórios.";
    erro.style.display = "block";
    return;
  }
  if (selecionados.size === 0) {
    erro.textContent = "Selecione pelo menos um evento.";
    erro.style.display = "block";
    return;
  }
  if (!document.getElementById('cb-autorizo').checked) {
    erro.textContent = "É obrigatório autorizar o uso de imagem.";
    erro.style.display = "block";
    return;
  }
  if (!document.getElementById('aceite-regulamento').checked) {
    erro.textContent = "Você precisa aceitar o Regulamento.";
    erro.style.display = "block";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    const ficha = "FI-" + String(Math.floor(Math.random() * 9000) + 1000);

    const part = await post('participantes', {
      nome_completo: nome,
      cpf: cpf,
      sexo: sexo,
      telefone: tel,
      cidade: cidade,
      uf: "RO",
      autorizacao_imagem: true,
      data_nascimento: document.getElementById('nascimento').value || null,
      email: document.getElementById('email').value.trim() || null
    });

    if (!part || part.length === 0) throw new Error("Erro ao salvar participante");

    const pid = part[0].id;

    for (const modId of selecionados) {
      await post('inscricoes', {
        participante_id: pid,
        modalidade_id: modId,
        numero_ficha: ficha,
        status: "confirmado"
      });
    }

    // Sucesso
    document.getElementById('formulario').style.display = 'none';
    const suc = document.getElementById('sucesso');
    suc.style.display = 'block';
    document.getElementById('numero-ficha').textContent = ficha;

  } catch (e) {
    console.error(e);
    erro.textContent = "Erro ao enviar. Tente novamente.";
    erro.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Enviar Inscrição";
  }
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
  const cpfEl = document.getElementById('cpf');
  if (cpfEl) cpfEl.addEventListener('input', () => mascararCPF(cpfEl));

  document.getElementById('btn-enviar').addEventListener('click', enviarInscricao);

  mudarTab('inscricao');

  console.log('%c✅ Sistema Festival de Inverno 2026 carregado com sucesso!', 'color:#1a56a0; font-weight:bold');
});
