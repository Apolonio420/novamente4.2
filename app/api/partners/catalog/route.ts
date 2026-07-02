import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { getAllProducts, createProduct, countProducts } from '@/lib/partners/catalog'
import { canAddProduct } from '@/lib/partners/plans'
import { validatePartnerProductForCreation } from '@/lib/partners/product-policy'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'catalog:read')
    if (!auth.ok) return auth.response

    const products = await getAllProducts(auth.tenant.id)
    const count = products.length

    return NextResponse.json({
      products,
      count,
      plan: auth.tenant.plan,
      maxProducts: auth.tenant.max_products,
    })
  } catch (error) {
    console.error('GET /api/partners/catalog error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'catalog:write')
    if (!auth.ok) return auth.response

    const tenant = auth.tenant
    const currentCount = await countProducts(tenant.id)

    if (!canAddProduct(tenant.plan, currentCount)) {
      return NextResponse.json(
        {
          error: `Limite de productos alcanzado para el plan ${tenant.plan}. Actualiza tu plan para agregar mas.`,
        },
        { status: 403 },
      )
    }

    const body = await request.json()

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    // Policy: solo prendas del catalogo Novamente — bloquea toallones, ropa de cama,
    // accesorios no textiles y cualquier producto que el partner haya producido aparte.
    const policy = validatePartnerProductForCreation({
      name: body.name,
      description: body.description,
      category: body.category,
    })
    if (!policy.ok) {
      return NextResponse.json({ error: policy.reason }, { status: 422 })
    }

    const product = await createProduct(tenant.id, {
      name: body.name.trim(),
      description: body.description || undefined,
      category: body.category || undefined,
      price: body.price != null ? Number(body.price) : undefined,
      images: Array.isArray(body.images) ? body.images : undefined,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      collection: body.collection || undefined,
      metadata: body.metadata || undefined,
    })

    if (!product) {
      return NextResponse.json({ error: 'No se pudo crear el producto' }, { status: 500 })
    }

    // Fire-and-forget: set first_product_draft_at once
    ;(supabaseAdmin as any)
      .from('tenants')
      .update({ first_product_draft_at: new Date().toISOString() })
      .eq('id', tenant.id)
      .is('first_product_draft_at', null)

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('POST /api/partners/catalog error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
