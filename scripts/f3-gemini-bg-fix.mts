/**
 * Fase 3 pieza A — arreglo puntual AUTORIZADO con Gemini (23/09, pedido del
 * coordinador) para las bases que no salieron limpias sin IA:
 *   remera-crop-mujer yellow front, musculosa-bali white front,
 *   buzo-hoodie-unisex white back.
 *
 * Gemini SOLO reemplaza el fondo por #d9d9d9 plano — nunca toca la prenda.
 * Después de cada intento se verifica que la prenda no cambió (diff medio
 * por pixel en la región central, y el humano mira con Read) y recién ahí
 * se re-segmenta DETERMINÍSTICAMENTE sobre el resultado (mismo pipeline de
 * scripts/f3-build-std-bases.mts). Máx 3 intentos por base.
 */
import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { getGarmentMapping } from '../lib/garment-mappings'
import { estimateLocalBackground, adaptiveTolerance, floodFillBackground, keepLargestComponent } from './f3-build-std-bases.mts'

const ENV_PATH = '/Users/sambujuan/novamente/dev/novamente4.2-main 2/.env.local'
for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
}

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'
const API_KEY = process.env.GEMINI_API_KEY
if (!API_KEY) throw new Error('Falta GEMINI_API_KEY')

const PUBLIC = path.join(process.cwd(), 'public')
const OUT_DIR = path.join(PUBLIC, 'garments', 'gemini-bg-fixed')
fs.mkdirSync(OUT_DIR, { recursive: true })

const PROMPT = `Replace only the background with a flat solid #d9d9d9 studio background; keep the garment pixel-identical, same position, same shadows, no changes to fabric, no added elements.`

const ONLY = process.env.F3_ONLY?.split(',')
const ALL_TARGETS: Array<{ garmentKey: string; color: string; side: 'front' | 'back' }> = [
  { garmentKey: 'remera-crop-mujer', color: 'yellow', side: 'front' },
  { garmentKey: 'musculosa-bali', color: 'white', side: 'front' },
  { garmentKey: 'buzo-hoodie-unisex', color: 'white', side: 'back' },
]
const TARGETS = ONLY ? ALL_TARGETS.filter((t) => ONLY.includes(`${t.garmentKey}-${t.color}-${t.side}`)) : ALL_TARGETS

interface Stats { calls: number }

function extractImage(result: any): Buffer | null {
  const parts = result?.candidates?.[0]?.content?.parts || []
  for (const p of parts) if (p?.inlineData?.data) return Buffer.from(p.inlineData.data, 'base64')
  return null
}

/**
 * Diferencia media por pixel SOLO adentro de la silueta de la prenda
 * (mascara de la foto ORIGINAL, mismo pipeline determinístico que el resto
 * de la Fase 3) — comparar el cuadro entero o un cuadro central fijo mide
 * sobre todo FONDO en prendas angostas (musculosa: tiras finas, mucho aire
 * alrededor), y como le pedimos a Gemini que CAMBIE el fondo, esa comparación
 * daba un diff alto SIEMPRE aunque la prenda no se hubiera tocado (falso
 * rechazo real, medido: 15/16 en musculosa con la prenda pixel-identica).
 */
async function garmentOnlyDiff(origBuf: Buffer, candidateBuf: Buffer): Promise<number> {
  const origMeta = await sharp(origBuf).metadata()
  const W = origMeta.width!, H = origMeta.height!
  const { data: raw, info } = await sharp(origBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const channels = info.channels
  const bg = estimateLocalBackground(raw, W, H, channels)
  const tol = adaptiveTolerance(raw, W, H, channels, bg)
  const mask = floodFillBackground(raw, W, H, channels, bg, tol)
  keepLargestComponent(mask, W, H)

  const { data: candRaw } = await sharp(candidateBuf)
    .resize(W, H)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let sum = 0, n = 0
  for (let i = 0; i < W * H; i++) {
    if (mask[i] !== 255) continue // solo prenda, no fondo
    const o = i * channels
    sum += Math.abs(raw[o] - candRaw[o]) + Math.abs(raw[o + 1] - candRaw[o + 1]) + Math.abs(raw[o + 2] - candRaw[o + 2])
    n += 3
  }
  return n > 0 ? sum / n : -1
}

async function main() {
  const genAI = new GoogleGenAI({ apiKey: API_KEY })
  const stats: Stats = { calls: 0 }
  const results: Array<{ target: string; ok: boolean; attempts: number; diff?: number; outPath?: string }> = []

  for (const t of TARGETS) {
    const mapping = getGarmentMapping(t.garmentKey, t.color, t.side)
    if (!mapping || mapping.garmentPath === 'fallback') {
      console.log(`SKIP ${t.garmentKey} ${t.color} ${t.side}: sin mapping`)
      continue
    }
    const srcPath = path.join(PUBLIC, mapping.garmentPath.replace(/^\//, ''))
    const origBuf = fs.readFileSync(srcPath)
    const label = `${t.garmentKey}-${t.color}-${t.side}`

    let accepted: Buffer | null = null
    let lastDiff = -1
    let attempts = 0
    for (attempts = 1; attempts <= 3; attempts++) {
      console.log(`[${label}] intento ${attempts}/3...`)
      stats.calls++
      let candidate: Buffer | null = null
      try {
        const result = await genAI.models.generateContent({
          model: MODEL,
          contents: [
            { text: PROMPT },
            { inlineData: { data: origBuf.toString('base64'), mimeType: 'image/png' } },
          ] as any,
        })
        candidate = extractImage(result)
      } catch (e: any) {
        console.log(`[${label}] error Gemini: ${e.message}`)
      }
      if (!candidate) { console.log(`[${label}] sin imagen de respuesta`); continue }

      const diff = await garmentOnlyDiff(origBuf, candidate)
      console.log(`[${label}] diff medio por pixel (0-255): ${diff.toFixed(2)}`)
      lastDiff = diff
      if (process.env.F3_SAVE_ATTEMPTS) {
        fs.writeFileSync(path.join(OUT_DIR, `${label}-attempt${attempts}.png`), candidate)
      }
      // Umbral: diff medio de canal 0-255. Cambios cosmeticos de compresion
      // dan <3; un redibujo real (medido en crop amarillo, prenda repintada) da 34+ en
      // este mismo modelo, y un resultado bueno (mascara original chica/ruidosa) midio 8.5 — 10 separa ambos con margen.
      if (diff <= 10) {
        accepted = candidate
        break
      }
      console.log(`[${label}] diff alto — probable redibujo, reintentando`)
    }

    if (!accepted) {
      console.log(`[${label}] FALTANTE — no se logro un fondo plano sin tocar la prenda en 3 intentos`)
      results.push({ target: label, ok: false, attempts })
      continue
    }

    const outPath = path.join(OUT_DIR, `${label}.png`)
    fs.writeFileSync(outPath, accepted)
    results.push({ target: label, ok: true, attempts, diff: lastDiff, outPath })
    console.log(`[${label}] OK — guardado en ${outPath} (diff=${lastDiff.toFixed(2)}, intento ${attempts})`)
  }

  console.log(`\nTotal llamadas a Gemini: ${stats.calls}`)
  console.log(`Modelo: ${MODEL}`)
  console.log(JSON.stringify(results, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
