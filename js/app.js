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
  const cidade = document.getElementById('cidade-valor').value.trim() ||
                 document.getElementById('cidade').value.trim();
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

  // Verificar vagas disponíveis
  for (const id of selecionados) {
    const check = await get('inscricoes', `modalidade_id=eq.${id}&select=id`);
    if (Array.isArray(check) && check.length >= MAX_VAGAS) {
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
  const resPart = await post('participantes', {
    nome_completo:      nome,
    cpf,
    sexo,
    email:              email || null,
    telefone:           tel,
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
      // Validar CPFs dos membros preenchidos
      for (const m of ['m2', 'm3', 'm4']) {
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

    await post('inscricoes', insc);
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
  renderizarConsulta();
}

function renderizarConsulta() {
  const p   = participanteConsulta;
  const ins = inscricoesConsulta;
  const fi  = ins[0]?.numero_ficha || '—';
  const sx  = p.sexo || 'M';

  document.getElementById('consulta-perfil').innerHTML =
    `<div class="consulta-perfil-nome">${p.nome_completo}</div>` +
    `<div class="consulta-perfil-sub">CPF: ${p.cpf || '—'} · ${p.cidade || '—'}/${p.uf || 'RO'}</div>` +
    `<div class="consulta-ficha-num">Ficha: ${fi}</div>`;

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
      ph = `<div class="parceiro-box ${iF ? 'feminino' : ''}" id="add-parceiro-${id}" style="display:none;">
        <div class="parceiro-titulo">Dados do(a) ${lb} ${rs}</div>
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

  document.getElementById('consulta-resultado').style.display = 'block';
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

    // Atualizar cada card com o status de vagas
    Object.entries(MODALIDADES).forEach(([id, mod]) => {
      const qtd       = contagem[id] || 0;
      const restantes = MAX_VAGAS - qtd;
      const card      = document.getElementById('ev' + id);
      if (!card) return;

      // Remove indicador anterior (para atualização dinâmica)
      const anterior = card.querySelector('.vaga-indicador');
      if (anterior) anterior.remove();

      // Cria o indicador de vagas
      const indicador = document.createElement('div');
      indicador.className = 'vaga-indicador';

      if (qtd >= MAX_VAGAS) {
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

      } else if (restantes <= 5) {
        // ── ÚLTIMAS VAGAS ──
        const pct = Math.round(qtd / MAX_VAGAS * 100);
        indicador.innerHTML = `
          <div class="vaga-barra-wrap">
            <div class="vaga-barra vaga-barra-quase" style="width:${pct}%"></div>
          </div>
          <div class="vaga-texto vaga-quase">
            ⚠️ Últimas ${restantes} vaga${restantes > 1 ? 's' : ''}
            <span class="vaga-num">${qtd}/${MAX_VAGAS}</span>
          </div>`;

      } else {
        // ── VAGAS DISPONÍVEIS ──
        const pct = Math.round(qtd / MAX_VAGAS * 100);
        indicador.innerHTML = `
          <div class="vaga-barra-wrap">
            <div class="vaga-barra vaga-barra-ok" style="width:${pct}%"></div>
          </div>
          <div class="vaga-texto vaga-ok">
            ✅ ${restantes} vaga${restantes > 1 ? 's' : ''} disponíve${restantes > 1 ? 'is' : 'l'}
            <span class="vaga-num">${qtd}/${MAX_VAGAS}</span>
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
