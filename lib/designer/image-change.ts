import sharp from "sharp"

/**
 * measureImageChange
 *
 * ¿Cuánto cambió una edición? Gemini (gemini-2.5-flash-image) a veces devuelve
 * la MISMA imagen que le mandamos, re-codificada, en vez de aplicar el pedido.
 * Antes eso se mostraba como "Acá va la versión actualizada" (caso real
 * 05/11: "haceme el delfín más chico… y me mandó exactamente la misma imagen").
 *
 * Métrica: ambas imágenes aplanadas sobre blanco, llevadas a 128×128 y
 * comparadas en RGB (no en gris: un cambio de color con la misma luminancia no
 * se ve en gris). Cuenta el % de píxeles cuyo canal que más cambió supera 40.
 *
 * Umbral calibrado con 91 ediciones reales de /crear (07/10–05/11, R2):
 * - 0,00–0,86 %: la imagen quedó igual a la vista (pantera, ojos "rotar 180",
 *   ocultista, Frankenstein, colores argentinos, delfín).
 * - 0,95 %: "ESPALDA" escribió la palabra literal (cambio chico, y mal).
 * - 1,32 % / 1,49 %: cambios chicos reales y correctos (+22 y escudo, rayo).
 * Con 1 % un falso positivo cuesta un reintento, nunca perder un cambio real
 * grande.
 */
export const UNCHANGED_THRESHOLD_PCT = 1.0

const SIZE = 128
const PIXEL_DIFF = 40

async function normalize(buf: Buffer): Promise<Buffer> {
  return sharp(buf)
    .flatten({ background: "#ffffff" })
    .resize(SIZE, SIZE, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer()
}

/** % de píxeles (0–100) que cambiaron de forma visible entre `before` y `after`. */
export async function measureImageChange(before: Buffer, after: Buffer): Promise<number> {
  const [a, b] = await Promise.all([normalize(before), normalize(after)])
  let changed = 0
  for (let i = 0; i < SIZE * SIZE; i++) {
    const d = Math.max(
      Math.abs(a[3 * i] - b[3 * i]),
      Math.abs(a[3 * i + 1] - b[3 * i + 1]),
      Math.abs(a[3 * i + 2] - b[3 * i + 2]),
    )
    if (d > PIXEL_DIFF) changed++
  }
  return (changed / (SIZE * SIZE)) * 100
}

export function isUnchanged(changePct: number): boolean {
  return changePct < UNCHANGED_THRESHOLD_PCT
}
