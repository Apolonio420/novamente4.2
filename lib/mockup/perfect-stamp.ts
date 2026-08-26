/**
 * Motor de mockups "perfecto" (validado en PoC 2026-06-24).
 *
 * Pipeline:
 *   1. Quitar fondo del diseño PREVIO (gemini-2.5-flash-image, MASKING + magenta key).
 *      Inconsistente por prompt → se hace antes. Se saltea para arte full-bleed (removeBg=false).
 *   2. Cuadro rojo DINÁMICO: se dibuja un rect rojo sobre la prenda base en las coords
 *      del área de impresión (letterbox uniforme 400×500 → dims reales). "Infinito":
 *      anda para cualquier prenda/color/lado/tamaño sin PNGs pre-hechos.
 *   3. Estampado con el prompt BEST-OF (de-labeleado, fusión de las mejores épocas:
 *      límite rígido + DTG no-sticker + congelar prenda + lista negra + legibilidad oscuro).
 *      Modelo = STAMP_MODEL (default gemini-2.5-flash-image desde 2026-07-11, A/B ciego
 *      20 casos: flash 13 vs pro 4, 3 empates, para colocación de estampa). Rollback por
 *      env — ver docs/ROLLBACK-gemini-models.md en platform-master.
 *
 * NOTA: las imágenes (diseño + prenda base) las trae el caller (tiene el contexto de
 * request/origin). Acá sólo se procesan buffers → devuelve el PNG del mockup.
 */
import sharp from 'sharp'
import { GoogleGenAI } from '@google/genai'

export type StampSize = 'R1' | 'R2' | 'R3'

/** El área imprimible de Novamente mide 35 cm de ancho. Traduce cm ↔ píxeles. */
const AREA_IMPRIMIBLE_CM = 35
export interface ImprintBox { x: number; y: number; width: number; height: number; baseW?: number; baseH?: number }

const STAMP_MODEL = process.env.GEMINI_STAMP_MODEL ?? process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image'
const REMOVE_BG_MODEL = process.env.GEMINI_REMOVE_BG_MODEL ?? 'gemini-2.5-flash-image'

const STAMP_PROMPT = `You are a professional industrial garment printer and product retoucher creating ONE photorealistic commercial product photo.

You are given three reference pictures, in this order: first the ARTWORK to be printed; then a clean photo of the EXACT garment; then that same garment photo with a RED RECTANGLE drawn on it to show exactly where and how large the print must go.

TASK: print the artwork onto the garment, placed exactly where the red rectangle is, then make the red rectangle disappear completely.

PRINT ONLY THE SUBJECT (background removal):
- The artwork may arrive on a white or colored card/box. Print ONLY the painted subject itself — the area around the subject must be BARE GARMENT FABRIC.
- NEVER print a white/colored rectangle, card, sheet or panel behind the artwork. No visible border around the print.

PLACEMENT & SIZE (the red rectangle is a RIGID BOUNDARY):
- Put the print exactly where the red rectangle is, at that size. If the artwork is bigger, SCALE IT DOWN to fit.
- Not a single pixel of the print may fall outside the rectangle. SLEEVES, HOOD, COLLAR, NECK and hem are OFF-LIMITS.
- DTG print look: slightly absorbed into the cotton texture, NOT glossy, NOT vinyl, NOT a sticker. Follows the fabric folds, wrinkles and shadows.
- If the garment is dark, keep the artwork's light/white tones vivid so they read clearly.

KEEP STRICTLY UNCHANGED: fabric color (match EXACTLY, never recolor), garment shape, silhouette, fit, collar, sleeves, hem, hood, pocket, and the studio background + lighting. Do NOT invent or redraw a different garment, and do NOT redraw the artwork — reproduce it faithfully.

OUTPUT FORMAT — CRITICAL:
- Produce ONE single photograph of ONE garment, framed exactly like the clean garment photo.
- NEVER produce a collage, grid, side-by-side, multiple views, labeled panels, thumbnails, product chips or a brand board.
- NEVER draw ANY text, letters, labels, captions, watermarks or borders in the image.
- No trace of the red rectangle, guide lines or bounding boxes.

🚨 IF THE RED RECTANGLE, ANY GUIDE LINE, ANY TEXT/LABEL, OR MORE THAN ONE GARMENT IS VISIBLE, THE TASK IS FAILED. Output ONLY the single finished product photo.`

