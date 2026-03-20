// ============================================
// COINS.JS — Sistema de Moedas
// ============================================
//
// Gerencia o saldo de moedas do jogador.
// É a ponte entre o Pomodoro (ganhar) e a Loja (gastar).
//
// Depende de: storage.js (precisa carregar antes no HTML)
//


// --- CONSTANTE ---
// Quantas moedas o jogador ganha por Pomodoro completo

const COINS_PER_POMODORO = 10;


// --- VARIÁVEL DE ESTADO ---
// Saldo atual de moedas
//
// loadData('coins') tenta buscar o valor salvo no localStorage
// Se existir → usa o valor salvo (ex: 50)
// Se não existir → loadData retorna null
//
// O operador || (OR lógico) funciona assim:
// Se o lado esquerdo for null, undefined, 0 ou false → usa o lado direito
// Exemplo: null || 0  → resultado é 0
// Exemplo: 50 || 0    → resultado é 50

let currentCoins = loadData('coins') || 0;


// --- REFERÊNCIA AO ELEMENTO DO HTML ---
// O <span> que mostra o número de moedas na tela

const coinsCountDisplay = document.getElementById('coins-count');


// --- FUNÇÃO: ATUALIZAR DISPLAY DAS MOEDAS ---
// Mostra o saldo na tela E salva no localStorage

function updateCoinsDisplay() {
    // Atualiza o texto visível na tela
    // (mesmo padrão do updateDisplay() no timer.js)
    coinsCountDisplay.textContent = currentCoins;

    // Salva no localStorage pra não perder ao fechar o navegador
    // (usando a função que criamos no storage.js)
    saveData('coins', currentCoins);
}


// --- FUNÇÃO: ADICIONAR MOEDAS ---
// Recebe: quantidade de moedas a adicionar (número)
// Chamada pelo timer.js quando um Pomodoro é completado
//
// Exemplo: addCoins(10) → saldo sobe de 30 pra 40

function addCoins(amount) {
    // += é atalho pra: currentCoins = currentCoins + amount
    currentCoins += amount;

    // Atualiza tela e salva
    updateCoinsDisplay();
}


// --- FUNÇÃO: GASTAR MOEDAS ---
// Recebe: quantidade de moedas a gastar (número)
// Retorna: true se conseguiu, false se saldo insuficiente
//
// Exemplo: spendCoins(50) com saldo 30 → retorna false, nada muda
// Exemplo: spendCoins(50) com saldo 80 → retorna true, saldo vira 30

function spendCoins(amount) {
    // Verifica se tem saldo suficiente
    if (currentCoins >= amount) {
        // -= é atalho pra: currentCoins = currentCoins - amount
        currentCoins -= amount;

        // Atualiza tela e salva
        updateCoinsDisplay();

        // Retorna true → a compra foi bem-sucedida
        return true;
    }

    // Se chegou aqui, não tinha saldo suficiente
    // Retorna false → a compra falhou
    return false;
}


// --- FUNÇÃO: CONSULTAR SALDO ---
// Retorna o saldo atual sem alterar nada
// Útil pra outros módulos checarem quanto o jogador tem

function getCoins() {
    return currentCoins;
}


// --- INICIALIZAÇÃO ---
// Mostra o saldo na tela assim que a página carrega
// Se é a primeira vez → mostra 0
// Se já jogou antes → mostra o saldo salvo

updateCoinsDisplay();