import { describe, expect, it } from 'vitest'
import { buttonColors, contrastRatio, luminance, readableTextOn } from './contrast'

describe('luminance', () => {
  it('negro puro es 0', () => {
    expect(luminance('#000000')).toBeCloseTo(0, 5)
  })

  it('blanco puro es 1', () => {
    expect(luminance('#FFFFFF')).toBeCloseTo(1, 5)
  })

  it('hex inválido se trata como negro (0)', () => {
    expect(luminance('not-a-color')).toBe(0)
  })
})

describe('contrastRatio', () => {
  it('negro sobre blanco es el máximo (21:1)', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
  })

  it('un color contra sí mismo es 1:1', () => {
    expect(contrastRatio('#3BA94C', '#3BA94C')).toBeCloseTo(1, 5)
  })

  it('es simétrico', () => {
    expect(contrastRatio('#DC2626', '#09090b')).toBeCloseTo(
      contrastRatio('#09090b', '#DC2626'),
      5,
    )
  })
})

describe('readableTextOn', () => {
  const cases: Array<[string, '#000' | '#fff']> = [
    ['#0a0a0a', '#fff'],
    ['#1a1a2e', '#fff'],
    ['#000000', '#fff'],
    ['#3BA94C', '#000'],
    ['#DC2626', '#fff'],
    ['#4A4E69', '#fff'],
    ['#F4A7C3', '#000'], // rosa pastel
    ['#FFFFFF', '#000'],
  ]

  it.each(cases)('sobre %s devuelve %s', (hex, expected) => {
    expect(readableTextOn(hex)).toBe(expected)
  })

  it('el texto elegido siempre cumple >= 4.5:1 quando es posible, o el mejor de los dos', () => {
    for (const [hex] of cases) {
      const text = readableTextOn(hex)
      const chosenRatio = contrastRatio(hex, text === '#fff' ? '#ffffff' : '#000000')
      const otherRatio = contrastRatio(hex, text === '#fff' ? '#000000' : '#ffffff')
      expect(chosenRatio).toBeGreaterThanOrEqual(otherRatio)
    }
  })

  it('hex inválido cae a blanco (fallback seguro)', () => {
    expect(readableTextOn('nope')).toBe('#fff')
  })
})

describe('buttonColors', () => {
  const PAGE_BG = '#09090b'
  const cases = ['#0a0a0a', '#1a1a2e', '#000000', '#3BA94C', '#DC2626', '#4A4E69', '#F4A7C3', '#FFFFFF']

  it.each(cases)('%s: superficie >= 3:1 contra el fondo y texto >= 4.5:1 contra la superficie', (hex) => {
    const { background, color } = buttonColors(hex, PAGE_BG)
    expect(contrastRatio(background, PAGE_BG)).toBeGreaterThanOrEqual(3 - 1e-6)
    expect(contrastRatio(background, color === '#fff' ? '#ffffff' : '#000000')).toBeGreaterThanOrEqual(
      4.5 - 1e-6,
    )
  })

  it('un primario ya legible (ej. #DC2626) se deja intacto', () => {
    const { background } = buttonColors('#DC2626', PAGE_BG)
    expect(background.toLowerCase()).toBe('#dc2626')
  })

  it('un primario casi negro (#0a0a0a) se aclara para tener superficie visible', () => {
    const { background } = buttonColors('#0a0a0a', PAGE_BG)
    expect(background.toLowerCase()).not.toBe('#0a0a0a')
    expect(contrastRatio(background, PAGE_BG)).toBeGreaterThanOrEqual(3)
  })

  it('hex inválido usa un fallback seguro y no rompe', () => {
    const { background, color } = buttonColors('not-a-hex', PAGE_BG)
    expect(background).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(['#000', '#fff']).toContain(color)
    expect(contrastRatio(background, PAGE_BG)).toBeGreaterThanOrEqual(3)
  })

  it('acepta un pageBg distinto del default', () => {
    const { background } = buttonColors('#1a1a2e', '#ffffff')
    expect(contrastRatio(background, '#ffffff')).toBeGreaterThanOrEqual(3)
  })
})
