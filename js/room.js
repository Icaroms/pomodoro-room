// ============================================
// ROOM.JS — Renderização do Quarto no Canvas
// ============================================
// Depende de: storage.js
//
// Canvas 600x600, tiles 100px = grid 6x6
// Personagem controlável por WASD / Setas
// Drag and drop dos itens
//


// --- CONFIGURAÇÕES DO CANVAS ---

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const TILE_SIZE = 100;
const GRID_COLS = canvas.width / TILE_SIZE;   // 6
const GRID_ROWS = canvas.height / TILE_SIZE;  // 6
const ITEM_SIZE = 100;
const WALL_ROWS = 1;


// --- ITENS PADRÃO (sempre presentes) ---

const DEFAULT_ITEMS = ['bed', 'chair', 'desk'];


// --- ITENS COMPRADOS ---

let shopItems = loadData('roomItems') || [];


// --- POSIÇÕES DOS ITENS (grid 6x6) ---

const DEFAULT_POSITIONS = {
    bed:      { col: 0, row: 1 },
    desk:     { col: 4, row: 1 },
    chair:    { col: 4, row: 2 },
    lamp:     { col: 5, row: 1 },
    plant:    { col: 0, row: 5 },
    shelf:    { col: 2, row: 1 },
    rug:      { col: 2, row: 3 },
    poster:   { col: 1, row: 0 },
    computer: { col: 3, row: 2 },
};

let itemPositions = loadData('itemPositions') || {};

function ensurePositions() {
    const allItems = DEFAULT_ITEMS.concat(shopItems);
    allItems.forEach(function (id) {
        if (!itemPositions[id] && DEFAULT_POSITIONS[id]) {
            itemPositions[id] = {
                col: DEFAULT_POSITIONS[id].col,
                row: DEFAULT_POSITIONS[id].row,
            };
        }
    });
}


// ============================================
// PERSONAGEM
// ============================================

const player = {
    col: 3,
    row: 3,
    size: 40,           // tamanho do personagem em pixels (menor que o tile)
    color: '#ff6b6b',
    eyeColor: '#ffffff',
    pupilColor: '#1a1a2e',
    direction: 'down',  // direção que está olhando
};

// Carrega posição salva do personagem
const savedPlayer = loadData('playerPosition');
if (savedPlayer) {
    player.col = savedPlayer.col;
    player.row = savedPlayer.row;
}

// Animação suave de movimento
let playerAnimating = false;
let playerPixelX = player.col * TILE_SIZE + (TILE_SIZE - player.size) / 2;
let playerPixelY = player.row * TILE_SIZE + (TILE_SIZE - player.size) / 2;
let playerTargetX = playerPixelX;
let playerTargetY = playerPixelY;
const PLAYER_SPEED = 8; // pixels por frame de animação


// --- SISTEMA DE CARREGAMENTO DE SPRITES ---

const sprites = {};

function loadImage(name, path) {
    return new Promise(function (resolve) {
        const img = new Image();
        img.onload = function () {
            sprites[name] = img;
            resolve();
        };
        img.onerror = function () {
            resolve();
        };
        img.src = path;
    });
}

function loadAllSprites() {
    const spritesToLoad = [
        { name: 'floor',      path: 'assets/sprites/Piso_Madeira.png' },
        { name: 'wall',       path: 'assets/sprites/Parede_Simples.png' },
        { name: 'floor_alt',  path: 'assets/sprites/Piso_Madeira_Alt.png' },
        { name: 'wall_alt',   path: 'assets/sprites/Parede_Simples_Alt.png' },
        { name: 'bed',        path: 'assets/sprites/Cama_Padrão.png' },
        { name: 'desk',       path: 'assets/sprites/Mesa_Madeira.png' },
        { name: 'chair',      path: 'assets/sprites/Cadeira_Madeira.png' },
        { name: 'lamp',       path: 'assets/sprites/lamp.png' },
        { name: 'plant',      path: 'assets/sprites/plant.png' },
        { name: 'shelf',      path: 'assets/sprites/shelf.png' },
        { name: 'rug',        path: 'assets/sprites/rug.png' },
        { name: 'poster',     path: 'assets/sprites/poster.png' },
        { name: 'computer',   path: 'assets/sprites/computer.png' },
        { name: 'player',     path: 'assets/sprites/player.png' },
    ];

    return Promise.all(spritesToLoad.map(function (s) {
        return loadImage(s.name, s.path);
    }));
}


