import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { addLeadActivity, getLeadById } from '@/lib/partners/leads'
import { isPartnersCrmEnabled } from '@/lib/partners/feature-flags'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTenantPermission(request, 'leads:write')
  if (!auth.ok) return auth.response
  if (!isPartnersCrmEnabled()) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const note = typeof body.note === 'string' ? body.note.trim() : ''
  if (!note || note.length > 2_000) {
    return NextResponse.json({ error: 'La nota debe tener entre 1 y 2000 caracteres' }, { status: 400 })
  }

  const lead = await getLeadById(auth.tenant.id, id)
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  const activity = await addLeadActivity(auth.tenant.id, id, auth.userId, 'note', note)
  if (!activity) return NextResponse.json({ error: 'No se pudo guardar la nota' }, { status: 500 })

  return NextResponse.json({ activity }, { status: 201 })
}
