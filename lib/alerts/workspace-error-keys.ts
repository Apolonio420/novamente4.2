/**
 * Claves de dedupe compartidas entre los dos avisos que dispara UN crash del
 * workspace del partner:
 *  - /api/partners/assistant/bug-report (auto-reporte de app/workspace/error.tsx)
 *  - /api/partners/support (ticket "Avisar a Novamente" de esa misma pantalla)
 * El ticket consulta estas claves para no mandar un segundo "🚨 Urgente" por el
 * mismo error. Solo lógica pura: el estado vive en alert-cooldown (app_settings).
 */
import { hashAlertKey, normalizeAlertText } from './dedupe-key';

/** Ventana en la que un segundo aviso del mismo error se considera duplicado (= cooldown de alertas). */
export const WORKSPACE_ERROR_DEDUPE_WINDOW_MS = 30 * 60 * 1000;

/** Clave tenant+path+mensaje: es EXACTAMENTE la que usa el cooldown del bug-report. */
export function bugPathMessageKey(tenantId: string, path: string, message: string): string {
  return hashAlertKey(['bug', tenantId, path, normalizeAlertText(message)]);
}

/** Clave tenant+digest: marca que el error con ese digest ya se avisó. */
export function bugDigestKey(tenantId: string, digest: string): string {
  return `bug-digest:${tenantId}:${digest}`;
}

export interface ErrorTicketContext {
  digest?: string;
  path?: string;
  message?: string;
}

/** Valida/recorta el contexto de error que manda el cliente. null si no sirve para deduplicar. */
export function parseErrorTicketContext(raw: unknown): ErrorTicketContext | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const clip = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
  const ctx: ErrorTicketContext = {
    digest: clip(r.digest, 200),
    path: clip(r.path, 200),
    message: clip(r.message, 2000),
  };
  return ctx.digest || (ctx.path && ctx.message) ? ctx : null;
}
