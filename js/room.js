// ============================================
// ROOM.JS — Renderização do Quarto no Canvas
// ============================================
// Depende de: storage.js


const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const TILE_SIZE = 100;
const GRID_COLS = canvas.width / TILE_SIZE;   // 6
const GRID_ROWS = canvas.height / TILE_SIZE;  // 6


// ============================================
// ZONAS DE COLISÃO
// ============================================
// green  = chão (móveis: cama, mesa, cadeira, etc.)
// yellow = parede (quadros, janelas)
// orange = canto parede (lâmpadas)

const ZONE_FLOOR  = 'floor';
const ZONE_WALL   = 'wall';
const ZONE_LAMP   = 'lamp';

// Mapa de zonas por célula [row][col]
const ZONE_MAP = [];
for (let r = 0; r < GRID_ROWS; r++) {
    ZONE_MAP[r] = [];
    for (let c = 0; c < GRID_COLS; c++) {
        if (r === 0) {
            // Primeira linha = parede
            if (c === 0 || c === GRID_COLS - 1) {
                ZONE_MAP[r][c] = ZONE_LAMP;   // cantos = lâmpadas
            } else {
                ZONE_MAP[r][c] = ZONE_WALL;   // centro = quadros
            }
        } else {
            ZONE_MAP[r][c] = ZONE_FLOOR;      // resto = chão
        }
    }
}


// ============================================
// DEFINIÇÃO DOS ITENS
// ============================================

const ITEM_DEFS = {
    bed:      { tilesW: 1, tilesH: 2, zone: ZONE_FLOOR, spriteLit: 'cama_luz',       spriteDark: 'cama_escuro',       fallback: { bg: '#c0392b', label: 'CA' } },
    desk:     { tilesW: 2, tilesH: 1, zone: ZONE_FLOOR, spriteLit: 'mesa_luz',       spriteDark: 'mesa_escuro',       fallback: { bg: '#8e6d47', label: 'ME' } },
    chair:    { tilesW: 1, tilesH: 1, zone: ZONE_FLOOR, spriteLit: 'cadeira_luz',    spriteDark: 'cadeira_escuro',    fallback: { bg: '#a0522d', label: 'CD' } },
    computer: { tilesW: 1, tilesH: 1, zone: ZONE_FLOOR, spriteLit: 'computador_luz', spriteDark: 'computador_escuro', fallback: { bg: '#2c3e50', label: 'PC' } },
    lamp:     { tilesW: 1, tilesH: 1, zone: ZONE_LAMP,  spriteLit: null,             spriteDark: null,                fallback: { bg: '#f1c40f', label: 'LU' } },
    plant:    { tilesW: 1, tilesH: 1, zone: ZONE_FLOOR, spriteLit: null,             spriteDark: null,                fallback: { bg: '#27ae60', label: 'PL' } },
    shelf:    { tilesW: 2, tilesH: 1, zone: ZONE_FLOOR, spriteLit: null,             spriteDark: null,                fallback: { bg: '#8e44ad', label: 'ES' } },
    rug:      { tilesW: 2, tilesH: 2, zone: ZONE_FLOOR, spriteLit: null,             spriteDark: null,                fallback: { bg: '#e67e22', label: 'TA' } },
    poster:   { tilesW: 1, tilesH: 1, zone: ZONE_WALL,  spriteLit: null,             spriteDark: null,                fallback: { bg: '#3498db', label: 'PO' } },
};

// Itens padrão (sempre presentes)
const DEFAULT_ITEMS = ['bed', 'desk', 'chair', 'computer'];

// Itens comprados na loja
let shopItems = loadData('roomItems') || [];

// Posições padrão (agrupamento lógico)
const DEFAULT_POSITIONS = {
    bed:      { col: 0, row: 1 },
    desk:     { col: 3, row: 1 },   // 2 cells wide → ocupa col 3-4
    chair:    { col: 4, row: 2 },   // embaixo da mesa à direita
    computer: { col: 3, row: 1 },   // em cima da mesa (mesma posição, desenhado por cima)
    lamp:     { col: 5, row: 0 },   // canto da parede (zona laranja)
    plant:    { col: 0, row: 5 },
    shelf:    { col: 1, row: 1 },
    rug:      { col: 2, row: 3 },
    poster:   { col: 2, row: 0 },   // na parede (zona amarela)
};

let itemPositions = loadData('itemPositions') || {};

function ensurePositions() {
    var allItems = DEFAULT_ITEMS.concat(shopItems);
    allItems.forEach(function (id) {
        if (!itemPositions[id] && DEFAULT_POSITIONS[id]) {
            itemPositions[id] = {
                col: DEFAULT_POSITIONS[id].col,
                row: DEFAULT_POSITIONS[id].row,
            };
        }
    });
}

