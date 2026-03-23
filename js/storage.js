/**
 * STORAGE.JS — Persistência de dados via localStorage
 * 
 * Responsável por salvar e carregar o estado do jogo.
 * O localStorage armazena apenas strings, então usamos
 * JSON.stringify/parse para converter objetos e números.
 */

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadData(key) {
    var data = localStorage.getItem(key);
    if (data === null) return null;
    return JSON.parse(data);
}

function removeData(key) {
    localStorage.removeItem(key);
}

/** Remove apenas as chaves do jogo (não afeta outros sites) */
function clearAllData() {
    var gameKeys = ['coins', 'roomItems', 'itemPositions', 'purchasedItems', 'playerPosition'];
    gameKeys.forEach(function (key) {
        localStorage.removeItem(key);
    });
}