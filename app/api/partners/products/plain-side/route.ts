/**
 * POST /api/partners/products/plain-side
 *
 * Genera y sube la prenda LISA (sin estampa) de garmentKey/color/side —
 * usado por el botón "Dorso liso" del panel (Fase 3 pieza E3): cuando el
 * partner sólo tiene diseño de un lado, este endpoint le arma el otro lado
 * sin que tenga que subir nada.
 *
 * Body: { garmentKey, color, side }
 * Response: { url }
 */
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { renderProductMockup, type MockupSide } from '@/lib/mockup/compose'
import { uploadFile } from '@/lib/cloudflare-r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'designs:write')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

    const { garmentKey, color, side } = body
    if (!garmentKey || typeof garmentKey !== 'string') {
      return NextResponse.json({ error: 'Se requiere garmentKey' }, { status: 400 })
    }
    if (!color || typeof color !== 'string') {
      return NextResponse.json({ error: 'Se requiere color' }, { status: 400 })
    }
    const sideChoice: MockupSide = side === 'back' ? 'back' : 'front'

    let mockup: Buffer
    try {
      mockup = await renderProductMockup({ garmentKey, color, side: sideChoice, designBuffer: null })
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'No se pudo generar la prenda lisa' }, { status: 422 })
    }

    const assetId = uuidv4()
    const storageKey = `partners/${tenant.slug}/mockups/${assetId}.jpg`
    const uploadResult = await uploadFile(mockup, storageKey, 'image/jpeg')

    return NextResponse.json({ url: uploadResult.url })
  } catch (error: any) {
    console.error('POST /api/partners/products/plain-side error:', error)
    return NextResponse.json({ error: error.message || 'Error generando la prenda lisa' }, { status: 500 })
  }
}
