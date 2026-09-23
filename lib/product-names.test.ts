import { describe, it, expect } from 'vitest'
import { lookupProductName, productDisplayName, productModelName } from './product-names'

describe('product-names — tabla canónica (PLAN-NOMBRES-DESCRIPTIVOS.md)', () => {
  it('Aura -> Remera oversize', () => {
    expect(lookupProductName({ id: 'aura-oversize-tshirt' })).toEqual({ modelo: 'Aura', descriptivo: 'Remera oversize' })
    expect(lookupProductName({ id: 'aura-tshirt-blanco' })?.descriptivo).toBe('Remera oversize')
    expect(lookupProductName({ name: 'Aura Oversize T-Shirt - Negro' })?.descriptivo).toBe('Remera oversize')
  })

  it('Aldea -> Remera clásica', () => {
    expect(lookupProductName({ id: 'aldea-classic-tshirt' })?.descriptivo).toBe('Remera clásica')
    expect(lookupProductName({ id: 'aldea-tshirt-negro' })?.modelo).toBe('Aldea')
  })

  it('remera-clasica-mujer -> Remera clásica mujer (Buenos Aires), no cae en Aldea', () => {
    const entry = lookupProductName({ garmentType: 'remera-clasica-mujer' })
    expect(entry).toEqual({ modelo: 'Buenos Aires', descriptivo: 'Remera clásica mujer' })
  })

  it('remera-crop-mujer -> Remera crop mujer (Bahamas)', () => {
    expect(lookupProductName({ id: 'remera-crop-negra', garmentType: 'remera-crop-mujer' })).toEqual({
      modelo: 'Bahamas',
      descriptivo: 'Remera crop mujer',
    })
  })

  it('remera-infantil / bambino -> Remera infantil', () => {
    expect(lookupProductName({ id: 'bambino-tshirt-blanco' })?.descriptivo).toBe('Remera infantil')
    expect(lookupProductName({ garmentType: 'remera-infantil' })?.descriptivo).toBe('Remera infantil')
  })

  it('buzo-cuello-redondo -> Buzo cuello redondo (Berlin), no cae en hoodie', () => {
    expect(lookupProductName({ id: 'buzo-cuello-redondo-negro' })).toEqual({
      modelo: 'Berlin',
      descriptivo: 'Buzo cuello redondo',
    })
  })

  it('buzo-hoodie-unisex -> Buzo con capucha (Boston)', () => {
    expect(lookupProductName({ id: 'buzo-hoodie-negro', garmentType: 'buzo-hoodie-unisex' })).toEqual({
      modelo: 'Boston',
      descriptivo: 'Buzo con capucha',
    })
  })

  it('musculosa-bali -> Musculosa (Bali)', () => {
    expect(lookupProductName({ id: 'musculosa-bali-blanca' })).toEqual({ modelo: 'Bali', descriptivo: 'Musculosa' })
  })

  it('totebag -> Totebag (Bahía)', () => {
    expect(lookupProductName({ id: 'bahia-totebag-crudo' })).toEqual({ modelo: 'Bahía', descriptivo: 'Totebag' })
    expect(lookupProductName({ garmentType: 'totebag' })?.descriptivo).toBe('Totebag')
  })

  it('sin match (lienzo, partner DB products) devuelve null', () => {
    expect(lookupProductName({ id: 'lienzo' })).toBeNull()
    expect(lookupProductName({ id: 'partner-custom-mug-123', name: 'Taza personalizada' })).toBeNull()
  })
})

describe('productDisplayName', () => {
  it('compone descriptivo + color', () => {
    expect(productDisplayName({ id: 'aura-tshirt-blanco', color: 'Blanco' })).toBe('Remera oversize - Blanco')
    expect(productDisplayName({ id: 'aldea-tshirt-negro', color: 'Negro' })).toBe('Remera clásica - Negro')
  })

  it('sin color, devuelve solo el descriptivo', () => {
    expect(productDisplayName({ id: 'buzo-hoodie-unisex' })).toBe('Buzo con capucha')
  })

  it('no duplica el color si ya viene incluido en la base', () => {
    // Caso borde: si algún día el descriptivo ya trae el color, no debe duplicarlo.
    expect(productDisplayName({ garmentType: 'buzo-cuello-redondo', color: 'cuello redondo' })).toBe('Buzo cuello redondo')
  })

  it('fallback a name cuando no hay match (partner DB, lienzos, gorras)', () => {
    expect(productDisplayName({ name: 'Lienzo' })).toBe('Lienzo')
    expect(productDisplayName({ name: 'Gorra Trucker', id: 'gorra-trucker' })).toBe('Gorra Trucker')
    expect(productDisplayName({ id: 'partner-mug-1', name: 'Taza Sublimada' })).toBe('Taza Sublimada')
  })

  it('fallback vacío si no hay ni match ni name', () => {
    expect(productDisplayName({ id: 'unknown-id' })).toBe('')
  })
})

describe('productModelName', () => {
  it('devuelve el modelo interno para la línea secundaria "Modelo X"', () => {
    expect(productModelName({ id: 'aura-tshirt-blanco' })).toBe('Aura')
    expect(productModelName({ id: 'aldea-tshirt-negro' })).toBe('Aldea')
    expect(productModelName({ garmentType: 'buzo-hoodie-unisex' })).toBe('Boston')
    expect(productModelName({ garmentType: 'buzo-cuello-redondo' })).toBe('Berlin')
  })

  it('null cuando no hay modelo mapeado', () => {
    expect(productModelName({ id: 'lienzo' })).toBeNull()
  })
})
