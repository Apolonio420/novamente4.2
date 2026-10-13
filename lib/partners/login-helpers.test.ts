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

  it('control chars decodificados (/%09/evil.com, /%0A/evil.com) → fallback (open redirect real)', () => {
    for (const encoded of ['/%09/evil.com', '/%0A/evil.com', '/%0D/evil.com']) {
      const decoded = new URLSearchParams('redirect=' + encoded).get('redirect')
      expect(safeRedirect(decoded)).toBe('/workspace')
      expect(safeRedirect(encoded)).toBe(encoded) // sin decodificar es una ruta interna inofensiva
    }
    expect(safeRedirect('/\t/evil.com')).toBe('/workspace')
    expect(safeRedirect('/\n/evil.com')).toBe('/workspace')
  })

  it('"/%2F/evil.com" decodificado → "///evil.com" → fallback; literal queda como ruta interna', () => {
    const decoded = new URLSearchParams('redirect=/%2F/evil.com').get('redirect')
    expect(safeRedirect(decoded)).toBe('/workspace')
    expect(safeRedirect('/%2F/evil.com')).toBe('/%2F/evil.com')
  })

  it('esquemas no-ruta (javascript:, data:) → fallback', () => {
    expect(safeRedirect('javascript:alert(1)')).toBe('/workspace')
    expect(safeRedirect('data:text/html,x')).toBe('/workspace')
  })

  it('rutas válidas conservan path, query y hash', () => {
    expect(safeRedirect('/workspace')).toBe('/workspace')
    expect(safeRedirect('/workspace/orders?x=1#a')).toBe('/workspace/orders?x=1#a')
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
