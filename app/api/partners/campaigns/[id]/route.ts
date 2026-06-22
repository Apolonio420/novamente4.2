import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { updateCampaign } from '@/lib/partners/campaigns'

const VALID_STATUSES = ['draft', 'active', 'paused', 'completed']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await getRequestTenant(request)
  if (!result) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim().slice(0, 120)
  if (body.status && VALID_STATUSES.includes(body.status)) updates.status = body.status
  if (body.budget_daily_ars !== undefined) {
    const budget = body.budget_daily_ars === null ? null : Number(body.budget_daily_ars)
    if (budget !== null && (!Number.isFinite(budget) || budget < 0)) return NextResponse.json({ error: 'Presupuesto inválido' }, { status: 400 })
    updates.budget_daily_ars = budget
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No hay cambios' }, { status: 400 })

  const { id } = await params
  const campaign = await updateCampaign(result.tenant.id, id, updates)
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
  return NextResponse.json({ campaign })
}
