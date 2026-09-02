#!/usr/bin/env node
/**
 * Mezcla un video crudo (webm/mp4, sin audio o con audio descartable) con
 * clips de narración sincronizados + placas de overlay, y produce un mp4
 * final + un -preview.mp4 mudo para /ayuda (components/ayuda/VideoCard.tsx).
 *
 * Dos modos:
 *
 * 1) Modo compuesto (default) — para los tutoriales grabados con Playwright
 *    (Studio, Catálogo): mezcla N clips de audio en sus offsets exactos
 *    (marketing_assets/sync_{studio,catalog}.json, escritos por los specs
 *    e2e/record-*-video.spec.ts) y superpone la placa de texto de cada clip
 *    (marketing_assets/overlay_*.png), recortando la placa de "capítulo" que
 *    esas imágenes traen pegada arriba (choca con el logo del navbar) y
 *    dejando solo el subtítulo de abajo.
 *
 *      node scripts/mux-marketing-video.mjs \
 *        --video marketing_assets/video_studio_raw/latest.webm \
 *        --sync marketing_assets/sync_studio.json \
 *        --audio-prefix marketing_assets/audio_openai_ \
 *        --overlay-prefix marketing_assets/overlay_ \
 *        --out public/ayuda/studio.mp4
 *
 * 2) Modo remux (--remux-only) — para reempaquetar un mp4 ya mezclado
 *    (ej. marketing_assets/MARKETING_B2C_OPENAI_POLISHED.mp4) con faststart,
 *    cortando la cola muda: video termina 1.0s después de que termina el
 *    audio real.
 *
 *      node scripts/mux-marketing-video.mjs \
 *        --video marketing_assets/MARKETING_B2C_OPENAI_POLISHED.mp4 \
 *        --out public/ayuda/b2c.mp4 \
 *        --remux-only
 *
 * En ambos modos, además del --out se genera <out sin .mp4>-preview.mp4:
 * mudo, primeros ~6s, ~480p, bitrate bajo, faststart (así lo consume
 * VideoCard's `preview` prop en hover).
 *
 * Reglas de duración: video termina 1.0s después de terminar el último clip
 * de audio; el audio se rellena con silencio hasta esa duración exacta
 * (|dur(video) - dur(audio)| <= 0.1s).
 *
 * Sin dependencias extra — usa ffmpeg/ffprobe del sistema (spawnSync).
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) {
        args[key] = true
      } else {
        args[key] = next
        i++
      }
    }
  }
  return args
}

function run(cmd, args, label) {
  const res = spawnSync(cmd, args, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 64 })
  if (res.status !== 0) {
    console.error(`--- ${label} FAILED ---`)
    console.error('cmd:', cmd, args.join(' '))
    console.error(res.stdout)
    console.error(res.stderr)
    throw new Error(`${label} exited ${res.status}`)
  }
  return res
}

function ffprobeDuration(filePath, streamSelector) {
  const args = ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', filePath]
  if (streamSelector) {
    args.unshift('-select_streams', streamSelector)
  }
  const res = run('ffprobe', args, `ffprobe duration ${filePath}`)
  const val = parseFloat(res.stdout.trim())
  return Number.isFinite(val) ? val : null
}

function ffprobeStreamDuration(filePath, kind) {
  // kind: 'v' | 'a' — duración del stream especifico (puede diferir del
  // container si un track termina antes que el otro).
  const res = run(
    'ffprobe',
    ['-v', 'error', '-select_streams', kind === 'v' ? 'v:0' : 'a:0', '-show_entries', 'stream=duration', '-of', 'csv=p=0', filePath],
    `ffprobe stream(${kind}) duration ${filePath}`,
  )
  const val = parseFloat(res.stdout.trim())
  if (Number.isFinite(val)) return val
  // Los .webm crudos que graba Playwright (screencast por pipe de imagenes)
  // no traen Duration en el Segment/Info del EBML — ffprobe devuelve N/A
  // aunque el archivo decodifica perfecto. Fallback: decodificar entero con
  // ffmpeg -f null y leer el ultimo "time=" que reporta por stderr.
  const decode = spawnSync('ffmpeg', ['-i', filePath, '-f', 'null', '-'], { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 64 })
  const matches = [...decode.stderr.matchAll(/time=(\d+):(\d+):(\d+\.\d+)/g)]
  if (matches.length === 0) return null
  const [, hh, mm, ss] = matches[matches.length - 1]
  return parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60 + parseFloat(ss)
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function buildPreviewPath(outPath) {
  const ext = path.extname(outPath)
  return outPath.slice(0, -ext.length) + '-preview' + ext
}

function makePreview(sourcePath, previewPath) {
  ensureDir(previewPath)
  run(
    'ffmpeg',
    [
      '-y',
      '-i', sourcePath,
      '-t', '6',
      '-an',
      '-vf', 'scale=480:-2',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '30',
      '-b:v', '400k',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      previewPath,
    ],
    'ffmpeg preview',
  )
}

// ── Modo remux (B2C) ─────────────────────────────────────────────────────────

function remuxOnly(args) {
  const videoIn = args.video
  const out = args.out
  if (!videoIn || !out) throw new Error('--remux-only requiere --video y --out')

  const videoDur = ffprobeStreamDuration(videoIn, 'v')
  let audioDur = ffprobeStreamDuration(videoIn, 'a')
  if (audioDur == null) audioDur = videoDur
  const explicitTrim = args['trim-after'] ? parseFloat(args['trim-after']) : null
  const audioEnd = explicitTrim ?? audioDur
  const target = Math.round((audioEnd + 1.0) * 100) / 100

  console.log(`[remux] video stream: ${videoDur?.toFixed(2)}s, audio stream: ${audioDur?.toFixed(2)}s -> target ${target}s`)

  ensureDir(out)
  run(
    'ffmpeg',
    [
      '-y',
      '-i', videoIn,
      '-t', String(target),
      '-af', `apad,atrim=0:${target},asetpts=PTS-STARTPTS`,
      '-vf', 'scale=1280:720,format=yuv420p',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-ar', '48000',
      '-b:a', '160k',
      '-movflags', '+faststart',
      out,
    ],
    'ffmpeg remux',
  )

  const previewPath = buildPreviewPath(out)
  makePreview(out, previewPath)

  console.log(`OK -> ${out}`)
  console.log(`OK -> ${previewPath}`)
}

// ── Modo compuesto (Studio / Catálogo) ──────────────────────────────────────

function composite(args) {
  const videoIn = args.video
  const syncPath = args.sync
  const audioPrefix = args['audio-prefix']
  const overlayPrefix = args['overlay-prefix']
  const out = args.out
  if (!videoIn || !syncPath || !audioPrefix || !overlayPrefix || !out) {
    throw new Error('Modo compuesto requiere --video --sync --audio-prefix --overlay-prefix --out')
  }

  const syncRaw = JSON.parse(fs.readFileSync(syncPath, 'utf-8'))
  // Formato nuevo: {events, cuts, end}. Compat con el formato viejo (array
  // suelto de {n,at}) por si queda algún sync.json de una corrida anterior.
  const events = Array.isArray(syncRaw) ? syncRaw : syncRaw.events
  const rawCuts = Array.isArray(syncRaw) ? [] : (syncRaw.cuts ?? [])
  const rawEnd = Array.isArray(syncRaw) ? null : (syncRaw.end ?? null)
  if (!Array.isArray(events) || events.length === 0) throw new Error(`sync vacío/invalido: ${syncPath}`)
  events.sort((a, b) => a.at - b.at)
  const cuts = [...rawCuts].filter(c => c.to > c.from).sort((a, b) => a.from - b.from)

  const clips = events.map(ev => {
    const audioFile = `${audioPrefix}${ev.n}.mp3`
    const overlayFile = `${overlayPrefix}${ev.n}.png`
    if (!fs.existsSync(audioFile)) throw new Error(`falta audio: ${audioFile}`)
    if (!fs.existsSync(overlayFile)) throw new Error(`falta overlay: ${overlayFile}`)
    const dur = ffprobeDuration(audioFile)
    if (dur == null) throw new Error(`no se pudo leer duración de ${audioFile}`)
    return { n: ev.n, atOriginal: ev.at, audioFile, overlayFile, dur }
  })

  // ── Recortar el tramo inicial mudo/skeleton ──
  // Los specs de grabación esperan a que aparezca contenido real (sin
  // skeleton) ANTES de disparar el primer marker — así que el tiempo que
  // tardó esa carga queda reflejado en clips[0].atOriginal. Lo recortamos
  // del arranque (leadIn = primer marker - 0.5s de colchón).
  const leadInBuffer = args['leadin-buffer'] ? parseFloat(args['leadin-buffer']) : 0.5
  const leadIn = Math.max(0, Math.round((clips[0].atOriginal - leadInBuffer) * 100) / 100)

  // ── shiftedTime: pasa un timestamp del reloj ORIGINAL de grabación (el que
  // usan sync.mark()/sync.cut()/sync.end()) al reloj del video FINAL, después
  // de sacar leadIn y cada tramo de `cuts` (esperas muertas sin narración,
  // ej. "Generando mockup..." sin audio encima — ver sync.cut() en
  // e2e/fixtures/video-recording.ts). `cuts` viene ordenado por `from` y sin
  // superponerse (así los emite makeAudioSync). ──
  function shiftedTime(t) {
    let removed = leadIn
    for (const cut of cuts) {
      if (cut.to <= t) removed += cut.to - cut.from
      else if (cut.from < t) { removed += t - cut.from; break }
      else break
    }
    return Number((t - removed).toFixed(3))
  }

  for (const c of clips) c.at = shiftedTime(c.atOriginal)
  const endShifted = rawEnd != null ? shiftedTime(rawEnd) : null

  const lastClip = clips[clips.length - 1]
  const lastAudioEnd = lastClip.at + lastClip.dur
  const target = Math.round(Math.max(lastAudioEnd + 1.0, endShifted ?? 0) * 100) / 100
  const cutsTotal = cuts.reduce((s, c) => s + (c.to - c.from), 0)

  console.log(
    `[composite] ${clips.length} clips, leadIn ${leadIn.toFixed(2)}s, ${cuts.length} corte(s) (${cutsTotal.toFixed(2)}s), ` +
    `último audio termina en ${lastAudioEnd.toFixed(2)}s${endShifted != null ? `, end marker en ${endShifted.toFixed(2)}s` : ''} -> target ${target}s`,
  )

  // ── Segmentos a conservar del video ORIGINAL (sin cortar todavía): arranca
  // en leadIn, salta cada [cut.from, cut.to), sigue hasta el punto que
  // corresponde al final del video ya armado. Cada segmento se recorta con
  // el filtro `trim` (no -ss de input — ver comentario de arriba sobre por
  // qué) y se concatenan en orden. Si el segmento final se pide más largo
  // que el metraje real disponible (raw webm cortado antes de tiempo — visto
  // pasar en algunas corridas), ffmpeg entrega los frames que haya; el tpad
  // generoso de abajo + el -t target final del comando cubren cualquier
  // faltante clonando el último frame real — que es justo lo que se pidió:
  // terminar en un frame estático de la pantalla final en vez de fallar. ──
  const originalContentEnd = target + leadIn + cutsTotal
  const segments = []
  let cursor = leadIn
  for (const cut of cuts) {
    if (cut.from > cursor) segments.push([cursor, cut.from])
    cursor = Math.max(cursor, cut.to)
  }
  segments.push([cursor, originalContentEnd])

  // ── Construir filter_complex ──
  const N = clips.length
  // inputs: 0=video, 1..N=audio, N+1..2N=overlay images (mismo orden que clips)
  const inputArgs = ['-i', videoIn]
  for (const c of clips) inputArgs.push('-i', c.audioFile)
  for (const c of clips) inputArgs.push('-loop', '1', '-i', c.overlayFile)

  const filters = []

  // Video: cada segmento conservado se recorta y resetea su PTS, se
  // concatenan, se rellena con un margen generoso (clona el último frame)
  // por si el metraje real se quedó corto, y recién ahí se escala/formatea.
  // El -t target del comando ffmpeg de más abajo hace el corte final exacto
  // — cubre tanto sobrante como faltante sin tener que adivinar la duración
  // real del stream concatenado de antemano.
  segments.forEach(([s, e], idx) => {
    filters.push(`[0:v]trim=start=${s}:end=${e},setpts=PTS-STARTPTS[seg${idx}]`)
  })
  if (segments.length > 1) {
    const segLabels = segments.map((_, idx) => `[seg${idx}]`).join('')
    filters.push(`${segLabels}concat=n=${segments.length}:v=1:a=0[vraw]`)
  } else {
    filters.push(`[seg0]copy[vraw]`)
  }
  filters.push(`[vraw]tpad=stop_mode=clone:stop_duration=20,scale=1280:720,format=yuv420p[vbase0]`)

  let prevLabel = 'vbase0'
  clips.forEach((c, idx) => {
    const overlayInputIdx = 1 + N + idx
    const cropLabel = `ov${idx}`
    const nextLabel = `vbase${idx + 1}`
    const start = c.at
    const end = c.at + c.dur
    filters.push(`[${overlayInputIdx}:v]crop=1280:580:0:140[${cropLabel}]`)
    filters.push(`[${prevLabel}][${cropLabel}]overlay=x=0:y=140:enable='between(t,${start},${end})'[${nextLabel}]`)
    prevLabel = nextLabel
  })
  const vOutLabel = prevLabel

  // Audio: cada clip retrasado a su offset (adelay en ms), mezclados sin
  // atenuar volumen (normalize=0 — los clips no se superponen), luego
  // padeado/recortado a target exacto.
  clips.forEach((c, idx) => {
    const audioInputIdx = 1 + idx
    const ms = Math.round(c.at * 1000)
    filters.push(`[${audioInputIdx}:a]adelay=${ms}|${ms}[a${idx}]`)
  })
  const amixInputs = clips.map((_, idx) => `[a${idx}]`).join('')
  filters.push(`${amixInputs}amix=inputs=${N}:duration=longest:dropout_transition=0:normalize=0[amixed]`)
  filters.push(`[amixed]apad,atrim=0:${target},asetpts=PTS-STARTPTS[aout]`)

  const filterComplex = filters.join(';')

  ensureDir(out)
  run(
    'ffmpeg',
    [
      '-y',
      ...inputArgs,
      '-filter_complex', filterComplex,
      '-map', `[${vOutLabel}]`,
      '-map', '[aout]',
      '-t', String(target),
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-ar', '48000',
      '-b:a', '160k',
      '-movflags', '+faststart',
      out,
    ],
    'ffmpeg composite',
  )

  const previewPath = buildPreviewPath(out)
  makePreview(out, previewPath)

  console.log(`OK -> ${out}`)
  console.log(`OK -> ${previewPath}`)
}

// ── Main ─────────────────────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2))
if (args['remux-only']) {
  remuxOnly(args)
} else {
  composite(args)
}
