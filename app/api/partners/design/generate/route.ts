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
import { checkPromptModeration, getGeminiSafetySettings } from '@/lib/partners/studio/moderation'
import { checkUsageLimit, recordUsage } from '@/lib/partners/studio/usage-tracker'
import { extractBrandEssence, buildBrandAwarePrompt } from '@/lib/partners/studio/prompt-builder'

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
      'generate',
    )

    if (!access.allowed) {
      return NextResponse.json({ error: (access as any).reason }, { status: 403 })
    }

    const body = await request.json()
    const { prompt, style, garmentColor, garmentType, sessionId, useBrandEssence } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'El prompt es obligatorio' }, { status: 400 })
    }

    // Content moderation
    const moderation = checkPromptModeration(prompt)
    if (!moderation.passed) {
      return NextResponse.json(
        { error: moderation.reason, moderation: 'blocked' },
        { status: 400 },
      )
    }

    // Usage limit check
    const { allowed, usage } = await checkUsageLimit(tenant.id, tenant.plan)
    if (!allowed) {
      const upsell =
        tenant.plan === 'starter'
          ? 'Subí a Growth y generá diseños SIN LÍMITE 🚀 (o pasá a Pro para el combo completo).'
          : 'Escribinos por WhatsApp y te ampliamos el límite.'
      return NextResponse.json(
        {
          error: `Llegaste al límite de ${usage.limit} diseños ${usage.resetLabel}. ${upsell}`,
          usage,
          upsell: tenant.plan === 'starter' ? 'growth' : null,
          moderation: 'usage_exceeded',
        },
        { status: 429 },
      )
    }

    // Build prompt — optionally with brand essence
    let optimizedPrompt: string
    if (useBrandEssence !== false) {
      const essence = extractBrandEssence(tenant as any, config as any)
      const brandPrompt = buildBrandAwarePrompt(prompt.trim(), essence, style)
      optimizedPrompt = buildTenantPrompt(config, brandPrompt, style, garmentColor)
    } else {
      optimizedPrompt = buildTenantPrompt(config, prompt.trim(), style, garmentColor)
    }

    console.log(`[design-engine] Generating for tenant ${tenant.slug}:`, optimizedPrompt.substring(0, 100))

    // Call Gemini with safety settings.
    // Default a Nano Banana 2 (gemini-3.1-flash-image) que es el modelo
    // de DISEÑO. El sufijo -preview en 2.5 fue retirado cuando paso a GA — usar
    // el preview del 3.1 (que sigue en preview) o setear GEMINI_DESIGN_MODEL
    // explicito en env. Antes hardcodeaba gemini-2.5-flash-image que ya
    // no resuelve = causa del bug "no genera imagenes" reportado.
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_DESIGN_MODEL || process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
      safetySettings: getGeminiSafetySettings() as any,
    })

    const geminiResult = await model.generateContent([optimizedPrompt])
    const response = await geminiResult.response

    // Check for safety blocks
    if (response.promptFeedback?.blockReason) {
      return NextResponse.json(
        {
          error: 'El contenido fue bloqueado por nuestros filtros de seguridad. Probá con otro prompt.',
          moderation: 'gemini_blocked',
        },
        { status: 400 },
      )
    }

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
        sessionId: sessionId || null,
      },
    )

    // Record usage
    await recordUsage(tenant.id, userId, 'design', sessionId, asset?.id).catch(() => {})

    return NextResponse.json({
      imageUrl: uploadResult.url,
      imageBase64: `data:image/png;base64,${imageBase64}`,
      assetId: asset?.id || assetId,
      usage: { used: usage.used + 1, limit: usage.limit, resetLabel: usage.resetLabel },
    })
  } catch (error: any) {
    console.error('POST /api/partners/design/generate error:', error)
    return NextResponse.json(
      { error: error.message || 'Error generando diseno' },
      { status: 500 },
    )
  }
}
