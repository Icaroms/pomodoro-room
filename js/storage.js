// ============================================
// STORAGE.JS — Salvar e Carregar dados do jogo
// ============================================
//
// O localStorage é como um "caderninho" do navegador.
// Ele guarda dados em pares: chave → valor
// Mesmo fechando o navegador, os dados continuam lá.
//
// REGRA IMPORTANTE: ele só guarda STRINGS (texto).
// Pra salvar objetos ou números, convertemos com JSON.
//


// --- FUNÇÃO: SALVAR DADO ---
// Recebe: chave (string) e valor (qualquer tipo)
// Exemplo: saveData('coins', 50)
// Exemplo: saveData('room', { items: ['bed', 'desk'] })

function saveData(key, value) {
    // JSON.stringify() converte qualquer coisa em string
    // Número 50          → string "50"
    // Objeto {a: 1}      → string '{"a":1}'
    // Array [1, 2, 3]    → string '[1,2,3]'
    const dataString = JSON.stringify(value);

    // localStorage.setItem(chave, valor) salva no navegador
    localStorage.setItem(key, dataString);
}


// --- FUNÇÃO: CARREGAR DADO ---
// Recebe: chave (string)
// Retorna: o valor salvo (já convertido de volta), ou null se não existir
// Exemplo: loadData('coins')  → retorna 50 (número, não string)

function loadData(key) {
    // localStorage.getItem(chave) busca o valor salvo
    // Se a chave não existir, retorna null
    const dataString = localStorage.getItem(key);

    // Se não existe, retorna null direto
    // (sem isso, JSON.parse(null) poderia causar problemas)
    if (dataString === null) {
        return null;
    }

    // JSON.parse() faz o caminho inverso do stringify:
    // String "50"        → Número 50
    // String '{"a":1}'   → Objeto {a: 1}
    // String '[1,2,3]'   → Array [1, 2, 3]
    return JSON.parse(dataString);
}


// --- FUNÇÃO: LIMPAR UM DADO ---
// Recebe: chave (string)
// Remove apenas aquela chave específica
// Exemplo: removeData('coins')  → apaga só as moedas

function removeData(key) {
    // localStorage.removeItem(chave) apaga um dado específico
    localStorage.removeItem(key);
}


// --- FUNÇÃO: LIMPAR TUDO DO JOGO ---
// Não recebe nada
// Apaga todos os dados salvos pelo jogo
//
// Em vez de usar localStorage.clear() (que apaga TUDO do navegador,
// inclusive dados de outros sites), vamos apagar só as nossas chaves.

function clearAllData() {
    // Lista de todas as chaves que o nosso jogo usa
    // Quando criar novas chaves no futuro, adicione aqui também
    const gameKeys = ['coins', 'room', 'shopItems'];

    // .forEach() percorre cada item do array e executa a função
    // É como um "for" mais limpo
    // Pra cada chave na lista → remove ela do localStorage
    gameKeys.forEach(function (key) {
        localStorage.removeItem(key);
    });
}