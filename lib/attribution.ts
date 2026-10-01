/**
 * Atribución de marketing — modelo LAST-TOUCH con TTL de 30 días.
 *
 * Problema que resuelve: la tabla `orders` no guardaba de dónde venía la venta,
 * así que la plata gastada en ads a la web era inmedible. Esto captura los UTMs
 * (+ fbclid/gclid/referrer/landing page) en el navegador y los manda con el
 * pedido para que cada orden diga sola de qué campaña salió.
 *
 * Reglas del modelo:
 *  - Si la URL trae AL MENOS UN parámetro de campaña → pisa lo guardado (last-touch).
 *  - Si la URL NO trae ninguno (navegación directa o interna) → NO pisa nada.
 *    Así el usuario que entra por un ad y después navega 5 páginas sigue
 *    atribuido a ese ad al llegar al checkout.
 *  - Pasados 30 días desde el último touch, el registro se descarta.
 *
 * Este módulo es isomórfico: las funciones de storage se auto-anulan en el
 * server. `sanitizeAttribution` corre server-side sobre el payload del cliente.
 */

export const ATTRIBUTION_STORAGE_KEY = "nm_attribution"
export const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 días

/** Máximo por campo. Evita que un referrer/landing gigante infle el payload. */
const MAX_FIELD_LENGTH = 500

/** Parámetros de campaña que vienen en la URL. */
export const ATTRIBUTION_URL_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
] as const

/**
 * `utm_id` — Meta lo manda como `{{ad.id}}` (el id numérico del ad, ~18
 * dígitos). Se captura con las mismas reglas que los demás params de URL
 * (last-touch, TTL 30 días) pero vive DELIBERADAMENTE fuera de
 * ATTRIBUTION_URL_PARAMS/ATTRIBUTION_FIELDS: esa lista whitelistea las 9
 * columnas de migrations/20260806_orders_attribution.sql y alimenta el
 * insert a `orders` (ver lib/db.ts). La tabla NO tiene columna utm_id —
 * mezclarlo ahí dispararía un 42703 en el insert y el fallback de lib/db.ts
 * pisaría TODA la atribución (no solo utm_id). Por eso utm_id solo se usa
 * para taggear el link de WhatsApp (ver lib/wa-ref.ts), nunca se persiste
 * en `orders`.
 */
export const ATTRIBUTION_AD_ID_PARAM = "utm_id"

/** Campos contextuales que derivamos del navegador, no de la query string. */
export const ATTRIBUTION_CONTEXT_FIELDS = ["landing_page", "referrer"] as const

/** Todas las columnas de atribución que persistimos en `orders`. */
export const ATTRIBUTION_FIELDS = [
  ...ATTRIBUTION_URL_PARAMS,
  ...ATTRIBUTION_CONTEXT_FIELDS,
] as const

export type AttributionUrlParam = (typeof ATTRIBUTION_URL_PARAMS)[number]
export type AttributionField = (typeof ATTRIBUTION_FIELDS)[number]

export type Attribution = Record<AttributionField, string | null>

/** Lo que efectivamente vive en localStorage: la atribución + cuándo se capturó. */
export type StoredAttribution = Attribution & { ts: number }

/**
 * Lo mínimo que necesita el tagger de links de WhatsApp (lib/wa-ref.ts):
 * el utm_id crudo (sin validar formato) y el timestamp para chequear TTL.
 * No es `Attribution` — ver comentario de ATTRIBUTION_AD_ID_PARAM arriba.
 */
export type StoredAdAttribution = { utm_id: string | null; ts: number }

/** Recorta y normaliza un valor suelto. Vacío/no-string → null. */
function normalizeValue(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, MAX_FIELD_LENGTH)
}

/**
 * Extrae los parámetros de campaña de una query string.
 * Devuelve solo los 7 campos de URL (sin landing_page/referrer).
 */
export function parseAttributionParams(
  params: URLSearchParams,
): Record<AttributionUrlParam, string | null> {
  const out = {} as Record<AttributionUrlParam, string | null>
  for (const key of ATTRIBUTION_URL_PARAMS) {
    out[key] = normalizeValue(params.get(key))
  }
  return out
}

/** ¿La URL trae algún dato de campaña? Si no, no pisamos lo guardado. */
export function hasCampaignTouch(
  params: Partial<Record<AttributionUrlParam, string | null>>,
): boolean {
  return ATTRIBUTION_URL_PARAMS.some((key) => !!params[key])
}

