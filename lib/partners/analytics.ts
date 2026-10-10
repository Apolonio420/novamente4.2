import { supabaseAdmin } from '@/lib/supabase-admin'
import { createHash } from 'crypto'
import { artDayKey, artWindowStartIso, lastNArtDayKeys } from '@/lib/partners/analytics-dates'

const db = () => supabaseAdmin as any

// ---------------------------------------------------------------------------
// Track Events
// ---------------------------------------------------------------------------

export async function trackEvent(
  tenantId: string,
  eventType: string,
  eventData: Record<string, unknown> = {},
  meta?: { referrer?: string; userAgent?: string; ip?: string; visitorId?: string }
) {
  const ipHash = meta?.ip
    ? createHash('sha256').update(meta.ip).digest('hex').slice(0, 16)
    : null

  const { error } = await db()
    .from('partner_analytics_events')
    .insert({
      tenant_id: tenantId,
      event_type: eventType,
      event_data: eventData,
      visitor_id: meta?.visitorId || null,
      referrer: meta?.referrer || null,
      user_agent: meta?.userAgent || null,
      ip_hash: ipHash,
    })

  if (error) {
    console.error('Failed to track analytics event:', error)
  }
}

// ---------------------------------------------------------------------------
// Time-Series Queries for Dashboard Sparklines
// ---------------------------------------------------------------------------

export async function getMetricTimeSeries(
  tenantId: string,
  metric: 'page_views' | 'unique_visitors' | 'leads' | 'orders',
  days: number = 7
): Promise<number[]> {
  const now = new Date()
  const sinceStr = artWindowStartIso(days, now)

  // Map metric to event type
  const eventTypeMap: Record<string, string> = {
    page_views: 'page_view',
    unique_visitors: 'page_view',
    leads: 'lead_submit',
    orders: 'order_created',
  }
  const eventType = eventTypeMap[metric]

  const { data, error } = await db()
    .from('partner_analytics_events')
    .select('created_at, visitor_id')
    .eq('tenant_id', tenantId)
    .eq('event_type', eventType)
    .gte('created_at', sinceStr)
    .order('created_at', { ascending: true })

  if (error || !data) return new Array(days).fill(0)

  // Group by día ART (no UTC: una visita/venta 21:00-23:59 ART no se corre al día siguiente)
  const dayKeys = lastNArtDayKeys(days, now)
  const counts = new Map<string, number>(dayKeys.map((k) => [k, 0]))
  const visitorsByDay = new Map<string, Set<string>>(dayKeys.map((k) => [k, new Set<string>()]))

  for (const row of data as Array<{ created_at: string; visitor_id: string | null }>) {
    const day = artDayKey(row.created_at)
    if (!counts.has(day)) continue
    counts.set(day, (counts.get(day) || 0) + 1)
    visitorsByDay.get(day)!.add(row.visitor_id || row.created_at)
  }

  if (metric === 'unique_visitors') {
    return dayKeys.map((k) => visitorsByDay.get(k)!.size)
  }

  // page_views / leads / orders: contar EVENTOS, no visitantes únicos. Dos
  // pedidos del mismo visitor_id el mismo día son 2 ventas, no 1 (antes se
  // reusaba el Set de-dup de visitantes para estas métricas por error).
  return dayKeys.map((k) => counts.get(k) || 0)
}

// ---------------------------------------------------------------------------
// Dashboard Metrics (aggregated)
// ---------------------------------------------------------------------------

export async function getDashboardTrends(tenantId: string) {
  const [pageViews, uniqueVisitors, leads, orders] = await Promise.all([
    getMetricTimeSeries(tenantId, 'page_views', 7),
    getMetricTimeSeries(tenantId, 'unique_visitors', 7),
    getMetricTimeSeries(tenantId, 'leads', 7),
    getMetricTimeSeries(tenantId, 'orders', 7),
  ])

  return {
    products: pageViews, // Use page views as the "products" trend proxy
    leads,
    orders,
    score: uniqueVisitors, // Use unique visitors as "score" trend
  }
}
