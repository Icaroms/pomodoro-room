// ============================================
// SHOP.JS — Loja de Itens para o Quarto
// ============================================
// Depende de: storage.js, coins.js, room.js
//
// IMPORTANTE: A loja só vende MELHORIAS e DECORAÇÕES.
// Os móveis básicos (cama, mesa, cadeira) já vêm no quarto.
//


// --- CATÁLOGO DE ITENS DA LOJA ---
// Apenas itens extras — melhorias e decorações

const SHOP_CATALOG = [
    { id: 'lamp',     name: 'Luminária',   price: 15, sprite: 'assets/sprites/lamp.png',     owned: false },
    { id: 'plant',    name: 'Planta',      price: 20, sprite: 'assets/sprites/plant.png',    owned: false },
    { id: 'rug',      name: 'Tapete',      price: 30, sprite: 'assets/sprites/rug.png',      owned: false },
    { id: 'poster',   name: 'Pôster',      price: 15, sprite: 'assets/sprites/poster.png',   owned: false },
    { id: 'shelf',    name: 'Estante',     price: 40, sprite: 'assets/sprites/shelf.png',    owned: false },
    { id: 'computer', name: 'Computador',  price: 75, sprite: 'assets/sprites/computer.png', owned: false },
];


// --- REFERÊNCIAS AOS ELEMENTOS DO HTML ---

const shopItemsContainer = document.getElementById('shop-items');
const shopPanel = document.getElementById('shop-panel');
const gameCanvas = document.getElementById('game-canvas');
const btnShop = document.getElementById('btn-shop');
const btnRoom = document.getElementById('btn-room');


// --- CARREGAR ITENS JÁ COMPRADOS ---

function loadPurchasedItems() {
    const purchased = loadData('purchasedItems');
    if (purchased === null) return;

    SHOP_CATALOG.forEach(function (item) {
        if (purchased.includes(item.id)) {
            item.owned = true;
        }
    });
}


// --- SALVAR ITENS COMPRADOS ---

function savePurchasedItems() {
    const purchasedIds = SHOP_CATALOG
        .filter(function (item) { return item.owned === true; })
        .map(function (item) { return item.id; });

    saveData('purchasedItems', purchasedIds);
}


// --- RENDERIZAR A LOJA ---

function renderShop() {
    shopItemsContainer.innerHTML = '';

    SHOP_CATALOG.forEach(function (item) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('shop-item');

        const buttonHTML = item.owned
            ? '<span class="purchased-label">✅ Comprado</span>'
            : '<button class="buy-btn">Comprar</button>';

        const itemHint = item.id === 'lamp'
            ? '<span class="item-hint">💡 Ilumina o quarto!</span>'
            : '';

        itemDiv.innerHTML = `
            <div class="item-icon-wrapper">
                <img
                    src="${item.sprite}"
                    alt="${item.name}"
                    class="item-sprite"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >
                <div class="item-icon-fallback" style="display:none;">
                    ${item.id.charAt(0).toUpperCase()}
                </div>
            </div>
            <span class="item-name">${item.name}</span>
            <span class="item-price">🪙 ${item.price}</span>
            ${itemHint}
            ${buttonHTML}
        `;

        if (!item.owned) {
            const buyBtn = itemDiv.querySelector('.buy-btn');
            buyBtn.addEventListener('click', function () {
                purchaseItem(item);
            });
        }

        shopItemsContainer.appendChild(itemDiv);
    });
}


// --- COMPRAR ITEM ---

function purchaseItem(item) {
    if (spendCoins(item.price)) {
        item.owned = true;
        savePurchasedItems();
        renderShop();
        addItemToRoom(item);

        if (item.id === 'lamp') {
            alert(`Você comprou: ${item.name}! O quarto se iluminou! 💡`);
        } else {
            alert(`Você comprou: ${item.name}!`);
        }
    } else {
        alert('Moedas insuficientes!');
    }
}


// --- NAVEGAÇÃO ---

btnShop.addEventListener('click', function () {
    gameCanvas.classList.add('hidden');
    shopPanel.classList.remove('hidden');
    btnShop.classList.add('active');
    btnRoom.classList.remove('active');
});

btnRoom.addEventListener('click', function () {
    gameCanvas.classList.remove('hidden');
    shopPanel.classList.add('hidden');
    btnRoom.classList.add('active');
    btnShop.classList.remove('active');
});


// --- INICIALIZAÇÃO ---

loadPurchasedItems();
renderShop();