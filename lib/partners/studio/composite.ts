/**
 * Compositor de mockup DETERMINÍSTICO (sharp).
 *
 * Reemplaza la generación por IA (Gemini), que dejaba el fondo del diseño y lo
 * ubicaba de forma inconsistente → mockups "superpuestos". Acá sacamos el fondo
 * blanco del diseño (o respetamos transparencia) y lo pegamos centrado al pecho
 * sobre la plantilla de la prenda, a posición y tamaño fijos. Resultado prolijo
 * y consistente siempre.
 */
import sharp from 'sharp'

export interface CompositeOpts {
  side?: 'front' | 'back'
  /** Ancho del diseño como fracción del ancho de la prenda (default 0.46). */
  scale?: number
}

/**
 * Deja el diseño listo para componer: si ya es transparente lo recorta y usa
 * tal cual; si es opaco con fondo blanco, lo recorta y vuelve transparente el
 * blanco puro (conserva el resto del arte).
 */
async function prepareDesign(designBuffer: Buffer): Promise<Buffer> {
  const meta = await sharp(designBuffer).metadata()
  if (meta.hasAlpha) {
    return sharp(designBuffer).trim({ threshold: 6 }).png().toBuffer()
  }
  const { data, info } = await sharp(designBuffer).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const px = info.width * info.height
  const out = Buffer.alloc(px * 4)
  for (let i = 0; i < px; i++) {
    const r = data[i * 3]
    const g = data[i * 3 + 1]
    const b = data[i * 3 + 2]
    const mn = Math.min(r, g, b)
    let a: number
    if (mn >= 248) a = 0
    else if (mn <= 236) a = 255
    else a = Math.round(((248 - mn) / 12) * 255)
    out[i * 4] = r
    out[i * 4 + 1] = g
    out[i * 4 + 2] = b
    out[i * 4 + 3] = a
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 6 })
    .png()
    .toBuffer()
}

export async function compositeDesignOnGarment(
  designBuffer: Buffer,
  garmentBuffer: Buffer,
  opts: CompositeOpts = {},
): Promise<Buffer> {
  const side = opts.side ?? 'front'
  const scale = opts.scale ?? 0.46

  const meta = await sharp(garmentBuffer).rotate().metadata()
  const W = meta.width ?? 1600
  const H = meta.height ?? 1600

  const design = await prepareDesign(designBuffer)
  const scaled = await sharp(design)
    .resize({
      width: Math.round(W * scale),
      height: Math.round(H * 0.5),
      fit: 'inside',
      withoutEnlargement: false,
    })
    .png()
    .toBuffer()
  const dm = await sharp(scaled).metadata()
  const dW = dm.width ?? Math.round(W * scale)
  const dH = dm.height ?? Math.round(H * 0.4)

  const left = Math.round((W - dW) / 2)
  const chestY = side === 'back' ? 0.42 : 0.4
  const top = Math.max(Math.round(H * 0.07), Math.round(H * chestY - dH / 2))

  return sharp(garmentBuffer)
    .rotate()
    .composite([{ input: scaled, left, top }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer()
}
