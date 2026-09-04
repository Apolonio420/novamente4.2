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
 *    e2e/record-*-video.spec.ts) y quema el subtítulo de cada clip, con
 *    UNO de estos dos flags (mutuamente excluyentes):
 *
 *    a) --overlay-prefix: superpone la placa de texto pre-renderizada de
 *       cada clip (marketing_assets/overlay_*.png), recortando la placa de
 *       "capítulo" que esas imágenes traen pegada arriba (choca con el logo
 *       del navbar) y dejando solo el subtítulo de abajo.
 *
 *      node scripts/mux-marketing-video.mjs \
 *        --video marketing_assets/video_studio_raw/latest.webm \
 *        --sync marketing_assets/sync_studio.json \
 *        --audio-prefix marketing_assets/audio_openai_ \
 *        --overlay-prefix marketing_assets/overlay_ \
 *        --out public/ayuda/studio.mp4
 *
 *    b) --captions <path.json>: quema el subtítulo de cada clip directo con
 *       ffmpeg drawtext (sin PNG pre-renderizado). El JSON es un array plano
 *       de `{"n": <mismo n que los events del sync.json>, "text": "..."}`,
 *       ej. `[{"n":1,"text":"Bienvenidos a..."}, {"n":2,"text":"..."}]` — se
 *       arma a mano o mapeando marketing_assets/narration.json[key].clips.
 *
 *      node scripts/mux-marketing-video.mjs \
 *        --video marketing_assets/video_catalog_raw/latest.webm \
 *        --sync marketing_assets/sync_catalog.json \
 *        --audio-prefix marketing_assets/audio_openai_catalog_ \
 *        --captions marketing_assets/captions_catalog.json \
 *        --out public/ayuda/catalog.mp4
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
import os from 'node:os'
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

