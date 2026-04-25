// ================================================================
// app.js — Lógica principal do formulário de inscrições
// Festival de Inverno 2026 — Costa Marques/RO
// © 2026 Ewerson Luiz de Oliveira
// ================================================================

// ── Estado da aplicação ────────────────────────────────────────
const selecionados    = new Set();
const selecionadosAdd = new Set();
let itemAtivo         = -1;
let sexoSelecionado   = '';
let participanteConsulta = null;
let inscricoesConsulta   = [];
let statusPorModalidade  = {};   // mapa modalidade_id → confirmado | lista_espera

// ══════════════════════════════════════════════════════════════
// ABAS (Nova inscrição / Já inscrito?)
// ══════════════════════════════════════════════════════════════
function mudarTab(t) {
  document.getElementById('aba-inscricao').style.display = t === 'inscricao' ? '' : 'none';
  document.getElementById('aba-consulta').style.display  = t === 'consulta'  ? '' : 'none';
  document.getElementById('tab-inscricao').classList.toggle('ativo', t === 'inscricao');
  document.getElementById('tab-consulta').classList.toggle('ativo',  t === 'consulta');
}

// ══════════════════════════════════════════════════════════════
// TERMO / AUTORIZAÇÃO DE IMAGEM
// ══════════════════════════════════════════════════════════════
function toggleTermo() {
  const t = document.getElementById('termo-completo');
  const b = document.getElementById('btn-termo');
  t.classList.toggle('visivel');
  b.textContent = t.classList.contains('visivel') ? '▲ Ocultar' : '▼ Ver texto completo';
}

// Chamado quando o usuário clica no LABEL/DIV externo (não no checkbox)
function toggleAutorizacao() {
  const c = document.getElementById('cb-autorizo');
  c.checked = !c.checked;
  document.getElementById('label-autorizo').classList.toggle('marcado', c.checked);
  verificarMenor();
}

// Chamado quando o usuário clica DIRETAMENTE no checkbox
// O navegador já fez o toggle — só sincronizamos o visual
function sincronizarAutorizacao() {
  const c = document.getElementById('cb-autorizo');
  document.getElementById('label-autorizo').classList.toggle('marcado', c.checked);
  verificarMenor();
}

function toggleResponsavel() {
  const c = document.getElementById('cb-responsavel');
  c.checked = !c.checked;
}

