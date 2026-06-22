import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const h = vi.hoisted(() => ({
  preferenceCreate: vi.fn(),
  recurringCreate: vi.fn(),
  requirePermission: vi.fn(),
  updateTenant: vi.fn(),
  getUsdToArs: vi.fn(),
}))

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: class MercadoPagoConfig {},
  Preference: class Preference {
    create = h.preferenceCreate
  },
}))
vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: h.requirePermission,
}))
vi.mock('@/lib/partners/subscription', () => ({
  createRecurringSubscription: h.recurringCreate,
}))
vi.mock('@/lib/partners/currency', () => ({
  getUsdToArs: h.getUsdToArs,
}))
// The subscribe route must not write a tenant before an annual payment is
// approved. Keeping a mocked writer makes that invariant explicit.
vi.mock('@/lib/partners/tenant', () => ({
  updateTenant: h.updateTenant,
}))

import { POST } from './route'

const ownerTenant = {
  id: 'tenant-owner',
  email: 'owner@example.com',
  name: 'Marca Owner',
  slug: 'marca-owner',
  plan: 'starter',
}

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/partners/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/partners/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.requirePermission.mockResolvedValue({ ok: true, tenant: ownerTenant })
    h.getUsdToArs.mockResolvedValue(1000)
    h.preferenceCreate.mockResolvedValue({ id: 'pref-1', init_point: 'https://mp.example/init' })
    h.recurringCreate.mockResolvedValue({
      ok: true,
      preapproval_id: 'pre-1',
      init_point: 'https://mp.example/recurring',
      price_ars: 50000,
      price_usd: 50,
    })
  })

  it('rechaza una solicitud anónima antes de crear un checkout', async () => {
    h.requirePermission.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    })

    const response = await POST(request({ tenantId: 'tenant-victim', plan: 'pro', billingCycle: 'annual' }))

    expect(response.status).toBe(401)
    expect(h.requirePermission).toHaveBeenCalledWith(expect.anything(), 'billing:manage')
    expect(h.preferenceCreate).not.toHaveBeenCalled()
    expect(h.recurringCreate).not.toHaveBeenCalled()
  })

  it('ignora tenantId del body y crea la suscripción sólo para el tenant autorizado', async () => {
    const response = await POST(request({ tenantId: 'tenant-victim', plan: 'growth', billingCycle: 'monthly' }))

    expect(response.status).toBe(200)
    expect(h.recurringCreate).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: ownerTenant.id,
      tenantEmail: ownerTenant.email,
      plan: 'growth',
    }))
    expect(h.recurringCreate).not.toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-victim' }))
  })

  it('anual pre-pago no persiste plan/ciclo/vencimiento y deja activación al webhook', async () => {
    const response = await POST(request({ tenantId: 'tenant-victim', plan: 'pro', billingCycle: 'annual' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.payment_pending).toBe(true)
    expect(data.expires_at).toBeUndefined()
    expect(h.updateTenant).not.toHaveBeenCalled()
    expect(h.preferenceCreate).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({
        external_reference: expect.stringMatching(/^partner_sub_tenant-owner_\d+_annual_pro$/),
      }),
    }))
  })
})
