// ============================================
// SHOP.JS — Loja de Itens para o Quarto
// ============================================
// Depende de: storage.js, coins.js
//


// --- CATÁLOGO DE ITENS ---
// Cada item é um objeto com: id, nome, preço, sprite e se já foi comprado
// Os sprites ainda não existem — vamos usar placeholders por enquanto

const SHOP_CATALOG = [
    { id: 'bed',      name: 'Cama',        price: 10, sprite: 'assets/sprites/bed.png',      owned: false },
    { id: 'desk',     name: 'Mesa',        price: 25, sprite: 'assets/sprites/desk.png',     owned: false },
    { id: 'lamp',     name: 'Luminária',   price: 15, sprite: 'assets/sprites/lamp.png',     owned: false },
    { id: 'plant',    name: 'Planta',      price: 20, sprite: 'assets/sprites/plant.png',    owned: false },
    { id: 'shelf',    name: 'Estante',     price: 40, sprite: 'assets/sprites/shelf.png',    owned: false },
    { id: 'rug',      name: 'Tapete',      price: 30, sprite: 'assets/sprites/rug.png',      owned: false },
    { id: 'poster',   name: 'Pôster',      price: 15, sprite: 'assets/sprites/poster.png',   owned: false },
    { id: 'computer', name: 'Computador',  price: 75, sprite: 'assets/sprites/computer.png', owned: false },
];


// --- REFERÊNCIAS AOS ELEMENTOS DO HTML ---

const shopItemsContainer = document.getElementById('shop-items');
const shopPanel = document.getElementById('shop-panel');
const gameCanvas = document.getElementById('game-canvas');
const btnShop = document.getElementById('btn-shop');
const btnRoom = document.getElementById('btn-room');


// --- CARREGAR ITENS JÁ COMPRADOS DO LOCALSTORAGE ---
// Verifica se o jogador já comprou algo em sessões anteriores

function loadPurchasedItems() {
    // Busca a lista de ids comprados (ex: ['bed', 'lamp'])
    const purchased = loadData('purchasedItems');

    // Se não existe nada salvo, não faz nada
    if (purchased === null) return;

    // Percorre o catálogo e marca como owned os itens já comprados
    SHOP_CATALOG.forEach(function (item) {
        // .includes() verifica se o id está dentro do array
        if (purchased.includes(item.id)) {
            item.owned = true;
        }
    });
}


// --- SALVAR ITENS COMPRADOS NO LOCALSTORAGE ---
// Filtra só os comprados e salva a lista de ids

function savePurchasedItems() {
    // .filter() → pega só os itens onde owned é true
    // .map() → transforma cada item no seu id (string)
    // Resultado: ['bed', 'lamp', 'desk']
    const purchasedIds = SHOP_CATALOG
        .filter(function (item) { return item.owned === true; })
        .map(function (item) { return item.id; });

    saveData('purchasedItems', purchasedIds);
}


// --- RENDERIZAR A LOJA ---
// Cria os elementos HTML de cada item dinamicamente

function renderShop() {
    // Limpa tudo que tinha antes
    shopItemsContainer.innerHTML = '';

    // Percorre cada item do catálogo
    SHOP_CATALOG.forEach(function (item) {

        // Cria uma div para este item
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('shop-item');

        // Monta o conteúdo HTML dentro da div
        // Se já foi comprado → mostra "✅ Comprado"
        // Se não → mostra o botão "Comprar"
        const buttonHTML = item.owned
            ? '<span class="purchased-label">✅ Comprado</span>'
            : '<button class="buy-btn">Comprar</button>';

        itemDiv.innerHTML = `
            <div class="item-icon">${item.id.charAt(0).toUpperCase()}</div>
            <span class="item-name">${item.name}</span>
            <span class="item-price">🪙 ${item.price}</span>
            ${buttonHTML}
        `;

        // Se NÃO foi comprado, conecta o botão ao evento de compra
        if (!item.owned) {
            const buyBtn = itemDiv.querySelector('.buy-btn');
            buyBtn.addEventListener('click', function () {
                purchaseItem(item);
            });
        }

        // Coloca a div dentro do container da loja
        shopItemsContainer.appendChild(itemDiv);
    });
}


// --- COMPRAR ITEM ---
// Tenta gastar moedas e, se conseguir, marca como comprado

function purchaseItem(item) {
    // spendCoins() retorna true se tinha saldo, false se não
    if (spendCoins(item.price)) {
        // Compra bem-sucedida!
        item.owned = true;

        // Salva no localStorage
        savePurchasedItems();

        // Atualiza a loja visualmente
        renderShop();

        // Adiciona o item ao quarto (room.js)
        addItemToRoom(item);

        alert(`Você comprou: ${item.name}!`);
    } else {
        alert('Moedas insuficientes!');
    }
}


// --- NAVEGAÇÃO: ALTERNAR ENTRE QUARTO E LOJA ---
// Mostra/esconde painéis usando a classe CSS 'hidden'

btnShop.addEventListener('click', function () {
    // Esconde o canvas (quarto) e mostra a loja
    gameCanvas.classList.add('hidden');
    shopPanel.classList.remove('hidden');

    // Atualiza os botões da nav (qual está ativo)
    btnShop.classList.add('active');
    btnRoom.classList.remove('active');
});

btnRoom.addEventListener('click', function () {
    // Mostra o canvas (quarto) e esconde a loja
    gameCanvas.classList.remove('hidden');
    shopPanel.classList.add('hidden');

    // Atualiza os botões da nav
    btnRoom.classList.add('active');
    btnShop.classList.remove('active');
});


// --- INICIALIZAÇÃO ---

loadPurchasedItems();
renderShop();