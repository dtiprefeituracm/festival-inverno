// ================================================================
// utils.js — Funções utilitárias (máscaras, validações, API segura)
// Festival de Inverno 2026 — Costa Marques/RO
// © 2026 Ewerson Luiz de Oliveira
// ================================================================

// ── Comunicação segura com o servidor (/api/supabase) ──────────
async function get(tabela, query = '') {
  const r = await fetch('/api/supabase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acao: 'buscar', tabela, query })
  });
  return r.json();
}

async function post(tabela, dados) {
  const r = await fetch('/api/supabase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acao: 'inserir', tabela, dados })
  });
  return r.json();
}

// ── Máscara de CPF ─────────────────────────────────────────────
function mascararCPF(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 11);
  if      (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/,            '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/,                   '$1.$2');
  el.value = v;
}

// ── Validação de CPF (algoritmo oficial) ───────────────────────
function validarCPF(cpf) {
  // Remove tudo que não é dígito
  const c = cpf.replace(/\D/g, '');

  // Deve ter exatamente 11 dígitos
  if (c.length !== 11) return false;

  // Rejeita sequências repetidas (000.000.000-00, 111.111.111-11...)
  if (/^(\d)\1{10}$/.test(c)) return false;

  // Valida o primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(c[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(c[9])) return false;

  // Valida o segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(c[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(c[10])) return false;

  return true;
}

// ── Validação visual em tempo real (chamado no blur do campo) ──
function validarCampoCPF(el) {
  const cpf = el.value.trim();
  // Só valida se o campo tiver conteúdo (não valida campo vazio)
  if (!cpf) { marcarCPFok(el); return; }

  const digits = cpf.replace(/\D/g, '');
  // Só valida quando o campo está completo (11 dígitos)
  if (digits.length < 11) { marcarCPFok(el); return; }

  if (validarCPF(cpf)) {
    marcarCPFok(el);
  } else {
    marcarCPFerro(el);
  }
}

function marcarCPFerro(el) {
  el.style.borderColor = '#dc2626';
  el.style.boxShadow   = '0 0 0 3px rgba(220,38,38,0.1)';
  // Adiciona ou atualiza msg de erro abaixo do campo
  let msg = el.parentElement.querySelector('.cpf-erro-msg');
  if (!msg) {
    msg = document.createElement('div');
    msg.className = 'cpf-erro-msg';
    msg.style.cssText = 'color:#dc2626;font-size:11px;margin-top:4px;';
    el.parentElement.appendChild(msg);
  }
  msg.textContent = '⚠️ CPF inválido. Verifique os números digitados.';
}

function marcarCPFok(el) {
  el.style.borderColor = '';
  el.style.boxShadow   = '';
  const msg = el.parentElement.querySelector('.cpf-erro-msg');
  if (msg) msg.remove();
}

// ── Normalizar texto (remover acentos para autocomplete) ────────
function normalizar(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ── Gerar número de ficha aleatório ────────────────────────────
function gerarFicha() {
  return 'FI-' + String(Math.floor(Math.random() * 9000) + 1000);
}

// ── Verificar se participante é menor de idade ─────────────────
function eMenor() {
  const nasc = document.getElementById('nascimento').value;
  if (!nasc) return false;
  const hoje = new Date();
  const d    = new Date(nasc + 'T00:00');
  return (hoje.getFullYear() - d.getFullYear() -
    (hoje < new Date(hoje.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0)) < 18;
}

// ── Máscara inteligente para campo de consulta ─────────────────
function mascararConsultaInput(el) {
  limparResultadoConsulta();
  const v = el.value;
  if (/^[a-zA-Z]/.test(v.replace(/\s/g, ''))) {
    el.value = v.toUpperCase();
    return;
  }
  let d = v.replace(/\D/g, '').slice(0, 11);
  if      (d.length > 9) d = d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  else if (d.length > 6) d = d.replace(/(\d{3})(\d{3})(\d+)/,            '$1.$2.$3');
  else if (d.length > 3) d = d.replace(/(\d{3})(\d+)/,                   '$1.$2');
  el.value = d;
}
