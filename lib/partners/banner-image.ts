import sharp from 'sharp'

/**
 * Normaliza cualquier imagen publicada al slot banner/hero del Studio a
 * 16:9 (1600×900) (Fase 2 tiendas partner).
 *
 * `app/api/partners/design/publish/route.ts` publicaba tal cual las
 * imágenes cuadradas (1024×1024) que genera el Studio al slot del banner —
 * el hero de /p/[slug] es 16:9 con `object-cover`, así que una imagen
 * cuadrada terminaba con los costados recortados sin control.
 *
 * Estrategia elegida: SIEMPRE se devuelve un lienzo 1600×900 con la imagen
 * ORIGINAL completa centrada y contenida (nunca recortada), sobre un fondo
 * generado a partir de la misma imagen (cover + blur + oscurecido). Se
 * descartó el crop centrado simple porque en una imagen cuadrada con el
 * diseño/arte cerca de los bordes eso recorta parte del diseño del cliente
 * (regla del proyecto: el diseño se usa tal cual, nunca se le recorta
 * contenido sin que el partner lo pida). El fondo difuminado de la misma
 * imagen evita barras sólidas o de color arbitrario a los costados.
 *
 * Si la imagen de entrada ya es ~16:9, el resultado es un cover normal
 * (sin composición) — no hay nada que corregir.
 */

export const BANNER_TARGET_WIDTH = 1600
export const BANNER_TARGET_HEIGHT = 900
const TARGET_RATIO = BANNER_TARGET_WIDTH / BANNER_TARGET_HEIGHT
const RATIO_TOLERANCE = 0.05

export async function toBanner16x9(input: Buffer): Promise<Buffer> {
  const meta = await sharp(input).metadata()
  const width = meta.width || BANNER_TARGET_WIDTH
  const height = meta.height || BANNER_TARGET_HEIGHT
  const ratio = width / height

  // Ya es ~16:9: cover simple, sin componer (no hay recorte significativo).
  if (Math.abs(ratio - TARGET_RATIO) <= RATIO_TOLERANCE) {
    return sharp(input)
      .resize(BANNER_TARGET_WIDTH, BANNER_TARGET_HEIGHT, { fit: 'cover' })
      .png()
      .toBuffer()
  }

  // Fondo: la misma imagen, cover + blur + oscurecida, para que no queden
  // barras sólidas a los costados/arriba-abajo.
  const background = await sharp(input)
    .resize(BANNER_TARGET_WIDTH, BANNER_TARGET_HEIGHT, { fit: 'cover' })
    .blur(42)
    .modulate({ brightness: 0.55 })
    .toBuffer()

  // Primer plano: la imagen ORIGINAL completa, contenida (nunca recortada).
  const foreground = await sharp(input)
    .resize({
      width: BANNER_TARGET_WIDTH,
      height: BANNER_TARGET_HEIGHT,
      fit: 'inside',
    })
    .toBuffer()
  const fgMeta = await sharp(foreground).metadata()
  const fgWidth = fgMeta.width || BANNER_TARGET_WIDTH
  const fgHeight = fgMeta.height || BANNER_TARGET_HEIGHT
  const left = Math.max(0, Math.round((BANNER_TARGET_WIDTH - fgWidth) / 2))
  const top = Math.max(0, Math.round((BANNER_TARGET_HEIGHT - fgHeight) / 2))

  return sharp(background)
    .composite([{ input: foreground, left, top }])
    .png()
    .toBuffer()
}

/** true si la imagen NO es ~16:9 (candidata a recibir el tratamiento de `toBanner16x9`). */
export function needsBannerTreatment(width: number, height: number): boolean {
  if (!width || !height) return false
  const ratio = width / height
  return Math.abs(ratio - TARGET_RATIO) > RATIO_TOLERANCE
}
