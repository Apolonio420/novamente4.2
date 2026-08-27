import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import {
  getDesignConfig,
  validateDesignAccess,
  buildTenantPrompt,
  saveDesignAsset,
  resolveDesignEngineMode,
} from '@/lib/partners/design-engine'
import { getGeminiClient } from '@/lib/gemini'
import { uploadFile } from '@/lib/cloudflare-r2'
import { v4 as uuidv4 } from 'uuid'
import type { Plan } from '@/lib/partners/types'
import { checkPromptModeration, getGeminiSafetySettings } from '@/lib/partners/studio/moderation'
import { checkUsageLimit, recordUsage } from '@/lib/partners/studio/usage-tracker'
import { extractBrandEssence, buildBrandAwarePrompt } from '@/lib/partners/studio/prompt-builder'
import { meterPublicImageGen } from '@/lib/security/meter-usage'
import { effectivePlan } from '@/lib/partners/plans'

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
      effectivePlan(tenant),
      'generate',
    )

    if (!access.allowed) {
      return NextResponse.json({ error: (access as any).reason }, { status: 403 })
    }

    const body = await request.json()
    const { prompt, style, garmentColor, garmentType, sessionId, useBrandEssence, attachedImageUrl } = body

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
    const { allowed, usage } = await checkUsageLimit(tenant.id, effectivePlan(tenant))
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
    const modelName = process.env.GEMINI_DESIGN_MODEL || process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image'
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: getGeminiSafetySettings() as any,
    })

    // Imagen de referencia opcional (img2img): el partner subió su propio diseño
    // y quiere VARIACIONES, no una copia. Sin esto, la generación era texto-a-imagen
    // pura y la imagen subida nunca llegaba al modelo (bug reportado: "me devuelve
    // siempre la misma imagen" — en realidad veía el eco de su upload en el chat).
    const referenceImage = await fetchReferenceImage(attachedImageUrl, request)
    const geminiParts: any[] = referenceImage
      ? [
          referenceImage,
          `${optimizedPrompt}\n\nThe attached image is the user's OWN artwork, provided as a reference. Create a NEW rendition of it following the instructions above: preserve the subject, composition, lettering and overall identity of the reference, but apply the requested transformation (style, color, finish). Do NOT return an identical or near-identical copy of the reference image.`,
        ]
      : [optimizedPrompt]

    const geminiResult = await model.generateContent(geminiParts)
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
        attachedImageUrl: attachedImageUrl || null,
      },
    )

    // Record usage (cupo del plan — NO es costo en USD, ver meterPublicImageGen abajo)
    await recordUsage(tenant.id, userId, 'design', sessionId, asset?.id).catch(() => {})

    // Metering de costo real en USD — antes de este cambio este endpoint
    // (Studio de partners) no escribía ninguna fila en api_usage (auditoría
    // factura Gemini jul-2026: 16 diseños de partners sin medir ni un
    // centavo). Mismo patrón que el sibling público
    // app/api/storefront/[slug]/studio/generate/route.ts. usageMetadata se
    // pasa porque el modelo default (gemini-3.1-flash-image) factura
    // "thinking" tokens aparte del precio plano por imagen (ver
    // lib/security/meter-usage.ts).
    await meterPublicImageGen({
      endpoint: 'partners/studio/design',
      model: modelName,
      usageMetadata: (response as any).usageMetadata,
      metadata: { tenantSlug: tenant.slug },
    })

    return NextResponse.json({
      imageUrl: uploadResult.url,
      imageBase64: `data:image/png;base64,${imageBase64}`,
      assetId: asset?.id || assetId,
      usage: { used: usage.used + 1, limit: usage.limit, resetLabel: usage.resetLabel, unlimited: usage.unlimited },
    })
  } catch (error: any) {
    console.error('POST /api/partners/design/generate error:', error)
    return NextResponse.json(
      { error: error.message || 'Error generando diseno' },
      { status: 500 },
    )
  }
}

/**
 * Descarga la imagen de referencia y la devuelve como part inlineData para
 * Gemini, o null si no hay/no se pudo. Mismos casos de URL que soporta el
 * pipeline de mockup (app/api/partners/design/mockup/route.ts): data: URI,
 * /api/proxy-image?key= (lectura directa de R2, evita self-fetch), absoluta
 * y relativa. Falla soft (null + warn): una referencia caída no debe romper
 * la generación — degrada a texto-a-imagen.
 */
async function fetchReferenceImage(
  attachedImageUrl: unknown,
  request: NextRequest,
): Promise<{ inlineData: { data: string; mimeType: string } } | null> {
  if (!attachedImageUrl || typeof attachedImageUrl !== 'string') return null
  const url = attachedImageUrl.trim()
  if (!url) return null

  try {
    if (url.startsWith('data:image/')) {
      const m = url.match(/^data:(image\/[^;]+);base64,(.+)$/)
      if (!m) return null
      return { inlineData: { data: m[2], mimeType: m[1] } }
    }

    if (url.startsWith('/api/proxy-image')) {
      const u = new URL(url, 'http://localhost')
      const key = u.searchParams.get('key')
      if (!key) return null
      const { r2Client, BUCKET_NAME } = await import('@/lib/cloudflare-r2')
      const { GetObjectCommand } = await import('@aws-sdk/client-s3')
      const { normalizeR2Key } = await import('@/lib/r2')
      const normalizedKey = normalizeR2Key(decodeURIComponent(key))
      if (!normalizedKey) return null
      const resp = await r2Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: normalizedKey }))
      const body = resp.Body as any
      const bytes = typeof body.transformToByteArray === 'function'
        ? await body.transformToByteArray()
        : await (async () => {
            const chunks: Buffer[] = []
            for await (const chunk of body) chunks.push(Buffer.from(chunk))
            return Buffer.concat(chunks)
          })()
      const mimeType = resp.ContentType?.startsWith('image/') ? resp.ContentType : 'image/png'
      return { inlineData: { data: Buffer.from(bytes).toString('base64'), mimeType } }
    }

    const host = request.headers.get('host')
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    const origin = host
      ? `${proto}://${host}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'
    const absoluteUrl = url.startsWith('http')
      ? url
      : `${origin}${url.startsWith('/') ? '' : '/'}${url}`
    const imgResp = await fetch(absoluteUrl)
    if (!imgResp.ok) {
      console.warn(`[design-engine] referencia no descargable (${imgResp.status}): ${absoluteUrl}`)
      return null
    }
    const contentType = imgResp.headers.get('content-type') || ''
    const mimeType = contentType.startsWith('image/') ? contentType.split(';')[0] : 'image/png'
    const buf = await imgResp.arrayBuffer()
    return { inlineData: { data: Buffer.from(buf).toString('base64'), mimeType } }
  } catch (err: any) {
    console.warn('[design-engine] error descargando imagen de referencia:', err?.message)
    return null
  }
}
