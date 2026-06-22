/**
 * PATCH  /api/partners/catalog/[id]/variants/[variantId] — update a variant
 * DELETE /api/partners/catalog/[id]/variants/[variantId] — delete a variant
 * Tenant-scoped: the product must belong to the caller's tenant (else 404).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { updateVariant, deleteVariant } from '@/lib/partners/variants'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const auth = await requireTenantPermission(request, 'catalog:write')
  if (!auth.ok) return auth.response
  const { id, variantId } = await params
  const body = await request.json().catch(() => ({}))
  const result = await updateVariant(auth.tenant.id, id, variantId, body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ variant: result.variant })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const auth = await requireTenantPermission(request, 'catalog:write')
  if (!auth.ok) return auth.response
  const { id, variantId } = await params
  const result = await deleteVariant(auth.tenant.id, id, variantId)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true })
}
