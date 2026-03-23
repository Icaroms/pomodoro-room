/**
 * TIMER.JS — Pomodoro com 4 rodadas
 * 
 * Regras:
 * - Jogador escolhe o tempo de foco (padrão 25min)
 * - 4 rodadas por ciclo completo
 * - Rodadas 1-3: descanso curto (5 min)
 * - Rodada 4: descanso longo (15 min), encerra o ciclo
 * - Cada rodada concluída = 10 moedas
 * 
 * Status: ☕ Livre | 🔥 Focado | 🌿 Descansando
 * 
 * Depende de: coins.js, sound.js, room.js (startWorking/stopWorking)
 */

var SHORT_BREAK = 5 * 60;
var LONG_BREAK = 15 * 60;
var TOTAL_ROUNDS = 4;
var COINS_REWARD = 10;

var workDuration = 25 * 60;
var timeRemaining = workDuration;
var intervalId = null;
var isRunning = false;
var isWorkMode = true;
var currentRound = 1;

// --- Elementos do HTML ---
var timerDisplay = document.getElementById('timer-display');
var btnStart = document.getElementById('btn-start');
var btnPause = document.getElementById('btn-pause');
var btnReset = document.getElementById('btn-reset');
var timerStatus = document.getElementById('timer-status');
var roundDisplay = document.getElementById('round-display');
var workMinutesInput = document.getElementById('work-minutes');
var timerConfig = document.getElementById('timer-config');

// --- Funções de atualização visual ---

function formatTime(totalSeconds) {
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function updateDisplay() { timerDisplay.textContent = formatTime(timeRemaining); }
function updateRoundDisplay() { roundDisplay.textContent = 'Rodada: ' + currentRound + ' / ' + TOTAL_ROUNDS; }
function updateStatus(status) { timerStatus.textContent = status; }
function updateButtons() { btnStart.disabled = isRunning; btnPause.disabled = !isRunning; }

// --- Controles ---

function startTimer() {
    if (isRunning) return;
    if (isSleeping()) { alert('💤 Acorde primeiro para iniciar o foco!'); return; }

    // Lê tempo configurado no início de cada rodada de trabalho
    if (isWorkMode && timeRemaining === workDuration) {
        var min = parseInt(workMinutesInput.value);
        if (min > 0 && min <= 120) {
            workDuration = min * 60;
            timeRemaining = workDuration;
            updateDisplay();
        }
    }

    timerConfig.classList.add('hidden');
    isRunning = true;
    updateButtons();
    updateStatus(isWorkMode ? '🔥 Focado' : '🌿 Descansando');
    soundStart();
    if (isWorkMode) startWorking();

    intervalId = setInterval(function () {
        timeRemaining--;
        updateDisplay();
        if (timeRemaining <= 0) finishCycle();
    }, 1000);
}

function pauseTimer() {
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    updateButtons();
    btnStart.disabled = false;
    soundPause();
    stopWorking();
}

function resetTimer() {
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    isWorkMode = true;
    currentRound = 1;

    var min = parseInt(workMinutesInput.value);
    if (min > 0 && min <= 120) workDuration = min * 60;
    timeRemaining = workDuration;

    timerConfig.classList.remove('hidden');
    updateDisplay();
    updateRoundDisplay();
    updateStatus('☕ Livre');
    updateButtons();
    stopWorking();
}

/** Chamada automaticamente quando o timer chega a 00:00 */
function finishCycle() {
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    stopWorking();

    if (isWorkMode) {
        // Rodada de foco concluída
        addCoins(COINS_REWARD);
        soundCoins();

        if (currentRound >= TOTAL_ROUNDS) {
            // Última rodada → descanso longo
            soundComplete();
            alert('🎉 Rodada ' + currentRound + ' completa! +' + COINS_REWARD + ' moedas!\nDescanso longo de 15 minutos.');
            isWorkMode = false;
            timeRemaining = LONG_BREAK;
            updateStatus('🌿 Descansando (longo)');
        } else {
            // Rodadas 1-3 → descanso curto
            soundComplete();
            alert('✅ Rodada ' + currentRound + ' completa! +' + COINS_REWARD + ' moedas!\nDescanso de 5 minutos.');
            isWorkMode = false;
            timeRemaining = SHORT_BREAK;
            updateStatus('🌿 Descansando');
        }
    } else {
        // Descanso concluído
        if (currentRound >= TOTAL_ROUNDS) {
            // Ciclo completo
            soundCycleComplete();
            alert('🏆 Pomodoro completo! Todas as 4 rodadas finalizadas!');
            isWorkMode = true;
            currentRound = 1;
            timeRemaining = workDuration;
            timerConfig.classList.remove('hidden');
            updateStatus('☕ Livre');
        } else {
            // Próxima rodada
            currentRound++;
            isWorkMode = true;
            timeRemaining = workDuration;
            updateStatus('☕ Livre');
            timerConfig.classList.remove('hidden');
        }
    }

    updateDisplay();
    updateRoundDisplay();
    updateButtons();
}

// --- Event Listeners ---
btnStart.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnReset.addEventListener('click', resetTimer);

workMinutesInput.addEventListener('change', function () {
    if (!isRunning && isWorkMode) {
        var min = parseInt(workMinutesInput.value);
        if (min > 0 && min <= 120) {
            workDuration = min * 60;
            timeRemaining = workDuration;
            updateDisplay();
        }
    }
});

// --- Inicialização ---
updateDisplay();
updateRoundDisplay();
updateStatus('☕ Livre');