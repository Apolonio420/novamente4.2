import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { updateProduct, deleteProduct } from '@/lib/partners/catalog'
import { validatePartnerProductForCreation } from '@/lib/partners/product-policy'
import {
  listVariants,
  needsPublishedProductValidation,
  resolveProductCost,
  validateProductForPublish,
} from '@/lib/partners/variants'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getProductById(productId: string) {
  const { data, error } = await (supabaseAdmin as any)
    .from('partner_products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error || !data) return null
  return data
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireTenantPermission(request, 'catalog:write')
    if (!auth.ok) return auth.response

    const { id } = await params
    const existing = await getProductById(id)

    // Not found OR belongs to another tenant → 404 (never reveal existence).
    if (!existing || existing.tenant_id !== auth.tenant.id) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const body = await request.json()

    // Only allow safe fields to be updated
    const allowedFields = [
      'name', 'description', 'category', 'subcategory', 'price',
      'compare_at_price', 'status', 'images', 'tags', 'collection',
      'seo_title', 'seo_description', 'sort_order', 'availability',
      'metadata',
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || (updates.name as string).trim().length === 0) {
        return NextResponse.json({ error: 'El nombre no puede estar vacio' }, { status: 400 })
      }
      // Regenerate slug if name changed
      updates.slug = (updates.name as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    }

    // A published product must keep passing the gate when price/cost changes,
    // not only on the first draft → published transition.
    if (needsPublishedProductValidation(existing.status, updates)) {
      const resolvedPrice = updates.price !== undefined ? Number(updates.price) : existing.price
      const resolvedMeta = (updates.metadata !== undefined ? updates.metadata : existing.metadata) as
        | Record<string, unknown>
        | null
      const cost = resolveProductCost(resolvedMeta, auth.tenant.plan)
      const variants = await listVariants(auth.tenant.id, id)
      const check = validateProductForPublish({ price: resolvedPrice, cost, variants })
      if (!check.ok) {
        return NextResponse.json({ error: check.reason }, { status: 400 })
      }
    }

    // Policy: revalidar SOLO los campos que el partner esta modificando, no los
    // valores legacy ya guardados. Esto permite que productos legacy (que no
    // pasarian la policy hoy) puedan editar otros campos o bajar de visibilidad
    // sin quedar bloqueados para siempre.
    // Ademas, si el unico cambio es bajar el status a hidden/draft/archived,
    // siempre permitirlo — un partner siempre debe poder ocultar su producto.
    const loweringVisibility = typeof updates.status === 'string'
      && ['hidden', 'draft', 'archived'].includes(updates.status as string)
    const touchesPolicyFields = updates.name !== undefined
      || updates.description !== undefined
      || updates.category !== undefined

    if (touchesPolicyFields && !loweringVisibility) {
      const policy = validatePartnerProductForCreation({
        name: (updates.name as string | undefined) ?? '',
        description: (updates.description as string | undefined) ?? '',
        category: (updates.category as string | undefined) ?? '',
      })
      if (!policy.ok) {
        return NextResponse.json({ error: policy.reason }, { status: 422 })
      }
    }

    const product = await updateProduct(id, updates)

    if (!product) {
      return NextResponse.json({ error: 'No se pudo actualizar el producto' }, { status: 500 })
    }

    // Fire-and-forget: set first_product_published_at once
    if (updates.status === 'published') {
      ;(supabaseAdmin as any)
        .from('tenants')
        .update({ first_product_published_at: new Date().toISOString() })
        .eq('id', auth.tenant.id)
        .is('first_product_published_at', null)
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('PUT /api/partners/catalog/[id] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireTenantPermission(request, 'catalog:write')
    if (!auth.ok) return auth.response

    const { id } = await params
    const existing = await getProductById(id)

    // Not found OR belongs to another tenant → 404 (never reveal existence).
    if (!existing || existing.tenant_id !== auth.tenant.id) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const success = await deleteProduct(id)

    if (!success) {
      return NextResponse.json({ error: 'No se pudo eliminar el producto' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/partners/catalog/[id] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
