import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Loader de overrides de nombres descriptivos (product_names en Supabase).
 * Ver PLAN-NOMBRES-DESCRIPTIVOS.md — Opción A. Todo esto tiene que funcionar
 * SIN que la tabla exista todavía: el loader nunca tira, cae al fallback
 * ({} = usar la tabla hardcodeada de lib/product-names.ts) ante cualquier
 * error, tabla ausente o fila vacía.
 */

const fromMock = vi.fn()

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: (...args: unknown[]) => fromMock(...args) },
}))

function queryResult(result: { data: unknown; error: unknown }) {
  return {
    select: () => ({
      eq: () => Promise.resolve(result),
    }),
  }
}

describe('loadProductNameOverrides', () => {
  beforeEach(async () => {
    vi.resetModules()
    fromMock.mockReset()
    delete process.env.PRODUCT_NAMES_TEST_OVERRIDE_JSON
  })

  afterEach(() => {
    delete process.env.PRODUCT_NAMES_TEST_OVERRIDE_JSON
  })

  it('tabla ausente (error de Supabase) -> {} (fallback hardcodeado)', async () => {
    fromMock.mockReturnValue(
      queryResult({ data: null, error: { message: 'relation "product_names" does not exist' } }),
    )
    const { loadProductNameOverrides } = await import('./product-names-db')
    const overrides = await loadProductNameOverrides()
    expect(overrides).toEqual({})
  })

  it('data vacía -> {}', async () => {
    fromMock.mockReturnValue(queryResult({ data: [], error: null }))
    const { loadProductNameOverrides } = await import('./product-names-db')
    const overrides = await loadProductNameOverrides()
    expect(overrides).toEqual({})
  })

  it('fila con campos vacíos se descarta, fila válida se mantiene', async () => {
    fromMock.mockReturnValue(
      queryResult({
        data: [
          { key: 'aura_oversize_tshirt', modelo: 'Aura', descriptivo: 'Remera oversize nueva', activo: true },
          { key: 'aldea_classic_fit', modelo: '', descriptivo: '', activo: true },
          { key: '', modelo: 'X', descriptivo: 'Y', activo: true },
        ],
        error: null,
      }),
    )
    const { loadProductNameOverrides } = await import('./product-names-db')
    const overrides = await loadProductNameOverrides()
    expect(overrides).toEqual({
      aura_oversize_tshirt: { modelo: 'Aura', descriptivo: 'Remera oversize nueva' },
    })
  })

  it('excepción inesperada del cliente Supabase -> {} (nunca tira)', async () => {
    fromMock.mockImplementation(() => {
      throw new Error('network down')
    })
    const { loadProductNameOverrides } = await import('./product-names-db')
    await expect(loadProductNameOverrides()).resolves.toEqual({})
  })

  it('cachea por TTL: una segunda llamada no vuelve a consultar Supabase', async () => {
    fromMock.mockReturnValue(
      queryResult({
        data: [{ key: 'aura_oversize_tshirt', modelo: 'Aura', descriptivo: 'Remera oversize', activo: true }],
        error: null,
      }),
    )
    const { loadProductNameOverrides } = await import('./product-names-db')
    await loadProductNameOverrides()
    await loadProductNameOverrides()
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it('hook de test PRODUCT_NAMES_TEST_OVERRIDE_JSON pisa la DB sin escribir nada', async () => {
    process.env.PRODUCT_NAMES_TEST_OVERRIDE_JSON = JSON.stringify({
      aura_oversize_tshirt: { modelo: 'Aura', descriptivo: 'Remera oversize TEST' },
    })
    fromMock.mockReturnValue(
      queryResult({
        data: [{ key: 'aura_oversize_tshirt', modelo: 'Aura', descriptivo: 'Remera oversize DB', activo: true }],
        error: null,
      }),
    )
    const { loadProductNameOverrides } = await import('./product-names-db')
    const overrides = await loadProductNameOverrides()
    expect(overrides.aura_oversize_tshirt?.descriptivo).toBe('Remera oversize TEST')
    expect(fromMock).not.toHaveBeenCalled()
  })
})
