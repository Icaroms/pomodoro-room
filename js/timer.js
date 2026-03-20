// ============================================
// TIMER.JS — Lógica do Pomodoro
// ============================================


// --- VARIÁVEIS DE ESTADO ---
// Guardam a situação atual do timer a todo momento

const WORK_DURATION = 25 * 60;   // 25 minutos em segundos (1500)
const BREAK_DURATION = 5 * 60;   // 5 minutos em segundos (300)

let timeRemaining = WORK_DURATION; // tempo restante (começa em 25min)
let intervalId = null;             // guarda o id do setInterval (null = nenhum rodando)
let isRunning = false;             // o timer está rodando?
let isWorkMode = true;             // true = trabalho, false = descanso


// --- REFERÊNCIAS AOS ELEMENTOS DO HTML ---
// document.getElementById() busca um elemento pelo seu id no HTML
// Guardamos em variáveis pra não precisar buscar toda hora (performance)

const timerDisplay = document.getElementById('timer-display');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const timerStatus = document.getElementById('timer-status');


// --- FUNÇÃO: FORMATAR TEMPO ---
// Recebe: número total de segundos (ex: 1500, 62, 5)
// Retorna: string formatada "MM:SS" (ex: "25:00", "01:02", "00:05")

function formatTime(totalSeconds) {
    // Math.floor() arredonda pra baixo
    // Ex: Math.floor(62 / 60) = Math.floor(1.03) = 1
    const minutes = Math.floor(totalSeconds / 60);

    // O operador % (módulo) retorna o RESTO da divisão
    // Ex: 62 % 60 = 2 (sobram 2 segundos)
    const seconds = totalSeconds % 60;

    // String() converte número em texto
    // .padStart(2, '0') garante que tenha pelo menos 2 caracteres,
    // preenchendo com '0' na frente se necessário
    // Ex: String(5).padStart(2, '0') = "05"
    // Ex: String(25).padStart(2, '0') = "25" (já tem 2, não muda)
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');

    // Template literal (crase + ${}) junta as partes
    return `${minutesStr}:${secondsStr}`;
}


// --- FUNÇÃO: ATUALIZAR O DISPLAY ---
// Pega o tempo atual e mostra na tela

function updateDisplay() {
    // .textContent altera o texto visível de um elemento HTML
    // Aqui pegamos o tempo formatado e jogamos no <div id="timer-display">
    timerDisplay.textContent = formatTime(timeRemaining);
}


// --- FUNÇÃO: ATUALIZAR ESTADO DOS BOTÕES ---
// Centraliza a lógica de habilitar/desabilitar botões
// Assim não repetimos código em cada função

function updateButtons() {
    // .disabled = true  → botão fica cinza e não clicável
    // .disabled = false → botão fica ativo e clicável
    btnStart.disabled = isRunning;
    btnPause.disabled = !isRunning;
}


// --- FUNÇÃO: INICIAR O TIMER ---

function startTimer() {
    // TRAVA DE SEGURANÇA: se já está rodando, não faz nada
    // Isso evita o bug clássico de criar múltiplos setInterval
    if (isRunning) return;

    isRunning = true;
    updateButtons();

    // setInterval(função, tempo_em_ms)
    // Executa a função repetidamente a cada X milissegundos
    // Retorna um id numérico que usamos pra cancelar depois
    intervalId = setInterval(function () {
        // Subtrai 1 segundo
        timeRemaining--;

        // Atualiza o que o jogador vê
        updateDisplay();

        // Chegou a zero? Finaliza o ciclo
        if (timeRemaining <= 0) {
            finishCycle();
        }
    }, 1000); // 1000ms = 1 segundo
}


// --- FUNÇÃO: PAUSAR O TIMER ---

function pauseTimer() {
    // clearInterval(id) cancela um setInterval que está rodando
    // O timer "congela" — o tempo NÃO reseta, apenas para de contar
    clearInterval(intervalId);
    intervalId = null;

    isRunning = false;
    updateButtons();

    // Reativa o botão iniciar pra que o jogador possa retomar
    btnStart.disabled = false;
}


// --- FUNÇÃO: RESETAR O TIMER ---

function resetTimer() {
    // Para qualquer contagem em andamento
    clearInterval(intervalId);
    intervalId = null;

    isRunning = false;

    // Volta pro tempo inicial do modo atual
    // O operador ternário (condição ? valorSeTrue : valorSeFalse)
    // é um "if" resumido em uma linha
    // Se isWorkMode for true  → usa WORK_DURATION (1500)
    // Se isWorkMode for false → usa BREAK_DURATION (300)
    timeRemaining = isWorkMode ? WORK_DURATION : BREAK_DURATION;

    updateDisplay();
    updateButtons();
}


// --- FUNÇÃO: FINALIZAR CICLO (quando chega em 00:00) ---

function finishCycle() {
    // Para o intervalo
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;

    if (isWorkMode) {
        // --- Acabou o TRABALHO ---

        // TODO: Chamar função de adicionar moedas (coins.js)
        // Quando o coins.js estiver pronto, descomente a linha abaixo:
        // addCoins(10);

        // Avisa o jogador
        alert('Pomodoro completo! Você ganhou moedas! Hora do descanso.');

        // Muda pra modo descanso
        isWorkMode = false;
        timeRemaining = BREAK_DURATION;
        timerStatus.textContent = 'Modo: Descanso';

    } else {
        // --- Acabou o DESCANSO ---

        alert('Descanso acabou! Bora trabalhar!');

        // Volta pra modo trabalho
        isWorkMode = true;
        timeRemaining = WORK_DURATION;
        timerStatus.textContent = 'Modo: Trabalho';
    }

    // Atualiza a tela com o novo tempo
    updateDisplay();
    updateButtons();
}


// --- EVENT LISTENERS ---
// addEventListener('click', função) faz a função ser chamada
// toda vez que o botão for clicado
//
// É a "ponte" entre o HTML (o que o jogador vê e clica)
// e o JavaScript (a lógica que roda por trás)

btnStart.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnReset.addEventListener('click', resetTimer);


// --- INICIALIZAÇÃO ---
// Atualiza o display uma vez ao carregar a página
// Assim o jogador já vê "25:00" desde o início
// (sem isso, apareceria o texto fixo do HTML)

updateDisplay();