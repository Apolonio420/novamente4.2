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
    expect(normalizeUploadMimeType('', 'photo.heic')).toBe('image/heic')
  })

  it('acepta formatos móviles estándar en ALLOWED_TYPES', () => {
    expect(ALLOWED_TYPES).toContain('image/jpeg')
    expect(ALLOWED_TYPES).toContain('image/png')
    expect(ALLOWED_TYPES).toContain('image/webp')
    expect(ALLOWED_TYPES).toContain('image/jpg')
    expect(ALLOWED_TYPES).toContain('image/heic')
  })

  it('los límites de tamaño estándar son 5MB', () => {
    expect(MAX_SIZE).toBe(5 * 1024 * 1024)
  })
})
