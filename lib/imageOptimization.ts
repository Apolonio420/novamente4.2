// Utilidades para optimización de imágenes

export const IMAGE_SIZES = {
  thumbnail: 150,
  small: 300,
  medium: 600,
  large: 1200,
  xlarge: 1800,
} as const

export const RESPONSIVE_SIZES = {
  mobile: "(max-width: 768px)",
  tablet: "(max-width: 1024px)",
  desktop: "(min-width: 1025px)",
} as const

// Generar srcSet para imágenes responsivas
export function generateSrcSet(baseSrc: string, sizes: number[] = [300, 600, 1200]): string {
  return sizes.map((size) => `${baseSrc}?w=${size}&q=75 ${size}w`).join(", ")
}

// Generar sizes attribute para responsive images
export function generateSizes(breakpoints: Record<string, string> = RESPONSIVE_SIZES): string {
  return [`${breakpoints.mobile} 100vw`, `${breakpoints.tablet} 50vw`, `${breakpoints.desktop} 33vw`].join(", ")
}

// Detectar formato de imagen soportado
export function getOptimalImageFormat(): string {
  if (typeof window === "undefined") return "webp"

  // Detectar soporte para AVIF
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1

  try {
    const avifSupported = canvas.toDataURL("image/avif").indexOf("data:image/avif") === 0
    if (avifSupported) return "avif"
  } catch (e) {
    // AVIF no soportado
  }

  try {
    const webpSupported = canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0
    if (webpSupported) return "webp"
  } catch (e) {
    // WebP no soportado
  }

  return "jpeg"
}

// Cache de imágenes en memoria
const imageCache = new Map<string, HTMLImageElement>()

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve()
      return
    }

    const img = new Image()
    img.onload = () => {
      imageCache.set(src, img)
      resolve()
    }
    img.onerror = reject
    img.src = src
  })
}

// Precargar múltiples imágenes
export async function preloadImages(sources: string[]): Promise<void[]> {
  return Promise.all(sources.map(preloadImage))
}

// Generar placeholder blur data URL
export function generateBlurDataURL(width = 10, height = 10): string {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) return ""

  // Crear un gradiente simple
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, "#f3f4f6")
  gradient.addColorStop(1, "#e5e7eb")

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  return canvas.toDataURL("image/jpeg", 0.1)
}
