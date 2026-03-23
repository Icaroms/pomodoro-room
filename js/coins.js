/**
 * COINS.JS — Sistema de moedas
 * 
 * Gerencia o saldo do jogador. Moedas são ganhas ao completar
 * rodadas do Pomodoro e gastas na loja de itens.
 * 
 * Depende de: storage.js
 */

var COINS_PER_POMODORO = 10;

/** Carrega saldo salvo ou inicia com 0 */
var currentCoins = loadData('coins') || 0;

var coinsCountDisplay = document.getElementById('coins-count');

/** Atualiza o display na tela e salva no localStorage */
function updateCoinsDisplay() {
    coinsCountDisplay.textContent = currentCoins;
    saveData('coins', currentCoins);
}

/** Adiciona moedas ao saldo (chamada pelo timer ao completar rodada) */
function addCoins(amount) {
    currentCoins += amount;
    updateCoinsDisplay();
}

/**
 * Tenta gastar moedas. Retorna true se tinha saldo, false se não.
 * Usado pela loja para validar compras.
 */
function spendCoins(amount) {
    if (currentCoins >= amount) {
        currentCoins -= amount;
        updateCoinsDisplay();
        return true;
    }
    return false;
}

/** Consulta o saldo atual sem alterar */
function getCoins() {
    return currentCoins;
}

updateCoinsDisplay();