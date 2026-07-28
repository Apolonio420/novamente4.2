/**
 * Confirmación de pagos de MercadoPago — lógica compartida.
 *
 * La única fuente de verdad es la API de MP: acá se consulta el pago por id y,
 * según su estado real, se actualiza la orden y se disparan los efectos
 * (bridge a partner_orders, ledger, notificaciones, email al cliente, CAPI).
 *
 * Consumidores:
 *  - /api/webhooks/mercadopago  (notificación asíncrona de MP)
 *  - /api/payments/confirm      (fallback síncrono desde la success page)
 *  - cron abandoned-checkout    (verifica pagos ya existentes antes de emailear)
 *
 * Es seguro llamarla más de una vez con el mismo pago: la orden ya confirmada
 * con el mismo payment_id se saltea, y el email al cliente se guarda con marca
 * en metadata para no duplicarse.
 */
import { getOrderByExternalReference, updateOrder } from "@/lib/db"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { creditOrderMargin, reverseOrderMargin } from "@/lib/partners/ledger"
import { sendEmail } from "@/lib/email"
import { matchGarmentKey, matchStockColor, normalizeStockSize } from "@/lib/stock/liquidation"

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

const BASE = "https://www.novamente.ar"

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

export interface ProcessPaymentResult {
  ok: boolean
  reason?: string
  orderId?: string
  orderNumber?: string
  orderStatus?: string
  paymentStatus?: string
}

