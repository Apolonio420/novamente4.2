import { describe, it, expect } from 'vitest'
import { safeRedirect, mapAuthError } from './login-helpers'

describe('safeRedirect — sanitiza ?redirect= del login', () => {
  it('acepta una ruta interna normal', () => {
    expect(safeRedirect('/workspace/orders')).toBe('/workspace/orders')
  })

  it('sin valor → fallback', () => {
    expect(safeRedirect(null)).toBe('/workspace')
    expect(safeRedirect(undefined)).toBe('/workspace')
    expect(safeRedirect('')).toBe('/workspace')
  })

  it('URL absoluta a otro host → fallback (open redirect)', () => {
    expect(safeRedirect('https://evil.com')).toBe('/workspace')
    expect(safeRedirect('http://evil.com/phish')).toBe('/workspace')
  })

  it('protocol-relative "//host" → fallback (el rescate redirige SOLO, sin click)', () => {
    expect(safeRedirect('//evil.com')).toBe('/workspace')
  })

  it('"/\\\\host" (algunos navegadores lo tratan como //) → fallback', () => {
    expect(safeRedirect('/\\evil.com')).toBe('/workspace')
  })

  it('respeta un fallback custom', () => {
    expect(safeRedirect(null, '/partners/join')).toBe('/partners/join')
  })
})

describe('mapAuthError — nunca el texto crudo en inglés, nunca nada', () => {
  const FALLBACK = 'No pudimos iniciar sesión. Revisá email y contraseña e intentá de nuevo.'

  it('mensaje conocido → traducción en español', () => {
    expect(mapAuthError('Invalid login credentials', FALLBACK)).toBe('Email o contraseña incorrectos')
  })

  it('mensaje desconocido (el bug: "missing email or phone") → fallback, no el texto crudo', () => {
    expect(mapAuthError('missing email or phone', FALLBACK)).toBe(FALLBACK)
  })

  it('vacío o undefined → fallback (nunca "nada" en pantalla)', () => {
    expect(mapAuthError('', FALLBACK)).toBe(FALLBACK)
    expect(mapAuthError(null, FALLBACK)).toBe(FALLBACK)
    expect(mapAuthError(undefined, FALLBACK)).toBe(FALLBACK)
  })
})
