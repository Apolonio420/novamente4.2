/**
 * GET  /api/partners/catalog/[id]/variants — list variants of a product
 * POST /api/partners/catalog/[id]/variants — create a variant
 * Tenant-scoped: the product must belong to the caller's tenant (else 404).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { listVariants, createVariant } from '@/lib/partners/variants'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenantPermission(request, 'catalog:read')
  if (!auth.ok) return auth.response
  const { id } = await params
  const variants = await listVariants(auth.tenant.id, id)
  return NextResponse.json({ variants })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTenantPermission(request, 'catalog:write')
  if (!auth.ok) return auth.response
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const result = await createVariant(auth.tenant.id, id, body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ variant: result.variant })
}
