import sharp from 'sharp'

/**
 * Tono dominante de un logo (para elegir la caja del hero en /p/[slug]).
 * La caja del hero hoy es un fondo oscuro translúcido fijo (bg-black/30) —
 * un logo oscuro se vuelve invisible ahí. Calculamos la luminancia media de
 * los píxeles OPACOS (alpha > 32; se ignoran los transparentes, que no
 * aportan color visible) y devolvemos 'dark' cuando conviene una caja clara.
 *
 * También devolvemos el aspect ratio (ancho/alto) para no forzar logos muy
 * anchos (ej. wordmarks) dentro de una caja cuadrada 120×120.
 */
export interface LogoTone {
  tone: 'dark' | 'light'
  aspect: number
}

export async function computeLogoTone(buffer: Buffer): Promise<LogoTone> {
  const image = sharp(buffer).ensureAlpha()
  const metadata = await image.metadata()
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const channels = info.channels || 4

  let sum = 0
  let count = 0
  for (let i = 0; i + channels <= data.length; i += channels) {
    const alpha = data[i + 3]
    if (alpha <= 32) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // Luminancia perceptual simple (0-255) — alcanza para clasificar en un
    // bucket claro/oscuro, no hace falta la fórmula WCAG relativa acá.
    sum += 0.2126 * r + 0.7152 * g + 0.0722 * b
    count++
  }

  // Sin píxeles opacos (logo completamente transparente/vacío): no forzamos
  // una caja clara que no hace falta — nos quedamos con el default 'light'
  // (mantiene la caja oscura translúcida de siempre).
  const tone: 'dark' | 'light' = count === 0 ? 'light' : sum / count < 128 ? 'dark' : 'light'

  const width = metadata.width || info.width || 1
  const height = metadata.height || info.height || 1
  const aspect = height > 0 ? width / height : 1

  return { tone, aspect }
}

/**
 * Descarga (si hace falta) y calcula el tono de un logo por su URL.
 * Nunca tira: si falla la descarga o el cómputo, devuelve null y el caller
 * decide qué hacer (no romper el guardado del branding).
 */
export async function computeLogoToneFromUrl(
  logoUrl: string,
  baseUrl = 'https://www.novamente.ar',
): Promise<LogoTone | null> {
  try {
    const resolvedUrl = /^https?:\/\//i.test(logoUrl) ? logoUrl : `${baseUrl}${logoUrl}`
    const res = await fetch(resolvedUrl)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    return await computeLogoTone(buffer)
  } catch (error) {
    console.error('computeLogoToneFromUrl: no se pudo calcular el tono del logo', error)
    return null
  }
}