// Ordem de desenho (itens de fundo primeiro)
const DRAW_ORDER = ['rug', 'bed', 'desk', 'computer', 'shelf', 'chair', 'plant', 'lamp', 'poster'];


// ============================================
// PERSONAGEM COM ANIMAÇÃO
// ============================================

const player = {
    col: 3,
    row: 3,
    size: 48,
    direction: 'down',
    walking: false,
    walkFrame: 0,
};

const savedPlayer = loadData('playerPosition');
if (savedPlayer) {
    player.col = savedPlayer.col;
    player.row = savedPlayer.row;
}

let playerAnimating = false;
let playerPixelX = player.col * TILE_SIZE + (TILE_SIZE - player.size) / 2;
let playerPixelY = player.row * TILE_SIZE + (TILE_SIZE - player.size) / 2;
let playerTargetX = playerPixelX;
let playerTargetY = playerPixelY;
const PLAYER_SPEED = 6;

// Mapeamento de sprites do personagem por direção e estado
const PLAYER_SPRITES = {
    idle: {
        down:  'Idle',
        up:    'Idle_Back',
        left:  'Idle_Side_Left',
        right: 'Idle_Side_Right',
    },
    walk: {
        down:  ['Front_Walk_1', 'Front_Walk_2'],
        up:    ['Back_Walk_1', 'Back_Walk_2'],
        left:  ['Side_Left_Walk_1', 'Side_Left_Walk_2'],
        right: ['Side_Right_Walk_1', 'Side_Right_Walk_2'],
    },
};


// ============================================
// CARREGAMENTO DE SPRITES
// ============================================

const sprites = {};

function loadImage(name, path) {
    return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () { sprites[name] = img; resolve(); };
        img.onerror = function () { resolve(); };
        img.src = path;
    });
}

function loadAllSprites() {
    var list = [
        // Cenário
        { name: 'room_bg',     path: 'assets/sprites/room_bg.png' },
        { name: 'room_bg_alt', path: 'assets/sprites/room_bg_alt.png' },

        // Itens (versão luz)
        { name: 'cama_luz',         path: 'assets/sprites/Cama_Padrao_Com_Luz.png' },
        { name: 'cama_escuro',      path: 'assets/sprites/Cama_Padrao_Sem_Luz.png' },
        { name: 'mesa_luz',         path: 'assets/sprites/Mesa_Padrao_Com_Luz.png' },
        { name: 'mesa_escuro',      path: 'assets/sprites/Mesa_Padrao_Sem_Luz.png' },
        { name: 'cadeira_luz',      path: 'assets/sprites/Cadeira_Padrao_Com_Luz.png' },
        { name: 'cadeira_escuro',   path: 'assets/sprites/Cadeira_Padrao_Sem_Luz.png' },
        { name: 'computador_luz',   path: 'assets/sprites/Computador_Padrao_Com_Luz.png' },
        { name: 'computador_escuro', path: 'assets/sprites/Computador_Padrao_Sem_Luz.png' },

        // Personagem
        { name: 'Idle',              path: 'assets/sprites/Idle.png' },
        { name: 'Idle_Back',         path: 'assets/sprites/Idle_Back.png' },
        { name: 'Idle_Side_Left',    path: 'assets/sprites/Idle_Side_Left.png' },
        { name: 'Idle_Side_Right',   path: 'assets/sprites/Idle_Side_Right.png' },
        { name: 'Front_Walk_1',      path: 'assets/sprites/Front_Walk_1.png' },
        { name: 'Front_Walk_2',      path: 'assets/sprites/Front_Walk_2.png' },
        { name: 'Back_Walk_1',       path: 'assets/sprites/Back_Walk_1.png' },
        { name: 'Back_Walk_2',       path: 'assets/sprites/Back_Walk_2.png' },
        { name: 'Side_Left_Walk_1',  path: 'assets/sprites/Side_Left_Walk_1.png' },
        { name: 'Side_Left_Walk_2',  path: 'assets/sprites/Side_Left_Walk_2.png' },
        { name: 'Side_Right_Walk_1', path: 'assets/sprites/Side_Right_Walk_1.png' },
        { name: 'Side_Right_Walk_2', path: 'assets/sprites/Side_Right_Walk_2.png' },
    ];

    return Promise.all(list.map(function (s) {
        return loadImage(s.name, s.path);
    }));
}


// ============================================
// ILUMINAÇÃO
// ============================================

function isLightOn() {
    return shopItems.includes('lamp');
}


