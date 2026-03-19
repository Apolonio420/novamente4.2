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

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simple IP rate limiter: max 10 generations per IP per hour
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

    // IP rate limiting
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

    // Tenant usage limit
    const { allowed, usage } = await checkUsageLimit(tenant.id, tenant.plan)
    if (!allowed) {
      return NextResponse.json(
        { error: 'La tienda alcanzó su límite de generaciones. Volvé pronto.' },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { prompt, style, garmentColor } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Describí qué querés diseñar' }, { status: 400 })
    }

    if (prompt.trim().length > 300) {
      return NextResponse.json({ error: 'El texto es demasiado largo (máximo 300 caracteres)' }, { status: 400 })
    }

    // Moderation
    const moderation = checkPromptModeration(prompt)
    if (!moderation.passed) {
      return NextResponse.json({ error: moderation.reason }, { status: 400 })
    }

    // Build brand-aware prompt
    const config = await getDesignConfig(tenant.id)
    const essence = extractBrandEssence(tenant as any, config as any)
    const brandPrompt = buildBrandAwarePrompt(prompt.trim(), essence, style)
    const optimizedPrompt = buildTenantPrompt(config, brandPrompt, style, garmentColor)

    console.log(`[storefront-studio] Generating for ${slug} (customer):`, optimizedPrompt.substring(0, 100))

    // Generate
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image-preview',
      safetySettings: getGeminiSafetySettings() as any,
    })

    const geminiResult = await model.generateContent([optimizedPrompt])
    const response = await geminiResult.response

    if (response.promptFeedback?.blockReason) {
      return NextResponse.json(
        { error: 'El contenido fue bloqueado por seguridad. Probá con otro texto.' },
        { status: 400 },
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
        { status: 500 },
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

    return NextResponse.json({
      imageUrl: uploadResult.url,
    })
  } catch (error: any) {
    console.error('POST /api/storefront/[slug]/studio/generate error:', error)
    return NextResponse.json(
      { error: 'Error generando el diseño. Intentá de nuevo.' },
      { status: 500 },
    )
  }
}
