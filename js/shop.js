// ============================================
// SHOP.JS — Loja de Melhorias e Decorações
// ============================================
// Depende de: storage.js, coins.js, room.js


const SHOP_CATALOG = [
    { id: 'lamp',     name: 'Luminária',   price: 15, sprite: 'assets/sprites/lamp.png',     owned: false },
    { id: 'plant',    name: 'Planta',      price: 20, sprite: 'assets/sprites/plant.png',    owned: false },
    { id: 'poster',   name: 'Pôster',      price: 15, sprite: 'assets/sprites/poster.png',   owned: false },
    { id: 'rug',      name: 'Tapete',      price: 30, sprite: 'assets/sprites/rug.png',      owned: false },
    { id: 'shelf',    name: 'Estante',     price: 40, sprite: 'assets/sprites/shelf.png',    owned: false },
];

const shopItemsContainer = document.getElementById('shop-items');
const shopPanel = document.getElementById('shop-panel');
const gameCanvas = document.getElementById('game-canvas');
const btnShop = document.getElementById('btn-shop');
const btnRoom = document.getElementById('btn-room');

function loadPurchasedItems() {
    var purchased = loadData('purchasedItems');
    if (purchased === null) return;
    SHOP_CATALOG.forEach(function (item) {
        if (purchased.includes(item.id)) item.owned = true;
    });
}

function savePurchasedItems() {
    var ids = SHOP_CATALOG
        .filter(function (item) { return item.owned; })
        .map(function (item) { return item.id; });
    saveData('purchasedItems', ids);
}

function renderShop() {
    shopItemsContainer.innerHTML = '';

    SHOP_CATALOG.forEach(function (item) {
        var div = document.createElement('div');
        div.classList.add('shop-item');

        var buttonHTML = item.owned
            ? '<span class="purchased-label">✅ Comprado</span>'
            : '<button class="buy-btn">Comprar</button>';

        var hint = item.id === 'lamp'
            ? '<span class="item-hint">💡 Ilumina o quarto!</span>'
            : '';

        div.innerHTML =
            '<div class="item-icon-wrapper">' +
                '<img src="' + item.sprite + '" alt="' + item.name + '" class="item-sprite" ' +
                    'onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">' +
                '<div class="item-icon-fallback" style="display:none;">' +
                    item.id.charAt(0).toUpperCase() +
                '</div>' +
            '</div>' +
            '<span class="item-name">' + item.name + '</span>' +
            '<span class="item-price">🪙 ' + item.price + '</span>' +
            hint +
            buttonHTML;

        if (!item.owned) {
            var buyBtn = div.querySelector('.buy-btn');
            buyBtn.addEventListener('click', function () {
                purchaseItem(item);
            });
        }

        shopItemsContainer.appendChild(div);
    });
}

function purchaseItem(item) {
    if (spendCoins(item.price)) {
        item.owned = true;
        savePurchasedItems();
        renderShop();
        addItemToRoom(item);
        soundPurchase();

        if (item.id === 'lamp') {
            alert('Você comprou: ' + item.name + '! O quarto se iluminou! 💡');
        } else {
            alert('Você comprou: ' + item.name + '!');
        }
    } else {
        soundError();
        alert('Moedas insuficientes!');
    }
}

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

loadPurchasedItems();
renderShop();