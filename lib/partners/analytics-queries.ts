import { supabaseAdmin } from '@/lib/supabase-admin'

const db = () => supabaseAdmin as any

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VisitStats {
  total: number
  unique: number
  byDay: { date: string; total: number; unique: number }[]
}

export interface ConversionData {
  visits: number
  leads: number
  rate: number
}

export interface TopProduct {
  productSlug: string
  name: string
  views: number
}

export interface TrafficSource {
  source: string
  count: number
  percentage: number
}

export interface GeoEntry {
  region: string
  count: number
}

export interface FunnelStep {
  stage: string
  count: number
  dropoff: number
}

// ---------------------------------------------------------------------------
// Basic Analytics (Growth+)
// ---------------------------------------------------------------------------

function dateRange(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export async function getVisitStats(tenantId: string, days: number = 7): Promise<VisitStats> {
  const since = dateRange(days)

  const { data, error } = await db()
    .from('partner_analytics_events')
    .select('created_at, visitor_id')
    .eq('tenant_id', tenantId)
    .eq('event_type', 'page_view')
    .gte('created_at', since)

  if (error || !data) return { total: 0, unique: 0, byDay: [] }

  const rows = data as Array<{ created_at: string; visitor_id: string | null }>
  const allVisitorIds = new Set<string>()
  const byDayMap = new Map<string, { total: number; visitors: Set<string> }>()

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    byDayMap.set(d.toISOString().slice(0, 10), { total: 0, visitors: new Set() })
  }

  for (const row of rows) {
    const day = row.created_at.slice(0, 10)
    const vid = row.visitor_id || row.created_at
    allVisitorIds.add(vid)

    const bucket = byDayMap.get(day)
    if (bucket) {
      bucket.total++
      bucket.visitors.add(vid)
    }
  }

  return {
    total: rows.length,
    unique: allVisitorIds.size,
    byDay: Array.from(byDayMap.entries()).map(([date, d]) => ({
      date,
      total: d.total,
      unique: d.visitors.size,
    })),
  }
}

export async function getLeadConversionRate(tenantId: string, days: number = 7): Promise<ConversionData> {
  const since = dateRange(days)

  const [visitsRes, leadsRes] = await Promise.all([
    db()
      .from('partner_analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('event_type', 'page_view')
      .gte('created_at', since),
    db()
      .from('partner_analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('event_type', 'lead_submit')
      .gte('created_at', since),
  ])

  const visits = visitsRes.count || 0
  const leads = leadsRes.count || 0
  const rate = visits > 0 ? Math.round((leads / visits) * 1000) / 10 : 0

  return { visits, leads, rate }
}

export async function getTopProducts(tenantId: string, days: number = 7, limit: number = 10): Promise<TopProduct[]> {
  const since = dateRange(days)

  const { data, error } = await db()
    .from('partner_analytics_events')
    .select('event_data')
    .eq('tenant_id', tenantId)
    .eq('event_type', 'product_view')
    .gte('created_at', since)

  if (error || !data) return []

  const counts = new Map<string, number>()
  for (const row of data as Array<{ event_data: Record<string, unknown> }>) {
    const slug = (row.event_data?.productSlug as string) || 'unknown'
    counts.set(slug, (counts.get(slug) || 0) + 1)
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug, views]) => ({ productSlug: slug, name: slug, views }))
}

export async function getTrafficSources(tenantId: string, days: number = 7): Promise<TrafficSource[]> {
  const since = dateRange(days)

  const { data, error } = await db()
    .from('partner_analytics_events')
    .select('referrer')
    .eq('tenant_id', tenantId)
    .eq('event_type', 'page_view')
    .gte('created_at', since)

  if (error || !data) return []

  const counts = new Map<string, number>()
  let total = 0

  for (const row of data as Array<{ referrer: string | null }>) {
    const source = categorizeReferrer(row.referrer)
    counts.set(source, (counts.get(source) || 0) + 1)
    total++
  }

  return Array.from(counts.entries())
    .map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

function categorizeReferrer(referrer: string | null): string {
  if (!referrer) return 'Directo'
  const r = referrer.toLowerCase()
  if (r.includes('google')) return 'Google'
  if (r.includes('facebook') || r.includes('fb.com') || r.includes('instagram')) return 'Social'
  if (r.includes('twitter') || r.includes('t.co') || r.includes('tiktok')) return 'Social'
  if (r.includes('novamente.ar')) return 'Interno'
  return 'Referral'
}

// ---------------------------------------------------------------------------
// Advanced Analytics (Pro only)
// ---------------------------------------------------------------------------

export async function getFunnelData(tenantId: string, days: number = 7): Promise<FunnelStep[]> {
  const since = dateRange(days)

  const stages = ['page_view', 'product_view', 'lead_submit', 'order_created']
  const stageNames = ['Visita', 'Ver producto', 'Lead', 'Pedido']

  const counts = await Promise.all(
    stages.map(async (eventType) => {
      const { count } = await db()
        .from('partner_analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('event_type', eventType)
        .gte('created_at', since)
      return count || 0
    })
  )

  return stageNames.map((stage, i) => ({
    stage,
    count: counts[i],
    dropoff: i > 0 && counts[i - 1] > 0
      ? Math.round((1 - counts[i] / counts[i - 1]) * 100)
      : 0,
  }))
}

export async function getUtmPerformance(tenantId: string, days: number = 7) {
  const since = dateRange(days)

  const { data, error } = await db()
    .from('partner_analytics_events')
    .select('event_data, event_type')
    .eq('tenant_id', tenantId)
    .gte('created_at', since)
    .not('event_data->utm_campaign', 'is', null)

  if (error || !data) return []

  const campaigns = new Map<string, { visits: number; leads: number; source: string; medium: string }>()

  for (const row of data as Array<{ event_data: Record<string, unknown>; event_type: string }>) {
    const campaign = (row.event_data?.utm_campaign as string) || 'unknown'
    const entry = campaigns.get(campaign) || {
      visits: 0,
      leads: 0,
      source: (row.event_data?.utm_source as string) || '',
      medium: (row.event_data?.utm_medium as string) || '',
    }
    if (row.event_type === 'page_view') entry.visits++
    if (row.event_type === 'lead_submit') entry.leads++
    campaigns.set(campaign, entry)
  }

  return Array.from(campaigns.entries()).map(([campaign, d]) => ({
    campaign,
    source: d.source,
    medium: d.medium,
    visits: d.visits,
    leads: d.leads,
    conversion: d.visits > 0 ? Math.round((d.leads / d.visits) * 1000) / 10 : 0,
  }))
}
