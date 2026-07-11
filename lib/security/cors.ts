import { NextResponse, type NextRequest } from "next/server"

/**
 * Allowlist de CORS para endpoints publicos de generacion de imagen.
 *
 * Reemplaza el patron viejo `"Access-Control-Allow-Origin": "*"` que dejaba
 * estos endpoints (Gemini image gen, costo real) abiertos a cualquier
 * origen. Ver auditoria 2026-07-11: exposicion = generacion ilimitada a
 * nuestro costo desde cualquier sitio de terceros via fetch() en el browser.
 *
 * OJO: CORS es una politica que enforcea el BROWSER, no el servidor. Un
 * curl/script directo (sin header Origin, o con uno forjado) no lo respeta.
 * Esta allowlist bloquea el vector "otro sitio embebe JS que llama a
 * nuestros endpoints con las credenciales/contexto del visitante" via el
 * preflight (ver preflightResponse). La proteccion real contra scripts
 * directos es el rate-limit + tope diario en lib/security/public-image-guard.ts.
 */

const STATIC_ALLOWED_ORIGINS = new Set<string>([
  "https://www.novamente.ar",
  "https://novamente.ar",
])

// Deploys del storefront en Vercel: produccion + previews de PR.
// ej: https://v0-nova-mente-storefront.vercel.app
//     https://v0-nova-mente-storefront-git-fix-foo-novamente.vercel.app
//     https://v0-nova-mente-storefront-<hash>.vercel.app
const VERCEL_PROJECT_ORIGIN_RE = /^https:\/\/v0-nova-mente-storefront(-[a-z0-9-]+)?\.vercel\.app$/i

function isDevOrigin(origin: string): boolean {
  if (process.env.NODE_ENV !== "development") return false
  return /^https?:\/\/localhost(:\d+)?$/.test(origin)
}

export function isAllowedOrigin(origin: string | null): boolean {
  // Sin header Origin = request server-to-server o same-origin no-CORS
  // (curl, fetch desde otro backend, navegacion normal). No lo bloqueamos
  // aca — no es lo que CORS protege. Lo cubre el rate-limit/cap.
  if (!origin) return true
  if (STATIC_ALLOWED_ORIGINS.has(origin)) return true
  if (VERCEL_PROJECT_ORIGIN_RE.test(origin)) return true
  if (isDevOrigin(origin)) return true
  return false
}

/**
 * Headers CORS para adjuntar a una respuesta real (POST/GET). Solo incluye
 * Access-Control-Allow-Origin si el origen esta en la allowlist — si no,
 * el browser del origen no-permitido va a poder ver el request igual (no
 * podemos evitar que se dispare sin preflight bloqueado) pero no va a poder
 * LEER la respuesta por JS, que es la superficie de abuso real.
 */
export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin")
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Internal-Secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  }
  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin
  }
  return headers
}

/** Maneja el preflight OPTIONS: 403 duro si el Origin esta presente y NO permitido. */
export function preflightResponse(req: NextRequest): NextResponse {
  const origin = req.headers.get("origin")
  if (origin && !isAllowedOrigin(origin)) {
    return new NextResponse(null, { status: 403 })
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}
