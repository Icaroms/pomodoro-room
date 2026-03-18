// ============================================
// STORAGE.JS — Salvar e Carregar dados do jogo
// ============================================
//
// Este módulo é responsável por persistir (salvar) o estado do jogo
// mesmo quando o jogador fecha o navegador.
//
// Pesquise na MDN: localStorage, JSON.stringify(), JSON.parse()
//

// --- FUNÇÃO: SALVAR DADO ---
// Recebe: uma chave (string) e um valor (qualquer tipo)
// O que faz: salva o valor no localStorage
//
// ATENÇÃO: o localStorage só guarda STRINGS!
// Se você quiser salvar um objeto ou array, precisa converter
// pra string antes usando JSON.stringify()
//
// Exemplo de uso futuro:
//   saveData('coins', 50)
//   saveData('room', { items: [...] })
function saveData(key, value) {
    try {
        const jsonData = JSON.stringify(value); // Converte o valor para string JSON
        localStorage.setItem(key, jsonData); // Salva no localStorage
    } catch (error) {
        console.error("Erro ao salvar dados:", error);

    }
}

// --- FUNÇÃO: CARREGAR DADO ---
// Recebe: uma chave (string)
// Retorna: o valor salvo, ou null se não existir
//
// ATENÇÃO: como o localStorage salva tudo como string,
// você precisa converter de volta usando JSON.parse()
//
// Cuidado: se a chave não existir, localStorage.getItem()
// retorna null. Trate esse caso!
//
// Exemplo de uso futuro:
//   const coins = loadData('coins')    → retorna 50
//   const room = loadData('room')      → retorna { items: [...] }
//   const nada = loadData('inexiste')  → retorna null

function loadData(key) {
    try {
        const jsonData = localStorage.getItem(key); // Carrega do localStorage
        return jsonData ? JSON.parse(jsonData) : null; // Converte de volta para objeto
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        return null;
    }
}

// --- FUNÇÃO: LIMPAR UM DADO ---
// Recebe: uma chave (string)
// O que faz: remove aquela chave do localStorage
//
// Pesquise: localStorage.removeItem()
//
// Útil se o jogador quiser resetar o progresso
function clearData(key) {
    try {
        localStorage.removeItem(key); // Remove a chave do localStorage
    } catch (error) {
        console.error("Erro ao limpar dados:", error);
    }
}

// --- FUNÇÃO: LIMPAR TUDO ---
// Não recebe nada
// O que faz: apaga TODOS os dados salvos do jogo
//
// Pesquise: localStorage.clear()
//
// ⚠️  Use com cuidado — apaga TUDO, não só do seu jogo
// Uma alternativa mais segura: limpar só as chaves que
// você criou, uma por uma
function clearAllData() {
    try {
        localStorage.clear(); // Limpa todo o localStorage
    } catch (error) {
        console.error("Erro ao limpar todos os dados:", error);
    }
}