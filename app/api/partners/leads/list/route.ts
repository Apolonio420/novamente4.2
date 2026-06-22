import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { getLeads, countLeadsThisMonth } from '@/lib/partners/leads'
import { getPlanFeatures } from '@/lib/partners/plans'

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
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const attentionOnly = searchParams.get('attention') === 'true'

    const [leads, totalThisMonth] = await Promise.all([
      getLeads(tenant.id, { status, limit, offset, attentionOnly }),
      countLeadsThisMonth(tenant.id),
    ])

    const features = getPlanFeatures(tenant.plan)

    return NextResponse.json({
      leads,
      totalThisMonth,
      maxPerMonth: features.maxLeadsPerMonth,
    })
  } catch (error) {
    console.error('GET /api/partners/leads/list error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
