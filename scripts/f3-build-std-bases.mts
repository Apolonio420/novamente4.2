/**
 * Fase 3 pieza A — genera public/garments/std/<garmentKey>-<color>-<side>.jpg
 * (2000x2000, fondo plano #d9d9d9, prenda centrada a ~80% del alto) para cada
 * combinacion prenda x color x lado de CATALOG_PRODUCTS, a partir de la base
 * existente en garment-mappings.json / public/garments.
 *
 * Segmentacion deterministica (sin IA): flood-fill de fondo desde los bordes
 * con tolerancia de color + feather (blur del mask) para no dejar un corte
 * duro, conservando la sombra suave (que no toca el borde, asi que el
 * flood-fill no la alcanza).
 *
 * Escribe ademas lib/garments/std-bases.json con el printArea transformado
 * (misma escala/offset que se le aplico a la imagen) y pxPerCm.
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { CATALOG_PRODUCTS } from '../lib/catalog/products'
import { getGarmentMapping } from '../lib/garment-mappings'

const PUBLIC = path.join(process.cwd(), 'public')
const OUT_DIR = path.join(PUBLIC, 'garments', 'std')
const STD_BASES_JSON = path.join(process.cwd(), 'lib', 'garments', 'std-bases.json')
const SHEET_DIR = path.join(
  '/Users/sambujuan/novamente/dev/chatbot/chatbot-whastapp/playground/auditoria-tiendas/f3',
)

const CANVAS = 2000
const BG = { r: 0xd9, g: 0xd9, b: 0xd9 }
const TARGET_HEIGHT_FRAC = 0.8
// Prendas anchas con las mangas extendidas (crop, cuello redondo, hoodie)
// se pasaban del canvas si solo se ajustaba la altura al 80% — el ancho se
// recortaba en el extract final (parecía "manga rota", no era la mascara).
// Ajustar por el lado MAS RESTRICTIVO de los dos (alto Y ancho) evita el
// recorte lateral sin dejar de llenar el cuadro.
const TARGET_WIDTH_FRAC = 0.84
const AREA_IMPRIMIBLE_CM = 35
// La tolerancia de color ahora es adaptativa por foto — ver adaptiveTolerance().

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(path.dirname(STD_BASES_JSON), { recursive: true })
fs.mkdirSync(SHEET_DIR, { recursive: true })

export interface Rect { x: number; y: number; w: number; h: number }
export interface StdBaseEntry {
  garmentKey: string
  color: string
  side: 'front' | 'back'
  file: string
  printArea: Rect
  pxPerCm: number
}

function cajaLetterbox(W: number, H: number, coords: { x: number; y: number; width: number; height: number }): Rect {
  const baseW = 400, baseH = 500
  const s = Math.min(W / baseW, H / baseH)
  const offX = (W - baseW * s) / 2
  const offY = (H - baseH * s) / 2
  return { x: offX + coords.x * s, y: offY + coords.y * s, w: coords.width * s, h: coords.height * s }
}

export interface RGB { r: number; g: number; b: number }

/**
 * Estima el fondo REAL de esta foto a partir de las 4 ESQUINAS (nunca las
 * pisa la prenda en un flat-lay centrado) — la mediana por canal es mas
 * robusta que el promedio de todo el borde: algunas bases tienen un fondo
 * "moteado" (nubes claras de tela/papel, no gris perfectamente plano) y un
 * promedio de borde completo se contaminaba con zonas mas oscuras del
 * moteado, corriendo la referencia.
 */
