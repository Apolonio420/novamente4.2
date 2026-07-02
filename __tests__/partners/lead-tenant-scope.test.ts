import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  lead: null as any,
  updateLead: vi.fn(),
  addLeadActivity: vi.fn(),
}))

vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(async () => ({
    ok: true,
    userId: 'user-owner-a',
    tenant: { id: 'tenant-a', slug: 'marca-a' },
    role: 'owner',
  })),
}))

vi.mock('@/lib/partners/leads', () => ({
  getLeadById: vi.fn(async (_tenantId: string, _leadId: string) => state.lead),
  getLeadActivities: vi.fn(async () => []),
  updateLead: (...args: unknown[]) => state.updateLead(...args),
  addLeadActivity: (...args: unknown[]) => state.addLeadActivity(...args),
}))

import { PATCH } from '@/app/api/partners/leads/[id]/route'

function request(body: unknown) {
  return new NextRequest('http://localhost:3000/api/partners/leads/lead-x', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/partners/leads/[id] — tenant scope', () => {
  beforeEach(() => {
    state.lead = null
    state.updateLead.mockReset()
    state.addLeadActivity.mockReset()
  })

  it('returns 404 and does not update a lead outside the active tenant', async () => {
    const response = await PATCH(request({ status: 'contacted' }), { params: Promise.resolve({ id: 'lead-x' }) })
    expect(response.status).toBe(404)
    expect(state.updateLead).not.toHaveBeenCalled()
  })

  it('updates only the lead resolved for the active tenant and records the state change', async () => {
    state.lead = { id: 'lead-x', tenant_id: 'tenant-a', status: 'new', assigned_user_id: null }
    state.updateLead.mockResolvedValue({ ...state.lead, status: 'contacted' })
    state.addLeadActivity.mockResolvedValue({ id: 'activity-1' })

    const response = await PATCH(request({ status: 'contacted', estimated_value_ars: 25000 }), { params: Promise.resolve({ id: 'lead-x' }) })
    expect(response.status).toBe(200)
    expect(state.updateLead).toHaveBeenCalledWith('tenant-a', 'lead-x', {
      status: 'contacted', estimated_value_ars: 25000,
    })
    expect(state.addLeadActivity).toHaveBeenCalledWith('tenant-a', 'lead-x', 'user-owner-a', 'status_changed', null, {
      from: 'new', to: 'contacted',
    })
  })
})
