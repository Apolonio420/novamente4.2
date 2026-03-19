import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySlug } from '@/lib/partners/tenant'
import { getPublishedProducts } from '@/lib/partners/catalog'

/**
 * GET /api/partners/catalog/public?slug=xxx
 * Public endpoint — no auth required.
 * Returns published products for a given storefront slug.
 */
export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'El parametro slug es obligatorio' },
        { status: 400 }
      )
    }

    const tenant = await getTenantBySlug(slug)

    if (!tenant || !tenant.storefront_published || tenant.status !== 'active') {
      return NextResponse.json(
        { error: 'Storefront no encontrada' },
        { status: 404 }
      )
    }

    const products = await getPublishedProducts(tenant.id)

    return NextResponse.json({
      tenant: {
        slug: tenant.slug,
        name: tenant.name,
        currency: tenant.currency,
        commerce_mode: tenant.commerce_mode,
      },
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category,
        price: p.price,
        compare_at_price: p.compare_at_price,
        currency: p.currency,
        images: p.images,
        tags: p.tags,
        availability: p.availability,
        collection: p.collection,
      })),
      count: products.length,
    })
  } catch (error) {
    console.error('GET /api/partners/catalog/public error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
