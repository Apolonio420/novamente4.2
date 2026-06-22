/**
 * GET  /api/partners/catalog/[id]/variants — list variants of a product
 * POST /api/partners/catalog/[id]/variants — create a variant
 * Tenant-scoped: the product must belong to the caller's tenant (else 404).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import {
  createVariant,
  listVariants,
  resolveProductCost,
  validateProductForPublish,
  validateVariantInput,
} from '@/lib/partners/variants'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getTenantProduct(productId: string, tenantId: string) {
  const { data } = await (supabaseAdmin as any)
    .from('partner_products')
    .select('id, status, price, metadata')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .single()
  return data
}

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

  const product = await getTenantProduct(id, auth.tenant.id)
  if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  const inputValidation = validateVariantInput(body)
  if (!inputValidation.ok) return NextResponse.json({ error: inputValidation.reason }, { status: 400 })

  if (product.status === 'published') {
    const variants = await listVariants(auth.tenant.id, id)
    const gate = validateProductForPublish({
      price: product.price,
      cost: resolveProductCost(product.metadata, auth.tenant.plan),
      variants: [...variants, { availability: body.availability ?? 'available', price: body.price ?? null }],
    })
    if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 400 })
  }

  const result = await createVariant(auth.tenant.id, id, body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ variant: result.variant })
}
