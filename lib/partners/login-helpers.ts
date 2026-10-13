/**
 * Helpers puros de /partners/login — separados del componente para poder
 * testearlos sin montar React ni mockear supabase-js.
 */

/**
 * Sanitiza el parámetro `?redirect=` del login.
 *
 * El rescate de sesión (ver page.tsx) redirige SOLO, sin que el usuario
 * toque nada — eso convierte un `redirect` sin validar en un open-redirect de
 * CERO clicks (peor que uno de un clic: no hace falta ni que el usuario
 * confirme). Sólo se acepta una ruta interna que empiece con "/" y no sea
 * "//host..." (protocol-relative) ni "/\host..." (algunos navegadores lo
 * tratan como "//").
 */
export function safeRedirect(raw: string | null | undefined, fallback = '/workspace'): string {
  if (!raw) return fallback
  if (!raw.startsWith('/')) return fallback
  // Tab/CR/LF/NUL y otros control chars: la spec de URL los ELIMINA al parsear,
  // así que "/<TAB>/evil.com" termina siendo "//evil.com" (host externo).
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(raw)) return fallback
  const ORIGIN = 'http://redirect-check.invalid'
  try {
    const u = new URL(raw, ORIGIN)
    // Mismo origin que la base ficticia = fue una ruta relativa interna de verdad
    // ("//host" y "/\\host" resuelven a otro host y quedan afuera).
    if (u.origin !== ORIGIN) return fallback
    return u.pathname + u.search + u.hash
  } catch {
    return fallback
  }
}

const KNOWN_AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos',
  'Email not confirmed': 'Confirmá tu email antes de ingresar. Revisá tu bandeja de entrada.',
  'Email logins are disabled': 'El login por email está deshabilitado temporalmente. Probá con Google.',
}

/**
 * Traduce errores conocidos de Supabase Auth a español; para cualquier otro
 * caso (mensaje desconocido, vacío o undefined) devuelve `fallback` — nunca
 * el texto crudo en inglés, nunca "nada" en pantalla.
 */
export function mapAuthError(message: string | null | undefined, fallback: string): string {
  if (!message) return fallback
  return KNOWN_AUTH_ERRORS[message] || fallback
}
