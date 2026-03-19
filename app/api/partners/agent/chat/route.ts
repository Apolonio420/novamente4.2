import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySlug } from '@/lib/partners/tenant'
import { PLAN_FEATURES } from '@/lib/partners/plans'
import {
  createAgentSession,
  getAgentSession,
  processMessage,
} from '@/lib/partners/agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantSlug, sessionId, message } = body

    if (!tenantSlug || !message) {
      return NextResponse.json(
        { error: 'tenantSlug and message are required' },
        { status: 400 },
      )
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'message must be a non-empty string' },
        { status: 400 },
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'message too long (max 2000 characters)' },
        { status: 400 },
      )
    }

    // 1. Resolve tenant
    const tenant = await getTenantBySlug(tenantSlug)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // 2. Validate Pro plan + chatbot enabled
    const features = PLAN_FEATURES[tenant.plan]
    if (!features.chatbot) {
      return NextResponse.json(
        { error: 'Chatbot not available on this plan' },
        { status: 403 },
      )
    }

    // 3. Resolve or create session
    let activeSessionId = sessionId

    if (activeSessionId) {
      // Validate session belongs to this tenant
      const session = await getAgentSession(activeSessionId)
      if (!session || session.tenant_id !== tenant.id) {
        // Invalid session — create new one
        activeSessionId = null
      } else if (session.status === 'closed') {
        // Closed session — create new one
        activeSessionId = null
      }
    }

    if (!activeSessionId) {
      const newSession = await createAgentSession(tenant.id)
      activeSessionId = newSession.id
    }

    // 4. Process message
    const response = await processMessage(tenant.id, activeSessionId, message.trim())

    return NextResponse.json({
      sessionId: activeSessionId,
      response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Agent chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 },
    )
  }
}