const BLEND_PROMPT = `You are a product retoucher. The artwork is ALREADY printed on this garment, at exactly the right size and in exactly the right place.

YOUR ONLY JOB: make that existing print look like a real DTG print on fabric.
- Slightly absorb it into the cotton texture. It must follow the fabric's folds, wrinkles and shadows.
- NOT glossy, NOT vinyl, NOT a sticker, no drop shadow, no glow, no outline.

ABSOLUTELY FORBIDDEN - these ruin the job:
- DO NOT move the print. DO NOT resize it, not even slightly. DO NOT re-center it.
- DO NOT redraw, restyle or re-letter the artwork. Every letter and shape stays exactly as it is.
- DO NOT change the garment: same color, same shape, same collar, sleeves, hem, same studio background and lighting.
- DO NOT add text, labels, watermarks, borders or a second garment.

Output ONE photograph of ONE garment, framed exactly like the input.`

const REMOVE_BG_PROMPT = `MASKING TASK: Remove the background from this image.

OUTPUT REQUIREMENT:
- Format: PNG with Alpha Channel (transparent background).
- Background: PURE TRANSPARENT (Alpha = 0).
- Subject: Keep the original pixels of the main subject exactly as they are.

ABSOLUTELY FORBIDDEN:
- DO NOT generate a checkerboard pattern.
- DO NOT draw gray and white squares.
- DO NOT alter the subject style (no filters, no vectorization, no artistic changes).
- DO NOT add any border, shadow, or glow around the subject.

If true transparency is impossible, return the subject on a SOLID MAGENTA background (RGB 255,0,255) so it can be keyed out later, BUT PREFER TRANSPARENCY.

Output ONLY the final clean image with transparent background.`

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurado')
  return new GoogleGenAI({ apiKey })
}

function extractImage(result: any): string | null {
  const parts = result?.candidates?.[0]?.content?.parts || []
  for (const p of parts) if (p?.inlineData?.data) return p.inlineData.data
  return null
}

/** Si Gemini devolvió fondo magenta en vez de alpha, lo keyeamos a transparente. */
async function magentaKey(buf: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const ch = info.channels
  let keyed = 0
  for (let i = 0; i < data.length; i += ch) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (r > 180 && b > 180 && g < 90) { data[i + 3] = 0; keyed++ }
  }
  if (!keyed) return buf
  return sharp(data, { raw: { width: info.width, height: info.height, channels: ch } }).png().toBuffer()
}

/**
 * ¿Tiene transparencia REAL? Gemini no emite alpha: cuando le pedís que quite
 * el fondo devuelve un PNG OPACO con el damero gris/blanco PINTADO como
 * píxeles. Eso se veía como un rectángulo blanco estampado sobre la prenda
 * (caso ORIGEN 26/08/2026). Medido sobre los diseños reales del partner:
 * hasAlpha=false, 0 píxeles transparentes de 1.048.576.
 */
async function hasRealAlpha(buf: Buffer): Promise<boolean> {
  try {
    const meta = await sharp(buf).metadata()
    if (!meta.hasAlpha) return false
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let transparent = 0
    for (let i = 3; i < data.length; i += info.channels) if (data[i] === 0) transparent++
    return transparent / (info.width * info.height) >= 0.02
  } catch {
    return false
  }
}

