// ============================================
// ROOM.JS — Renderização do Quarto no Canvas
// ============================================
// Depende de: storage.js
//
// Este módulo desenha o quarto pixel art no <canvas>.
// O quarto é uma grid (grade) onde os itens comprados são posicionados.
//


// --- CONFIGURAÇÕES DO CANVAS ---

const canvas = document.getElementById('game-canvas');

// getContext('2d') nos dá acesso às funções de desenho 2D
// É como pegar o "pincel" do canvas
const ctx = canvas.getContext('2d');

// Tamanho de cada célula da grid (em pixels)
const TILE_SIZE = 48;

// Quantas colunas e linhas a grid tem
// Canvas é 480x480, então 480 / 48 = 10 células em cada direção
const GRID_COLS = canvas.width / TILE_SIZE;   // 10
const GRID_ROWS = canvas.height / TILE_SIZE;  // 10


// --- CORES DO QUARTO (pixel art) ---
// Definimos as cores aqui pra facilitar mudanças

const COLORS = {
    floor: '#5a4a3a',       // chão de madeira (marrom escuro)
    floorAlt: '#6b5b4b',    // chão alternado (marrom claro, efeito xadrez)
    wall: '#8b9bb4',        // parede (azul acinzentado)
    wallDark: '#7a8aa3',    // sombra da parede
    border: '#3a3a3a',      // borda das células
};

// --- CORES DOS ITENS ---
// Como ainda não temos sprites PNG, cada item é desenhado
// como um retângulo colorido com uma letra identificadora.
// Quando os sprites estiverem prontos, substituímos por imagens.

const ITEM_COLORS = {
    bed:      { bg: '#c0392b', label: 'CA' },  // vermelho
    desk:     { bg: '#8e6d47', label: 'ME' },   // marrom
    lamp:     { bg: '#f1c40f', label: 'LU' },   // amarelo
    plant:    { bg: '#27ae60', label: 'PL' },   // verde
    shelf:    { bg: '#8e44ad', label: 'ES' },    // roxo
    rug:      { bg: '#e67e22', label: 'TA' },    // laranja
    poster:   { bg: '#3498db', label: 'PO' },   // azul
    computer: { bg: '#2c3e50', label: 'PC' },   // cinza escuro
};


// --- POSIÇÕES PADRÃO DOS ITENS NO QUARTO ---
// Define onde cada item aparece na grid quando comprado
// { col: coluna, row: linha } (começando de 0)

const ITEM_POSITIONS = {
    bed:      { col: 1, row: 3 },
    desk:     { col: 6, row: 3 },
    lamp:     { col: 8, row: 3 },
    plant:    { col: 1, row: 7 },
    shelf:    { col: 4, row: 2 },
    rug:      { col: 4, row: 5 },
    poster:   { col: 3, row: 0 },
    computer: { col: 7, row: 4 },
};


// --- LISTA DE ITENS NO QUARTO ---
// Guarda quais itens estão atualmente no quarto
// Carrega do localStorage ou começa vazio

let roomItems = loadData('roomItems') || [];


// --- FUNÇÃO: DESENHAR O CHÃO ---
// Preenche a grid com um padrão xadrez (duas cores alternadas)

function drawFloor() {
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {

            // Alterna a cor: se (linha + coluna) for par → cor1, ímpar → cor2
            // Isso cria o efeito de piso xadrez
            const isEven = (row + col) % 2 === 0;
            ctx.fillStyle = isEven ? COLORS.floor : COLORS.floorAlt;

            // fillRect(x, y, largura, altura) desenha um retângulo preenchido
            // x e y são calculados multiplicando a posição pela tamanho do tile
            ctx.fillRect(
                col * TILE_SIZE,
                row * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }
}


// --- FUNÇÃO: DESENHAR AS PAREDES ---
// As 2 primeiras linhas da grid são a parede do fundo

function drawWalls() {
    for (let col = 0; col < GRID_COLS; col++) {
        // Primeira fileira — parede mais escura (sombra)
        ctx.fillStyle = COLORS.wallDark;
        ctx.fillRect(col * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);

        // Segunda fileira — parede principal
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(col * TILE_SIZE, TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}


// --- FUNÇÃO: DESENHAR UM ITEM ---
// Desenha um bloco colorido com uma sigla no centro
// Futuramente, aqui você substituirá por sprites (imagens)

function drawItem(itemId) {
    // Busca a posição e as cores do item
    const pos = ITEM_POSITIONS[itemId];
    const visual = ITEM_COLORS[itemId];

    // Se não encontrar posição ou cor, não desenha
    if (!pos || !visual) return;

    // Calcula a posição em pixels
    const x = pos.col * TILE_SIZE;
    const y = pos.row * TILE_SIZE;

    // Desenha o fundo do item (retângulo colorido)
    ctx.fillStyle = visual.bg;
    ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);

    // Desenha a borda do item
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);

    // Desenha a sigla do item no centro
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(visual.label, x + TILE_SIZE / 2, y + TILE_SIZE / 2);
}


// --- FUNÇÃO: DESENHAR O QUARTO COMPLETO ---
// Limpa o canvas e redesenha tudo do zero

function drawRoom() {
    // clearRect limpa todo o canvas (apaga tudo)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha as camadas na ordem correta (de baixo pra cima)
    drawFloor();
    drawWalls();

    // Desenha cada item que está no quarto
    roomItems.forEach(function (itemId) {
        drawItem(itemId);
    });
}


// --- FUNÇÃO: ADICIONAR ITEM AO QUARTO ---
// Chamada pelo shop.js quando o jogador compra um item

function addItemToRoom(item) {
    // Evita adicionar o mesmo item duas vezes
    if (roomItems.includes(item.id)) return;

    // Adiciona o id do item à lista
    roomItems.push(item.id);

    // Salva no localStorage
    saveData('roomItems', roomItems);

    // Redesenha o quarto com o novo item
    drawRoom();
}


// --- INICIALIZAÇÃO ---
// Desenha o quarto assim que a página carrega

drawRoom();