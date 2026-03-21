// ============================================
// MAIN.JS — Orquestrador do Jogo
// ============================================


// --- REFERÊNCIAS ---

const startScreen = document.getElementById('start-screen');
const gameContainer = document.getElementById('game-container');
const btnPlay = document.getElementById('btn-play');


// --- TELA INICIAL → JOGO ---
// Ao clicar "Jogar", esconde a tela inicial e mostra o jogo

btnPlay.addEventListener('click', function () {
    // Esconde a tela inicial
    startScreen.classList.add('hidden');

    // Mostra o jogo com animação de fade in
    gameContainer.classList.remove('hidden');
    gameContainer.classList.add('fade-in');

    // Remove a classe de animação depois que terminar
    // (evita re-animar se algo mudar depois)
    setTimeout(function () {
        gameContainer.classList.remove('fade-in');
    }, 500);

    console.log('🎮 Pomodoro Room iniciado!');
    console.log(`🪙 Saldo atual: ${getCoins()} moedas`);
});