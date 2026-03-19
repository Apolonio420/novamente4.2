import { NextRequest, NextResponse } from 'next/server'
import { getTenantById } from '@/lib/partners/tenant'
import { getPlanFeatures } from '@/lib/partners/plans'
import { getPublishedProducts } from '@/lib/partners/catalog'
import { generateMetaCommerceTsv } from '@/lib/partners/feed-generator'

/**
 * GET /api/partners/feed/meta/[tenantId]
 * Public endpoint — returns Meta Commerce TSV feed.
 * Only available for Pro plan tenants.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  try {
    const { tenantId } = await params

    const tenant = await getTenantById(tenantId)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
    }

    const features = getPlanFeatures(tenant.plan)
    if (!features.feedExport) {
      return NextResponse.json(
        { error: 'Feed export requiere plan Pro' },
        { status: 403 },
      )
    }

    const products = await getPublishedProducts(tenant.id)

    const tsv = generateMetaCommerceTsv(
      { name: tenant.name, slug: tenant.slug },
      products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        images: p.images,
        category: p.category,
        currency: p.currency,
        availability: p.availability,
        brand: p.brand,
      })),
    )

    return new NextResponse(tsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/tab-separated-values; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('GET /api/partners/feed/meta/[tenantId] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