/**
 * ¿Este diseño TIENE un fondo que sacar, o es arte de borde a borde?
 *
 * Se mira sólo el borde de 1px, que es de donde siembra el flood-fill. Dos
 * formas válidas de fondo:
 *   · PLANO — casi todo el borde es el mismo color (fondo liso blanco, negro,
 *     crema...). Se mide como fracción de píxeles cerca del promedio.
 *   · DAMERO — el cuadriculado falso que pinta Gemini: alterna dos grises, así
 *     que NO es plano, pero sí es neutro (sin color) y de rango angosto.
 *
 * Cualquier otra cosa es arte que llega al borde: una foto, una placa de redes,
 * un póster full-bleed. Ahí no hay fondo que sacar y recortar lo arruina.
 *
 * Esto no es cosmético. Sin el gate, removeCheckerboardBackground degenera
 * sobre fotos: su rango sale del percentil de los grises del borde, y cuando el
 * borde no es un damero real ese rango se abre hasta significar "borrá
 * cualquier píxel casi-neutro pegado al borde". Medido sobre los 326 diseños
 * reales del bucket: mordía en 298, y a 64 les borraba más del 25% de la
 * imagen. Caso visto: una foto familiar con las caras agujereadas.
 */
interface PerfilBorde { plano: number; neutro: number }

async function perfilDelBorde(buf: Buffer): Promise<PerfilBorde> {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: c } = info
  const px: number[][] = []
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) { const i = (y * w + x) * c; px.push([data[i], data[i + 1], data[i + 2]]) }
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) { const i = (y * w + x) * c; px.push([data[i], data[i + 1], data[i + 2]]) }
  if (!px.length) return { plano: 0, neutro: 0 }

  const avg = [0, 1, 2].map(k => px.reduce((s, p) => s + p[k], 0) / px.length)
  const plano = px.filter(p => [0, 1, 2].every(k => Math.abs(p[k] - avg[k]) < 28)).length / px.length

  // neutro = sin color (los grises del damero, el negro y el blanco lo son)
  const neutro = px.filter(p => Math.max(...p) - Math.min(...p) <= 18).length / px.length

  return { plano, neutro }
}

/** Fondo liso: casi todo el borde es del mismo color. */
const BORDE_PLANO_MIN = 0.90
/**
 * Damero pintado: no es plano (alterna dos grises) pero el borde entero es
 * gris — sin una gota de color. Una foto nunca llega ahí: medidas reales de
 * bordes fotográficos dan 0.02, 0.05, 0.26, 0.65.
 */
const BORDE_NEUTRO_MIN = 0.98

/**
 * Sacar el fondo sin modelo: flood-fill de blanco desde los bordes + pase de
 * damero. Es el mismo par que ya usa /api/generate-image.
 *
 * Sólo corre si el borde parece un fondo de verdad (ver perfilDelBorde). Si es
 * arte de borde a borde, el diseño se devuelve intacto.
 */
async function knockoutBackground(buf: Buffer): Promise<Buffer> {
  const { plano, neutro } = await perfilDelBorde(buf)
  const esFondo = plano >= BORDE_PLANO_MIN || neutro >= BORDE_NEUTRO_MIN
  if (!esFondo) {
    console.warn(`[perfect-stamp] arte de borde a borde (plano ${plano.toFixed(2)} · neutro ${neutro.toFixed(2)}) → no se recorta`)
    return buf
  }
  return await knockoutFondoPlano(buf)
}

async function knockoutFondoPlano(buf: Buffer): Promise<Buffer> {
  let out = buf
  try {
    const { removeWhiteBackground } = await import('@/lib/designer/remove-white-bg')
    const r = await removeWhiteBackground(out)
    if (r.removed) out = r.buffer
  } catch (e) {
    console.warn('[perfect-stamp] knockout blanco falló:', (e as Error)?.message)
  }
  try {
    const { removeCheckerboardBackground } = await import('@/lib/designer/remove-checkerboard-bg')
    const c = await removeCheckerboardBackground(out)
    if (c.removed) out = c.buffer
  } catch (e) {
    console.warn('[perfect-stamp] knockout damero falló:', (e as Error)?.message)
  }
  return out
}

