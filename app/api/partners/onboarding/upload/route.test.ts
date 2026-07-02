import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { storage: {} } }))
vi.mock('@/lib/partners/permissions', () => ({ requireTenantPermission: vi.fn() }))

import { requireTenantPermission } from '@/lib/partners/permissions'
import { POST } from './route'

const requirePermission = requireTenantPermission as ReturnType<typeof vi.fn>

describe('onboarding upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requirePermission.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    })
  })

  it('rejects anonymous storage uploads before reading the form data', async () => {
    const response = await POST(new NextRequest('http://localhost/api/partners/onboarding/upload', {
      method: 'POST',
    }))

    expect(response.status).toBe(401)
    expect(requirePermission).toHaveBeenCalledWith(expect.anything(), 'designs:write')
  })
})
