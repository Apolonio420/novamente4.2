import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { createCampaign, listCampaigns } from '@/lib/partners/campaigns'
import { getUtmPerformance } from '@/lib/partners/analytics-queries'
import { supabaseAdmin } from '@/lib/supabase-admin'

const VALID_CHANNELS = ['meta', 'google', 'tiktok', 'other']

export async function GET(request: NextRequest) {
  const auth = await requireTenantPermission(request, 'marketing:read')
  if (!auth.ok) return auth.response

  const [campaigns, performance] = await Promise.all([
    listCampaigns(auth.tenant.id),
    getUtmPerformance(auth.tenant.id, 90),
  ])
  const byUtm = new Map(performance.map((item) => [item.campaign, item]))
  return NextResponse.json({ campaigns: campaigns.map((campaign) => ({ ...campaign, performance: byUtm.get(campaign.utm_campaign) || null })) })
}

export async function POST(request: NextRequest) {
  const auth = await requireTenantPermission(request, 'marketing:write')
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({}))

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const utmCampaign = typeof body.utm_campaign === 'string' ? body.utm_campaign.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-') : ''
  const destinationUrl = typeof body.destination_url === 'string' ? body.destination_url : ''
  const channel = typeof body.channel === 'string' ? body.channel : 'meta'
  const budget = body.budget_daily_ars === null || body.budget_daily_ars === undefined ? null : Number(body.budget_daily_ars)

  if (!name || !utmCampaign || !destinationUrl || !VALID_CHANNELS.includes(channel)) {
    return NextResponse.json({ error: 'Faltan datos válidos de campaña' }, { status: 400 })
  }
  if (!/^https?:\/\//.test(destinationUrl)) {
    return NextResponse.json({ error: 'La URL de destino debe ser http(s)' }, { status: 400 })
  }
  if (budget !== null && (!Number.isFinite(budget) || budget < 0)) {
    return NextResponse.json({ error: 'El presupuesto debe ser un monto positivo' }, { status: 400 })
  }

  const productId = typeof body.product_id === 'string' ? body.product_id : null
  if (productId) {
    const { data: product } = await (supabaseAdmin as any)
      .from('partner_products')
      .select('id')
      .eq('id', productId)
      .eq('tenant_id', auth.tenant.id)
      .maybeSingle()
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  const campaign = await createCampaign(auth.tenant.id, {
    product_id: productId,
    channel: channel as 'meta',
    name,
    template_type: typeof body.template_type === 'string' ? body.template_type.slice(0, 80) : null,
    status: 'draft',
    utm_campaign: utmCampaign,
    utm_source: typeof body.utm_source === 'string' ? body.utm_source.slice(0, 60) : 'meta',
    utm_medium: typeof body.utm_medium === 'string' ? body.utm_medium.slice(0, 60) : 'paid_social',
    destination_url: destinationUrl,
    budget_daily_ars: budget,
    metadata: typeof body.metadata === 'object' && body.metadata ? body.metadata : {},
  })
  if (!campaign) return NextResponse.json({ error: 'No se pudo guardar la campaña. Revisá que el nombre UTM sea único.' }, { status: 409 })
  return NextResponse.json({ campaign }, { status: 201 })
}
