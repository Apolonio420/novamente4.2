/**
 * PATCH  /api/partners/catalog/[id]/variants/[variantId] — update a variant
 * DELETE /api/partners/catalog/[id]/variants/[variantId] — delete a variant
 * Tenant-scoped: the product must belong to the caller's tenant (else 404).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import {
  deleteVariant,
  listVariants,
  resolveProductCost,
  updateVariant,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const auth = await requireTenantPermission(request, 'catalog:write')
  if (!auth.ok) return auth.response
  const { id, variantId } = await params
  const body = await request.json().catch(() => ({}))

  const product = await getTenantProduct(id, auth.tenant.id)
  if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  const inputValidation = validateVariantInput(body, false)
  if (!inputValidation.ok) return NextResponse.json({ error: inputValidation.reason }, { status: 400 })

  if (product.status === 'published' && (body.price !== undefined || body.availability !== undefined)) {
    const variants = await listVariants(auth.tenant.id, id)
    const current = variants.find((variant) => variant.id === variantId)
    if (!current) return NextResponse.json({ error: 'Variante no encontrada' }, { status: 404 })

    const nextVariants = variants.map((variant) => variant.id === variantId
      ? {
          ...variant,
          price: body.price !== undefined ? body.price : variant.price,
          availability: body.availability !== undefined ? body.availability : variant.availability,
        }
      : variant)
    const gate = validateProductForPublish({
      price: product.price,
      cost: resolveProductCost(product.metadata, auth.tenant.plan),
      variants: nextVariants,
    })
    if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 400 })
  }

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

  const product = await getTenantProduct(id, auth.tenant.id)
  if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  if (product.status === 'published') {
    const variants = await listVariants(auth.tenant.id, id)
    const nextVariants = variants.filter((variant) => variant.id !== variantId)
    if (nextVariants.length === variants.length) {
      return NextResponse.json({ error: 'Variante no encontrada' }, { status: 404 })
    }
    const gate = validateProductForPublish({
      price: product.price,
      cost: resolveProductCost(product.metadata, auth.tenant.plan),
      variants: nextVariants,
    })
    if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 400 })
  }

  const result = await deleteVariant(auth.tenant.id, id, variantId)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true })
}
