'use client'

/**
 * Distribuye los overrides de nombres descriptivos (Supabase `product_names`,
 * ver PLAN-NOMBRES-DESCRIPTIVOS.md Opción A) a los componentes cliente que no
 * pueden llamar al loader de servidor (lib/product-names-db.ts) directamente.
 *
 * El layout raíz (server) hace `await loadProductNameOverrides()` y monta
 * `<ProductNamesProvider overrides={...}>` una sola vez. El valor default del
 * contexto es `{}` (= tabla hardcodeada, igual que hoy) para que cualquier
 * componente que se renderice sin Provider (tests, Storybook, etc.) siga
 * funcionando exactamente igual que antes de esta migración.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import {
  lookupProductName,
  productDisplayName,
  productModelName,
  type ProductNameLookupInput,
  type ProductNameOverrides,
} from './product-names'

const ProductNamesContext = createContext<ProductNameOverrides>({})

export function ProductNamesProvider({
  overrides,
  children,
}: {
  overrides: ProductNameOverrides
  children: ReactNode
}) {
  return <ProductNamesContext.Provider value={overrides}>{children}</ProductNamesContext.Provider>
}

/**
 * Hook para componentes cliente: mismas firmas que las funciones puras de
 * lib/product-names.ts, pero con los overrides de la DB ya aplicados.
 */
export function useProductNames() {
  const overrides = useContext(ProductNamesContext)
  return useMemo(
    () => ({
      lookupProductName: (input: ProductNameLookupInput) => lookupProductName(input, overrides),
      productModelName: (input: ProductNameLookupInput) => productModelName(input, overrides),
      productDisplayName: (input: ProductNameLookupInput) => productDisplayName(input, overrides),
    }),
    [overrides],
  )
}
