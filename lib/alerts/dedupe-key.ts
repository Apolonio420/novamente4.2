/**
 * Normaliza texto de alerta para derivar una clave de dedupe estable: misma
 * "forma" de mensaje (tipo de error) agrupa junto, aunque el monto/hora/id
 * varíen entre ocurrencias. Mismo criterio que `normalizeKind` en
 * chatbot-whastapp/lib/notifications.ts (patrón de referencia dado por
 * Juan), simplificado: acá la clave NO separa por cliente (a diferencia del
 * bot) — "misma clave = tipo/ruta + mensaje normalizado sin números/ids
 * variables" (auditoria-datos-2026-10/AUDITORIA-NOTIFICACIONES-2026-10.md).
 */
import { createHash } from 'crypto';

const EMOJI_RX =
  /[\u{1F1E6}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
const UUID_RX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ');
}

/** Texto sin HTML/emojis/uuids/dígitos/comillas/puntuación — solo la "forma" del mensaje. */
export function normalizeAlertText(raw: string): string {
  return stripHtml(raw)
    .replace(UUID_RX, ' ')
    .replace(EMOJI_RX, ' ')
    .replace(/["'“”«»`][^"'“”«»`]*["'“”«»`]/g, ' ') // excerpts citados
    .replace(/\d+/g, ' ') // horas, montos, cantidades, ids numéricos
    .replace(/[^\p{L}\s]/gu, ' ') // resto de puntuación/símbolos
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Hash corto y estable para usar como `key` de `checkAlertCooldown`. */
export function hashAlertKey(parts: Array<string | null | undefined>): string {
  const base = parts.filter((p): p is string => !!p && p.length > 0).join('|');
  return createHash('sha256').update(base).digest('hex').slice(0, 48);
}

/** Clave de dedupe para `notifyError`: área + endpoint (ya son discretos, no se normalizan) + mensaje normalizado. */
export function deriveErrorAlertKey(error: { endpoint: string; message: string; area?: string }): string {
  return hashAlertKey(['err', error.area, error.endpoint, normalizeAlertText(error.message)]);
}
