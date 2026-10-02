/**
 * Embudo de checkout (ver migrations/20261001_checkout_events.sql): hoy no
 * hay forma de medir cuánta gente entra a /checkout, toca "Confirmar" y no
 * llega a pagar. `registrarEventoCheckout` inserta un evento fail-soft; nunca
 * debe afectar al checkout/pago real (es un camino de plata).
 *
 * `sanitizarEvento` es la parte pura: valida/normaliza lo que llega del
 * cliente (POST /api/checkout/events) antes de insertarlo. El cliente SOLO
 * puede mandar 'checkout_view' y 'confirm_click' — 'order_created' y
 * 'payment_approved' los registra el servidor directamente con
 * `registrarEventoCheckout` (nunca pasan por este sanitizador).
 */
import { supabaseAdmin } from "@/lib/supabase-admin"

export const CHECKOUT_EVENTS = ["checkout_view", "confirm_click", "order_created", "payment_approved"] as const
export type CheckoutEvent = (typeof CHECKOUT_EVENTS)[number]

/** Eventos que el ENDPOINT PÚBLICO (cliente) puede registrar. Los otros dos son server-only. */
const CLIENT_ALLOWED_EVENTS = new Set<CheckoutEvent>(["checkout_view", "confirm_click"])

export const MISSING_FIELD_IDS = [
  "email",
  "firstName",
  "lastName",
  "phone",
  "address",
  "city",
  "postalCode",
] as const
export type MissingFieldId = (typeof MISSING_FIELD_IDS)[number]

const PAYMENT_METHODS = new Set(["mercadopago", "transferencia"])

/** Mismo id que genera el cliente en sessionStorage (nm_checkout_sid). */
const SESSION_ID_RE = /^[A-Za-z0-9_-]{8,64}$/

/** Mismo patrón que la validación de tenantId en app/api/checkout/route.ts. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Tope de sanidad para cart_value (ARS) — un carrito no tiene por qué superar esto. */
const CART_VALUE_MAX = 100_000_000

export interface CheckoutEventInput {
  event: string
  session_id?: unknown
  valid?: unknown
  missing_fields?: unknown
  payment_method?: unknown
  order_id?: unknown
  tenant_id?: unknown
  cart_value?: unknown
  items?: unknown
  metadata?: unknown
}

export interface SanitizedCheckoutEvent {
  event: CheckoutEvent
  session_id: string
  valid: boolean | null
  missing_fields: MissingFieldId[] | null
  payment_method: "mercadopago" | "transferencia" | null
  tenant_id: string | null
  cart_value: number | null
  items: number | null
}

/**
 * Valida y normaliza el body de POST /api/checkout/events. Devuelve null si
 * el evento no es válido o no viene permitido desde el cliente — el caller
 * (la ruta) responde 204 igual, sin loguear nada (evitar ruido por basura/bots).
 */
export function sanitizarEvento(body: unknown): SanitizedCheckoutEvent | null {
  if (!body || typeof body !== "object") return null
  const input = body as CheckoutEventInput

  const event = typeof input.event === "string" ? input.event : ""
  if (!CLIENT_ALLOWED_EVENTS.has(event as CheckoutEvent)) return null

  const sessionId = typeof input.session_id === "string" ? input.session_id.trim() : ""
  if (!SESSION_ID_RE.test(sessionId)) return null

  let valid: boolean | null = null
  if (typeof input.valid === "boolean") valid = input.valid

  let missing_fields: MissingFieldId[] | null = null
  if (Array.isArray(input.missing_fields)) {
    const filtrados = input.missing_fields
      .filter((f): f is string => typeof f === "string")
      .filter((f): f is MissingFieldId => (MISSING_FIELD_IDS as readonly string[]).includes(f))
    // dedupe, clamp a los 7 campos conocidos (nunca puede haber más)
    missing_fields = [...new Set(filtrados)].slice(0, MISSING_FIELD_IDS.length)
    if (missing_fields.length === 0) missing_fields = null
  }

  let payment_method: "mercadopago" | "transferencia" | null = null
  if (typeof input.payment_method === "string" && PAYMENT_METHODS.has(input.payment_method)) {
    payment_method = input.payment_method as "mercadopago" | "transferencia"
  }

  let tenant_id: string | null = null
  if (typeof input.tenant_id === "string" && UUID_RE.test(input.tenant_id)) {
    tenant_id = input.tenant_id
  }

  let cart_value: number | null = null
  if (typeof input.cart_value === "number" && Number.isFinite(input.cart_value)) {
    const n = Math.round(input.cart_value)
    if (n >= 0 && n <= CART_VALUE_MAX) cart_value = n
  }

  let items: number | null = null
  if (typeof input.items === "number" && Number.isFinite(input.items)) {
    const n = Math.round(input.items)
    if (n >= 0 && n <= 10_000) items = n
  }

  return {
    event: event as CheckoutEvent,
    session_id: sessionId,
    valid,
    missing_fields,
    payment_method,
    tenant_id,
    cart_value,
    items,
  }
}

export interface RegistrarEventoOpts {
  event: CheckoutEvent
  session_id: string
  valid?: boolean | null
  missing_fields?: string[] | null
  payment_method?: "mercadopago" | "transferencia" | null
  order_id?: string | null
  tenant_id?: string | null
  cart_value?: number | null
  items?: number | null
  metadata?: Record<string, unknown>
}

/**
 * Inserta un evento del embudo de checkout. Fail-soft a propósito (igual
 * patrón que app/api/checkout/transfer/viewed/route.ts): si la tabla todavía
 * no existe (migración sin aplicar) o cualquier otra cosa falla, se loguea
 * con console.warn y se sigue — ESTO NUNCA DEBE ROMPER NI FRENAR EL CHECKOUT.
 * Siempre se await-ea (nunca una promesa suelta): Vercel congela la lambda
 * apenas termina de responder, así que un insert disparado y no esperado
 * puede no llegar a correr nunca.
 */
export async function registrarEventoCheckout(opts: RegistrarEventoOpts): Promise<void> {
  try {
    const sessionId = String(opts.session_id || "server").slice(0, 64) || "server"
    // `as any`: checkout_events es una tabla nueva (ver migración 20261001) que
    // todavía no está en los tipos generados de Supabase — mismo patrón que
    // updateData en lib/db.ts#updateOrder y en viewed/route.ts.
    const row: any = {
      event: opts.event,
      session_id: sessionId,
      valid: opts.valid ?? null,
      missing_fields: opts.missing_fields && opts.missing_fields.length ? opts.missing_fields : null,
      payment_method: opts.payment_method ?? null,
      order_id: opts.order_id ?? null,
      tenant_id: opts.tenant_id ?? null,
      cart_value: opts.cart_value ?? null,
      items: opts.items ?? null,
      metadata: opts.metadata ?? {},
    }
    const { error } = await (supabaseAdmin.from("checkout_events") as any).insert(row)
    if (error) {
      // Esperado si la migración todavía no corrió (tabla inexistente) — no
      // es un error que deba afectar al cliente ni al pago.
      console.warn("[checkout-funnel] no se pudo registrar evento (fail-soft):", opts.event, error.message)
    }
  } catch (error: any) {
    console.warn("[checkout-funnel] excepción registrando evento (fail-soft):", opts?.event, error?.message)
  }
}
