import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySlug } from '@/lib/partners/tenant'
import { getPlanFeatures } from '@/lib/partners/plans'
import {
  getDesignConfig,
  getAvailableStyles,
  getAvailableGarments,
} from '@/lib/partners/design-engine'
import type { Plan } from '@/lib/partners/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const tenant = await getTenantBySlug(slug)

    if (!tenant || !tenant.storefront_published) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
    }

    const features = getPlanFeatures(tenant.plan as Plan)
    if (!features.storefrontDesigner) {
      return NextResponse.json({ error: 'No disponible en este plan' }, { status: 403 })
    }

    const config = await getDesignConfig(tenant.id)
    const styles = getAvailableStyles(config)
    const garments = getAvailableGarments(config)

    return NextResponse.json({
      styles: styles.map(s => ({ key: s.key, name: s.name, description: s.description })),
      garments: garments.map(g => ({ key: g.key, name: g.name, colors: g.colors })),
      brandName: tenant.name,
      primaryColor: tenant.primary_color,
    })
  } catch (error: any) {
    console.error('GET /api/storefront/[slug]/studio/config error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
