// ================================================================
// config.js — Configurações e constantes
// Festival de Inverno 2026 — Costa Marques/RO
// © 2026 Ewerson Luiz de Oliveira
// ================================================================

// Data limite para inscrições
const DATA_LIMITE_INSCRICAO = new Date('2026-05-01T23:59:59');

// Verifica se as inscrições estão abertas
function inscricaoAberta() {
  return new Date() <= DATA_LIMITE_INSCRICAO;
}

// IDs das modalidades em dupla (parceiro obrigatório)
const DUPLAS = new Set([1, 2, 3, 4]);

// IDs das modalidades em equipe (pesca — até 4 membros)
const EQUIPES_IDS = new Set([6, 7]);

// Quais modalidades aparecem para cada sexo
const VISIVEL_M = new Set([1, 3, 4, 5, 6]);
const VISIVEL_F = new Set([2, 4, 5, 7]);

// Máximo de vagas por modalidade (0 = ilimitado)
const MAX_VAGAS_POR_MOD = { 1:20, 2:20, 3:20, 4:0, 5:0, 6:0, 7:0 };
function getMaxVagas(modId) { return MAX_VAGAS_POR_MOD[modId] ?? 0; }

// Dados completos das modalidades
const MODALIDADES = {
  1: { nome: 'Vôlei de Areia', sub: 'Masculino',  dupla: true,  equipe: false },
  2: { nome: 'Vôlei de Areia', sub: 'Feminino',   dupla: true,  equipe: false },
  3: { nome: 'Futevôlei',      sub: 'Masculino',  dupla: true,  equipe: false },
  4: { nome: 'Canoagem',       sub: 'Dupla',      dupla: true,  equipe: false },
  5: { nome: 'Caiaque',        sub: 'Individual', dupla: false, equipe: false },
  6: { nome: 'Pesca',          sub: 'Masculino',  dupla: false, equipe: true  },
  7: { nome: 'Pesca',          sub: 'Feminino',   dupla: false, equipe: true  },
};

// Nomes curtos para mensagens e validações
const NOMES_MOD = {
  1: 'Vôlei Masc.', 2: 'Vôlei Fem.', 3: 'Futevôlei',
  4: 'Canoagem',    5: 'Caiaque',    6: 'Pesca Masc.', 7: 'Pesca Fem.'
};

// Lista de municípios de Rondônia (autocomplete)
const MUNICIPIOS_RO = [
  "Alta Floresta D'Oeste", "Alto Alegre dos Parecis", "Alto Paraíso",
  "Ariquemes", "Buritis", "Cabixi", "Cacaulândia", "Cacoal",
  "Campo Novo de Rondônia", "Candeias do Jamari", "Castanheiras",
  "Cerejeiras", "Chupinguaia", "Colorado do Oeste", "Corumbiara",
  "Costa Marques", "Cujubim", "Espigão D'Oeste",
  "Governador Jorge Teixeira", "Guajará-Mirim", "Itapuã do Oeste",
  "Jaru", "Ji-Paraná", "Machadinho D'Oeste", "Ministro Andreazza",
  "Mirante da Serra", "Monte Negro", "Nova Brasilândia D'Oeste",
  "Nova Mamoré", "Novo Horizonte do Oeste", "Ouro Preto do Oeste",
  "Parecis", "Pimenta Bueno", "Pimenteiras do Oeste", "Porto Velho",
  "Presidente Médici", "Primavera de Rondônia", "Rio Crespo",
  "Rolim de Moura", "Santa Luzia D'Oeste", "São Felipe D'Oeste",
  "São Francisco do Guaporé", "São Miguel do Guaporé", "Seringueiras",
  "Teixeirópolis", "Theobroma", "Urupá", "Vale do Anari",
  "Vale do Paraíso", "Vilhena"
];
