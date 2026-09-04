#!/usr/bin/env node
/**
 * Genera las placas PNG de subtítulo para los 5 videos nuevos de /ayuda
 * (share-link, branding, orders, pricing, support-ticket).
 *
 * Por qué PNG y no --captions (drawtext) de scripts/mux-marketing-video.mjs:
 * el ffmpeg de Homebrew instalado en esta máquina (8.1, formula estándar) NO
 * tiene libfreetype/libfontconfig compilado (`ffmpeg -filters | grep drawtext`
 * no devuelve nada) — ver e2e/README-videos.md sección 6.2. Este script
 * genera el mismo resultado visual (subtítulo blanco sobre caja oscura
 * redondeada, tercio inferior del frame) pre-renderizado con sharp/librsvg
 * (ya en node_modules, sí trae freetype+fontconfig+pango) para consumir con
 * `--overlay-prefix ... --overlay-no-crop` en vez de `--captions`.
 *
 * A diferencia de los overlay_*.png viejos de studio/catalog (1280x720 con
 * una placa de "capítulo" pegada arriba, que mux-marketing-video.mjs recorta
 * con --overlay-prefix default), estas placas son 1280x720 TRANSPARENTES con
 * SOLO el subtítulo abajo — por eso el mux de estos 5 videos debe pasar
 * --overlay-no-crop (si no, el crop igual da el mismo resultado porque no hay
 * nada en la franja recortada, pero --overlay-no-crop es más explícito y más
 * barato).
 *
 * Uso:
 *   node scripts/render-captions.mjs                    # los 5 videos
 *   node scripts/render-captions.mjs --only share-link,branding
 *
 * Salida: marketing_assets/faq-videos/overlay_<key>_<n>.png
 */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const FAQ_DIR = path.join(ROOT, 'marketing_assets/faq-videos')
const NARRATION_PATH = path.join(FAQ_DIR, 'narration.json')

const WIDTH = 1280
const HEIGHT = 720
const FONT_SIZE = 34
const LINE_HEIGHT = Math.round(FONT_SIZE * 1.32) // ~45px
const BOX_PAD_X = 30
const BOX_PAD_Y = 20
const BOX_MAX_WIDTH = 1000
const BOX_CENTER_Y = 640 // "tercio inferior, alrededor de y≈640"
const BOX_RADIUS = 14

// Ancho promedio de un carácter en Helvetica/Arial ~34px, mezcla mayúsculas/
// minúsculas/espacios — factor conservador (más ancho que angosto) para que
// el wrap corte ANTES de desbordar el cuadro en vez de después.
const AVG_CHAR_WIDTH = FONT_SIZE * 0.56

function xmlEscape(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function estimateWidth(text) {
  return text.length * AVG_CHAR_WIDTH
}

/**
 * Wrap a <= 2 líneas: llena la línea 1 hasta que agregar la próxima palabra
 * se pasaría del ancho útil del cuadro (BOX_MAX_WIDTH - padding), cortando en
 * espacios; todo el resto va entero a la línea 2 (sin volver a cortar) —
 * preferimos una línea 2 más larga a una 3ra línea. Mismo criterio que
 * scripts/mux-marketing-video.mjs::wrapCaptionText, pero medido en píxeles
 * estimados en vez de caracteres fijos (más preciso para nuestro fontSize).
 */
function wrapCaptionText(text) {
  const usableWidth = BOX_MAX_WIDTH - BOX_PAD_X * 2
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const word of words) {
    if (lines.length >= 1) {
      current = current ? `${current} ${word}` : word
      continue
    }
    const candidate = current ? `${current} ${word}` : word
    if (estimateWidth(candidate) > usableWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  lines.push(current)
  return lines
}

function buildSvg(text) {
  const lines = wrapCaptionText(text)
  const textWidth = Math.min(BOX_MAX_WIDTH - BOX_PAD_X * 2, Math.max(...lines.map(estimateWidth)))
  const boxWidth = Math.min(BOX_MAX_WIDTH, Math.ceil(textWidth) + BOX_PAD_X * 2)
  const boxHeight = lines.length * LINE_HEIGHT + BOX_PAD_Y * 2
  const boxX = Math.round((WIDTH - boxWidth) / 2)
  const boxY = Math.round(BOX_CENTER_Y - boxHeight / 2)

  // Cada línea centrada horizontalmente en el cuadro; primer baseline a
  // BOX_PAD_Y + FONT_SIZE*0.82 (aprox ascent) desde el techo del cuadro.
  const firstBaselineY = boxY + BOX_PAD_Y + Math.round(FONT_SIZE * 0.82)
  const textLines = lines
    .map((line, idx) => {
      const y = firstBaselineY + idx * LINE_HEIGHT
      return `<text x="${WIDTH / 2}" y="${y}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${FONT_SIZE}" font-weight="600" fill="#ffffff">${xmlEscape(line)}</text>`
    })
    .join('\n    ')

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${boxX}" y="${boxY}" width="${boxWidth}" height="${boxHeight}" rx="${BOX_RADIUS}" ry="${BOX_RADIUS}" fill="#000000" fill-opacity="0.65"/>
    ${textLines}
  </svg>`
}

async function renderOne(key, n, text, outPath) {
  const svg = buildSvg(text)
  await sharp(Buffer.from(svg), { density: 144 })
    .resize(WIDTH, HEIGHT)
    .png()
    .toFile(outPath)
  console.log(`✓ ${path.relative(ROOT, outPath)}  (${wrapCaptionText(text).length} línea/s)`)
}

async function main() {
  const args = process.argv.slice(2)
  const onlyIdx = args.indexOf('--only')
  const only = onlyIdx >= 0 ? args[onlyIdx + 1]?.split(',').map((s) => s.trim()) : null

  const narration = JSON.parse(fs.readFileSync(NARRATION_PATH, 'utf-8'))
  const keys = only ?? Object.keys(narration)

  for (const key of keys) {
    const video = narration[key]
    if (!video) {
      console.error(`⚠️  key desconocida en narration.json: "${key}" — skip`)
      continue
    }
    for (const clip of video.clips) {
      const outPath = path.join(FAQ_DIR, `overlay_${key}_${clip.n}.png`)
      await renderOne(key, clip.n, clip.text, outPath)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