/**
 * Quitar fondo del diseño.
 *
 * ORDEN: primero el recorte determinístico, que es gratis, instantáneo y
 * siempre da el mismo resultado. Sólo si NO encuentra fondo recortable se
 * prueba con Gemini.
 *
 * Por qué en ese orden: `gemini-2.5-flash-image` no emite alpha. Cuando le
 * pedís que quite el fondo devuelve un PNG OPACO con el damero de
 * transparencia PINTADO como píxeles, y encima re-renderiza el arte (en el
 * caso de ORIGEN dio vuelta el texto de blanco a negro — el "negativo" que
 * reportó el partner). Medido sobre 18 diseños reales de clientes: 0 de 18
 * trajeron transparencia real, o sea que su salida se descartaba SIEMPRE y la
 * llamada era plata tirada.
 *
 * Se deja el intento como respaldo para los diseños donde el recorte no muerde
 * (fondos oscuros o fotográficos): hoy tampoco sirve, pero si Google llega a
 * emitir alpha lo aprovecha sin volver a tocar esto. Su salida se acepta SÓLO
 * con transparencia real: sin eso el arte viene corrupto.
 */
export async function removeDesignBackground(
  designBuffer: Buffer,
  stats?: PerfectStampStats,
): Promise<Buffer> {
  const det = await knockoutBackground(designBuffer)
  if (await hasRealAlpha(det)) return det

  let fromModel: Buffer | null = null
  try {
    const genAI = getClient()
    const result = await genAI.models.generateContent({
      model: REMOVE_BG_MODEL,
      contents: [{ text: REMOVE_BG_PROMPT }, { inlineData: { data: designBuffer.toString('base64'), mimeType: 'image/png' } }] as any,
    })
    if (stats) stats.geminiCalls++
    const b64 = extractImage(result)
    if (b64) fromModel = await magentaKey(Buffer.from(b64, 'base64'))
    else console.warn('[perfect-stamp] removeBg: el modelo no devolvió imagen')
  } catch (e) {
    console.warn('[perfect-stamp] removeBg falló:', (e as Error)?.message)
  }

  if (fromModel && (await hasRealAlpha(fromModel))) return fromModel

  // Sin fondo recortable: se estampa tal cual, igual que antes de este cambio.
  return designBuffer
}

/**
 * Rects de cada posición de estampa, en FRACCIONES de la caja imprimible (0..1).
 * fx/fy = esquina superior izquierda, fw/fh = tamaño. Todos respetan
 * fx+fw <= 1 y fy+fh <= 1, así el cuadro rojo nunca se sale del área de 35×40 cm.
 *
 * Convención de lados — la misma que los cuadros rojos pre-renderizados que ya
 * usa la tienda (public/garments/red-square/*_Frente_R1I.png, medidos: centro en
 * x≈0.61 del ancho): "sobre el corazón" es el pecho izquierdo DEL QUE LA USA, que
 * en una foto de FRENTE cae a la DERECHA de quien mira. En el DORSO no se espeja:
 * el hombro izquierdo del que la usa queda a la izquierda de quien mira.
 *
 * Los tamaños (R1 0.38×0.30, R2 0.70×0.70) son los históricos: acá se corrige
 * DÓNDE cae la estampa, no cuán grande es.
 */
const R1_W = 0.38, R1_H = 0.30
const R2_W = 0.70, R2_H = 0.70

interface PlacementRect { fx: number; fy: number; fw: number; fh: number }

/**
 * Clave: `${tamaño}:${lado}:${posición}` — las posiciones del menú del Studio
 * (app/workspace/design-engine/page.tsx → getPlacementOptions).
 *
 * El lado va en la clave a propósito: "centro alto" existe en el frente Y en el
 * dorso y NO es el mismo lugar (esternón vs. zona alta de la espalda), y en el
 * dorso tiene que quedar distinguible de "nuca / cuello".
 */
