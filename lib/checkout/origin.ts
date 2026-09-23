/**
 * `/api/checkout` armaba los `back_urls` de MercadoPago con
 * `NEXT_PUBLIC_BASE_URL` fijo (el apex `www.novamente.ar`) — una compra que
 * arrancó en `<slug>.novamente.ar` volvía al apex al terminar de pagar y
 * perdía el carrito/contexto de la tienda.
 *
 * Esta función resuelve el origen a usar en los `back_urls`: el que mandó el
 * navegador (header `Origin`, o `Host` como respaldo), SOLO si matchea la
 * allowlist de dominios propios — nunca un origen arbitrario que alguien
 * pueda falsear en el header. Si no matchea, cae al fallback de siempre
 * (`NEXT_PUBLIC_BASE_URL`).
 */

const NOVAMENTE_APEX = 'novamente.ar'

function hostnameIsAllowed(hostname: string, allowLocalhost: boolean): boolean {
  const h = hostname.toLowerCase()
  if (h === NOVAMENTE_APEX || h.endsWith(`.${NOVAMENTE_APEX}`)) return true
  if (allowLocalhost && (h === 'localhost' || h === '127.0.0.1')) return true
  return false
}

export interface ResolveCheckoutOriginInput {
  /** Header `Origin` del request (lo manda el navegador en un POST fetch). */
  originHeader?: string | null
  /** Header `Host`, usado como respaldo si no vino `Origin`. */
  hostHeader?: string | null
  /** A qué volver si no hay origen o no matchea la allowlist. */
  fallback: string
  /** true solo en dev — permite localhost/127.0.0.1 como origen válido. */
  allowLocalhost?: boolean
}

export function resolveCheckoutOrigin(input: ResolveCheckoutOriginInput): string {
  const raw = input.originHeader || (input.hostHeader ? `https://${input.hostHeader}` : null)
  if (!raw) return input.fallback

  try {
    const url = new URL(raw)
    if (hostnameIsAllowed(url.hostname, !!input.allowLocalhost)) {
      return `${url.protocol}//${url.host}`
    }
  } catch {
    // Origin/Host mal formado: cae al fallback, no rompe el checkout.
  }
  return input.fallback
}
