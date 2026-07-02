import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireTenantPermission(req, 'marketing:write')
  if (!auth.ok) return auth.response
  const meta = { ...((auth.tenant.metadata ?? {}) as Record<string, unknown>) }
  delete meta.tiktok_integration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin as any).from('tenants').update({ metadata: meta }).eq('id', auth.tenant.id)
  if (error) {
    return NextResponse.json({ error: 'Disconnect failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
