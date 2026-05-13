import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { updateDiscountCode, deleteDiscountCode } from '@/lib/partners/discounts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getRequestTenant(request)
  if (!result) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const { id } = await params

  const body = await request.json().catch(() => ({}))
  const allowed = ['description', 'discount_value', 'min_purchase_ars', 'max_uses', 'starts_at', 'ends_at', 'active']
  const updates: Record<string, any> = {}
  for (const k of allowed) {
    if (k in body) updates[k] = body[k]
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  }
  const code = await updateDiscountCode(id, result.tenant.id, updates)
  if (!code) return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 404 })
  return NextResponse.json({ code })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getRequestTenant(request)
  if (!result) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const { id } = await params
  const ok = await deleteDiscountCode(id, result.tenant.id)
  if (!ok) return NextResponse.json({ error: 'No se pudo borrar' }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
