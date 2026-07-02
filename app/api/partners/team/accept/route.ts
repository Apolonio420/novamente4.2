/**
 * POST /api/partners/team/accept — an invitee accepts a pending membership.
 * Body: { tenantId }. The caller is authenticated but may not yet be an accepted
 * member of the tenant, so this uses resolveRequestUser (not requireTenantPermission).
 */
import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestUser } from '@/lib/partners/permissions'
import { acceptInvitation } from '@/lib/partners/team'

export async function POST(request: NextRequest) {
  const user = await resolveRequestUser(request)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const tenantId = String(body.tenantId || '')
  if (!tenantId) return NextResponse.json({ error: 'Falta tenantId' }, { status: 400 })

  const accepted = await acceptInvitation(tenantId, user.userId)
  if (!accepted) {
    // No pending invitation for this user+tenant (or already accepted).
    return NextResponse.json({ error: 'No hay invitación pendiente' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