function verificarMenor() {
  const nasc  = document.getElementById('nascimento').value;
  const aut   = document.getElementById('cb-autorizo').checked;
  const aviso = document.getElementById('menor-aviso');
  if (!nasc || !aut) { aviso.classList.remove('visivel'); return; }
  const hoje  = new Date();
  const d     = new Date(nasc + 'T00:00');
  const idade = hoje.getFullYear() - d.getFullYear() -
    (hoje < new Date(hoje.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
  aviso.classList.toggle('visivel', idade < 18);
}

// ══════════════════════════════════════════════════════════════
// REGULAMENTO
// ══════════════════════════════════════════════════════════════
function toggleRegulamento() {
  document.getElementById('reg-conteudo').classList.toggle('aberto');
  document.getElementById('reg-seta').classList.toggle('aberto');
}

function verificarAceite() {
  document.getElementById('btn-enviar').disabled =
    !document.getElementById('aceite-regulamento').checked;
}

// ══════════════════════════════════════════════════════════════
// SELEÇÃO DE SEXO
// ══════════════════════════════════════════════════════════════
function selecionarSexo(s) {
  sexoSelecionado = s;
  document.getElementById('sexo').value = s;
  document.getElementById('sexo-btn-m').className = 'sexo-btn' + (s === 'M' ? ' ativo-m' : '');
  document.getElementById('sexo-btn-f').className = 'sexo-btn' + (s === 'F' ? ' ativo-f' : '');
  document.getElementById('eventos-bloqueio').classList.remove('visivel');
  document.getElementById('eventos-conteudo').classList.add('visivel');

  const visivel = s === 'M' ? VISIVEL_M : VISIVEL_F;

  // Remover seleções de eventos que ficaram invisíveis
  for (const id of [...selecionados]) {
    if (!visivel.has(id)) {
      selecionados.delete(id);
      const card = document.getElementById('ev' + id);
      if (card) card.classList.remove('selecionado', 'feminino-selecionado');
      const box = document.getElementById('parceiro-' + id);
      if (box) box.classList.remove('visivel');
    }
  }

  // Mostrar/ocultar wrappers de evento conforme o sexo
  for (let i = 1; i <= 7; i++) {
    const w = document.getElementById('wrapper-ev' + i);
    if (w) w.classList.toggle('oculto', !visivel.has(i));
  }

  // Avisos femininos (aquáticos)
  const ac = document.getElementById('aviso-canoagem');
  const ak = document.getElementById('aviso-caiaque');
  if (s === 'F') { ac?.classList.add('visivel'); ak?.classList.add('visivel'); }
  else           { ac?.classList.remove('visivel'); ak?.classList.remove('visivel'); }

  atualizarParceiroCanoagem(s);
  document.getElementById('cat-areia').style.display = '';
}

function atualizarParceiroCanoagem(s) {
  const titulo    = document.getElementById('parceiro-4-titulo');
  const restricao = document.getElementById('parceiro-4-restricao');
  const box       = document.getElementById('parceiro-4');
  const nomeCampo = document.getElementById('p4-nome');
  if (s === 'F') {
    if (titulo)    titulo.firstChild.textContent = 'Dados da parceira ';
    if (restricao) { restricao.textContent = '♀ feminino'; restricao.className = 'parceiro-restricao restricao-f'; }
    if (box)       box.classList.add('feminino');
    if (nomeCampo) nomeCampo.placeholder = 'Nome da parceira';
  } else {
    if (titulo)    titulo.firstChild.textContent = 'Dados do parceiro ';
    if (restricao) { restricao.textContent = '♂ masculino'; restricao.className = 'parceiro-restricao restricao-m'; }
    if (box)       box.classList.remove('feminino');
    if (nomeCampo) nomeCampo.placeholder = 'Nome do parceiro';
  }
}

// ══════════════════════════════════════════════════════════════
// SELEÇÃO DE EVENTOS
// ══════════════════════════════════════════════════════════════
function toggleEvento(id) {
  const card = document.getElementById('ev' + id);
  const box  = document.getElementById('parceiro-' + id);
  const isFem = (sexoSelecionado === 'F');

  if (selecionados.has(id)) {
    selecionados.delete(id);
    card.classList.remove('selecionado', 'feminino-selecionado');
    if (box) box.classList.remove('visivel');
  } else {
    selecionados.add(id);
    card.classList.add(isFem ? 'feminino-selecionado' : 'selecionado');
    if (box && (DUPLAS.has(id) || EQUIPES_IDS.has(id))) box.classList.add('visivel');
  }
}

// ══════════════════════════════════════════════════════════════
// AUTOCOMPLETE DE CIDADES
// ══════════════════════════════════════════════════════════════
function filtrarCidades() {
  const input = document.getElementById('cidade');
  const lista = document.getElementById('cidade-lista');
  const termo = input.value.trim();
  itemAtivo = -1;

  if (!termo.length) { lista.classList.remove('aberta'); lista.innerHTML = ''; return; }

  const norm   = normalizar(termo);
  const filtro = MUNICIPIOS_RO.filter(c => normalizar(c).includes(norm));

  if (!filtro.length) { lista.classList.remove('aberta'); lista.innerHTML = ''; return; }

  lista.innerHTML = filtro.map(c => {
    const cn = normalizar(c);
    const p  = cn.indexOf(norm);
    const a  = c.slice(0, p);
    const d  = c.slice(p, p + termo.length);
    const dp = c.slice(p + termo.length);
    const e  = c.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `<div class="cidade-item" data-valor="${c}" onmousedown="event.preventDefault();selecionarCidade('${e}')">${a}<strong>${d}</strong>${dp}</div>`;
  }).join('');

  lista.classList.add('aberta');
}

function selecionarCidade(c) {
  document.getElementById('cidade').value       = c;
  document.getElementById('cidade-valor').value = c;
  document.getElementById('cidade-lista').classList.remove('aberta');
  document.getElementById('cidade-lista').innerHTML = '';
}

// Validar cidade ao sair do campo — impede digitar manualmente fora da lista
function validarCidadeBlur() {
  const input  = document.getElementById('cidade');
  const hidden = document.getElementById('cidade-valor');
  const typed  = input.value.trim();
  if (!typed) { hidden.value = ''; return; }

  // Busca exata normalizada na lista oficial
  const norm   = normalizar(typed);
  const achada = MUNICIPIOS_RO.find(c => normalizar(c) === norm);

  if (achada) {
    // Corrige capitalização para o padrão oficial da lista
    input.value  = achada;
    hidden.value = achada;
  } else {
    // Não está na lista — limpa e avisa
    input.value  = '';
    hidden.value = '';
    input.placeholder = '⚠️ Cidade não encontrada — selecione da lista';
    setTimeout(() => { input.placeholder = 'Digite o nome da cidade...'; }, 3000);
  }
}

function navegarCidades(e) {
  const lista = document.getElementById('cidade-lista');
  const itens = lista.querySelectorAll('.cidade-item');
  if (!lista.classList.contains('aberta') || !itens.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (itemAtivo >= 0) itens[itemAtivo].classList.remove('ativo');
    itemAtivo = Math.min(itemAtivo + 1, itens.length - 1);
    itens[itemAtivo].classList.add('ativo');
    itens[itemAtivo].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (itemAtivo >= 0) itens[itemAtivo].classList.remove('ativo');
    itemAtivo = Math.max(itemAtivo - 1, 0);
    itens[itemAtivo].classList.add('ativo');
    itens[itemAtivo].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter' && itemAtivo >= 0) {
    e.preventDefault();
    selecionarCidade(itens[itemAtivo].dataset.valor);
  } else if (e.key === 'Escape') {
    lista.classList.remove('aberta');
  }
}

// Fechar lista ao clicar fora
document.addEventListener('click', function(e) {
  if (!e.target.closest('#cidade-wrap'))
    document.getElementById('cidade-lista').classList.remove('aberta');
});

// ══════════════════════════════════════════════════════════════
// AUTORIZAÇÃO DE IMAGEM POR MEMBRO (Pesca)
// ══════════════════════════════════════════════════════════════
function _setupAutorizacaoMembros() {
  ['6', '7'].forEach(box => {
    ['m2', 'm3', 'm4'].forEach(m => {
      const nomeEl = document.getElementById(`p${box}-${m}-nome`);
      const cbDiv  = document.getElementById(`autorizacao-membro-${box}-${m}`);
      if (!nomeEl || !cbDiv) return;
      nomeEl.addEventListener('input', () => {
        cbDiv.classList.toggle('visivel', nomeEl.value.trim().length > 0);
        if (!nomeEl.value.trim()) {
          const cb = document.getElementById(`cb-autorizacao-p${box}-${m}`);
          if (cb) cb.checked = false;
        }
      });
    });
  });
}

// ══════════════════════════════════════════════════════════════
// ENVIAR INSCRIÇÃO
// ══════════════════════════════════════════════════════════════
async function enviarInscricao() {
  const nome   = document.getElementById('nome').value.trim();
  const cpf    = document.getElementById('cpf').value.trim();
  const sexo   = document.getElementById('sexo').value;
  const tel    = document.getElementById('telefone').value.trim();
  // Sempre usar o valor validado (hidden) — nunca texto digitado livremente
  const cidade = document.getElementById('cidade-valor').value.trim();
  const email  = document.getElementById('email').value.trim();
  const nasc   = document.getElementById('nascimento').value;
  const erro   = document.getElementById('erro');
  const erroDup = document.getElementById('erro-ja-inscrito');
  const btn    = document.getElementById('btn-enviar');

  erro.style.display = 'none';
  erroDup.style.display = 'none';

  // Validações
  if (!nome || !cpf || !tel || !cidade) {
    erro.textContent = 'Preencha todos os campos obrigatórios do Participante 1.';
    erro.style.display = 'block';
    window.scrollTo({ top: erro.offsetTop - 80, behavior: 'smooth' });
    return;
  }
  // Validar CPF do participante principal
  if (!validarCPF(cpf)) {
    erro.textContent = 'CPF inválido. Verifique os números digitados e tente novamente.';
    erro.style.display = 'block';
    const cpfEl = document.getElementById('cpf');
    marcarCPFerro(cpfEl);
    cpfEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (!sexo) {
    erro.textContent = 'Selecione seu sexo para ver as modalidades disponíveis.';
    erro.style.display = 'block';
    document.getElementById('sexo-btn-m').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (selecionados.size === 0) {
    erro.textContent = 'Selecione pelo menos um evento para se inscrever.';
    erro.style.display = 'block';
    return;
  }
  if (!document.getElementById('cb-autorizo').checked) {
    erro.textContent = 'É necessário autorizar o uso de imagem para participar.';
    erro.style.display = 'block';
    document.getElementById('label-autorizo').classList.add('autorizacao-nao-aceita');
    document.getElementById('label-autorizo').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  document.getElementById('label-autorizo').classList.remove('autorizacao-nao-aceita');

  if (!document.getElementById('aceite-regulamento').checked) {
    erro.textContent = 'Você precisa aceitar o Regulamento para concluir a inscrição.';
    erro.style.display = 'block';
    document.getElementById('aceite-regulamento').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Verificar menor de idade
  let nResp = null;
  if (eMenor()) {
    const cr = document.getElementById('cb-responsavel').checked;
    const nr = document.getElementById('nome-responsavel').value.trim();
    if (!cr || !nr) {
      erro.textContent = 'Participantes menores de idade precisam de autorização do responsável legal com nome completo.';
      erro.style.display = 'block';
      document.getElementById('nome-responsavel').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    nResp = nr;
  }

  // Validar dados de parceiro (duplas)
  for (const id of selecionados) {
    if (DUPLAS.has(id)) {
      const pN = document.getElementById('p' + id + '-nome')?.value.trim();
      const pC = document.getElementById('p' + id + '-cpf')?.value.trim();
      const pT = document.getElementById('p' + id + '-tel')?.value.trim();
      const label = sexo === 'F' ? 'parceira' : 'parceiro';
      if (!pN || !pC || !pT) {
        erro.textContent = `Preencha os dados do(a) ${label} para ${NOMES_MOD[id]}.`;
        erro.style.display = 'block';
        document.getElementById('p' + id + '-nome').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (!validarCPF(pC)) {
        erro.textContent = `CPF do(a) ${label} em ${NOMES_MOD[id]} é inválido.`;
        erro.style.display = 'block';
        const pCEl = document.getElementById('p' + id + '-cpf');
        marcarCPFerro(pCEl);
        pCEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
  }

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  // Garantir statusPorModalidade preenchido (fallback caso carregarVagas não tenha rodado)
  if (!statusPorModalidade || Object.keys(statusPorModalidade).length === 0) {
    statusPorModalidade = {};
    for (const id of selecionados) statusPorModalidade[id] = 'confirmado';
  }

  // Verificar vagas disponíveis
  for (const id of selecionados) {
    const check = await get('inscricoes', `modalidade_id=eq.${id}&select=id`);
    if (getMaxVagas(id) > 0 && Array.isArray(check) && check.length >= getMaxVagas(id)) {
      erro.textContent = `As vagas para ${NOMES_MOD[id]} estão esgotadas. Escolha outra modalidade.`;
      // Marcar o card visualmente
      carregarVagas();
      erro.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Enviar inscrição';
      return;
    }
  }

  // Salvar participante
  const ficha = gerarFicha();

  // Normaliza o telefone antes de salvar (garante formato padrão)
  const telNormalizado = normalizarTelefone(tel);

  const resPart = await post('participantes', {
    nome_completo:      nome,
    cpf,
    sexo,
    email:              email || null,
    telefone:           telNormalizado || tel,
    data_nascimento:    nasc || null,
    cidade,
    uf:                 'RO',
    autorizacao_imagem: true,
    nome_responsavel:   nResp || null,
  });

  if (!resPart || resPart.length === 0 || resPart.code) {
    const dup = resPart?.message?.includes('unique') || resPart?.code === '23505';
    if (dup) {
      erroDup.style.display = 'block';
      erroDup.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      erro.textContent = 'Erro ao enviar. Tente novamente.';
      erro.style.display = 'block';
    }
    btn.disabled = false;
    btn.textContent = 'Enviar inscrição';
    return;
  }

  const pid = resPart[0].id;

  // Salvar inscrições (uma por modalidade)
  for (const id of selecionados) {
    const insc = {
      participante_id: pid,
      modalidade_id:   id,
      numero_ficha:    ficha,
      status:          statusPorModalidade[id] || 'confirmado',
    };

    // Duplas: parceiro obrigatório
    if (DUPLAS.has(id)) {
      insc.parceiro_nome     = document.getElementById('p' + id + '-nome').value.trim();
      insc.parceiro_cpf      = document.getElementById('p' + id + '-cpf').value.trim();
      insc.parceiro_telefone = document.getElementById('p' + id + '-tel').value.trim();
      // Canoagem tem campo nome da dupla (p4-equipe)
      const equipeEl = document.getElementById('p' + id + '-equipe');
      if (equipeEl) insc.nome_equipe = equipeEl.value.trim();
    }

    // Equipes (Pesca): até 3 membros adicionais
    if (EQUIPES_IDS.has(id)) {
      // Nome da equipe
      const nomeEquipe = document.getElementById('p' + id + '-equipe')?.value.trim();
      if (!nomeEquipe) {
        erro.textContent = `Informe o nome da equipe para ${NOMES_MOD[id]}.`;
        erro.style.display = 'block';
        document.getElementById('p' + id + '-equipe').scrollIntoView({ behavior: 'smooth', block: 'center' });
        btn.disabled = false;
        btn.textContent = 'Enviar inscrição';
        return;
      }
      insc.nome_equipe = nomeEquipe;
      // Membro 2 (Piloto) é OBRIGATÓRIO para pesca embarcada
      const pilotoNome = document.getElementById(`p${id}-m2-nome`)?.value.trim();
      const pilotoCpf  = document.getElementById(`p${id}-m2-cpf`)?.value.trim();
      if (!pilotoNome) {
        erro.textContent = `Pesca embarcada exige ao menos 2 pessoas. Informe o nome do Piloto (Membro 2).`;
        erro.style.display = 'block';
        document.getElementById(`p${id}-m2-nome`).scrollIntoView({ behavior: 'smooth', block: 'center' });
        btn.disabled = false;
        btn.textContent = 'Enviar inscrição';
        return;
      }
      if (pilotoCpf && !validarCPF(pilotoCpf)) {
        erro.textContent = `CPF do Piloto (Membro 2) da Pesca é inválido.`;
        erro.style.display = 'block';
        const pilotoEl = document.getElementById(`p${id}-m2-cpf`);
        marcarCPFerro(pilotoEl);
        pilotoEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        btn.disabled = false;
        btn.textContent = 'Enviar inscrição';
        return;
      }

      // Validar CPFs dos membros opcionais
      for (const m of ['m3', 'm4']) {
        const mNome = document.getElementById(`p${id}-${m}-nome`)?.value.trim();
        const mCpf  = document.getElementById(`p${id}-${m}-cpf`)?.value.trim();
        if (mNome && mCpf && !validarCPF(mCpf)) {
          erro.textContent = `CPF do Membro ${m.slice(1)} da Pesca é inválido.`;
          erro.style.display = 'block';
          const mEl = document.getElementById(`p${id}-${m}-cpf`);
          marcarCPFerro(mEl);
          mEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          btn.disabled = false;
          btn.textContent = 'Enviar inscrição';
          return;
        }
      }
      const m2nome = document.getElementById('p' + id + '-m2-nome')?.value.trim();
      if (m2nome) {
        insc.parceiro_nome     = m2nome;
        insc.parceiro_cpf      = document.getElementById('p' + id + '-m2-cpf')?.value.trim() || null;
        insc.parceiro_telefone = document.getElementById('p' + id + '-m2-tel')?.value.trim() || null;
      }
      const m3nome = document.getElementById('p' + id + '-m3-nome')?.value.trim();
      if (m3nome) {
        insc.membro3_nome     = m3nome;
        insc.membro3_cpf      = document.getElementById('p' + id + '-m3-cpf')?.value.trim() || null;
        insc.membro3_telefone = document.getElementById('p' + id + '-m3-tel')?.value.trim() || null;
      }
      const m4nome = document.getElementById('p' + id + '-m4-nome')?.value.trim();
      if (m4nome) {
        insc.membro4_nome     = m4nome;
        insc.membro4_cpf      = document.getElementById('p' + id + '-m4-cpf')?.value.trim() || null;
        insc.membro4_telefone = document.getElementById('p' + id + '-m4-tel')?.value.trim() || null;
      }
      // Autorizações individuais dos membros
      insc.autorizacao_imagem_membro2 = document.getElementById(`cb-autorizacao-p${id}-m2`)?.checked || false;
      insc.autorizacao_imagem_membro3 = document.getElementById(`cb-autorizacao-p${id}-m3`)?.checked || false;
      insc.autorizacao_imagem_membro4 = document.getElementById(`cb-autorizacao-p${id}-m4`)?.checked || false;
    }

    // Normaliza telefones de parceiros/membros antes de salvar
    if (insc.parceiro_telefone) insc.parceiro_telefone = normalizarTelefone(insc.parceiro_telefone) || insc.parceiro_telefone;
    if (insc.membro3_telefone)  insc.membro3_telefone  = normalizarTelefone(insc.membro3_telefone)  || insc.membro3_telefone;
    if (insc.membro4_telefone)  insc.membro4_telefone  = normalizarTelefone(insc.membro4_telefone)  || insc.membro4_telefone;

    let resInsc;
    try { resInsc = await post('inscricoes', insc); } catch(e) { resInsc = { erro: e.message }; }

    // ── ROLLBACK: só falha se vier erro EXPLÍCITO do Supabase ──
    // Supabase pode retornar [] (array vazio) em sucesso com Prefer:return=minimal — isso NÃO é erro
    const inscFalhou = !resInsc || (!Array.isArray(resInsc) && (resInsc.code || resInsc.erro || resInsc.error));
    if (inscFalhou) {
      try { await deletarPorCampo('inscricoes', 'participante_id', pid); } catch(_) {}
      try { await deletar('participantes', pid); } catch(_) {}
      erro.textContent = 'Erro ao salvar inscrição (' + (resInsc?.message || resInsc?.erro || 'desconhecido') + '). Tente novamente.';
      erro.style.display = 'block';
      window.scrollTo({ top: erro.offsetTop - 80, behavior: 'smooth' });
      btn.disabled = false;
      btn.textContent = 'Enviar inscrição';
      return;
    }
  }

  // Verificar se alguma modalidade ficou na lista de espera
  const algumEspera     = Object.values(statusPorModalidade).some(s => s === 'lista_espera');
  const todosEspera     = Object.values(statusPorModalidade).every(s => s === 'lista_espera');
  const modsEspera      = Array.from(selecionados).filter(id => statusPorModalidade[id] === 'lista_espera').map(id => NOMES_MOD[id]);
  const modsConfirmados = Array.from(selecionados).filter(id => statusPorModalidade[id] === 'confirmado').map(id => NOMES_MOD[id]);

  document.getElementById('formulario').style.display = 'none';

  if (todosEspera) {
    // Todas na lista de espera
    const posicao = await calcularPosicaoEspera(Array.from(selecionados)[0], pid);
    document.getElementById('sucesso-espera').style.display = 'block';
    document.getElementById('numero-ficha-espera').textContent = ficha;
    document.getElementById('espera-modalidade').textContent = modsEspera.join(', ');
    document.getElementById('espera-posicao').textContent = posicao + 'º';
    document.getElementById('espera-posicao-texto').textContent =
      `Você é o ${posicao}º na fila de espera. A SEMESP entrará em contato se uma vaga for liberada.`;
    const msgE = encodeURIComponent(`⏳ Estou na lista de espera do *Festival de Inverno 2026* de Costa Marques/RO!\n📋 Ficha: *${ficha}*\n📲 Inscreva-se: https://festival-inverno.vercel.app`);
    document.getElementById('share-link-espera').href = 'https://wa.me/?text=' + msgE;
    // Gerar QR Code na ficha de espera
    const nomeParticE = document.getElementById('nome').value.trim();
    const modsE = modsEspera.join(', ');
    setTimeout(() => gerarQRCodeSucesso(ficha, nomeParticE, modsE, true), 100);
  } else {
    // Pelo menos uma confirmada (mostra tela normal, com aviso se houver espera)
    document.getElementById('sucesso').style.display = 'block';
    document.getElementById('numero-ficha').textContent = ficha;
    if (algumEspera) {
      // Adiciona aviso de que parte foi para espera
      const avisoDiv = document.getElementById('aviso-espera-parcial') || (() => {
        const d = document.createElement('div');
        d.id = 'aviso-espera-parcial';
        d.style.cssText = 'margin-top:12px;background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:12px;font-size:13px;color:#78350f;text-align:left;';
        document.getElementById('sucesso').appendChild(d);
        return d;
      })();
      avisoDiv.innerHTML = `<strong>⚠️ Atenção:</strong> Para <strong>${modsEspera.join(', ')}</strong> você entrou na lista de espera (vagas esgotadas). Para <strong>${modsConfirmados.join(', ')}</strong> sua inscrição está confirmada!`;
    }
    const mods = Array.from(selecionados).map(id => NOMES_MOD[id]).join(', ');
    const msg  = encodeURIComponent(
      `🏆 Estou inscrito no *Festival de Inverno 2026* de Costa Marques/RO (01, 02 e 03 de Maio de 2026).\n` +
      `📋 Minha ficha é *${ficha}* — Modalidades: ${mods}.\n\n` +
      `📲 Inscreva-se também:\nhttps://festival-inverno.vercel.app`
    );
    document.getElementById('share-link').href = 'https://wa.me/?text=' + msg;
    // Gerar QR Code na tela de sucesso
    const nomePartic = document.getElementById('nome').value.trim();
    setTimeout(() => gerarQRCodeSucesso(ficha, nomePartic, mods, false), 100);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ══════════════════════════════════════════════════════════════
// CONSULTA / ADICIONAR MODALIDADE
// ══════════════════════════════════════════════════════════════
function irParaConsultaComCPF() {
  const cpf = document.getElementById('cpf').value.trim();
  mudarTab('consulta');
  if (cpf) {
    document.getElementById('consulta-input').value = cpf;
    buscarInscricao();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limparResultadoConsulta() {
  document.getElementById('consulta-resultado').style.display = 'none';
  document.getElementById('consulta-erro').style.display      = 'none';
  participanteConsulta = null;
  inscricoesConsulta   = [];
}

async function buscarInscricao() {
  const inp  = document.getElementById('consulta-input').value.trim();
  const erro = document.getElementById('consulta-erro');
  const btn  = document.getElementById('btn-buscar');
  erro.style.display = 'none';
  document.getElementById('consulta-resultado').style.display = 'none';
  document.getElementById('sucesso-adicao').style.display     = 'none';

  if (!inp) {
    erro.textContent = 'Informe o CPF ou o número da ficha (ex: FI-1234).';
    erro.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Buscando...';

  let enc = null;
  const dig = inp.replace(/\D/g, '');

  // Buscar por CPF
  if (dig.length === 11) {
    const fmt = dig.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    let r = await get('participantes', 'cpf=eq.' + encodeURIComponent(fmt) + '&select=*');
    if (Array.isArray(r) && r.length > 0) enc = r[0];
    else {
      r = await get('participantes', 'cpf=eq.' + encodeURIComponent(dig) + '&select=*');
      if (Array.isArray(r) && r.length > 0) enc = r[0];
    }
  }

  // Buscar por número de ficha
  if (!enc) {
    const fi = inp.toUpperCase().replace(/\s/g, '').replace(/^FI\-?(\d+)$/, 'FI-$1');
    if (/^FI-\d+$/.test(fi)) {
      const insc = await get('inscricoes', 'numero_ficha=eq.' + encodeURIComponent(fi) + '&select=participante_id&limit=1');
      if (Array.isArray(insc) && insc.length > 0) {
        const p = await get('participantes', 'id=eq.' + insc[0].participante_id + '&select=*');
        if (Array.isArray(p) && p.length > 0) enc = p[0];
      }
    }
  }

  btn.disabled = false;
  btn.textContent = 'Buscar';

  if (!enc) {
    erro.textContent = 'Nenhuma inscrição encontrada com este CPF ou ficha. Tente novamente.';
    erro.style.display = 'block';
    return;
  }

  const insc = await get('inscricoes', 'participante_id=eq.' + enc.id + '&select=*');
  participanteConsulta = enc;
  inscricoesConsulta   = Array.isArray(insc) ? insc : [];
  try {
    renderizarConsulta();
  } catch (e) {
    erro.textContent = 'Erro ao exibir resultado. Detalhe: ' + e.message;
    erro.style.display = 'block';
    console.error('renderizarConsulta error:', e);
  }
}

// ================================================================
// EDIÇÃO DE DADOS PESSOAIS DO PARTICIPANTE
// ================================================================
function toggleEditarDadosPessoais() {
  const form = document.getElementById('form-dados-pessoais');
  const btn  = document.getElementById('btn-editar-dados');
  if (!form) return;
  const aberto = form.style.display !== 'none';
  form.style.display = aberto ? 'none' : 'block';
  btn.textContent    = aberto ? '✏️ Editar meus dados' : '✖ Fechar';
}

async function salvarDadosPessoais(participanteId) {
  const nome   = document.getElementById('edit-nome')?.value.trim();
  const tel    = document.getElementById('edit-tel')?.value.trim();
  const cidade = document.getElementById('edit-cidade')?.value.trim();
  const email  = document.getElementById('edit-email')?.value.trim();

  if (!nome) {
    alert('O nome completo é obrigatório.');
    return;
  }

  const dados = {
    nome_completo: nome,
    telefone:      tel    || null,
    cidade:        cidade || null,
    email:         email  || null,
  };

  try {
    const r = await fetch('/api/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'atualizar', tabela: 'participantes', id: participanteId, dados })
    });
    const d = await r.json();
    if (Array.isArray(d) && d.length > 0) {
      alert('✅ Dados atualizados com sucesso!');
      // Atualiza estado local e recarrega a consulta
      participanteConsulta = { ...participanteConsulta, ...dados };
      buscarInscricao();
    } else {
      alert('Erro ao salvar. Verifique sua conexão e tente novamente.');
    }
  } catch (e) {
    alert('Erro de conexão: ' + e.message);
  }
}

function renderizarConsulta() {
  const p   = participanteConsulta;
  const ins = inscricoesConsulta;
  const fi  = ins[0]?.numero_ficha || '—';
  const sx  = p.sexo || 'M';

  // Remove edição anterior de dados pessoais se existir
  const editPessoalAnterior = document.getElementById('edit-dados-pessoais');
  if (editPessoalAnterior) editPessoalAnterior.remove();

  // Monta o perfil usando DOM (evita problemas de HTML malformado em innerHTML)
  const perfilEl = document.getElementById('consulta-perfil');
  perfilEl.innerHTML =
    `<div class="consulta-perfil-nome">${p.nome_completo}</div>` +
    `<div class="consulta-perfil-sub">CPF: ${p.cpf || '—'} · ${p.cidade || '—'}/${p.uf || 'RO'}</div>` +
    `<div class="consulta-ficha-num">Ficha: ${fi}</div>`;

  // Botão editar dados pessoais
  const btnEditar = document.createElement('button');
  btnEditar.id        = 'btn-editar-dados';
  btnEditar.textContent = '✏️ Editar meus dados';
  btnEditar.style.cssText = 'margin-top:10px;padding:6px 14px;background:#eff6ff;color:#1a56a0;border:1px solid #bfdbfe;border-radius:8px;font-size:12px;cursor:pointer;font-weight:600;display:block;';
  btnEditar.onclick = toggleEditarDadosPessoais;
  perfilEl.appendChild(btnEditar);

  // Formulário de edição (oculto)
  const formEl = document.createElement('div');
  formEl.id            = 'form-dados-pessoais';
  formEl.style.display = 'none';
  formEl.style.marginTop = '12px';
  formEl.innerHTML = `
    <div style="font-size:11px;color:#64748b;margin-bottom:4px;">Nome completo</div>
    <input type="text" id="edit-nome" value="${(p.nome_completo||'').replace(/"/g,'&quot;')}"
      style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:8px;">
    <div style="font-size:11px;color:#64748b;margin-bottom:4px;">Telefone</div>
    <input type="tel" id="edit-tel" value="${(p.telefone||'').replace(/"/g,'&quot;')}"
      style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:8px;">
    <div style="font-size:11px;color:#64748b;margin-bottom:4px;">Cidade</div>
    <input type="text" id="edit-cidade" value="${(p.cidade||'').replace(/"/g,'&quot;')}"
      style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:8px;">
    <div style="font-size:11px;color:#64748b;margin-bottom:4px;">E-mail</div>
    <input type="email" id="edit-email" value="${(p.email||'').replace(/"/g,'&quot;')}"
      style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:12px;">`;

  // Botão salvar
  const btnSalvar = document.createElement('button');
  btnSalvar.textContent = '💾 Salvar dados';
  btnSalvar.style.cssText = 'width:100%;padding:10px;background:#1a56a0;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:6px;';
  btnSalvar.onclick = () => salvarDadosPessoais(p.id);
  formEl.appendChild(btnSalvar);

  // Botão cancelar
  const btnCancelar = document.createElement('button');
  btnCancelar.textContent = 'Cancelar';
  btnCancelar.style.cssText = 'width:100%;padding:8px;background:#f1f5f9;color:#64748b;border:none;border-radius:8px;font-size:13px;cursor:pointer;';
  btnCancelar.onclick = toggleEditarDadosPessoais;
  formEl.appendChild(btnCancelar);

  perfilEl.appendChild(formEl);

  const ids = new Set(ins.map(i => i.modalidade_id));
  const me  = document.getElementById('consulta-mod-atual');
  me.innerHTML = ids.size === 0
    ? '<span style="font-size:13px;color:#94a3b8;">Nenhuma modalidade.</span>'
    : [...ids].map(id => {
        const m  = MODALIDADES[id];
        if (!m) return '';
        const i  = ins.find(x => x.modalidade_id == id);
        const pa = i?.parceiro_nome ? ' + ' + i.parceiro_nome : '';
        return `<span class="tag-modal"><span class="tag-modal-check">✓</span>${m.nome} ${m.sub}${pa}</span>`;
      }).join('');

  const aa = document.getElementById('consulta-adicionar-area');
  aa.innerHTML = '';

  if (!inscricaoAberta()) {
    aa.innerHTML = `<div class="consulta-encerrada">⏰ Prazo encerrado em ${DATA_LIMITE_INSCRICAO.toLocaleDateString('pt-BR')}.</div>`;
    document.getElementById('consulta-resultado').style.display = 'block';
    return;
  }

  const disp = sx === 'F' ? [2,4,5,7] : [1,3,4,5,6];
  const nov  = disp.filter(id => !ids.has(id));

  if (!nov.length) {
    aa.innerHTML = '<div class="consulta-sem-novas">🏆 Inscrito em todas as modalidades disponíveis para seu sexo!</div>';
    document.getElementById('consulta-resultado').style.display = 'block';
    return;
  }

  const iF = (sx === 'F');
  const cards = nov.map(id => {
    const m  = MODALIDADES[id];
    const tc = id <= 3 ? 'tipo-areia' : m.dupla ? 'tipo-agua' : 'tipo-individual';
    const tt = id <= 3 ? 'Esporte de Areia' : m.dupla ? 'Esporte Aquático' : 'Individual';
    let ph = '';
    if (m.dupla) {
      const lb = iF ? 'parceira' : 'parceiro';
      const rs = iF
        ? '<span class="parceiro-restricao restricao-f">♀ feminino</span>'
        : '<span class="parceiro-restricao restricao-m">♂ masculino</span>';
      const campoEquipe = (id === 4)
        ? `<label class="campo">Nome da dupla / equipe <span class="obrigatorio">*</span></label>
           <input type="text" id="add-p${id}-equipe" placeholder="Ex: Dupla do Guaporé" maxlength="60">`
        : '';
      ph = `<div class="parceiro-box ${iF ? 'feminino' : ''}" id="add-parceiro-${id}" style="display:none;">
        <div class="parceiro-titulo">Dados do(a) ${lb} ${rs}</div>
        ${campoEquipe}
        <label class="campo">Nome <span class="obrigatorio">*</span></label>
        <input type="text" id="add-p${id}-nome" placeholder="Nome do(a) ${lb}">
        <label class="campo">CPF <span class="obrigatorio">*</span></label>
        <input type="text" id="add-p${id}-cpf" placeholder="000.000.000-00" maxlength="14" oninput="mascararCPF(this)">
        <label class="campo">Telefone <span class="obrigatorio">*</span></label>
        <input type="tel" id="add-p${id}-tel" placeholder="(69) 9 0000-0000">
      </div>`;
    }
    return `<div style="margin-bottom:8px;">
      <div class="evento-card" id="add-ev-${id}" onclick="toggleEventoAdd(${id},${iF})">
        <div class="evento-header">
          <div><div class="evento-nome">${m.nome}</div><div class="evento-sub">${m.sub}</div></div>
          <div class="check"></div>
        </div>
        <span class="evento-tipo ${tc}">${tt}</span>
      </div>${ph}
    </div>`;
  }).join('');

  aa.innerHTML =
    '<hr style="border:none;border-top:1px solid #e2e8f0;margin:14px 0;">' +
    '<div class="consulta-secao-titulo" style="margin-top:14px;">Adicionar nova modalidade</div>' +
    cards +
    '<div class="msg-erro" id="add-erro" style="display:none;"></div>' +
    '<button class="btn" style="margin-top:12px;" onclick="submeterAdicao()">➕ Adicionar</button>';

  // ── Seção de edição de parceiros/membros existentes ──
  const modsComParceiro = ins.filter(i => {
    const m = MODALIDADES[i.modalidade_id];
    return m && (m.dupla || EQUIPES_IDS.has(i.modalidade_id));
  });

  if (modsComParceiro.length > 0) {
    const editSection = document.createElement('div');
    editSection.style.cssText = 'margin-top:16px;padding-top:14px;border-top:1px dashed #e2e8f0;';
    editSection.innerHTML = '<div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:10px;">✏️ Editar parceiro / equipe</div>';

    modsComParceiro.forEach(i => {
      const m = MODALIDADES[i.modalidade_id];
      const isPesca = EQUIPES_IDS.has(i.modalidade_id);
      const label = isPesca ? `🎣 ${m.nome} ${m.sub}` : `🤝 ${m.nome} ${m.sub}`;
      const temDados = i.parceiro_nome || i.equipe_nome || i.nome_equipe;

      const bloco = document.createElement('div');
      bloco.style.cssText = 'background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:8px;';
      bloco.innerHTML = `
        <div style="font-size:12px;font-weight:700;color:#1a56a0;margin-bottom:6px;">${label}</div>
        ${temDados
          ? `<div style="font-size:12px;color:#475569;margin-bottom:8px;">
               ${(i.equipe_nome || i.nome_equipe) ? `<div>🎣 <strong>${i.equipe_nome || i.nome_equipe}</strong></div>` : ''}
               ${i.parceiro_nome ? `<div>👤 ${i.parceiro_nome}</div>` : ''}
               ${i.membro3_nome  ? `<div>👤 ${i.membro3_nome}</div>` : ''}
               ${i.membro4_nome  ? `<div>👤 ${i.membro4_nome}</div>` : ''}
             </div>`
          : `<div style="font-size:12px;color:#f59e0b;margin-bottom:8px;">⚠️ Nenhum participante adicional cadastrado.</div>`
        }`;

      // Form de edição inline
      const formId = 'form-edit-' + i.id;
      bloco.innerHTML += `
        <div id="${formId}" style="display:none;">
          ${isPesca ? `
            <label style="font-size:11px;color:#64748b;display:block;margin-bottom:2px;">Nome da equipe</label>
            <input type="text" id="edit-equipe-${i.id}" value="${i.nome_equipe || i.equipe_nome || ''}" maxlength="60"
              style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:8px;">
          ` : (i.modalidade_id === 4 ? `
            <label style="font-size:11px;color:#64748b;display:block;margin-bottom:2px;">Nome da dupla / equipe</label>
            <input type="text" id="edit-equipe-${i.id}" value="${i.nome_equipe || ''}" maxlength="60"
              style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:8px;">
          ` : '')}
          ${isPesca ? '<div style="font-size:11px;color:#60a5fa;background:#0f172a;border-radius:8px;padding:8px 10px;margin-bottom:8px;line-height:1.6;">🚤 Equipe: <strong>1 piloto</strong> + até <strong>3 pescadores</strong> (mín. 2 pessoas, máx. 4)</div>' : ''}
          <label style="font-size:11px;color:#64748b;display:block;margin-bottom:2px;">${isPesca ? '🚤 Piloto (obrigatório)' : 'Parceiro(a)'}</label>
          <input type="text" id="edit-p2-nome-${i.id}" value="${i.parceiro_nome || ''}" placeholder="Nome completo"
            style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:4px;">
          <input type="text" id="edit-p2-cpf-${i.id}" value="${i.parceiro_cpf || ''}" placeholder="CPF"
            style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:4px;" maxlength="14">
          <input type="tel" id="edit-p2-tel-${i.id}" value="${i.parceiro_telefone || ''}" placeholder="Telefone"
            style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:8px;">
          ${isPesca ? `
            <label style="font-size:11px;color:#64748b;display:block;margin-bottom:2px;">🎣 Pescador 2 (opcional)</label>
            <input type="text" id="edit-p3-nome-${i.id}" value="${i.membro3_nome || ''}" placeholder="Nome completo"
              style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:4px;">
            <input type="text" id="edit-p3-cpf-${i.id}" value="${i.membro3_cpf || ''}" placeholder="CPF"
              style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:4px;" maxlength="14">
            <input type="tel" id="edit-p3-tel-${i.id}" value="${i.membro3_telefone || ''}" placeholder="Telefone"
              style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:8px;">
            <label style="font-size:11px;color:#64748b;display:block;margin-bottom:2px;">🎣 Pescador 3 (opcional)</label>
            <input type="text" id="edit-p4-nome-${i.id}" value="${i.membro4_nome || ''}" placeholder="Nome completo"
              style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:4px;">
            <input type="text" id="edit-p4-cpf-${i.id}" value="${i.membro4_cpf || ''}" placeholder="CPF"
              style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:4px;" maxlength="14">
            <input type="tel" id="edit-p4-tel-${i.id}" value="${i.membro4_telefone || ''}" placeholder="Telefone"
              style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:8px;">
          ` : ''}
          <button onclick="salvarEdicaoMembros('${i.id}',${i.modalidade_id})"
            style="width:100%;padding:10px;background:#1a56a0;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:4px;">
            💾 Salvar
          </button>
          <button onclick="document.getElementById('${formId}').style.display='none'"
            style="width:100%;padding:8px;background:#f1f5f9;color:#64748b;border:none;border-radius:8px;font-size:13px;cursor:pointer;">
            Cancelar
          </button>
        </div>
        <button onclick="document.getElementById('${formId}').style.display=document.getElementById('${formId}').style.display==='none'?'block':'none'"
          style="padding:6px 14px;background:#eff6ff;color:#1a56a0;border:1px solid #bfdbfe;border-radius:8px;font-size:12px;cursor:pointer;font-weight:600;">
          ✏️ ${temDados ? 'Editar' : 'Adicionar participantes'}
        </button>`;

      editSection.appendChild(bloco);
    });

    // Remove seção anterior se existir (busca repetida)
    const anterior = document.getElementById('edit-section-membros');
    if (anterior) anterior.remove();
    editSection.id = 'edit-section-membros';
    document.getElementById('consulta-resultado').appendChild(editSection);
  }

  document.getElementById('consulta-resultado').style.display = 'block';
}

async function salvarEdicaoMembros(inscId, modId) {
  const isPesca   = EQUIPES_IDS.has(Number(modId));
  const isCanoagem = Number(modId) === 4;

  // Validação: Piloto obrigatório para Pesca
  if (isPesca) {
    const pilotoNome = document.getElementById('edit-p2-nome-' + inscId)?.value.trim();
    if (!pilotoNome) {
      alert('⚠️ O Piloto é obrigatório para Pesca embarcada. Informe ao menos o nome do piloto.');
      document.getElementById('edit-p2-nome-' + inscId)?.focus();
      return;
    }
  }

  const dados = {
    parceiro_nome:     document.getElementById('edit-p2-nome-' + inscId)?.value.trim() || null,
    parceiro_cpf:      document.getElementById('edit-p2-cpf-'  + inscId)?.value.trim() || null,
    parceiro_telefone: document.getElementById('edit-p2-tel-'  + inscId)?.value.trim() || null,
  };
  if (isCanoagem) {
    dados.nome_equipe = document.getElementById('edit-equipe-' + inscId)?.value.trim() || null;
  }
  if (isPesca) {
    dados.nome_equipe       = document.getElementById('edit-equipe-' + inscId)?.value.trim() || null;
    dados.membro3_nome      = document.getElementById('edit-p3-nome-'+ inscId)?.value.trim() || null;
    dados.membro3_cpf       = document.getElementById('edit-p3-cpf-' + inscId)?.value.trim() || null;
    dados.membro3_telefone  = document.getElementById('edit-p3-tel-' + inscId)?.value.trim() || null;
    dados.membro4_nome      = document.getElementById('edit-p4-nome-'+ inscId)?.value.trim() || null;
    dados.membro4_cpf       = document.getElementById('edit-p4-cpf-' + inscId)?.value.trim() || null;
    dados.membro4_telefone  = document.getElementById('edit-p4-tel-' + inscId)?.value.trim() || null;
  }
  try {
    const r = await fetch('/api/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'atualizar', tabela: 'inscricoes', id: inscId, dados })
    });
    const d = await r.json();
    if (Array.isArray(d) && d.length > 0) {
      alert('✅ Salvo com sucesso!');
      // Recarrega a consulta para mostrar dados atualizados
      buscarInscricao();
    } else {
      alert('Erro ao salvar. Tente novamente.');
    }
  } catch(e) {
    alert('Erro de conexão: ' + e.message);
  }
}

function toggleEventoAdd(id, iF) {
  const card = document.getElementById('add-ev-' + id);
  const box  = document.getElementById('add-parceiro-' + id);
  if (selecionadosAdd.has(id)) {
    selecionadosAdd.delete(id);
    card.classList.remove('selecionado', 'feminino-selecionado');
    if (box) { box.classList.remove('visivel'); box.style.display = 'none'; }
  } else {
    selecionadosAdd.add(id);
    card.classList.add(iF ? 'feminino-selecionado' : 'selecionado');
    if (box && DUPLAS.has(id)) { box.classList.add('visivel'); box.style.display = 'block'; }
  }
}

async function submeterAdicao() {
  const erro = document.getElementById('add-erro');
  erro.style.display = 'none';

  if (selecionadosAdd.size === 0) {
    erro.textContent = 'Selecione pelo menos uma modalidade para adicionar.';
    erro.style.display = 'block';
    return;
  }

  const sx = participanteConsulta.sexo || 'M';
  for (const id of selecionadosAdd) {
    if (DUPLAS.has(id)) {
      const pN = document.getElementById('add-p' + id + '-nome')?.value.trim();
      const pC = document.getElementById('add-p' + id + '-cpf')?.value.trim();
      const pT = document.getElementById('add-p' + id + '-tel')?.value.trim();
      if (!pN || !pC || !pT) {
        erro.textContent = `Preencha os dados do(a) ${sx === 'F' ? 'parceira' : 'parceiro'} para ${NOMES_MOD[id]}.`;
        erro.style.display = 'block';
        document.getElementById('add-p' + id + '-nome')?.scrollIntoView({ behavior:'smooth', block:'center' });
        return;
      }
    }
  }

  const bt = document.querySelector('#consulta-adicionar-area .btn');
  if (bt) { bt.disabled = true; bt.textContent = 'Adicionando...'; }

  const fi = inscricoesConsulta[0]?.numero_ficha || gerarFicha();
  for (const id of selecionadosAdd) {
    const insc = {
      participante_id: participanteConsulta.id,
      modalidade_id:   id,
      numero_ficha:    fi,
      status:          'confirmado',
    };
    if (DUPLAS.has(id)) {
      insc.parceiro_nome     = document.getElementById('add-p' + id + '-nome').value.trim();
      insc.parceiro_cpf      = document.getElementById('add-p' + id + '-cpf').value.trim();
      insc.parceiro_telefone = document.getElementById('add-p' + id + '-tel').value.trim();
      const addEquipeEl = document.getElementById('add-p' + id + '-equipe');
      if (addEquipeEl) insc.nome_equipe = addEquipeEl.value.trim();
    }
    await post('inscricoes', insc);
  }

  // Mostrar sucesso
  const r  = document.getElementById('consulta-resultado');
  const cd = r.querySelector('.card');
  if (cd) cd.style.display = 'none';
  document.getElementById('ficha-adicao').textContent = fi;
  const mods = Array.from(selecionadosAdd).map(id => NOMES_MOD[id]).join(', ');
  const msg  = encodeURIComponent(
    `🏆 Adicionei modalidades no *Festival de Inverno 2026*.\n📋 Ficha: *${fi}* — Novas: ${mods}.\n📲 https://festival-inverno.vercel.app`
  );
  document.getElementById('share-adicao').href = 'https://wa.me/?text=' + msg;
  document.getElementById('sucesso-adicao').style.display = 'block';
  selecionadosAdd.clear();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Calcular posição na lista de espera ────────────────────────
async function calcularPosicaoEspera(modalidadeId, participanteId) {
  try {
    const espera = await get('inscricoes',
      `modalidade_id=eq.${modalidadeId}&status=eq.lista_espera&select=id,participante_id,criado_em&order=criado_em.asc`
    );
    if (!Array.isArray(espera)) return 1;
    const pos = espera.findIndex(i => i.participante_id === participanteId);
    return pos >= 0 ? pos + 1 : espera.length;
  } catch (e) {
    return 1;
  }
}

// ══════════════════════════════════════════════════════════════
// VAGAS — Carregar contagem e exibir disponibilidade em todos os cards
// ══════════════════════════════════════════════════════════════
async function carregarVagas() {
  try {
    const inscricoes = await get('inscricoes', 'select=modalidade_id,status');
    if (!Array.isArray(inscricoes)) return;

    // Contar apenas confirmados por modalidade
    const contagem = {};
    inscricoes.forEach(i => {
      if (i.status === 'confirmado' || !i.status) {
        contagem[i.modalidade_id] = (contagem[i.modalidade_id] || 0) + 1;
      }
    });

    // Atualizar statusPorModalidade global (usado em enviarInscricao)
    statusPorModalidade = {};
    Object.keys(MODALIDADES).forEach(id => {
      const qtd = contagem[id] || 0;
      statusPorModalidade[Number(id)] = (getMaxVagas(Number(id)) > 0 && qtd >= getMaxVagas(Number(id))) ? 'lista_espera' : 'confirmado';
    });

    // Atualizar cada card com o status de vagas
    Object.entries(MODALIDADES).forEach(([id, mod]) => {
      const qtd       = contagem[id] || 0;
      const limiteAtual = getMaxVagas(Number(id));
      const restantes = limiteAtual > 0 ? limiteAtual - qtd : 999;
      const card      = document.getElementById('ev' + id);
      if (!card) return;

      // Remove indicador anterior (para atualização dinâmica)
      const anterior = card.querySelector('.vaga-indicador');
      if (anterior) anterior.remove();

      // Cria o indicador de vagas
      const indicador = document.createElement('div');
      indicador.className = 'vaga-indicador';

      if (limiteAtual > 0 && qtd >= limiteAtual) {
        // ── ESGOTADO — abre lista de espera ──
        card.dataset.listaEspera = 'true';
        indicador.innerHTML = `
          <div class="vaga-barra-wrap">
            <div class="vaga-barra vaga-barra-cheia"></div>
          </div>
          <div class="vaga-texto vaga-esgotada">
            🔴 Vagas esgotadas
            <span class="vaga-espera-hint">Inscreva-se na lista de espera →</span>
          </div>`;
        // Atualiza badge de prêmio se selecionado
        const premio = card.querySelector('.evento-premio');
        if (premio) {
          premio.textContent = '⏳ Lista de espera — sem garantia de participação';
          premio.classList.add('espera-badge');
        }

      } else if (limiteAtual > 0 && restantes <= 5) {
        // ── ÚLTIMAS VAGAS ──
        const pct = Math.round(qtd / limiteAtual * 100);
        indicador.innerHTML = `
          <div class="vaga-barra-wrap">
            <div class="vaga-barra vaga-barra-quase" style="width:${pct}%"></div>
          </div>
          <div class="vaga-texto vaga-quase">
            ⚠️ Últimas ${restantes} vaga${restantes > 1 ? 's' : ''}
            <span class="vaga-num">${qtd}/${limiteAtual}</span>
          </div>`;

      } else if (limiteAtual === 0) {
        // ── VAGAS ILIMITADAS (Pesca) ──
        indicador.innerHTML = `
          <div class="vaga-texto vaga-ok">
            ✅ Inscrições abertas
            <span class="vaga-num">${qtd} inscrito${qtd !== 1 ? 's' : ''}</span>
          </div>`;

      } else {
        // ── VAGAS DISPONÍVEIS ──
        const pct = Math.round(qtd / limiteAtual * 100);
        indicador.innerHTML = `
          <div class="vaga-barra-wrap">
            <div class="vaga-barra vaga-barra-ok" style="width:${pct}%"></div>
          </div>
          <div class="vaga-texto vaga-ok">
            ✅ ${restantes} vaga${restantes > 1 ? 's' : ''} disponíve${restantes > 1 ? 'is' : 'l'}
            <span class="vaga-num">${qtd}/${limiteAtual}</span>
          </div>`;
      }

      // Insere o indicador no final do card (antes do parceiro-box)
      card.appendChild(indicador);
    });
  } catch (e) {
    console.warn('Não foi possível carregar status de vagas:', e.message);
  }
}

// ══════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  // Máscara de CPF no campo principal
  const cpfEl = document.getElementById('cpf');
  cpfEl.addEventListener('input', function() {
    mascararCPF(this);
    marcarCPFok(this);
    document.getElementById('erro-ja-inscrito').style.display = 'none';
    document.getElementById('erro').style.display = 'none';
  });
  cpfEl.addEventListener('blur', function() { validarCampoCPF(this); });

  // ── Máscara de telefone em TODOS os campos tel ──────────────
  // Campo principal do participante 1
  const telPrincipal = document.getElementById('telefone');
  if (telPrincipal) telPrincipal.addEventListener('input', function() { mascararTelefone(this); });

  // Telefones dos parceiros de duplas (Vôlei, Futevôlei, Canoagem)
  [1, 2, 3, 4].forEach(id => {
    const el = document.getElementById('p' + id + '-tel');
    if (el) el.addEventListener('input', function() { mascararTelefone(this); });
  });

  // Telefones dos membros da Pesca
  ['6', '7'].forEach(box => {
    ['m2', 'm3', 'm4'].forEach(m => {
      const el = document.getElementById(`p${box}-${m}-tel`);
      if (el) el.addEventListener('input', function() { mascararTelefone(this); });
    });
  });

  // Validação em tempo real nos CPFs dos parceiros (duplas)
  [1,2,3,4].forEach(id => {
    const el = document.getElementById('p' + id + '-cpf');
    if (el) {
      el.addEventListener('input', function() { mascararCPF(this); marcarCPFok(this); });
      el.addEventListener('blur',  function() { validarCampoCPF(this); });
    }
  });

  // Validação em tempo real nos CPFs dos membros da Pesca
  ['6','7'].forEach(box => {
    ['m2','m3','m4'].forEach(m => {
      const el = document.getElementById(`p${box}-${m}-cpf`);
      if (el) {
        el.addEventListener('input', function() { mascararCPF(this); marcarCPFok(this); });
        el.addEventListener('blur',  function() { validarCampoCPF(this); });
      }
    });
  });

  // Configurar autorização de imagem dos membros (Pesca)
  _setupAutorizacaoMembros();

  // Carregar status de vagas e bloquear cards esgotados
  carregarVagas();

  // Data/hora de acesso no rodapé
  const el = document.getElementById('data-acesso');
  if (el) {
    el.textContent = new Date().toLocaleString('pt-BR', {
      day:'2-digit', month:'2-digit', year:'numeric',
      hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false
    });
  }
});

// ══════════════════════════════════════════════════════════════
// QR CODE + FICHA PARA DOWNLOAD  (v4 — QR gerado direto no canvas)
// ══════════════════════════════════════════════════════════════

let _fichaAtual = '', _fichaAtualNome = '', _fichaAtualMods = '', _fichaEspera = false;

function gerarQRCodeSucesso(ficha, nome, mods, isEspera) {
  _fichaAtual     = ficha;
  _fichaAtualNome = nome;
  _fichaAtualMods = mods;
  _fichaEspera    = isEspera;

  const containerId = isEspera ? 'qrcode-espera' : 'qrcode-confirmado';
  const container   = document.getElementById(containerId);
  if (!container || typeof QRCode === 'undefined') return;
  container.innerHTML = '';
  new QRCode(container, {
    text:         ficha,
    width:        200,
    height:       200,
    colorDark:    '#0f172a',
    colorLight:   '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}

// Gera QR Code num div temporário e retorna como dataURL — sem taint de canvas
function _gerarQRDataURL(texto, tamanho, callback) {
  if (typeof QRCode === 'undefined') { callback(null); return; }

  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
  document.body.appendChild(div);

  try {
    new QRCode(div, {
      text:         texto,
      width:        tamanho,
      height:       tamanho,
      colorDark:    '#0f172a',
      colorLight:   '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  } catch(e) {
    document.body.removeChild(div);
    callback(null);
    return;
  }

  // QRCode.js pode demorar um tick para renderizar
  setTimeout(() => {
    const qrCanvas = div.querySelector('canvas');
    const qrImg    = div.querySelector('img');
    let dataUrl    = null;

    if (qrCanvas) {
      try { dataUrl = qrCanvas.toDataURL('image/png'); } catch(e) {}
    }
    if (!dataUrl && qrImg && qrImg.src) {
      dataUrl = qrImg.src; // já é data URL quando gerado pelo QRCode.js
    }

    document.body.removeChild(div);
    callback(dataUrl);
  }, 120);
}

// Polyfill roundRect para Safari/Firefox antigos
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function _desenharFicha(corTopo, statusLabel, callback) {
  // 1º: gera QR fresco em div oculto — evita problema de canvas tainted
  _gerarQRDataURL(_fichaAtual, 210, (qrDataUrl) => {
    const W = 540, H = 880;
    const cv  = document.createElement('canvas');
    cv.width  = W * 2;
    cv.height = H * 2;
    const ctx = cv.getContext('2d');
    ctx.scale(2, 2);

    // ── Fundo ──
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, W, H);

    // ── Topo colorido ──
    ctx.fillStyle = corTopo;
    ctx.fillRect(0, 0, W, 140);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 21px Arial';
    ctx.fillText('🏆 FESTIVAL DE INVERNO 2026', W / 2, 38);
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('SEMESP — Prefeitura de Costa Marques / RO', W / 2, 60);
    ctx.fillText('01, 02 e 03 de Maio de 2026 · Praça dos Navegantes', W / 2, 80);

    // Badge status
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    rrect(ctx, (W - 220) / 2, 96, 220, 32, 16);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(statusLabel, W / 2, 117);

    // ── Card branco ──
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur  = 18;
    rrect(ctx, 20, 155, W - 40, H - 170, 16);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Nome
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 19px Arial';
    let nome = _fichaAtualNome.toUpperCase();
    while (ctx.measureText(nome).width > W - 80 && nome.length > 10)
      nome = nome.slice(0, -4) + '...';
    ctx.fillText(nome, W / 2, 196);

    // Linha
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(44, 210); ctx.lineTo(W - 44, 210); ctx.stroke();

    // Número ficha
    ctx.fillStyle = '#64748b'; ctx.font = '12px Arial';
    ctx.fillText('NÚMERO DE INSCRIÇÃO', W / 2, 234);
    ctx.fillStyle = '#1a56a0'; ctx.font = 'bold 48px Arial';
    ctx.fillText(_fichaAtual, W / 2, 286);

    // ── Área QR ──
    const qrSize = 210, qrX = (W - qrSize) / 2, qrY = 302;

    // Fundo do QR
    ctx.fillStyle = '#f8fafc';
    rrect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 12);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    rrect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 12);
    ctx.stroke();

    const continuar = () => {
      // Instrução
      ctx.fillStyle = '#475569'; ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Apresente este QR Code no credenciamento', W / 2, qrY + qrSize + 24);

      // Linha
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(44, qrY + qrSize + 38);
      ctx.lineTo(W - 44, qrY + qrSize + 38);
      ctx.stroke();

      // Modalidades
      ctx.fillStyle = '#94a3b8'; ctx.font = '10px Arial';
      ctx.fillText('MODALIDADES INSCRITAS', W / 2, qrY + qrSize + 56);
      ctx.fillStyle = '#0f172a'; ctx.font = '13px Arial';
      const linhas = _fichaAtualMods.split(',');
      linhas.forEach((l, i) => ctx.fillText(l.trim(), W / 2, qrY + qrSize + 74 + i * 20));

      // Aviso alimento
      const avY = qrY + qrSize + 100 + linhas.length * 20;
      ctx.fillStyle = '#fef3c7';
      rrect(ctx, 36, avY, W - 72, 46, 10);
      ctx.fill();
      ctx.fillStyle = '#92400e'; ctx.font = 'bold 12px Arial';
      ctx.fillText('🥫 Traga 1 kg de alimento não perecível', W / 2, avY + 17);
      ctx.fillStyle = '#78350f'; ctx.font = '11px Arial';
      ctx.fillText('Obrigatório na entrega da ficha no credenciamento', W / 2, avY + 33);

      // Rodapé
      ctx.fillStyle = '#94a3b8'; ctx.font = '10px Arial';
      ctx.fillText('SEMESP — Prefeitura de Costa Marques / RO  ·  festival-inverno.vercel.app', W / 2, H - 14);

      callback(cv.toDataURL('image/png'));
    };

    // Desenha QR no canvas
    if (qrDataUrl) {
      const qrImg = new Image();
      qrImg.onload  = () => { ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize); continuar(); };
      qrImg.onerror = () => {
        // QR falhou: escreve texto de fallback
        ctx.fillStyle = '#94a3b8'; ctx.font = '13px Arial';
        ctx.fillText('(QR Code: ' + _fichaAtual + ')', W / 2, qrY + qrSize / 2);
        continuar();
      };
      qrImg.src = qrDataUrl;
    } else {
      ctx.fillStyle = '#94a3b8'; ctx.font = '13px Arial';
      ctx.fillText('(QR Code: ' + _fichaAtual + ')', W / 2, qrY + qrSize / 2);
      continuar();
    }
  });
}

// Modal que funciona no iOS e Android
function _mostrarModalFicha(dataUrl, nomeArquivo) {
  const antigo = document.getElementById('modal-ficha');
  if (antigo) antigo.remove();

  const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);

  const modal = document.createElement('div');
  modal.id = 'modal-ficha';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.88);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:16px;overflow-y:auto;-webkit-overflow-scrolling:touch;';

  modal.innerHTML = `
    <div style="width:100%;max-width:400px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="color:white;font-weight:700;font-size:16px;">📄 Sua ficha de inscrição</div>
        <button onclick="document.getElementById('modal-ficha').remove()"
          style="background:rgba(255,255,255,0.15);border:none;color:white;width:36px;height:36px;border-radius:50%;font-size:18px;cursor:pointer;flex-shrink:0;">✕</button>
      </div>

      <img src="${dataUrl}" style="width:100%;border-radius:12px;display:block;box-shadow:0 4px 20px rgba(0,0,0,0.4);">

      ${isIOS
        ? `<div style="margin-top:12px;background:#1e293b;border-radius:12px;padding:14px 16px;color:#94a3b8;font-size:13px;text-align:center;line-height:1.7;">
             📱 <strong style="color:white;">iPhone / iPad:</strong><br>
             Pressione e segure a imagem acima<br>e toque em <strong style="color:#60a5fa;">"Adicionar à Fotos"</strong>
           </div>`
        : `<a href="${dataUrl}" download="${nomeArquivo}"
             style="display:block;margin-top:12px;width:100%;padding:15px;background:linear-gradient(135deg,#1a56a0,#1d4ed8);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;text-align:center;text-decoration:none;box-sizing:border-box;">
             ⬇️ Baixar imagem no dispositivo
           </a>`
      }

      <button onclick="document.getElementById('modal-ficha').remove()"
        style="margin-top:10px;width:100%;padding:13px;background:transparent;color:#64748b;border:1px solid #334155;border-radius:12px;font-size:14px;cursor:pointer;">
        Fechar
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

function baixarFichaConfirmado() {
  _fichaEspera = false;
  _desenharFicha('#1a56a0', '✅ INSCRIÇÃO CONFIRMADA', (dataUrl) => {
    _mostrarModalFicha(dataUrl, 'ficha-' + _fichaAtual.replace('-', '') + '.png');
  });
}

function baixarFichaEspera() {
  _fichaEspera = true;
  _desenharFicha('#d97706', '⏳ LISTA DE ESPERA', (dataUrl) => {
    _mostrarModalFicha(dataUrl, 'ficha-espera-' + _fichaAtual.replace('-', '') + '.png');
  });
}
