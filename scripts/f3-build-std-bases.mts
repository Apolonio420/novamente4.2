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
const AREA_IMPRIMIBLE_CM = 35
// Tight a proposito (ver estimateLocalBackground): el fondo real es casi
// plano por foto (desvio 0..5), y la prenda blanca mas clara del catalogo
// solo se aleja ~9-11 unidades del fondo — 8 separa ambos casos sin comerse
// la prenda.
const BG_TOLERANCE = 8

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(path.dirname(STD_BASES_JSON), { recursive: true })
fs.mkdirSync(SHEET_DIR, { recursive: true })

interface Rect { x: number; y: number; w: number; h: number }
interface StdBaseEntry {
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

/**
 * Estima el fondo REAL de esta foto (no asumir #d9d9d9 fijo): la mayoria de
 * las bases son casi exactamente ese gris, pero algunas difieren un poco
 * (ruido JPEG, viñeteado). Medido: el fondo es CASI PLANO dentro de una
 * misma foto (desvio estandar 0..5 en los casos reales), mientras que la
 * prenda BLANCA solo esta ~10-20 unidades mas clara — con un target fijo y
 * tolerancia floja (30) el flood-fill se comia toda una prenda blanca entera
 * (caso real: aldea/aura blanco, musculosa blanca, hoodie blanco).
 */
function estimateLocalBackground(raw: Buffer, W: number, H: number, channels: number): { r: number; g: number; b: number } {
  let sr = 0, sg = 0, sb = 0, n = 0
  const step = Math.max(1, Math.floor(Math.min(W, H) / 500))
  for (let x = 0; x < W; x += step) {
    for (const y of [0, H - 1]) {
      const o = (y * W + x) * channels
      sr += raw[o]; sg += raw[o + 1]; sb += raw[o + 2]; n++
    }
  }
  for (let y = 0; y < H; y += step) {
    for (const x of [0, W - 1]) {
      const o = (y * W + x) * channels
      sr += raw[o]; sg += raw[o + 1]; sb += raw[o + 2]; n++
    }
  }
  return { r: sr / n, g: sg / n, b: sb / n }
}

/** BFS iterativo con stack tipado — marca 255=sujeto, 0=fondo. */
function floodFillBackground(raw: Buffer, W: number, H: number, channels: number, bg: { r: number; g: number; b: number }, tol: number): Uint8Array {
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

function maskBbox(mask: Uint8Array, W: number, H: number) {
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

async function buildOne(garmentKey: string, color: string, side: 'front' | 'back', srcPath: string, coords: { x: number; y: number; width: number; height: number }): Promise<{ entry: StdBaseEntry; outPath: string }> {
  const img = sharp(srcPath).rotate() // respeta EXIF
  const meta = await img.metadata()
  const W = meta.width!, H = meta.height!
  const { data: raw, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const channels = info.channels

  const localBg = estimateLocalBackground(raw, W, H, channels)
  const mask = floodFillBackground(raw, W, H, channels, localBg, BG_TOLERANCE)
  const bbox = maskBbox(mask, W, H)
  const bboxArea = (bbox.x1 - bbox.x0) * (bbox.y1 - bbox.y0)
  const density = bboxArea > 0 ? bbox.foregroundCount / bboxArea : 0
  // Guardarraíl: si la prenda detectada ocupa menos del 5% del cuadro, o el
  // "sujeto" es un contorno hueco disperso (densidad de píxeles de sujeto
  // adentro de su propio bbox muy baja) la segmentación fracasó — visto en
  // la práctica: una foto sobre fondo BLANCO puro en vez del gris de estudio
  // (sin contraste de color no hay nada que separar; el flood-fill se come
  // casi toda la prenda y sólo dejaba un contorno fantasma disperso, que
  // igual arma un bbox grande pero casi vacío). Mejor listar la combinación
  // como faltante que publicar un mockup roto.
  if (bboxArea / (W * H) < 0.05 || density < 0.25) {
    throw new Error(
      `segmentacion fallida — bbox ${(100 * bboxArea / (W * H)).toFixed(1)}% del cuadro, densidad ${(100 * density).toFixed(1)}%. `
      + `Probable foto con fondo distinto al resto (blanco puro en vez de gris de estudio); revisar a ojo.`,
    )
  }
  const bboxH = bbox.y1 - bbox.y0
  const k = (TARGET_HEIGHT_FRAC * CANVAS) / bboxH

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

main().catch((e) => { console.error(e); process.exit(1) })
