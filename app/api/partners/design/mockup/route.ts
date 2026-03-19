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
      return NextResponse.json(
        {
          error: `Alcanzaste el límite de ${usage.limit} generaciones ${usage.resetLabel}. Upgrade tu plan para más.`,
          usage,
        },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { designImageUrl, garmentType, garmentColor, side, sessionId } = body

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

    // Fetch design image as base64
    let designBase64: string
    if (designImageUrl.startsWith('data:')) {
      designBase64 = designImageUrl.replace(/^data:image\/[^;]+;base64,/, '')
    } else {
      const imgResp = await fetch(designImageUrl)
      if (!imgResp.ok) {
        return NextResponse.json({ error: 'No se pudo descargar la imagen del diseno' }, { status: 400 })
      }
      const imgBuf = await imgResp.arrayBuffer()
      designBase64 = Buffer.from(imgBuf).toString('base64')
    }

    // Fetch garment base image via HTTP
    const h = await headers()
    const origin = h.get('origin') || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

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
    const placement = sideChoice === 'back'
      ? 'Coloca el diseno en la espalda de la prenda, centrado'
      : 'Coloca el diseno en el frente de la prenda, centrado'

    const promptText = `Aplica este diseno a la prenda siguiendo estas instrucciones:
- ${placement}
- Tamano mediano-grande del diseno
- Manten la forma y proporciones originales de la prenda
- El diseno debe verse natural y bien integrado
- Devuelve solo la imagen final de la prenda con el diseno aplicado`

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image-preview',
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
