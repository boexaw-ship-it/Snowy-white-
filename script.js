// --- Global State ---
let products = [];
let basket = [];

const API_URL = "https://script.google.com/macros/s/AKfycbwznakKlSDGqJbjt3xhD6YvPu5Jg0fdEKrIO4ul4Y-KJhvZeIKaVv1w0uGbxZYcPWcX/exec"; 

/**
 * ၀။ Google Sheets မှ Data ဆွဲထုတ်ခြင်း (Case-insensitive Fix)
 */
async function fetchProducts() {
    try {
        console.log("Fetching data from:", API_URL);
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // Sheets ကလာတဲ့ data တွေကို စစ်ဆေးပြီး format ညှိမယ်
        products = data.map(p => {
            // Key နာမည်တွေ အကြီးအသေးမှားနေရင်တောင် သိအောင်လုပ်ပေးထားတယ်
            const id = p.id || p.Id || p.ID;
            const name = p.name || p.Name;
            const category = (p.category || p.Category || "").toLowerCase();
            const priceRaw = p.price || p.Price;
            const image = p.image || p.Image;

            let priceOptions = [];
            let priceSingle = 0;

            if (category === 'cake') {
                try {
                    // Price ထဲက Double Quotes တွေကို ရှင်းပြီးမှ JSON parse လုပ်မယ်
                    const cleanedPrice = priceRaw.toString().replace(/""/g, '"');
                    priceOptions = JSON.parse(cleanedPrice);
                } catch (e) {
                    console.error("Price JSON Parse Error for:", name, e);
                    priceOptions = [{ size: "Standard", price: 0 }];
                }
            } else {
                priceSingle = parseInt(priceRaw) || 0;
            }

            return { id, name, category, priceOptions, price: priceSingle, image };
        });

        renderFeatured();
        renderProducts('all');
        console.log("Success! Products loaded:", products);
    } catch (error) {
        console.error("Fetch error:", error);
        showToast("⚠️ Data ဆွဲရတာ အဆင်မပြေပါ");
    }
}

// --- ကျန်တဲ့ Navigation နဲ့ Cart Logic တွေ (မူလအတိုင်း) ---

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function changeTab(pageId, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    btn.classList.add('active');
    window.scrollTo(0, 0);
}

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

        container.innerHTML += `<div class="card">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/150?text=Snow+White'">
            <h4>${p.name}</h4>
            ${actionHTML}
        </div>`;
    });
}

function renderFeatured() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    const featured = products.slice(0, 2); 
    container.innerHTML = featured.map(p => `
        <div class="card">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/150?text=Snow+White'">
            <h4>${p.name}</h4>
            <p class="price">${p.category === 'cake' ? (p.priceOptions[0]?.price || 0).toLocaleString() : p.price.toLocaleString()} Ks</p>
            <button class="add-btn" onclick="navToShop()">View in Shop</button>
        </div>
    `).join('');
}

function navToShop() {
    const shopBtn = document.querySelectorAll('.nav-link')[1];
    changeTab('shop', shopBtn);
}

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
            <div><strong>${item.price.toLocaleString()} K</strong>
            <button onclick="removeItem(${index})" style="background:none; color:#d63031; border:none; margin-left:10px;">✕</button></div>
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

function submitOrder() {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const addr = document.getElementById('cust-address').value;
    const area = document.getElementById('township').options[document.getElementById('township').selectedIndex].text;

    if (!name || !phone || basket.length === 0) {
        showToast("⚠️ အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်ပေးပါ");
        return;
    }

    const orderData = { customerName: name, customerPhone: phone, customerAddress: addr, area, items: basket, totalAmount: document.getElementById('grand-total').innerText };
    if (typeof handleOrder === "function") handleOrder(orderData);
}
