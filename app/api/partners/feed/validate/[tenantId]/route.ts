import { NextRequest, NextResponse } from 'next/server'
import { getTenantById } from '@/lib/partners/tenant'
import { getPlanFeatures } from '@/lib/partners/plans'
import { getPublishedProducts } from '@/lib/partners/catalog'
import { validateFeedProducts } from '@/lib/partners/feed-generator'

/**
 * GET /api/partners/feed/validate/[tenantId]
 * Validates feed data for a tenant.
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

    const issues = validateFeedProducts(
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

    const feedReady = products.filter(
      (p) => p.price && p.price > 0 && p.images.length > 0,
    ).length

    return NextResponse.json({
      valid: issues.length === 0,
      products: products.length,
      feedReady,
      issues,
    })
  } catch (error) {
    console.error('GET /api/partners/feed/validate/[tenantId] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
