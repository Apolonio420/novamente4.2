import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getTenantBySlug } from '@/lib/partners/tenant'
import { getPlanFeatures } from '@/lib/partners/plans'
import {
  getDesignConfig,
  getAvailableGarments,
  saveDesignAsset,
} from '@/lib/partners/design-engine'
import { getGarmentMapping } from '@/lib/garment-mappings'
import { uploadFile } from '@/lib/cloudflare-r2'
import { v4 as uuidv4 } from 'uuid'
import type { Plan } from '@/lib/partners/types'
import { checkUsageLimit, recordUsage } from '@/lib/partners/studio/usage-tracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simple IP rate limiter: max 10 mockups per IP per hour
const ipLimiter = new Map<string, { count: number; resetAt: number }>()

function checkIpLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipLimiter.get(ip)
  if (!entry || now > entry.resetAt) {
    ipLimiter.set(ip, { count: 1, resetAt: now + 3600_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkIpLimit(ip)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intentá de nuevo en un rato.' },
        { status: 429 },
      )
    }

    const tenant = await getTenantBySlug(slug)
    if (!tenant || !tenant.storefront_published) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
    }

    const features = getPlanFeatures(tenant.plan as Plan)
    if (!features.storefrontDesigner) {
      return NextResponse.json({ error: 'No disponible en este plan' }, { status: 403 })
    }

    const { allowed, usage } = await checkUsageLimit(tenant.id, tenant.plan)
    if (!allowed) {
      return NextResponse.json(
        { error: 'La tienda alcanzó su límite de generaciones. Volvé pronto.' },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { designImageUrl, garmentType, garmentColor, side } = body

    if (!designImageUrl) {
      return NextResponse.json({ error: 'Se requiere la imagen del diseño' }, { status: 400 })
    }
    if (!garmentType) {
      return NextResponse.json({ error: 'Se requiere el tipo de prenda' }, { status: 400 })
    }

    const config = await getDesignConfig(tenant.id)
    const availableGarments = getAvailableGarments(config)
    if (!availableGarments.some(g => g.key === garmentType)) {
      return NextResponse.json({ error: 'Prenda no disponible' }, { status: 400 })
    }

    const color = garmentColor || 'black'
    const sideChoice = (side || 'front') as 'front' | 'back'
    const mapping = getGarmentMapping(garmentType, color, sideChoice)

    // Fetch design image
    let designBase64: string
    if (designImageUrl.startsWith('data:')) {
      designBase64 = designImageUrl.replace(/^data:image\/[^;]+;base64,/, '')
    } else {
      const imgResp = await fetch(designImageUrl)
      if (!imgResp.ok) {
        return NextResponse.json({ error: 'No se pudo obtener la imagen' }, { status: 400 })
      }
      const imgBuf = await imgResp.arrayBuffer()
      designBase64 = Buffer.from(imgBuf).toString('base64')
    }

    // Fetch garment base image
    const h = await headers()
    const origin = h.get('origin') || (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')

    const garmentPath = mapping?.garmentPath?.replace(/^\//, '') || `garments/tshirt-${color}-oversize-front.jpeg`
    const garmentUrl = `${origin}/${garmentPath}`

    let garmentBase64 = ''
    try {
      const gResp = await fetch(garmentUrl)
      if (gResp.ok) {
        const gBuf = await gResp.arrayBuffer()
        garmentBase64 = Buffer.from(gBuf).toString('base64')
      }
    } catch {}

    // Compositor DETERMINÍSTICO (sharp): saca el fondo del diseño y lo pega
    // centrado en la plantilla de la prenda a posición/tamaño fijos. Antes esto
    // lo hacía Gemini (IA), que dejaba el fondo y lo ubicaba inconsistente →
    // mockups "superpuestos". Determinístico = prolijo y consistente siempre.
    if (!garmentBase64) {
      return NextResponse.json({ error: 'No se pudo cargar la prenda base' }, { status: 500 })
    }
    const { compositeDesignOnGarment } = await import('@/lib/partners/studio/composite')
    let mockupBase64: string
    try {
      const mockupBuffer = await compositeDesignOnGarment(
        Buffer.from(designBase64, 'base64'),
        Buffer.from(garmentBase64, 'base64'),
        { side: sideChoice },
      )
      mockupBase64 = mockupBuffer.toString('base64')
    } catch (e) {
      console.error('[studio/mockup] composite error:', e)
      return NextResponse.json({ error: 'No se pudo generar el mockup' }, { status: 500 })
    }

    const assetId = uuidv4()
    const storageKey = `partners/${slug}/storefront-mockups/${assetId}.png`
    const buffer = Buffer.from(mockupBase64, 'base64')
    const uploadResult = await uploadFile(buffer, storageKey, 'image/png')

    await saveDesignAsset(tenant.id, uploadResult.url, storageKey, 'mockup', {
      garmentType,
      garmentColor: color,
      side: sideChoice,
      source: 'storefront',
      ip,
    })

    await recordUsage(tenant.id, 'storefront-customer', 'mockup', undefined, assetId).catch(() => {})

    return NextResponse.json({
      mockupUrl: uploadResult.url,
    })
  } catch (error: any) {
    console.error('POST /api/storefront/[slug]/studio/mockup error:', error)
    return NextResponse.json(
      { error: 'Error generando el mockup. Intentá de nuevo.' },
      { status: 500 },
    )
  }
}
