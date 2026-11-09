/**
 * Atribución de VENTAS WEB en `sale_attributions` (09/11/2026).
 *
 * Problema: `sale_attributions` es la tabla que cruza venta ↔ origen (anuncio,
 * orgánico, partner…) y hasta hoy solo la escribía el bot de WhatsApp
 * (chatbot-whastapp, lib/sace/sale-attribution.ts). Las ventas de la tienda web
 * no dejaban fila, así que la única venta cobrada de noviembre
 * (NOV-20261105-9051, $41.030) quedó sin atribuir
 * (chatbot/reuniones/growth/atribucion-verificacion-2026-11-09.md).
 *
 * Qué hace: cuando un pedido web queda CONFIRMADO con el pago acreditado
 * (webhook/fallback de MercadoPago o confirmación de transferencia), escribe UNA
 * fila con:
 *   - source = 'web' (el canal: compra en la tienda, no chat del bot);
 *   - origin = de dónde vino el tráfico, derivado de las columnas de atribución
 *     que `orders` ya guarda (UTM, fbclid, gclid, landing, referrer);
 *   - quoted_total_ars = total del pedido (lo que cotizó el checkout) y
 *     confirmed_total_ars = lo que efectivamente se cobró.
 *
 * Regla cotización ≠ venta (memoria feedback-sale-attributions-cotizacion-vs-venta):
 * esta función solo se llama con el pago aprobado y la orden confirmada, así que
 * cada fila `web` es una venta real. Un checkout abandonado o pendiente NO deja
 * fila (no hay "cotizaciones web" en la tabla).
 *
 * `origin='web'` NO se usa acá: en el bot significa "chat de WhatsApp que entró
 * por el botón de la web". El canal tienda va en `source`, el origen del tráfico
 * en `origin` (mismo vocabulario que el bot).
 *
 * Fail-soft: nunca lanza. Si la migración
 * migrations/20261109_sale_attributions_source_web.sql no está aplicada, el
 * insert falla por el CHECK de `source`, se loguea y el pago sigue su curso.
 * Kill switch: SALE_ATTRIBUTION_ENABLED=false (igual que el bot).
 */
import { supabaseAdmin } from "@/lib/supabase-admin"

export type SaleOrigin = "ad" | "organico" | "web" | "outreach" | "partner" | "interno" | "desconocido"

/** Columnas de `orders` que hacen falta para atribuir una venta web. */
export interface WebSaleOrder {
  id?: string | null
  order_number?: string | null
  total?: number | string | null
  tenant_id?: string | null
  customer_phone?: string | null
  payment_method?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
  fbclid?: string | null
  gclid?: string | null
  landing_page?: string | null
  referrer?: string | null
}

export interface WebSaleConfirmation {
  /** Monto efectivamente cobrado (MP: transaction_amount). Sin dato → total del pedido. */
  confirmedTotalArs?: number | null
  /** 'mercadopago' | 'transfer'. Sin dato → orders.payment_method. */
  paymentMethod?: string | null
}

export type WebSaleAttributionResult = "inserted" | "exists" | "skipped" | "error" | "disabled"

export function saleAttributionEnabled(): boolean {
  return process.env.SALE_ATTRIBUTION_ENABLED !== "false"
}

const clean = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

/**
 * Pura — mismo formato que el bot (`sace_sessions.phone_e164`): E.164 en dígitos
 * sin "+", Argentina 549 + 10 dígitos. Además saca el prefijo internacional
 * "00" que deja el formulario web (NOV-20261105-9051 guardó "005492364507764").
 */
export function canonicalPhone(phone: string | null | undefined): string {
  let d = String(phone ?? "").replace(/\D/g, "")
  if (d.startsWith("00")) d = d.slice(2)
  if (d.length === 10) return `549${d}`
  if (d.length === 11 && d.startsWith("0")) return `549${d.slice(1)}`
  if (d.length === 12 && d.startsWith("54") && !d.startsWith("549")) return `549${d.slice(2)}`
  return d
}

