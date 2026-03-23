/**
 * ROOM.JS — Motor do jogo
 * 
 * Responsável por: renderização do quarto no Canvas,
 * personagem (movimento + animação), drag and drop de itens,
 * zonas de colisão, estados (dormir/trabalhar).
 * 
 * Room: 132x164px → Canvas: 528x656px (escala 4x)
 * Grid: 4 colunas x 5 linhas (tiles de 32x32 original)
 * 
 * Depende de: storage.js, sound.js
 */

var canvas = document.getElementById('game-canvas');
var ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

var SCALE = 4;
var BORDER = 2 * SCALE;          // 8px (borda do quarto)
var TILE_ORIG = 32;
var TILE = TILE_ORIG * SCALE;    // 128px no canvas
var GRID_COLS = 4;
var GRID_ROWS = 5;
var GRID_OFFSET_X = BORDER;
var GRID_OFFSET_Y = BORDER;


// ============================================
// ZONAS DE COLISÃO
// ============================================
// Define onde cada tipo de item pode ser colocado

var ZONE_BLOCKED = 'blocked';    // Vermelho: sem itens
var ZONE_WALL    = 'wall';       // Amarelo: quadros, janelas, luminária
var ZONE_FLOOR   = 'floor';      // Verde: móveis

var ZONE_MAP = [
    [ZONE_BLOCKED, ZONE_BLOCKED, ZONE_BLOCKED, ZONE_BLOCKED],  // Row 0: teto
    [ZONE_WALL,    ZONE_WALL,    ZONE_WALL,    ZONE_WALL],     // Row 1: parede
    [ZONE_FLOOR,   ZONE_FLOOR,   ZONE_FLOOR,   ZONE_FLOOR],    // Row 2: chão
    [ZONE_FLOOR,   ZONE_FLOOR,   ZONE_FLOOR,   ZONE_FLOOR],    // Row 3: chão
    [ZONE_FLOOR,   ZONE_FLOOR,   ZONE_FLOOR,   ZONE_FLOOR],    // Row 4: chão
];


// ============================================
// DEFINIÇÃO DOS ITENS
// ============================================

var ITEM_DEFS = {
    bed:      { zone: ZONE_FLOOR, sprite: 'Cama_Default',        fallback: { bg: '#c0392b', label: 'CA' } },
    desk:     { zone: ZONE_FLOOR, sprite: 'Mesa_Default',         fallback: { bg: '#8e6d47', label: 'ME' } },
    chair:    { zone: ZONE_FLOOR, sprite: 'Cadeira_Default',      fallback: { bg: '#a0522d', label: 'CD' } },
    computer: { zone: ZONE_FLOOR, sprite: 'Computador_Default',   fallback: { bg: '#2c3e50', label: 'PC' } },
    lamp:     { zone: ZONE_WALL,  sprite: null, fallback: { bg: '#f1c40f', label: 'LU' } },
    plant:    { zone: ZONE_FLOOR, sprite: null, fallback: { bg: '#27ae60', label: 'PL' } },
    poster:   { zone: ZONE_WALL,  sprite: null, fallback: { bg: '#3498db', label: 'PO' } },
    rug:      { zone: ZONE_FLOOR, sprite: null, fallback: { bg: '#e67e22', label: 'TA' } },
    shelf:    { zone: ZONE_FLOOR, sprite: null, fallback: { bg: '#8e44ad', label: 'ES' } },
};

/** Itens padrão que vêm com o quarto (não precisam ser comprados) */
var DEFAULT_ITEMS = ['bed', 'desk', 'chair', 'computer'];

/** Itens comprados na loja (carregados do localStorage) */
var shopItems = loadData('roomItems') || [];

/** Posições iniciais de cada item na grid */
var DEFAULT_POSITIONS = {
    bed: { col: 0, row: 2 }, desk: { col: 2, row: 2 },
    chair: { col: 2, row: 3 }, computer: { col: 3, row: 2 },
    lamp: { col: 0, row: 1 }, plant: { col: 0, row: 4 },
    poster: { col: 1, row: 1 }, rug: { col: 1, row: 3 }, shelf: { col: 3, row: 3 },
};

var itemPositions = loadData('itemPositions') || {};

