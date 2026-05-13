/**
 * GET /api/partners/design/library
 *
 * Devuelve la galeria de diseños y mockups que el partner ya genero con el
 * Studio (Design Engine). Util para mostrar en /workspace/design-library y
 * para reutilizar diseños al crear productos.
 *
 * Query params:
 *   type?: 'design' | 'mockup' | 'all'  (default: all)
 *   limit?: number (default 60)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { getDesignAssets } from '@/lib/partners/design-engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const result = await getRequestTenant(request)
  if (!result) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const { tenant } = result

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as 'design' | 'mockup' | 'all' | null
  const limit = Math.min(Number(searchParams.get('limit')) || 60, 200)

  const filter = type && type !== 'all' ? type : undefined
  const assets = await getDesignAssets(tenant.id, filter, limit)

  return NextResponse.json({
    assets: assets.map(a => ({
      id: a.id,
      type: a.type,
      url: a.url,
      storageKey: a.storage_key,
      metadata: a.metadata,
      createdAt: a.created_at,
    })),
  })
}
