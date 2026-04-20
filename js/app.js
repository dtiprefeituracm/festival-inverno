// js/app.js — Versão final com Pesca progressiva

let selecionados = new Set();

// ==================== API ====================
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
  } else {
    document.getElementById('tab-consulta').classList.add('ativo');
    document.getElementById('aba-inscricao').style.display = 'none';
  }
}

// ==================== SELECIONAR SEXO ====================
function selecionarSexo(s) {
  document.getElementById('sexo').value = s;
  
  document.getElementById('sexo-btn-m').classList.toggle('ativo-m', s === 'M');
  document.getElementById('sexo-btn-f').classList.toggle('ativo-f', s === 'F');

  const isMasculino = s === 'M';

  document.querySelectorAll('.evento-wrapper').forEach(wrapper => {
    const id = parseInt(wrapper.id.replace('wrapper-ev', '')) || 0;
    if (!id) return;

    const mostrar = isMasculino 
      ? [1, 3, 4, 5, 6].includes(id) 
      : [2, 4, 5, 7].includes(id);

    wrapper.style.display = mostrar ? 'block' : 'none';

    // Esconde todos os campos de parceiro ao trocar sexo
    const parceiroBox = document.getElementById('parceiro-' + id);
    if (parceiroBox) parceiroBox.style.display = 'none';
  });

  document.getElementById('eventos-bloqueio').style.display = 'none';
  document.getElementById('eventos-conteudo').style.display = 'block';
}

// ==================== TOGGLE EVENTO ====================
function toggleEvento(id) {
  const card = document.getElementById('ev' + id);
  const parceiroBox = document.getElementById('parceiro-' + id);
  
  if (!card) return;

  if (selecionados.has(id)) {
    selecionados.delete(id);
    card.classList.remove('selecionado', 'feminino-selecionado');
    if (parceiroBox) parceiroBox.style.display = 'none';
  } else {
    selecionados.add(id);
    const isFem = document.getElementById('sexo').value === 'F';
    card.classList.add(isFem ? 'feminino-selecionado' : 'selecionado');
    
    // Mostra campos de parceiro para duplas e pesca
    if (parceiroBox && [1,2,3,4,6,7].includes(id)) {
      parceiroBox.style.display = 'block';
    }
  }
}

// ==================== MÁSCARA CPF ====================
function mascararCPF(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1.$2');
  el.value = v;
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
    const sucessoDiv = document.getElementById('sucesso');
    sucessoDiv.style.display = 'block';
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

  // Máscara nos campos de parceiro
  document.querySelectorAll('input[id$="-cpf"]').forEach(input => {
    input.addEventListener('input', () => mascararCPF(input));
  });

  document.getElementById('btn-enviar').addEventListener('click', enviarInscricao);

  // Inicia escondendo os eventos
  document.getElementById('eventos-conteudo').style.display = 'none';

  console.log('%c✅ Sistema Festival de Inverno 2026 carregado com sucesso!', 'color:#1a56a0; font-weight:bold');
});
