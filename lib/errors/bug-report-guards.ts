/**
 * Constantes y helpers del endpoint de bug-report. Viven acá (no en route.ts)
 * porque Next 15 solo admite exports de handlers/config en un route.ts: cualquier
 * otro export rompe la validación de tipos de .next/types (TS2344).
 */

/** Tope por tenant: un loop de errores en el navegador no puede llenar la tabla ni el bot. */
export const BUG_REPORT_LIMIT = 5
export const BUG_REPORT_WINDOW_MS = 10 * 60 * 1000

/**
 * Errores pasajeros del navegador (deploy nuevo con chunks viejos, red caída):
 * no son accionables para el equipo y después de cada deploy le saltarían a
 * varios partners a la vez. Se guardan igual en bug_reports, pero van al
 * resumen diario en vez de "🚨 Urgente" (política: alertas pocas y accionables).
 */
const TRANSIENT_ERROR_RE = /ChunkLoadError|Loading (CSS )?chunk|dynamically imported module|Failed to fetch|NetworkError|Load failed|network error/i

export function isTransientClientError(message?: string): boolean {
    return !!message && TRANSIENT_ERROR_RE.test(message)
}

