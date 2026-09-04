#!/usr/bin/env node
/**
 * Genera los mp3 de narración para los 5 videos nuevos de FAQ
 * (marketing_assets/faq-videos/narration.json) con la API de TTS de OpenAI.
 *
 * - Modelo `gpt-4o-mini-tts` (fallback automático a `tts-1-hd` si el primero
 *   devuelve 400/404 — por si la cuenta no tiene acceso al modelo nuevo).
 * - Una sola voz para los 5 videos (ver `voice` en narration.json — elegida
 *   comparando 3 candidatas en un mismo texto: "coral" quedó más cerca en
 *   loudness nativo de marketing_assets/audio_openai_1.mp3 sin necesidad de
 *   normalizar tanto, y OpenAI la describe como cálida/brillante — encaja
 *   con "Español rioplatense, voz cálida y clara, ritmo pausado").
 * - `instructions`: "Español rioplatense, voz cálida y clara, ritmo pausado."
 * - Salida: marketing_assets/faq-videos/audio_<key>_<n>.mp3 — mono, 24kHz
 *   (mismo formato que los clips viejos, audio_openai_*.mp3), loudness
 *   normalizada en dos pasadas de ffmpeg `loudnorm` al mismo nivel que
 *   audio_openai_1.mp3 (medido una vez: I=-29.5 LUFS, TP=-11.6 dBTP,
 *   LRA=1.8 LU — constantes TARGET_* de abajo).
 * - Idempotente: si el mp3 de un clip ya existe, lo salta — pasar --force
 *   para regenerar todo.
 *
 * Uso:
 *   OPENAI_API_KEY=... npx tsx scripts/tts-narration.mjs
 *   npx tsx scripts/tts-narration.mjs --force
 *   npx tsx scripts/tts-narration.mjs --only share-link,branding
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
loadEnv({ path: path.join(ROOT, '.env.local') })

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('Falta OPENAI_API_KEY en .env.local')
  process.exit(1)
}

const NARRATION_PATH = path.join(ROOT, 'marketing_assets/faq-videos/narration.json')
const OUT_DIR = path.join(ROOT, 'marketing_assets/faq-videos')
const INSTRUCTIONS = 'Español rioplatense, voz cálida y clara, ritmo pausado.'
const PRIMARY_MODEL = 'gpt-4o-mini-tts'
const FALLBACK_MODEL = 'tts-1-hd'

// Integrated loudness medida una vez contra marketing_assets/audio_openai_1.mp3
// (ver comentario arriba) con `ffmpeg -af loudnorm=print_format=json -f null -`:
// input_i=-29.51 LUFS — ese es el valor que igualamos acá (TARGET_I). El
// true-peak medido de ese mismo clip (-11.63 dBTP) NO es un valor válido
// para el parámetro `TP` de loudnorm (rango permitido: [-9, 0] — loudnorm
// define el techo de pico permitido, no reproduce el pico de la referencia)
// así que usamos -2.0 dBTP, un techo estándar y seguro que no achica el
// rango dinámico de la voz.
const TARGET_I = -29.5
const TARGET_TP = -2.0
const TARGET_LRA = 1.8

function parseArgs(argv) {
  const args = { force: false, only: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--force') args.force = true
    else if (argv[i] === '--only') { args.only = (argv[i + 1] || '').split(',').filter(Boolean); i++ }
  }
  return args
}

function run(cmd, cmdArgs, label) {
  const res = spawnSync(cmd, cmdArgs, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 64 })
  if (res.status !== 0) {
    console.error(`--- ${label} FAILED ---`)
    console.error(res.stdout)
    console.error(res.stderr)
    throw new Error(`${label} exited ${res.status}`)
  }
  return res
}

async function ttsRequest(model, voice, text) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      instructions: INSTRUCTIONS,
      response_format: 'mp3',
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const err = new Error(`TTS ${model}/${voice} failed ${res.status}: ${body}`)
    err.status = res.status
    throw err
  }
  return Buffer.from(await res.arrayBuffer())
}

async function synthesize(voice, text) {
  try {
    return await ttsRequest(PRIMARY_MODEL, voice, text)
  } catch (e) {
    if (e.status === 400 || e.status === 404) {
      console.log(`  [fallback] ${PRIMARY_MODEL} no disponible (${e.status}), probando ${FALLBACK_MODEL}`)
      return await ttsRequest(FALLBACK_MODEL, voice, text)
    }
    throw e
  }
}

/** Normaliza loudness (2 pasadas) y fuerza mono/24kHz — mismo formato que audio_openai_*.mp3. */
function normalizeAndConvert(rawPath, outPath) {
  // Pasada 1: medir.
  const measure = spawnSync('ffmpeg', [
    '-i', rawPath,
    '-af', `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json`,
    '-f', 'null', '-',
  ], { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 64 })
  const jsonMatch = measure.stderr.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No se pudo medir loudness de ${rawPath}:\n${measure.stderr}`)
  const stats = JSON.parse(jsonMatch[0])

  // Pasada 2: aplicar con los valores medidos (loudnorm linear, más preciso
  // que una sola pasada) + forzar mono 24kHz.
  run('ffmpeg', [
    '-y', '-i', rawPath,
    '-af',
    `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:` +
      `measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:` +
      `measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:` +
      `offset=${stats.target_offset}:linear=true:print_format=summary`,
    '-ac', '1',
    '-ar', '24000',
    '-codec:a', 'libmp3lame',
    '-q:a', '4',
    outPath,
  ], `ffmpeg loudnorm ${path.basename(outPath)}`)
}

async function main() {
  const { force, only } = parseArgs(process.argv.slice(2))
  const narration = JSON.parse(fs.readFileSync(NARRATION_PATH, 'utf-8'))
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-narration-'))
  let generated = 0
  let skipped = 0

  try {
    for (const [key, entry] of Object.entries(narration)) {
      if (only && !only.includes(key)) continue
      const voice = entry.voice
      for (const clip of entry.clips) {
        const outPath = path.join(OUT_DIR, `audio_${key}_${clip.n}.mp3`)
        if (fs.existsSync(outPath) && !force) {
          console.log(`= skip (ya existe): ${path.basename(outPath)}`)
          skipped++
          continue
        }
        console.log(`… generando ${path.basename(outPath)} (voice=${voice}): "${clip.text}"`)
        const buf = await synthesize(voice, clip.text)
        const rawPath = path.join(tmpDir, `raw_${key}_${clip.n}.mp3`)
        fs.writeFileSync(rawPath, buf)
        normalizeAndConvert(rawPath, outPath)
        const dur = spawnSync('ffprobe', [
          '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', outPath,
        ], { encoding: 'utf-8' }).stdout.trim()
        console.log(`✓ ${path.basename(outPath)} (${parseFloat(dur).toFixed(2)}s)`)
        generated++
      }
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  console.log(`\nListo: ${generated} generados, ${skipped} saltados (ya existían).`)
}

main().catch((err) => {
  console.error('tts-narration falló:', err)
  process.exit(1)
})
