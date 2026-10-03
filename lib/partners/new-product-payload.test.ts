import { describe, it, expect } from 'vitest'
import { buildFromDesignPayload, resolveBackDesign, type NewProductFormState } from './new-product-payload'

const MAIN = { url: 'https://r2.test/main.png' }
const OTHER = { url: 'https://r2.test/other.png' }

describe('resolveBackDesign', () => {
  // Bug La blancq 02/10/2026: "Espalda" sola generaba el dorso liso porque
  // el diseño del bloque 1 queda en frontDesign y el dorso leía backDesign.
  it('solo espalda: el diseño principal va al dorso', () => {
    expect(resolveBackDesign('back', true, MAIN, null)).toBe(MAIN)
    expect(resolveBackDesign('back', false, MAIN, null)).toBe(MAIN)
  })

  it('solo espalda sin diseño principal: cae al diseño de espalda precargado', () => {
    expect(resolveBackDesign('back', true, null, OTHER)).toBe(OTHER)
  })

  it('los dos con mismo diseño: el dorso repite el del frente', () => {
    expect(resolveBackDesign('both', true, MAIN, OTHER)).toBe(MAIN)
  })

  it('los dos con diseño distinto: el dorso usa el suyo', () => {
    expect(resolveBackDesign('both', false, MAIN, OTHER)).toBe(OTHER)
    expect(resolveBackDesign('both', false, MAIN, null)).toBeNull()
  })
})

describe('buildFromDesignPayload — solo espalda', () => {
  it('manda el diseño en back y front en null', () => {
    const sideMode = 'back' as const
    const back = resolveBackDesign(sideMode, true, MAIN, null)
    const state: NewProductFormState = {
      name: 'Cuti',
      price: '30000',
      garmentKey: 'aldea-classic-tshirt',
      colors: ['white'],
      front: null,
      back: { designUrl: back?.url ?? null, size: 'mediano', placement: 'centro' },
      status: 'published',
    }
    const payload = buildFromDesignPayload(state)
    expect(payload.front).toBeNull()
    expect(payload.back).toEqual({ designUrl: MAIN.url, size: 'mediano', placement: 'centro' })
  })
})
