import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getTenantBySlug } from '@/lib/partners/tenant'
import { getPlanFeatures, effectivePlan } from '@/lib/partners/plans'
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
import { corsHeaders, preflightResponse } from '@/lib/security/cors'
import { guardPublicImageGen } from '@/lib/security/public-image-guard'
import { meterPublicImageGen } from '@/lib/security/meter-usage'
import { getRequestTenant } from '@/lib/partners/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ch = corsHeaders(request)
  try {
    const { slug } = await params

    // Resolver el tenant del slug ANTES de decidir la exencion del guard —
    // la exencion tiene que compararse contra ESTA tienda.
    const tenant = await getTenantBySlug(slug)
    if (!tenant || !tenant.storefront_published) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404, headers: ch })
    }

    // Rate-limit por IP + tope diario global (DB-backed). Reemplaza el
    // ipLimiter viejo (Map en memoria — sin techo real en serverless,
    // auditoria 2026-07-11). checkUsageLimit de abajo sigue siendo el cupo
    // del PLAN del partner (separado).
    //
    // Exencion SOLO para el DUEÑO de esta tienda (sesion cuyo tenant activo
    // es el mismo tenant del slug) — ya paga su cupo via checkUsageLimit.
    // Con "cualquier sesion de partner" alcanzaba un signup gratis anonimo
    // para bypassear el guard contra la tienda de OTRO tenant growth/pro
    // (checkUsageLimit unlimited por el plan de la victima). Ver review
    // adversarial del commit ac4ee45.
    let isOwnerPartner = false
    try {
      const authed = await getRequestTenant(request)
      isOwnerPartner = authed !== null && authed.tenant.id === tenant.id
    } catch {
      // best-effort — si falla, tratamos como anonimo (no relajamos el guard)
    }
    if (!isOwnerPartner) {
      const guard = await guardPublicImageGen(request, 'storefront-studio-mockup')
      if (!guard.allowed) {
        return NextResponse.json({ error: guard.message }, { status: guard.status, headers: ch })
      }
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    const features = getPlanFeatures(effectivePlan(tenant))
    if (!features.storefrontDesigner) {
      return NextResponse.json({ error: 'No disponible en este plan' }, { status: 403, headers: ch })
    }

    const { allowed, usage } = await checkUsageLimit(tenant.id, effectivePlan(tenant))
    if (!allowed) {
      return NextResponse.json(
        { error: 'La tienda alcanzó su límite de generaciones. Volvé pronto.' },
        { status: 429, headers: ch },
      )
    }

    const body = await request.json()
    const { designImageUrl, garmentType, garmentColor, side } = body

    if (!designImageUrl) {
      return NextResponse.json({ error: 'Se requiere la imagen del diseño' }, { status: 400, headers: ch })
    }
    if (!garmentType) {
      return NextResponse.json({ error: 'Se requiere el tipo de prenda' }, { status: 400, headers: ch })
    }

    const config = await getDesignConfig(tenant.id)
    const availableGarments = getAvailableGarments(config)
    if (!availableGarments.some(g => g.key === garmentType)) {
      return NextResponse.json({ error: 'Prenda no disponible' }, { status: 400, headers: ch })
    }

    const color = garmentColor || 'black'
    const sideChoice = (side || 'front') as 'front' | 'back'
    const mapping = getGarmentMapping(garmentType, color, sideChoice)

    // Si no hay base mapeada para esta combinación (garmentPath === "fallback"),
    // avisamos claro en vez de tirar un 500 "No se pudo cargar la prenda base".
    if (mapping?.garmentPath === 'fallback') {
      const msg = sideChoice === 'back'
        ? 'El dorso de esta prenda todavía no está disponible para mockup. Probá con el frente 🙌'
        : 'Esta combinación de prenda/color todavía no está disponible para mockup.'
      return NextResponse.json({ error: msg }, { status: 422, headers: ch })
    }

    // Fetch design image
    let designBase64: string
    if (designImageUrl.startsWith('data:')) {
      designBase64 = designImageUrl.replace(/^data:image\/[^;]+;base64,/, '')
    } else {
      const imgResp = await fetch(designImageUrl)
      if (!imgResp.ok) {
        return NextResponse.json({ error: 'No se pudo obtener la imagen' }, { status: 400, headers: ch })
      }
      const imgBuf = await imgResp.arrayBuffer()
      designBase64 = Buffer.from(imgBuf).toString('base64')
    }

    // Fetch garment base image.
    // El header `origin` NO siempre viene (lo manda el browser solo en CORS/POST,
    // y falta en navegación same-origin o server-to-server). Usamos `host` +
    // `x-forwarded-proto` que sí están siempre — mismo patrón que design/mockup.
    const h = await headers()
    const hostHeader = h.get('host')
    const protoHeader = h.get('x-forwarded-proto') || 'https'
    const originFromHeaders = hostHeader ? `${protoHeader}://${hostHeader}` : null
    const origin =
      originFromHeaders
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'

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

    // Motor de mockups "perfecto" (PoC validado 2026-06-24): quita el fondo del
    // diseño (gemini-2.5-flash-image) + cuadro rojo DINÁMICO sobre el área de
    // impresión + estampa (prompt best-of, modelo STAMP_MODEL — default flash desde 2026-07-11). Reemplaza el
    // compositor sharp determinístico (pegado plano que Apo rechazaba).
    if (!garmentBase64) {
      return NextResponse.json({ error: 'No se pudo cargar la prenda base' }, { status: 500, headers: ch })
    }
    const { generatePerfectStamp } = await import('@/lib/mockup/perfect-stamp')
    let mockupBase64: string
    const stampStats = { geminiCalls: 0 }
    try {
      const mockupBuffer = await generatePerfectStamp({
        stats: stampStats,
        designBuffer: Buffer.from(designBase64, 'base64'),
        baseGarmentBuffer: Buffer.from(garmentBase64, 'base64'),
        imprint: mapping?.coordinates ?? { x: 112, y: 175, width: 180, height: 145 },
        side: sideChoice,
        stampSize: 'R3',
      })
      mockupBase64 = mockupBuffer.toString('base64')
    } catch (e) {
      console.error('[studio/mockup] perfect-stamp error:', e)
      return NextResponse.json({ error: 'No se pudo generar el mockup' }, { status: 500, headers: ch })
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

    // units sale del contador real del motor: la llamada de quitar fondo ya no
    // se hace siempre (el recorte es determinístico), así que un 2 fijo
    // sobrecontaría. Mismo criterio que el motor gemelo
    // app/api/partners/design/mockup/route.ts (viene de la auditoría
    // 2026-08-09, que cerró el subconteo; esto evita el error simétrico).
    await meterPublicImageGen({
      endpoint: 'storefront/studio/mockup',
      model: process.env.GEMINI_STAMP_MODEL ?? process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image',
      units: stampStats.geminiCalls,
      metadata: { tenantSlug: slug },
    })

    return NextResponse.json({
      mockupUrl: uploadResult.url,
    }, { headers: ch })
  } catch (error: any) {
    console.error('POST /api/storefront/[slug]/studio/mockup error:', error)
    return NextResponse.json(
      { error: 'Error generando el mockup. Intentá de nuevo.' },
      { status: 500, headers: ch },
    )
  }
}
