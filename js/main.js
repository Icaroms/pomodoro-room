// ============================================
// MAIN.JS — Orquestrador do Jogo
// ============================================
//
// Este arquivo é o último a carregar.
// Todos os outros módulos já estão prontos neste ponto.
//
// Responsabilidade: inicializar o jogo e
// conectar partes que precisam se conhecer.
//


// --- INICIALIZAÇÃO DO JOGO ---
// Tudo já foi inicializado nos próprios módulos,
// mas centralizamos aqui qualquer lógica futura.

function initGame() {
    console.log('🎮 Pomodoro Room iniciado!');
    console.log(`🪙 Saldo atual: ${getCoins()} moedas`);
    console.log(`🏠 Itens no quarto: ${roomItems.length}`);
}

// Executa a inicialização
initGame();