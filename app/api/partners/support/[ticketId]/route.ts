import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { getTicketById, addMessage, updateTicketStatus } from '@/lib/partners/support'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const auth = await requireTenantPermission(request, 'support:read')
    if (!auth.ok) return auth.response

    const { ticketId } = await params
    const ticket = await getTicketById(ticketId, auth.tenant.id)
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('GET /api/partners/support/[ticketId] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const auth = await requireTenantPermission(request, 'support:write')
    if (!auth.ok) return auth.response

    const { ticketId } = await params

    // Verify ticket belongs to tenant
    const ticket = await getTicketById(ticketId, auth.tenant.id)
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { message } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
    }

    const msg = await addMessage(
      auth.tenant.id,
      ticketId,
      'partner',
      auth.tenant.name,
      message.trim()
    )

    if (!msg) {
      return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
    }

    return NextResponse.json({ message: msg }, { status: 201 })
  } catch (error) {
    console.error('POST /api/partners/support/[ticketId] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const auth = await requireTenantPermission(request, 'support:write')
    if (!auth.ok) return auth.response

    const { ticketId } = await params

    // Verify ticket belongs to tenant
    const existing = await getTicketById(ticketId, auth.tenant.id)
    if (!existing) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { status } = body

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado invalido' }, { status: 400 })
    }

    const updated = await updateTicketStatus(auth.tenant.id, ticketId, status)
    if (!updated) {
      return NextResponse.json({ error: 'Error al actualizar ticket' }, { status: 500 })
    }

    return NextResponse.json({ ticket: updated })
  } catch (error) {
    console.error('PATCH /api/partners/support/[ticketId] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
