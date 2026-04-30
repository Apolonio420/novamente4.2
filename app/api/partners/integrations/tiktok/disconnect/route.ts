import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ctx = await getRequestTenant(req)
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const meta = { ...((ctx.tenant.metadata ?? {}) as Record<string, unknown>) }
  delete meta.tiktok_integration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin as any).from('tenants').update({ metadata: meta }).eq('id', ctx.tenant.id)
  if (error) {
    return NextResponse.json({ error: 'Disconnect failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
