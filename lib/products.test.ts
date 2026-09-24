import { describe, it, expect } from 'vitest'
import { getPublishableProducts } from './products'

// Confirma que un nombre "editado" (override de product_names, ver
// PLAN-NOMBRES-DESCRIPTIVOS.md Opción A) llega al título del feed de Meta
// (app/meta/catalog(.tsv)/route.ts consumen getPublishableProducts).
describe('getPublishableProducts — nombres descriptivos', () => {
  it('sin overrides usa la tabla hardcodeada', () => {
    const products = getPublishableProducts()
    const aura = products.find((p) => p.id === 'aura-tshirt-blanco')
    expect(aura?.title).toBe('Remera oversize - Blanco')
  })

  it('con overrides, el título del feed refleja el nombre editado en Supabase', () => {
    const overrides = { aura_oversize_tshirt: { modelo: 'Aura', descriptivo: 'Remera oversize XL' } }
    const products = getPublishableProducts(overrides)
    const aura = products.find((p) => p.id === 'aura-tshirt-blanco')
    expect(aura?.title).toBe('Remera oversize XL - Blanco')
  })
})
