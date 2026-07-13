import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
// garment-pricing.server.ts trae `import 'server-only'`, que revienta fuera de
// un build real de Next (ver garment-pricing.server.test.ts / ledger.test.ts).
// Lo mockeamos recomputando desde el catálogo crudo (garment-pricing-data.ts,
// módulo de datos puro sin el guard) — mismo catálogo, mismo cálculo.
import {
  ALL_GARMENT_PRICING,
  GROWTH_TIER_DELTA_ARS,
  VOLUME_FIELD_BY_TIER,
  type GrowthTier,
} from '@/lib/partners/garment-pricing-data'

function planPriceFromData(
  garmentKey: string,
  plan: 'starter' | 'growth' | 'pro',
  tier: GrowthTier = 'partner',
): number | null {
  const pricing = ALL_GARMENT_PRICING[garmentKey]
  if (!pricing) return null
  if (plan === 'starter') return pricing[VOLUME_FIELD_BY_TIER[tier]] as number
  return pricing.cost + GROWTH_TIER_DELTA_ARS[tier]
}

vi.mock('@/lib/partners/garment-pricing.server', async () => {
  const data = await vi.importActual<typeof import('@/lib/partners/garment-pricing-data')>(
    '@/lib/partners/garment-pricing-data',
  )
  const getPartnerPlanPrice = (
    garmentKey: string,
    plan: 'starter' | 'growth' | 'pro',
    tier: keyof typeof data.GROWTH_TIER_DELTA_ARS = 'partner',
  ): number | null => {
    const pricing = data.ALL_GARMENT_PRICING[garmentKey]
    if (!pricing) return null
    if (plan === 'starter') return pricing[data.VOLUME_FIELD_BY_TIER[tier]] as number
    return pricing.cost + data.GROWTH_TIER_DELTA_ARS[tier]
  }
  return { ...data, getPartnerPlanPrice }
})

// Hallazgo [7] · REVIEW-caminos-de-plata-2026-07-03: POST /api/partners/orders
// con produce=true manda el pedido a producción REAL (sendToProduction) sin
// validar que partner_price cubra al menos el piso de precio del plan del
// tenant. Estos tests cubren el piso agregado en route.ts.

// `after()` corre después de responder — lo capturamos para poder esperarlo
// explícitamente en los tests que necesitan verificar el efecto (produce).
const { afterCallbacks } = vi.hoisted(() => ({ afterCallbacks: [] as Array<() => unknown> }))

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (fn: () => unknown) => {
      afterCallbacks.push(fn)
    },
  }
})

vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(),
}))
vi.mock('@/lib/partners/orders', () => ({
  createOrder: vi.fn(),
  getOrdersByTenant: vi.fn(),
  countOrdersByTenant: vi.fn(),
}))
vi.mock('@/lib/partners/production', () => ({
  sendToProduction: vi.fn(),
}))
vi.mock('@/lib/notifications', () => ({
  notifyPartnerOrder: vi.fn(),
  notifyTeamManualSale: vi.fn(),
}))

import { requireTenantPermission } from '@/lib/partners/permissions'
import { createOrder } from '@/lib/partners/orders'
import { sendToProduction } from '@/lib/partners/production'
import { notifyPartnerOrder, notifyTeamManualSale } from '@/lib/notifications'
import { POST } from './route'

const requirePermission = requireTenantPermission as ReturnType<typeof vi.fn>
const create = createOrder as ReturnType<typeof vi.fn>
const production = sendToProduction as ReturnType<typeof vi.fn>
const notifyPartner = notifyPartnerOrder as ReturnType<typeof vi.fn>
const notifyTeam = notifyTeamManualSale as ReturnType<typeof vi.fn>

const TENANT = { id: 'tenant-a', name: 'Tienda A', slug: 'tienda-a', currency: 'ARS', plan: 'starter' as const }

function req(body: unknown) {
  return new NextRequest('http://localhost/api/partners/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function flushAfter() {
  await Promise.all(afterCallbacks.map((fn) => fn()))
  afterCallbacks.length = 0
}

// Pisos reales para la prenda de prueba, según el tier de volumen del pedido:
// qty 1-4 → 'partner' (precio 1u) · qty 100+ → 'bulk' (mayorista).
const FLOOR_1U = planPriceFromData('aura-oversize-tshirt', 'starter', 'partner')!
const FLOOR_BULK = planPriceFromData('aura-oversize-tshirt', 'starter', 'bulk')!

const baseItem = {
  name: 'Remera Aura Oversize',
  quantity: 1,
  unit_price: 30000,
}

describe('POST /api/partners/orders — piso de precio en produce=true', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    afterCallbacks.length = 0
    requirePermission.mockResolvedValue({ ok: true, tenant: TENANT })
    create.mockResolvedValue({ id: 'order-1' })
    production.mockResolvedValue({ ok: true, pedido_numero: 'P-1' })
    notifyPartner.mockResolvedValue(undefined)
    notifyTeam.mockResolvedValue(undefined)
  })

  it('rechaza produce=true con partner_price=0 (piso no cubierto)', async () => {
    const response = await POST(
      req({ produce: true, items: [{ ...baseItem, partner_price: 0 }] }),
    )

    expect(response.status).toBe(400)
    expect(create).not.toHaveBeenCalled()
  })

  it('acepta produce=true cuando partner_price >= piso del plan (1u → tier partner)', async () => {
    const response = await POST(
      req({ produce: true, items: [{ ...baseItem, partner_price: FLOOR_1U }] }),
    )
    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledTimes(1)

    await flushAfter()
    expect(production).toHaveBeenCalledTimes(1)
  })

  it('rechaza produce=true de 1 unidad al precio mayorista bulk (el tier del piso sale de la cantidad)', async () => {
    // FLOOR_BULK < FLOOR_1U: con el piso fijo en 'bulk' esto pasaba y erosionaba
    // el margen del tier real en cada pedido chico.
    expect(FLOOR_BULK).toBeLessThan(FLOOR_1U)
    const response = await POST(
      req({ produce: true, items: [{ ...baseItem, partner_price: FLOOR_BULK }] }),
    )
    expect(response.status).toBe(400)
    expect(create).not.toHaveBeenCalled()
  })

  it('acepta produce=true de 100+ unidades al precio bulk', async () => {
    const response = await POST(
      req({ produce: true, items: [{ ...baseItem, quantity: 100, partner_price: FLOOR_BULK }] }),
    )
    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledTimes(1)

    await flushAfter()
    expect(production).toHaveBeenCalledTimes(1)
  })

  it('rechaza produce=true con garmentKey no resoluble contra el catálogo', async () => {
    const response = await POST(
      req({
        produce: true,
        items: [{ ...baseItem, name: 'Producto Desconocido XYZ', partner_price: 999999 }],
      }),
    )

    expect(response.status).toBe(400)
    expect(create).not.toHaveBeenCalled()
  })

  it('produce=false sigue aceptando partner_price=0 (no valida piso)', async () => {
    const response = await POST(
      req({ produce: false, items: [{ ...baseItem, partner_price: 0 }] }),
    )

    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledTimes(1)

    await flushAfter()
    expect(production).not.toHaveBeenCalled()
    expect(notifyTeam).toHaveBeenCalledTimes(1)
  })
})
