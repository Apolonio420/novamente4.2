import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { getPlanFeatures } from '@/lib/partners/plans'
import {
  getVisitStats,
  getLeadConversionRate,
  getTopProducts,
  getTrafficSources,
  getFunnelData,
  getUtmPerformance,
} from '@/lib/partners/analytics-queries'

export async function GET(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { tenant } = result
    const features = getPlanFeatures(tenant.plan)

    if (features.analytics === 'none') {
      return NextResponse.json(
        { error: 'Analytics no disponible en tu plan. Actualizá a Growth para acceder.' },
        { status: 403 }
      )
    }

    const period = request.nextUrl.searchParams.get('period') || '7d'
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7

    // Basic analytics (Growth+)
    const [visits, conversion, topProducts, trafficSources] = await Promise.all([
      getVisitStats(tenant.id, days),
      getLeadConversionRate(tenant.id, days),
      getTopProducts(tenant.id, days),
      getTrafficSources(tenant.id, days),
    ])

    // Advanced analytics (Pro only)
    let funnel = null
    let utmCampaigns = null

    if (features.analytics === 'advanced') {
      ;[funnel, utmCampaigns] = await Promise.all([
        getFunnelData(tenant.id, days),
        getUtmPerformance(tenant.id, days),
      ])
    }

    return NextResponse.json({
      period,
      visits,
      conversion,
      topProducts,
      trafficSources,
      funnel,
      utmCampaigns,
    })
  } catch (error) {
    console.error('GET /api/partners/analytics error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
