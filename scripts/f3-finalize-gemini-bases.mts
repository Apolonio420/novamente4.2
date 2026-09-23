/**
 * Fase 3 pieza A — toma las 3 imagenes con fondo reemplazado por Gemini
 * (public/garments/gemini-bg-fixed/*.png, generadas por
 * scripts/f3-gemini-bg-fix.mts y ya verificadas: diff bajo dentro de la
 * mascara de la prenda + revision visual) y les corre el MISMO pipeline
 * determinístico de segmentacion (buildOne) que al resto de las bases,
 * ahora que el fondo es plano y se puede recortar sin IA. Mergea el
 * resultado en lib/garments/std-bases.json y regenera la hoja de contacto.
 */
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { getGarmentMapping } from '../lib/garment-mappings'
import { buildOne, type StdBaseEntry, type Rect } from './f3-build-std-bases.mts'

const PUBLIC = path.join(process.cwd(), 'public')
const STD_BASES_JSON = path.join(process.cwd(), 'lib', 'garments', 'std-bases.json')
const GEMINI_DIR = path.join(PUBLIC, 'garments', 'gemini-bg-fixed')
const SHEET_DIR = '/Users/sambujuan/novamente/dev/chatbot/chatbot-whastapp/playground/auditoria-tiendas/f3'
const CANVAS = 2000

const TARGETS: Array<{ garmentKey: string; color: string; side: 'front' | 'back' }> = [
  { garmentKey: 'remera-crop-mujer', color: 'yellow', side: 'front' },
  { garmentKey: 'musculosa-bali', color: 'white', side: 'front' },
  { garmentKey: 'buzo-hoodie-unisex', color: 'white', side: 'back' },
  { garmentKey: 'buzo-cuello-redondo', color: 'white', side: 'front' },
  { garmentKey: 'buzo-hoodie-unisex', color: 'black', side: 'front' },
  { garmentKey: 'buzo-hoodie-unisex', color: 'white', side: 'front' },
  { garmentKey: 'buzo-hoodie-unisex', color: 'stone-wash', side: 'front' },
]

async function main() {
  const bases: StdBaseEntry[] = JSON.parse(fs.readFileSync(STD_BASES_JSON, 'utf8'))
  const added: StdBaseEntry[] = []

  for (const t of TARGETS) {
    const label = `${t.garmentKey}-${t.color}-${t.side}`
    const geminiPath = path.join(GEMINI_DIR, `${label}.png`)
    if (!fs.existsSync(geminiPath)) {
      console.log(`SKIP ${label}: no existe ${geminiPath}`)
      continue
    }
    const mapping = getGarmentMapping(t.garmentKey, t.color, t.side)
    if (!mapping || mapping.garmentPath === 'fallback') {
      console.log(`SKIP ${label}: sin mapping`)
      continue
    }
    try {
      const { entry } = await buildOne(t.garmentKey, t.color, t.side, geminiPath, mapping.coordinates)
      // reemplazar si ya existia (no deberia, pero por las dudas)
      const idx = bases.findIndex((b) => b.garmentKey === t.garmentKey && b.color === t.color && b.side === t.side)
      if (idx >= 0) bases[idx] = entry
      else bases.push(entry)
      added.push(entry)
      console.log(`OK ${label} -> ${entry.file}`)
    } catch (e: any) {
      console.log(`ERR ${label}: ${e.message}`)
    }
  }

  fs.writeFileSync(STD_BASES_JSON, JSON.stringify(bases, null, 2) + '\n')
  console.log(`\nEscrito ${STD_BASES_JSON} (${bases.length} entradas totales, +${added.length} de Gemini)`)

  // ---- Regenerar hoja de contacto completa ----
  const cols = 8
  const cellW = 220, cellH = 260, pad = 6
  const rows = Math.ceil(bases.length / cols)
  const sheetW = cols * cellW
  const sheetH = rows * cellH
  const composites: sharp.OverlayOptions[] = []
  const svgParts: string[] = []
  for (let i = 0; i < bases.length; i++) {
    const b = bases[i]
    const outPath = path.join(PUBLIC, b.file.replace(/^\//, ''))
    const col = i % cols, row = (i / cols) | 0
    const cellX = col * cellW, cellY = row * cellH
    const thumb = await sharp(outPath).resize(cellW - pad * 2, cellW - pad * 2, { fit: 'inside' }).toBuffer()
    const thumbMeta = await sharp(thumb).metadata()
    const scale = thumbMeta.width! / CANVAS
    composites.push({ input: thumb, left: cellX + pad, top: cellY + pad })
    const pa = b.printArea
    const rx = Math.round(pa.x * scale), ry = Math.round(pa.y * scale)
    const rw = Math.round(pa.w * scale), rh = Math.round(pa.h * scale)
    const isGemini = TARGETS.some((t) => t.garmentKey === b.garmentKey && t.color === b.color && t.side === b.side)
    const label = `${b.garmentKey} ${b.color} ${b.side}${isGemini ? ' [gemini-bg]' : ''}`
    svgParts.push(
      `<rect x="${cellX + pad + rx}" y="${cellY + pad + ry}" width="${rw}" height="${rh}" fill="none" stroke="#ff2d55" stroke-width="2"/>`,
      `<text x="${cellX + 4}" y="${cellY + cellH - 8}" font-size="11" font-family="monospace" fill="${isGemini ? '#0057ff' : '#111'}">${label}</text>`,
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
