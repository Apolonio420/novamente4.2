import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import {
  getDesignConfig,
  validateDesignAccess,
  buildTenantPrompt,
  saveDesignAsset,
} from '@/lib/partners/design-engine'
import { getGeminiClient } from '@/lib/gemini'
import { uploadFile } from '@/lib/cloudflare-r2'
import { v4 as uuidv4 } from 'uuid'
import type { Plan } from '@/lib/partners/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { tenant } = result
    const config = await getDesignConfig(tenant.id)

    // Validate access
    const access = validateDesignAccess(
      config.mode || tenant.design_engine_mode,
      tenant.plan as Plan,
      'generate',
    )

    if (!access.allowed) {
      return NextResponse.json({ error: (access as any).reason }, { status: 403 })
    }

    const body = await request.json()
    const { prompt, style, garmentColor, garmentType } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'El prompt es obligatorio' }, { status: 400 })
    }

    // Build tenant-aware prompt
    const optimizedPrompt = buildTenantPrompt(config, prompt.trim(), style, garmentColor)

    console.log(`[design-engine] Generating for tenant ${tenant.slug}:`, optimizedPrompt.substring(0, 100))

    // Call Gemini to generate image
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image-preview',
    })

    const geminiResult = await model.generateContent([optimizedPrompt])
    const response = await geminiResult.response
    const candidates = response.candidates || []

    let imageBase64: string | null = null
    for (const cand of candidates) {
      for (const part of cand.content?.parts || []) {
        if (part.inlineData?.data) {
          imageBase64 = part.inlineData.data
          break
        }
      }
      if (imageBase64) break
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No se pudo generar la imagen. Intenta con otro prompt.' },
        { status: 500 },
      )
    }

    // Upload to storage
    const assetId = uuidv4()
    const storageKey = `partners/${tenant.slug}/designs/${assetId}.png`
    const buffer = Buffer.from(imageBase64, 'base64')

    const uploadResult = await uploadFile(buffer, storageKey, 'image/png')

    // Save to partner_assets
    const asset = await saveDesignAsset(
      tenant.id,
      uploadResult.url,
      storageKey,
      'design',
      {
        prompt: prompt.trim(),
        style: style || null,
        garmentColor: garmentColor || null,
        garmentType: garmentType || null,
        optimizedPrompt: optimizedPrompt.substring(0, 200),
      },
    )

    return NextResponse.json({
      imageUrl: uploadResult.url,
      imageBase64: `data:image/png;base64,${imageBase64}`,
      assetId: asset?.id || assetId,
    })
  } catch (error: any) {
    console.error('POST /api/partners/design/generate error:', error)
    return NextResponse.json(
      { error: error.message || 'Error generando diseno' },
      { status: 500 },
    )
  }
}
