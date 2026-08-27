import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { getUsageStats } from '@/lib/partners/studio/usage-tracker'
import { effectivePlan } from '@/lib/partners/plans'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { tenant } = result
    const usage = await getUsageStats(tenant.id, effectivePlan(tenant))

    return NextResponse.json(usage)
  } catch (err: any) {
    console.error('[studio usage] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
