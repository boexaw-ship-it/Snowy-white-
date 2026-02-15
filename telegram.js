/**
 * Telegram Bot API Configuration
 * ------------------------------------------------------
 * လမ်းညွှန်: 
 * ၁။ Telegram @BotFather မှာ Bot တစ်ခုဆောက်ပြီး API Token ယူပါ။
 * ၂။ @userinfobot မှာ သင့်ရဲ့ Chat ID ကို ယူပါ။
 */
const TELEGRAM_CONFIG = {
    token: "YOUR_BOT_TOKEN_HERE", // ဥပမာ - "12345678:ABCDE..."
    chatId: "YOUR_CHAT_ID_HERE"   // ဥပမာ - "987654321"
};

/**
 * Handle Order Function
 * ------------------------------------------------------
 * script.js ထဲက submitOrder() ကနေ ပို့လိုက်တဲ့ data တွေကို လက်ခံပြီး
 * Telegram API ဆီကို လှမ်းပို့ပေးပါတယ်။
 */
async function handleOrder(orderData) {
    // ပစ္စည်းစာရင်းကို စာသားအဖြစ် ပြောင်းလဲခြင်း
    const itemsList = orderData.items
        .map(item => `• ${item.name} (${item.price.toLocaleString()} K)`)
        .join('\n');

    // Telegram မှာ ပေါ်မယ့် စာသားပုံစံ (Template)
    // Markdown format ကို သုံးထားလို့ စာလုံးအထူ၊ အစောင်းတွေနဲ့ လှလှပပ ပေါ်မှာပါ
    const message = `
🍎 *NEW ORDER: Snow White's Boutique*
-----------------------------------------
👤 *Customer:* ${orderData.customerName}
📞 *Phone:* ${orderData.customerPhone}
🏠 *Address:* ${orderData.customerAddress || 'မဖြည့်ထားပါ'}
📍 *Township:* ${orderData.area}

🛒 *Ordered Items:*
${itemsList}

💰 *Total Amount:* *${orderData.totalAmount} Ks*
-----------------------------------------
⏰ *Order Date:* ${new Date().toLocaleString('en-GB')}
    `;

    // API URL
    const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.token}/sendMessage`;

    try {
        // ခလုတ်ကို ခေတ္တပိတ်ထားခြင်း (Double click မဖြစ်အောင်)
        const orderBtn = document.querySelector('.order-submit-btn');
        if (orderBtn) {
            orderBtn.disabled = true;
            orderBtn.innerText = "Sending...";
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CONFIG.chatId,
                text: message,
                parse_mode: 'Markdown' 
            })
        });

        const result = await response.json();

        if (result.ok) {
            // Order အောင်မြင်လျှင်
            alert("လူကြီးမင်း၏ Order ကို လက်ခံရရှိပါပြီ။ အမြန်ဆုံး ပြန်လည်ဆက်သွယ်ပေးပါမည်။");
            
            // ဈေးခြင်းကို ရှင်းထုတ်ပြီး UI ကို Update လုပ်မယ်
            basket = []; 
            if (typeof updateCartUI === "function") updateCartUI(); 
            
            // Home tab ကို ပြန်သွားမယ်
            const homeBtn = document.querySelectorAll('.nav-link')[0];
            if (homeBtn) changeTab('home', homeBtn);
            
            // Form တွေကို ရှင်းထုတ်မယ်
            document.getElementById('cust-name').value = "";
            document.getElementById('cust-phone').value = "";
            document.getElementById('cust-address').value = "";
            document.getElementById('township').value = "0";

        } else {
            // Telegram ဘက်က Error ပြန်ရင်
            throw new Error(result.description);
        }

    } catch (error) {
        console.error("Telegram Error:", error);
        alert("Order ပို့ရာတွင် အမှားတစ်ခုရှိနေပါသည်။ ကျေးဇူးပြု၍ ဖုန်းဖြင့် တိုက်ရိုက်ဆက်သွယ်ပေးပါ။");
    } finally {
        // ခလုတ်ကို ပြန်ဖွင့်ပေးမယ်
        const orderBtn = document.querySelector('.order-submit-btn');
        if (orderBtn) {
            orderBtn.disabled = false;
            orderBtn.innerText = "Confirm via Telegram";
        }
    }
}
