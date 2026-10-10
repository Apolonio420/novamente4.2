import { describe, it, expect } from 'vitest'
import {
  normalizeUploadMimeType,
  ALLOWED_TYPES,
  DESIGN_UPLOAD_TYPES,
  MAX_SIZE,
} from '@/app/api/partners/upload/route'

describe('normalizeUploadMimeType & upload guards', () => {
  it('normaliza image/jpg e image/pjpeg a image/jpeg', () => {
    expect(normalizeUploadMimeType('image/jpg', 'banner.jpg')).toBe('image/jpeg')
    expect(normalizeUploadMimeType('image/pjpeg', 'banner.jpeg')).toBe('image/jpeg')
  })

  it('normaliza image/x-png a image/png', () => {
    expect(normalizeUploadMimeType('image/x-png', 'logo.png')).toBe('image/png')
  })

  it('infiere MIME por extensión cuando el browser manda vacío o octet-stream', () => {
    expect(normalizeUploadMimeType('', 'banner.png')).toBe('image/png')
    expect(normalizeUploadMimeType('application/octet-stream', 'banner.jpg')).toBe('image/jpeg')
    expect(normalizeUploadMimeType('', 'banner.webp')).toBe('image/webp')
    expect(normalizeUploadMimeType('', 'vector.svg')).toBe('image/svg+xml')
    // La extensión .heic/.heif SIGUE mapeándose (se usa para dar el 415
    // específico de iPhone en la ruta) aunque HEIC ya no esté en
    // ALLOWED_TYPES — ver el test de abajo y el comentario en el route.
    expect(normalizeUploadMimeType('', 'photo.heic')).toBe('image/heic')
  })

  it('acepta formatos móviles estándar en ALLOWED_TYPES', () => {
    expect(ALLOWED_TYPES).toContain('image/jpeg')
    expect(ALLOWED_TYPES).toContain('image/png')
    expect(ALLOWED_TYPES).toContain('image/webp')
    expect(ALLOWED_TYPES).toContain('image/jpg')
  })

  it('HEIC/HEIF NO está en ALLOWED_TYPES — el sharp instalado no puede decodificarlo (verificado 10/10/2026 con un HEIC real: "heif: Error while loading plugin: Support for this compression format has not been built in")', () => {
    expect(ALLOWED_TYPES).not.toContain('image/heic')
    expect(ALLOWED_TYPES).not.toContain('image/heif')
  })

  it('los límites de tamaño estándar son 5MB', () => {
    expect(MAX_SIZE).toBe(5 * 1024 * 1024)
  })
})
