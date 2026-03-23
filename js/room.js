// ============================================
// ROOM.JS — Renderização do Quarto
// ============================================
// Room: 132x164 → Canvas: 528x656 (escala 4x)
// Grid interna: 4 colunas x 5 linhas (32x32 cada)
// Borda: 2px original = 8px no canvas

var canvas = document.getElementById('game-canvas');
var ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

var SCALE = 4;
var ROOM_W = 132;
var ROOM_H = 164;
var BORDER = 2 * SCALE; // 8px
var TILE_ORIG = 32;
var TILE = TILE_ORIG * SCALE; // 128px no canvas
var GRID_COLS = 4;
var GRID_ROWS = 5;

// Offset da grid dentro do canvas (após bordas)
var GRID_OFFSET_X = BORDER;
var GRID_OFFSET_Y = BORDER;

// ============================================
// ZONAS DE COLISÃO
// ============================================
var ZONE_BLOCKED = 'blocked';
var ZONE_WALL    = 'wall';
var ZONE_FLOOR   = 'floor';

// row 0 = bloqueado (teto/borda vermelha superior)
// row 1 = parede amarela (quadros, janelas) + blocos vermelhos na base
// rows 2-4 = chão verde (móveis)
var ZONE_MAP = [
    [ZONE_BLOCKED, ZONE_BLOCKED, ZONE_BLOCKED, ZONE_BLOCKED],
    [ZONE_WALL,    ZONE_WALL,    ZONE_WALL,    ZONE_WALL],
    [ZONE_FLOOR,   ZONE_FLOOR,   ZONE_FLOOR,   ZONE_FLOOR],
    [ZONE_FLOOR,   ZONE_FLOOR,   ZONE_FLOOR,   ZONE_FLOOR],
    [ZONE_FLOOR,   ZONE_FLOOR,   ZONE_FLOOR,   ZONE_FLOOR],
];

// ============================================
// ITENS
// ============================================
var ITEM_DEFS = {
    bed:      { zone: ZONE_FLOOR, sprite: 'Cama_Default' },
    desk:     { zone: ZONE_FLOOR, sprite: 'Mesa_Default' },
    chair:    { zone: ZONE_FLOOR, sprite: 'Cadeira_Default' },
    computer: { zone: ZONE_FLOOR, sprite: 'Computador_Default' },
    lamp:     { zone: ZONE_WALL,  sprite: null, fallback: { bg: '#f1c40f', label: 'LU' } },
    plant:    { zone: ZONE_FLOOR, sprite: null, fallback: { bg: '#27ae60', label: 'PL' } },
    poster:   { zone: ZONE_WALL,  sprite: null, fallback: { bg: '#3498db', label: 'PO' } },
    rug:      { zone: ZONE_FLOOR, sprite: null, fallback: { bg: '#e67e22', label: 'TA' } },
    shelf:    { zone: ZONE_FLOOR, sprite: null, fallback: { bg: '#8e44ad', label: 'ES' } },
};

var DEFAULT_ITEMS = ['bed', 'desk', 'chair', 'computer'];
var shopItems = loadData('roomItems') || [];

var DEFAULT_POSITIONS = {
    bed:      { col: 0, row: 2 },
    desk:     { col: 2, row: 2 },
    chair:    { col: 2, row: 3 },
    computer: { col: 3, row: 2 },
    lamp:     { col: 0, row: 1 },
    plant:    { col: 0, row: 4 },
    poster:   { col: 1, row: 1 },
    rug:      { col: 1, row: 3 },
    shelf:    { col: 3, row: 3 },
};

var itemPositions = loadData('itemPositions') || {};

function ensurePositions() {
    var allItems = DEFAULT_ITEMS.concat(shopItems);
    allItems.forEach(function (id) {
        if (!itemPositions[id] && DEFAULT_POSITIONS[id]) {
            itemPositions[id] = { col: DEFAULT_POSITIONS[id].col, row: DEFAULT_POSITIONS[id].row };
        }
    });
}

var DRAW_ORDER = ['rug', 'bed', 'desk', 'computer', 'shelf', 'chair', 'plant', 'lamp', 'poster'];

// ============================================
// PERSONAGEM
// ============================================
var player = {
    col: 1, row: 3,
    direction: 'down',
    walking: false,
    walkFrame: 0,
    state: 'idle', // idle, walking, sleeping, working
};

var savedPlayer = loadData('playerPosition');
if (savedPlayer) { player.col = savedPlayer.col; player.row = savedPlayer.row; }

var playerAnimating = false;
var playerPixelX = GRID_OFFSET_X + player.col * TILE + (TILE - TILE_ORIG * SCALE) / 2;
var playerPixelY = GRID_OFFSET_Y + player.row * TILE + (TILE - TILE_ORIG * SCALE) / 2;
var playerTargetX = playerPixelX;
var playerTargetY = playerPixelY;
var PLAYER_SPEED = 8;
var walkAnimTimer = null;