const PLACEMENT_RECTS: Record<string, PlacementRect> = {
  // R1 · logo chico · FRENTE — se espeja
  'R1:front:left-chest':  { fx: 0.58, fy: 0.04, fw: R1_W, fh: R1_H },
  'R1:front:right-chest': { fx: 0.04, fy: 0.04, fw: R1_W, fh: R1_H },
  'R1:front:center-high': { fx: 0.31, fy: 0.04, fw: R1_W, fh: R1_H },
  'R1:front:pocket':      { fx: 0.58, fy: 0.24, fw: R1_W, fh: R1_H },
  'R1:front:hem-left':    { fx: 0.58, fy: 0.66, fw: R1_W, fh: R1_H },
  'R1:front:hem-right':   { fx: 0.04, fy: 0.66, fw: R1_W, fh: R1_H },
  // R1 · logo chico · DORSO — NO se espeja
  'R1:back:upper-center': { fx: 0.31, fy: 0.00, fw: R1_W, fh: R1_H },
  'R1:back:upper-left':   { fx: 0.04, fy: 0.06, fw: R1_W, fh: R1_H },
  'R1:back:upper-right':  { fx: 0.58, fy: 0.06, fw: R1_W, fh: R1_H },
  'R1:back:center-high':  { fx: 0.31, fy: 0.14, fw: R1_W, fh: R1_H },
  'R1:back:hem-center':   { fx: 0.31, fy: 0.66, fw: R1_W, fh: R1_H },
  // R2 · estampa mediana · FRENTE
  'R2:front:center':      { fx: 0.15, fy: 0.15, fw: R2_W, fh: R2_H },
  'R2:front:center-high': { fx: 0.15, fy: 0.02, fw: R2_W, fh: R2_H },
  'R2:front:chest-wide':  { fx: 0.04, fy: 0.06, fw: 0.92, fh: 0.55 },
  // R2 · estampa mediana · DORSO
  'R2:back:center':          { fx: 0.15, fy: 0.15, fw: R2_W, fh: R2_H },
  'R2:back:center-high':     { fx: 0.15, fy: 0.02, fw: R2_W, fh: R2_H },
  'R2:back:shoulder-blades': { fx: 0.15, fy: 0.10, fw: R2_W, fh: R2_H },
}

/** Posición por defecto = la primera opción del menú para ese tamaño y lado. */
const DEFAULT_PLACEMENT: Record<StampSize, Record<GarmentSide, string>> = {
  R1: { front: 'left-chest', back: 'upper-center' },
  R2: { front: 'center', back: 'center' },
  R3: { front: 'center', back: 'center' },
}

export type GarmentSide = 'front' | 'back'

/**
 * Rect para (tamaño, lado, posición).
 * R3 (grande) ocupa toda la caja imprimible, así que no tiene variantes.
 * Una posición desconocida cae al default del tamaño en vez de romper.
 */
function resolvePlacementRect(
  size: StampSize,
  side: GarmentSide,
  placement?: string,
): PlacementRect | null {
  if (size === 'R3') return null
  const fallback = DEFAULT_PLACEMENT[size][side]
  return (
    PLACEMENT_RECTS[`${size}:${side}:${placement}`]
    ?? PLACEMENT_RECTS[`${size}:${side}:${fallback}`]
    ?? null
  )
}

/** Todas las posiciones conocidas — usado por los tests para cubrir el menú entero. */
export const PLACEMENT_KEYS = Object.keys(PLACEMENT_RECTS)
export { PLACEMENT_RECTS, resolvePlacementRect }

