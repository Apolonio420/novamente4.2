/**
 * POST /api/partners/products/mockup-preview
 *
 * Vista previa RÁPIDA del compositor único (Fase 3 pieza B): no sube nada a
 * R2, no persiste, devuelve una data URL de 800x800. Pensado para la vista
 * previa en vivo del wizard "Nuevo producto".
 *
 * Body: { designUrl?, garmentKey, color, side, size?, placement? }
 * Response: { previewUrl }
 */
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import sharp from 'sharp'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { renderProductMockup, type MockupPlacement, type MockupSide, type MockupSize } from '@/lib/mockup/compose'
import { fetchDesignBuffer, resolveRequestOrigin } from '@/lib/partners/design-fetch'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_SIZES: MockupSize[] = ['chico', 'mediano', 'grande']
const VALID_PLACEMENTS: MockupPlacement[] = ['pecho-izq', 'centro', 'nuca']

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'designs:write')
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

    const { designUrl, garmentKey, color, side, size, placement } = body
    if (!garmentKey || typeof garmentKey !== 'string') {
      return NextResponse.json({ error: 'Se requiere garmentKey' }, { status: 400 })
    }
    if (!color || typeof color !== 'string') {
      return NextResponse.json({ error: 'Se requiere color' }, { status: 400 })
    }
    const sideChoice: MockupSide = side === 'back' ? 'back' : 'front'
    const sizeChoice: MockupSize = VALID_SIZES.includes(size) ? size : 'mediano'
    const placementChoice: MockupPlacement | undefined = VALID_PLACEMENTS.includes(placement) ? placement : undefined

    let designBuffer: Buffer | null = null
    if (typeof designUrl === 'string' && designUrl) {
      const origin = resolveRequestOrigin(await headers())
      try {
        designBuffer = await fetchDesignBuffer(designUrl, origin)
      } catch (e: any) {
        return NextResponse.json({ error: e.message || 'No se pudo leer el diseño' }, { status: 400 })
      }
    }

    let mockup: Buffer
    try {
      mockup = await renderProductMockup({
        garmentKey,
        color,
        side: sideChoice,
        designBuffer,
        size: sizeChoice,
        placement: placementChoice,
      })
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'No se pudo generar la vista previa' }, { status: 422 })
    }

    const preview = await sharp(mockup).resize(800, 800, { fit: 'inside' }).jpeg({ quality: 82 }).toBuffer()

    return NextResponse.json({ previewUrl: `data:image/jpeg;base64,${preview.toString('base64')}` })
  } catch (error: any) {
    console.error('POST /api/partners/products/mockup-preview error:', error)
    return NextResponse.json({ error: error.message || 'Error generando vista previa' }, { status: 500 })
  }
}
