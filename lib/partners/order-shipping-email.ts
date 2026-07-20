/**
 * Email de envío/tracking al comprador cuando un partner_order pasa a
 * fulfillment 'shipped'. Mismo look & feel (tabla 480px) que
 * ./pending-subscription-followup.ts y ./subscription-activated-email.ts.
 *
 * Separado de app/api/partners/orders/[id]/route.ts (que orquesta el envío +
 * el dedupe en shipping_info) para poder testear el armado del HTML/subject
 * sin mockear sendEmail ni Supabase.
 */
export interface OrderShippingItem {
  name: string
  quantity: number
  variant?: string | null
}

export function orderShippingSubject(orderRef: string): string {
  return `Tu pedido ${orderRef} está en camino 🚚`
}

/** Email al comprador — mismo estilo de tabla 480px que el resto de los transaccionales. */
export function orderShippingHtml(opts: {
  customerName?: string | null
  orderRef: string
  items: OrderShippingItem[]
  carrier?: string | null
  trackingNumber?: string | null
  trackingUrl?: string | null
  pedidoUrl?: string | null
}): string {
  const greetingName = opts.customerName?.trim() || 'Hola'
  const itemsHtml = opts.items.length
    ? `<table width="100%" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin:0 0 18px">
        ${opts.items
          .map(
            (i) =>
              `<tr><td style="padding:6px 0;color:#444;font-size:14px">${i.quantity} × ${i.name}${
                i.variant ? ` <span style="color:#999">(${i.variant})</span>` : ''
              }</td></tr>`,
          )
          .join('')}
      </table>`
    : ''

  const trackingLine =
    opts.carrier || opts.trackingNumber
      ? `<p style="font-size:14px;color:#333;margin:0 0 8px">
          ${opts.carrier ? `<b>Transportista:</b> ${opts.carrier}<br/>` : ''}
          ${opts.trackingNumber ? `<b>Código de seguimiento:</b> ${opts.trackingNumber}` : ''}
        </p>`
      : ''

  const trackingUrlLine = opts.trackingUrl
    ? `<p style="font-size:13px;margin:0 0 18px">
        <a href="${opts.trackingUrl}" style="color:#111;text-decoration:underline">Seguir el envío con el transportista →</a>
      </p>`
    : ''

  const pedidoCta = opts.pedidoUrl
    ? `<a href="${opts.pedidoUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 30px;border-radius:8px">
        Seguir mi pedido →
      </a>`
    : ''

  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
      <tr><td style="background:#111;padding:20px 28px;color:#fff;font-size:18px;font-weight:bold">Novamente</td></tr>
      <tr><td style="padding:28px">
        <p style="font-size:17px;color:#111;margin:0 0 6px"><b>¡${greetingName}! Tu pedido ${opts.orderRef} está en camino 🚚</b></p>
        <p style="font-size:14px;color:#555;line-height:1.5;margin:0 0 18px">
          Ya salió de producción y va para tu domicilio.
        </p>
        ${itemsHtml}
        ${trackingLine}
        ${trackingUrlLine}
        ${pedidoCta}
        <p style="font-size:12px;color:#999;margin:22px 0 0;line-height:1.5">
          ¿Dudas con tu pedido? Respondé este mail o escribinos por
          <a href="https://wa.me/5492235169720" style="color:#666">WhatsApp</a>.
        </p>
      </td></tr>
      <tr><td style="background:#fafafa;padding:14px 28px;font-size:11px;color:#aaa">
        Prendas premium estampadas on-demand en Argentina · novamente.ar
      </td></tr>
    </table>
  </td></tr></table></body></html>`
}

/** Construye subject + html listos para pasar a sendEmail. */
export function buildOrderShippingEmail(opts: {
  customerName?: string | null
  orderRef: string
  items: OrderShippingItem[]
  carrier?: string | null
  trackingNumber?: string | null
  trackingUrl?: string | null
  pedidoUrl?: string | null
}): { subject: string; html: string } {
  return {
    subject: orderShippingSubject(opts.orderRef),
    html: orderShippingHtml(opts),
  }
}