function run(cmd, args, label, timeoutMs) {
  const opts = { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 64 }
  if (timeoutMs) {
    opts.timeout = timeoutMs
    opts.killSignal = 'SIGKILL'
  }
  const res = spawnSync(cmd, args, opts)
  // spawnSync marca timeout con res.error.code === 'ETIMEDOUT' (y status
  // queda null) — visto pasar de verdad: un filtergraph colgado (trim/tpad
  // sobre un .webm crudo con problemas) quedó 17 minutos al 100% CPU sin
  // avanzar hasta que alguien lo mató a mano. Con timeoutMs seteado, esto
  // ahora falla solo con un error claro en vez de colgar la terminal
  // indefinidamente.
  if (timeoutMs && res.error && res.error.code === 'ETIMEDOUT') {
    throw new Error(`${label}: excedió el timeout de ${(timeoutMs / 1000).toFixed(0)}s (posible filtergraph colgado) — matado. Revisar el .webm crudo antes de reintentar (ver validateSyncAgainstRaw).`)
  }
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

/**
 * Como ffprobeStreamDuration('v'), pero además detecta un contenedor
 * truncado/corrupto — visto pasar en una corrida real: el .webm crudo del
 * screencast de Playwright quedó cortado a mitad de escritura después de una
 * grabación MUY larga en tiempo real bajo carga pesada de la máquina (el
 * sync.json tenía un `end` de 103.7s pero el archivo real solo decodifica
 * ~92s y ffmpeg reporta "File ended prematurely" en el intento de
 * decodificarlo entero). Un filtergraph (trim/tpad/concat/amix) armado sobre
 * un archivo así puede colgarse indefinidamente (17 min al 100% CPU antes de
 * matarlo a mano, en vez de fallar con un error claro) — mejor detectarlo
 * ANTES de arrancar ffmpeg y abortar con un mensaje explícito.
 */
function probeRawVideoHealth(filePath) {
  const res = run(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=duration', '-of', 'csv=p=0', filePath],
    `ffprobe stream(v) duration ${filePath}`,
  )
  const direct = parseFloat(res.stdout.trim())
  if (Number.isFinite(direct)) return { duration: direct, corrupted: false }
  const decode = spawnSync('ffmpeg', ['-i', filePath, '-f', 'null', '-'], { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 64 })
  const corrupted = /file ended prematurely|invalid data found when processing input/i.test(decode.stderr)
  const matches = [...decode.stderr.matchAll(/time=(\d+):(\d+):(\d+\.\d+)/g)]
  if (matches.length === 0) return { duration: null, corrupted }
  const [, hh, mm, ss] = matches[matches.length - 1]
  const duration = parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60 + parseFloat(ss)
  return { duration, corrupted }
}

/**
 * Falla rápido (en vez de dejar que ffmpeg arme un filtergraph a ciegas y
 * potencialmente se cuelgue) si el sync.json no es consistente con la
 * duración REAL del video crudo: cualquier marker o corte más allá de lo que
 * el archivo decodifica, cortes superpuestos/desordenados, o un contenedor
 * detectado como truncado/corrupto.
 */
function validateSyncAgainstRaw(videoIn, events, cuts, rawEnd) {
  const health = probeRawVideoHealth(videoIn)
  if (health.duration == null) {
    throw new Error(`No se pudo determinar la duración real de ${videoIn} (ni ffprobe ni una decodificación completa dieron un valor) — abortando en vez de mux-ear a ciegas.`)
  }
  if (health.corrupted) {
    // Solo AVISO, no aborta: confirmado en la práctica que "File ended
    // prematurely" aparece en CASI TODOS los .webm crudos de este pipeline
    // (screencast de Playwright por pipe de imágenes a ffmpeg) — incluidos
    // crudos que decodifican y mux-ean perfecto. No es un buen predictor de
    // "esto va a colgar el filtergraph" por sí solo (el incidente real que
    // sí colgó 17 min tenía este mismo mensaje, pero también lo tuvo la
    // grabación sana inmediatamente siguiente). La protección real contra un
    // filtergraph colgado es el timeout de `run()` en la llamada principal
    // de ffmpeg más abajo — esto es solo una señal para mirar el video con
    // más atención si algo más sale raro.
    console.warn(`[composite] AVISO: ${videoIn} decodifica con "File ended prematurely" (duración real ~${health.duration.toFixed(2)}s) — normal en crudos de Playwright, no bloquea el mux.`)
  }
  for (const ev of events) {
    if (ev.at >= health.duration) {
      throw new Error(`sync.json: el marker n=${ev.n} está en ${ev.at}s, pero ${videoIn} solo tiene ${health.duration.toFixed(2)}s reales — volvé a grabar en vez de mux-ear.`)
    }
  }
  for (const cut of cuts) {
    if (cut.from >= health.duration || cut.to > health.duration) {
      throw new Error(`sync.json: el corte [${cut.from}, ${cut.to}] excede la duración real del crudo (${health.duration.toFixed(2)}s) — volvé a grabar en vez de mux-ear.`)
    }
  }
  for (let i = 1; i < cuts.length; i++) {
    if (cuts[i].from < cuts[i - 1].to) {
      throw new Error(`sync.json: los cortes se superponen o no están ordenados ([${cuts[i - 1].from},${cuts[i - 1].to}] vs [${cuts[i].from},${cuts[i].to}]) — revisar el sync.json a mano.`)
    }
  }
  if (rawEnd != null && rawEnd > health.duration + 5) {
    console.warn(
      `[composite] AVISO: el end marker del sync.json (${rawEnd}s) supera por más de 5s la duración real decodificada del crudo (${health.duration.toFixed(2)}s) — ` +
      `la grabación pudo haber quedado inestable bajo carga pesada (no es fatal por sí solo, el end marker solo se usa como techo de metraje, pero es señal de alerta).`,
    )
  }
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
    5 * 60_000,
  )

  const previewPath = buildPreviewPath(out)
  makePreview(out, previewPath)

  console.log(`OK -> ${out}`)
  console.log(`OK -> ${previewPath}`)
}

// ── Subtítulos quemados con drawtext (--captions, alternativa a --overlay-prefix) ──