function confirmationHtml(opts: {
  firstName: string
  orderNumber: string
  items: Array<{ name: string; qty: number; size?: string; color?: string }>
  total: number
  trackUrl: string
}): string {
  const itemsHtml = opts.items
    .map((i) => {
      const variant = [i.size, i.color].filter((v) => v && v !== "N/A").join(" · ")
      return `<tr><td style="padding:6px 0;color:#444;font-size:14px">${i.qty} × ${i.name}${variant ? ` <span style="color:#999">(${variant})</span>` : ""}</td></tr>`
    })
    .join("")
  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
      <tr><td style="background:#111;padding:20px 28px;color:#fff;font-size:18px;font-weight:bold">Novamente</td></tr>
      <tr><td style="padding:28px">
        <p style="font-size:17px;color:#111;margin:0 0 6px"><b>¡Gracias ${opts.firstName}! Tu pago está confirmado ✅</b></p>
        <p style="font-size:14px;color:#555;line-height:1.5;margin:0 0 18px">
          Tu pedido <b>${opts.orderNumber}</b> ya entró a producción. Lo estampamos a pedido
          y sale en 24-72h hábiles.
        </p>
        <table width="100%" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin:0 0 14px">${itemsHtml}</table>
        <p style="font-size:15px;color:#111;margin:0 0 22px"><b>Total: ${fmt(opts.total)}</b></p>
        <a href="${opts.trackUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 30px;border-radius:8px">
          Seguir mi pedido →
        </a>
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

/**
 * Hallazgos [10]/[11] del review: dos invocaciones concurrentes de
 * processPaymentById para el MISMO pago (webhook + /api/payments/confirm
 * llegando casi al mismo tiempo, o dos reintentos de MP) leían la orden con
 * un status "pending" stale, pasaban ambas el guard de PASO 3 (que compara en
 * memoria, no en la base) y corrían el bloque de efectos completo dos veces:
 * doble email al cliente, doble aviso a Telegram/partner, doble bridge a
 * partner_orders. Acá cerramos la ventana con un UPDATE condicional atómico
 * (compare-and-swap a nivel fila): solo transiciona la orden si su status en
 * la base SIGUE siendo el mismo que se leyó en PASO 2. Si 0 filas fueron
 * afectadas, alguien más (la otra invocación concurrente) ya ganó la carrera
 * y ya está corriendo (o corrió) los efectos — este proceso no debe repetirlos.
 *
 * No se agregan locks externos ni colas: es el mismo patrón de "UPDATE ...
 * WHERE <precondición> RETURNING" que ya usa la RPC partner_request_payout
 * (migrations/20260622_partner_payout_transaction.sql) para serializar
 * retiros, aplicado acá a nivel de una sola fila con el cliente de Supabase
 * en vez de una función SQL (no hace falta una transacción multi-statement:
 * un solo UPDATE condicional alcanza para esta carrera de 2 lecturas).
 */
async function tryClaimOrderTransition(
  orderId: string,
  expectedCurrentStatus: string,
  updates: Record<string, any>,
): Promise<boolean> {
  const { data, error } = await (supabaseAdmin as any)
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .eq("status", expectedCurrentStatus)
    .select("id")
  if (error) {
    console.error("❌ Error en UPDATE condicional de orden:", error.message)
    return false
  }
  return Array.isArray(data) && data.length > 0
}

export async function processPaymentById(paymentId: string, webhookBody?: any): Promise<ProcessPaymentResult> {
  console.log("💳 Procesando pago ID:", paymentId)

  // PASO 1: Obtener detalles completos del pago desde MP (fuente de verdad).
  // external_reference vive AQUÍ, no en el body del webhook.
  const payment = new Payment(client)
  let paymentDetails: any
  try {
    paymentDetails = await payment.get({ id: paymentId })
  } catch (paymentError: any) {
    console.error("❌ Error al obtener detalles del pago desde MP:", paymentError.message)
    return { ok: false, reason: "mp_fetch_failed" }
  }

  console.log("📋 Payment details:", {
    id: paymentDetails.id,
    status: paymentDetails.status,
    status_detail: paymentDetails.status_detail,
    transaction_amount: paymentDetails.transaction_amount,
    external_reference: paymentDetails.external_reference,
  })

  const externalReference = paymentDetails.external_reference
  if (!externalReference) {
    console.warn("⚠️ Sin external_reference en payment details para paymentId:", paymentId)
    return { ok: false, reason: "no_external_reference" }
  }

  // PASO 2: Buscar la orden por external_reference
  const order = await getOrderByExternalReference(externalReference)
  if (!order) {
    console.error("❌ Orden no encontrada para external_reference:", externalReference)
    return { ok: false, reason: "order_not_found" }
  }

  console.log("✅ Orden encontrada:", order.id, "Número:", order.order_number, "Estado actual:", order.status)

  // PASO 3: Idempotencia — no reescribir si ya está confirmada con el mismo pago
  // Y el estado fresco de MP sigue siendo "approved". Si MP reenvía el mismo
  // paymentId ahora con status "refunded"/"charged_back", este guard NO debe
  // cortar antes de llegar al switch de PASO 4 (que sí mapea esos estados).
  //
  // Hallazgo [10]: antes este guard cortaba SIN re-ejecutar efectos, así que si
  // el proceso moría entre confirmar la orden (PASO 6) y acreditar el ledger /
  // notificar, el reintento de MP entraba acá y el margen del partner se perdía
  // para siempre. Ahora el retry re-corre los efectos, que son seguros de
  // repetir: bridge upsert (onConflict payment_id) y creditOrderMargin (unique
  // index) son idempotentes, y las notificaciones/email llevan guard en el
  // metadata FRESCO de la orden (partner_notified_at, confirmation_email_sent_at,
  // sale_notified_at) — lo ya hecho no se repite, lo que faltaba se completa.
  if (order.status === "confirmed" && order.payment_id === String(paymentId) && paymentDetails.status === "approved") {
    console.log("ℹ️ Orden ya confirmada con mismo payment_id — reconciliando efectos pendientes:", order.id)
    await runConfirmedOrderEffects(order, String(paymentId), paymentDetails, externalReference, {
      ...((order as any).metadata || {}),
    })
    return {
      ok: true,
      reason: "already_confirmed",
      orderId: String(order.id),
      orderNumber: order.order_number || undefined,
      orderStatus: "confirmed",
      paymentStatus: "approved",
    }
  }

  // PASO 4: Mapear estados de MP a estados internos
  let paymentStatus = "pending"
  let orderStatus = "pending"
  switch (paymentDetails.status) {
    case "approved":
      paymentStatus = "approved"
      orderStatus = "confirmed"
      break
    case "rejected":
      paymentStatus = "rejected"
      orderStatus = "cancelled"
      break
    case "cancelled":
      paymentStatus = "cancelled"
      orderStatus = "cancelled"
      break
    case "refunded":
      paymentStatus = "refunded"
      orderStatus = "cancelled"
      break
    case "charged_back":
      paymentStatus = "charged_back"
      orderStatus = "cancelled"
      break
    case "pending":
    case "in_process":
    case "in_meditation":
    default:
      paymentStatus = "pending"
      orderStatus = "pending"
      break
  }

  // PASO 5: Mergear metadata (preservar eventos previos, no pisar)
  const existingMetadata = (order as any).metadata || {}
  const newMetadata: Record<string, any> = {
    ...existingMetadata,
    ...(webhookBody ? { webhook_data: webhookBody } : {}),
    payment_details: {
      status: paymentDetails.status,
      status_detail: paymentDetails.status_detail,
      transaction_amount: paymentDetails.transaction_amount,
      currency_id: paymentDetails.currency_id,
      date_approved: paymentDetails.date_approved,
      date_created: paymentDetails.date_created,
      payment_method_id: paymentDetails.payment_method_id,
      payment_type_id: paymentDetails.payment_type_id,
    },
  }

  // PASO 5.5: Extraer DNI/CUIT del pagador desde MP (si esta disponible).
  // MP siempre captura la identificacion en pagos con tarjeta. Lo guardamos
  // en orders.customer_dni para facturacion AFIP y entrega Andreani.
  // Prioridad: card.cardholder.identification (titular real) > payer.identification.
  let extractedDni: string | null = null
  let extractedDniType: string | null = null
  try {
    const cardId = (paymentDetails as any)?.card?.cardholder?.identification
    const payerId = (paymentDetails as any)?.payer?.identification
    const chosen = cardId?.number ? cardId : payerId?.number ? payerId : null
    if (chosen) {
      extractedDni = String(chosen.number).trim()
      extractedDniType = String(chosen.type || "").trim().toUpperCase() || "DNI"
      console.log("🪪 DNI extraido de MP:", extractedDniType, extractedDni)
    }
  } catch (dniErr: any) {
    console.warn("⚠️ No se pudo extraer DNI:", dniErr.message)
  }

  // PASO 6: Actualizar orden en Supabase — UPDATE condicional atómico
  // (hallazgos [10]/[11]): la condición WHERE status = <lo que leímos en PASO 2>
  // hace de compare-and-swap a nivel fila. Si dos invocaciones concurrentes
  // (webhook + /api/payments/confirm, o dos reintentos de MP) leyeron la misma
  // orden "pending" y llegan acá casi al mismo tiempo, solo UNA de los dos
  // UPDATE afecta una fila — la otra recibe 0 filas y sabe que perdió la
  // carrera, sin haber corrido ningún efecto (email, ledger, notificaciones)
  // todavía. No hace falta un guard en memoria: la propia base decide.
  const orderUpdates: any = {
    payment_id: String(paymentId),
    payment_status: paymentStatus,
    status: orderStatus,
    metadata: newMetadata,
  }
  if (extractedDni && !(order as any).customer_dni) {
    orderUpdates.customer_dni = extractedDni
    orderUpdates.customer_dni_type = extractedDniType
  }

  const claimed = await tryClaimOrderTransition(order.id!, order.status || "pending", orderUpdates)

  if (!claimed) {
    // Perdimos la carrera: otra invocación concurrente ya transicionó esta
    // orden desde el mismo status que leímos. Releer el estado fresco para
    // responder correctamente sin re-ejecutar ningún efecto acá.
    const freshOrder = await getOrderByExternalReference(externalReference)
    console.log("ℹ️ UPDATE condicional no afectó filas (carrera concurrente ganada por otro proceso):", order.id, "status fresco:", freshOrder?.status)
    return {
      ok: true,
      reason: "already_processing_or_processed",
      orderId: String(order.id),
      orderNumber: order.order_number || undefined,
      orderStatus: freshOrder?.status || order.status,
      paymentStatus: (freshOrder as any)?.payment_status || undefined,
    }
  }

  console.log("✅ Orden actualizada:", order.id, "→ status:", orderStatus)

  // Refund/chargeback: revertir el margen del partner ya acreditado (si lo hubo).
  // Asiento inverso en el ledger — no toca notificaciones/email/CAPI del camino approved.
  if ((paymentStatus === "refunded" || paymentStatus === "charged_back") && orderStatus === "cancelled") {
    const tenantId = (order as any).tenant_id
    if (tenantId) {
      try {
        const result = await reverseOrderMargin({
          id: order.id as string,
          tenant_id: tenantId,
          order_number: order.order_number,
        })
        if (result.reversed) {
          console.log(`✅ Margen revertido ($${result.amount}) para orden ${order.order_number || order.id} por ${paymentStatus}`)
        }
      } catch (reverseErr: any) {
        console.error("❌ Exception revirtiendo margen del partner:", reverseErr.message)
      }
    }
  }

  if (paymentStatus === "approved" && orderStatus === "confirmed") {
    await runConfirmedOrderEffects(order, String(paymentId), paymentDetails, externalReference, newMetadata)
  }

  return {
    ok: true,
    orderId: String(order.id),
    orderNumber: order.order_number || undefined,
    orderStatus,
    paymentStatus,
  }
}

/**
 * Efectos post-confirmación de una orden pagada: bridge a partner_orders,
 * crédito del margen al ledger, aviso al partner, email al cliente, aviso de
 * venta y Meta CAPI.
 *
 * Hallazgo [10]: esta función DEBE ser segura de re-ejecutar. Se corre en el
 * camino normal tras ganar el claim de PASO 6, y también en cada retry que
 * entra por el guard de PASO 3 (orden ya confirmada con el mismo pago) — así,
 * si el proceso murió a mitad de los efectos, el reintento de MP o el fallback
 * /api/payments/confirm completan lo que faltó. Repetir es seguro: el bridge
 * es upsert (onConflict payment_id), creditOrderMargin es idempotente (unique
 * index), y las comunicaciones llevan guard persistido en metadata
 * (partner_notified_at / confirmation_email_sent_at / sale_notified_at).
 * CAPI dedupea en Meta por event_id = order.id.
 *
 * `baseMetadata` = metadata vigente de la orden (fresco en el camino de retry;
 * el recién escrito por el claim en el camino normal): de ahí se leen y sobre
 * él se persisten los guards.
 */
async function runConfirmedOrderEffects(
  order: any,
  paymentId: string,
  paymentDetails: any,
  externalReference: string,
  baseMetadata: Record<string, any>,
): Promise<void> {
  const meta: Record<string, any> = { ...baseMetadata }
  // (bloque preservado tal cual del camino inline original de processPaymentById)
  {
    console.log("🎉 Pago aprobado! Orden confirmada:", order.order_number)

    // Bridgear a partner_orders si la orden viene de un storefront partner
    const tenantId = (order as any).tenant_id
    let partnerMargin = 0
    if (tenantId) {
      try {
        const partnerOrderPayload = {
          tenant_id: tenantId,
          customer_name:
            `${(order as any).customer_first_name || ""} ${(order as any).customer_last_name || ""}`.trim() || null,
          customer_email: order.customer_email || null,
          customer_phone: (order as any).customer_phone || null,
          items: order.items || [],
          total: order.total || 0,
          currency: (order as any).currency || "ARS",
          status: "confirmed",
          payment_id: String(paymentId),
          payment_status: "approved",
          shipping_info: {
            address: (order as any).shipping_address || null,
            city: (order as any).shipping_city || null,
            postal_code: (order as any).shipping_postal_code || null,
            cost: (order as any).shipping_cost || 0,
          },
        }

        const { error: partnerOrderError } = await (supabaseAdmin as any)
          .from("partner_orders")
          .upsert({ ...partnerOrderPayload, updated_at: new Date().toISOString() }, { onConflict: "payment_id" })

        if (partnerOrderError) {
          console.error("❌ Error bridgeando a partner_orders:", partnerOrderError.message)
        } else {
          console.log("✅ Venta bridgeada a partner_orders para tenant:", tenantId)
        }

        // Ledger: acreditar el margen del partner por esta venta (idempotente)
        const credited = await creditOrderMargin({
          id: order.id as string,
          tenant_id: tenantId,
          order_number: order.order_number,
          items: order.items as any[],
        })
        partnerMargin = credited?.margin || 0
      } catch (bridgeErr: any) {
        console.error("❌ Exception bridgeando partner_orders:", bridgeErr.message)
      }

      // Avisar al PARTNER que su tienda vendió (antes solo se enteraba Novamente).
      // Guard en metadata para no duplicar si webhook + confirm procesan ambos.
      if (!meta.partner_notified_at) {
        try {
          const { data: tenant } = await (supabaseAdmin as any)
            .from("tenants")
            .select("name, email, metadata")
            .eq("id", tenantId)
            .maybeSingle()
          if (tenant?.email) {
            const { notifyPartnerOrder } = await import("@/lib/notifications")
            await notifyPartnerOrder(tenant, {
              customerName:
                `${(order as any).customer_first_name || ""} ${(order as any).customer_last_name || ""}`.trim() || null,
              items: (order.items || []).map((item: any) => ({
                name: item.item_name || "Producto",
                quantity: item.quantity || 1,
                color: item.product_color || undefined,
                talle: item.product_size || undefined,
                unit_price: item.unit_price || 0,
              })),
              pvpTotal: order.total || 0,
              partnerTotal: partnerMargin,
              produce: false,
              pedidoNumero: order.order_number || undefined,
            })
            meta.partner_notified_at = new Date().toISOString()
            await updateOrder(order.id!, { metadata: meta })
            console.log("✅ Partner notificado de la venta:", tenantId)
          }
        } catch (partnerNotifErr: any) {
          console.error("❌ Error notificando al partner:", partnerNotifErr.message)
        }
      }
    }

    // Decrementar stock finito de los productos vendidos (Fase 2). Solo toca
    // productos con stock != null; el decremento es ATÓMICO vía RPC (a prueba de
    // concurrencia entre ventas simultáneas del mismo producto, clampea a 0).
    // Guard en metadata para no re-decrementar en un retry idempotente del mismo pedido.
    if (!meta.stock_decremented_at) {
      try {
        const stockItems = (order.items || []).filter(
          (it: any) => it.partner_product_id && (it.quantity || 1) > 0,
        )
        if (stockItems.length) {
          for (const it of stockItems) {
            const { error: decErr } = await (supabaseAdmin as any).rpc(
              "decrement_partner_product_stock",
              { p_id: it.partner_product_id, p_qty: it.quantity || 1 },
            )
            if (decErr) console.error("❌ Error decrementando stock:", it.partner_product_id, decErr.message)
          }
          meta.stock_decremented_at = new Date().toISOString()
          await updateOrder(order.id!, { metadata: meta })
          console.log("✅ Stock decrementado para", stockItems.length, "item(s)")
        }
      } catch (stockErr: any) {
        console.error("❌ Exception decrementando stock:", stockErr.message)
      }
    }

    // Decrementar stock de LIQUIDACIÓN por talle (proveedor viejo, ver
    // lib/stock/liquidation.ts). Independiente del bloque de arriba (stock de
    // partner_products): esta tabla trackea SOLO buzo-oversize/remera-oversize
    // en los colores sin reposición. Si un item no matchea las 3 claves
    // (prenda/color/talle), decrement_garment_stock devuelve NULL y no pasa
    // nada — venta libre, igual que siempre.
    //
    // Claim ATÓMICO (no read-then-write) sobre la MISMA clave de metadata que
    // usa el confirm manual del platform (novamente-platform-master
    // app/api/admin/ventas/confirm/route.ts): UPDATE condicional con
    // WHERE metadata->>garment_stock_decremented_at IS NULL. Si el UPDATE no
    // devuelve fila, otro proceso (webhook duplicado, o el confirm manual del
    // platform corriendo en paralelo) ya reclamó el decremento — skip sin
    // tocar nada. Evita el doble descuento por carrera del guard read-then-write
    // anterior.
    if (!meta.garment_stock_decremented_at) {
      try {
        const stamp = new Date().toISOString()
        const { data: claimed, error: claimErr } = await (supabaseAdmin as any)
          .from("orders")
          .update({ metadata: { ...meta, garment_stock_decremented_at: stamp } })
          .eq("id", order.id)
          .filter("metadata->>garment_stock_decremented_at", "is", null)
          .select("id")
        if (claimErr) {
          console.error("❌ Error reclamando claim de garment_stock:", claimErr.message)
        } else if (claimed?.[0]) {
          // Reclamado: reflejar el flag en el `meta` en memoria para que los
          // updateOrder posteriores del mismo flujo (email, etc.) no lo pisen.
          meta.garment_stock_decremented_at = stamp
          const items = order.items || []
          for (const it of items as any[]) {
            const productKey = matchGarmentKey(it.product_type || "")
            const color = matchStockColor(it.product_color || "")
            const size = normalizeStockSize(it.product_size || "")
            if (!productKey || !color || !size) continue // no trackeado, venta libre
            const { data: resultQty, error: garmentDecErr } = await (supabaseAdmin as any).rpc(
              "decrement_garment_stock",
              {
                p_product_key: productKey,
                p_color: color,
                p_size: size,
                p_qty: it.quantity || 1,
              },
            )
            if (garmentDecErr) {
              console.error("❌ Error decrementando garment_stock:", productKey, color, size, garmentDecErr.message)
            } else if (resultQty !== null) {
              console.log("✅ garment_stock decrementado:", productKey, color, size, "→ qty:", resultQty)
            }
          }
        }
        // claimed vacío → alguien más lo reclamó primero, no re-decrementar.
      } catch (garmentStockErr: any) {
        console.error("❌ Exception decrementando garment_stock:", garmentStockErr.message)
      }
    }

    // Email de confirmación al CLIENTE (la success page lo promete desde siempre).
    // Guard en metadata para no duplicar entre webhook y confirm fallback.
    if (order.customer_email && !meta.confirmation_email_sent_at) {
      try {
        const sent = await sendEmail({
          to: order.customer_email,
          subject: `Tu pedido ${order.order_number || ""} está confirmado ✅`,
          html: confirmationHtml({
            firstName: (order as any).customer_first_name || "Hola",
            orderNumber: order.order_number || String(order.id).slice(0, 8),
            items: (order.items || []).map((item: any) => ({
              name: item.item_name || "Producto",
              qty: item.quantity || 1,
              size: item.product_size,
              color: item.product_color,
            })),
            total: Number(paymentDetails.transaction_amount) || Number(order.total) || 0,
            trackUrl: `${BASE}/pedido/${encodeURIComponent(externalReference)}`,
          }),
        })
        if (sent.ok) {
          meta.confirmation_email_sent_at = new Date().toISOString()
          await updateOrder(order.id!, { metadata: meta })
          console.log("✅ Email de confirmación enviado a:", order.customer_email)
        } else {
          console.error("❌ Email de confirmación falló:", sent.error)
        }
      } catch (emailErr: any) {
        console.error("❌ Exception enviando email de confirmación:", emailErr.message)
      }
    }

    // Aviso de venta a Novamente (Telegram + EMAIL). Guard sale_notified_at.
    //
    // ⚠️ FIX (2026-07-27, caso Celia NOV-20260722-5193 — venta de $62.000
    // pagada el 22/07 de la que Juan se enteró 5 días después POR LA CLIENTA):
    // 1. sendToTelegram devuelve null en silencio cuando falla (nunca lanza),
    //    y el flag sale_notified_at se marcaba INCONDICIONALMENTE → cualquier
    //    fallo transitorio de Telegram quedaba registrado como "avisado" y la
    //    venta moría invisible. Ahora el flag SOLO se marca si el envío
    //    devolvió ok — si falla, el próximo retry idempotente reintenta.
    // 2. El único aviso era Telegram (se pierde entre alertas). Ahora la venta
    //    también avisa por EMAIL (SALES_NOTIFY_EMAIL, default juan@novamente.ar)
    //    con guard propio — dos canales independientes.
    if (!meta.sale_notified_at) {
      try {
        const { notifySale } = await import("@/lib/notifications")
        const tgResult = await notifySale({
          orderNumber: order.order_number || order.id || "N/A",
          total: order.total || 0,
          email: order.customer_email || "N/A",
          items: (order.items || []).map((item: any) => ({
            name: item.item_name || "Producto",
            quantity: item.quantity || 1,
            size: item.product_size || "N/A",
            color: item.product_color || "N/A",
            price: item.unit_price || 0,
            imageUrl: item.image_url || item.mockup_url || null,
          })),
        })
        if (tgResult) {
          meta.sale_notified_at = new Date().toISOString()
          await updateOrder(order.id!, { metadata: meta })
        } else {
          console.error("❌ notifySale (Telegram) devolvió null — NO se marca sale_notified_at, se reintentará en el próximo retry")
        }
      } catch (notifErr: any) {
        console.error("❌ Error enviando notificación de venta:", notifErr.message)
      }
    }

    // EMAIL de venta a Novamente — canal independiente del Telegram.
    if (!meta.sale_email_sent_at) {
      try {
        const salesEmail = process.env.SALES_NOTIFY_EMAIL || "juan@novamente.ar"
        const itemsHtml = (order.items || [])
          .map((item: any) => `<li><b>${item.item_name || "Producto"}</b> x${item.quantity || 1} — Talle ${item.product_size || "-"} · ${item.product_color || "-"}</li>`)
          .join("")
        const sent = await sendEmail({
          to: salesEmail,
          subject: `💰 VENTA ${order.order_number || ""} — $${Number(order.total || 0).toLocaleString("es-AR")} (${(order as any).customer_first_name || ""} ${(order as any).customer_last_name || ""})`,
          html: `<h2>Nueva venta pagada ✅</h2>
<p><b>Pedido:</b> ${order.order_number || order.id}<br/>
<b>Total:</b> $${Number(order.total || 0).toLocaleString("es-AR")}<br/>
<b>Cliente:</b> ${(order as any).customer_first_name || ""} ${(order as any).customer_last_name || ""} · ${order.customer_email || "-"} · ${(order as any).customer_phone || "-"}<br/>
<b>Envío:</b> ${(order as any).shipping_address || "-"}, ${(order as any).shipping_city || "-"} (CP ${(order as any).shipping_postal_code || "-"})</p>
<ul>${itemsHtml}</ul>
<p>Ficha y assets: admin.novamente.ar/dashboard/orders/fichas</p>`,
        })
        if (sent.ok) {
          meta.sale_email_sent_at = new Date().toISOString()
          await updateOrder(order.id!, { metadata: meta })
          console.log("✅ Email de venta enviado a:", salesEmail)
        } else {
          console.error("❌ Email de venta falló:", sent.error)
        }
      } catch (emailErr: any) {
        console.error("❌ Exception enviando email de venta:", emailErr.message)
      }
    }

    // ── Meta Conversions API (CAPI) — server-side Purchase event ──
    // Usa transaction_amount real de MP (no del cart cliente que puede estar vacío/stale).
    // Dedup con event_id = order.id contra el Pixel browser-side.
    // Si las env vars META_PIXEL_ID / META_CAPI_ACCESS_TOKEN faltan, no rompe el pago.
    try {
      const { sendCapiPurchase } = await import("@/lib/meta/capi")
      const capiResult = await sendCapiPurchase(
        {
          orderId: String(order.id),
          value: Number(paymentDetails.transaction_amount) || Number(order.total) || 0,
          currency: paymentDetails.currency_id || (order as any).currency || "ARS",
          items: (order.items || []).map((item: any) => ({
            id: item.product_id || item.item_id || undefined,
            quantity: item.quantity || 1,
            price: item.unit_price || undefined,
          })),
          actionSource: "website",
          eventSourceUrl: "https://novamente.ar/checkout/success",
        },
        {
          email: order.customer_email || undefined,
          phone: (order as any).customer_phone || undefined,
          firstName: (order as any).customer_first_name || undefined,
          lastName: (order as any).customer_last_name || undefined,
          externalId: String(order.id),
        }
      )
      if (capiResult.ok) {
        console.log("✅ Meta CAPI Purchase enviado:", order.order_number, "→ value:", paymentDetails.transaction_amount)
      } else if (capiResult.skipped === "not_configured") {
        console.warn("⚠️ Meta CAPI no configurado — agregar META_PIXEL_ID y META_CAPI_ACCESS_TOKEN en Vercel")
      } else {
        console.error("❌ Meta CAPI falló:", capiResult.error)
      }
    } catch (capiErr: any) {
      console.error("❌ Exception Meta CAPI:", capiErr.message)
    }
  }
}

/**
 * Busca en MP un pago APROBADO para un external_reference dado.
 * Usado por el cron de recupero para no ofrecerle un link de pago nuevo a
 * alguien que ya pagó (webhook y confirm fallback pudieron haber fallado).
 */
export async function findApprovedPaymentByReference(externalReference: string): Promise<string | null> {
  try {
    const payment = new Payment(client)
    const search: any = await payment.search({
      options: { external_reference: externalReference, sort: "date_created", criteria: "desc" } as any,
    })
    const results: any[] = search?.results || []
    const approved = results.find((p) => p?.status === "approved")
    return approved ? String(approved.id) : null
  } catch (e: any) {
    console.warn("⚠️ MP search por external_reference falló:", e?.message)
    return null
  }
}
