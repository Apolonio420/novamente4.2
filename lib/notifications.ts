/**
 * Utility for sending notifications via Telegram Bot API.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SALES_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_SALES || BOT_TOKEN;
const ERRORS_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_ERRORS || BOT_TOKEN;

const SALES_CHAT_ID = process.env.TELEGRAM_CHAT_ID_SALES;
const ERRORS_CHAT_ID = process.env.TELEGRAM_CHAT_ID_ERRORS;

/**
 * Common function to send a Telegram message
 */
async function sendToTelegram(chatId: string | undefined, message: string, token: string | undefined) {
    if (!token || !chatId) {
        console.warn('⚠️ Telegram notifications not configured: Missing token or chat ID');
        return null;
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
        });

        const data = await response.json();
        if (!data.ok) {
            console.error('❌ Telegram API error:', data.description);
            return null;
        }

        return data;
    } catch (error: any) {
        console.error('❌ Error sending Telegram notification:', error.message);
        return null;
    }
}

/**
 * Notifies a successful sale/payment
 */
export async function notifySale(order: {
    orderNumber: string;
    total: number;
    email: string;
    items: Array<{
        name: string;
        quantity: number;
        size?: string;
        color?: string;
        price?: number;
        imageUrl?: string;
    }>;
}) {
    const itemsText = order.items
        .map((item) => {
            let detail = `• <b>${item.name}</b> (x${item.quantity})`;
            if (item.size || item.color) {
                detail += `\n  └ Talle: ${item.size || '-'} | Color: ${item.color || '-'}`;
            }
            if (item.price) {
                detail += `\n  └ Precio unit: $${item.price.toLocaleString('es-AR')}`;
            }
            if (item.imageUrl) {
                detail += `\n  🔗 <a href="${item.imageUrl}">Ver Imagen/Mockup</a>`;
            }
            return detail;
        })
        .join('\n\n');

    const message = `
💰 <b>¡NUEVA VENTA!</b> 💰

<b>Pedido:</b> #${order.orderNumber}
<b>Cliente:</b> ${order.email}
<b>Total:</b> $${order.total.toLocaleString('es-AR')}

<b>Items:</b>
${itemsText}

✅ <i>Pago aprobado. ¡A preparar el pedido!</i>
  `.trim();

    return sendToTelegram(SALES_CHAT_ID, message, SALES_BOT_TOKEN);
}

/**
 * Notifies a critical system error
 */
export async function notifyError(error: {
    endpoint: string;
    message: string;
    area?: string;
    debugId?: string;
}) {
    const message = `
🚨 <b>ERROR DEL SISTEMA</b> 🚨

<b>Área:</b> ${error.area || 'Desconocida'}
<b>Endpoint:</b> <code>${error.endpoint}</code>
<b>Mensaje:</b> <code>${error.message}</code>
${error.debugId ? `<b>Debug ID:</b> <code>${error.debugId}</code>` : ''}

⚠️ <i>Se requiere atención inmediata.</i>
  `.trim();

    return sendToTelegram(ERRORS_CHAT_ID, message, ERRORS_BOT_TOKEN);
}

/**
 * Notifies a new partner application
 */
export async function notifyPartnerApplication(application: {
    fullName: string;
    email: string;
    phone?: string;
    brandName?: string;
    instagramHandle?: string;
    websiteUrl?: string;
    message?: string;
}) {
    const message = `
🤝 <b>¡NUEVA SOLICITUD DE PARTNER!</b> 🤝

<b>Nombre:</b> ${application.fullName}
<b>Email:</b> ${application.email}
<b>Teléfono:</b> ${application.phone || 'No especificado'}
<b>Marca:</b> ${application.brandName || 'No especificada'}
<b>Instagram:</b> ${application.instagramHandle || 'No indicado'}
<b>Sitio Web:</b> ${application.websiteUrl || 'No indicado'}

<b>Mensaje:</b>
${application.message || 'Sin mensaje adicional.'}

🚀 <i>¡Un nuevo potencial partner quiere sumarse!</i>
  `.trim();

    return sendToTelegram(SALES_CHAT_ID, message, SALES_BOT_TOKEN);
}
