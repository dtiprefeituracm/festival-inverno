// js/config.js
// Configurações do sistema - Festival de Inverno 2026

const CONFIG = {
    // Não coloque chaves do Supabase aqui! Elas ficam só no Vercel.
    SITE_NAME: "Festival de Inverno 2026",
    DATA_EVENTO: "01, 02 e 03 de Maio de 2026",
    MAX_VAGAS: 30,
    
    // Modalidades (nome amigável)
    NOMES_MOD: {
        1: "Vôlei de Areia Masculino",
        2: "Vôlei de Areia Feminino",
        3: "Futevôlei",
        4: "Canoagem",
        5: "Caiaque",
        6: "Pesca Masculino",
        7: "Pesca Feminino"
    },

    // Quais modalidades são duplas
    DUPLAS: new Set([1, 2, 3, 4, 5]),

    // Quais são equipes de pesca (precisam de membros)
    EQUIPES: new Set([6, 7]),

    // Data limite de inscrição (pode ajustar depois)
    DATA_LIMITE: new Date("2026-04-25")
};

window.CONFIG = CONFIG;   // deixa acessível para os outros arquivos
