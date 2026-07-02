import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { getDailyAttention } from '@/lib/partners/daily-attention'
import { isPartnersCockpitEnabled } from '@/lib/partners/feature-flags'

export async function GET(request: NextRequest) {
  const auth = await requireTenantPermission(request, 'orders:read')
  if (!auth.ok) return auth.response
  if (!isPartnersCockpitEnabled()) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  try {
    const items = await getDailyAttention(auth.tenant, { includeFinancial: auth.role === 'owner' })
    return NextResponse.json({ items, generatedAt: new Date().toISOString() })
  } catch (error) {
    console.error('GET /api/partners/dashboard/attention error:', error)
    return NextResponse.json({ error: 'No se pudo preparar tu cola de acciones' }, { status: 500 })
  }
}
