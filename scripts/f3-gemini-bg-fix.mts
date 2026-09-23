/**
 * Fase 3 pieza A — arreglo puntual AUTORIZADO con Gemini para las bases que
 * no salieron limpias sin IA. Dos modos por base (ver TARGETS):
 *
 *  - fondo (removeBadge=false): Gemini SOLO reemplaza el fondo por #d9d9d9
 *    plano — nunca toca la prenda. Diff se mide en TODA la mascara de la
 *    prenda original.
 *  - fondo + badge (removeBadge=true): ademas le pedimos que borre el logo
 *    circular Novamente de la esquina inferior derecha. El diff de
 *    verificacion EXCLUYE un radio alrededor de esa esquina (ahi
 *    ESPERAMOS que cambie) para no rechazar un resultado bueno solo porque
 *    el logo desaparecio.
 *
 * Despues de cada intento se verifica que la prenda no cambio (diff medio
 * por pixel dentro de la mascara de la prenda, excluyendo la zona del badge
 * si corresponde) y recien ahi se re-segmenta DETERMINÍSTICAMENTE sobre el
 * resultado (mismo pipeline de scripts/f3-build-std-bases.mts). Ademas se
 * mira cada resultado aceptado con Read antes de darlo por bueno. Máx 3
 * intentos por base.
 */
import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { getGarmentMapping } from '../lib/garment-mappings'
import { estimateLocalBackground, adaptiveTolerance, floodFillBackground, keepLargestComponent, maskBbox } from './f3-build-std-bases.mts'

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

const PROMPT_BG_ONLY = `Replace only the background with a flat solid #d9d9d9 studio background; keep the garment pixel-identical, same position, same shadows, no changes to fabric, no added elements.`

const PROMPT_BG_AND_BADGE = `Replace only the background with a flat solid #d9d9d9 studio background, and also remove the small circular logo badge in the bottom-right corner of the image (a round stamp/seal graphic sitting on the background near the garment's edge) — fill that spot with the same flat #d9d9d9 background. Keep the garment itself pixel-identical: same position, same shadows, same fabric, no changes to the garment, no added elements.`

// Radio (fraccion del lado menor) alrededor de la esquina del badge que se
// EXCLUYE del diff de verificacion cuando removeBadge=true — mismo centro
// que patchBadgeZone en f3-build-std-bases.mts, con margen extra porque acá
// SI esperamos que cambie (ahi es donde Gemini debe borrar el logo).
const BADGE_EXCLUDE_CENTER = { fx: 0.944, fy: 0.944 }
const BADGE_EXCLUDE_RADIUS_FRAC = 0.07

const ONLY = process.env.F3_ONLY?.split(',')
const ALL_TARGETS: Array<{ garmentKey: string; color: string; side: 'front' | 'back'; removeBadge?: boolean }> = [
  { garmentKey: 'remera-crop-mujer', color: 'yellow', side: 'front' },
  { garmentKey: 'musculosa-bali', color: 'white', side: 'front' },
  { garmentKey: 'buzo-hoodie-unisex', color: 'white', side: 'back' },
  { garmentKey: 'buzo-cuello-redondo', color: 'white', side: 'front' },
  { garmentKey: 'buzo-hoodie-unisex', color: 'black', side: 'front', removeBadge: true },
  { garmentKey: 'buzo-hoodie-unisex', color: 'white', side: 'front', removeBadge: true },
  { garmentKey: 'buzo-hoodie-unisex', color: 'stone-wash', side: 'front', removeBadge: true },
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
async function garmentOnlyDiff(origBuf: Buffer, candidateBuf: Buffer, excludeBadgeZone: boolean): Promise<number> {
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

  const cx = W * BADGE_EXCLUDE_CENTER.fx, cy = H * BADGE_EXCLUDE_CENTER.fy
  const r2 = (Math.min(W, H) * BADGE_EXCLUDE_RADIUS_FRAC) ** 2

  let sum = 0, n = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      if (mask[i] !== 255) continue // solo prenda, no fondo
      if (excludeBadgeZone) {
        const dx = x - cx, dy = y - cy
        if (dx * dx + dy * dy <= r2) continue // esperamos que cambie ahi
      }
      const o = i * channels
      sum += Math.abs(raw[o] - candRaw[o]) + Math.abs(raw[o + 1] - candRaw[o + 1]) + Math.abs(raw[o + 2] - candRaw[o + 2])
      n += 3
    }
  }
  return n > 0 ? sum / n : -1
}

