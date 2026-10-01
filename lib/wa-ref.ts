/**
 * Taggea los links de WhatsApp de la web con el ad id de Meta, para que el
 * bot pueda leer de qué ad vino el lead sin tocar la base de datos.
 *
 * Contrato (el bot parsea exactamente esto — no desviar):
 *  - Si hay atribución en localStorage (nm_attribution), está dentro del TTL
 *    de 30 días, y trae un `utm_id` que matchea /^\d{6,20}$/ → se agrega al
 *    ref tag el token ` · a:<b36>` (b36 = BigInt(utm_id).toString(36)).
 *    Ej: "(ref · NV-WEB)" → "(ref · NV-WEB · a:x8k2...)".
 *  - Los 2 prefills sin ref tag (remeras-por-mayor, indumentaria-deportiva)
 *    reciben " (ref · NV-MAYOR · a:<b36>)" / " (ref · NV-DEPORTE · a:<b36>)"
 *    SOLO cuando el token aplica.
 *  - Sin atribución / sin utm_id válido → el link queda EXACTAMENTE igual
 *    (byte-identical) al original.
 *
 * BigInt es obligatorio: los ad id de Meta (~18 dígitos) superan 2^53 y
 * pierden precisión como Number.
 */
import { ATTRIBUTION_TTL_MS, type StoredAdAttribution } from "./attribution"
import { WHATSAPP_BOT_NUMBER } from "./config/links"

/** Meta manda utm_id como el id numérico del ad (hoy ronda los 18 dígitos). */
const UTM_ID_PATTERN = /^\d{6,20}$/

/** Links que taggeamos: wa.me y api.whatsapp.com/send, siempre del número comercial. */
const WA_LINK_PATTERN = new RegExp(
  `^https://(?:wa\\.me/${WHATSAPP_BOT_NUMBER}\\b|api\\.whatsapp\\.com/send\\?[^#]*\\bphone=${WHATSAPP_BOT_NUMBER}\\b)`,
  "i",
)

/** "(ref · NV-WEB)" — un ref tag sin taggear todavía. */
const REF_ONLY_PATTERN = /\(ref\s*·\s*[A-Za-z0-9_-]+\)/

/** "(ref · NV-WEB · a:x8k2)" — ya taggeado, no hay que duplicar. */
const REF_TAGGED_PATTERN = /\(ref\s*·\s*[A-Za-z0-9_-]+\s*·\s*a:[0-9a-z]+\)/

/**
 * Los 2 prefills fijos de la web que hoy NO llevan ref tag. Se matchean por
 * texto EXACTO (decodificado) para no tocar ningún otro link sin ref tag que
 * no conozcamos — si no matchea ninguno, el link se deja tal cual.
 */
export const UNTAGGED_PREFILL_REFS: ReadonlyArray<{ text: string; ref: string }> = [
  {
    // app/remeras-por-mayor/page.tsx
    text: "Hola! Quiero consultar por remeras por mayor. Necesito [cantidad] unidades de [producto]. Mi negocio es [tipo de negocio]. Necesito factura [A/B].",
    ref: "NV-MAYOR",
  },
  {
    // app/indumentaria-deportiva/page.tsx
    text: "Hola! Quiero cotizar indumentaria para mi equipo deportivo. Deporte: [futbol/hockey/paddle/running/crossfit/otro]. Somos [cantidad] personas. El nombre del equipo es [nombre]. Necesitamos [remeras/musculosas/buzos]. Queremos incluir [numeros/nombres/logo].",
    ref: "NV-DEPORTE",
  },
]

/**
 * Deriva el token `a:<b36>` a partir de la atribución guardada.
 * null si no aplica: sin atribución, vencida, o utm_id con formato inválido.
 */
export function computeAdToken(
  attribution: StoredAdAttribution | null | undefined,
  now: number = Date.now(),
): string | null {
  if (!attribution) return null
  if (typeof attribution.ts !== "number" || !Number.isFinite(attribution.ts)) return null
  if (now - attribution.ts > ATTRIBUTION_TTL_MS) return null

  const utmId = attribution.utm_id
  if (typeof utmId !== "string" || !UTM_ID_PATTERN.test(utmId)) return null

  try {
    return BigInt(utmId).toString(36)
  } catch {
    return null
  }
}

/** Captura el param `text=` crudo de la query string, con el separador que lo precede. */
const TEXT_PARAM_PATTERN = /([?&])text=([^&]*)/

/**
 * Taggea un link de WhatsApp (`?text=...`) con el ad id de Meta, si
 * corresponde. Pura: no toca window/localStorage ni hace I/O.
 *
 * Reescribe el param `text=` con un reemplazo de string quirúrgico — a
 * propósito NO pasa por `URL`/`URLSearchParams` para serializar la salida:
 * `URLSearchParams.toString()` encodea el espacio como "+" y "!" como "%21"
 * (estilo application/x-www-form-urlencoded), distinto del `encodeURIComponent`
 * que usa el resto del código (lib/config/links.ts, las 2 landings sin ref
 * tag). Wa.me espera ese mismo estilo — mandar "+" en vez de "%20" arriesga
 * que WhatsApp lo muestre literal en el mensaje prefijado. Esto también deja
 * el resto de la URL (otros query params) byte a byte intacto.
 */
export function withAdRef(
  waUrl: string,
  attribution: StoredAdAttribution | null | undefined,
): string {
  const token = computeAdToken(attribution)
  if (!token) return waUrl
  if (!WA_LINK_PATTERN.test(waUrl)) return waUrl

  const match = waUrl.match(TEXT_PARAM_PATTERN)
  if (!match || match.index === undefined) return waUrl

  const text = decodeURIComponent(match[2])

  // El rewriter puede correr más de una vez sobre el mismo <a> — no duplicar.
  if (REF_TAGGED_PATTERN.test(text)) return waUrl

  let newText: string
  const existingRefMatch = text.match(REF_ONLY_PATTERN)
  if (existingRefMatch) {
    const fullMatch = existingRefMatch[0]
    const idx = existingRefMatch.index ?? 0
    const tagged = `${fullMatch.slice(0, -1)} · a:${token})`
    newText = text.slice(0, idx) + tagged + text.slice(idx + fullMatch.length)
  } else {
    const fixed = UNTAGGED_PREFILL_REFS.find((p) => p.text === text)
    if (!fixed) return waUrl
    newText = `${text} (ref · ${fixed.ref} · a:${token})`
  }

  const replacement = `${match[1]}text=${encodeURIComponent(newText)}`
  return waUrl.slice(0, match.index) + replacement + waUrl.slice(match.index + match[0].length)
}
