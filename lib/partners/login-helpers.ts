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
  if (raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  return raw
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
