import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySlug } from '@/lib/partners/tenant'
import { getPlanFeatures } from '@/lib/partners/plans'
import {
  getDesignConfig,
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

    // Rate-limit por IP + tope diario global (DB-backed). Reemplaza el
    // ipLimiter viejo (Map en memoria por instancia — sin techo real en
    // serverless, auditoria 2026-07-11). El checkUsageLimit de abajo sigue
    // aplicando aparte — es el cupo del PLAN del partner, no defensa contra
    // un visitante anonimo abusando de varias tiendas distintas. Un partner
    // con sesion propia (revisando su propia tienda) queda exento — ya paga
    // su propio cupo via checkUsageLimit.
    let isAuthedPartner = false
    try {
      isAuthedPartner = (await getRequestTenant(request)) !== null
    } catch {
      // best-effort — si falla, tratamos como anonimo (no relajamos el guard)
    }
    if (!isAuthedPartner) {
      const guard = await guardPublicImageGen(request, 'storefront-studio-generate')
      if (guard.allowed === false) {
        return NextResponse.json({ error: guard.message }, { status: guard.status, headers: ch })
      }
    }

    // IP para telemetria de saveDesignAsset (no para rate-limit — eso ya lo cubre el guard de arriba)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    const tenant = await getTenantBySlug(slug)
    if (!tenant || !tenant.storefront_published) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404, headers: ch })
    }

    const features = getPlanFeatures(tenant.plan as Plan)
    if (!features.storefrontDesigner) {
      return NextResponse.json({ error: 'No disponible en este plan' }, { status: 403, headers: ch })
    }

    // Tenant usage limit
    const { allowed, usage } = await checkUsageLimit(tenant.id, tenant.plan)
    if (!allowed) {
      return NextResponse.json(
        { error: 'La tienda alcanzó su límite de generaciones. Volvé pronto.' },
        { status: 429, headers: ch },
      )
    }

    const body = await request.json()
    const { prompt, style, garmentColor } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Describí qué querés diseñar' }, { status: 400, headers: ch })
    }

    if (prompt.trim().length > 300) {
      return NextResponse.json({ error: 'El texto es demasiado largo (máximo 300 caracteres)' }, { status: 400, headers: ch })
    }

    // Moderation
    const moderation = checkPromptModeration(prompt)
    if (!moderation.passed) {
      return NextResponse.json({ error: moderation.reason }, { status: 400, headers: ch })
    }

    // Build brand-aware prompt
    const config = await getDesignConfig(tenant.id)
    const essence = extractBrandEssence(tenant as any, config as any)
    const brandPrompt = buildBrandAwarePrompt(prompt.trim(), essence, style)
    const optimizedPrompt = buildTenantPrompt(config, brandPrompt, style, garmentColor)

    console.log(`[storefront-studio] Generating for ${slug} (customer):`, optimizedPrompt.substring(0, 100))

    // Generate
    const modelName = process.env.GEMINI_DESIGN_MODEL || process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image'
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: getGeminiSafetySettings() as any,
    })

    const geminiResult = await model.generateContent([optimizedPrompt])
    const response = await geminiResult.response

    if (response.promptFeedback?.blockReason) {
      return NextResponse.json(
        { error: 'El contenido fue bloqueado por seguridad. Probá con otro texto.' },
        { status: 400, headers: ch },
      )
    }

    let imageBase64: string | null = null
    for (const cand of response.candidates || []) {
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
        { error: 'No se pudo generar la imagen. Probá con otra descripción.' },
        { status: 500, headers: ch },
      )
    }

    // Upload
    const assetId = uuidv4()
    const storageKey = `partners/${slug}/storefront-designs/${assetId}.png`
    const buffer = Buffer.from(imageBase64, 'base64')
    const uploadResult = await uploadFile(buffer, storageKey, 'image/png')

    // Save asset
    await saveDesignAsset(tenant.id, uploadResult.url, storageKey, 'design', {
      prompt: prompt.trim(),
      style: style || null,
      source: 'storefront',
      ip,
    })

    // Record usage (no userId for public — use 'storefront-customer')
    await recordUsage(tenant.id, 'storefront-customer', 'design', undefined, assetId).catch(() => {})

    await meterPublicImageGen({
      endpoint: 'storefront/studio/generate',
      model: modelName,
      metadata: { tenantSlug: slug },
    })

    return NextResponse.json({
      imageUrl: uploadResult.url,
    }, { headers: ch })
  } catch (error: any) {
    console.error('POST /api/storefront/[slug]/studio/generate error:', error)
    return NextResponse.json(
      { error: 'Error generando el diseño. Intentá de nuevo.' },
      { status: 500, headers: ch },
    )
  }
}