/** Teléfonos internos (pruebas/admin), misma variable que el bot; match por últimos 10 dígitos. */
export function isInternalPhone(phone: string | null | undefined, env: string | undefined = process.env.SALE_ATTRIBUTION_INTERNAL_PHONES): boolean {
  const tail = (p: string) => String(p || "").replace(/\D/g, "").slice(-10)
  const mine = tail(String(phone ?? ""))
  if (!mine || !env) return false
  return env.split(",").map(tail).filter(Boolean).includes(mine)
}

/**
 * Medios pagos. La convención de Novamente para anuncios a la web es
 * `utm_source=meta&utm_medium=paid` (regla de Juan 29/09, memoria
 * feedback-ads-siempre-medibles-utm-numero-verificar); el generador de links de
 * partners usa `paid_social`. Se aceptan además los nombres estándar.
 */
const PAID_MEDIUM_RX = /^(paid|paid[_ -]?(social|search|media|ads?)|cpc|ppc|cpm|cpa|ads?|display|retargeting|remarketing)$/i
const OUTREACH_MEDIUM_RX = /^(e-?mail|mail|newsletter|outreach|dm|mailing)$/i
const OUTREACH_SOURCE_RX = /^(outreach|e-?mail|newsletter|resend|mailing)$/i

function externalReferrerHost(referrer: string): string | null {
  if (!referrer) return null
  try {
    const host = new URL(referrer).host.toLowerCase().replace(/^www\./, "")
    if (!host || /(^|\.)novamente\.ar$/.test(host)) return null
    return host
  } catch {
    return null
  }
}

/**
 * Pura — origen de una venta web. Nunca inventa: sin evidencia → 'desconocido'.
 * Prioridad (la misma que `deriveSaleOrigin` del bot):
 *   interno  teléfono de prueba/admin (SALE_ATTRIBUTION_INTERNAL_PHONES)
 *   partner  venta en la tienda de un partner (orders.tenant_id)
 *   ad       gclid, o utm_medium pago (paid, paid_social, cpc…)
 *   outreach utm de mail/outreach nuestro
 *   organico hay rastro externo sin señal de pago: UTM no paga, fbclid suelto
 *            (Meta lo agrega también a los links orgánicos de FB/IG; nuestros
 *            anuncios siempre llevan utm_medium=paid) o referrer externo
 *   desconocido  nada de lo anterior (visita directa o atribución no capturada)
 */
export function deriveWebSaleOrigin(order: WebSaleOrder, internalPhonesEnv?: string): SaleOrigin {
  if (isInternalPhone(order.customer_phone, internalPhonesEnv ?? process.env.SALE_ATTRIBUTION_INTERNAL_PHONES)) return "interno"
  if (clean(order.tenant_id)) return "partner"
  const medium = clean(order.utm_medium)
  const source = clean(order.utm_source)
  if (clean(order.gclid)) return "ad"
  if (medium && PAID_MEDIUM_RX.test(medium)) return "ad"
  if ((medium && OUTREACH_MEDIUM_RX.test(medium)) || (source && OUTREACH_SOURCE_RX.test(source))) return "outreach"
  const anyUtm = [order.utm_source, order.utm_medium, order.utm_campaign, order.utm_content, order.utm_term].some((v) => clean(v))
  if (anyUtm || clean(order.fbclid) || externalReferrerHost(clean(order.referrer))) return "organico"
  return "desconocido"
}

/** Pura — 'transfer' | 'card' (vocabulario del bot: el link de MP cuenta como 'card'). */
export function webPaymentMethod(method: string | null | undefined): "transfer" | "card" {
  return /transfer/i.test(String(method ?? "")) ? "transfer" : "card"
}

/**
 * Pura — arma la fila a insertar. null si no hay pedido identificable o el
 * monto no es un número > 0 (nada que atribuir).
 */
