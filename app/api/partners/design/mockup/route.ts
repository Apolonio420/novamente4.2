import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireTenantPermission } from '@/lib/partners/permissions'
import {
  getDesignConfig,
  validateDesignAccess,
  getAvailableGarments,
  saveDesignAsset,
  resolveDesignEngineMode,
} from '@/lib/partners/design-engine'
import { getGarmentMapping } from '@/lib/garment-mappings'
import { uploadFile } from '@/lib/cloudflare-r2'
import { v4 as uuidv4 } from 'uuid'
import type { Plan } from '@/lib/partners/types'
import { checkUsageLimit, recordUsage } from '@/lib/partners/studio/usage-tracker'
import { meterPublicImageGen } from '@/lib/security/meter-usage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'designs:write')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant
    const userId = auth.userId
    const config = await getDesignConfig(tenant.id)

    // Validate access
    const access = validateDesignAccess(
      resolveDesignEngineMode(tenant),
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
    const { designImageUrl, garmentType, garmentColor, side, stampMode, placement, stampWidthCm, sessionId } = body

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

    // Si no hay base mapeada para esta combinación (garmentPath === "fallback"),
    // avisamos claro en vez de tirar un 500 (mismo guard que el studio).
    if (mapping?.garmentPath === 'fallback') {
      const msg = sideChoice === 'back'
        ? 'El dorso de esta prenda todavía no está disponible para mockup. Probá con el frente 🙌'
        : 'Esta combinación de prenda/color todavía no está disponible para mockup.'
      return NextResponse.json({ error: msg }, { status: 422 })
    }

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

    let garmentBase64 = ''
    try {
      const gResp = await fetch(garmentUrl)
      if (!gResp.ok) throw new Error(`Garment fetch failed: ${gResp.status}`)
      const gBuf = await gResp.arrayBuffer()
      garmentBase64 = Buffer.from(gBuf).toString('base64')
    } catch (e: any) {
      console.warn('Garment fetch failed:', e.message)
      garmentBase64 = ''
    }

    // Motor de mockups "perfecto" (PoC validado 2026-06-24): quita el fondo del
    // diseño (gemini-2.5-flash-image) + cuadro rojo DINÁMICO sobre el área de
    // impresión + estampa (prompt best-of, modelo STAMP_MODEL — default flash desde 2026-07-11). Reemplaza el
    // compositor sharp determinístico (pegado plano que Apo rechazaba).
    if (!garmentBase64) {
      return NextResponse.json({ error: 'No se pudo cargar la prenda base' }, { status: 500 })
    }
    const stampSize: 'R1' | 'R2' | 'R3' =
      stampMode === 'chest-logo' ? 'R1' : stampMode === 'medium' ? 'R2' : 'R3'

    // Tamaño exacto en cm. El cuadro rojo es sólo una sugerencia para el modelo:
    // medido sobre un póster pedido como logo chico, salía a 21 cm en vez de los
    // ~10 que promete la UI. Cuando la medida importa se compone acá.
    //
    // 'Chico / Logo' arranca en los 10 cm de su propia etiqueta; el cliente puede
    // pedir otra medida mandando stampWidthCm. Mediano y grande siguen por el
    // cuadro rojo, donde el tamaño es menos crítico.
    const anchoCm =
      Number(stampWidthCm) > 0 ? Number(stampWidthCm)
      : stampSize === 'R1' ? 10
      : undefined
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
        stampSize,
        placement,
        stampWidthCm: anchoCm,
      })
      mockupBase64 = mockupBuffer.toString('base64')
    } catch (e) {
      console.error('[partners/design/mockup] perfect-stamp error:', e)
      return NextResponse.json({ error: 'No se pudo generar el mockup' }, { status: 500 })
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
        // stampMode + placement quedan guardados para poder reconstruir DÓNDE
        // cayó la estampa de un mockup viejo (sin esto no hay forma de saberlo).
        stampMode: stampMode || null,
        placement: placement || null,
        stampWidthCm: anchoCm ?? null,
        designImageUrl,
        sessionId: sessionId || null,
      },
    )

    // Record usage (cupo del plan — NO es costo en USD, ver meterPublicImageGen abajo)
    await recordUsage(tenant.id, userId, 'mockup', sessionId, asset?.id).catch(() => {})

    // Metering de costo real en USD — antes de esto el Studio de partners no
    // escribía ninguna fila en api_usage (auditoría factura Gemini jul-2026:
    // 110 mockups sin medir ni un centavo).
    //
    // units sale del CONTADOR REAL, no de un número fijo. Antes era 2 fijo
    // porque el motor siempre hacía dos llamadas (quitar fondo + estampar).
    // Desde que el recorte de fondo se hace determinísticamente, la de quitar
    // fondo sólo se dispara cuando el recorte no muerde — o sea 1 llamada en
    // la mayoría de los mockups. Dejar el 2 fijo sobrecontaría el costo, que
    // es el mismo error de la auditoría 2026-08-09 pero al revés.
    await meterPublicImageGen({
      endpoint: 'partners/studio/mockup',
      model: process.env.GEMINI_STAMP_MODEL ?? process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image',
      units: stampStats.geminiCalls,
      metadata: { tenantSlug: tenant.slug },
    })

    return NextResponse.json({
      mockupUrl: uploadResult.url,
      mockupBase64: `data:image/png;base64,${mockupBase64}`,
      assetId: asset?.id || assetId,
      usage: { used: usage.used + 1, limit: usage.limit, resetLabel: usage.resetLabel, unlimited: usage.unlimited },
    })
  } catch (error: any) {
    console.error('POST /api/partners/design/mockup error:', error)
    return NextResponse.json(
      { error: error.message || 'Error generando mockup' },
      { status: 500 },
    )
  }
}
