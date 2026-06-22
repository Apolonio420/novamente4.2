import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { addLeadActivity, getLeadById } from '@/lib/partners/leads'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getRequestTenant(request)
  if (!result) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const note = typeof body.note === 'string' ? body.note.trim() : ''
  if (!note || note.length > 2_000) {
    return NextResponse.json({ error: 'La nota debe tener entre 1 y 2000 caracteres' }, { status: 400 })
  }

  const lead = await getLeadById(result.tenant.id, id)
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  const activity = await addLeadActivity(result.tenant.id, id, result.userId, 'note', note)
  if (!activity) return NextResponse.json({ error: 'No se pudo guardar la nota' }, { status: 500 })

  return NextResponse.json({ activity }, { status: 201 })
}
