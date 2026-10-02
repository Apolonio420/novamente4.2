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
    expect(out.get(PID)).toEqual({ productId: PID, tenantId: 'tenant-1', dobleEstampa: true, color: 'Negro', colorOptions: [] })
  })

  it('con metadata.colors[] (plural) de UN solo color, lo usa como default aunque no haya metadata.color singular', async () => {
    h.state.result = {
      data: [
        { id: PID, tenant_id: 'tenant-1', metadata: { garmentKey: 'aldea-classic-tshirt', colors: [{ key: 'white', name: 'Blanco', hex: '#f5f5f5' }] } },
      ],
      error: null,
    }
    const out = await datosPartnerDeItems([PID])
    expect(out.get(PID)?.color).toBe('Blanco')
    expect(out.get(PID)?.colorOptions).toEqual([{ name: 'Blanco', code: '#f5f5f5', key: 'white', images: undefined }])
  })

  it('con metadata.colors[] de VARIOS colores, no elige default (no hay forma de adivinar cuál)', async () => {
    h.state.result = {
      data: [
        {
          id: PID,
          tenant_id: 'tenant-1',
          metadata: {
            garmentKey: 'aldea-classic-tshirt',
            colors: [
              { key: 'white', name: 'Blanco', hex: '#f5f5f5' },
              { key: 'black', name: 'Negro', hex: '#1a1a1a' },
            ],
          },
        },
      ],
      error: null,
    }
    const out = await datosPartnerDeItems([PID])
    expect(out.get(PID)?.color).toBeNull()
    expect(out.get(PID)?.colorOptions).toHaveLength(2)
  })

  it('resuelve metadata.colors[] "solo key" (bug from-design, la-blancq) contra el catálogo', async () => {
    h.state.result = {
      data: [
        { id: PID, tenant_id: 'tenant-1', metadata: { garmentKey: 'aldea-classic-tshirt', colors: [{ key: 'stone-wash', images: {} }] } },
      ],
      error: null,
    }
    const out = await datosPartnerDeItems([PID])
    expect(out.get(PID)?.color).toBe('Stone Wash')
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

describe('enriquecerItemPartner — metadata.colors[] plural (caso la-blancq, 01/10)', () => {
  const datosConOpciones = new Map([
    [
      PID,
      {
        productId: PID,
        tenantId: 'tenant-1',
        dobleEstampa: false,
        color: null as string | null,
        colorOptions: [
          { name: 'Blanco', code: '#f5f5f5', key: 'white' },
          { name: 'Stone Wash', code: '#9a9085', key: 'stone-wash' },
        ],
      },
    ],
  ])

  it('normaliza el `key` que mande el carrito al `name` canónico', () => {
    const out = enriquecerItemPartner({ partner_product_id: PID, product_color: 'stone-wash' }, datosConOpciones)
    expect(out.product_color).toBe('Stone Wash')
  })

  it('matchea por name sin distinguir mayúsculas/minúsculas', () => {
    const out = enriquecerItemPartner({ partner_product_id: PID, product_color: 'blanco' }, datosConOpciones)
    expect(out.product_color).toBe('Blanco')
  })

  it('con 1 solo color en colorOptions y el carrito sin color, usa ese color como default', () => {
    const unSoloColor = new Map([[PID, { productId: PID, tenantId: 'tenant-1', dobleEstampa: false, color: 'Blanco', colorOptions: [{ name: 'Blanco', code: '#f5f5f5', key: 'white' }] }]])
    const out = enriquecerItemPartner({ partner_product_id: PID, product_color: 'unknown' }, unSoloColor)
    expect(out.product_color).toBe('Blanco')
  })

  it('sin match posible, deja "unknown" (no bloquea la compra) y loguea con console.warn identificable', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const out = enriquecerItemPartner({ partner_product_id: PID, product_color: 'unknown', item_name: 'Buzo X' }, datosConOpciones)
    expect(out.product_color).toBe('unknown')
    expect(warnSpy).toHaveBeenCalledWith('[checkout] item sin color', expect.objectContaining({ partnerProductId: PID, itemName: 'Buzo X' }))
    warnSpy.mockRestore()
  })
})
