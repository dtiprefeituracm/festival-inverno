// js/utils.js - Funções úteis

// Máscara de CPF
function mascararCPF(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1.$2');
    el.value = v;
}

// Gerar número da ficha
function gerarFicha() {
    return 'FI-' + String(Math.floor(Math.random() * 9000) + 1000);
}

// Verificar se é menor de 18 anos
function eMenor() {
    const dataNasc = document.getElementById('nascimento').value;
    if (!dataNasc) return false;
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
    return idade < 18;
}

// Verificar se inscrição ainda está aberta
function inscricaoAberta() {
    return new Date() < CONFIG.DATA_LIMITE;
}