// ============================================
// DESENHO
// ============================================

function drawBackground() {
    var bg = isLightOn() ? sprites['room_bg'] : sprites['room_bg_alt'];
    if (bg) {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = isLightOn() ? '#6b5030' : '#3a2040';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawItem(itemId, pixelX, pixelY) {
    var def = ITEM_DEFS[itemId];
    if (!def) return;

    var pos = itemPositions[itemId];
    if (!pos && pixelX === undefined) return;

    var drawW = def.tilesW * TILE_SIZE;
    var drawH = def.tilesH * TILE_SIZE;
    var x = (pixelX !== undefined) ? pixelX : pos.col * TILE_SIZE;
    var y = (pixelY !== undefined) ? pixelY : pos.row * TILE_SIZE;

    // Escolhe sprite luz ou escuro
    var spriteName = isLightOn() ? def.spriteLit : def.spriteDark;
    var sprite = spriteName ? sprites[spriteName] : null;

    if (sprite) {
        ctx.drawImage(sprite, x, y, drawW, drawH);
    } else {
        // Fallback
        var fb = def.fallback;
        var margin = 6;
        ctx.fillStyle = '#00000044';
        ctx.fillRect(x + margin + 2, y + margin + 2, drawW - margin * 2, drawH - margin * 2);
        ctx.fillStyle = fb.bg;
        ctx.fillRect(x + margin, y + margin, drawW - margin * 2, drawH - margin * 2);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + margin, y + margin, drawW - margin * 2, drawH - margin * 2);
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fb.label, x + drawW / 2, y + drawH / 2);
    }

    // Escurecimento sem luz
    if (!isLightOn()) {
        ctx.fillStyle = 'rgba(20, 10, 30, 0.15)';
        ctx.fillRect(x, y, drawW, drawH);
    }
}

function drawPlayer() {
    var x = playerPixelX;
    var y = playerPixelY;
    var s = player.size;

    // Escala do sprite no canvas
    var drawSize = TILE_SIZE - 10;
    var drawX = x - (drawSize - s) / 2;
    var drawY = y - (drawSize - s) / 2;

    var spriteName;
    if (player.walking) {
        var frames = PLAYER_SPRITES.walk[player.direction];
        spriteName = frames[player.walkFrame % frames.length];
    } else {
        spriteName = PLAYER_SPRITES.idle[player.direction];
    }

    var sprite = sprites[spriteName];
    if (sprite) {
        ctx.drawImage(sprite, drawX, drawY, drawSize, drawSize);
    } else {
        // Fallback simples
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x + s / 2, y + s - 2, s / 3, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a90d9';
        ctx.fillRect(x + 8, y + 16, s - 16, s - 22);
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(x + 10, y + 2, s - 20, 18);
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(x + 10, y + s - 8, 8, 6);
        ctx.fillRect(x + s - 18, y + s - 8, 8, 6);
    }
}

function getAllVisibleItems() {
    return DEFAULT_ITEMS.concat(shopItems);
}

function drawRoom() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    // Desenha itens na ordem definida (fundo → frente)
    var visible = getAllVisibleItems();
    DRAW_ORDER.forEach(function (itemId) {
        if (visible.includes(itemId) && itemId !== draggingItem) {
            drawItem(itemId);
        }
    });
    // Itens não listados no DRAW_ORDER
    visible.forEach(function (itemId) {
        if (!DRAW_ORDER.includes(itemId) && itemId !== draggingItem) {
            drawItem(itemId);
        }
    });

    drawPlayer();

    // Item arrastado (por cima de tudo)
    if (draggingItem) {
        var def = ITEM_DEFS[draggingItem];
        var snapCol = Math.round((dragX - (def.tilesW * TILE_SIZE) / 2) / TILE_SIZE);
        var snapRow = Math.round((dragY - (def.tilesH * TILE_SIZE) / 2) / TILE_SIZE);
        var cCol = Math.max(0, Math.min(snapCol, GRID_COLS - def.tilesW));
        var cRow = Math.max(0, Math.min(snapRow, GRID_ROWS - def.tilesH));

        // Highlight — verde se válido, vermelho se inválido
        var valid = canPlaceItem(draggingItem, cCol, cRow);
        ctx.fillStyle = valid ? 'rgba(100, 255, 100, 0.2)' : 'rgba(255, 100, 100, 0.2)';
        ctx.fillRect(cCol * TILE_SIZE, cRow * TILE_SIZE, def.tilesW * TILE_SIZE, def.tilesH * TILE_SIZE);

        drawItem(draggingItem, dragX - (def.tilesW * TILE_SIZE) / 2, dragY - (def.tilesH * TILE_SIZE) / 2);
    }
}


