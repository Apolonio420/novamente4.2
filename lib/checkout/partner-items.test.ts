import { describe, it, expect, beforeEach, vi } from 'vitest'

// partner-items.ts importa esDobleEstampa de partner-cost.ts, que a su vez
// importa garment-pricing.server.ts ('server-only', tira fuera de Next server).
vi.mock('server-only', () => ({}))

const h = vi.hoisted(() => {
  const state = {
    inCalls: [] as any[][],
    result: { data: [] as any[], error: null as any },
  }
  const chain: any = {
    from: () => chain,
    select: () => chain,
    in: (field: string, values: any[]) => {
      state.inCalls.push(values)
      return chain
    },
    then: (resolve: any) => resolve(state.result),
  }
  return { chain, state }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.chain }))

import { datosPartnerDeItems, enriquecerItemPartner } from './partner-items'

beforeEach(() => {
  h.state.inCalls.length = 0
  h.state.result = { data: [], error: null }
})

const PID = 'aaaaaaaa-0000-4000-8000-000000000001'

describe('datosPartnerDeItems', () => {
  it('filtra ids que no son UUID válidos ANTES de consultar (no llegan a la query)', async () => {
    await datosPartnerDeItems(['no-es-un-uuid', PID, '', null, undefined, '12345'])
    expect(h.state.inCalls).toHaveLength(1)
    expect(h.state.inCalls[0]).toEqual([PID])
  })

  it('si no queda ningún id válido, ni siquiera consulta', async () => {
    await datosPartnerDeItems(['no-es-un-uuid', '123', null])
    expect(h.state.inCalls).toHaveLength(0)
  })

  it('arma el mapa con doble_estampa (via esDobleEstampa) y color desde partner_products.metadata', async () => {
    h.state.result = {
      data: [
        { id: PID, tenant_id: 'tenant-1', metadata: { color: ' Negro ', print: { front: { designUrl: 'f' }, back: { designUrl: 'b' } } } },
      ],
      error: null,
    }
    const out = await datosPartnerDeItems([PID])
    expect(out.get(PID)).toEqual({ productId: PID, tenantId: 'tenant-1', dobleEstampa: true, color: 'Negro' })
  })

  it('dedupea ids repetidos antes de consultar', async () => {
    await datosPartnerDeItems([PID, PID, PID])
    expect(h.state.inCalls[0]).toEqual([PID])
  })
})

describe('enriquecerItemPartner', () => {
  const datos = new Map([[PID, { productId: PID, tenantId: 'tenant-1', dobleEstampa: true, color: 'Negro' }]])

  it('producto encontrado: fija partner_product_id verificado y doble_estampa DEL PRODUCTO, aunque el carrito mande otro valor', () => {
    const item = { partner_product_id: PID, metadata: { doble_estampa: false }, product_color: 'unknown' }
    const out = enriquecerItemPartner(item, datos)
    expect(out.partner_product_id).toBe(PID)
    expect(out.metadata!.doble_estampa).toBe(true) // gana el producto, no lo que mandó el navegador
  })

  it('producto encontrado: usa el color del producto cuando el ítem trae "unknown" o vacío', () => {
    expect(enriquecerItemPartner({ partner_product_id: PID, product_color: 'unknown' }, datos).product_color).toBe('Negro')
    expect(enriquecerItemPartner({ partner_product_id: PID, product_color: '' }, datos).product_color).toBe('Negro')
  })

  it('producto encontrado: respeta el color del ítem si NO es "unknown"/vacío', () => {
    expect(enriquecerItemPartner({ partner_product_id: PID, product_color: 'Blanco' }, datos).product_color).toBe('Blanco')
  })

  it('producto NO encontrado: partner_product_id null y doble_estampa = arte del ítem (front+back)', () => {
    const conAmbos = enriquecerItemPartner({ partner_product_id: 'otro-id', front_design_url: 'f', back_design_url: 'b', metadata: {} as Record<string, unknown> }, datos)
    expect(conAmbos.partner_product_id).toBeNull()
    expect(conAmbos.metadata!.doble_estampa).toBe(true)

    const conUnoSolo = enriquecerItemPartner({ partner_product_id: 'otro-id', front_design_url: 'f', back_design_url: null as string | null, metadata: {} as Record<string, unknown> }, datos)
    expect(conUnoSolo.metadata!.doble_estampa).toBe(false)
  })
})
