import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { updateLeadStatus } from '@/lib/partners/leads'

const VALID_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireTenantPermission(request, 'leads:write')
    if (!auth.ok) return auth.response

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Status invalido. Opciones: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      )
    }

    const success = await updateLeadStatus(auth.tenant.id, id, status)
    if (!success) {
      // Either the lead does not exist or it belongs to another tenant.
      // Return 404 either way — never reveal the existence of other tenants' leads.
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/partners/leads/[id] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
