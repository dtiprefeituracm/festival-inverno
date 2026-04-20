// js/app.js — Código principal do sistema de inscrições
// Festival de Inverno 2026 - Costa Marques/RO

let selecionados = new Set();           // modalidades escolhidas na inscrição nova
let selecionadosAdd = new Set();        // modalidades na aba de consulta
let participanteConsulta = null;
let inscricoesConsulta = [];

// ==================== FUNÇÕES DE API (usando o proxy seguro) ====================
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

// ==================== FUNÇÕES DA PÁGINA ====================

// Mudar entre abas (Nova Inscrição / Já inscrito?)
function mudarTab(aba) {
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('ativo'));
  
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

// Selecionar sexo e mostrar modalidades corretas
function selecionarSexo(s) {
  document.getElementById('sexo').value = s;
  
  document.getElementById('sexo-btn-m').classList.toggle('ativo-m', s === 'M');
  document.getElementById('sexo-btn-f').classList.toggle('ativo-f', s === 'F');

  // Mostrar/esconder modalidades conforme sexo
  const wrappers = document.querySelectorAll('.evento-wrapper');
  wrappers.forEach(wrapper => {
    const id = parseInt(wrapper.id.replace('wrapper-ev', ''));
    if (!id) return;
    
    if (s === 'M') {
      wrapper.classList.toggle('oculto', id === 2 || id === 7);   // esconde fem
    } else {
      wrapper.classList.toggle('oculto', id === 1 || id === 6);   // esconde masc
    }
  });

  document.getElementById('eventos-bloqueio').classList.remove('visivel');
  document.getElementById('eventos-conteudo').classList.add('visivel');
}

// Alternar seleção de evento (Nova inscrição)
function toggleEvento(id) {
  const card = document.getElementById('ev' + id);
  const parceiroBox = document.getElementById('parceiro-' + id);
  const isFem = document.getElementById('sexo').value === 'F';

  if (selecionados.has(id)) {
    selecionados.delete(id);
    card.classList.remove('selecionado', 'feminino-selecionado');
    if (parceiroBox) parceiroBox.classList.remove('visivel');
  } else {
    selecionados.add(id);
    card.classList.add(isFem ? 'feminino-selecionado' : 'selecionado');
    if (parceiroBox && CONFIG.DUPLAS.has(id)) {
      parceiroBox.classList.add('visivel');
    }
  }
}

// Enviar inscrição (principal)
async function enviarInscricao() {
  const btn = document.getElementById('btn-enviar');
  const erro = document.getElementById('erro');
  erro.style.display = 'none';

  // Validações básicas
  const nome = document.getElementById('nome').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  const sexo = document.getElementById('sexo').value;
  const telefone = document.getElementById('telefone').value.trim();
  const cidade = document.getElementById('cidade-valor').value.trim() || document.getElementById('cidade').value.trim();

  if (!nome || !cpf || !sexo || !telefone || !cidade) {
    erro.textContent = 'Preencha todos os campos obrigatórios.';
    erro.style.display = 'block';
    return;
  }

  if (selecionados.size === 0) {
    erro.textContent = 'Selecione pelo menos um evento.';
    erro.style.display = 'block';
    return;
  }

  if (!document.getElementById('cb-autorizo').checked) {
    erro.textContent = 'Você precisa autorizar o uso de imagem.';
    erro.style.display = 'block';
    return;
  }

  if (!document.getElementById('aceite-regulamento').checked) {
    erro.textContent = 'Você precisa aceitar o Regulamento.';
    erro.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    const ficha = gerarFicha();

    // 1. Salvar participante
    const participanteData = {
      nome_completo: nome,
      cpf: cpf,
      sexo: sexo,
      email: document.getElementById('email').value.trim() || null,
      telefone: telefone,
      data_nascimento: document.getElementById('nascimento').value || null,
      cidade: cidade,
      uf: 'RO',
      autorizacao_imagem: true,
      nome_responsavel: eMenor() ? document.getElementById('nome-responsavel').value.trim() : null
    };

    const resPart = await post('participantes', participanteData);

    if (!resPart || resPart.length === 0) {
      throw new Error('Erro ao salvar participante');
    }

    const participanteId = resPart[0].id;

    // 2. Salvar cada inscrição
    for (const modId of selecionados) {
      const insc = {
        participante_id: participanteId,
        modalidade_id: modId,
        numero_ficha: ficha,
        status: 'confirmado'
      };

      // Adicionar dados de parceiro ou membros se for dupla/pesca
      if (CONFIG.DUPLAS.has(modId)) {
        const pNome = document.getElementById(`p${modId}-nome`)?.value.trim();
        if (pNome) {
          insc.parceiro_nome = pNome;
          insc.parceiro_cpf = document.getElementById(`p${modId}-cpf`)?.value.trim() || null;
          insc.parceiro_telefone = document.getElementById(`p${modId}-tel`)?.value.trim() || null;
        }
      }

      if (CONFIG.EQUIPES.has(modId)) {
        // Aqui você pode expandir para salvar m2, m3, m4 + autorizações
        // (vamos melhorar isso no próximo passo)
      }

      await post('inscricoes', insc);
    }

    // Sucesso
    mostrarSucesso(ficha);

  } catch (err) {
    console.error(err);
    erro.textContent = 'Erro ao enviar inscrição. Tente novamente.';
    erro.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar inscrição';
  }
}

function mostrarSucesso(ficha) {
  document.getElementById('formulario').style.display = 'none';
  document.getElementById('sucesso').style.display = 'block';
  document.getElementById('numero-ficha').textContent = ficha;
  
  // Link do WhatsApp
  const mods = Array.from(selecionados).map(id => CONFIG.NOMES_MOD[id] || id).join(', ');
  const texto = `Estou inscrito no Festival de Inverno 2026!\nFicha: ${ficha}\nModalidades: ${mods}`;
  document.getElementById('share-link').href = `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
  // Máscara de CPF
  const cpfInput = document.getElementById('cpf');
  if (cpfInput) cpfInput.addEventListener('input', () => mascararCPF(cpfInput));

  // Botão de envio
  const btnEnviar = document.getElementById('btn-enviar');
  if (btnEnviar) btnEnviar.addEventListener('click', enviarInscricao);

  // Inicia na aba de inscrição
  mudarTab('inscricao');

  console.log('✅ Sistema de Inscrições carregado com sucesso!');
});
