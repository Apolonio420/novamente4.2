import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { calculateCompletenessScore } from '@/lib/partners/tenant'
import { countProducts } from '@/lib/partners/catalog'
import { countLeadsThisMonth } from '@/lib/partners/leads'
import { countOrdersByTenant } from '@/lib/partners/orders'
import { getDashboardTrends } from '@/lib/partners/analytics'

export async function GET(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)

    if (!result) {
      return NextResponse.json(
        { error: 'No autenticado o sin tenant asociado' },
        { status: 401 },
      )
    }

    const { tenant } = result

    // Fetch metrics and trends in parallel
    const [products, leads, orders, trends] = await Promise.all([
      countProducts(tenant.id),
      countLeadsThisMonth(tenant.id),
      countOrdersByTenant(tenant.id),
      getDashboardTrends(tenant.id),
    ])

    const score = calculateCompletenessScore(tenant)

    return NextResponse.json({
      products,
      leads,
      orders,
      score,
      trends,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo_url: tenant.logo_url,
        banner_url: tenant.banner_url,
        plan: tenant.plan,
        status: tenant.status,
        description: tenant.description,
        tagline: tenant.tagline,
        primary_color: tenant.primary_color,
        industry: tenant.industry,
        storefront_published: tenant.storefront_published,
        onboarding_completed: tenant.onboarding_completed,
      },
    })
  } catch (error) {
    console.error('GET /api/partners/dashboard error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
