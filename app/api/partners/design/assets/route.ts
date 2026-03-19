import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { getDesignAssets } from '@/lib/partners/design-engine'

export async function GET(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const type = url.searchParams.get('type') as 'design' | 'mockup' | undefined
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)

    const assets = await getDesignAssets(
      result.tenant.id,
      type || undefined,
      limit,
    )

    return NextResponse.json({ assets })
  } catch (error: any) {
    console.error('GET /api/partners/design/assets error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