/** Caja imprimible en píxeles de la foto, con el letterbox del frame de referencia. */
async function cajaEnPx(baseGarmentBuffer: Buffer, imprint: ImprintBox) {
  const meta = await sharp(baseGarmentBuffer).metadata()
  const W = meta.width || 1000, H = meta.height || 1000
  const baseW = imprint.baseW ?? 400, baseH = imprint.baseH ?? 500
  const s = Math.min(W / baseW, H / baseH)
  return {
    W, H,
    x: (W - baseW * s) / 2 + imprint.x * s,
    y: (H - baseH * s) / 2 + imprint.y * s,
    w: imprint.width * s,
    h: imprint.height * s,
  }
}

/**
 * Estampa de TAMAÑO EXACTO: se pega el diseño con sharp en la medida pedida y
 * después Gemini sólo la funde en la tela (BLEND_PROMPT).
 *
 * El camino del cuadro rojo no sirve cuando la medida importa: el modelo la usa
 * como sugerencia y escala según lo que interpreta del arte. Medido sobre el
 * mismo diseño: pedido a 8 cm por el cuadro rojo salía a 21 cm; por este camino
 * sale a 8 cm con ~6% de deriva.
 */
async function estampaExacta(
  designBuffer: Buffer,
  baseGarmentBuffer: Buffer,
  imprint: ImprintBox,
  anchoCm: number,
  size: StampSize,
  side: GarmentSide,
  placement: string | undefined,
  stats?: PerfectStampStats,
): Promise<Buffer> {
  const box = await cajaEnPx(baseGarmentBuffer, imprint)
  const pxPorCm = box.w / AREA_IMPRIMIBLE_CM

  // no dejamos que se pase del área imprimible
  const anchoPx = Math.max(24, Math.round(Math.min(anchoCm * pxPorCm, box.w)))
  const dm = await sharp(designBuffer).metadata()
  const ratio = (dm.height || 1) / (dm.width || 1)
  let altoPx = Math.round(anchoPx * ratio)
  let wPx = anchoPx
  if (altoPx > box.h) { altoPx = Math.round(box.h); wPx = Math.round(altoPx / ratio) }

  const estampa = await sharp(designBuffer).resize(wPx, altoPx, { fit: 'inside' }).png().toBuffer()

  // centro del rect de la posición elegida (para R3 el rect es toda la caja)
  const rect = resolvePlacementRect(size, side, placement) ?? { fx: 0, fy: 0, fw: 1, fh: 1 }
  const cx = box.x + (rect.fx + rect.fw / 2) * box.w
  const cy = box.y + (rect.fy + rect.fh / 2) * box.h
  const left = Math.round(Math.min(Math.max(cx - wPx / 2, box.x), box.x + box.w - wPx))
  const top = Math.round(Math.min(Math.max(cy - altoPx / 2, box.y), box.y + box.h - altoPx))

  const plano = await sharp(baseGarmentBuffer).composite([{ input: estampa, left, top }]).png().toBuffer()

  try {
    const genAI = getClient()
    if (stats) stats.geminiCalls++
    const result = await genAI.models.generateContent({
      model: STAMP_MODEL,
      contents: [{ text: BLEND_PROMPT }, { inlineData: { data: plano.toString('base64'), mimeType: 'image/png' } }] as any,
    })
    const b64 = extractImage(result)
    if (b64) return Buffer.from(b64, 'base64')
    console.warn('[perfect-stamp] fundido: el modelo no devolvió imagen, va el pegado plano')
  } catch (e) {
    console.warn('[perfect-stamp] fundido falló, va el pegado plano:', (e as Error)?.message)
  }
  // sin fundido la estampa igual está en el lugar y la medida correctos
  return plano
}