function findFontFile() {
  // Sin fontconfig: pasamos fontfile= explícito a drawtext. Helvetica.ttc es
  // el estándar en toda instalación de macOS; los otros dos son fallbacks
  // por si corre en una Mac rara (managed profile, etc.) sin esa fuente.
  const candidates = [
    '/System/Library/Fonts/Helvetica.ttc',
    '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
    '/Library/Fonts/Arial.ttf',
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  throw new Error(`No se encontró ninguna fuente de sistema para drawtext. Probé: ${candidates.join(', ')}`)
}

function ffmpegQuoteFilterValue(value) {
  // Envolvemos el valor en comillas simples (protege ':' del parser del
  // filtergraph — necesario porque textfile=/fontfile= son paths de
  // filesystem) y solo escapamos una comilla simple literal si apareciera
  // (cierre+escape+reapertura). NO escapamos ':' con backslash porque eso
  // rompería el path real una vez dentro de las comillas.
  return value.replace(/'/g, `'\\''`)
}

function wrapCaptionText(text, maxCharsPerLine = 40) {
  // drawtext no hace word-wrap solo — lo hacemos acá. Regla: llenamos la
  // línea 1 en base a límite de caracteres cortando en espacios; todo lo que
  // sobra va entero a la línea 2 (sin volver a cortar), así el resultado
  // nunca supera 2 líneas — preferimos una línea 2 más larga que una 3ra
  // línea que se saldría del cuadro o un texto truncado que pierda sentido.
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const word of words) {
    if (lines.length >= 1) {
      current = current ? `${current} ${word}` : word
      continue
    }
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  lines.push(current)
  return lines
}

function loadCaptions(captionsPath) {
  // Formato: array plano de {n, text} — n es el mismo índice que usan los
  // events del sync JSON (events[].n / clip.n). Se arma a mano o mapeando
  // marketing_assets/narration.json["<key>"].clips (que ya trae {n, text}).
  const raw = JSON.parse(fs.readFileSync(captionsPath, 'utf-8'))
  if (!Array.isArray(raw)) {
    throw new Error(`--captions debe ser un array de {n, text}: ${captionsPath}`)
  }
  const map = new Map()
  for (const item of raw) {
    if (typeof item.n !== 'number' || typeof item.text !== 'string') {
      throw new Error(`--captions: entrada inválida (se espera {n:number, text:string}): ${JSON.stringify(item)}`)
    }
    map.set(item.n, item.text)
  }
  return map
}

// ── Modo compuesto (Studio / Catálogo) ──────────────────────────────────────

function composite(args) {
  const videoIn = args.video
  const syncPath = args.sync
  const audioPrefix = args['audio-prefix']
  const overlayPrefix = args['overlay-prefix']
  const captionsPath = args['captions']
  const out = args.out
  if (overlayPrefix && captionsPath) {
    throw new Error('--overlay-prefix y --captions son mutuamente excluyentes — elegí uno de los dos modos de subtítulo')
  }
  if (!videoIn || !syncPath || !audioPrefix || !out || (!overlayPrefix && !captionsPath)) {
    throw new Error('Modo compuesto requiere --video --sync --audio-prefix --out, y --overlay-prefix o --captions')
  }
  const captionsMap = captionsPath ? loadCaptions(captionsPath) : null

  const syncRaw = JSON.parse(fs.readFileSync(syncPath, 'utf-8'))
  // Formato nuevo: {events, cuts, end}. Compat con el formato viejo (array
  // suelto de {n,at}) por si queda algún sync.json de una corrida anterior.
  const events = Array.isArray(syncRaw) ? syncRaw : syncRaw.events
  const rawCuts = Array.isArray(syncRaw) ? [] : (syncRaw.cuts ?? [])
  const rawEnd = Array.isArray(syncRaw) ? null : (syncRaw.end ?? null)
  if (!Array.isArray(events) || events.length === 0) throw new Error(`sync vacío/invalido: ${syncPath}`)
  events.sort((a, b) => a.at - b.at)
  const cuts = [...rawCuts].filter(c => c.to > c.from).sort((a, b) => a.from - b.from)

  // Falla rápido si el sync.json no cierra con la duración REAL del crudo
  // (marker/corte más allá de lo decodificable, cortes superpuestos, o
  // contenedor truncado) — ver comentario de validateSyncAgainstRaw arriba.
  validateSyncAgainstRaw(videoIn, events, cuts, rawEnd)

  const clips = events.map(ev => {
    const audioFile = `${audioPrefix}${ev.n}.mp3`
    if (!fs.existsSync(audioFile)) throw new Error(`falta audio: ${audioFile}`)
    const dur = ffprobeDuration(audioFile)
    if (dur == null) throw new Error(`no se pudo leer duración de ${audioFile}`)
    const clip = { n: ev.n, atOriginal: ev.at, audioFile, dur }
    if (overlayPrefix) {
      const overlayFile = `${overlayPrefix}${ev.n}.png`
      if (!fs.existsSync(overlayFile)) throw new Error(`falta overlay: ${overlayFile}`)
      clip.overlayFile = overlayFile
    } else if (!captionsMap.has(ev.n)) {
      throw new Error(`--captions: falta texto para el clip n=${ev.n} (${captionsPath})`)
    }
    return clip
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
  // El hold() final de cada spec de grabación (e2e/fixtures/video-recording.ts)
  // existe SOLO para darle tiempo real al encoder de screencast de Playwright
  // de ponerse al día (ver comentario de esa función) — no es contenido que el
  // video final deba conservar. El output SIEMPRE termina 1.5s después del
  // último audio, ignorando el marker de sync.end() para la duración final; el
  // marker solo se usa más abajo como TECHO de cuánto metraje de la fuente
  // original pedimos (protección contra pedir de más si el hold real quedó
  // corto, no para estirar la salida).
  const tailSec = args.tail != null ? Number(args.tail) : 1.5
  if (!Number.isFinite(tailSec) || tailSec < 0) throw new Error(`--tail inválido: ${args.tail}`)
  const target = Math.round((lastAudioEnd + tailSec) * 100) / 100
  const cutsTotal = cuts.reduce((s, c) => s + (c.to - c.from), 0)

  console.log(
    `[composite] ${clips.length} clips, leadIn ${leadIn.toFixed(2)}s, ${cuts.length} corte(s) (${cutsTotal.toFixed(2)}s), ` +
    `último audio termina en ${lastAudioEnd.toFixed(2)}s${endShifted != null ? ` (end marker en ${endShifted.toFixed(2)}s, usado solo como techo de metraje)` : ''} -> target ${target}s`,
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
  const naturalContentEnd = target + leadIn + cutsTotal
  // Techo: si el marker de end() (en clock original) es MÁS CHICO que lo que
  // pediríamos naturalmente, no vayamos a buscar metraje más allá de lo que
  // el spec realmente sostuvo — evita pedirle a ffmpeg frames de un tramo que
  // nunca se grabó a propósito. Si el marker es más grande (caso típico ahora,
  // porque el hold final real dura más que target-lastAudioEnd), no lo usamos
  // para nada: el output ya quedó fijado en target = lastAudioEnd + 1.5s.
  const originalContentEnd =
    endShifted != null ? Math.min(naturalContentEnd, endShifted + leadIn + cutsTotal) : naturalContentEnd
  const segments = []
  let cursor = leadIn
  for (const cut of cuts) {
    if (cut.from > cursor) segments.push([cursor, cut.from])
    cursor = Math.max(cursor, cut.to)
  }
  segments.push([cursor, originalContentEnd])

  // ── Construir filter_complex ──
  const N = clips.length
  // inputs: 0=video, 1..N=audio, y si es modo --overlay-prefix N+1..2N=overlay
  // images (mismo orden que clips). El modo --captions no agrega inputs —
  // drawtext lee el texto de un archivo vía textfile=, no como -i de ffmpeg.
  const inputArgs = ['-i', videoIn]
  for (const c of clips) inputArgs.push('-i', c.audioFile)
  if (overlayPrefix) {
    for (const c of clips) inputArgs.push('-loop', '1', '-i', c.overlayFile)
  }

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
  let captionsTmpDir = null
  if (overlayPrefix) {
    // Las placas viejas (overlay_*.png de studio/catalog/b2c) traen una placa
    // de "capítulo" pegada arriba que choca con el logo del navbar — por eso
    // el modo default recorta esa franja (crop 1280x580 arrancando en y=140,
    // reinsertada en la misma posición) y solo deja pasar el subtítulo de
    // abajo. Los overlays nuevos (scripts/render-captions.mjs) son PNG
    // 1280x720 transparentes con SOLO el subtítulo en el tercio inferior —
    // nada que recortar arriba — así que --overlay-no-crop superpone la
    // imagen completa sin el filtro `crop` intermedio.
    const noCrop = !!args['overlay-no-crop']
    clips.forEach((c, idx) => {
      const overlayInputIdx = 1 + N + idx
      const nextLabel = `vbase${idx + 1}`
      const start = c.at
      const end = c.at + c.dur
      let overlayLabel = `${overlayInputIdx}:v`
      if (!noCrop) {
        const cropLabel = `ov${idx}`
        filters.push(`[${overlayInputIdx}:v]crop=1280:580:0:140[${cropLabel}]`)
        overlayLabel = cropLabel
      }
      const overlayY = noCrop ? 0 : 140
      filters.push(`[${prevLabel}][${overlayLabel}]overlay=x=0:y=${overlayY}:enable='between(t,${start},${end})'[${nextLabel}]`)
      prevLabel = nextLabel
    })
  } else {
    // --captions: un drawtext encadenado por clip, visible solo en su
    // ventana [c.at, c.at+c.dur] — misma lógica de enable que el overlay de
    // PNG de arriba. El texto de cada clip se escribe a un .txt temporal
    // (UTF-8) y se referencia con textfile= en vez de text= inline: evita
    // tener que escapear ':' ',' '\'' etc. a mano en un string con acentos
    // (á é í ó ú ñ ¿ ¡) dentro de la sintaxis de filtergraph de ffmpeg.
    const fontFile = findFontFile()
    const escapedFontFile = ffmpegQuoteFilterValue(fontFile)
    captionsTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mux-captions-'))
    clips.forEach((c, idx) => {
      const nextLabel = `vbase${idx + 1}`
      const start = c.at
      const end = c.at + c.dur
      const lines = wrapCaptionText(captionsMap.get(c.n))
      const txtPath = path.join(captionsTmpDir, `caption_${c.n}.txt`)
      fs.writeFileSync(txtPath, lines.join('\n'), 'utf-8')
      const escapedTxtPath = ffmpegQuoteFilterValue(txtPath)
      // y=h-140 (h=720 -> y=580, tope del texto): con fontsize 36 +
      // line_spacing 6, 2 líneas miden ~92px + boxborderw 14 arriba/abajo
      // -> el box queda ~y=566..686. Cae de lleno en el tercio inferior
      // (480-720), con margen hasta el borde real (720) y lejísimos del
      // navbar (y=0..~90) — mismo rango donde caía el subtítulo de las
      // placas PNG (pegado al borde inferior de su recorte 1280x580@y=140).
      filters.push(
        `[${prevLabel}]drawtext=fontfile='${escapedFontFile}':textfile='${escapedTxtPath}':` +
        `fontcolor=white:fontsize=36:line_spacing=6:` +
        `box=1:boxcolor=black@0.6:boxborderw=14:` +
        `x=(w-text_w)/2:y=h-140:` +
        `enable='between(t,${start},${end})'[${nextLabel}]`,
      )
      prevLabel = nextLabel
    })
  }
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
  try {
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
      5 * 60_000, // timeout duro — ver comentario de run() sobre el incidente real de 17 min colgado
    )
  } finally {
    // Los .txt de subtítulos (--captions) son puramente insumo del comando
    // ffmpeg de arriba — se borran corra bien o falle, no hace falta
    // conservarlos.
    if (captionsTmpDir) fs.rmSync(captionsTmpDir, { recursive: true, force: true })
  }

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
