/**
 * GET  /api/admin/confirm-transfer?order=NOV-…&op=<nro operación>&sig=<hmac> → página con botón (NO confirma)
 * POST /api/admin/confirm-transfer (form order/op/sig) → confirma
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
// 30 s: además de los mails, una venta de tienda partner acredita al ledger y avisa al partner.
export const maxDuration = 30

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

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** Valida firma + estado. Devuelve la orden o la página de error/“ya confirmado”. */
async function load(order: string, op: string, sig: string): Promise<{ o: any } | { res: NextResponse }> {
  if (!process.env.TRANSFER_CONFIRM_SECRET) return { res: page("Sin configurar", "Falta TRANSFER_CONFIRM_SECRET en el entorno.", false) }
  if (!order || !op || !sig) return { res: page("Link incompleto", "Faltan parámetros (order, op, sig).", false) }

  const expected = transferConfirmSig(order, op)
  const a = Buffer.from(expected), b = Buffer.from(sig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { res: page("Link inválido", "La firma no coincide. Usá el link exacto del aviso.", false) }

  const o: any = await getOrderByNumber(order)
  if (!o) return { res: page("Pedido no encontrado", `No existe ${esc(order)}.`, false) }

  if (o.payment_status === "approved") {
    return { res: page(`${esc(order)} ya estaba confirmado ✅`, `Pago registrado (op. ${esc(o.payment_id || "?")}). No se reenviaron mails.`) }
  }
  if (o.payment_method !== "transferencia") {
    return { res: page("No es un pedido por transferencia", `${esc(order)} tiene payment_method="${esc(o.payment_method)}". Este atajo es solo para transferencias.`, false) }
  }
  return { o }
}

/**
 * GET NO confirma nada: muestra el pedido y un botón que hace POST.
 * 26/09/2026 (NOV-20260926-9852): el preview de links de Telegram (y los escáneres
 * de links de los mails) hacen GET a las URLs de los avisos → la orden se marcaba
 * pagada 3 s después de crearse y el cliente recibía "Recibimos tu pago" sin haber
 * pagado. Los bots de preview no envían formularios, así que el efecto va por POST.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const order = (url.searchParams.get("order") || "").trim()
  const op = (url.searchParams.get("op") || "").trim()
  const sig = (url.searchParams.get("sig") || "").trim()

  const r = await load(order, op, sig)
  if ("res" in r) return r.res
  const o = r.o
  const items = (o.items || []).map((it: any) => `<li><b>${esc(it.item_name || "Producto")}</b> x${esc(it.quantity || 1)}${it.product_size ? ` — Talle ${esc(it.product_size)}` : ""}</li>`).join("")
  const total = Number(o.total || 0).toLocaleString("es-AR")
  return page(
    `¿Confirmar pago de ${esc(order)}?`,
    `<p><b>$${total}</b> · ${esc(o.customer_first_name || "")} ${esc(o.customer_last_name || "")} · ${esc(o.customer_email || "-")}</p><ul>${items}</ul>
<p>Confirmá <b>solo si ya ves la transferencia acreditada en Mercado Pago</b>. Marca la orden pagada y le manda al cliente el mail de pago recibido.</p>
<form method="POST" action="/api/admin/confirm-transfer">
<input type="hidden" name="order" value="${esc(order)}"><input type="hidden" name="op" value="${esc(op)}"><input type="hidden" name="sig" value="${esc(sig)}">
<button type="submit" style="padding:12px 18px;background:#16a34a;color:#fff;border:0;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer">✅ Sí, la plata ya entró — confirmar</button>
</form>`,
  )
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const order = String(form?.get("order") || "").trim()
  const op = String(form?.get("op") || "").trim()
  const sig = String(form?.get("sig") || "").trim()

  const r = await load(order, op, sig)
  if ("res" in r) return r.res
  const o = r.o

  const now = new Date().toISOString()
  const meta: Record<string, any> = { ...(o.metadata || {}), transfer_confirmed_at: now, transfer_confirmed_via: "admin-link", transfer_op: op }
  // status → confirmed, igual que un pago aprobado por MP (antes quedaba en
  // "pending" con payment_status "approved", caso NOV-20260926-9852).
  const ok = await updateOrder(o.id, {
    payment_status: "approved",
    status: "confirmed",
    payment_id: op,
    metadata: meta,
    notes: `PAGADA POR TRANSFERENCIA (confirmada por link admin ${now.slice(0, 10)}) — op. ${op}.${o.notes ? ` | Antes: ${o.notes}` : ""}`,
  } as any)
  if (!ok) return page("No se pudo actualizar", "updateOrder devolvió false. Revisá la DB.", false)

  // Venta de tienda partner: mismos efectos que un pago MP (ganancia al ledger,
  // bridge a partner_orders, mail al partner, aviso de deuda). Antes este
  // camino NO acreditaba nada al partner. Si algo falla acá, el barrido diario
  // (lib/partners/ledger-sweep.ts) lo completa.
  let partnerNote = ""
  if (o.tenant_id) {
    try {
      const { runPartnerSaleEffects, partnerSaleKey } = await import("@/lib/partners/sale-effects")
      const orderConfirmada = { ...o, payment_status: "approved", status: "confirmed", payment_id: op, metadata: meta }
      const efectos = await runPartnerSaleEffects(orderConfirmada, {
        saleKey: partnerSaleKey(orderConfirmada),
        meta,
        notifyPartner: true,
      })
      Object.assign(meta, efectos.meta)
      const credits = efectos.credit?.credits || []
      partnerNote = credits.length
        ? `<br/>Ganancia partner acreditada: ${credits.map((c) => `$${c.amount.toLocaleString("es-AR")}${c.needsReview ? " (EN REVISIÓN)" : ""}`).join(" + ")}.`
        : "<br/>⚠️ No se pudo acreditar la ganancia del partner (lo reintenta el barrido diario)."
    } catch (e: any) {
      console.error("[confirm-transfer] efectos de venta partner fallaron:", e?.message)
      partnerNote = "<br/>⚠️ Falló la acreditación al partner (lo reintenta el barrido diario)."
    }
  }

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
    if (sent.ok) {
      meta.confirmation_email_sent_at = new Date().toISOString()
      await updateOrder(o.id, { metadata: meta } as any)
    }
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

  return page(`${order} confirmado ✅`, `Pago registrado (op. ${op}) por <b>$${total}</b>.<br/>Mail al cliente: ${mailCliente}.${partnerNote}<br/>${sinDireccion ? "⚠️ La orden no tiene dirección de envío — el mail se la pide." : `Envío a ${o.shipping_address}, ${o.shipping_city || ""}.`}<br/><br/>Ahora: cargar el pedido al proveedor desde la ficha en el admin.`)
}
