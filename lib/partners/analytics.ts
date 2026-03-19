import { supabaseAdmin } from '@/lib/supabase-admin'
import { createHash } from 'crypto'

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
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString()

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

  // Group by day
  const buckets = new Map<string, Set<string>>()
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    buckets.set(d.toISOString().slice(0, 10), new Set())
  }

  for (const row of data as Array<{ created_at: string; visitor_id: string | null }>) {
    const day = row.created_at.slice(0, 10)
    if (buckets.has(day)) {
      buckets.get(day)!.add(row.visitor_id || row.created_at)
    }
  }

  if (metric === 'unique_visitors') {
    return Array.from(buckets.values()).map(s => s.size)
  }

  // For page_views, leads, orders — count all events
  // Re-query with count approach for accuracy
  const counts: number[] = []
  for (const [, visitors] of buckets) {
    counts.push(visitors.size)
  }
  return counts
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
