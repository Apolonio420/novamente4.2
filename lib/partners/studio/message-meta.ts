/**
 * Metadata de impresión de un mensaje del Studio (partner_design_messages.meta, jsonb).
 *
 * Un mockup es una foto: lo que se imprime es `designImageUrl` en esta medida/posición.
 * Esos datos antes vivían solo en memoria del browser; al recargar o reabrir una sesión
 * el mockup perdía su print spec y no se podía armar un producto doble estampa.
 *
 * Módulo puro (sin imports de browser ni de server) → lo usan el cliente
 * (session-service.ts), la API (messages/route.ts) y los tests.
 */

export interface StudioMessageMeta {
  side?: 'front' | 'back'
  garmentColor?: string
  designImageUrl?: string
  stampMode?: 'large' | 'medium' | 'chest-logo'
  placement?: string
  stampWidthCm?: number
}

const SIDES = ['front', 'back'] as const
const STAMP_MODES = ['large', 'medium', 'chest-logo'] as const
const MAX_STR = 2000

function str(v: unknown, max = MAX_STR): string | undefined {
  return typeof v === 'string' && v.length > 0 && v.length <= max ? v : undefined
}

/**
 * Normaliza un `meta` entrante o leído de la DB: descarta claves desconocidas y valores
 * de tipo inválido. Devuelve null si no queda nada útil (→ no se escribe la columna).
 */
export function sanitizeMessageMeta(raw: unknown): StudioMessageMeta | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  const out: StudioMessageMeta = {}
  if (typeof r.side === 'string' && (SIDES as readonly string[]).includes(r.side)) {
    out.side = r.side as StudioMessageMeta['side']
  }
  const color = str(r.garmentColor, 60)
  if (color) out.garmentColor = color
  const design = str(r.designImageUrl)
  if (design) out.designImageUrl = design
  if (typeof r.stampMode === 'string' && (STAMP_MODES as readonly string[]).includes(r.stampMode)) {
    out.stampMode = r.stampMode as StudioMessageMeta['stampMode']
  }
  const placement = str(r.placement, 60)
  if (placement) out.placement = placement
  if (typeof r.stampWidthCm === 'number' && Number.isFinite(r.stampWidthCm) && r.stampWidthCm > 0 && r.stampWidthCm <= 200) {
    out.stampWidthCm = r.stampWidthCm
  }
  return Object.keys(out).length > 0 ? out : null
}

/** Del mensaje del cliente al `meta` a persistir (solo mockup/design; null si no hay nada). */
export function buildMessageMeta(msg: {
  type?: string
  side?: unknown
  garmentColor?: unknown
  designImageUrl?: unknown
  stampMode?: unknown
  placement?: unknown
  stampWidthCm?: unknown
}): StudioMessageMeta | null {
  if (msg.type !== 'mockup' && msg.type !== 'design') return null
  return sanitizeMessageMeta({
    side: msg.side,
    garmentColor: msg.garmentColor,
    designImageUrl: msg.designImageUrl,
    stampMode: msg.stampMode,
    placement: msg.placement,
    stampWidthCm: msg.stampWidthCm,
  })
}

/** De la fila de la DB (campo `meta`) a los campos planos de StudioMessage. {} si meta es null/inválido. */
export function messageFieldsFromMeta(meta: unknown): StudioMessageMeta {
  return sanitizeMessageMeta(meta) ?? {}
}

/** ¿El error de PostgREST/Postgres indica que la columna `meta` no existe en este entorno? */
export function isMissingMetaColumnError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; message?: string }
  if (e.code === 'PGRST204' || e.code === '42703') return true
  return /\bmeta\b/i.test(e.message || '') && /column|schema cache/i.test(e.message || '')
}

/**
 * Inserta la fila del mensaje con `meta`; si la columna no existe en el entorno
 * (PGRST204 / 42703), reintenta sin `meta` para no perder el mensaje.
 */
export async function insertMessageWithMeta(
  insert: (row: Record<string, unknown>) => PromiseLike<{ error: any }>,
  row: Record<string, unknown>,
  meta: StudioMessageMeta | null,
): Promise<{ error: any; metaDropped: boolean }> {
  if (!meta) {
    const { error } = await insert(row)
    return { error, metaDropped: false }
  }
  const first = await insert({ ...row, meta })
  if (!first.error) return { error: null, metaDropped: false }
  if (!isMissingMetaColumnError(first.error)) return { error: first.error, metaDropped: false }
  const retry = await insert(row)
  return { error: retry.error, metaDropped: true }
}
