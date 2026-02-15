// --- Global State ---
// products.js ထဲက variable ကို သုံးမှာဖြစ်လို့ ဒီမှာ let products = [] ကို ဖျက်လိုက်ပါပြီ
let basket = [];

/**
 * ၀။ Initialize App (Sheets အစား Local Data သုံးမည်)
 */
function initApp() {
    // products က products.js ထဲမှာ ရှိနေပြီးသားမို့ တိုက်ရိုက်သုံးလို့ရပါပြီ
    renderFeatured();
    renderProducts('all');
    console.log("App loaded with local products.js");
}

/**
 * ၁။ Toast Logic
 */
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/**
 * ၂။ Page Switching
 */
function changeTab(pageId, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    btn.classList.add('active');
    window.scrollTo(0, 0);
}

/**
 * ၃။ Render Shop Products
 */
function renderProducts(filter = 'all') {
    const container = document.getElementById('product-list-container');
    if (!container) return;
    container.innerHTML = "";

    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);

    filtered.forEach(p => {
        let actionHTML = p.category === 'cake' 
            ? `<select id="size-${p.id}" class="size-select">${p.priceOptions.map(o => `<option value="${o.price}">${o.size} - ${o.price.toLocaleString()}K</option>`).join('')}</select>
               <button class="add-btn" onclick="addToCartWithOptions('${p.name}', 'size-${p.id}')">Add to Cart</button>`
            : `<p class="price">${p.price.toLocaleString()} Ks</p>
               <button class="add-btn" onclick="quickAdd('${p.name}', ${p.price})">Add to Cart</button>`;

        container.innerHTML += `
            <div class="card">
                <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/150?text=Snow+White'">
                <h4>${p.name}</h4>
                ${actionHTML}
            </div>`;
    });
}

/**
 * ၄။ Render Featured
 */
function renderFeatured() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    const featured = products.slice(0, 2); 
    container.innerHTML = featured.map(p => `
        <div class="card">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/150?text=Snow+White'">
            <h4>${p.name}</h4>
            <p class="price">${p.category === 'cake' ? p.priceOptions[0].price.toLocaleString() : p.price.toLocaleString()} Ks</p>
            <button class="add-btn" onclick="navToShop()">View in Shop</button>
        </div>
    `).join('');
}

function navToShop() {
    const shopBtn = document.querySelectorAll('.nav-link')[1];
    changeTab('shop', shopBtn);
}

// ... အရင်ပေးထားတဲ့ Cart & Order Logic တွေ ဆက်ထည့်ပါ ...
function quickAdd(name, price) {
    basket.push({ name, price: parseInt(price) });
    showToast(`✅ ${name} ကို ထည့်လိုက်ပါပြီ!`);
    updateCartUI();
}

function addToCartWithOptions(name, selectId) {
    const select = document.getElementById(selectId);
    const price = select.value;
    const size = select.options[select.selectedIndex].text.split('-')[0].trim();
    basket.push({ name: `${name} (${size})`, price: parseInt(price) });
    showToast(`✅ ${name} ကို ထည့်လိုက်ပါပြီ!`);
    updateCartUI();
}

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    if (!list) return;
    if (basket.length === 0) {
        list.innerHTML = '<p class="empty-msg">Your basket is currently empty.</p>';
        calculateTotal();
        return;
    }
    list.innerHTML = basket.map((item, index) => `
        <div class="cart-item">
            <span>${item.name}</span>
            <div>
                <strong>${item.price.toLocaleString()} K</strong>
                <button onclick="removeItem(${index})" style="background:none; color:#d63031; border:none; margin-left:10px; cursor:pointer;">✕</button>
            </div>
        </div>
    `).join('');
    calculateTotal();
}

function removeItem(index) {
    basket.splice(index, 1);
    updateCartUI();
}

function calculateTotal() {
    const subtotal = basket.reduce((sum, item) => sum + item.price, 0);
    const deli = parseInt(document.getElementById('township').value) || 0;
    document.getElementById('grand-total').innerText = (subtotal + deli).toLocaleString();
}