export function estimateLocalBackground(raw: Buffer, W: number, H: number, channels: number): RGB {
  const patch = Math.max(4, Math.floor(Math.min(W, H) * 0.06))
  const rs: number[] = [], gs: number[] = [], bs: number[] = []
  const corners: Array<[number, number]> = [[0, 0], [W - patch, 0], [0, H - patch], [W - patch, H - patch]]
  for (const [cx, cy] of corners) {
    for (let y = cy; y < cy + patch; y++) {
      for (let x = cx; x < cx + patch; x++) {
        const o = (y * W + x) * channels
        rs.push(raw[o]); gs.push(raw[o + 1]); bs.push(raw[o + 2])
      }
    }
  }
  const median = (arr: number[]) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }
  return { r: median(rs), g: median(gs), b: median(bs) }
}

/**
 * Tolerancia de color ADAPTATIVA, calibrada con los propios píxeles del
 * borde de ESTA foto en vez de un número fijo: algunas bases tienen un fondo
 * casi perfectamente plano (desvío ~0, sirve una tolerancia chica) y otras
 * un fondo "moteado" real (desvío hasta ~15-17, necesitan una tolerancia
 * mayor para que el flood-fill no se quede pegado en los bordes mas claros
 * del moteado). Se mide el percentil 92 de la distancia (canal con mayor
 * desvío) de los píxeles de borde a la referencia, con margen — así cada
 * foto usa la tolerancia que en verdad necesita, ni más ni menos.
 */
export function adaptiveTolerance(raw: Buffer, W: number, H: number, channels: number, bg: RGB): number {
  const devs: number[] = []
  const step = Math.max(1, Math.floor(Math.min(W, H) / 400))
  const pushDev = (x: number, y: number) => {
    const o = (y * W + x) * channels
    const d = Math.max(Math.abs(raw[o] - bg.r), Math.abs(raw[o + 1] - bg.g), Math.abs(raw[o + 2] - bg.b))
    devs.push(d)
  }
  for (let x = 0; x < W; x += step) { pushDev(x, 0); pushDev(x, H - 1) }
  for (let y = 0; y < H; y += step) { pushDev(0, y); pushDev(W - 1, y) }
  devs.sort((a, b) => a - b)
  const p92 = devs[Math.min(devs.length - 1, Math.floor(devs.length * 0.92))]
  return Math.min(45, Math.max(10, p92 + 5))
}

/**
 * Tapa el badge circular "Novamente" (logo esquina inferior derecha, visto
 * en boston/cuello redondo/mujer/crop) — DESPUES de segmentar, y
 * restringido a los pixeles que la mascara YA clasificó como fondo
 * (mask===0) dentro de esa zona. Nunca pinta un pixel que la mascara diga
 * que es prenda.
 *
 * Probamos antes: (1) pintarlo ANTES de segmentar con un disco grande —
 * pisaba el puño real de buzo-hoodie-unisex cuando la manga llegaba a esa
 * esquina (mordía tela). (2) inpainting por clonado (radial y por
 * traslación) — el clonado radial distorsionaba cualquier borde recto en
 * un patrón dentado, y el clonado por traslación fija terminó copiando
 * parte de OTRA zona de la manga, dejando un bulto redondo donde no lo
 * había (deformaba la forma real de la prenda, peor que dejar el logo).
 *
 * Por eso: circulo CHICO calibrado al tamaño real del logo medido en
 * varias fotos (centro ~0.944,0.944 fracción, no 0.905 — más ajustado al
 * borde para minimizar la chance de superponerse a tela real) y SOLO
 * repinta fondo. Si el logo llega a estar pegado/fundido con la prenda en
 * alguna foto puntual (mask!==0 ahi), queda tal cual — nunca se toca tela.
 */
function patchBadgeZone(raw: Buffer, mask: Uint8Array, W: number, H: number, channels: number, bg: RGB): void {
  const cx = W * 0.944, cy = H * 0.944
  const radius = Math.min(W, H) * 0.045
  const r2 = radius * radius
  const x0 = Math.max(0, Math.floor(cx - radius)), x1 = Math.min(W, Math.ceil(cx + radius))
  const y0 = Math.max(0, Math.floor(cy - radius)), y1 = Math.min(H, Math.ceil(cy + radius))
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const dx = x - cx, dy = y - cy
      if (dx * dx + dy * dy > r2) continue
      const idx = y * W + x
      if (mask[idx] !== 0) continue // nunca tocar un pixel que es parte de la prenda
      const o = idx * channels
      raw[o] = bg.r; raw[o + 1] = bg.g; raw[o + 2] = bg.b
    }
  }
}

