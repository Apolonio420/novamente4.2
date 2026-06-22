import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: {} }))
vi.mock('@/lib/partners/tenant', () => ({
  createTenant: vi.fn(),
  updateTenant: vi.fn(),
  addTenantUser: vi.fn(),
  getTenantBySlug: vi.fn(),
}))
vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(),
}))

import { requireTenantPermission } from '@/lib/partners/permissions'
import { updateTenant } from '@/lib/partners/tenant'
import { POST } from './route'

const requirePermission = requireTenantPermission as ReturnType<typeof vi.fn>
const update = updateTenant as ReturnType<typeof vi.fn>

function request(step: number) {
  return new NextRequest('http://localhost/api/partners/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      step,
      tenantId: 'tenant-b',
      data: step === 7 ? { plan: 'pro' } : {},
    }),
  })
}

describe('protected onboarding steps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requirePermission.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    })
  })

  it.each([
    [2, 'settings:write'],
    [7, 'billing:manage'],
    [8, 'settings:write'],
    [9, 'settings:write'],
  ])('rejects anonymous mutation at step %s', async (step, permission) => {
    const response = await POST(request(step))

    expect(response.status).toBe(401)
    expect(requirePermission).toHaveBeenCalledWith(expect.anything(), permission)
    expect(update).not.toHaveBeenCalled()
  })
})
