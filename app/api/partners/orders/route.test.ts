import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
// garment-pricing.server.ts trae `import 'server-only'`, que revienta fuera de
// un build real de Next (ver garment-pricing.server.test.ts / ledger.test.ts).
// Lo mockeamos delegando a la versión sin el guard — mismo catálogo, mismo cálculo.
import { getPartnerPlanPrice } from '@/lib/partners/garment-pricing'

vi.mock('@/lib/partners/garment-pricing.server', async () => {
  const real = await vi.importActual<typeof import('@/lib/partners/garment-pricing')>(
    '@/lib/partners/garment-pricing',
  )
  return real
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

// Piso real (tier 'bulk', el más barato del catálogo) para la prenda de prueba.
const FLOOR = getPartnerPlanPrice('aura-oversize-tshirt', 'starter', 'bulk')!

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

  it('acepta produce=true cuando partner_price >= piso del plan', async () => {
    const response = await POST(
      req({ produce: true, items: [{ ...baseItem, partner_price: FLOOR }] }),
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
