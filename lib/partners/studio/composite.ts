/**
 * Compositor de mockup DETERMINÍSTICO (sharp).
 *
 * Reemplaza la generación por IA (Gemini), que ubicaba el diseño de forma
 * inconsistente y a veces gigante cubriendo toda la prenda → mockups
 * "superpuestos". Acá:
 *   1. Preparamos el diseño: si el borde es blanco lo tratamos como logo y
 *      sacamos el fondo; si el borde es colorido es arte full-bleed (póster) y
 *      lo respetamos tal cual como rectángulo.
 *   2. Lo ubicamos SIEMPRE dentro de la zona de estampa de la prenda (imprint
 *      box), centrado y a escala fit-inside. Prolijo y consistente siempre.
 */
import sharp from 'sharp'

/** Caja de estampa, en coordenadas sobre una base (default 400×500). */
export interface ImprintBox {
  x: number
  y: number
  width: number
  height: number
  baseW?: number
  baseH?: number
}

export interface CompositeOpts {
  side?: 'front' | 'back'
  /** Zona de estampa de la prenda (de garment-mappings). Si falta, heurística pecho. */
  imprint?: ImprintBox | null
  /** Ancho del diseño como fracción del ancho de la prenda (solo si NO hay imprint). */
  scale?: number
  /** Tamaño de la estampa: 'large' (default) llena la caja, 'medium' la achica, 'chest-logo' logo chico arriba. */
  stampMode?: 'large' | 'medium' | 'chest-logo' | string
  /** Posición horizontal cuando la estampa es chica (left-chest / right-chest). */
  placement?: string
}

/** Fracción de píxeles del borde que son casi blancos (para decidir si sacar fondo). */
async function borderWhiteFraction(buf: Buffer): Promise<number> {
  const N = 64
  const { data, info } = await sharp(buf)
    .resize(N, N, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const ch = info.channels
  let white = 0
  let total = 0
  const isWhite = (i: number) => Math.min(data[i], data[i + 1], data[i + 2]) >= 238
  for (let x = 0; x < N; x++) {
    for (const y of [0, N - 1]) {
      const i = (y * N + x) * ch
      total++
      if (isWhite(i)) white++
    }
  }
  for (let y = 1; y < N - 1; y++) {
    for (const x of [0, N - 1]) {
      const i = (y * N + x) * ch
      total++
      if (isWhite(i)) white++
    }
  }
  return total ? white / total : 0
}

/**
 * Deja el diseño listo para componer:
 *  - PNG con alpha → recorta y usa tal cual (ya transparente).
 *  - Borde blanco (logo/diseño sobre fondo blanco) → vuelve transparente el blanco.
 *  - Borde colorido (póster full-bleed) → lo respeta como rectángulo (no toca el fondo).
 */
async function prepareDesign(designBuffer: Buffer): Promise<Buffer> {
  const meta = await sharp(designBuffer).metadata()
  if (meta.hasAlpha) {
    return sharp(designBuffer).trim({ threshold: 6 }).png().toBuffer()
  }
  const whiteFrac = await borderWhiteFraction(designBuffer)
  if (whiteFrac < 0.55) {
    // Arte full-bleed (póster): respetar tal cual como rectángulo.
    return sharp(designBuffer).png().toBuffer()
  }
  // Logo/diseño sobre blanco: sacar el fondo blanco (conserva el resto del arte).
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

  const meta = await sharp(garmentBuffer).rotate().metadata()
  const W = meta.width ?? 1600
  const H = meta.height ?? 1600

  // Caja de estampa (imprint box). Si la prenda la define, la usamos; si no,
  // heurística: caja centrada al pecho.
  let boxL: number
  let boxT: number
  let boxW: number
  let boxH: number
  if (opts.imprint && opts.imprint.width > 0 && opts.imprint.height > 0) {
    const baseW = opts.imprint.baseW ?? 400
    const baseH = opts.imprint.baseH ?? 500
    // Encajamos el frame de referencia (baseW×baseH, retrato 400×500) DENTRO de
    // la imagen de la prenda con UNA escala uniforme + centrado (letterbox).
    // Escalar x/y por separado (x/baseW*W, y/baseH*H) deformaba y agrandaba la
    // caja cuando la prenda no era retrato 0.8 (ej. foto cuadrada) → estampa
    // oversized/descentrada. Con escala uniforme, para una prenda retrato 0.8 el
    // resultado es idéntico al anterior; para una cuadrada queda bien ubicada.
    const s = Math.min(W / baseW, H / baseH)
    const offX = (W - baseW * s) / 2
    const offY = (H - baseH * s) / 2
    boxL = offX + opts.imprint.x * s
    boxT = offY + opts.imprint.y * s
    boxW = opts.imprint.width * s
    boxH = opts.imprint.height * s
  } else {
    const scale = opts.scale ?? 0.46
    boxW = W * scale
    boxH = H * 0.5
    boxL = (W - boxW) / 2
    const chestY = side === 'back' ? 0.42 : 0.4
    boxT = H * chestY - boxH / 2
  }

  // Sub-caja según el tamaño elegido. 'large' (default) usa toda la caja de
  // estampa (path ya verificado). 'medium'/'chest-logo' la achican.
  const mode = opts.stampMode || 'large'
  let sL = boxL
  let sT = boxT
  let sW = boxW
  let sH = boxH
  if (mode === 'medium' || mode === 'chest-logo') {
    const fill = mode === 'chest-logo' ? 0.34 : 0.72
    sW = boxW * fill
    sH = mode === 'chest-logo' ? boxH * 0.45 : boxH * fill
    sT = mode === 'chest-logo' ? boxT + boxH * 0.04 : boxT + (boxH - sH) / 2
    sL = boxL + (boxW - sW) / 2
    const place = opts.placement || ''
    if (place.includes('left')) sL = boxL + boxW * 0.08
    else if (place.includes('right')) sL = boxL + boxW - sW - boxW * 0.08
  }

  const design = await prepareDesign(designBuffer)
  const scaled = await sharp(design)
    .resize({
      width: Math.max(1, Math.round(sW)),
      height: Math.max(1, Math.round(sH)),
      fit: 'inside',
      withoutEnlargement: false,
    })
    .png()
    .toBuffer()
  const dm = await sharp(scaled).metadata()
  const dW = dm.width ?? Math.round(sW)
  const dH = dm.height ?? Math.round(sH)

  // Centrar el diseño dentro de la sub-caja.
  const left = Math.max(0, Math.round(sL + (sW - dW) / 2))
  const top = Math.max(0, Math.round(sT + (sH - dH) / 2))

  return sharp(garmentBuffer)
    .rotate()
    .composite([{ input: scaled, left, top }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer()
}
