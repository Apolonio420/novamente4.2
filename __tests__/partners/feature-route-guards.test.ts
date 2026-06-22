import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  requireTenantPermission: vi.fn(),
}))

vi.mock('@/lib/partners/permissions', () => ({ requireTenantPermission: mocks.requireTenantPermission }))
vi.mock('@/lib/partners/daily-attention', () => ({ getDailyAttention: vi.fn() }))
vi.mock('@/lib/partners/leads', () => ({
  addLeadActivity: vi.fn(),
  getLeadActivities: vi.fn(),
  getLeadById: vi.fn(),
  updateLead: vi.fn(),
}))
vi.mock('@/lib/partners/tenant', () => ({ getUserTenantRole: vi.fn() }))
vi.mock('@/lib/partners/orders', () => ({
  createOrderEvent: vi.fn(),
  getOrderById: vi.fn(async () => ({ id: 'order-1', tenant_id: 'tenant-1', status: 'pending' })),
  getOrderEvents: vi.fn(),
  updateOrder: vi.fn(async (_tenantId: string, _orderId: string, updates: Record<string, unknown>) => ({
    id: 'order-1', tenant_id: 'tenant-1', ...updates,
  })),
}))

import { GET as getAttention } from '@/app/api/partners/dashboard/attention/route'
import { PATCH as updateLead } from '@/app/api/partners/leads/[id]/route'
import { PUT as putOrder } from '@/app/api/partners/orders/[id]/route'

const flagNames = [
  'NEXT_PUBLIC_PARTNERS_CRM_ENABLED',
  'NEXT_PUBLIC_PARTNERS_COCKPIT_ENABLED',
  'NEXT_PUBLIC_PARTNERS_FULFILLMENT_ENABLED',
] as const

beforeEach(() => {
  mocks.requireTenantPermission.mockResolvedValue({
    ok: true,
    userId: 'user-1',
    role: 'owner',
    tenant: { id: 'tenant-1' },
  })
})

afterEach(() => {
  vi.clearAllMocks()
  for (const name of flagNames) delete process.env[name]
})

describe('Partner feature-gated routes', () => {
  it('returns 404 for cockpit actions while the cockpit rollout is disabled', async () => {
    process.env.NEXT_PUBLIC_PARTNERS_COCKPIT_ENABLED = 'false'

    const response = await getAttention(new NextRequest('http://localhost/api/partners/dashboard/attention'))
    expect(response.status).toBe(404)
  })

  it('returns 404 for CRM actions while the CRM rollout is disabled', async () => {
    process.env.NEXT_PUBLIC_PARTNERS_CRM_ENABLED = 'false'
    const request = new NextRequest('http://localhost/api/partners/leads/lead-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'contacted' }),
    })

    const response = await updateLead(request, { params: Promise.resolve({ id: 'lead-1' }) })
    expect(response.status).toBe(404)
  })

  it('rejects only fulfillment mutations while preserving the legacy orders endpoint', async () => {
    process.env.NEXT_PUBLIC_PARTNERS_FULFILLMENT_ENABLED = 'false'

    const response = await putOrder(
      { json: async () => ({ fulfillment_status: 'in_production' }) } as NextRequest,
      { params: Promise.resolve({ id: 'order-1' }) },
    )
    expect(response.status).toBe(404)

    const legacyResponse = await putOrder(
      { json: async () => ({ status: 'confirmed' }) } as NextRequest,
      { params: Promise.resolve({ id: 'order-1' }) },
    )
    expect(legacyResponse.status).toBe(200)
  })
})