var PLAYER_SPRITES = {
    idle: { down: 'Front_Walk_1', up: 'Back_Stand', left: 'Side_Left', right: 'Side_Right' },
    walk: {
        down:  ['Front_Walk_1', 'Front_Walk_2', 'Front_Walk_3'],
        up:    ['Back_Stand', 'Back_Walk_2', 'Back_Walk_3'],
        left:  ['Side_Left_Walk_1', 'Side_Left_Walk_2', 'Side_Left_Walk_3'],
        right: ['Side_Right_Walk_1', 'Side_Right_Walk_2', 'Side_Right_Walk_3'],
    },
};

// ============================================
// SPRITES
// ============================================
var sprites = {};

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
        { name: 'room_bg', path: 'assets/sprites/Quarto_Default.png' },
        // Items
        { name: 'Cama_Default',        path: 'assets/sprites/Cama_Default.png' },
        { name: 'Mesa_Default',         path: 'assets/sprites/Mesa_Default.png' },
        { name: 'Cadeira_Default',      path: 'assets/sprites/Cadeira_Default.png' },
        { name: 'Computador_Default',   path: 'assets/sprites/Computador_Default.png' },
        // Player idle/walk
        { name: 'Front_Walk_1',         path: 'assets/sprites/Front_Walk_1.png' },
        { name: 'Front_Walk_2',         path: 'assets/sprites/Front_Walk_2.png' },
        { name: 'Front_Walk_3',         path: 'assets/sprites/Front_Walk_3.png' },
        { name: 'Back_Stand',           path: 'assets/sprites/Back_Stand.png' },
        { name: 'Back_Walk_2',          path: 'assets/sprites/Back_Walk_2.png' },
        { name: 'Back_Walk_3',          path: 'assets/sprites/Back_Walk_3.png' },
        { name: 'Side_Left',            path: 'assets/sprites/Side_Left.png' },
        { name: 'Side_Left_Walk_1',     path: 'assets/sprites/Side_Left_Walk_1.png' },
        { name: 'Side_Left_Walk_2',     path: 'assets/sprites/Side_Left_Walk_2.png' },
        { name: 'Side_Left_Walk_3',     path: 'assets/sprites/Side_Left_Walk_3.png' },
        { name: 'Side_Right',           path: 'assets/sprites/Side_Right.png' },
        { name: 'Side_Right_Walk_1',    path: 'assets/sprites/Side_Right_Walk_1.png' },
        { name: 'Side_Right_Walk_2',    path: 'assets/sprites/Side_Right_Walk_2.png' },
        { name: 'Side_Right_Walk_3',    path: 'assets/sprites/Side_Right_Walk_3.png' },
        // Special states
        { name: 'Sleep_Sprite',         path: 'assets/sprites/Sleep_Sprite.png' },
        { name: 'Work_Parte_1',         path: 'assets/sprites/Work_Parte_1.png' },
        { name: 'Work_Parte_2',         path: 'assets/sprites/Work_Parte_2.png' },
    ];
    return Promise.all(list.map(function (s) { return loadImage(s.name, s.path); }));
}

// ============================================
// ILUMINAÇÃO
// ============================================
function isLightOn() { return shopItems.includes('lamp'); }

// ============================================
// CONVERSÃO GRID → PIXELS
// ============================================
function gridToPixelX(col) { return GRID_OFFSET_X + col * TILE; }
function gridToPixelY(row) { return GRID_OFFSET_Y + row * TILE; }

// ============================================
// DESENHO
// ============================================
function drawBackground() {
    var bg = sprites['room_bg'];
    if (bg) {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#4a3020';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (!isLightOn()) {
        ctx.fillStyle = 'rgba(20, 10, 40, 0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawItem(itemId, px, py) {
    var def = ITEM_DEFS[itemId];
    if (!def) return;
    var pos = itemPositions[itemId];
    if (!pos && px === undefined) return;

    var x = (px !== undefined) ? px : gridToPixelX(pos.col);
    var y = (py !== undefined) ? py : gridToPixelY(pos.row);

    var spriteName = def.sprite;
    var sprite = spriteName ? sprites[spriteName] : null;

    if (sprite) {
        ctx.drawImage(sprite, x, y, TILE, TILE);
    } else if (def.fallback) {
        var fb = def.fallback;
        var m = 10;
        ctx.fillStyle = '#00000033';
        ctx.fillRect(x + m + 3, y + m + 3, TILE - m * 2, TILE - m * 2);
        ctx.fillStyle = fb.bg;
        ctx.fillRect(x + m, y + m, TILE - m * 2, TILE - m * 2);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + m, y + m, TILE - m * 2, TILE - m * 2);
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fb.label, x + TILE / 2, y + TILE / 2);
    }
}