/**
 * De un mask binario (255=sujeto), se queda SOLO con la componente conexa
 * mas grande — descarta manchas sueltas (ruido del moteado que localmente
 * superó la tolerancia) que quedaron marcadas como "sujeto" sin ser parte
 * de la prenda.
 */
/**
 * Devuelve `fragmentationRatio` = tamaño de la componente mas grande /
 * total de píxeles "sujeto" antes de limpiar — si la prenda quedo partida
 * en muchos pedazos sueltos (un color demasiado parecido al fondo para
 * ESTA foto puntual, ej. amarillo/crema sobre el moteado claro) esta
 * relación cae bajo, señal de que la segmentación no dio una silueta
 * limpia aunque el guardarraíl de bbox/densidad no lo detecte (el pedazo
 * mas grande — una manga suelta — puede igual ser denso y no-tan-chico).
 */
export function keepLargestComponent(mask: Uint8Array, W: number, H: number): { fragmentationRatio: number } {
  const N = W * H
  const labels = new Int32Array(N).fill(-1)
  const stack = new Int32Array(N)
  let bestLabel = -1, bestSize = 0
  let totalForeground = 0
  let label = 0
  for (let start = 0; start < N; start++) {
    if (mask[start] !== 255 || labels[start] !== -1) continue
    let sp = 0
    stack[sp++] = start
    labels[start] = label
    let size = 0
    while (sp > 0) {
      const idx = stack[--sp]
      size++
      const x = idx % W, y = (idx / W) | 0
      const tryPush = (n: number) => { if (mask[n] === 255 && labels[n] === -1) { labels[n] = label; stack[sp++] = n } }
      if (x > 0) tryPush(idx - 1)
      if (x < W - 1) tryPush(idx + 1)
      if (y > 0) tryPush(idx - W)
      if (y < H - 1) tryPush(idx + W)
    }
    totalForeground += size
    if (size > bestSize) { bestSize = size; bestLabel = label }
    label++
  }
  if (bestLabel < 0) return { fragmentationRatio: 1 }
  for (let i = 0; i < N; i++) {
    if (mask[i] === 255 && labels[i] !== bestLabel) mask[i] = 0
  }
  return { fragmentationRatio: totalForeground > 0 ? bestSize / totalForeground : 1 }
}

/** BFS iterativo con stack tipado — marca 255=sujeto, 0=fondo. */
export function floodFillBackground(raw: Buffer, W: number, H: number, channels: number, bg: { r: number; g: number; b: number }, tol: number): Uint8Array {
  const N = W * H
  const mask = new Uint8Array(N).fill(255)
  const visited = new Uint8Array(N)
  const stack = new Int32Array(N)
  let sp = 0

  const isBg = (idx: number) => {
    const o = idx * channels
    const r = raw[o], g = raw[o + 1], b = raw[o + 2]
    return Math.abs(r - bg.r) <= tol && Math.abs(g - bg.g) <= tol && Math.abs(b - bg.b) <= tol
  }

  for (let x = 0; x < W; x++) {
    for (const y of [0, H - 1]) {
      const idx = y * W + x
      if (!visited[idx] && isBg(idx)) { visited[idx] = 1; stack[sp++] = idx }
    }
  }
  for (let y = 0; y < H; y++) {
    for (const x of [0, W - 1]) {
      const idx = y * W + x
      if (!visited[idx] && isBg(idx)) { visited[idx] = 1; stack[sp++] = idx }
    }
  }

  while (sp > 0) {
    const idx = stack[--sp]
    mask[idx] = 0
    const x = idx % W, y = (idx / W) | 0
    if (x > 0) { const n = idx - 1; if (!visited[n] && isBg(n)) { visited[n] = 1; stack[sp++] = n } }
    if (x < W - 1) { const n = idx + 1; if (!visited[n] && isBg(n)) { visited[n] = 1; stack[sp++] = n } }
    if (y > 0) { const n = idx - W; if (!visited[n] && isBg(n)) { visited[n] = 1; stack[sp++] = n } }
    if (y < H - 1) { const n = idx + W; if (!visited[n] && isBg(n)) { visited[n] = 1; stack[sp++] = n } }
  }
  return mask
}