/** Garante que todo item visível tenha uma posição válida */
function ensurePositions() {
    DEFAULT_ITEMS.concat(shopItems).forEach(function (id) {
        var pos = itemPositions[id];
        var def = DEFAULT_POSITIONS[id];
        if (!def) return;

        // Se não tem posição salva, ou a posição está fora da grid → reseta
        if (!pos || pos.col >= GRID_COLS || pos.row >= GRID_ROWS || pos.col < 0 || pos.row < 0) {
            itemPositions[id] = { col: def.col, row: def.row };
        }
    });
    saveData('itemPositions', itemPositions);
}

/** Ordem de desenho: itens de fundo primeiro, frente por último */
var DRAW_ORDER = ['rug', 'bed', 'desk', 'computer', 'shelf', 'chair', 'plant', 'lamp', 'poster'];


// ============================================
// PERSONAGEM
// ============================================

var player = {
    col: 1, row: 3,
    direction: 'down',
    walking: false,
    walkFrame: 0,
    state: 'idle',  // idle | sleeping | working
};

var savedPlayer = loadData('playerPosition');
if (savedPlayer) { player.col = savedPlayer.col; player.row = savedPlayer.row; }

var playerAnimating = false;
var playerPixelX, playerPixelY, playerTargetX, playerTargetY;
var PLAYER_SPEED = 5;
var walkAnimTimer = null;

/**
 * Sprites do personagem.
 * Walk usa ciclo ping-pong: frame1 → 2 → 3 → 2 (mais fluido)
 */
var PLAYER_SPRITES = {
    idle: { down: 'Front_Walk_1', up: 'Back_Stand', left: 'Side_Left', right: 'Side_Right' },
    walk: {
        down:  ['Front_Walk_1', 'Front_Walk_2', 'Front_Walk_3', 'Front_Walk_2'],
        up:    ['Back_Stand', 'Back_Walk_2', 'Back_Walk_3', 'Back_Walk_2'],
        left:  ['Side_Left', 'Side_Left_Walk_1', 'Side_Left_Walk_2', 'Side_Left_Walk_3'],
        right: ['Side_Right', 'Side_Right_Walk_1', 'Side_Right_Walk_2', 'Side_Right_Walk_3'],
    },
};


// ============================================
// CARREGAMENTO DE SPRITES
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
        // Itens
        { name: 'Cama_Default',      path: 'assets/sprites/Cama_Default.png' },
        { name: 'Mesa_Default',       path: 'assets/sprites/Mesa_Default.png' },
        { name: 'Cadeira_Default',    path: 'assets/sprites/Cadeira_Default.png' },
        { name: 'Computador_Default', path: 'assets/sprites/Computador_Default.png' },
        // Personagem: idle
        { name: 'Front_Walk_1',       path: 'assets/sprites/Front_Walk_1.png' },
        { name: 'Back_Stand',         path: 'assets/sprites/Back_Stand.png' },
        { name: 'Side_Left',          path: 'assets/sprites/Side_Left.png' },
        { name: 'Side_Right',         path: 'assets/sprites/Side_Right.png' },
        // Personagem: walk
        { name: 'Front_Walk_2',       path: 'assets/sprites/Front_Walk_2.png' },
        { name: 'Front_Walk_3',       path: 'assets/sprites/Front_Walk_3.png' },
        { name: 'Back_Walk_2',        path: 'assets/sprites/Back_Walk_2.png' },
        { name: 'Back_Walk_3',        path: 'assets/sprites/Back_Walk_3.png' },
        { name: 'Side_Left_Walk_1',   path: 'assets/sprites/Side_Left_Walk_1.png' },
        { name: 'Side_Left_Walk_2',   path: 'assets/sprites/Side_Left_Walk_2.png' },
        { name: 'Side_Left_Walk_3',   path: 'assets/sprites/Side_Left_Walk_3.png' },
        { name: 'Side_Right_Walk_1',  path: 'assets/sprites/Side_Right_Walk_1.png' },
        { name: 'Side_Right_Walk_2',  path: 'assets/sprites/Side_Right_Walk_2.png' },
        { name: 'Side_Right_Walk_3',  path: 'assets/sprites/Side_Right_Walk_3.png' },
        // Estados especiais
        { name: 'Sleep_Sprite',       path: 'assets/sprites/Sleep_Sprite.png' },
        { name: 'Work_Parte_1',       path: 'assets/sprites/Work_Parte_1.png' },
        { name: 'Work_Parte_2',       path: 'assets/sprites/Work_Parte_2.png' },
    ];
    return Promise.all(list.map(function (s) { return loadImage(s.name, s.path); }));
}


