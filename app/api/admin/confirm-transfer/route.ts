/**
 * GET /api/admin/confirm-transfer?order=NOV-…&op=<nro operación>&sig=<hmac>
 *
 * Confirmación EN UN CLICK de un pedido web pagado por TRANSFERENCIA.
 *
 * Por qué existe (07/09/2026, casos Marcelo/Ezequiel/Lisandro): una transferencia
 * directa a la cuenta de Mercado Pago no dispara ningún webhook, así que la
 * verificación la hace un humano mirando MP. Hasta hoy el paso siguiente era un
 * script en la Mac de Juan; si no se corría, el cliente no recibía NUNCA la
 * confirmación de compra. Ahora el aviso que le llega a Juan (Telegram/mail,
 * generado cuando el bot detecta un comprobante o cuando se crea el pedido) trae
 * un link a este endpoint: un click marca la orden pagada, le manda al cliente el
 * mail de "pago recibido / pedido confirmado" y avisa la venta por Telegram+mail.
 *
 * Seguridad: el link lleva sig = HMAC-SHA256(`${order}|${op}`, TRANSFER_CONFIRM_SECRET).
 * Sin secreto en la URL, no enumerable, y solo confirma la orden exacta del link.
 * Idempotente: si ya está approved, lo dice y no repite mails.
 */
import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { getOrderByNumber, updateOrder } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { transferConfirmSig } from "@/lib/payments/transfer-confirm"

export const dynamic = "force-dynamic"
export const maxDuration = 15

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://www.novamente.ar"

