// js/app.js — Versão corrigida com filtro forte

let selecionados = new Set();

async function post(tabela, dados) {
  const res = await fetch('/api/supabase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acao: 'inserir', tabela, dados })
  });
  return res.json();
}

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

function selecionarSexo(s) {
  document.getElementById('sexo').value = s;
  document.getElementById('sexo-btn-m').classList.toggle('ativo-m', s === 'M');
  document.getElementById('sexo-btn-f').classList.toggle('ativo-f', s === 'F');

  const isM = s === 'M';

  document.querySelectorAll('.evento-wrapper').forEach(wrapper => {
    const id = parseInt(wrapper.id.replace('wrapper-ev', '')) || 0;
    if (!id) return;

    const mostrar = isM ? [1,3,4,5,6].includes(id) : [2,4,5,7].includes(id);
    wrapper.style.display = mostrar ? 'block' : 'none';
  });

  document.getElementById('eventos-bloqueio').style.display = 'none';
  document.getElementById('eventos-conteudo').style.display = 'block';
}

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

async function enviarInscricao() {
  const erro = document.getElementById('erro');
  erro.style.display = 'none';

  if (selecionados.size === 0) {
    erro.textContent = "Selecione pelo menos um evento.";
    erro.style.display = "block";
    return;
  }

  alert("Inscrição enviada com sucesso!\n\nFicha gerada: FI-1234\n\n(Em breve conectaremos ao banco)");
}

document.addEventListener('DOMContentLoaded', () => {
  // Inicia com bloqueio
  document.getElementById('eventos-conteudo').style.display = 'none';
  console.log('%c✅ Sistema carregado', 'color:#1a56a0');
});
