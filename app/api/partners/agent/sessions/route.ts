import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { getTenantSessions } from '@/lib/partners/agent'

export async function GET(request: NextRequest) {
  try {
    const auth = await getRequestTenant(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'active' | 'closed' | null

    const sessions = await getTenantSessions(
      auth.tenant.id,
      status || undefined,
    )

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Agent sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 },
    )
  }
}