// ============================================
// UTILIDADES
// ============================================

function isLightOn() { return shopItems.includes('lamp'); }
function gridToPixelX(col) { return GRID_OFFSET_X + col * TILE; }
function gridToPixelY(row) { return GRID_OFFSET_Y + row * TILE; }


// ============================================
// DESENHO
// ============================================

/** Background: imagem única 132x164 escalada pra 528x656 */
function drawBackground() {
    var bg = sprites['room_bg'];
    if (bg) {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#4a3020';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Escurecimento quando sem luminária
    if (!isLightOn()) {
        ctx.fillStyle = 'rgba(20, 10, 40, 0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

/** Desenha um item na posição da grid ou em coordenadas livres (drag) */
function drawItem(itemId, px, py) {
    var def = ITEM_DEFS[itemId];
    if (!def) return;
    var pos = itemPositions[itemId];
    if (!pos && px === undefined) return;

    var x = (px !== undefined) ? px : gridToPixelX(pos.col);
    var y = (py !== undefined) ? py : gridToPixelY(pos.row);
    var sprite = def.sprite ? sprites[def.sprite] : null;

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

/** Personagem — escondido quando dorme ou trabalha */
function drawPlayer() {
    if (player.state === 'sleeping' || player.state === 'working') return;

    var spriteName;
    if (player.walking) {
        var frames = PLAYER_SPRITES.walk[player.direction];
        spriteName = frames[player.walkFrame % frames.length];
    } else {
        spriteName = PLAYER_SPRITES.idle[player.direction];
    }

    var spr = sprites[spriteName];
    if (spr) {
        ctx.drawImage(spr, playerPixelX, playerPixelY, TILE, TILE);
    } else {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(playerPixelX + 30, playerPixelY + 20, TILE - 60, TILE - 40);
    }
}

/** Sprites sobrepostos: sleep por cima da cama, work por cima de PC/cadeira */
function drawOverlaySprites() {
    if (player.state === 'sleeping') {
        var bedPos = itemPositions['bed'];
        if (bedPos && sprites['Sleep_Sprite']) {
            ctx.drawImage(sprites['Sleep_Sprite'], gridToPixelX(bedPos.col), gridToPixelY(bedPos.row), TILE, TILE);
        }
    }
    if (player.state === 'working') {
        var compPos = itemPositions['computer'];
        var chairPos = itemPositions['chair'];
        if (compPos && sprites['Work_Parte_1'])
            ctx.drawImage(sprites['Work_Parte_1'], gridToPixelX(compPos.col), gridToPixelY(compPos.row), TILE, TILE);
        if (chairPos && sprites['Work_Parte_2'])
            ctx.drawImage(sprites['Work_Parte_2'], gridToPixelX(chairPos.col), gridToPixelY(chairPos.row), TILE, TILE);
    }
}

function getAllVisibleItems() { return DEFAULT_ITEMS.concat(shopItems); }

/**
 * Desenha o quarto completo.
 * Camadas: background → itens → personagem → overlays → drag highlight
 */
function drawRoom() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    var visible = getAllVisibleItems();
    DRAW_ORDER.forEach(function (id) {
        if (visible.includes(id) && id !== draggingItem) drawItem(id);
    });
    visible.forEach(function (id) {
        if (!DRAW_ORDER.includes(id) && id !== draggingItem) drawItem(id);
    });

    drawPlayer();
    drawOverlaySprites();

    // Item sendo arrastado + highlight de destino
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
// COLISÃO — VALIDAÇÃO DE POSIÇÃO
// ============================================

/** Verifica se o item pode ser colocado na célula (zona + sobreposição) */
function canPlaceItem(itemId, col, row) {
    if (col < 0 || row < 0 || col >= GRID_COLS || row >= GRID_ROWS) return false;
    var def = ITEM_DEFS[itemId];
    if (!def) return false;
    var zone = ZONE_MAP[row][col];
    if (zone === ZONE_BLOCKED) return false;
    if (def.zone === ZONE_FLOOR && zone !== ZONE_FLOOR) return false;
    if (def.zone === ZONE_WALL && zone !== ZONE_WALL) return false;

    // Anti-sobreposição (exceto combo computador + mesa)
    var visible = getAllVisibleItems();
    for (var i = 0; i < visible.length; i++) {
        var otherId = visible[i];
        if (otherId === itemId) continue;
        var otherPos = itemPositions[otherId];
        if (!otherPos) continue;
        if (otherPos.col === col && otherPos.row === row) {
            if ((itemId === 'computer' && otherId === 'desk') ||
                (itemId === 'desk' && otherId === 'computer')) continue;
            return false;
        }
    }
    return true;
}

/** Verifica se uma célula está ocupada por um móvel (usada pelo personagem) */
function isCellOccupied(col, row) {
    var visible = getAllVisibleItems();
    for (var i = 0; i < visible.length; i++) {
        var pos = itemPositions[visible[i]];
        if (pos && pos.col === col && pos.row === row) return true;
    }
    return false;
}

/** Chamada pela loja ao comprar um item */
function addItemToRoom(item) {
    if (shopItems.includes(item.id)) return;
    shopItems.push(item.id);
    saveData('roomItems', shopItems);
    ensurePositions();
    drawRoom();
}


// ============================================
// ESTADOS DO PERSONAGEM
// ============================================

var btnSleep = document.getElementById('btn-sleep');

/** Retorna true se o personagem está dormindo (usado por timer e shop) */
function isSleeping() { return player.state === 'sleeping'; }

/** Alterna entre dormir e acordar */
function startSleeping() {
    if (player.state === 'sleeping') {
        player.state = 'idle';
        btnSleep.textContent = '💤 Dormir';
    } else {
        if (player.state === 'working') return;
        player.state = 'sleeping';
        btnSleep.textContent = '☀️ Acordar';
    }
    drawRoom();
}

btnSleep.addEventListener('click', startSleeping);

/** Ativa modo trabalho — chamada pelo timer.js ao iniciar foco */
function startWorking() {
    if (player.state === 'sleeping') return;
    player.state = 'working';
    drawRoom();
}

/** Desativa modo trabalho — chamada pelo timer.js ao pausar/resetar/finalizar */
function stopWorking() {
    if (player.state === 'working') {
        player.state = 'idle';
        drawRoom();
    }
}


// ============================================
// MOVIMENTO DO PERSONAGEM
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

    // Limites da grid (row 0-1 = parede, bloqueada pro personagem)
    if (newCol < 0 || newCol >= GRID_COLS) { player.walking = false; drawRoom(); return; }
    if (newRow < 2 || newRow >= GRID_ROWS) { player.walking = false; drawRoom(); return; }

    // Colisão com móveis — impede andar sobre itens
    if (isCellOccupied(newCol, newRow)) { player.walking = false; drawRoom(); return; }

    player.col = newCol;
    player.row = newRow;
    playerTargetX = GRID_OFFSET_X + player.col * TILE;
    playerTargetY = GRID_OFFSET_Y + player.row * TILE;
    playerAnimating = true;
    soundStep();

    if (walkAnimTimer) clearInterval(walkAnimTimer);
    walkAnimTimer = setInterval(function () {
        player.walkFrame = (player.walkFrame + 1) % 4;
    }, 100);

    animatePlayer();
    saveData('playerPosition', { col: player.col, row: player.row });
}

/** Animação suave entre tiles usando requestAnimationFrame */
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

// --- Teclado ---
document.addEventListener('keydown', function (e) {
    if (canvas.classList.contains('hidden')) return;
    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); movePlayer('up'); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); movePlayer('down'); break;
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); movePlayer('left'); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); movePlayer('right'); break;
    }
});

// --- D-pad ---
document.querySelectorAll('.dpad-btn').forEach(function (btn) {
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
var dragX = 0, dragY = 0;
var dragPreviousPos = null;

function getCanvasPosition(event) {
    var rect = canvas.getBoundingClientRect();
    var cX = event.touches ? event.touches[0].clientX : event.clientX;
    var cY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
        x: (cX - rect.left) * (canvas.width / rect.width),
        y: (cY - rect.top) * (canvas.height / rect.height),
    };
}

function getItemAtPosition(x, y) {
    var items = getAllVisibleItems().slice().reverse();
    for (var i = 0; i < items.length; i++) {
        var pos = itemPositions[items[i]];
        if (!pos) continue;
        var ix = gridToPixelX(pos.col), iy = gridToPixelY(pos.row);
        if (x >= ix && x < ix + TILE && y >= iy && y < iy + TILE) return items[i];
    }
    return null;
}

/** Solta o item: valida posição ou reverte pra anterior */
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
    draggingItem = null; dragPreviousPos = null;
    canvas.style.cursor = 'default';
    drawRoom();
}

// --- Mouse ---
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

// --- Touch ---
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