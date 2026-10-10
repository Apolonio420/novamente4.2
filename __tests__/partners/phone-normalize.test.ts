import { describe, it, expect } from 'vitest'
import { normalizePartnerPhone } from '@/lib/partners/phone'

describe('normalizePartnerPhone — Argentina', () => {
  it('"54" + 10 dígitos (sin el 9) inserta el 9', () => {
    // número CABA: área 11 + abonado 23456789 (8 dígitos) = 10 dígitos
    expect(normalizePartnerPhone('541123456789')).toEqual({ ok: true, value: '5491123456789' })
  })

  it('ya viene en formato WhatsApp ("549" + 10) y se devuelve igual', () => {
    expect(normalizePartnerPhone('5491123456789')).toEqual({ ok: true, value: '5491123456789' })
  })

  it('"0" + área + abonado (11 dígitos, sin "15") saca el "0"', () => {
    expect(normalizePartnerPhone('01123456789')).toEqual({ ok: true, value: '5491123456789' })
  })

  it('"0" + área + "15" + abonado (13 dígitos) saca "0" y "15" (área de 2 dígitos)', () => {
    // 0 + 11 + 15 + 23456789
    expect(normalizePartnerPhone('0111523456789')).toEqual({ ok: true, value: '5491123456789' })
  })

  it('"0" + área + "15" + abonado con área de 3 dígitos (ej. 221 La Plata)', () => {
    // 0 + 221 + 15 + 2345678  → área 221, abonado 2345678 (7 dígitos) = 10 dígitos
    expect(normalizePartnerPhone('0221152345678')).toEqual({ ok: true, value: '5492212345678' })
  })

  it('"0" + área + "15" + abonado con área de 4 dígitos', () => {
    // 0 + 2920 + 15 + 123456 → área 2920 (4), abonado 123456 (6) = 10 dígitos
    expect(normalizePartnerPhone('0292015123456')).toEqual({ ok: true, value: '5492920123456' })
  })

  it('área + abonado directo (10 dígitos, sin 0 ni 9) antepone "549"', () => {
    expect(normalizePartnerPhone('1123456789')).toEqual({ ok: true, value: '5491123456789' })
  })

  it('"15" + abonado sin área (10 dígitos) asume CABA/GBA (área 11)', () => {
    expect(normalizePartnerPhone('1523456789')).toEqual({ ok: true, value: '5491123456789' })
  })

  it('tolera espacios, guiones y paréntesis', () => {
    expect(normalizePartnerPhone('(011) 1234-5678')).toEqual({ ok: true, value: '5491112345678' })
  })

  it('"+54" con 10 dígitos (sin 9) también inserta el 9', () => {
    expect(normalizePartnerPhone('+541123456789')).toEqual({ ok: true, value: '5491123456789' })
  })

  it('"+54" ya con 9 se mantiene', () => {
    expect(normalizePartnerPhone('+5491123456789')).toEqual({ ok: true, value: '5491123456789' })
  })

  it('"0054" (marcación internacional con 00) se trata igual que "+54"', () => {
    expect(normalizePartnerPhone('0054 11 1234 5678')).toEqual({ ok: true, value: '5491112345678' })
  })
})

describe('normalizePartnerPhone — vacío / borrado', () => {
  it('null, undefined, string vacío o solo espacios → value: null (borra el campo)', () => {
    expect(normalizePartnerPhone(null)).toEqual({ ok: true, value: null })
    expect(normalizePartnerPhone(undefined)).toEqual({ ok: true, value: null })
    expect(normalizePartnerPhone('')).toEqual({ ok: true, value: null })
    expect(normalizePartnerPhone('   ')).toEqual({ ok: true, value: null })
  })
})

describe('normalizePartnerPhone — internacional no-AR', () => {
  it('acepta un número uruguayo con "+" tal cual (no se le aplica lógica argentina)', () => {
    expect(normalizePartnerPhone('+598 98 123 456')).toEqual({ ok: true, value: '59898123456' })
  })

  it('acepta un número chileno con "+"', () => {
    expect(normalizePartnerPhone('+56 9 1234 5678')).toEqual({ ok: true, value: '56912345678' })
  })

  it('con country=UY (sin "+"), no aplica la heurística AR: valida como internacional genérico', () => {
    expect(normalizePartnerPhone('098123456', { country: 'UY' })).toEqual({
      ok: true,
      value: '098123456',
    })
  })

  it('con country=AR explícito, sigue aplicando la lógica argentina', () => {
    expect(normalizePartnerPhone('1123456789', { country: 'AR' })).toEqual({
      ok: true,
      value: '5491123456789',
    })
  })

  it('rechaza un internacional demasiado corto', () => {
    const r = normalizePartnerPhone('+123')
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/inválido/i)
  })

  it('rechaza un internacional demasiado largo', () => {
    const r = normalizePartnerPhone('+123456789012345678')
    expect(r.ok).toBe(false)
  })
})

describe('normalizePartnerPhone — inválidos', () => {
  it('rechaza una cantidad de dígitos que no matchea ningún patrón argentino', () => {
    const r = normalizePartnerPhone('12345')
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/inválido/i)
  })

  it('rechaza texto sin dígitos', () => {
    const r = normalizePartnerPhone('no tengo teléfono')
    expect(r.ok).toBe(false)
  })
})