/** Dibuja el cuadro rojo dinámico sobre la prenda base en el área de impresión. */
export async function buildDynamicRedSquare(baseGarmentBuffer: Buffer, imprint: ImprintBox, size: StampSize, side: GarmentSide = 'front', placement?: string): Promise<Buffer> {
  const meta = await sharp(baseGarmentBuffer).metadata()
  const W = meta.width || 1000, H = meta.height || 1000
  const baseW = imprint.baseW ?? 400, baseH = imprint.baseH ?? 500
  // letterbox: encajar el frame de referencia 400×500 con escala uniforme + centrado
  const s = Math.min(W / baseW, H / baseH)
  const offX = (W - baseW * s) / 2
  const offY = (H - baseH * s) / 2
  let bx = offX + imprint.x * s
  let by = offY + imprint.y * s
  let bw = imprint.width * s
  let bh = imprint.height * s
  const rect = resolvePlacementRect(size, side, placement)
  if (rect) {
    bx += bw * rect.fx
    by += bh * rect.fy
    bw = bw * rect.fw
    bh = bh * rect.fh
  }
  // R3 (o rect nulo) = caja completa
  const r = (n: number) => Math.round(n)
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect x="${r(bx)}" y="${r(by)}" width="${r(bw)}" height="${r(bh)}" fill="#ED1C24"/></svg>`
  return sharp(baseGarmentBuffer).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer()
}

/** Cuántas llamadas a Gemini terminó haciendo de verdad (para medir el costo). */
export interface PerfectStampStats { geminiCalls: number }

export interface PerfectStampOptions {
  designBuffer: Buffer
  baseGarmentBuffer: Buffer
  imprint: ImprintBox
  side?: 'front' | 'back'
  stampSize?: StampSize
  /** Posición elegida en el Studio (left-chest, center-high, ...). Ver PLACEMENT_RECTS. */
  placement?: string
  /** Quitar fondo del diseño antes (default true). Para arte full-bleed/escenas → false. */
  removeBg?: boolean
  /** Si se pasa, se le suma 1 por cada llamada a Gemini efectivamente hecha. */
  stats?: PerfectStampStats
  /**
   * Ancho exacto de la estampa en cm. Cuando se pasa, la estampa se compone
   * acá (sharp) en esa medida y a Gemini sólo se le pide fundirla en la tela.
   *
   * Es el único camino con tamaño garantizado: con el cuadro rojo el modelo
   * decide la escala según lo que "le parece" el arte — medido, un póster
   * pedido como logo chico salía a 21 cm en vez de 10.
   */
  stampWidthCm?: number
}

/** Genera el mockup "perfecto" y devuelve el PNG (sin subir). */
export async function generatePerfectStamp(opts: PerfectStampOptions): Promise<Buffer> {
  const { baseGarmentBuffer, imprint, stampSize = 'R3', side = 'front', placement, removeBg = true, stats } = opts
  // 1. diseño (cap 1024) + quitar fondo
  let designBuffer = await sharp(opts.designBuffer)
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).png().toBuffer()
  if (removeBg) designBuffer = await removeDesignBackground(designBuffer, stats)
  // 2a. tamaño exacto pedido → se compone acá, no lo decide el modelo
  if (opts.stampWidthCm && opts.stampWidthCm > 0) {
    return await estampaExacta(designBuffer, baseGarmentBuffer, imprint, opts.stampWidthCm, stampSize, side, placement, stats)
  }

  // 2b. cuadro rojo dinámico
  const redSquare = await buildDynamicRedSquare(baseGarmentBuffer, imprint, stampSize, side, placement)
  // 3. estampar con STAMP_MODEL (default gemini-2.5-flash-image, ver header)
  const genAI = getClient()
  if (stats) stats.geminiCalls++
  const result = await genAI.models.generateContent({
    model: STAMP_MODEL,
    contents: [
      { text: STAMP_PROMPT },
      { inlineData: { data: designBuffer.toString('base64'), mimeType: 'image/png' } },
      { inlineData: { data: baseGarmentBuffer.toString('base64'), mimeType: 'image/jpeg' } },
      { inlineData: { data: redSquare.toString('base64'), mimeType: 'image/png' } },
    ] as any,
  })
  const b64 = extractImage(result)
  if (!b64) throw new Error('Gemini no devolvió imagen para el mockup')
  return Buffer.from(b64, 'base64')
}