function drawPlayer() {
    if (player.state === 'sleeping' || player.state === 'working') return;

    var x = playerPixelX;
    var y = playerPixelY;
    var spriteName;

    if (player.walking) {
        var frames = PLAYER_SPRITES.walk[player.direction];
        spriteName = frames[player.walkFrame % frames.length];
    } else {
        spriteName = PLAYER_SPRITES.idle[player.direction];
    }

    var spr = sprites[spriteName];
    if (spr) {
        ctx.drawImage(spr, x, y, TILE, TILE);
    } else {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(x + 30, y + 20, TILE - 60, TILE - 40);
    }
}

// Sprites especiais: dormir e trabalhar
function drawSleepSprite() {
    if (player.state !== 'sleeping') return;
    var bedPos = itemPositions['bed'];
    if (!bedPos) return;
    var spr = sprites['Sleep_Sprite'];
    if (spr) {
        ctx.drawImage(spr, gridToPixelX(bedPos.col), gridToPixelY(bedPos.row), TILE, TILE);
    }
}

function drawWorkSprites() {
    if (player.state !== 'working') return;
    var compPos = itemPositions['computer'];
    var chairPos = itemPositions['chair'];

    var spr1 = sprites['Work_Parte_1'];
    var spr2 = sprites['Work_Parte_2'];

    if (spr1 && compPos) {
        ctx.drawImage(spr1, gridToPixelX(compPos.col), gridToPixelY(compPos.row), TILE, TILE);
    }
    if (spr2 && chairPos) {
        ctx.drawImage(spr2, gridToPixelX(chairPos.col), gridToPixelY(chairPos.row), TILE, TILE);
    }
}

function getAllVisibleItems() {
    return DEFAULT_ITEMS.concat(shopItems);
}

function drawRoom() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    var visible = getAllVisibleItems();

    // Itens na ordem definida
    DRAW_ORDER.forEach(function (id) {
        if (visible.includes(id) && id !== draggingItem) {
            // No modo trabalho, computador e cadeira são substituídos pelos work sprites
            if (player.state === 'working' && (id === 'computer' || id === 'chair')) return;
            // No modo dormir, cama é substituída pelo sleep sprite
            if (player.state === 'sleeping' && id === 'bed') return;
            drawItem(id);
        }
    });
    // Itens fora do DRAW_ORDER
    visible.forEach(function (id) {
        if (!DRAW_ORDER.includes(id) && id !== draggingItem) drawItem(id);
    });

    // Sprites especiais
    drawSleepSprite();
    drawWorkSprites();

    // Personagem (só se não está dormindo/trabalhando)
    drawPlayer();

    // Item arrastado por cima de tudo
    if (draggingItem) {
        var snapCol = Math.round((dragX - GRID_OFFSET_X - TILE / 2) / TILE);
        var snapRow = Math.round((dragY - GRID_OFFSET_Y - TILE / 2) / TILE);
        var cCol = Math.max(0, Math.min(snapCol, GRID_COLS - 1));
        var cRow = Math.max(0, Math.min(snapRow, GRID_ROWS - 1));

        var valid = canPlaceItem(draggingItem, cCol, cRow);
        ctx.fillStyle = valid ? 'rgba(100,255,100,0.2)' : 'rgba(255,100,100,0.2)';
        ctx.fillRect(gridToPixelX(cCol), gridToPixelY(cRow), TILE, TILE);

        drawItem(draggingItem, dragX - TILE / 2, dragY - TILE / 2);
    }
}

// ============================================
// COLISÃO
// ============================================
function canPlaceItem(itemId, col, row) {
    if (col < 0 || row < 0 || col >= GRID_COLS || row >= GRID_ROWS) return false;

    var def = ITEM_DEFS[itemId];
    if (!def) return false;

    var zone = ZONE_MAP[row][col];
    if (zone === ZONE_BLOCKED) return false;
    if (def.zone === ZONE_FLOOR && zone !== ZONE_FLOOR) return false;
    if (def.zone === ZONE_WALL && zone !== ZONE_WALL) return false;

    // Anti-sobreposição
    var visible = getAllVisibleItems();
    for (var i = 0; i < visible.length; i++) {
        var otherId = visible[i];
        if (otherId === itemId) continue;
        var otherPos = itemPositions[otherId];
        if (!otherPos) continue;
        if (otherPos.col === col && otherPos.row === row) {
            // Combos permitidos
            if ((itemId === 'computer' && otherId === 'desk') ||
                (itemId === 'desk' && otherId === 'computer')) continue;
            return false;
        }
    }
    return true;
}

