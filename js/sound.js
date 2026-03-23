/**
 * SOUND.JS — Efeitos sonoros 8-bit
 * 
 * Sons gerados via Web Audio API usando osciladores.
 * Tipos de onda: square (clássico 8-bit), triangle (suave), sawtooth (áspero).
 * Não requer arquivos de áudio externos.
 */

var audioCtx = null;

/** Inicializa o AudioContext (requer interação do usuário) */
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

/** Toca uma nota com frequência, duração, tipo de onda e volume */
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

/** Moedas ganhas — 3 notas subindo (C5 → E5 → G5) */
function soundCoins() {
    initAudio();
    playTone(523, 0.12, 'square', 0.12);
    setTimeout(function () { playTone(659, 0.12, 'square', 0.12); }, 80);
    setTimeout(function () { playTone(784, 0.2, 'square', 0.12); }, 160);
}

/** Timer iniciado — bip ascendente */
function soundStart() {
    initAudio();
    playTone(440, 0.1, 'square', 0.1);
    setTimeout(function () { playTone(880, 0.15, 'square', 0.1); }, 100);
}

/** Timer pausado — bip descendente */
function soundPause() {
    initAudio();
    playTone(660, 0.1, 'triangle', 0.1);
    setTimeout(function () { playTone(440, 0.15, 'triangle', 0.1); }, 100);
}

/** Rodada completa — fanfarra curta */
function soundComplete() {
    initAudio();
    playTone(523, 0.12, 'square', 0.12);
    setTimeout(function () { playTone(659, 0.12, 'square', 0.12); }, 120);
    setTimeout(function () { playTone(784, 0.12, 'square', 0.12); }, 240);
    setTimeout(function () { playTone(1047, 0.3, 'square', 0.15); }, 360);
}

/** Ciclo completo (4 rodadas) — fanfarra longa */
function soundCycleComplete() {
    initAudio();
    [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (freq, i) {
        setTimeout(function () { playTone(freq, 0.15, 'square', 0.12); }, i * 100);
    });
}

/** Compra na loja */
function soundPurchase() {
    initAudio();
    playTone(880, 0.08, 'square', 0.1);
    setTimeout(function () { playTone(698, 0.08, 'square', 0.1); }, 80);
    setTimeout(function () { playTone(1047, 0.2, 'triangle', 0.12); }, 160);
}

/** Moedas insuficientes — som de erro */
function soundError() {
    initAudio();
    playTone(200, 0.15, 'square', 0.1);
    setTimeout(function () { playTone(150, 0.25, 'square', 0.1); }, 150);
}

/** Item solto em posição válida */
function soundDrop() {
    initAudio();
    playTone(330, 0.06, 'triangle', 0.08);
    setTimeout(function () { playTone(440, 0.08, 'triangle', 0.08); }, 60);
}

/** Item solto em posição inválida */
function soundReject() {
    initAudio();
    playTone(250, 0.1, 'sawtooth', 0.08);
    setTimeout(function () { playTone(200, 0.15, 'sawtooth', 0.08); }, 100);
}

/** Passo do personagem — frequência levemente aleatória */
function soundStep() {
    initAudio();
    playTone(180 + Math.random() * 60, 0.04, 'triangle', 0.04);
}

/** Botão "Jogar" — fanfarra de abertura */
function soundPlay() {
    initAudio();
    playTone(440, 0.08, 'square', 0.1);
    setTimeout(function () { playTone(554, 0.08, 'square', 0.1); }, 80);
    setTimeout(function () { playTone(659, 0.08, 'square', 0.1); }, 160);
    setTimeout(function () { playTone(880, 0.25, 'square', 0.12); }, 240);
}