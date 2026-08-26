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

/** Quitar fondo del diseño (igual que platform/lib/mockup/remove-bg.ts). */
export async function removeDesignBackground(designBuffer: Buffer): Promise<Buffer> {
  try {
    const genAI = getClient()
    const result = await genAI.models.generateContent({
      model: REMOVE_BG_MODEL,
      contents: [{ text: REMOVE_BG_PROMPT }, { inlineData: { data: designBuffer.toString('base64'), mimeType: 'image/png' } }] as any,
    })
    const b64 = extractImage(result)
    if (!b64) return designBuffer
    return await magentaKey(Buffer.from(b64, 'base64'))
  } catch (e) {
    console.warn('[perfect-stamp] removeBg falló, uso diseño original:', (e as Error)?.message)
    return designBuffer
  }
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
}

/** Genera el mockup "perfecto" y devuelve el PNG (sin subir). */
export async function generatePerfectStamp(opts: PerfectStampOptions): Promise<Buffer> {
  const { baseGarmentBuffer, imprint, stampSize = 'R3', side = 'front', placement, removeBg = true } = opts
  // 1. diseño (cap 1024) + quitar fondo
  let designBuffer = await sharp(opts.designBuffer)
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).png().toBuffer()
  if (removeBg) designBuffer = await removeDesignBackground(designBuffer)
  // 2. cuadro rojo dinámico
  const redSquare = await buildDynamicRedSquare(baseGarmentBuffer, imprint, stampSize, side, placement)
  // 3. estampar con STAMP_MODEL (default gemini-2.5-flash-image, ver header)
  const genAI = getClient()
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
