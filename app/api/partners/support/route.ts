import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { createTicket, getTickets } from '@/lib/partners/support'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'support:read')
    if (!auth.ok) return auth.response

    const url = new URL(request.url)
    const status = url.searchParams.get('status') as any

    const tickets = await getTickets(auth.tenant.id, status || undefined)
    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('GET /api/partners/support error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'support:write')
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { subject, description, category } = body

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Asunto y descripcion son requeridos' },
        { status: 400 }
      )
    }

    const validCategories = ['general', 'billing', 'technical', 'feature_request']
    const ticketCategory = validCategories.includes(category) ? category : 'general'

    const ticket = await createTicket(
      auth.tenant.id,
      subject,
      description,
      ticketCategory,
      auth.tenant.plan
    )

    if (!ticket) {
      return NextResponse.json(
        { error: 'Error al crear el ticket' },
        { status: 500 }
      )
    }

    // Auto-triage DISABLED — was hallucinating implementations and falsely resolving tickets
    // const triageUrl = process.env.PLATFORM_TRIAGE_URL
    // if (triageUrl) {
    //   fetch(triageUrl, { headers: { 'x-cron-secret': process.env.CRON_SECRET || '' } }).catch(() => {})
    // }

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('POST /api/partners/support error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
