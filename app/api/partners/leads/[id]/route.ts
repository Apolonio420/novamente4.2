import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { addLeadActivity, getLeadActivities, getLeadById, updateLead } from '@/lib/partners/leads'
import { getUserTenantRole } from '@/lib/partners/tenant'
import { isPartnersCrmEnabled } from '@/lib/partners/feature-flags'

const VALID_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTenantPermission(request, 'leads:read')
  if (!auth.ok) return auth.response
  if (!isPartnersCrmEnabled()) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { id } = await params
  const lead = await getLeadById(auth.tenant.id, id)
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  const activities = await getLeadActivities(auth.tenant.id, id)
  return NextResponse.json({ lead, activities })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireTenantPermission(request, 'leads:write')
    if (!auth.ok) return auth.response
    if (!isPartnersCrmEnabled()) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { status } = body

    if (status !== undefined && (!status || !VALID_STATUSES.includes(status))) {
      return NextResponse.json(
        { error: `Status invalido. Opciones: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      )
    }

    const existing = await getLeadById(auth.tenant.id, id)
    if (!existing) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

    const updates: Record<string, unknown> = {}
    if (status !== undefined) updates.status = status
    if ('assigned_user_id' in body) {
      const assigneeId = body.assigned_user_id || null
      if (assigneeId) {
        const membership = await getUserTenantRole(auth.tenant.id, assigneeId)
        if (!membership?.accepted_at) {
          return NextResponse.json({ error: 'La persona asignada no pertenece a esta marca' }, { status: 400 })
        }
      }
      updates.assigned_user_id = assigneeId
    }
    if ('next_action_at' in body) {
      if (body.next_action_at && Number.isNaN(Date.parse(String(body.next_action_at)))) {
        return NextResponse.json({ error: 'Fecha de próxima acción inválida' }, { status: 400 })
      }
      updates.next_action_at = body.next_action_at || null
    }
    if ('last_contacted_at' in body) {
      if (body.last_contacted_at && Number.isNaN(Date.parse(String(body.last_contacted_at)))) {
        return NextResponse.json({ error: 'Fecha de contacto inválida' }, { status: 400 })
      }
      updates.last_contacted_at = body.last_contacted_at || null
    }
    if ('estimated_value_ars' in body) {
      const amount = body.estimated_value_ars === null ? null : Number(body.estimated_value_ars)
      if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
        return NextResponse.json({ error: 'El valor estimado debe ser un monto positivo' }, { status: 400 })
      }
      updates.estimated_value_ars = amount
    }
    if ('lost_reason' in body) updates.lost_reason = body.lost_reason ? String(body.lost_reason).slice(0, 500) : null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay cambios para guardar' }, { status: 400 })
    }

    const lead = await updateLead(auth.tenant.id, id, updates as any)
    if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

    if (status !== undefined && status !== existing.status) {
      await addLeadActivity(auth.tenant.id, id, auth.userId, 'status_changed', null, {
        from: existing.status,
        to: status,
      })
    }
    if ('next_action_at' in updates) {
      await addLeadActivity(auth.tenant.id, id, auth.userId, 'next_action_set', null, {
        next_action_at: updates.next_action_at,
      })
    }
    if ('assigned_user_id' in updates && updates.assigned_user_id !== existing.assigned_user_id) {
      await addLeadActivity(auth.tenant.id, id, auth.userId, 'assignment_changed', null, {
        assigned_user_id: updates.assigned_user_id,
      })
    }
    if ('last_contacted_at' in updates) {
      await addLeadActivity(auth.tenant.id, id, auth.userId, 'contacted')
    }

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('PATCH /api/partners/leads/[id] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
