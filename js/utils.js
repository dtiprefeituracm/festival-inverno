// ================================================================
// utils.js — Funções utilitárias (máscaras, validações, API segura)
// Festival de Inverno 2026 — Costa Marques/RO
// © 2026 Ewerson Luiz de Oliveira
// ================================================================

// ── Comunicação segura com o servidor (/api/supabase) ──────────
// As chaves do banco ficam no servidor (Vercel), nunca no navegador
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
  // Se começa com letra → número de ficha (ex: FI-1234)
  if (/^[a-zA-Z]/.test(v.replace(/\s/g, ''))) {
    el.value = v.toUpperCase();
    return;
  }
  // Senão, formata como CPF
  let d = v.replace(/\D/g, '').slice(0, 11);
  if      (d.length > 9) d = d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  else if (d.length > 6) d = d.replace(/(\d{3})(\d{3})(\d+)/,            '$1.$2.$3');
  else if (d.length > 3) d = d.replace(/(\d{3})(\d+)/,                   '$1.$2');
  el.value = d;
}