/**
 * Contraste real prenda-vs-fondo, medido DENTRO de la silueta detectada (no
 * en todo el cuadro): mediana de la distancia de color al fondo en una
 * grilla de puntos del 50% central del bbox, menos la tolerancia usada. Un
 * margen chico o negativo es la firma del caso "yellow crop" (un color de
 * prenda puntual, en ESTA foto, demasiado parecido al moteado de fondo):
 * bbox y densidad pueden salir razonables y aun así la silueta viene toda
 * carcomida por dentro (recorte en jirones, no un borde limpio).
 */
function contrastMargin(
  raw: Buffer, W: number, H: number, channels: number, bg: RGB, tol: number,
  bbox: { x0: number; y0: number; x1: number; y1: number },
): number {
  const bw = bbox.x1 - bbox.x0, bh = bbox.y1 - bbox.y0
  const x0 = bbox.x0 + bw * 0.25, x1 = bbox.x0 + bw * 0.75
  const y0 = bbox.y0 + bh * 0.25, y1 = bbox.y0 + bh * 0.75
  const dists: number[] = []
  const STEPS = 5
  for (let i = 0; i < STEPS; i++) {
    for (let j = 0; j < STEPS; j++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / (STEPS - 1))
      const y = Math.round(y0 + ((y1 - y0) * j) / (STEPS - 1))
      if (x < 0 || y < 0 || x >= W || y >= H) continue
      const o = (y * W + x) * channels
      dists.push(Math.max(Math.abs(raw[o] - bg.r), Math.abs(raw[o + 1] - bg.g), Math.abs(raw[o + 2] - bg.b)))
    }
  }
  if (!dists.length) return -999
  dists.sort((a, b) => a - b)
  const median = dists[Math.floor(dists.length / 2)]
  return median - tol
}

