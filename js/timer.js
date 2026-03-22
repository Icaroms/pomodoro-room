// ============================================
// TIMER.JS — Lógica do Pomodoro (4 Rodadas)
// ============================================
//
// Regras do Pomodoro:
// - O jogador escolhe o tempo de foco (padrão 25min)
// - 4 rodadas por ciclo completo
// - Rodadas 1-3: descanso curto (5 min)
// - Rodada 4: descanso longo (15 min) e fim do ciclo
// - Cada rodada concluída = 10 moedas
//
// Status:
// - "☕ Live" → timer parado, sem atividade
// - "🔥 Focado" → rodada de trabalho em andamento
// - "🌿 Descansando" → intervalo em andamento
//


// --- CONSTANTES ---

const SHORT_BREAK = 5 * 60;    // 5 min em segundos
const LONG_BREAK = 15 * 60;    // 15 min em segundos
const TOTAL_ROUNDS = 4;
const COINS_REWARD = 10;        // moedas por rodada completa


// --- VARIÁVEIS DE ESTADO ---

let workDuration = 25 * 60;     // tempo de foco (configurável pelo jogador)
let timeRemaining = workDuration;
let intervalId = null;
let isRunning = false;
let isWorkMode = true;          // true = foco, false = descanso
let currentRound = 1;           // rodada atual (1 a 4)


// --- REFERÊNCIAS AOS ELEMENTOS DO HTML ---

const timerDisplay = document.getElementById('timer-display');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const timerStatus = document.getElementById('timer-status');
const roundDisplay = document.getElementById('round-display');
const workMinutesInput = document.getElementById('work-minutes');
const timerConfig = document.getElementById('timer-config');


// --- FUNÇÃO: FORMATAR TEMPO (segundos → "MM:SS") ---

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}


// --- FUNÇÃO: ATUALIZAR DISPLAYS ---

function updateDisplay() {
    timerDisplay.textContent = formatTime(timeRemaining);
}

function updateRoundDisplay() {
    roundDisplay.textContent = `Rodada: ${currentRound} / ${TOTAL_ROUNDS}`;
}

function updateStatus(status) {
    timerStatus.textContent = status;
}

function updateButtons() {
    btnStart.disabled = isRunning;
    btnPause.disabled = !isRunning;
}


// --- FUNÇÃO: INICIAR O TIMER ---

function startTimer() {
    if (isRunning) return;

    // Se é o início de uma rodada de trabalho, lê o tempo configurado
    if (isWorkMode && timeRemaining === workDuration) {
        const inputMinutes = parseInt(workMinutesInput.value);
        if (inputMinutes > 0 && inputMinutes <= 120) {
            workDuration = inputMinutes * 60;
            timeRemaining = workDuration;
            updateDisplay();
        }
    }

    // Esconde a configuração enquanto roda
    timerConfig.classList.add('hidden');

    isRunning = true;
    updateButtons();
    updateStatus(isWorkMode ? '🔥 Focado' : '🌿 Descansando');
    soundStart();

    intervalId = setInterval(function () {
        timeRemaining--;
        updateDisplay();

        if (timeRemaining <= 0) {
            finishCycle();
        }
    }, 1000);
}


// --- FUNÇÃO: PAUSAR O TIMER ---

function pauseTimer() {
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    updateButtons();
    btnStart.disabled = false;
    soundPause();
}


// --- FUNÇÃO: RESETAR O TIMER ---

function resetTimer() {
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;

    // Reseta tudo pro estado inicial
    isWorkMode = true;
    currentRound = 1;

    // Lê o valor atual do input
    const inputMinutes = parseInt(workMinutesInput.value);
    if (inputMinutes > 0 && inputMinutes <= 120) {
        workDuration = inputMinutes * 60;
    }
    timeRemaining = workDuration;

    // Mostra a configuração novamente
    timerConfig.classList.remove('hidden');

    updateDisplay();
    updateRoundDisplay();
    updateStatus('☕ Live');
    updateButtons();
}


// --- FUNÇÃO: FINALIZAR CICLO (quando chega em 00:00) ---

function finishCycle() {
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;

    if (isWorkMode) {
        addCoins(COINS_REWARD);
        soundCoins();

        if (currentRound >= TOTAL_ROUNDS) {
            soundComplete();
            alert(`🎉 Rodada ${currentRound} completa! +${COINS_REWARD} moedas!\nDescanso longo de 15 minutos.`);

            isWorkMode = false;
            timeRemaining = LONG_BREAK;
            updateStatus('🌿 Descansando (longo)');

        } else {
            soundComplete();
            alert(`✅ Rodada ${currentRound} completa! +${COINS_REWARD} moedas!\nDescanso de 5 minutos.`);

            isWorkMode = false;
            timeRemaining = SHORT_BREAK;
            updateStatus('🌿 Descansando');
        }

    } else {
        // --- Acabou o DESCANSO ---

        if (currentRound >= TOTAL_ROUNDS) {
            soundCycleComplete();
            alert('🏆 Pomodoro completo! Todas as 4 rodadas finalizadas!');

            isWorkMode = true;
            currentRound = 1;
            timeRemaining = workDuration;
            timerConfig.classList.remove('hidden');
            updateStatus('☕ Live');

        } else {
            // Próxima rodada
            currentRound++;
            isWorkMode = true;
            timeRemaining = workDuration;
            updateStatus('☕ Live');
            timerConfig.classList.remove('hidden');
        }
    }

    updateDisplay();
    updateRoundDisplay();
    updateButtons();
}


// --- EVENT LISTENERS ---

btnStart.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnReset.addEventListener('click', resetTimer);

// Atualiza o display quando o jogador muda o tempo no input
workMinutesInput.addEventListener('change', function () {
    if (!isRunning && isWorkMode) {
        const inputMinutes = parseInt(workMinutesInput.value);
        if (inputMinutes > 0 && inputMinutes <= 120) {
            workDuration = inputMinutes * 60;
            timeRemaining = workDuration;
            updateDisplay();
        }
    }
});


// --- INICIALIZAÇÃO ---

updateDisplay();
updateRoundDisplay();
updateStatus('☕ Live');