export function buildWebSaleAttributionRow(
  order: WebSaleOrder,
  confirmation: WebSaleConfirmation = {},
  opts: { tenantSlug?: string | null; internalPhonesEnv?: string } = {},
): Record<string, any> | null {
  const orderRef = clean(order.order_number)
  if (!orderRef) return null
  const quoted = Number(order.total)
  const paid = Number(confirmation.confirmedTotalArs)
  const confirmed = Number.isFinite(paid) && paid > 0 ? paid : quoted
  if (!Number.isFinite(confirmed) || confirmed <= 0) return null
  const phone = canonicalPhone(order.customer_phone) || `web:${orderRef}`
  return {
    phone,
    conversation_id: null,
    ctwa_clid: null,
    ad_campaign: clean(order.utm_campaign) || null,
    ad_creative: clean(order.utm_content) || null,
    // utm_id (id numérico del anuncio) no se guarda en `orders` (ver lib/attribution.ts).
    ad_source_id: null,
    origin: deriveWebSaleOrigin(order, opts.internalPhonesEnv),
    tenant_slug: opts.tenantSlug ?? null,
    quoted_total_ars: Number.isFinite(quoted) && quoted > 0 ? quoted : confirmed,
    confirmed_total_ars: confirmed,
    payment_method: webPaymentMethod(confirmation.paymentMethod ?? order.payment_method),
    source: "web",
    order_ref: orderRef,
  }
}

async function lookupTenantSlug(client: any, tenantId: string | null | undefined): Promise<string | null> {
  if (!clean(tenantId)) return null
  try {
    const { data } = await client.from("tenants").select("slug").eq("id", tenantId).maybeSingle()
    return (data?.slug as string) || null
  } catch {
    return null
  }
}

/**
 * Registra la venta web en `sale_attributions`. Idempotente: si ya hay una fila
 * `source='web'` con ese order_ref devuelve 'exists' (y el índice único
 * parcial de la migración cubre dos llamadas simultáneas: el 23505 también es
 * 'exists'). Nunca lanza.
 */
export async function recordWebSaleAttribution(
  order: WebSaleOrder,
  confirmation: WebSaleConfirmation = {},
  client: any = supabaseAdmin,
): Promise<WebSaleAttributionResult> {
  try {
    if (!saleAttributionEnabled()) return "disabled"
    const tenantSlug = await lookupTenantSlug(client, order.tenant_id)
    const row = buildWebSaleAttributionRow(order, confirmation, { tenantSlug })
    if (!row) {
      console.warn(`[SALE_ATTRIBUTION][web] sin fila: pedido sin número o sin monto (${order.order_number ?? order.id ?? "?"})`)
      return "skipped"
    }

    const { data: prior, error: priorErr } = await client
      .from("sale_attributions")
      .select("id")
      .eq("order_ref", row.order_ref)
      .eq("source", "web")
      .limit(1)
      .maybeSingle()
    if (priorErr) console.warn("[SALE_ATTRIBUTION][web] lookup falló:", priorErr.message || JSON.stringify(priorErr))
    if (prior?.id) return "exists"

    const { error } = await client.from("sale_attributions").insert(row)
    if (error) {
      if (String(error.code) === "23505") return "exists"
      console.error(
        `❌ [SALE_ATTRIBUTION][web] insert falló (${row.order_ref}):`,
        error.code,
        error.message,
        String(error.code) === "23514" ? "— falta aplicar migrations/20261109_sale_attributions_source_web.sql" : "",
      )
      return "error"
    }
    console.log(`[SALE_ATTRIBUTION][web] ${row.order_ref} · origin=${row.origin} · confirmado=${row.confirmed_total_ars}`)
    if (row.origin === "desconocido") {
      console.warn(`⚠️ [SALE_ATTRIBUTION][web] venta ${row.order_ref} sin rastro de origen (sin UTM/fbclid/gclid/referrer)`)
    }
    return "inserted"
  } catch (e: any) {
    console.error("❌ [SALE_ATTRIBUTION][web] excepción:", e?.message || e)
    return "error"
  }
}
