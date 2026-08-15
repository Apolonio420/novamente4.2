/**
 * Quita el damero de "transparencia falsa" que Gemini pinta como píxeles.
 *
 * POR QUÉ EXISTE (caso real, 15/08/2026): un cliente de un partner pidió en el
 * chat de /crear un león "con fondo transparente". Gemini no puede emitir canal
 * alpha: dibuja el placeholder visual de transparencia (la grilla de cuadraditos
 * grises/blancos) como píxeles opacos. `removeWhiteBackground` no lo salva —
 * su flood-fill solo atraviesa píxeles casi blancos (>=235) y las celdas
 * oscuras del damero miden 206-243, así que el relleno queda encerrado y
 * reporta "skipped". El diseño se guardó con el damero pintado y terminó
 * COMPUESTO EN EL MOCKUP de la remera que el cliente puso en el carrito.
 *
 * Este módulo es el port del fix ya probado en producción de platform
 * (lib/mockup/remove-checkerboard-bg.ts, opción C de la auditoría del 16/07,
 * validado 18/20 logos reales sin dañar ninguno) y del bot
 * (sanitizePaintedCheckerboard). La diferencia clave con removeWhiteBackground
 * es que acá el rango de color del fondo se DETECTA POR IMAGEN muestreando el
 * borde del canvas (percentil 2/98 de los píxeles grises del borde), porque el
 * damero no es constante: celdas de 9-46px, gris oscuro 206-243, gris claro
 * 234-254, y ~3/20 vuelven como blanco plano. Un par de colores hardcodeado
 * falla en unas imágenes y muerde el arte en otras.
 *
 * Propiedad crítica heredada: el flood-fill se siembra SOLO desde el borde de
 * 1px y solo se propaga por píxeles 4-conectados color-fondo. No puede borrar
 * un gris interno del diseño que no esté conectado al borde. Guardrail: si la
 * fracción removida cae fuera de ~2%-97% del canvas, devuelve la imagen
 * intacta (`removed: false`) — nunca peor que hoy.
 */
import sharp from 'sharp'

const HARD_GRAY_TOL = 10 // spread máximo (max-min de canales) para contar como "gris" en el test duro
const SOFT_GRAY_TOL = 22 // spread más laxo para el test suave/antialiasing
const SOFT_MARGIN_LOW = 30 // el rango suave se extiende esto por debajo del hardMin detectado
const SOFT_MARGIN_HIGH = 10 // y esto por encima del hardMax
const SOFT_ALPHA = 90 // alpha parcial del borde antialiased (misma constante que remove-white-bg)
const BORDER_PERCENTILE_LOW = 0.02
const BORDER_PERCENTILE_HIGH = 0.98
const GUARDRAIL_FRAC_LOW = 0.02
const GUARDRAIL_FRAC_HIGH = 0.97

export interface RemoveCheckerboardResult {
  buffer: Buffer
  removed: boolean
  frac: number
  reason?: string
}

interface BackgroundRange {
  ok: boolean
  hardMin?: number
  hardMax?: number
  softMin?: number
  softMax?: number
}

function idx(x: number, y: number, w: number): number {
  return y * w + x
}

// Muestrea el borde literal de 1px (los mismos píxeles desde los que siembra el
// flood-fill) y deriva el rango [hardMin, hardMax] de luminosidad del "gris de
// fondo de ESTA imagen" con percentiles, para que un par de píxeles sueltos del
// arte tocando el borde no revienten el rango.
function detectBackgroundRange(data: Buffer | Uint8Array, w: number, h: number): BackgroundRange {
  const lightnesses: number[] = []
  const sample = (p: number) => {
    const o = p * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    if (Math.max(r, g, b) - Math.min(r, g, b) <= HARD_GRAY_TOL) lightnesses.push((r + g + b) / 3)
  }
  for (let x = 0; x < w; x++) {
    sample(idx(x, 0, w))
    sample(idx(x, h - 1, w))
  }
  for (let y = 0; y < h; y++) {
    sample(idx(0, y, w))
    sample(idx(w - 1, y, w))
  }
  if (!lightnesses.length) return { ok: false }

  lightnesses.sort((a, b) => a - b)
  const pct = (p: number) =>
    lightnesses[Math.max(0, Math.min(lightnesses.length - 1, Math.floor(p * lightnesses.length)))]
  const hardMin = pct(BORDER_PERCENTILE_LOW)
  const hardMax = pct(BORDER_PERCENTILE_HIGH)
  return {
    ok: true,
    hardMin,
    hardMax,
    softMin: Math.max(0, hardMin - SOFT_MARGIN_LOW),
    softMax: Math.min(255, hardMax + SOFT_MARGIN_HIGH),
  }
}

/**
 * Convierte el damero pintado (o el placeholder plano) en alpha real vía
 * flood-fill sembrado desde el borde. Devuelve la imagen intacta si el borde no
 * tiene píxeles grises que muestrear o si el guardrail de fracción no da.
 */
export async function removeCheckerboardBackground(input: Buffer): Promise<RemoveCheckerboardResult> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const n = w * h

  const range = detectBackgroundRange(data, w, h)
  if (!range.ok || range.hardMin === undefined || range.hardMax === undefined || range.softMin === undefined || range.softMax === undefined) {
    return { buffer: input, removed: false, frac: 0, reason: 'sin-gris-en-el-borde' }
  }
  const { hardMin, hardMax, softMin, softMax } = range

  const isHardBg = (p: number) => {
    const o = p * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    if (Math.max(r, g, b) - Math.min(r, g, b) > HARD_GRAY_TOL) return false
    const L = (r + g + b) / 3
    return L >= hardMin && L <= hardMax
  }
  const isSoftBg = (p: number) => {
    const o = p * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    if (Math.max(r, g, b) - Math.min(r, g, b) > SOFT_GRAY_TOL) return false
    const L = (r + g + b) / 3
    return L >= softMin && L <= softMax
  }

  const visited = new Uint8Array(n)
  const queue: number[] = []
  for (let x = 0; x < w; x++) {
    for (const p of [x, (h - 1) * w + x]) {
      if (!visited[p] && isHardBg(p)) {
        visited[p] = 1
        queue.push(p)
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (const p of [y * w, y * w + w - 1]) {
      if (!visited[p] && isHardBg(p)) {
        visited[p] = 1
        queue.push(p)
      }
    }
  }

  let removedCount = 0
  while (queue.length) {
    const p = queue.pop() as number
    data[p * 4 + 3] = 0
    removedCount++
    const x = p % w
    const y = (p / w) | 0
    const neighbors = [
      x > 0 ? p - 1 : -1,
      x < w - 1 ? p + 1 : -1,
      y > 0 ? p - w : -1,
      y < h - 1 ? p + w : -1,
    ]
    for (const q of neighbors) {
      if (q < 0 || visited[q]) continue
      if (isHardBg(q)) {
        visited[q] = 1
        queue.push(q)
      } else if (isSoftBg(q)) {
        visited[q] = 1
        data[q * 4 + 3] = Math.min(data[q * 4 + 3], SOFT_ALPHA)
        removedCount++
      }
    }
  }

  const frac = removedCount / n
  if (frac < GUARDRAIL_FRAC_LOW || frac > GUARDRAIL_FRAC_HIGH) {
    return { buffer: input, removed: false, frac, reason: 'guardrail-frac' }
  }

  const buffer = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
  return { buffer, removed: true, frac }
}