function page(title: string, body: string, ok = true) {
  return new NextResponse(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><div style="max-width:520px;margin:40px auto;background:#fff;border-radius:14px;padding:28px">
<h2 style="margin:0 0 12px;color:${ok ? "#111" : "#b00020"}">${title}</h2><div style="color:#444;font-size:15px;line-height:1.5">${body}</div>
<p style="margin-top:24px;color:#999;font-size:12px">Novamente · confirmación de transferencia</p></div></body></html>`,
    { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
  )
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const order = (url.searchParams.get("order") || "").trim()
  const op = (url.searchParams.get("op") || "").trim()
  const sig = (url.searchParams.get("sig") || "").trim()

  if (!process.env.TRANSFER_CONFIRM_SECRET) return page("Sin configurar", "Falta TRANSFER_CONFIRM_SECRET en el entorno.", false)
  if (!order || !op || !sig) return page("Link incompleto", "Faltan parámetros (order, op, sig).", false)

  const expected = transferConfirmSig(order, op)
  const a = Buffer.from(expected), b = Buffer.from(sig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return page("Link inválido", "La firma no coincide. Usá el link exacto del aviso.", false)

  const o: any = await getOrderByNumber(order)
  if (!o) return page("Pedido no encontrado", `No existe ${order}.`, false)

  if (o.payment_status === "approved") {
    return page(`${order} ya estaba confirmado ✅`, `Pago registrado (op. ${o.payment_id || "?"}). No se reenviaron mails.`)
  }
  if (o.payment_method !== "transferencia") {
    return page("No es un pedido por transferencia", `${order} tiene payment_method="${o.payment_method}". Este atajo es solo para transferencias.`, false)
  }

  const now = new Date().toISOString()
  const meta = { ...(o.metadata || {}), transfer_confirmed_at: now, transfer_confirmed_via: "admin-link", transfer_op: op }
  const ok = await updateOrder(o.id, {
    payment_status: "approved",
    payment_id: op,
    metadata: meta,
    notes: `PAGADA POR TRANSFERENCIA (confirmada por link admin ${now.slice(0, 10)}) — op. ${op}.${o.notes ? ` | Antes: ${o.notes}` : ""}`,
  } as any)
  if (!ok) return page("No se pudo actualizar", "updateOrder devolvió false. Revisá la DB.", false)

  const items = (o.items || []).map((it: any) => ({
    name: it.item_name || "Producto", qty: it.quantity || 1, size: it.product_size, color: it.product_color,
  }))
  const itemsHtml = items.map((i: any) => `<li><b>${i.name}</b> x${i.qty}${i.size ? ` — Talle ${i.size}` : ""}${i.color ? ` · ${i.color}` : ""}</li>`).join("")
  const sinDireccion = !o.shipping_address || /pendiente/i.test(String(o.shipping_address))
  const total = Number(o.total || 0).toLocaleString("es-AR")

  // 1) Mail al CLIENTE: pago recibido / pedido confirmado.
  let mailCliente = "sin email"
  if (o.customer_email) {
    const sent = await sendEmail({
      to: o.customer_email,
      subject: `Recibimos tu pago ✅ — pedido ${order}`,
      html: `<h2>¡Hola ${o.customer_first_name || ""}! Recibimos tu pago ✅</h2>
<p>Te confirmamos que nos llegó la transferencia de <b>$${total}</b> por tu pedido <b>${order}</b>:</p>
<ul>${itemsHtml}</ul>
<p>Tu pedido está confirmado y entra en producción (24-48 h hábiles).</p>
${sinDireccion
  ? `<p>Para poder despacharlo por Andreani <b>solo nos falta la dirección de envío</b>: respondé este mail con calle y número, localidad, código postal y DNI de quien recibe.</p>`
  : `<p><b>Envío a:</b> ${o.shipping_address}, ${o.shipping_city || ""}${o.shipping_postal_code ? ` (CP ${o.shipping_postal_code})` : ""}. Te avisamos con el número de seguimiento apenas se despache.</p>`}
<p>¡Gracias por tu compra! Cualquier duda, respondé este mail.</p>
<p>— Novamente · <a href="${BASE}">novamente.ar</a></p>`,
    })
    mailCliente = sent.ok ? `enviado a ${o.customer_email}` : `FALLÓ (${sent.error || "?"})`
    if (sent.ok) await updateOrder(o.id, { metadata: { ...meta, confirmation_email_sent_at: new Date().toISOString() } } as any)
  }

  // 2) Aviso de VENTA a Novamente (Telegram + mail), mismo patrón que los pagos MP.
  try {
    const { notifySale } = await import("@/lib/notifications")
    await notifySale({
      orderNumber: `✅ TRANSFERENCIA CONFIRMADA — ${order}`,
      total: Number(o.total || 0),
      email: o.customer_email || "N/A",
      items: (o.items || []).map((it: any) => ({ name: it.item_name || "Producto", quantity: it.quantity || 1, size: it.product_size, color: it.product_color, price: it.unit_price || 0, imageUrl: it.image_url || it.mockup_url || undefined })),
    })
  } catch (e) { console.error("[confirm-transfer] notifySale falló:", e) }
  try {
    await sendEmail({
      to: process.env.SALES_NOTIFY_EMAIL || "juan@novamente.ar",
      subject: `💰 VENTA por transferencia CONFIRMADA ${order} — $${total} (${o.customer_first_name || ""} ${o.customer_last_name || ""})`,
      html: `<h2>Transferencia confirmada ✅</h2><p><b>Pedido:</b> ${order} · <b>op:</b> ${op}<br/><b>Cliente:</b> ${o.customer_first_name || ""} ${o.customer_last_name || ""} · ${o.customer_email || "-"} · ${o.customer_phone || "-"}<br/><b>Envío:</b> ${o.shipping_address || "-"}, ${o.shipping_city || "-"} (CP ${o.shipping_postal_code || "-"})</p><ul>${itemsHtml}</ul><p>Mail al cliente: ${mailCliente}. Ficha: admin.novamente.ar/dashboard/orders/fichas</p>`,
    })
  } catch (e) { console.error("[confirm-transfer] mail venta falló:", e) }

  return page(`${order} confirmado ✅`, `Pago registrado (op. ${op}) por <b>$${total}</b>.<br/>Mail al cliente: ${mailCliente}.<br/>${sinDireccion ? "⚠️ La orden no tiene dirección de envío — el mail se la pide." : `Envío a ${o.shipping_address}, ${o.shipping_city || ""}.`}<br/><br/>Ahora: cargar el pedido al proveedor desde la ficha en el admin.`)
}
