import { describe, it, expect } from 'vitest'
import { parseHeroFocal, heroFocalToObjectPosition, DEFAULT_HERO_FOCAL } from './hero-focal'

describe('parseHeroFocal', () => {
  it('acepta un punto válido dentro de 0-100', () => {
    expect(parseHeroFocal({ x: 20, y: 80 })).toEqual({ x: 20, y: 80 })
  })

  it('acepta los extremos 0 y 100', () => {
    expect(parseHeroFocal({ x: 0, y: 100 })).toEqual({ x: 0, y: 100 })
  })

  it('redondea a un decimal', () => {
    expect(parseHeroFocal({ x: 33.333, y: 66.666 })).toEqual({ x: 33.3, y: 66.7 })
  })

  it('rechaza x fuera de rango', () => {
    expect(parseHeroFocal({ x: 101, y: 50 })).toBeNull()
    expect(parseHeroFocal({ x: -1, y: 50 })).toBeNull()
  })

  it('rechaza y fuera de rango', () => {
    expect(parseHeroFocal({ x: 50, y: 100.1 })).toBeNull()
    expect(parseHeroFocal({ x: 50, y: -0.1 })).toBeNull()
  })

  it('rechaza tipos no numéricos', () => {
    expect(parseHeroFocal({ x: '50', y: 50 })).toBeNull()
    expect(parseHeroFocal({ x: NaN, y: 50 })).toBeNull()
    expect(parseHeroFocal({ x: Infinity, y: 50 })).toBeNull()
  })

  it('rechaza null, undefined, arrays y no-objetos', () => {
    expect(parseHeroFocal(null)).toBeNull()
    expect(parseHeroFocal(undefined)).toBeNull()
    expect(parseHeroFocal([50, 50])).toBeNull()
    expect(parseHeroFocal('50,50')).toBeNull()
    expect(parseHeroFocal(42)).toBeNull()
  })

  it('rechaza objeto sin x/y', () => {
    expect(parseHeroFocal({})).toBeNull()
    expect(parseHeroFocal({ x: 50 })).toBeNull()
  })
})

describe('heroFocalToObjectPosition', () => {
  it('devuelve el default 50% 50% cuando metadata no tiene hero_focal', () => {
    expect(heroFocalToObjectPosition(null)).toBe('50% 50%')
    expect(heroFocalToObjectPosition({})).toBe('50% 50%')
  })

  it('devuelve el default cuando hero_focal es inválido', () => {
    expect(heroFocalToObjectPosition({ hero_focal: { x: 200, y: 50 } })).toBe('50% 50%')
  })

  it('devuelve el punto guardado en metadata.hero_focal', () => {
    expect(heroFocalToObjectPosition({ hero_focal: { x: 10, y: 90 } })).toBe('10% 90%')
  })

  it('DEFAULT_HERO_FOCAL es 50/50', () => {
    expect(DEFAULT_HERO_FOCAL).toEqual({ x: 50, y: 50 })
  })
})
