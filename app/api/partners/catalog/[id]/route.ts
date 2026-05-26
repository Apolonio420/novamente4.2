import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { updateProduct, deleteProduct } from '@/lib/partners/catalog'
import { validatePartnerProductForCreation } from '@/lib/partners/product-policy'
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
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getProductById(id)

    if (!existing) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    if (existing.tenant_id !== result.tenant.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
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

    // Price required when publishing
    if (updates.status === 'published') {
      const resolvedPrice = updates.price !== undefined ? updates.price : existing.price
      if (!resolvedPrice || Number(resolvedPrice) <= 0) {
        return NextResponse.json(
          { error: 'Necesitás definir un precio antes de publicar este producto.' },
          { status: 400 },
        )
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
        .eq('id', result.tenant.id)
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
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getProductById(id)

    if (!existing) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    if (existing.tenant_id !== result.tenant.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
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
