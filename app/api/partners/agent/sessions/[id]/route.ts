import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { getAgentSession, getSessionMessages } from '@/lib/partners/agent'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await getRequestTenant(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const session = await getAgentSession(id)
    if (!session || session.tenant_id !== auth.tenant.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const messages = await getSessionMessages(id)

    return NextResponse.json({ session, messages })
  } catch (error) {
    console.error('Agent session detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 },
    )
  }
}
