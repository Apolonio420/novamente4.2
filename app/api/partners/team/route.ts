/**
 * Team management for a tenant. Owner-only writes (owner→operator/viewer).
 *   GET    — list members (team:read)
 *   POST   — invite { email, role: 'operator'|'viewer' } (team:manage)
 *   DELETE — remove { membershipId } (team:manage)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { listTeam, inviteMember, removeMember } from '@/lib/partners/team'

export async function GET(request: NextRequest) {
  const auth = await requireTenantPermission(request, 'team:read')
  if (!auth.ok) return auth.response
  const members = await listTeam(auth.tenant.id)
  return NextResponse.json({ members })
}

export async function POST(request: NextRequest) {
  const auth = await requireTenantPermission(request, 'team:manage')
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const result = await inviteMember(auth.tenant.id, auth.userId, body.email, body.role)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true, membershipId: result.membershipId, pending: result.pending })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireTenantPermission(request, 'team:manage')
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const membershipId = body.membershipId || request.nextUrl.searchParams.get('membershipId')
  if (!membershipId) return NextResponse.json({ error: 'Falta membershipId' }, { status: 400 })

  const result = await removeMember(auth.tenant.id, membershipId)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true })
}
