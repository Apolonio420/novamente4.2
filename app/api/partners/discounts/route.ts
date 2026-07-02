/**
 * /api/partners/discounts
 *
 * GET   — lista codigos del tenant
 * POST  — crea un codigo
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { listDiscountCodes, createDiscountCode } from '@/lib/partners/discounts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireTenantPermission(request, 'marketing:read')
  if (!auth.ok) return auth.response
  const codes = await listDiscountCodes(auth.tenant.id)
  return NextResponse.json({ codes })
}

export async function POST(request: NextRequest) {
  const auth = await requireTenantPermission(request, 'marketing:write')
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  if (!body || typeof body.code !== 'string') {
    return NextResponse.json({ error: 'Falta "code"' }, { status: 400 })
  }
  if (!['percentage', 'fixed'].includes(body.discount_type)) {
    return NextResponse.json({ error: 'discount_type debe ser percentage o fixed' }, { status: 400 })
  }
  const value = Number(body.discount_value)
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: 'discount_value debe ser positivo' }, { status: 400 })
  }
  if (body.discount_type === 'percentage' && value > 100) {
    return NextResponse.json({ error: 'Porcentaje no puede ser mayor a 100' }, { status: 400 })
  }

  const code = await createDiscountCode(auth.tenant.id, {
    code: body.code,
    description: body.description,
    discount_type: body.discount_type,
    discount_value: value,
    min_purchase_ars: Number(body.min_purchase_ars) || 0,
    max_uses: body.max_uses != null ? Number(body.max_uses) : null,
    starts_at: body.starts_at || null,
    ends_at: body.ends_at || null,
  })

  if (!code) {
    return NextResponse.json({ error: 'No se pudo crear el codigo (ya existe?)' }, { status: 422 })
  }
  return NextResponse.json({ code }, { status: 201 })
}
