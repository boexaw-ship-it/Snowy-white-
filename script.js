// --- Google Sheet Configuration ---
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // မင်းရဲ့ Sheet ID ကို ဒီမှာ အစားထိုးပါ
const SHEET_NAME = 'Sheet1'; 
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

// --- Global State ---
let basket = [];
let products = []; // Google Sheet မှ လာမည့် ပစ္စည်းများ သိမ်းရန်

/**
 * ၁။ Google Sheet မှ ပစ္စည်းများ လှမ်းယူခြင်း (New Logic)
 */
async function fetchProducts() {
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        
        // Google Sheet JSON wrapper ကို ဖယ်ထုတ်ပြီး ပုံမှန် JSON ပြောင်းခြင်း
        const jsonData = JSON.parse(text.substring(47, text.length - 2));
        const rows = jsonData.table.rows;

        // Sheet column များကို Object အဖြစ် ပြောင်းလဲခြင်း
        products = rows.map(row => {
            // Cake ဈေးနှုန်းများကို JSON string အဖြစ် Sheet ထဲတွင် သိမ်းထားပါက ပြန်ဖြေရန်
            // ဥပမာ- Column D (price) ထဲမှာ [{"size":"6 inch","price":25000}] စသဖြင့်
            let rawPrice = row.c[3]?.v;
            let priceOptions = null;
            let singlePrice = 0;

            if (row.c[2]?.v === 'cake') {
                try {
                    priceOptions = JSON.parse(rawPrice);
                } catch(e) {
                    // JSON format မဟုတ်ဘဲ ဂဏန်းပဲဆိုရင် default option တစ်ခု ဆောက်ပေးမယ်
                    priceOptions = [{ size: "Standard", price: parseInt(rawPrice) || 0 }];
                }
            } else {
                singlePrice = parseInt(rawPrice) || 0;
            }

            return {
                id: row.c[0]?.v,
                name: row.c[1]?.v,
                category: row.c[2]?.v,
                price: singlePrice,
                priceOptions: priceOptions,
                image: row.c[4]?.v
            };
        });

        console.log("Sheet Data Loaded:", products);
        
        // ဒေတာ ရပြီဆိုမှ Page များကို Render လုပ်မည်
        renderFeatured();
        renderProducts();
        
    } catch (error) {
        console.error("Error fetching data:", error);
        showToast("⚠️ ပစ္စည်းစာရင်း ယူ၍မရပါ (Sheet ID မှားနေနိုင်သည်)");
    }
}

/**
 * ၂။ Toast Notification Logic
 */
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

/**
 * ၃။ Page Switching Logic
 */
function changeTab(pageId, btn) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.add('active');
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    btn.classList.add('active');
    window.scrollTo(0, 0);
}

/**
 * ၄။ Render Shop Products
 */
function renderProducts(filter = 'all') {
    const container = document.getElementById('product-list-container');
    if (!container) return;
    container.innerHTML = "";

    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);

    filtered.forEach(p => {
        let actionHTML = "";
        if (p.category === 'cake' && p.priceOptions) {
            let options = p.priceOptions.map(o => `<option value="${o.price}">${o.size} - ${o.price.toLocaleString()}K</option>`).join('');
            actionHTML = `
                <select id="size-${p.id}" class="size-select">${options}</select>
                <button class="add-btn" onclick="addToCartWithOptions('${p.name}', 'size-${p.id}')">Add to Cart</button>
            `;
        } else {
            actionHTML = `
                <p class="price">${p.price.toLocaleString()} Ks</p>
                <button class="add-btn" onclick="quickAdd('${p.name}', ${p.price})">Add to Cart</button>
            `;
        }
        container.innerHTML += `
            <div class="card">
                <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/150?text=Snow+White'">
                <h4>${p.name}</h4>
                ${actionHTML}
            </div>`;
    });
}

/**
 * ၅။ Render Featured Products (Home Page)
 */
function renderFeatured() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    const featured = products.slice(0, 2); 
    container.innerHTML = featured.map(p => `
        <div class="card">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/150?text=Snow+White'">
            <h4>${p.name}</h4>
            <p class="price">${p.category === 'cake' ? (p.priceOptions ? p.priceOptions[0].price.toLocaleString() : '0') : p.price.toLocaleString()} Ks</p>
            <button class="add-btn" onclick="navToShop()">View in Shop</button>
        </div>`).join('');
}

function navToShop() {
    const shopBtn = document.querySelectorAll('.nav-link')[1];
    changeTab('shop', shopBtn);
}

/**
 * ၆။ Add to Cart Logic
 */
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

/**
 * ၇။ Cart UI & Calculations
 */
function updateCartUI() {
    const list = document.getElementById('cart-items-list');
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
                <button onclick="removeItem(${index})" style="background:none; color:var(--deep-red); border:none; margin-left:10px; cursor:pointer;">✕</button>
            </div>
        </div>`).join('');
    calculateTotal();
}

function removeItem(index) {
    basket.splice(index, 1);
    updateCartUI();
    showToast(`❌ ပစ္စည်းကို ဖယ်ရှားလိုက်ပါပြီ`);
}

function calculateTotal() {
    const subtotal = basket.reduce((sum, item) => sum + item.price, 0);
    const deli = parseInt(document.getElementById('township').value) || 0;
    document.getElementById('grand-total').innerText = (subtotal + deli).toLocaleString();
}

/**
 * ၈။ Submit Order
 */
function submitOrder() {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const addr = document.getElementById('cust-address').value;
    const township = document.getElementById('township');
    const area = township.options[township.selectedIndex].text;

    if (!name || !phone || basket.length === 0) {
        showToast("⚠️ အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်ပေးပါ");
        return;
    }

    const orderData = {
        customerName: name,
        customerPhone: phone,
        customerAddress: addr,
        area: area,
        items: basket,
        totalAmount: document.getElementById('grand-total').innerText
    };

    if (typeof handleOrder === "function") {
        handleOrder(orderData);
    }
}

// App စတင်ချိန်တွင် Google Sheet မှ ဒေတာယူရန်
window.onload = fetchProducts;