/**
 * Silueta completa: re-segmenta el CANDIDATO con su propia estimacion de
 * fondo/tolerancia (independiente, misma pipeline determinística) y compara
 * el ancho/alto relativo del bbox contra el de la foto ORIGINAL. Detecta el
 * caso real visto (hoodie blanco frente): el diff pixel-a-pixel daba bajo
 * (2.44) porque solo mide DENTRO de la mascara original, pero Gemini había
 * dejado la manga derecha tan parecida al fondo que la segmentación
 * determinística posterior la perdía entera — la prenda quedaba con una
 * sola manga. Si el candidato re-segmenta a menos del 85% del ancho/alto
 * relativo original, se rechaza.
 */
async function silhouetteMatches(origBuf: Buffer, candidateBuf: Buffer): Promise<{ ok: boolean; info: string }> {
  async function bboxFrac(buf: Buffer) {
    const meta = await sharp(buf).metadata()
    const W = meta.width!, H = meta.height!
    const { data: raw, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const ch = info.channels
    const bg = estimateLocalBackground(raw, W, H, ch)
    const tol = adaptiveTolerance(raw, W, H, ch, bg)
    const mask = floodFillBackground(raw, W, H, ch, bg, tol)
    keepLargestComponent(mask, W, H)
    const bbox = maskBbox(mask, W, H)
    return { wFrac: (bbox.x1 - bbox.x0) / W, hFrac: (bbox.y1 - bbox.y0) / H }
  }
  const origFrac = await bboxFrac(origBuf)
  const candFrac = await bboxFrac(candidateBuf)
  const wRatio = candFrac.wFrac / origFrac.wFrac
  const hRatio = candFrac.hFrac / origFrac.hFrac
  const info = `origWFrac=${origFrac.wFrac.toFixed(2)} candWFrac=${candFrac.wFrac.toFixed(2)} wRatio=${wRatio.toFixed(2)} | origHFrac=${origFrac.hFrac.toFixed(2)} candHFrac=${candFrac.hFrac.toFixed(2)} hRatio=${hRatio.toFixed(2)}`
  return { ok: wRatio >= 0.85 && hRatio >= 0.85, info }
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
    const prompt = t.removeBadge ? PROMPT_BG_AND_BADGE : PROMPT_BG_ONLY

    let accepted: Buffer | null = null
    let lastDiff = -1
    const maxAttempts = process.env.F3_MAX_ATTEMPTS ? Number(process.env.F3_MAX_ATTEMPTS) : 3
    let attempts = 0
    for (attempts = 1; attempts <= maxAttempts; attempts++) {
      console.log(`[${label}] intento ${attempts}/${maxAttempts}${t.removeBadge ? ' (fondo + badge)' : ' (solo fondo)'}...`)
      stats.calls++
      let candidate: Buffer | null = null
      try {
        const result = await genAI.models.generateContent({
          model: MODEL,
          contents: [
            { text: prompt },
            { inlineData: { data: origBuf.toString('base64'), mimeType: 'image/png' } },
          ] as any,
        })
        candidate = extractImage(result)
      } catch (e: any) {
        console.log(`[${label}] error Gemini: ${e.message}`)
      }
      if (!candidate) { console.log(`[${label}] sin imagen de respuesta`); continue }

      const diff = await garmentOnlyDiff(origBuf, candidate, !!t.removeBadge)
      console.log(`[${label}] diff medio por pixel (0-255): ${diff.toFixed(2)}`)
      lastDiff = diff
      if (process.env.F3_SAVE_ATTEMPTS) {
        fs.writeFileSync(path.join(OUT_DIR, `${label}-attempt${attempts}.png`), candidate)
      }
      // Umbral: diff medio de canal 0-255. Cambios cosmeticos de compresion
      // dan <3; un redibujo real (medido en crop amarillo, prenda repintada) da 34+ en
      // este mismo modelo, y un resultado bueno (mascara original chica/ruidosa) midio 8.5 — 10 separa ambos con margen.
      if (diff <= 10) {
        const shape = await silhouetteMatches(origBuf, candidate)
        console.log(`[${label}] chequeo de silueta: ${shape.info} -> ${shape.ok ? 'OK' : 'RECHAZADO'}`)
        if (shape.ok) {
          accepted = candidate
          break
        }
        console.log(`[${label}] silueta incompleta (re-segmentación pierde una manga/parte) — reintentando`)
        continue
      }
      console.log(`[${label}] diff alto — probable redibujo, reintentando`)
    }

    if (!accepted) {
      console.log(`[${label}] FALTANTE — no se logro un fondo plano sin tocar la prenda en los intentos permitidos`)
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
