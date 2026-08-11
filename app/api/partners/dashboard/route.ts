import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { calculateCompletenessScore } from '@/lib/partners/tenant'
import { countProducts, countPublishedProducts } from '@/lib/partners/catalog'
import { countLeadsThisMonth } from '@/lib/partners/leads'
import { countOrdersByTenant } from '@/lib/partners/orders'
import { getDashboardTrends } from '@/lib/partners/analytics'
import { computeStorefrontHiddenReason } from '@/lib/partners/auto-publish'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
    const [products, publishedProducts, leads, orders, trends, designsResult] = await Promise.all([
      countProducts(tenant.id),
      countPublishedProducts(tenant.id),
      countLeadsThisMonth(tenant.id),
      countOrdersByTenant(tenant.id),
      getDashboardTrends(tenant.id),
      (supabaseAdmin as any)
        .from('partner_design_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id),
    ])

    const designs: number = designsResult?.count ?? 0

    const score = calculateCompletenessScore(tenant)

    // Motivo por el que el storefront no esta visible (null si ya lo esta) —
    // calculado del lado del server reusando la MISMA regla que decide el
    // auto-publish, asi el UI no reimplementa el criterio de branding minimo.
    const storefrontHiddenReason = computeStorefrontHiddenReason(tenant)

    // Set first_login_at once. IMPORTANTE: awaited — en serverless (Vercel) el
    // proceso puede congelarse apenas se devuelve la response, y una promesa
    // "fire-and-forget" sin await pierde la carrera contra ese freeze: nunca
    // llega a completar el UPDATE. Esto dejaba first_login_at en 0/148 en
    // prod pese a que el codigo "aparentaba" setearlo en cada primer request.
    if (!tenant.first_login_at) {
      const { error: firstLoginError } = await (supabaseAdmin as any)
        .from('tenants')
        .update({ first_login_at: new Date().toISOString() })
        .eq('id', tenant.id)
        .is('first_login_at', null)
      if (firstLoginError) {
        console.error('[dashboard] failed to set first_login_at', { tenantId: tenant.id, error: firstLoginError })
      }
    }

    return NextResponse.json({
      products,
      publishedProducts,
      storefrontHiddenReason,
      leads,
      orders,
      score,
      designs,
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
        onboarding_dismissed_business_model: tenant.onboarding_dismissed_business_model ?? false,
      },
    })
  } catch (error) {
    console.error('GET /api/partners/dashboard error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
