// ============================================
// SOUND.JS — Efeitos Sonoros 8-bit
// ============================================
//
// Sons gerados via Web Audio API (sem arquivos externos)
// Estilo chiptune / 8-bit para combinar com pixel art
//

var audioCtx = null;

// Inicializa o AudioContext (precisa de interação do usuário primeiro)
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Função base: toca uma nota com oscilador
function playTone(frequency, duration, type, volume) {
    if (!audioCtx) return;

    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();

    osc.type = type || 'square';
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(volume || 0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
}

// --- SONS DO JOGO ---

// Moedas ganhas (som alegre, duas notas subindo)
function soundCoins() {
    initAudio();
    playTone(523, 0.12, 'square', 0.12);   // C5
    setTimeout(function () {
        playTone(659, 0.12, 'square', 0.12); // E5
    }, 80);
    setTimeout(function () {
        playTone(784, 0.2, 'square', 0.12);  // G5
    }, 160);
}

// Timer iniciado (bip curto)
function soundStart() {
    initAudio();
    playTone(440, 0.1, 'square', 0.1);  // A4
    setTimeout(function () {
        playTone(880, 0.15, 'square', 0.1); // A5
    }, 100);
}

// Timer pausado (bip descendente)
function soundPause() {
    initAudio();
    playTone(660, 0.1, 'triangle', 0.1);
    setTimeout(function () {
        playTone(440, 0.15, 'triangle', 0.1);
    }, 100);
}

// Pomodoro completo (fanfarra curta)
function soundComplete() {
    initAudio();
    playTone(523, 0.12, 'square', 0.12);  // C5
    setTimeout(function () {
        playTone(659, 0.12, 'square', 0.12); // E5
    }, 120);
    setTimeout(function () {
        playTone(784, 0.12, 'square', 0.12); // G5
    }, 240);
    setTimeout(function () {
        playTone(1047, 0.3, 'square', 0.15); // C6
    }, 360);
}

// Ciclo completo (4 rodadas — fanfarra maior)
function soundCycleComplete() {
    initAudio();
    var notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach(function (freq, i) {
        setTimeout(function () {
            playTone(freq, 0.15, 'square', 0.12);
        }, i * 100);
    });
}

// Compra na loja (som de moeda gastando)
function soundPurchase() {
    initAudio();
    playTone(880, 0.08, 'square', 0.1);
    setTimeout(function () {
        playTone(698, 0.08, 'square', 0.1);
    }, 80);
    setTimeout(function () {
        playTone(1047, 0.2, 'triangle', 0.12);
    }, 160);
}

// Moedas insuficientes (som de erro)
function soundError() {
    initAudio();
    playTone(200, 0.15, 'square', 0.1);
    setTimeout(function () {
        playTone(150, 0.25, 'square', 0.1);
    }, 150);
}

// Mover item (drop suave)
function soundDrop() {
    initAudio();
    playTone(330, 0.06, 'triangle', 0.08);
    setTimeout(function () {
        playTone(440, 0.08, 'triangle', 0.08);
    }, 60);
}

// Posição inválida (reject)
function soundReject() {
    initAudio();
    playTone(250, 0.1, 'sawtooth', 0.08);
    setTimeout(function () {
        playTone(200, 0.15, 'sawtooth', 0.08);
    }, 100);
}

// Passo do personagem
function soundStep() {
    initAudio();
    var freq = 180 + Math.random() * 60;
    playTone(freq, 0.04, 'triangle', 0.04);
}

// Click do botão "Jogar" na tela inicial
function soundPlay() {
    initAudio();
    playTone(440, 0.08, 'square', 0.1);
    setTimeout(function () {
        playTone(554, 0.08, 'square', 0.1);
    }, 80);
    setTimeout(function () {
        playTone(659, 0.08, 'square', 0.1);
    }, 160);
    setTimeout(function () {
        playTone(880, 0.25, 'square', 0.12);
    }, 240);
}