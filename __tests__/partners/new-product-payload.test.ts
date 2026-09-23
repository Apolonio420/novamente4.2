import { describe, it, expect } from 'vitest'
import {
  buildFromDesignPayload,
  validatePriceLive,
  suggestProductName,
  MIN_PRODUCT_PRICE_ARS,
  type NewProductFormState,
} from '@/lib/partners/new-product-payload'

function baseState(overrides: Partial<NewProductFormState> = {}): NewProductFormState {
  return {
    name: 'Buho · Aldea',
    price: '32000',
    garmentKey: 'aldea-classic-tshirt',
    colors: ['black'],
    front: { designUrl: 'https://pub-abc.r2.dev/design.png', size: 'mediano', placement: 'centro' },
    back: null,
    status: 'draft',
    ...overrides,
  }
}

describe('buildFromDesignPayload', () => {
  it('arma el payload con front y sin back cuando el dorso no tiene diseño', () => {
    const payload = buildFromDesignPayload(baseState())
    expect(payload).toEqual({
      name: 'Buho · Aldea',
      price: 32000,
      garmentKey: 'aldea-classic-tshirt',
      colors: ['black'],
      front: { designUrl: 'https://pub-abc.r2.dev/design.png', size: 'mediano', placement: 'centro' },
      back: null,
      status: 'draft',
    })
  })

  it('manda back null si el lado está seleccionado pero sin diseño propio (prenda lisa)', () => {
    const payload = buildFromDesignPayload(
      baseState({ back: { designUrl: null, size: 'mediano', placement: 'centro' } }),
    )
    expect(payload.back).toBeNull()
  })

  it('manda ambos lados cuando los dos tienen diseño', () => {
    const payload = buildFromDesignPayload(
      baseState({ back: { designUrl: 'https://pub-abc.r2.dev/back.png', size: 'chico', placement: 'nuca' } }),
    )
    expect(payload.front?.designUrl).toBe('https://pub-abc.r2.dev/design.png')
    expect(payload.back).toEqual({ designUrl: 'https://pub-abc.r2.dev/back.png', size: 'chico', placement: 'nuca' })
  })

  it('trimea el nombre y redondea el precio', () => {
    const payload = buildFromDesignPayload(baseState({ name: '  Con espacios  ', price: '32000.7' }))
    expect(payload.name).toBe('Con espacios')
    expect(payload.price).toBe(32001)
  })

  it('múltiples colores viajan tal cual', () => {
    const payload = buildFromDesignPayload(baseState({ colors: ['black', 'white', 'stone-wash'] }))
    expect(payload.colors).toEqual(['black', 'white', 'stone-wash'])
  })
})

describe('validatePriceLive', () => {
  it('rechaza vacío', () => {
    expect(validatePriceLive('').ok).toBe(false)
  })

  it('rechaza no numérico', () => {
    expect(validatePriceLive('abc').ok).toBe(false)
  })

  it('rechaza cero o negativo', () => {
    expect(validatePriceLive('0').ok).toBe(false)
    expect(validatePriceLive('-500').ok).toBe(false)
  })

  it(`rechaza por debajo del piso de $${MIN_PRODUCT_PRICE_ARS}`, () => {
    const r = validatePriceLive('500')
    expect(r.ok).toBe(false)
    expect(r.reason).toContain('mínimo')
  })

  it('acepta el piso general sin costo conocido', () => {
    expect(validatePriceLive(String(MIN_PRODUCT_PRICE_ARS)).ok).toBe(true)
  })

  it('rechaza si no supera el costo real de la prenda', () => {
    const r = validatePriceLive('25000', 25000)
    expect(r.ok).toBe(false)
    expect(r.reason).toContain('costo')
  })

  it('acepta si supera el costo real', () => {
    expect(validatePriceLive('25001', 25000).ok).toBe(true)
  })
})

describe('suggestProductName', () => {
  it('combina diseño + prenda', () => {
    expect(suggestProductName('Diseño', 'Aldea')).toBe('Diseño · Aldea')
  })

  it('cae a lo que haya si falta uno de los dos', () => {
    expect(suggestProductName(null, 'Aldea')).toBe('Aldea')
    expect(suggestProductName('Diseño', null)).toBe('Diseño')
    expect(suggestProductName(null, null)).toBe('')
  })
})
