/**
 * Tipos, límites y normalización de MIME de /api/partners/upload. Viven acá y
 * no en route.ts porque Next.js solo admite handlers/config como exports de
 * una ruta (los extra rompían `tsc` con TS2344 en .next/types).
 */
// HEIC/HEIF quedaron AFUERA a propósito (bug verificado 10/10/2026): el
// binario de `sharp` instalado (libvips prebuilt, igual en Vercel/Linux)
// NO trae el decoder HEVC — `sharp(heicBuffer).jpeg()` tira
// "heif: Error while loading plugin: Support for this compression format
// has not been built in", confirmado con un HEIC real generado con
// `sips -s format heic` en macOS. Antes de este fix se aceptaba el archivo
// crudo (sin convertir) y Chrome/la mayoría de navegadores no lo pueden
// renderizar → imagen rota en la tienda/panel. iOS ya convierte a JPEG
// solo si se le niega HEIC (ver normalizeUploadMimeType, que SIGUE
// mapeando la extensión .heic/.heif — se usa para dar el 415 específico
// más abajo, no para aceptarlo).
export const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/jpg',
  'image/pjpeg',
  'image/x-png',
]
export const DESIGN_UPLOAD_TYPES = ['image/png', 'image/svg+xml', 'image/x-png']
export const MAX_SIZE = 5 * 1024 * 1024 // 5MB
export const DESIGN_MAX_SIZE = 10 * 1024 * 1024 // 10MB for design uploads

export function normalizeUploadMimeType(rawMime: string, filename: string): string {
  const rawType = (rawMime || '').toLowerCase()
  const ext = (filename || '').split('.').pop()?.toLowerCase() || 'png'
  let effectiveType = rawType
  if (!effectiveType || effectiveType === 'application/octet-stream') {
    if (ext === 'jpg' || ext === 'jpeg') effectiveType = 'image/jpeg'
    else if (ext === 'png') effectiveType = 'image/png'
    else if (ext === 'webp') effectiveType = 'image/webp'
    else if (ext === 'svg') effectiveType = 'image/svg+xml'
    else if (ext === 'heic') effectiveType = 'image/heic'
    else if (ext === 'heif') effectiveType = 'image/heif'
  } else if (effectiveType === 'image/jpg' || effectiveType === 'image/pjpeg') {
    effectiveType = 'image/jpeg'
  } else if (effectiveType === 'image/x-png') {
    effectiveType = 'image/png'
  }
  return effectiveType
}