/**
 * Normaliza un payload arbitrario (viene del cliente, es untrusted) a las
 * 9 columnas que persistimos. Devuelve null si no hay ni un dato útil, para
 * que la orden se cree con nulls sin escribir basura.
 */
export function sanitizeAttribution(raw: unknown): Attribution | null {
  if (!raw || typeof raw !== "object") return null
  const input = raw as Record<string, unknown>
  const out = {} as Attribution
  let hasAny = false
  for (const key of ATTRIBUTION_FIELDS) {
    const value = normalizeValue(input[key])
    out[key] = value
    if (value) hasAny = true
  }
  return hasAny ? out : null
}

/** Lo que vive en localStorage en runtime: Attribution + ts + utm_id crudo. */
type PersistedAttribution = StoredAttribution & { utm_id: string | null }

/** Lee el registro crudo de localStorage, ya validado y sin vencer. */
function readStored(): PersistedAttribution | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedAttribution>
    const ts = typeof parsed?.ts === "number" ? parsed.ts : 0
    if (!ts || Date.now() - ts > ATTRIBUTION_TTL_MS) {
      window.localStorage.removeItem(ATTRIBUTION_STORAGE_KEY)
      return null
    }
    // sanitizeAttribution solo whitelistea las 9 columnas de ATTRIBUTION_FIELDS
    // (lo que va a `orders`); utm_id se lee aparte porque NO es una de ellas.
    const attribution = sanitizeAttribution(parsed)
    const utmId = normalizeValue((parsed as Record<string, unknown>)[ATTRIBUTION_AD_ID_PARAM])
    if (!attribution && !utmId) return null
    return { ...(attribution ?? ({} as Attribution)), utm_id: utmId, ts }
  } catch {
    // JSON corrupto, storage bloqueado (modo privado), cuota llena — nunca
    // rompemos la navegación por un dato de analytics.
    return null
  }
}

/**
 * Atribución guardada lista para mandar al backend (sin `ts` ni `utm_id`
 * internos — utm_id no es una columna de `orders`, ver ATTRIBUTION_AD_ID_PARAM).
 * null si no hay nada capturado o si venció.
 */
export function getStoredAttribution(): Attribution | null {
  const stored = readStored()
  if (!stored) return null
  const { ts: _ts, utm_id: _utmId, ...attribution } = stored
  return attribution as Attribution
}

/**
 * Lo mínimo para taggear el link de WhatsApp con el ad id de Meta
 * (ver lib/wa-ref.ts). Separado de getStoredAttribution a propósito: ese
 * sigue siendo el contrato que consume el backend (checkout, capi.ts).
 */
export function getStoredAdAttribution(): StoredAdAttribution | null {
  const stored = readStored()
  if (!stored) return null
  return { utm_id: stored.utm_id, ts: stored.ts }
}

/**
 * Captura last-touch. Se llama en cada navegación desde AttributionTracker.
 *
 * @param search  query string de la URL actual (con o sin '?')
 * @param landingPage  path+query donde aterrizó (default: location actual)
 * @param referrer  document.referrer (default: el del documento)
 * @returns lo que quedó guardado, o null si no había campaña y no se tocó nada.
 */
export function captureAttribution(
  search?: string,
  landingPage?: string,
  referrer?: string,
): PersistedAttribution | null {
  if (typeof window === "undefined") return null
  try {
    const params = new URLSearchParams(search ?? window.location.search)
    const campaign = parseAttributionParams(params)
    const utmId = normalizeValue(params.get(ATTRIBUTION_AD_ID_PARAM))

    // Sin parámetros de campaña (ni utm_id) => navegación directa/interna => NO pisar.
    if (!hasCampaignTouch(campaign) && !utmId) return null

    const resolvedLanding =
      normalizeValue(landingPage) ??
      normalizeValue(`${window.location.pathname}${window.location.search}`)

    // Un referrer del mismo host es navegación interna, no una fuente externa.
    const rawReferrer = referrer ?? (typeof document !== "undefined" ? document.referrer : "")
    let resolvedReferrer = normalizeValue(rawReferrer)
    if (resolvedReferrer) {
      try {
        if (new URL(resolvedReferrer).host === window.location.host) resolvedReferrer = null
      } catch {
        // Referrer no parseable — lo dejamos tal cual, es informativo.
      }
    }

    const record: PersistedAttribution = {
      ...campaign,
      landing_page: resolvedLanding,
      referrer: resolvedReferrer,
      utm_id: utmId,
      ts: Date.now(),
    }

    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(record))
    return record
  } catch {
    return null
  }
}
