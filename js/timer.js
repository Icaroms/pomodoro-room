// ============================================
// TIMER.JS — Lógica do Pomodoro
// ============================================
 
// --- VARIÁVEIS DE ESTADO ---
// Guardam a situação atual do timer a todo momento

// Variáveis const
const WORK_DURATION = 25 * 60; // 25 minutos em segundos(1500)
const BREAK_DURATION = 5 * 60; // 5 minutos em segundos (300)

// Variáveis let
let timeRemaining = WORK_DURATION; // Tempo restante(Começa em 25 minutos)
let intervalId = null; // Guarda o ID do setInterval(null = nenhum rodando)
let isRunning = false; // o timer está rodando?
let isWorkMode = true; // true = trabalho, false = descanso

// --- REFERÊNCIAS AOS ELEMENTOS DO HTML ---
// document.getElementById() busca um elemento pelo seu id no HTML
// Guardamos em variáveis pra não precisar buscar toda hora (performance)
const timerDisplay = document.getElementById('timer-display');
const btnstart = document.getElementById('btn-start');
const btnpause = document.getElementById('btn-pause');
const btnreset = document.getElementById('btn-reset');
const timerStatus = document.getElementById('timer-status');

// --- FUNÇÃO: FORMATAR TEMPO ---
// Recebe: número total de segundos (ex: 1500, 62, 5)
// Retorna: string formatada "MM:SS" (ex: "25:00", "01:02", "00:05")
function formatTime(totalSeconds) {
    // Math.floor() arredonda para  baixo
    //ex: Math.floor(62/60) = Math.floor(1.03) = 1
    const minutes = Math.floor(totalSeconds / 60);

    // O operador %(módulo) retorna o resto da divisão
    // 62 % 60 = 2 (sobram 2 segundos)
    const seconds = totalSeconds % 60;

    // String() converte o número em texto
    // .padStart(2, '0') garante que tenha pelo menos 2 caracteres,
    // preenchendo com '0' na frente se necessário
    // Ex: String(5).padStart(2, '0') = "05"  
    // Ex: String(5).padStart(2, '0') = "25"(já tem 2, não muda)
    const minutesStr = String(minutes).padStart(2, '0');  
    const secondsStr = String(seconds).padStart(2, '0');
    
    // Template literal(crase + ${}) junta as partes
    return `${minutesStr}:${secondsStr}`;
}

// --- FUNÇÃO: ATUALIZAR O DISPLAY ---
// Pega o tempo atual e mostra na tela
function updateDisplay() {
    // .textContent altera o texto visível de um elemento HTML
    // Aqui pegamos o tempo formatado e jogamos no <div id="timer-display">
    timerDisplay.textContent = formatTimer(timeRemaining);
}

// --- FUNÇÃO: ATUALIZAR ESTADO DOS BOTÕES ---
// Centraliza a lógica de habilitar/desabilitar botões
// Assim não repetimos código em cada função
function updateButtons() {
    // .disable = true -> botão fica cinza e não clicável
    // .disable = false -> botão fica ativo e clicável
    btnstart.disabled = isRunning;
    btnpause.disabled = isRunning;
}

// --- FUNÇÃO: INICIAR O TIMER ---
function startTimer() {
    // TRAVA DE SEGURANÇA: se já está rodando, não faz nada
    // Isso evita o bug clássico de criar múltiplos setInterval
    if (isRunning) return;

    isRunning = true;
    updateButtons();

    // setInterval(função, tempo_em_ms)
    // Executa a função repetidamente a cada X milisegundos
    // Retorna um id númerico que usamos para cancelar depois
    intervalId = setInterval(function() {
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
    // clearInterval(id) cancela o setInterval que está rodando
    // O timer "congela" - o tempo NÃO reseta,  apenas para de contar
    clearInterval(intervalId);
    intervalId = null;

    isRunning = false;
    updateButtons();

    // Reativa o botão iniciar pra que o jogador possa retomar
    btnstart.disabled = false;
}

// --- FUNÇÃO: RESETAR O TIMER ---
function resetTimer() {
    // Para qualquer contagem em andamento
    clearInterval(intervalId);
    intervalId = null;

    isRunning = false;

    // Volta para o tempo inicial do modo atual
    // O operador ternário(condição ? valorSetTrue : valorSeFalse)
    // É um 'if' resumido em uma linha
    // Se isWorkMode for true -> usa WORK_DURATION(1500)
    // Se isWorkdMode for false -> usa BREAK_DURATION(300)
    timeRemaining = isWorkMode ? WORK_DURATION : BREAK_DURATION;

    updateDisplay();
    updateButtons();
}

// --- FUNÇÃO: FINALIZAR CICLO(quando chega em 00:00) ---
function finishCycle() {
    // Para intervalo
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;

    if (isWorkMode) {
        // --- Acabou o TRABALHO --- 
        // TODO: Chamar a função de adicionar moedas(coins.js)
        // Quando o coins.js estiver pronto, descomente a linha abaixo
        // addCoins(10);

        // avisa o Jogador
        alert('Pomodoro Completo! Você ganhou moedas! Hora do Descanso.')

        // Muda para modo descanso
        isWorkMode = false;
        timeRemaining = BREAK_DURATION;
        timerStatus.textContent = 'Modo Descanso';
        
    } else {
        // --- Acabou o DESCANSO ---
        alert('Descanso acabou! Bora trabalhar!');

        // volta para o modo trabalho
        isWorkMode = true;
        timeRemaining = WORK_DURATION;
        timerStatus.textContent = 'Modo: Trabalho';
    }

    // Atualiza a tela com o novo tempo
    updateDisplay();
    updateButtons();
}

// --- EVENT LISTENERS ---
// addEventoListener('click', função) faz a função ser chamada
// toda vez que o botão for clicado
// É a 'ponte' entre o HTML(O que o Jogador vê e clica)
// E o Javascript(A lógica que roda por trás)
btnStart.addEvetListener('click', startTime);
btnPause.addEvetListener('click', pauseTime);
btnReset.addEvetListener('click', resetTime);

// --- INICIALIZAÇÃO ---
// Atualiza o display uma vez ao carregar a página
// Assim o jogador já vê '25:00' desde o início
// (Sem isso, apareceria o texto fixo do HTML)
updateDisplay();