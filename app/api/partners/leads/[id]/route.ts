import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { updateLeadStatus } from '@/lib/partners/leads'

const VALID_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json(
        { error: 'No autenticado o sin tenant asociado' },
        { status: 401 },
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Status invalido. Opciones: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      )
    }

    const success = await updateLeadStatus(id, status)
    if (!success) {
      return NextResponse.json(
        { error: 'Error al actualizar el lead' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/partners/leads/[id] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