function addItemToRoom(item) {
    if (shopItems.includes(item.id)) return;
    shopItems.push(item.id);
    saveData('roomItems', shopItems);
    ensurePositions();
    drawRoom();
}

// ============================================
// ESTADOS DO PERSONAGEM: DORMIR / TRABALHAR
// ============================================
var btnSleep = document.getElementById('btn-sleep');

function startSleeping() {
    if (player.state === 'sleeping') {
        // Acordar
        player.state = 'idle';
        btnSleep.textContent = 'Dormir 💤';
    } else {
        player.state = 'sleeping';
        btnSleep.textContent = 'Acordar ☀️';
    }
    drawRoom();
}

btnSleep.addEventListener('click', startSleeping);

// Chamada pelo timer.js quando inicia o foco
function startWorking() {
    player.state = 'working';
    drawRoom();
}

// Chamada pelo timer.js quando termina/pausa
function stopWorking() {
    player.state = 'idle';
    drawRoom();
}

// ============================================
// MOVIMENTO
// ============================================
function movePlayer(direction) {
    if (playerAnimating) return;
    if (player.state === 'sleeping' || player.state === 'working') return;

    player.direction = direction;
    player.walking = true;
    player.walkFrame = 0;

    var newCol = player.col;
    var newRow = player.row;

    if (direction === 'up')    newRow--;
    if (direction === 'down')  newRow++;
    if (direction === 'left')  newCol--;
    if (direction === 'right') newCol++;

    if (newCol < 0 || newCol >= GRID_COLS) { player.walking = false; drawRoom(); return; }
    if (newRow < 2 || newRow >= GRID_ROWS) { player.walking = false; drawRoom(); return; }

    player.col = newCol;
    player.row = newRow;

    playerTargetX = GRID_OFFSET_X + player.col * TILE;
    playerTargetY = GRID_OFFSET_Y + player.row * TILE;

    playerAnimating = true;
    soundStep();

    if (walkAnimTimer) clearInterval(walkAnimTimer);
    walkAnimTimer = setInterval(function () {
        player.walkFrame = (player.walkFrame + 1) % 3;
    }, 120);

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
var dragPreviousPos = null;

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
        if (!pos) continue;
        var ix = gridToPixelX(pos.col);
        var iy = gridToPixelY(pos.row);
        if (x >= ix && x < ix + TILE && y >= iy && y < iy + TILE) return id;
    }
    return null;
}

function dropItem() {
    if (!draggingItem) return;
    var snapCol = Math.round((dragX - GRID_OFFSET_X - TILE / 2) / TILE);
    var snapRow = Math.round((dragY - GRID_OFFSET_Y - TILE / 2) / TILE);
    var cCol = Math.max(0, Math.min(snapCol, GRID_COLS - 1));
    var cRow = Math.max(0, Math.min(snapRow, GRID_ROWS - 1));

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

canvas.addEventListener('mousedown', function (e) {
    if (player.state === 'sleeping' || player.state === 'working') return;
    var pos = getCanvasPosition(e);
    var id = getItemAtPosition(pos.x, pos.y);
    if (id) {
        draggingItem = id;
        dragPreviousPos = { col: itemPositions[id].col, row: itemPositions[id].row };
        dragX = pos.x; dragY = pos.y;
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
    dragX = pos.x; dragY = pos.y;
    drawRoom();
});

canvas.addEventListener('mouseup', dropItem);
canvas.addEventListener('mouseleave', function () {
    if (draggingItem) {
        if (dragPreviousPos) itemPositions[draggingItem] = dragPreviousPos;
        draggingItem = null; dragPreviousPos = null;
        canvas.style.cursor = 'default';
        drawRoom();
    }
});

canvas.addEventListener('touchstart', function (e) {
    if (player.state === 'sleeping' || player.state === 'working') return;
    e.preventDefault();
    var pos = getCanvasPosition(e);
    var id = getItemAtPosition(pos.x, pos.y);
    if (id) {
        draggingItem = id;
        dragPreviousPos = { col: itemPositions[id].col, row: itemPositions[id].row };
        dragX = pos.x; dragY = pos.y;
    }
}, { passive: false });

canvas.addEventListener('touchmove', function (e) {
    if (!draggingItem) return;
    e.preventDefault();
    var pos = getCanvasPosition(e);
    dragX = pos.x; dragY = pos.y;
    drawRoom();
}, { passive: false });

canvas.addEventListener('touchend', dropItem);

// ============================================
// INICIALIZAÇÃO
// ============================================
loadAllSprites().then(function () {
    console.log('🎨 Sprites carregados!');
    ensurePositions();
    playerPixelX = GRID_OFFSET_X + player.col * TILE;
    playerPixelY = GRID_OFFSET_Y + player.row * TILE;
    playerTargetX = playerPixelX;
    playerTargetY = playerPixelY;
    drawRoom();
});