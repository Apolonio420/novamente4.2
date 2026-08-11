/**
 * Token de "compra verificada" para reseñas.
 *
 * El badge "Compra verificada" no puede resolverse mirando `orders`: los
 * compradores de las tiendas partner cierran por WhatsApp y nunca pasan por el
 * checkout web (la tabla tiene un puñado de filas y todas con tenant_id null).
 * En vez de eso firmamos un token corto que viaja en el link que le mandamos al
 * cliente después de entregarle el pedido.
 *
 * Formato: `<expDiasBase36>.<hmac12>` — ~16 caracteres, entra cómodo en un
 * mensaje de WhatsApp. Es stateless: no hay tabla de tokens que mantener.
 *
 * Sin secreto configurado la verificación SIEMPRE falla (la reseña se guarda
 * igual, solo que sin el badge). Falla cerrado, nunca abierto.
 */
import { createHmac, timingSafeEqual } from 'crypto'

const DAY_MS = 86_400_000
export const DEFAULT_TTL_DAYS = 120
const SIG_LEN = 12

function secret(): string {
  return process.env.REVIEW_TOKEN_SECRET || process.env.SUPABASE_JWT_SECRET || ''
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url').slice(0, SIG_LEN)
}

/** Días desde epoch — la unidad de expiración (no necesitamos más precisión). */
function dayStamp(atMs: number): number {
  return Math.floor(atMs / DAY_MS)
}

/**
 * Genera el token para un (tenant, producto). `productId` es el UUID de
 * partner_products — el mismo que la API recibe en el POST, así lo que se firma
 * y lo que se verifica son exactamente el mismo par.
 */
export function createReviewToken(
  tenantSlug: string,
  productId: string,
  ttlDays: number = DEFAULT_TTL_DAYS,
  nowMs: number = Date.now(),
): string {
  const key = secret()
  if (!key) throw new Error('REVIEW_TOKEN_SECRET (o SUPABASE_JWT_SECRET) no configurado')
  const exp = (dayStamp(nowMs) + Math.max(1, Math.round(ttlDays))).toString(36)
  return `${exp}.${sign(`${tenantSlug}|${productId}|${exp}`, key)}`
}

/**
 * Verifica el token contra el par (tenant, producto) que la API ya tiene en
 * mano. Un token emitido para un producto no sirve para otro ni para otra
 * tienda.
 */
export function verifyReviewToken(
  token: string | null | undefined,
  tenantSlug: string,
  productId: string,
  nowMs: number = Date.now(),
): boolean {
  const key = secret()
  if (!key || !token || typeof token !== 'string') return false

  const dot = token.indexOf('.')
  if (dot < 1) return false
  const exp = token.slice(0, dot)
  const got = token.slice(dot + 1)
  if (got.length !== SIG_LEN || !/^[0-9a-z]{1,8}$/.test(exp)) return false

  const expDay = parseInt(exp, 36)
  if (!Number.isFinite(expDay) || dayStamp(nowMs) > expDay) return false

  const want = sign(`${tenantSlug}|${productId}|${exp}`, key)
  const a = Buffer.from(want)
  const b = Buffer.from(got)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