// ============================================
// COLISÃO — VALIDAÇÃO DE POSIÇÃO
// ============================================

function canPlaceItem(itemId, col, row) {
    var def = ITEM_DEFS[itemId];
    if (!def) return false;

    // Verifica se cabe na grid
    if (col < 0 || row < 0) return false;
    if (col + def.tilesW > GRID_COLS) return false;
    if (row + def.tilesH > GRID_ROWS) return false;

    // Verifica se todas as células são da zona correta
    for (var r = row; r < row + def.tilesH; r++) {
        for (var c = col; c < col + def.tilesW; c++) {
            var zone = ZONE_MAP[r][c];

            if (def.zone === ZONE_FLOOR && zone !== ZONE_FLOOR) return false;
            if (def.zone === ZONE_WALL && zone !== ZONE_WALL) return false;
            if (def.zone === ZONE_LAMP && zone !== ZONE_LAMP) return false;
        }
    }

    // Verifica sobreposição com outros itens (exceto combos permitidos)
    var visible = getAllVisibleItems();
    for (var i = 0; i < visible.length; i++) {
        var otherId = visible[i];
        if (otherId === itemId) continue;
        var otherPos = itemPositions[otherId];
        if (!otherPos) continue;
        var otherDef = ITEM_DEFS[otherId];
        if (!otherDef) continue;

        // Checa sobreposição de retângulos
        var overlap = !(
            col + def.tilesW <= otherPos.col ||
            otherPos.col + otherDef.tilesW <= col ||
            row + def.tilesH <= otherPos.row ||
            otherPos.row + otherDef.tilesH <= row
        );

        if (overlap) {
            // Combos permitidos: computador + mesa
            if ((itemId === 'computer' && otherId === 'desk') ||
                (itemId === 'desk' && otherId === 'computer')) {
                continue;
            }
            return false;
        }
    }

    return true;
}


// ============================================
// ADICIONAR ITEM AO QUARTO
// ============================================

function addItemToRoom(item) {
    if (shopItems.includes(item.id)) return;
    shopItems.push(item.id);
    saveData('roomItems', shopItems);
    ensurePositions();
    drawRoom();
}


// ============================================
// MOVIMENTO DO PERSONAGEM
// ============================================

var walkAnimTimer = null;

function movePlayer(direction) {
    if (playerAnimating) return;

    player.direction = direction;
    player.walking = true;
    player.walkFrame = 0;

    var newCol = player.col;
    var newRow = player.row;

    if (direction === 'up')    newRow--;
    if (direction === 'down')  newRow++;
    if (direction === 'left')  newCol--;
    if (direction === 'right') newCol++;

    // Limites (não entra na parede - row 0)
    if (newCol < 0 || newCol >= GRID_COLS) { player.walking = false; drawRoom(); return; }
    if (newRow < 1 || newRow >= GRID_ROWS) { player.walking = false; drawRoom(); return; }

    player.col = newCol;
    player.row = newRow;

    playerTargetX = player.col * TILE_SIZE + (TILE_SIZE - player.size) / 2;
    playerTargetY = player.row * TILE_SIZE + (TILE_SIZE - player.size) / 2;

    playerAnimating = true;
    soundStep();

    // Alterna frames de andar
    if (walkAnimTimer) clearInterval(walkAnimTimer);
    walkAnimTimer = setInterval(function () {
        player.walkFrame = (player.walkFrame + 1) % 2;
    }, 150);

    animatePlayer();
    saveData('playerPosition', { col: player.col, row: player.row });
}

function animatePlayer() {
    var dx = playerTargetX - playerPixelX;
    var dy = playerTargetY - playerPixelY;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < PLAYER_SPEED) {
        playerPixelX = playerTargetX;
        playerPixelY = playerTargetY;
        playerAnimating = false;
        player.walking = false;
        if (walkAnimTimer) { clearInterval(walkAnimTimer); walkAnimTimer = null; }
        drawRoom();
        return;
    }

    playerPixelX += (dx / dist) * PLAYER_SPEED;
    playerPixelY += (dy / dist) * PLAYER_SPEED;

    drawRoom();
    requestAnimationFrame(animatePlayer);
}

// Teclado
document.addEventListener('keydown', function (e) {
    if (canvas.classList.contains('hidden')) return;
    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); movePlayer('up'); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); movePlayer('down'); break;
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); movePlayer('left'); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); movePlayer('right'); break;
    }
});