// --- CORES FALLBACK ---

const ITEM_FALLBACK = {
    bed:      { bg: '#c0392b', label: 'CA' },
    desk:     { bg: '#8e6d47', label: 'ME' },
    chair:    { bg: '#a0522d', label: 'CD' },
    lamp:     { bg: '#f1c40f', label: 'LU' },
    plant:    { bg: '#27ae60', label: 'PL' },
    shelf:    { bg: '#8e44ad', label: 'ES' },
    rug:      { bg: '#e67e22', label: 'TA' },
    poster:   { bg: '#3498db', label: 'PO' },
    computer: { bg: '#2c3e50', label: 'PC' },
};


// --- ILUMINAÇÃO ---

function isLightOn() {
    return shopItems.includes('lamp');
}


// --- DESENHAR CHÃO ---

function drawFloor() {
    const floorSprite = isLightOn() ? sprites['floor'] : sprites['floor_alt'];

    for (let row = WALL_ROWS; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            if (floorSprite) {
                ctx.drawImage(floorSprite, x, y, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = isLightOn() ? '#6b5030' : '#3a2040';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}


// --- DESENHAR PAREDES ---

function drawWalls() {
    const wallSprite = isLightOn() ? sprites['wall'] : sprites['wall_alt'];

    for (let row = 0; row < WALL_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            if (wallSprite) {
                ctx.drawImage(wallSprite, x, y, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = isLightOn() ? '#a08870' : '#5a3060';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    ctx.fillStyle = isLightOn() ? '#4a3018' : '#1a0820';
    ctx.fillRect(0, WALL_ROWS * TILE_SIZE, canvas.width, 4);
}


// --- DESENHAR UM ITEM ---

function drawItem(itemId, pixelX, pixelY) {
    const pos = itemPositions[itemId];
    if (!pos && pixelX === undefined) return;

    const x = (pixelX !== undefined) ? pixelX : pos.col * TILE_SIZE;
    const y = (pixelY !== undefined) ? pixelY : pos.row * TILE_SIZE;

    if (sprites[itemId]) {
        ctx.drawImage(sprites[itemId], x, y, ITEM_SIZE, ITEM_SIZE);
    } else {
        const fallback = ITEM_FALLBACK[itemId];
        if (!fallback) return;

        ctx.fillStyle = '#00000044';
        ctx.fillRect(x + 8, y + 8, ITEM_SIZE - 12, ITEM_SIZE - 12);

        ctx.fillStyle = fallback.bg;
        ctx.fillRect(x + 4, y + 4, ITEM_SIZE - 12, ITEM_SIZE - 12);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, ITEM_SIZE - 12, ITEM_SIZE - 12);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fallback.label, x + ITEM_SIZE / 2, y + ITEM_SIZE / 2);
    }

    if (!isLightOn()) {
        ctx.fillStyle = 'rgba(20, 10, 30, 0.3)';
        ctx.fillRect(x, y, ITEM_SIZE, ITEM_SIZE);
    }
}


// --- DESENHAR O PERSONAGEM ---
// Fallback: um bonequinho pixel art desenhado com retângulos
// Se tiver sprite player.png, usa ele

function drawPlayer() {
    const x = playerPixelX;
    const y = playerPixelY;
    const s = player.size;

    if (sprites['player']) {
        ctx.drawImage(sprites['player'], x - 4, y - 4, s + 8, s + 8);
        return;
    }

    // === FALLBACK: Personagem pixel art desenhado no código ===

    // Sombra no chão
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x + s / 2, y + s - 2, s / 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo (retângulo principal)
    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(x + 8, y + 16, s - 16, s - 22);

    // Cabeça
    ctx.fillStyle = player.color;
    ctx.fillRect(x + 10, y + 2, s - 20, 18);

    // Olhos (mudam conforme a direção)
    ctx.fillStyle = player.eyeColor;

    if (player.direction === 'left') {
        ctx.fillRect(x + 12, y + 8, 5, 5);
        ctx.fillRect(x + 20, y + 8, 5, 5);
        ctx.fillStyle = player.pupilColor;
        ctx.fillRect(x + 12, y + 9, 3, 3);
        ctx.fillRect(x + 20, y + 9, 3, 3);
    } else if (player.direction === 'right') {
        ctx.fillRect(x + 16, y + 8, 5, 5);
        ctx.fillRect(x + 24, y + 8, 5, 5);
        ctx.fillStyle = player.pupilColor;
        ctx.fillRect(x + 18, y + 9, 3, 3);
        ctx.fillRect(x + 26, y + 9, 3, 3);
    } else if (player.direction === 'up') {
        // De costas — sem olhos visíveis, mostra cabelo
        ctx.fillStyle = '#d35400';
        ctx.fillRect(x + 10, y + 2, s - 20, 10);
    } else {
        // Olhando pra frente (down)
        ctx.fillRect(x + 14, y + 8, 5, 5);
        ctx.fillRect(x + 22, y + 8, 5, 5);
        ctx.fillStyle = player.pupilColor;
        ctx.fillRect(x + 15, y + 10, 3, 3);
        ctx.fillRect(x + 23, y + 10, 3, 3);
    }

    // Pés
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x + 10, y + s - 8, 8, 6);
    ctx.fillRect(x + s - 18, y + s - 8, 8, 6);
}


// --- ITENS VISÍVEIS ---

function getAllVisibleItems() {
    return DEFAULT_ITEMS.concat(shopItems);
}


// --- DESENHAR O QUARTO COMPLETO ---

function drawRoom() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = isLightOn() ? '#4a3020' : '#1a0a20';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawFloor();
    drawWalls();

    // Itens (exceto o arrastado)
    getAllVisibleItems().forEach(function (itemId) {
        if (itemId !== draggingItem) {
            drawItem(itemId);
        }
    });

    // Personagem
    drawPlayer();

    // Item sendo arrastado (por cima de tudo)
    if (draggingItem) {
        const snapCol = Math.round((dragX - ITEM_SIZE / 2) / TILE_SIZE);
        const snapRow = Math.round((dragY - ITEM_SIZE / 2) / TILE_SIZE);
        const clampedCol = Math.max(0, Math.min(snapCol, GRID_COLS - 1));
        const clampedRow = Math.max(0, Math.min(snapRow, GRID_ROWS - 1));

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(clampedCol * TILE_SIZE, clampedRow * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        drawItem(draggingItem, dragX - ITEM_SIZE / 2, dragY - ITEM_SIZE / 2);
    }
}


// --- ADICIONAR ITEM AO QUARTO ---

function addItemToRoom(item) {
    if (shopItems.includes(item.id)) return;
    shopItems.push(item.id);
    saveData('roomItems', shopItems);
    ensurePositions();
    drawRoom();
}


// ============================================
// MOVIMENTO DO PERSONAGEM (WASD / Setas)
// ============================================

function movePlayer(direction) {
    if (playerAnimating) return;

    player.direction = direction;

    let newCol = player.col;
    let newRow = player.row;

    if (direction === 'up')    newRow--;
    if (direction === 'down')  newRow++;
    if (direction === 'left')  newCol--;
    if (direction === 'right') newCol++;

    // Limites da grid (não sai do quarto, não entra na parede)
    if (newCol < 0 || newCol >= GRID_COLS) return;
    if (newRow < WALL_ROWS || newRow >= GRID_ROWS) return;

    // Atualiza posição lógica
    player.col = newCol;
    player.row = newRow;

    // Define o alvo da animação
    playerTargetX = player.col * TILE_SIZE + (TILE_SIZE - player.size) / 2;
    playerTargetY = player.row * TILE_SIZE + (TILE_SIZE - player.size) / 2;

    // Inicia animação
    playerAnimating = true;
    animatePlayer();

    // Salva posição
    saveData('playerPosition', { col: player.col, row: player.row });
}

function animatePlayer() {
    let dx = playerTargetX - playerPixelX;
    let dy = playerTargetY - playerPixelY;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < PLAYER_SPEED) {
        // Chegou no destino
        playerPixelX = playerTargetX;
        playerPixelY = playerTargetY;
        playerAnimating = false;
        drawRoom();
        return;
    }

    // Move em direção ao alvo
    playerPixelX += (dx / distance) * PLAYER_SPEED;
    playerPixelY += (dy / distance) * PLAYER_SPEED;

    drawRoom();

    // Continua a animação no próximo frame
    requestAnimationFrame(animatePlayer);
}

// Listener do teclado
document.addEventListener('keydown', function (event) {
    // Só move se o canvas estiver visível (não está na loja)
    if (canvas.classList.contains('hidden')) return;

    switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            event.preventDefault();
            movePlayer('up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            event.preventDefault();
            movePlayer('down');
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            event.preventDefault();
            movePlayer('left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            event.preventDefault();
            movePlayer('right');
            break;
    }
});


// ============================================
// DRAG AND DROP
// ============================================

let draggingItem = null;
let dragX = 0;
let dragY = 0;

function getCanvasPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
    };
}

function getItemAtPosition(x, y) {
    const allItems = getAllVisibleItems().reverse();
    for (let i = 0; i < allItems.length; i++) {
        const id = allItems[i];
        const pos = itemPositions[id];
        if (!pos) continue;
        const itemX = pos.col * TILE_SIZE;
        const itemY = pos.row * TILE_SIZE;
        if (x >= itemX && x < itemX + ITEM_SIZE &&
            y >= itemY && y < itemY + ITEM_SIZE) {
            return id;
        }
    }
    return null;
}

// Mouse
canvas.addEventListener('mousedown', function (event) {
    const pos = getCanvasPosition(event);
    const itemId = getItemAtPosition(pos.x, pos.y);
    if (itemId) {
        draggingItem = itemId;
        dragX = pos.x;
        dragY = pos.y;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', function (event) {
    if (!draggingItem) {
        const pos = getCanvasPosition(event);
        canvas.style.cursor = getItemAtPosition(pos.x, pos.y) ? 'grab' : 'default';
        return;
    }
    const pos = getCanvasPosition(event);
    dragX = pos.x;
    dragY = pos.y;
    drawRoom();
});

canvas.addEventListener('mouseup', function () {
    if (!draggingItem) return;
    const snapCol = Math.round((dragX - ITEM_SIZE / 2) / TILE_SIZE);
    const snapRow = Math.round((dragY - ITEM_SIZE / 2) / TILE_SIZE);
    itemPositions[draggingItem] = {
        col: Math.max(0, Math.min(snapCol, GRID_COLS - 1)),
        row: Math.max(0, Math.min(snapRow, GRID_ROWS - 1)),
    };
    saveData('itemPositions', itemPositions);
    draggingItem = null;
    canvas.style.cursor = 'default';
    drawRoom();
});

canvas.addEventListener('mouseleave', function () {
    if (draggingItem) {
        draggingItem = null;
        canvas.style.cursor = 'default';
        drawRoom();
    }
});

// Touch
canvas.addEventListener('touchstart', function (event) {
    event.preventDefault();
    const pos = getCanvasPosition(event);
    const itemId = getItemAtPosition(pos.x, pos.y);
    if (itemId) {
        draggingItem = itemId;
        dragX = pos.x;
        dragY = pos.y;
    }
}, { passive: false });

canvas.addEventListener('touchmove', function (event) {
    if (!draggingItem) return;
    event.preventDefault();
    const pos = getCanvasPosition(event);
    dragX = pos.x;
    dragY = pos.y;
    drawRoom();
}, { passive: false });

canvas.addEventListener('touchend', function () {
    if (!draggingItem) return;
    const snapCol = Math.round((dragX - ITEM_SIZE / 2) / TILE_SIZE);
    const snapRow = Math.round((dragY - ITEM_SIZE / 2) / TILE_SIZE);
    itemPositions[draggingItem] = {
        col: Math.max(0, Math.min(snapCol, GRID_COLS - 1)),
        row: Math.max(0, Math.min(snapRow, GRID_ROWS - 1)),
    };
    saveData('itemPositions', itemPositions);
    draggingItem = null;
    drawRoom();
});


// --- INICIALIZAÇÃO ---

loadAllSprites().then(function () {
    console.log('🎨 Sprites carregados!');
    ensurePositions();

    // Posiciona o personagem na posição correta em pixels
    playerPixelX = player.col * TILE_SIZE + (TILE_SIZE - player.size) / 2;
    playerPixelY = player.row * TILE_SIZE + (TILE_SIZE - player.size) / 2;
    playerTargetX = playerPixelX;
    playerTargetY = playerPixelY;

    drawRoom();
});