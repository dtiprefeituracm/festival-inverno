// js/app.js — Código principal do Festival de Inverno 2026

let selecionados = new Set();   // modalidades selecionadas na nova inscrição

// ==================== API (Proxy Seguro) ====================
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

// ==================== FUNÇÕES PRINCIPAIS ====================

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

function selecionarSexo(s) {
  document.getElementById('sexo').value = s;
  
  // Destaca o botão correto
  document.getElementById('sexo-btn-m').classList.toggle('ativo-m', s === 'M');
  document.getElementById('sexo-btn-f').classList.toggle('ativo-f', s === 'F');

  // Mostra/esconde modalidades conforme sexo
  const isMasculino = s === 'M';
  document.querySelectorAll('.evento-wrapper').forEach(wrapper => {
    const id = parseInt(wrapper.id.replace('wrapper-ev', '')) || 0;
    if (id === 0) return;
    
    if (isMasculino) {
      wrapper.classList.toggle('oculto', [2, 7].includes(id)); // esconde feminino
    } else {
      wrapper.classList.toggle('oculto', [1, 6].includes(id)); // esconde masculino
    }
  });

  // Mostra a área de eventos
  document.getElementById('eventos-bloqueio').classList.remove('visivel');
  document.getElementById('eventos-conteudo').classList.add('visivel');
}

// Alternar seleção de evento
function toggleEvento(id) {
  const card = document.getElementById('ev' + id);
  if (!card) return;

  const isFem = document.getElementById('sexo').value === 'F';

  if (selecionados.has(id)) {
    selecionados.delete(id);
    card.classList.remove('selecionado', 'feminino-selecionado');
  } else {
    selecionados.add(id);
    card.classList.add(isFem ? 'feminino-selecionado' : 'selecionado');
  }
}

// Enviar inscrição
async function enviarInscricao() {
  const btn = document.getElementById('btn-enviar');
  const erroEl = document.getElementById('erro');
  erroEl.style.display = 'none';

  const nome = document.getElementById('nome').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  const sexo = document.getElementById('sexo').value;
  const telefone = document.getElementById('telefone').value.trim();
  const cidade = document.getElementById('cidade-valor').value.trim() || document.getElementById('cidade').value.trim();

  if (!nome || !cpf || !sexo || !telefone || !cidade) {
    erroEl.textContent = 'Preencha todos os campos obrigatórios.';
    erroEl.style.display = 'block';
    return;
  }

  if (selecionados.size === 0) {
    erroEl.textContent = 'Selecione pelo menos um evento.';
    erroEl.style.display = 'block';
    return;
  }

  if (!document.getElementById('cb-autorizo').checked) {
    erroEl.textContent = 'É obrigatório autorizar o uso de imagem.';
    erroEl.style.display = 'block';
    return;
  }

  if (!document.getElementById('aceite-regulamento').checked) {
    erroEl.textContent = 'Você precisa aceitar o Regulamento.';
    erroEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    const ficha = 'FI-' + String(Math.floor(Math.random() * 9000) + 1000);

    // Salvar participante
    const partData = {
      nome_completo: nome,
      cpf: cpf,
      sexo: sexo,
      email: document.getElementById('email').value.trim() || null,
      telefone: telefone,
      data_nascimento: document.getElementById('nascimento').value || null,
      cidade: cidade,
      uf: 'RO',
      autorizacao_imagem: true
    };

    const resPart = await post('participantes', partData);
    if (!resPart || resPart.length === 0) throw new Error('Erro ao salvar participante');

    const pid = resPart[0].id;

    // Salvar inscrições
    for (const modId of selecionados) {
      const insc = {
        participante_id: pid,
        modalidade_id: modId,
        numero_ficha: ficha,
        status: 'confirmado'
      };
      await post('inscricoes', insc);
    }

    // Mostrar sucesso
    document.getElementById('formulario').style.display = 'none';
    const sucessoDiv = document.getElementById('sucesso');
    sucessoDiv.style.display = 'block';
    document.getElementById('numero-ficha').textContent = ficha;

  } catch (err) {
    console.error(err);
    erroEl.textContent = 'Ocorreu um erro. Tente novamente.';
    erroEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar Inscrição';
  }
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
  // Máscara CPF
  const cpfInput = document.getElementById('cpf');
  if (cpfInput) cpfInput.addEventListener('input', () => mascararCPF(cpfInput));

  // Botão enviar
  const btnEnviar = document.getElementById('btn-enviar');
  if (btnEnviar) btnEnviar.addEventListener('click', enviarInscricao);

  // Inicia na aba de inscrição
  mudarTab('inscricao');

  console.log('✅ Sistema Festival de Inverno carregado com sucesso!');
});
