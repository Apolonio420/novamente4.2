const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env.local not found');
        process.exit(1);
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

async function simulate() {
    console.log('🚀 Iniciando Simulación de Venta Dinámica (Precios Reales -> Notificación Real)\n');

    try {
        // 1. GENERAR IMAGEN REAL
        // (Opcional: Si el server no está arriba, usamos una imagen placeholder real de Novamente)
        let imageUrl = "https://novamente.ar/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png";

        try {
            const API_URL = 'http://localhost:3000';
            console.log(`🎨 Intentando generar imagen fresca via Gemini en ${API_URL}...`);

            const genRes = await fetch(`${API_URL}/api/generate-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: "Un diseño futurista para una remera, minimalista, NovaMente style",
                    n: 1
                })
            });

            if (genRes.ok) {
                const genData = await genRes.json();
                imageUrl = genData.images[0].url;
                console.log('✅ Imagen fresca generada!');
            } else {
                console.log('⚠️ Usando imagen de catálogo para el test (Server offline o error gen)');
            }
        } catch (e) {
            console.log('⚠️ Usando imagen de catálogo (Server unreachable)');
        }

        // 2. DATA DINÁMICA DE PRODUCTOS REALES (Buzo Hoodie Oversize @ $55.000)
        console.log('\n📦 Preparando datos de la orden con productos reales...');
        const mockOrder = {
            orderNumber: `ORDER-${Math.floor(Math.random() * 900000) + 100000}`,
            total: 55000,
            email: "cliente_pro@gmail.com",
            items: [
                {
                    name: "Buzo Hoodie Oversize - Negro",
                    quantity: 1,
                    size: "XL",
                    color: "Negro",
                    price: 55000,
                    imageUrl: imageUrl
                }
            ]
        };

        // 3. ENVIAR NOTIFICACIÓN REAL (Lógica idéntica a lib/notifications.ts)
        console.log('📡 Enviando notificación DINÁMICA a Telegram...');

        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_SALES;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID_SALES;

        const itemsText = mockOrder.items
            .map((item) => {
                let detail = `• <b>${item.name}</b> (x${item.quantity})`;
                detail += `\n  └ Talle: ${item.size} | Color: ${item.color}`;
                detail += `\n  └ Precio unit: $${item.price.toLocaleString('es-AR')}`;
                if (item.imageUrl) {
                    detail += `\n  🔗 <a href="${item.imageUrl}">Ver Imagen/Mockup</a>`;
                }
                return detail;
            })
            .join('\n\n');

        const message = `
💰 <b>¡NUEVA VENTA!</b> 💰

<b>Pedido:</b> #${mockOrder.orderNumber}
<b>Cliente:</b> ${mockOrder.email}
<b>Total:</b> $${mockOrder.total.toLocaleString('es-AR')}

<b>Items:</b>
${itemsText}

✅ <i>Pago aprobado. ¡A preparar el pedido!</i>
    `.trim();

        const notifRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const notifData = await notifRes.json();
        if (notifData.ok) {
            console.log('\n✨ ¡Venta dinámica enviada! Revisa el grupo de Telegram.');
        } else {
            console.error('\n❌ Error Telegram:', notifData.description);
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    }
}

simulate();