export function maskBbox(mask: Uint8Array, W: number, H: number) {
  let minX = W, minY = H, maxX = -1, maxY = -1
  let foregroundCount = 0
  for (let y = 0; y < H; y++) {
    const row = y * W
    for (let x = 0; x < W; x++) {
      if (mask[row + x] === 255) {
        foregroundCount++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return { x0: 0, y0: 0, x1: W, y1: H, foregroundCount: 0 }
  return { x0: minX, y0: minY, x1: maxX + 1, y1: maxY + 1, foregroundCount }
}

export async function buildOne(garmentKey: string, color: string, side: 'front' | 'back', srcPath: string, coords: { x: number; y: number; width: number; height: number }): Promise<{ entry: StdBaseEntry; outPath: string }> {
  const img = sharp(srcPath).rotate() // respeta EXIF
  const meta = await img.metadata()
  const W = meta.width!, H = meta.height!
  const { data: raw, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const channels = info.channels

  const localBg = estimateLocalBackground(raw, W, H, channels)
  const tol = adaptiveTolerance(raw, W, H, channels, localBg)
  const mask = floodFillBackground(raw, W, H, channels, localBg, tol)
  const { fragmentationRatio } = keepLargestComponent(mask, W, H)
  // Recien ACA, con la mascara final: solo repinta lo que ya es fondo.
  patchBadgeZone(raw, mask, W, H, channels, localBg)
  const bbox = maskBbox(mask, W, H)
  const bboxArea = (bbox.x1 - bbox.x0) * (bbox.y1 - bbox.y0)
  const density = bboxArea > 0 ? bbox.foregroundCount / bboxArea : 0
  // Guardarraíles — mejor listar la combinación como faltante que publicar
  // un mockup roto:
  //  1) bbox <5% del cuadro o densidad <25%: contorno fantasma disperso
  //     (foto con fondo blanco puro en vez del gris de estudio, sin
  //     contraste de color para separar).
  //  2) fragmentationRatio <0.75: la silueta quedó partida en pedazos
  //     sueltos (un color puntual — crema/amarillo — demasiado parecido al
  //     moteado de ESA foto) y la componente mas grande que sobrevive
  //     (ej. una manga sola) puede igual pasar el chequeo de bbox/densidad.
  //     Calibrado contra casos reales: 91% (hoodie blanco, OK) vs 62%
  //     (crop amarillo frente, roto en jirones) — 75 separa ambos.
  if (bboxArea / (W * H) < 0.05 || density < 0.25) {
    throw new Error(
      `segmentacion fallida — bbox ${(100 * bboxArea / (W * H)).toFixed(1)}% del cuadro, densidad ${(100 * density).toFixed(1)}%. `
      + `Probable foto con fondo distinto al resto (blanco puro en vez de gris de estudio); revisar a ojo.`,
    )
  }
  if (fragmentationRatio < 0.75) {
    throw new Error(
      `segmentacion fallida — la silueta quedó fragmentada (componente mas grande = ${(100 * fragmentationRatio).toFixed(1)}% del total). `
      + `Probable color de prenda demasiado parecido al moteado de esta foto puntual; revisar a ojo.`,
    )
  }
  if (process.env.F3_DEBUG) {
    const margin = contrastMargin(raw, W, H, channels, localBg, tol, bbox)
    console.log(`DEBUG ${garmentKey} ${color} ${side}: tol=${tol} bboxFrac=${(100*bboxArea/(W*H)).toFixed(1)}% density=${(100*density).toFixed(1)}% frag=${(100*fragmentationRatio).toFixed(1)}% margin=${margin.toFixed(1)}`)
  }
  const bboxH = bbox.y1 - bbox.y0
  const bboxW = bbox.x1 - bbox.x0
  const kHeight = (TARGET_HEIGHT_FRAC * CANVAS) / bboxH
  const kWidth = (TARGET_WIDTH_FRAC * CANVAS) / bboxW
  const k = Math.min(kHeight, kWidth)

  // Alpha con feather: blur suave del mask para que el corte no sea duro.
  // sharp asume color (3 canales) al blurear un raw de 1 canal — extractChannel(0)
  // lo vuelve a dejar en escala de grises de 1 canal (medido: sin esto el buffer
  // salia 3x mas largo y desalineaba el alpha por pixel).
  const featheredAlpha = await sharp(Buffer.from(mask), { raw: { width: W, height: H, channels: 1 } })
    .blur(2)
    .extractChannel(0)
    .raw()
    .toBuffer()

  // RGBA = color original + alpha featherizado
  const rgba = Buffer.alloc(W * H * 4)
  for (let i = 0; i < W * H; i++) {
    rgba[i * 4] = raw[i * channels]
    rgba[i * 4 + 1] = raw[i * channels + 1]
    rgba[i * 4 + 2] = raw[i * channels + 2]
    rgba[i * 4 + 3] = featheredAlpha[i]
  }

  const newW = Math.max(1, Math.round(W * k))
  const newH = Math.max(1, Math.round(H * k))
  const resized = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .resize(newW, newH, { kernel: 'lanczos3' })
    .png()
    .toBuffer()

  // Lienzo de trabajo mas grande que CANVAS por si la prenda escalada (k>1
  // cuando el bbox original era chico respecto de la foto, o el bbox no
  // esta centrado en la foto original) no entra en 2000x2000 una vez
  // centrada por el centro del bbox: se compone ahi y despues se recorta al
  // centro. BIG tiene que cubrir el lado MAS LARGO desde el centro del bbox
  // hacia cualquiera de sus 4 bordes, no solo max(newW,newH).
  const scaledBboxCenterX = ((bbox.x0 + bbox.x1) / 2) * k
  const scaledBboxCenterY = ((bbox.y0 + bbox.y1) / 2) * k
  const marginX = 2 * Math.max(scaledBboxCenterX, newW - scaledBboxCenterX)
  const marginY = 2 * Math.max(scaledBboxCenterY, newH - scaledBboxCenterY)
  const BIG = Math.ceil(Math.max(CANVAS, marginX, marginY)) + 20
  const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)
  // clamp: el redondeo de Math.round puede desviar el centrado perfecto por
  // ~1px — preferible a que composite/extract truene por 1px de overflow.
  const dxBig = clamp(Math.round(BIG / 2 - scaledBboxCenterX), 0, BIG - newW)
  const dyBig = clamp(Math.round(BIG / 2 - scaledBboxCenterY), 0, BIG - newH)
  const cropLeft = clamp(Math.round((BIG - CANVAS) / 2), 0, BIG - CANVAS)
  const cropTop = clamp(Math.round((BIG - CANVAS) / 2), 0, BIG - CANVAS)

  // Dos pipelines separados: sharp tira "Image to composite must have same
  // dimensions or smaller" si .extract() se encadena en la MISMA pipeline
  // justo despues de .composite() (medido: falla incluso con el extract
  // perfectamente adentro del canvas) — round-trip por un buffer intermedio
  // lo evita.
  const composed = await sharp({
    create: { width: BIG, height: BIG, channels: 3, background: BG },
  })
    .composite([{ input: resized, left: dxBig, top: dyBig }])
    .png()
    .toBuffer()
  const outBuffer = await sharp(composed)
    .extract({ left: cropLeft, top: cropTop, width: CANVAS, height: CANVAS })
    .jpeg({ quality: 90 })
    .toBuffer()
  const dx = dxBig - cropLeft
  const dy = dyBig - cropTop

  const fileName = `${garmentKey}-${color}-${side}.jpg`
  const outPath = path.join(OUT_DIR, fileName)
  fs.writeFileSync(outPath, outBuffer)

  // printArea: mismo (k, dx, dy) aplicado al rect del imprint original
  const rectOrig = cajaLetterbox(W, H, coords)
  const printArea: Rect = {
    x: Math.round(rectOrig.x * k + dx),
    y: Math.round(rectOrig.y * k + dy),
    w: Math.round(rectOrig.w * k),
    h: Math.round(rectOrig.h * k),
  }
  const pxPerCm = printArea.w / AREA_IMPRIMIBLE_CM

  return {
    entry: { garmentKey, color, side, file: `/garments/std/${fileName}`, printArea, pxPerCm },
    outPath,
  }
}

async function main() {
  const bases: StdBaseEntry[] = []
  const missing: Array<{ garmentKey: string; color: string; side: string; reason: string }> = []
  const thumbs: Array<{ label: string; outPath: string; printArea: Rect }> = []

  for (const p of CATALOG_PRODUCTS) {
    for (const c of p.colors) {
      for (const side of ['front', 'back'] as const) {
        const mapping = getGarmentMapping(p.key, c.key, side)
        if (!mapping || mapping.garmentPath === 'fallback') {
          missing.push({ garmentKey: p.key, color: c.key, side, reason: 'sin mapping (fallback)' })
          continue
        }
        const srcPath = path.join(PUBLIC, mapping.garmentPath.replace(/^\//, ''))
        if (!fs.existsSync(srcPath)) {
          missing.push({ garmentKey: p.key, color: c.key, side, reason: `no existe ${srcPath}` })
          continue
        }
        try {
          const { entry, outPath } = await buildOne(p.key, c.key, side, srcPath, mapping.coordinates)
          bases.push(entry)
          thumbs.push({ label: `${p.key}\n${c.key} ${side}`, outPath, printArea: entry.printArea })
          console.log(`OK  ${p.key} ${c.key} ${side} <- ${srcPath}`)
        } catch (e: any) {
          missing.push({ garmentKey: p.key, color: c.key, side, reason: `error: ${e.message}` })
          console.error(`ERR ${p.key} ${c.key} ${side}:`, e.stack || e.message)
        }
      }
    }
  }

  fs.writeFileSync(STD_BASES_JSON, JSON.stringify(bases, null, 2) + '\n')
  console.log(`\nEscrito ${STD_BASES_JSON} (${bases.length} entradas)`)
  if (missing.length) {
    console.log(`\nFALTANTES (${missing.length}):`)
    for (const m of missing) console.log(`  ${m.garmentKey} ${m.color} ${m.side}: ${m.reason}`)
  } else {
    console.log('\nSin faltantes: todas las combinaciones tienen base.')
  }

  // ---- Hoja de contacto ----
  const cols = 8
  const cellW = 220, cellH = 260, pad = 6
  const rows = Math.ceil(thumbs.length / cols)
  const sheetW = cols * cellW
  const sheetH = rows * cellH
  const composites: sharp.OverlayOptions[] = []
  const svgParts: string[] = []
  for (let i = 0; i < thumbs.length; i++) {
    const t = thumbs[i]
    const col = i % cols, row = (i / cols) | 0
    const cellX = col * cellW, cellY = row * cellH
    const thumb = await sharp(t.outPath).resize(cellW - pad * 2, cellW - pad * 2, { fit: 'inside' }).toBuffer()
    const thumbMeta = await sharp(thumb).metadata()
    const tw = thumbMeta.width!
    const scale = tw / CANVAS
    composites.push({ input: thumb, left: cellX + pad, top: cellY + pad })
    // printArea escalado al thumb
    const pa = t.printArea
    const rx = Math.round(pa.x * scale), ry = Math.round(pa.y * scale)
    const rw = Math.round(pa.w * scale), rh = Math.round(pa.h * scale)
    // UN solo SVG del tamaño de la hoja entera — un SVG por celda con su
    // propio viewBox chico recortaba (clipeaba) todo lo que cayera fuera de
    // ese viewBox, o sea todas las celdas salvo la (0,0). Ver hallazgo.
    svgParts.push(
      `<rect x="${cellX + pad + rx}" y="${cellY + pad + ry}" width="${rw}" height="${rh}" fill="none" stroke="#ff2d55" stroke-width="2"/>`,
      `<text x="${cellX + 4}" y="${cellY + cellH - 8}" font-size="11" font-family="monospace" fill="#111">${t.label.replace(/\n/g, ' ')}</text>`,
    )
  }
  const overlaySvg = `<svg width="${sheetW}" height="${sheetH}" xmlns="http://www.w3.org/2000/svg">${svgParts.join('\n')}</svg>`
  composites.push({ input: Buffer.from(overlaySvg), left: 0, top: 0 })
  const sheet = await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: { r: 245, g: 245, b: 245 } } })
    .composite(composites)
    .png()
    .toBuffer()
  const sheetPath = path.join(SHEET_DIR, '_hoja-bases.png')
  fs.writeFileSync(sheetPath, sheet)
  console.log(`Hoja de contacto: ${sheetPath} (${sheetW}x${sheetH})`)
}

// Solo correr el pipeline completo si el archivo se ejecuta directo (no al
// importar sus funciones exportadas desde otro script, ej. f3-gemini-bg-fix.mts).
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  main().catch((e) => { console.error(e); process.exit(1) })
}
