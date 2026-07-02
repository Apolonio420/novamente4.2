import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { resolveRequestUser } from '@/lib/partners/permissions'
import { listUserTenants } from '@/lib/partners/team'

/**
 * GET /api/partners/tenants — the brands the caller can switch between.
 *  - Platform admins: every tenant (support).
 *  - Regular users: their own memberships (the multi-brand tenant selector).
 * The actual switch is performed by sending the chosen id in the x-tenant-id
 * header; resolveActiveTenant validates it against the caller's memberships.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveRequestUser(request)
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    if (user.isPlatformAdmin) {
      const { data, error } = await (supabaseAdmin as any)
        .from('tenants')
        .select('id, name, slug, logo_url, plan, status, email')
        .order('name')
      if (error) throw error
      return NextResponse.json({ tenants: data || [], isAdmin: true })
    }

    const tenants = await listUserTenants(user.userId)
    return NextResponse.json({ tenants, isAdmin: false })
  } catch (error) {
    console.error('GET /api/partners/tenants error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
