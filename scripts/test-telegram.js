const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env.local not found');
        return;
    }
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            let val = match[2].trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            process.env[match[1].trim()] = val;
        }
    });
}

loadEnv();

const GLOBAL_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SALES_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_SALES || GLOBAL_BOT_TOKEN;
const ERRORS_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_ERRORS || GLOBAL_BOT_TOKEN;

const SALES_CHAT_ID = process.env.TELEGRAM_CHAT_ID_SALES;
const ERRORS_CHAT_ID = process.env.TELEGRAM_CHAT_ID_ERRORS;

async function testTelegram() {
    console.log('🤖 Starting Enhanced Dual Telegram Bot API test...\n');

    // 1. Test Sales Bot with Rich Data
    if (SALES_BOT_TOKEN && SALES_CHAT_ID) {
        const richMessage = `
💰 <b>¡NUEVA VENTA! (TEST)</b> 💰

<b>Pedido:</b> #TEST-1234
<b>Cliente:</b> test@user.com
<b>Total:</b> $15.500

<b>Items:</b>
• <b>Remera Oversize</b> (x2)
  └ Talle: XL | Color: Negro
  └ Precio unit: $7.750
  🔗 <a href="https://novamente.ar">Ver Imagen/Mockup</a>

✅ <i>Pago aprobado. Integration test successful.</i>
    `.trim();

        console.log(`📡 Sending rich test message to Sales Chat (${SALES_CHAT_ID})...`);
        try {
            const res = await fetch(`https://api.telegram.org/bot${SALES_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: SALES_CHAT_ID,
                    text: richMessage,
                    parse_mode: 'HTML'
                })
            });
            const data = await res.json();
            if (data.ok) console.log('✅ Enhanced Sales message sent successfully!');
            else console.error('❌ Sales message failed:', data.description);
        } catch (err) {
            console.error('❌ Network error (Sales):', err.message);
        }
    }

    console.log('\n-------------------\n');

    // 2. Test Errors Bot with Area
    if (ERRORS_BOT_TOKEN && ERRORS_CHAT_ID) {
        const errorMessage = `
🚨 <b>ERROR DEL SISTEMA (TEST)</b> 🚨

<b>Área:</b> Generador de Imágenes (Gemini)
<b>Endpoint:</b> <code>/api/generate-image</code>
<b>Mensaje:</b> <code>Quota exceeded or API timeout</code>
<b>Debug ID:</b> <code>test-debug-99</code>

⚠️ <i>Se requiere atención inmediata. Integration test successful.</i>
    `.trim();

        console.log(`📡 Sending rich test message to Errors Chat (${ERRORS_CHAT_ID})...`);
        try {
            const res = await fetch(`https://api.telegram.org/bot${ERRORS_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: ERRORS_CHAT_ID,
                    text: errorMessage,
                    parse_mode: 'HTML'
                })
            });
            const data = await res.json();
            if (data.ok) console.log('✅ Enhanced Errors message sent successfully!');
            else console.error('❌ Errors message failed:', data.description);
        } catch (err) {
            console.error('❌ Network error (Errors):', err.message);
        }
    }
}

testTelegram();
