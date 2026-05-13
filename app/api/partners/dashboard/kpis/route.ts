import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { getDashboardKPIs } from '@/lib/partners/dashboard-kpis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const result = await getRequestTenant(request)
  if (!result) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  try {
    const kpis = await getDashboardKPIs(result.tenant.id)
    return NextResponse.json({ kpis })
  } catch (error: any) {
    console.error('GET /api/partners/dashboard/kpis error:', error)
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 })
  }
}
