import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/partners/permissions', () => ({ requireTenantPermission: vi.fn() }))
vi.mock('@/lib/partners/orders', () => ({
  getOrderById: vi.fn(),
  getOrderEvents: vi.fn(),
  updateOrder: vi.fn(),
  createOrderEvent: vi.fn(),
}))
vi.mock('@/lib/partners/feature-flags', () => ({ isPartnersFulfillmentEnabled: () => false }))
vi.mock('@/lib/notifications', () => ({ notifyOrderShipped: vi.fn() }))

import { PUT } from './route'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { getOrderById, updateOrder } from '@/lib/partners/orders'

const existing = {
  id: 'o1', tenant_id: 't1', status: 'pending', notes: null, fulfillment_status: 'awaiting_art_approval',
  carrier: null, tracking_number: null, tracking_url: null,
}

function put(body: Record<string, unknown>) {
  const req = new NextRequest('http://localhost/api/partners/orders/o1', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
  return PUT(req, { params: Promise.resolve({ id: 'o1' }) })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireTenantPermission).mockResolvedValue({ ok: true, tenant: { id: 't1' }, userId: 'u1' } as any)
  vi.mocked(getOrderById).mockResolvedValue(existing as any)
  vi.mocked(updateOrder).mockImplementation(async (_t, _id, updates) => ({ ...existing, ...updates }) as any)
})

describe('PUT /api/partners/orders/[id] — payment_status no existe en partner_orders', () => {
  it('ignora payment_status: si es lo único que viene, 400 sin tocar la base', async () => {
    const res = await put({ payment_status: 'approved' })

    expect(res.status).toBe(400)
    expect(updateOrder).not.toHaveBeenCalled()
  })

  it('actualiza el resto de los campos sin mandar payment_status (si no, PGRST204)', async () => {
    const res = await put({ payment_status: 'approved', notes: 'pagó por transferencia' })

    expect(res.status).toBe(200)
    expect(updateOrder).toHaveBeenCalledTimes(1)
    const updates = vi.mocked(updateOrder).mock.calls[0][2] as Record<string, unknown>
    expect(updates).toEqual({ notes: 'pagó por transferencia' })
    expect(updates).not.toHaveProperty('payment_status')
  })
})
