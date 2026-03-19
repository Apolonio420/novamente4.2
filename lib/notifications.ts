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

/**
 * Notifies a new partner subscription payment
 */
export async function notifyPartnerSubscription(subscription: {
    tenantName: string;
    plan: string;
    priceUsd: number;
    priceArs: number;
    billingCycle: string;
    tenantEmail: string;
    tenantSlug: string;
}) {
    const message = `
🎉 <b>¡NUEVA SUSCRIPCIÓN PARTNER!</b> 🎉

<b>Marca:</b> ${subscription.tenantName}
<b>Plan:</b> ${subscription.plan.toUpperCase()}
<b>Ciclo:</b> ${subscription.billingCycle === 'annual' ? 'Anual (-15%)' : 'Mensual'}
<b>Precio:</b> US$${subscription.priceUsd} (ARS $${subscription.priceArs.toLocaleString('es-AR')})
<b>Email:</b> ${subscription.tenantEmail}
<b>Storefront:</b> novamente.ar/p/${subscription.tenantSlug}

💰 <i>¡Nuevo ingreso recurrente!</i>
  `.trim();

    return sendToTelegram(SALES_CHAT_ID, message, SALES_BOT_TOKEN);
}

/**
 * Notifies a partner subscription expiring soon
 */
export async function notifySubscriptionExpiring(tenant: { name: string; plan: string; expiresAt: string }) {
    const message = `
⚠️ <b>SUSCRIPCIÓN POR VENCER</b>

<b>Partner:</b> ${tenant.name}
<b>Plan:</b> ${tenant.plan.toUpperCase()}
<b>Vence:</b> ${new Date(tenant.expiresAt).toLocaleDateString('es-AR')}

📌 <i>Contactar al partner para renovación.</i>
  `.trim();
    return sendToTelegram(SALES_CHAT_ID, message, SALES_BOT_TOKEN);
}

/**
 * Notifies a partner has been suspended for non-payment
 */
export async function notifySubscriptionSuspended(tenant: { name: string; plan: string; email: string }) {
    const message = `
🔴 <b>PARTNER SUSPENDIDO</b>

<b>Partner:</b> ${tenant.name}
<b>Plan:</b> ${tenant.plan.toUpperCase()}
<b>Email:</b> ${tenant.email}
<b>Motivo:</b> 3+ pagos fallidos

⛔ <i>Storefront desactivado. Contactar para resolver.</i>
  `.trim();
    return sendToTelegram(SALES_CHAT_ID, message, SALES_BOT_TOKEN);
}

/**
 * Notifies a new lead from a partner storefront
 */
export async function notifyNewLead(lead: {
    tenantName: string;
    tenantSlug: string;
    leadName: string;
    leadEmail: string;
    leadPhone?: string;
    message?: string;
}) {
    const msg = `
📩 <b>NUEVO LEAD</b>

<b>Partner:</b> ${lead.tenantName}
<b>Nombre:</b> ${lead.leadName}
<b>Email:</b> ${lead.leadEmail}
<b>Teléfono:</b> ${lead.leadPhone || 'No indicado'}
${lead.message ? `<b>Mensaje:</b> ${lead.message}` : ''}

🔗 <a href="https://www.novamente.ar/p/${lead.tenantSlug}">Ver storefront</a>
  `.trim();

    return sendToTelegram(SALES_CHAT_ID, msg, SALES_BOT_TOKEN);
}
