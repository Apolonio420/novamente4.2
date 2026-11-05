/**
 * Feedback con caritas del Studio /crear (😞 😐 😊). Tipos y validación
 * compartidos entre el componente, el endpoint público y el admin.
 */
export const FEEDBACK_OPERATIONS = [
  "generate",
  "edit",
  "edit-photo",
  "variant",
  "remove-bg",
  "mockup-lifestyle",
  "mockup-prenda",
] as const
export type FeedbackOperation = (typeof FEEDBACK_OPERATIONS)[number]

export const FEEDBACK_RATINGS = [
  { value: 1, emoji: "😞", label: "No me gustó" },
  { value: 2, emoji: "😐", label: "Más o menos" },
  { value: 3, emoji: "😊", label: "Me gustó" },
] as const
export type FeedbackRating = 1 | 2 | 3

export type ImageFeedbackInput = {
  id: string
  rating: FeedbackRating
  operation: FeedbackOperation
  prompt: string | null
  imageUrl: string
  garmentType: string | null
  garmentColor: string | null
}

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PROMPT_MAX = 1000
const URL_MAX = 1000

// Solo imágenes nuestras: R2 (dominio público o r2.dev), el proxy propio o el
// fallback de Supabase Storage. Evita que el endpoint público sirva para meter
// URLs arbitrarias que después se renderizan en el admin.
function isOwnImageUrl(url: string): boolean {
  if (url.startsWith("/api/proxy-image") || url.startsWith("/api/r2-public")) return true
  try {
    const u = new URL(url)
    if (u.protocol !== "https:") return false
    const host = u.hostname
    return (
      host.endsWith(".r2.dev") ||
      host.endsWith(".r2.cloudflarestorage.com") ||
      host.endsWith(".supabase.co") ||
      host === "novamente.ar" ||
      host.endsWith(".novamente.ar")
    )
  } catch {
    return false
  }
}

function shortText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

/** Valida el body del POST. Devuelve el input limpio o el motivo del rechazo. */
export function parseImageFeedback(body: unknown): { ok: true; value: ImageFeedbackInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>
  if (typeof b.id !== "string" || !UUID_RX.test(b.id)) return { ok: false, error: "id inválido" }
  if (b.rating !== 1 && b.rating !== 2 && b.rating !== 3) return { ok: false, error: "rating inválido" }
  if (typeof b.operation !== "string" || !(FEEDBACK_OPERATIONS as readonly string[]).includes(b.operation)) {
    return { ok: false, error: "operation inválida" }
  }
  const imageUrl = shortText(b.imageUrl, URL_MAX + 1)
  if (!imageUrl || imageUrl.length > URL_MAX || !isOwnImageUrl(imageUrl)) return { ok: false, error: "imageUrl inválida" }
  return {
    ok: true,
    value: {
      id: b.id.toLowerCase(),
      rating: b.rating,
      operation: b.operation as FeedbackOperation,
      prompt: shortText(b.prompt, PROMPT_MAX),
      imageUrl,
      garmentType: shortText(b.garmentType, 40),
      garmentColor: shortText(b.garmentColor, 40),
    },
  }
}
