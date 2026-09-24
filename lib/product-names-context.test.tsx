import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { ProductNamesProvider, useProductNames } from './product-names-context'

// Componentes cliente (GarmentSelector, ProductsFilter, DesignCanvas, etc.)
// consumen useProductNames(). El default del contexto (sin Provider) tiene
// que comportarse exactamente igual que la tabla hardcodeada — así el
// bundle nunca rompe si algún componente se renderiza sin el layout raíz
// (tests, Storybook, un componente movido de lugar).
describe('useProductNames — default sin Provider', () => {
  it('funciona sin Provider (usa la tabla hardcodeada)', () => {
    const { result } = renderHook(() => useProductNames())
    expect(result.current.productDisplayName({ id: 'aura-tshirt-blanco', color: 'Blanco' })).toBe(
      'Remera oversize - Blanco',
    )
    expect(result.current.productModelName({ id: 'aldea-tshirt-negro' })).toBe('Aldea')
  })
})

describe('useProductNames — con ProductNamesProvider', () => {
  it('aplica los overrides que le pasa el layout server', () => {
    const overrides = { aura_oversize_tshirt: { modelo: 'Aura', descriptivo: 'Remera oversize renovada' } }
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProductNamesProvider overrides={overrides}>{children}</ProductNamesProvider>
    )
    const { result } = renderHook(() => useProductNames(), { wrapper })
    expect(result.current.productDisplayName({ id: 'aura-tshirt-blanco' })).toBe('Remera oversize renovada')
  })
})
