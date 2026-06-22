import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { getDailyAttention } from '@/lib/partners/daily-attention'

export async function GET(request: NextRequest) {
  const result = await getRequestTenant(request)
  if (!result) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const items = await getDailyAttention(result.tenant)
    return NextResponse.json({ items, generatedAt: new Date().toISOString() })
  } catch (error) {
    console.error('GET /api/partners/dashboard/attention error:', error)
    return NextResponse.json({ error: 'No se pudo preparar tu cola de acciones' }, { status: 500 })
  }
}
