import { describe, it, expect } from 'vitest'
import { headingFontKey } from './heading-font'

describe('headingFontKey', () => {
  it('mapea los valores reales relevados en tenants.font_preference', () => {
    expect(headingFontKey('inter')).toBe('inter')
    expect(headingFontKey('bold')).toBe('archivo-black')
    expect(headingFontKey('playfair')).toBe('playfair')
    expect(headingFontKey('serif')).toBe('playfair')
    expect(headingFontKey('poppins')).toBe('poppins')
  })

  it('es case-insensitive y tolera espacios', () => {
    expect(headingFontKey('  Bold  ')).toBe('archivo-black')
    expect(headingFontKey('PLAYFAIR')).toBe('playfair')
  })

  it('cae a inter (sin override) para valores desconocidos, null, undefined o vacíos', () => {
    expect(headingFontKey('montserrat')).toBe('inter')
    expect(headingFontKey('')).toBe('inter')
    expect(headingFontKey(null)).toBe('inter')
    expect(headingFontKey(undefined)).toBe('inter')
  })
})
