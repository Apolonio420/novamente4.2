import { supabaseAdmin } from '@/lib/supabase-admin'
import type { UsageInfo } from './types'
import { PLAN_GENERATION_LIMITS, PLAN_USAGE_WINDOW } from './types'

const db = () => supabaseAdmin as any

/**
 * Check if a tenant can generate (server-side only).
 */
export async function checkUsageLimit(
  tenantId: string,
  plan: string,
): Promise<{ allowed: boolean; usage: UsageInfo }> {
  const limit = PLAN_GENERATION_LIMITS[plan] ?? 5
  const window = PLAN_USAGE_WINDOW[plan] ?? 'weekly'

  // Planes pagos (growth/pro) = generaciones ILIMITADAS. No hay tope ni conteo.
  if (!Number.isFinite(limit)) {
    return {
      allowed: true,
      usage: { used: 0, limit: 0, resetLabel: 'sin límite', percentUsed: 0, unlimited: true },
    }
  }

  let dateFilter: string
  let resetLabel: string

  if (window === 'weekly') {
    // Rolling 7-day window
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    dateFilter = sevenDaysAgo.toISOString()
    resetLabel = 'esta semana'
  } else {
    // Calendar month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    dateFilter = monthStart.toISOString()
    resetLabel = 'este mes'
  }

  const { count, error } = await db()
    .from('partner_generation_usage')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', dateFilter)

  const used = error ? 0 : (count ?? 0)

  return {
    allowed: used < limit,
    usage: {
      used,
      limit,
      resetLabel,
      percentUsed: limit > 0 ? Math.round((used / limit) * 100) : 0,
    },
  }
}

/**
 * Record a generation event.
 */
export async function recordUsage(
  tenantId: string,
  userId: string,
  type: 'design' | 'mockup',
  sessionId?: string,
  assetId?: string,
): Promise<void> {
  await db()
    .from('partner_generation_usage')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      type,
      session_id: sessionId || null,
      asset_id: assetId || null,
    })
}

/**
 * Get usage stats for a tenant (for the UI meter).
 */
export async function getUsageStats(
  tenantId: string,
  plan: string,
): Promise<UsageInfo> {
  const { usage } = await checkUsageLimit(tenantId, plan)
  return usage
}
