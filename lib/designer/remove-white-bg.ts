/**
 * Remueve el fondo BLANCO de un diseño generado, dejando alpha real.
 *
 * Gemini no puede generar PNG con transparencia: cuando se le pide, pinta un
 * cuadriculado falso. Por eso el prompt pide fondo blanco sólido y acá lo
 * sacamos determinísticamente: flood-fill desde los bordes sobre píxeles
 * casi-blancos (los blancos INTERNOS del diseño no conectados al borde se
 * preservan).
 */
import sharp from 'sharp'

const WHITE_T = 235   // umbral duro: r,g,b >= 235 se considera fondo
const SOFT_T = 210    // borde anti-alias: parcialmente transparente

export async function removeWhiteBackground(
  input: Buffer,
): Promise<{ buffer: Buffer; removed: boolean }> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const n = w * h

  const isWhite = (p: number) =>
    data[p * 4] >= WHITE_T && data[p * 4 + 1] >= WHITE_T && data[p * 4 + 2] >= WHITE_T
  const isSoft = (p: number) =>
    data[p * 4] >= SOFT_T && data[p * 4 + 1] >= SOFT_T && data[p * 4 + 2] >= SOFT_T

  const visited = new Uint8Array(n)
  const queue: number[] = []
  // sembrar con todos los píxeles del borde que sean casi-blancos
  for (let x = 0; x < w; x++) {
    for (const p of [x, (h - 1) * w + x]) if (!visited[p] && isWhite(p)) { visited[p] = 1; queue.push(p) }
  }
  for (let y = 0; y < h; y++) {
    for (const p of [y * w, y * w + w - 1]) if (!visited[p] && isWhite(p)) { visited[p] = 1; queue.push(p) }
  }

  let removedCount = 0
  while (queue.length) {
    const p = queue.pop()!
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
      if (isWhite(q)) { visited[q] = 1; queue.push(q) }
      else if (isSoft(q)) {
        // borde anti-aliasing: semitransparente, no propaga
        visited[q] = 1
        data[q * 4 + 3] = Math.min(data[q * 4 + 3], 90)
        removedCount++
      }
    }
  }

  const frac = removedCount / n
  // <2% = no había fondo blanco · >97% = nuked todo (diseño blanco?) → original
  if (frac < 0.02 || frac > 0.97) return { buffer: input, removed: false }

  const buffer = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
  return { buffer, removed: true }
}
