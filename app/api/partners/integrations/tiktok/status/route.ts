import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'

export const dynamic = 'force-dynamic'

interface TikTokIntegration {
  access_token?: string
  open_id?: string | null
  scope?: string | null
  connected_at?: string | null
  expires_at?: string | null
}

export async function GET(req: NextRequest) {
  const ctx = await getRequestTenant(req)
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const meta = (ctx.tenant.metadata ?? {}) as { tiktok_integration?: TikTokIntegration }
  const integ = meta.tiktok_integration
  if (!integ?.access_token) {
    return NextResponse.json({ connected: false })
  }
  return NextResponse.json({
    connected: true,
    open_id: integ.open_id ?? null,
    scope: integ.scope ?? null,
    connected_at: integ.connected_at ?? null,
    expires_at: integ.expires_at ?? null,
  })
}
