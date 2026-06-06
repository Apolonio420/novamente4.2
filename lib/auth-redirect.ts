/**
 * Origin canónico para los redirects de Supabase Auth (OAuth + recovery de contraseña).
 *
 * Supabase descarta cualquier `redirectTo` cuyo host no esté en la allowlist de
 * Auth → URL Configuration → Redirect URLs. Hoy el Site URL y la allowlist
 * cubren SOLO el host con www (https://www.novamente.ar). El host sin www no
 * está whitelisteado.
 *
 * Problema: si el partner entra por https://novamente.ar (sin www),
 * `window.location.origin` sería ese host, Supabase lo rechaza y reemplaza el
 * redirect por el Site URL (el home), dejándolo trabado — el mismo síntoma que
 * cuando no existía la página de reset, pero ahora en el paso del email.
 *
 * Solución: en producción forzamos el host canónico whitelisteado; en desarrollo
 * (localhost / IP de red local) respetamos el origin real para poder testear.
 *
 * Se puede overridear con NEXT_PUBLIC_AUTH_ORIGIN si en el futuro cambia el host
 * canónico (o si se whitelistea el dominio sin www y se quiere usar ese).
 */
const CANONICAL_AUTH_ORIGIN =
  process.env.NEXT_PUBLIC_AUTH_ORIGIN || 'https://www.novamente.ar'

function isLocalHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.local') ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  )
}

/**
 * Devuelve el origin a usar como base de un `redirectTo` de Supabase Auth.
 * - SSR: el host canónico.
 * - Localhost / dev: el origin real (para testear el flujo end-to-end).
 * - Producción con dominio propio: siempre el host canónico whitelisteado.
 */
export function getAuthRedirectBase(): string {
  if (typeof window === 'undefined') return CANONICAL_AUTH_ORIGIN
  const { hostname, origin } = window.location
  if (isLocalHost(hostname)) return origin
  return CANONICAL_AUTH_ORIGIN
}

/**
 * Helper de conveniencia: arma una URL absoluta y whitelisteada para `redirectTo`.
 * @param path ruta absoluta que empieza con "/" (ej: "/partners/reset-password")
 */
export function buildAuthRedirect(path: string): string {
  const base = getAuthRedirectBase()
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
