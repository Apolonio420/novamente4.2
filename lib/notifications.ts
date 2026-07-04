/**
 * Utility for sending notifications via Telegram Bot API.
 */
import { sendEmail } from './email';
import type { Tenant } from './partners/types';

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
 * Alerta de sospecha de doble cobro con DOS payment ids distintos de MP para
 * el mismo período de suscripción activo (hallazgo [18] del review
 * docs/reviews/REVIEW-caminos-de-plata-2026-07-03.md). No bloquea el cobro:
 * el pago se procesa normal, esto es solo una alerta para que el equipo audite
 * manualmente si corresponde reembolsar el segundo cobro.
 */
export async function notifyPossibleDoubleCharge(alert: {
  tenantName: string
  amountArs: number
  previousPaymentId: string
  newPaymentId: string
  previousPaymentDate: string
  newPaymentDate: string
}) {
  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('es-AR')
  }
  const message = `
⚠️ <b>POSIBLE DOBLE COBRO — SUSCRIPCIÓN PARTNER</b> ⚠️

<b>Partner:</b> ${alert.tenantName}
<b>Monto:</b> $${alert.amountArs.toLocaleString('es-AR')}

<b>Pago anterior:</b> <code>${alert.previousPaymentId}</code> (${fmtDate(alert.previousPaymentDate)})
<b>Pago nuevo:</b> <code>${alert.newPaymentId}</code> (${fmtDate(alert.newPaymentDate)})

<i>Dos payment ids distintos de MP cayeron dentro del mismo período de
suscripción activo. El pago nuevo se procesó normalmente — revisar si
corresponde reembolsar uno de los dos.</i>
  `.trim()

  return sendToTelegram(SALES_CHAT_ID, message, SALES_BOT_TOKEN)
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

// ── Carga manual de pedidos por el partner ─────────────────────────────────
//
// REGLA DE FUGA: el partner solo ve PVP + su precio Partner. El costo del
// proveedor y el margen NUNCA aparecen acá (viven solo en platform-master).

export interface ManualOrderItemNotice {
    name: string;
    quantity: number;
    color?: string;
    talle?: string;
    unit_price?: number;     // PVP unitario
    partner_price?: number;  // precio partner unitario (lo conoce el partner)
}

export interface ManualOrderNotice {
    customerName?: string | null;
    items: ManualOrderItemNotice[];
    pvpTotal: number;
    partnerTotal: number;
    produce: boolean;
    pedidoNumero?: string;
}

function itemsLines(items: ManualOrderItemNotice[]): string {
    return items
        .map((i) => {
            const variant = [i.color, i.talle].filter(Boolean).join(' · ');
            return `• ${i.quantity}x <b>${i.name}</b>${variant ? ` (${variant})` : ''}`;
        })
        .join('\n');
}

function ars(n: number): string {
    return `$${(n || 0).toLocaleString('es-AR')}`;
}

/**
 * Avisa al EQUIPO (canal interno) que un partner cargó una venta.
 * Solo para cargas que NO disparan producción — cuando sí producen, el aviso
 * con economía completa (incluye costo proveedor) lo manda platform-master.
 * Incluye PVP + precio partner; NUNCA costo del proveedor (este repo no lo tiene).
 */
export async function notifyTeamManualSale(tenantName: string, order: ManualOrderNotice) {
    const message = `
🧾 <b>VENTA CARGADA POR PARTNER</b>

<b>Partner:</b> ${tenantName}
<b>Cliente:</b> ${order.customerName || '—'}
<b>Modo:</b> ${order.produce ? 'Producir con Novamente' : 'Solo registro'}

<b>Items:</b>
${itemsLines(order.items)}

<b>PVP (cobra el partner):</b> ${ars(order.pvpTotal)}
<b>Precio partner (nos transfiere):</b> ${ars(order.partnerTotal)}
  `.trim();

    return sendToTelegram(SALES_CHAT_ID, message, SALES_BOT_TOKEN);
}

/**
 * Avisa al PARTNER (email + Telegram opcional) que se registró una venta.
 * Partner-safe: producto, cantidad, cliente, PVP y su precio Partner.
 * NUNCA incluye costo del proveedor ni margen de Novamente.
 */
export async function notifyPartnerOrder(
    tenant: Pick<Tenant, 'name' | 'email' | 'metadata'>,
    order: ManualOrderNotice,
) {
    const itemRows = order.items
        .map((i) => {
            const variant = [i.color, i.talle].filter(Boolean).join(' · ');
            return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${i.quantity}x ${i.name}${variant ? ` <span style="color:#888">(${variant})</span>` : ''}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${ars((i.unit_price || 0) * i.quantity)}</td>
      </tr>`;
        })
        .join('');

    const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h2 style="margin:0 0 4px">Nueva venta registrada ✅</h2>
      <p style="color:#555;margin:0 0 16px">Se cargó un pedido en tu panel${order.produce ? ' y se envió a producción con Novamente' : ''}.</p>
      ${order.customerName ? `<p style="margin:0 0 12px"><b>Cliente:</b> ${order.customerName}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:14px">${itemRows}</table>
      <p style="margin:16px 0 4px"><b>Total al cliente (PVP):</b> ${ars(order.pvpTotal)}</p>
      <p style="margin:0 0 4px"><b>Tu precio Novamente:</b> ${ars(order.partnerTotal)}</p>
      ${order.pedidoNumero ? `<p style="margin:12px 0 0;color:#555">N° de pedido de producción: ${order.pedidoNumero}</p>` : ''}
      <p style="margin:20px 0 0;color:#888;font-size:12px">Podés ver y gestionar este pedido en tu panel de Novamente.</p>
    </div>`;

    // Email (canal principal)
    if (tenant.email) {
        await sendEmail({
            to: tenant.email,
            subject: 'Nueva venta registrada en tu tienda',
            html,
        }).catch(() => null);
    }

    // Telegram al partner (opcional) si configuró su chat en metadata
    const chatId = (tenant.metadata as Record<string, unknown> | undefined)?.['telegram_chat_id'];
    if (typeof chatId === 'string' && chatId) {
        const msg = `
🧾 <b>Nueva venta registrada</b>

${order.customerName ? `<b>Cliente:</b> ${order.customerName}\n` : ''}${itemsLines(order.items)}

<b>Total al cliente:</b> ${ars(order.pvpTotal)}
<b>Tu precio Novamente:</b> ${ars(order.partnerTotal)}
    `.trim();
        await sendToTelegram(chatId, msg, SALES_BOT_TOKEN);
    }
}