// D-pad
var dpadButtons = document.querySelectorAll('.dpad-btn');
dpadButtons.forEach(function (btn) {
    btn.addEventListener('touchstart', function (e) {
        e.preventDefault(); movePlayer(btn.getAttribute('data-dir'));
    }, { passive: false });
    btn.addEventListener('mousedown', function (e) {
        e.preventDefault(); movePlayer(btn.getAttribute('data-dir'));
    });
});


// ============================================
// DRAG AND DROP
// ============================================

var draggingItem = null;
var dragX = 0;
var dragY = 0;
var dragPreviousPos = null; // salva posição anterior caso drop seja inválido

function getCanvasPosition(event) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var cX = event.touches ? event.touches[0].clientX : event.clientX;
    var cY = event.touches ? event.touches[0].clientY : event.clientY;
    return { x: (cX - rect.left) * scaleX, y: (cY - rect.top) * scaleY };
}

function getItemAtPosition(x, y) {
    var allItems = getAllVisibleItems().slice().reverse();
    for (var i = 0; i < allItems.length; i++) {
        var id = allItems[i];
        var pos = itemPositions[id];
        var def = ITEM_DEFS[id];
        if (!pos || !def) continue;
        var ix = pos.col * TILE_SIZE;
        var iy = pos.row * TILE_SIZE;
        if (x >= ix && x < ix + def.tilesW * TILE_SIZE &&
            y >= iy && y < iy + def.tilesH * TILE_SIZE) {
            return id;
        }
    }
    return null;
}

function dropItem() {
    if (!draggingItem) return;
    var def = ITEM_DEFS[draggingItem];
    var snapCol = Math.round((dragX - (def.tilesW * TILE_SIZE) / 2) / TILE_SIZE);
    var snapRow = Math.round((dragY - (def.tilesH * TILE_SIZE) / 2) / TILE_SIZE);
    var cCol = Math.max(0, Math.min(snapCol, GRID_COLS - def.tilesW));
    var cRow = Math.max(0, Math.min(snapRow, GRID_ROWS - def.tilesH));

    if (canPlaceItem(draggingItem, cCol, cRow)) {
        itemPositions[draggingItem] = { col: cCol, row: cRow };
        soundDrop();
    } else if (dragPreviousPos) {
        itemPositions[draggingItem] = dragPreviousPos;
        soundReject();
    }

    saveData('itemPositions', itemPositions);
    draggingItem = null;
    dragPreviousPos = null;
    canvas.style.cursor = 'default';
    drawRoom();
}

// Mouse
canvas.addEventListener('mousedown', function (e) {
    var pos = getCanvasPosition(e);
    var itemId = getItemAtPosition(pos.x, pos.y);
    if (itemId) {
        draggingItem = itemId;
        dragPreviousPos = { col: itemPositions[itemId].col, row: itemPositions[itemId].row };
        dragX = pos.x;
        dragY = pos.y;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', function (e) {
    if (!draggingItem) {
        var pos = getCanvasPosition(e);
        canvas.style.cursor = getItemAtPosition(pos.x, pos.y) ? 'grab' : 'default';
        return;
    }
    var pos = getCanvasPosition(e);
    dragX = pos.x;
    dragY = pos.y;
    drawRoom();
});

canvas.addEventListener('mouseup', dropItem);
canvas.addEventListener('mouseleave', function () {
    if (draggingItem) {
        if (dragPreviousPos) itemPositions[draggingItem] = dragPreviousPos;
        draggingItem = null;
        dragPreviousPos = null;
        canvas.style.cursor = 'default';
        drawRoom();
    }
});

// Touch
canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    var pos = getCanvasPosition(e);
    var itemId = getItemAtPosition(pos.x, pos.y);
    if (itemId) {
        draggingItem = itemId;
        dragPreviousPos = { col: itemPositions[itemId].col, row: itemPositions[itemId].row };
        dragX = pos.x;
        dragY = pos.y;
    }
}, { passive: false });

canvas.addEventListener('touchmove', function (e) {
    if (!draggingItem) return;
    e.preventDefault();
    var pos = getCanvasPosition(e);
    dragX = pos.x;
    dragY = pos.y;
    drawRoom();
}, { passive: false });

canvas.addEventListener('touchend', dropItem);


// ============================================
// INICIALIZAÇÃO
// ============================================

loadAllSprites().then(function () {
    console.log('🎨 Sprites carregados!');
    ensurePositions();

    playerPixelX = player.col * TILE_SIZE + (TILE_SIZE - player.size) / 2;
    playerPixelY = player.row * TILE_SIZE + (TILE_SIZE - player.size) / 2;
    playerTargetX = playerPixelX;
    playerTargetY = playerPixelY;

    drawRoom();
});