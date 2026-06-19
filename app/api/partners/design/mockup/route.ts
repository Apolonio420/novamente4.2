import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getRequestTenant } from '@/lib/partners/auth'
import {
  getDesignConfig,
  validateDesignAccess,
  getAvailableGarments,
  saveDesignAsset,
} from '@/lib/partners/design-engine'
import { getGeminiClient } from '@/lib/gemini'
import { getGarmentMapping } from '@/lib/garment-mappings'
import { uploadFile } from '@/lib/cloudflare-r2'
import { v4 as uuidv4 } from 'uuid'
import type { Plan } from '@/lib/partners/types'
import { getGeminiSafetySettings } from '@/lib/partners/studio/moderation'
import { checkUsageLimit, recordUsage } from '@/lib/partners/studio/usage-tracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { userId, tenant } = result
    const config = await getDesignConfig(tenant.id)

    // Validate access
    const access = validateDesignAccess(
      config.mode || tenant.design_engine_mode,
      tenant.plan as Plan,
      'mockup',
    )

    if (!access.allowed) {
      return NextResponse.json({ error: (access as any).reason }, { status: 403 })
    }

    // Usage limit check
    const { allowed, usage } = await checkUsageLimit(tenant.id, tenant.plan)
    if (!allowed) {
      const upsell =
        tenant.plan === 'starter'
          ? 'Subí a Growth y generá sin límite 🚀 (o pasá a Pro para el combo completo).'
          : 'Escribinos por WhatsApp y te ampliamos el límite.'
      return NextResponse.json(
        {
          error: `Llegaste al límite de ${usage.limit} generaciones ${usage.resetLabel}. ${upsell}`,
          usage,
          upsell: tenant.plan === 'starter' ? 'growth' : null,
        },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { designImageUrl, garmentType, garmentColor, side, stampMode, placement, sessionId } = body

    if (!designImageUrl) {
      return NextResponse.json({ error: 'Se requiere designImageUrl' }, { status: 400 })
    }

    if (!garmentType) {
      return NextResponse.json({ error: 'Se requiere garmentType' }, { status: 400 })
    }

    // Validate garment is in tenant's allowed garments
    const availableGarments = getAvailableGarments(config)
    const garmentAllowed = availableGarments.some((g) => g.key === garmentType)
    if (!garmentAllowed) {
      return NextResponse.json(
        { error: `Prenda '${garmentType}' no disponible en tu configuracion` },
        { status: 403 },
      )
    }

    const color = garmentColor || 'black'
    const sideChoice = (side || 'front') as 'front' | 'back'

    // Get garment mapping for coordinates
    const mapping = getGarmentMapping(garmentType, color, sideChoice)

    // Resolver origin para URLs relativas que no apunten a R2 directamente
    const h = await headers()
    const hostHeader = h.get('host')
    const protoHeader = h.get('x-forwarded-proto') || 'https'
    const originFromHeaders = hostHeader ? `${protoHeader}://${hostHeader}` : null
    const origin =
      originFromHeaders
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'

    // Fetch design image as base64. Soporta 4 casos:
    // 1. data: URI
    // 2. URLs /api/proxy-image?key=X -> leer DIRECTO de R2 (evita self-fetch HTTP)
    // 3. URLs absolutas https://... -> fetch normal
    // 4. URLs relativas /foo.png -> resolver contra origin
    let designBase64: string
    if (designImageUrl.startsWith('data:')) {
      designBase64 = designImageUrl.replace(/^data:image\/[^;]+;base64,/, '')
    } else if (designImageUrl.startsWith('/api/proxy-image')) {
      // Lectura directa de R2 — mas robusta que self-fetch HTTP via Vercel
      const u = new URL(designImageUrl, origin)
      const key = u.searchParams.get('key')
      if (!key) {
        return NextResponse.json({ error: 'designImageUrl invalido: falta param key' }, { status: 400 })
      }
      const { r2Client, BUCKET_NAME } = await import('@/lib/cloudflare-r2')
      const { GetObjectCommand } = await import('@aws-sdk/client-s3')
      const { normalizeR2Key } = await import('@/lib/r2')
      const normalizedKey = normalizeR2Key(decodeURIComponent(key))
      if (!normalizedKey) {
        return NextResponse.json({ error: `R2 key invalido: ${key}` }, { status: 400 })
      }
      try {
        const cmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: normalizedKey })
        const resp = await r2Client.send(cmd)
        const body = resp.Body as any
        const bytes = typeof body.transformToByteArray === 'function'
          ? await body.transformToByteArray()
          : (async () => {
              const chunks: Buffer[] = []
              for await (const chunk of body) chunks.push(Buffer.from(chunk))
              return Buffer.concat(chunks)
            })()
        const buf = Buffer.from(await bytes)
        designBase64 = buf.toString('base64')
      } catch (err: any) {
        return NextResponse.json(
          { error: `No se pudo leer el diseño desde R2 (${normalizedKey}): ${err.message}` },
          { status: 400 },
        )
      }
    } else {
      const absoluteDesignUrl = designImageUrl.startsWith('http')
        ? designImageUrl
        : `${origin}${designImageUrl.startsWith('/') ? '' : '/'}${designImageUrl}`
      const imgResp = await fetch(absoluteDesignUrl)
      if (!imgResp.ok) {
        return NextResponse.json(
          { error: `No se pudo descargar el diseño (${imgResp.status} en ${absoluteDesignUrl})` },
          { status: 400 },
        )
      }
      const imgBuf = await imgResp.arrayBuffer()
      designBase64 = Buffer.from(imgBuf).toString('base64')
    }

    const garmentPath = mapping?.garmentPath?.replace(/^\//, '') || `garments/tshirt-${color}-oversize-front.jpeg`
    const garmentUrl = `${origin}/${garmentPath}`

    let garmentBase64: string
    try {
      const gResp = await fetch(garmentUrl)
      if (!gResp.ok) throw new Error(`Garment fetch failed: ${gResp.status}`)
      const gBuf = await gResp.arrayBuffer()
      garmentBase64 = Buffer.from(gBuf).toString('base64')
    } catch (e: any) {
      console.warn('Garment fetch failed, using design only:', e.message)
      garmentBase64 = ''
    }

    // Build prompt for Gemini mockup composition
    const sideLabel = sideChoice === 'back' ? 'espalda' : 'frente'
    const stampModeChoice = (stampMode || 'large') as 'large' | 'medium' | 'chest-logo'
    const placementChoice = (placement || '') as string

    const sizeLine =
      stampModeChoice === 'chest-logo'
        ? 'Logo pequeño (~10×10 cm), discreto y bien proporcionado'
        : stampModeChoice === 'medium'
          ? 'Estampa mediana (~20×25 cm)'
          : 'Estampa grande que debe ocupar casi toda el área imprimible disponible, aproximándose a 35×40 cm (sin exceder ese máximo). No la achiques: maximiza la presencia del diseño en la prenda'

    const positionLine = (() => {
      switch (placementChoice) {
        case 'left-chest':
          return `Posicionada en el pecho izquierdo del ${sideLabel} (sobre el corazón)`
        case 'right-chest':
          return `Posicionada en el pecho derecho del ${sideLabel}, espejada respecto del pecho izquierdo`
        case 'center-high':
          return `Centrada horizontalmente en el ${sideLabel} y ubicada en la zona alta de la prenda (no centro absoluto, anclada hacia arriba)`
        case 'upper-center':
          return `Centrada horizontalmente en la espalda, justo debajo del cuello / nuca`
        case 'upper-left':
          return `En la espalda, cerca del hombro izquierdo`
        case 'upper-right':
          return `En la espalda, cerca del hombro derecho`
        case 'pocket':
          return `Si la prenda tiene bolsillo en el ${sideLabel}, aplicala sobre o junto al bolsillo respetando su forma. Si no tiene bolsillo, posicionala en el pecho izquierdo como fallback`
        case 'hem-left':
          return `Como detalle chico en el dobladillo (base) del ${sideLabel}, lado izquierdo de la prenda`
        case 'hem-right':
          return `Como detalle chico en el dobladillo (base) del ${sideLabel}, lado derecho de la prenda`
        case 'hem-center':
          return `Como detalle chico centrado en el dobladillo (base) de la espalda`
        case 'chest-wide':
          return `Centrada horizontalmente en el pecho, ocupando el ancho del pecho de hombro a hombro`
        case 'shoulder-blades':
          return `Centrada en la zona alta de la espalda, entre los omóplatos`
        case 'center':
        default:
          return `Centrada en el ${sideLabel} de la prenda`
      }
    })()

    const stampPlacement = `${sizeLine}. ${positionLine}. La composición debe verse estéticamente equilibrada y profesional.`

    const promptText = `Aplica este diseno a la prenda siguiendo estas instrucciones:
- ${stampPlacement}
- Manten la forma y proporciones originales de la prenda
- El diseno debe verse natural y bien integrado, con los colores del diseno respetados
- Devuelve solo la imagen final de la prenda con el diseno aplicado`

    // Mockup composite SOLO usa gemini-2.5-flash-image (sin -preview, ya en GA).
    // IMPORTANTE: NO usar GEMINI_IMAGE_MODEL como fallback porque ese env esta
    // apuntando a gemini-3-pro-image en Vercel — ese modelo es lento
    // y devuelve 503 Service Unavailable / Deadline expired en composites
    // multimodales pesados. Solo aceptamos override explicito via
    // GEMINI_STAMP_MODEL para futuros tests.
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_STAMP_MODEL || 'gemini-2.5-flash-image',
      safetySettings: getGeminiSafetySettings() as any,
    })

    const parts: any[] = [promptText]
    parts.push({
      inlineData: { data: designBase64, mimeType: 'image/png' },
    })
    if (garmentBase64) {
      parts.push({
        inlineData: { data: garmentBase64, mimeType: 'image/png' },
      })
    }

    const geminiResult = await model.generateContent(parts)
    const response = await geminiResult.response
    const candidates = response.candidates || []

    let mockupBase64: string | null = null
    for (const cand of candidates) {
      for (const part of cand.content?.parts || []) {
        if (part.inlineData?.data) {
          mockupBase64 = part.inlineData.data
          break
        }
      }
      if (mockupBase64) break
    }

    if (!mockupBase64) {
      return NextResponse.json(
        { error: 'No se pudo generar el mockup' },
        { status: 500 },
      )
    }

    // Upload mockup
    const assetId = uuidv4()
    const storageKey = `partners/${tenant.slug}/mockups/${assetId}.png`
    const buffer = Buffer.from(mockupBase64, 'base64')
    const uploadResult = await uploadFile(buffer, storageKey, 'image/png')

    // Save to partner_assets
    const asset = await saveDesignAsset(
      tenant.id,
      uploadResult.url,
      storageKey,
      'mockup',
      {
        garmentType,
        garmentColor: color,
        side: sideChoice,
        designImageUrl,
        sessionId: sessionId || null,
      },
    )

    // Record usage
    await recordUsage(tenant.id, userId, 'mockup', sessionId, asset?.id).catch(() => {})

    return NextResponse.json({
      mockupUrl: uploadResult.url,
      mockupBase64: `data:image/png;base64,${mockupBase64}`,
      assetId: asset?.id || assetId,
      usage: { used: usage.used + 1, limit: usage.limit, resetLabel: usage.resetLabel },
    })
  } catch (error: any) {
    console.error('POST /api/partners/design/mockup error:', error)
    return NextResponse.json(
      { error: error.message || 'Error generando mockup' },
      { status: 500 },
    )
  }
}
