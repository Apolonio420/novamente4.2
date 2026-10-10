import { supabaseAdmin } from '@/lib/supabase-admin'
import { artDayKey, artWindowStartIso, lastNArtDayKeys } from '@/lib/partners/analytics-dates'

const db = () => supabaseAdmin as any

// ---------------------------------------------------------------------------
// Paginación (PostgREST corta en 1000 filas por default): una tienda con
// mucho tráfico en la ventana de días pedida podía perder eventos en
// silencio. `paginateRange` pagea con .range() hasta que una página vuelve
// con menos filas que `pageSize`, con un tope de seguridad `maxRows`.
// ---------------------------------------------------------------------------

export async function paginateRange<T>(
  buildQuery: (range: { from: number; to: number }) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  { pageSize = 1000, maxRows = 50_000 }: { pageSize?: number; maxRows?: number } = {}
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; rows.length < maxRows; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await buildQuery({ from, to })
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < pageSize) break
  }
  return rows
}

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
  // Cutoff alineado al día ART más viejo de la ventana (no un corte UTC a
  // secas) para que coincida con los buckets por día ART de getVisitStats.
  return artWindowStartIso(days)
}

export async function getVisitStats(tenantId: string, days: number = 7): Promise<VisitStats> {
  const since = dateRange(days)

  const rows = await paginateRange<{ created_at: string; visitor_id: string | null }>(({ from, to }) =>
    db()
      .from('partner_analytics_events')
      .select('created_at, visitor_id')
      .eq('tenant_id', tenantId)
      .eq('event_type', 'page_view')
      .gte('created_at', since)
      .order('id', { ascending: true })
      .range(from, to)
  )

  const allVisitorIds = new Set<string>()
  const byDayMap = new Map<string, { total: number; visitors: Set<string> }>()

  // Inicializa todos los días en ART (una visita 21:00-23:59 ART no se corre al día siguiente)
  const dayKeys = lastNArtDayKeys(days)
  for (const key of dayKeys) byDayMap.set(key, { total: 0, visitors: new Set() })

  for (const row of rows) {
    const day = artDayKey(row.created_at)
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
    byDay: dayKeys.map((date) => {
      const d = byDayMap.get(date)!
      return { date, total: d.total, unique: d.visitors.size }
    }),
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

  const data = await paginateRange<{ event_data: Record<string, unknown> }>(({ from, to }) =>
    db()
      .from('partner_analytics_events')
      .select('event_data')
      .eq('tenant_id', tenantId)
      .eq('event_type', 'product_view')
      .gte('created_at', since)
      .order('id', { ascending: true })
      .range(from, to)
  )

  const counts = new Map<string, number>()
  for (const row of data) {
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

  const data = await paginateRange<{ referrer: string | null }>(({ from, to }) =>
    db()
      .from('partner_analytics_events')
      .select('referrer')
      .eq('tenant_id', tenantId)
      .eq('event_type', 'page_view')
      .gte('created_at', since)
      .order('id', { ascending: true })
      .range(from, to)
  )

  const counts = new Map<string, number>()
  let total = 0

  for (const row of data) {
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

  const data = await paginateRange<{ event_data: Record<string, unknown>; event_type: string }>(({ from, to }) =>
    db()
      .from('partner_analytics_events')
      .select('event_data, event_type')
      .eq('tenant_id', tenantId)
      .gte('created_at', since)
      .not('event_data->utm_campaign', 'is', null)
      .order('id', { ascending: true })
      .range(from, to)
  )

  const campaigns = new Map<string, { visits: number; leads: number; source: string; medium: string }>()

  for (const row of data) {
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
