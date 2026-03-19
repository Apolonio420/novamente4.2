import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getGeminiClient } from '@/lib/gemini'
import { createProduct } from '@/lib/partners/catalog'
import { generateLifestyleMockup } from '@/lib/partners/lifestyle-mockup'
import type { ProductRichMetadata } from '@/lib/partners/product-metadata'

const BUCKET = 'partner-assets'

const GARMENTS = [
  {
    name: 'Remera Oversize',
    category: 'Remeras',
    garment: 'black oversize t-shirt',
    garmentKey: 'tshirt',
    color: 'black',
    colorName: 'Negro',
    colorHex: '#000000',
    price: 28000,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    name: 'Hoodie Premium',
    category: 'Buzos',
    garment: 'caramel/tan oversize hoodie',
    garmentKey: 'hoodie',
    color: 'caramel',
    colorName: 'Caramel',
    colorHex: '#C19A6B',
    price: 45000,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    name: 'Remera Classic',
    category: 'Remeras',
    garment: 'white classic fit t-shirt',
    garmentKey: 'tshirt',
    color: 'white',
    colorName: 'Blanco',
    colorHex: '#FFFFFF',
    price: 22000,
    sizes: ['S', 'M', 'L', 'XL'],
  },
] as const

function buildImagePrompt(
  garment: typeof GARMENTS[number],
  side: 'front' | 'back',
  brandName: string,
  industry: string | null,
  tagline: string | null,
  colors: string[],
): string {
  const contrastColor = garment.color === 'black' || garment.color === 'caramel'
    ? 'light/white tones'
    : 'dark/bold tones'
  const colorDesc = colors.filter(Boolean).slice(0, 3).join(', ')
  const sideDesc = side === 'front'
    ? 'on the chest area, front view'
    : 'on the back, large back print design, rear view'

  return [
    `Professional product photography of a ${garment.garment} with a custom screen-printed graphic design ${sideDesc}.`,
    `The design is for "${brandName}"${industry ? `, a ${industry} brand` : ''}.`,
    tagline ? `Brand tagline: "${tagline}".` : '',
    colorDesc
      ? `Design colors: ${colorDesc} with ${contrastColor} for contrast on ${garment.color} fabric.`
      : `Design uses ${contrastColor} for contrast on ${garment.color} fabric.`,
    `The graphic is a bold, modern streetwear-style illustration or typography.`,
    `Style: high-end merch brand lookbook photo, studio lighting, clean dark gradient background.`,
    `The garment should be shown flat-lay or on invisible mannequin, centered, full garment visible.`,
    `DO NOT include any human models or faces. DO NOT add watermarks or text overlays.`,
    `The printed design should be creative, artistic, and clearly visible on the garment.`,
  ].filter(Boolean).join(' ')
}

async function generateImage(prompt: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview',
    })
    const result = await model.generateContent([prompt])
    for (const cand of result.response?.candidates ?? []) {
      for (const part of cand?.content?.parts ?? []) {
        const inline = (part as any)?.inlineData
        if (inline?.mimeType?.startsWith('image/') && typeof inline?.data === 'string') {
          return { base64: inline.data, mimeType: inline.mimeType }
        }
      }
    }
  } catch (err) {
    console.error('Image generation error:', err)
  }
  return null
}

async function uploadBase64Image(
  base64: string,
  mimeType: string,
  tenantId: string,
  filename: string,
): Promise<string | null> {
  try {
    const ext = mimeType.includes('png') ? 'png' : 'jpg'
    const path = `products/${tenantId}/${filename}.${ext}`
    const buffer = Buffer.from(base64, 'base64')

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: mimeType, upsert: true })

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    console.error('Upload error:', err)
    return null
  }
}

async function generateProductTexts(
  brandName: string,
  industry: string | null,
  tagline: string | null,
  garmentName: string,
  garmentCategory: string,
): Promise<{
  description: string
  detailedDescription: string
  features: string[]
  cardDescription: string
  brandValues: string
}> {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash',
    })

    const prompt = `Generá contenido de producto para una marca de merchandising.

Marca: "${brandName}"
Industria: ${industry || 'merch/streetwear'}
Tagline: ${tagline || 'Diseño con identidad'}
Producto: ${garmentName} (${garmentCategory})

Respondé SOLO con JSON válido (sin backticks ni markdown):
{
  "description": "descripción corta del producto, 1-2 oraciones, max 200 chars, en español",
  "detailedDescription": "descripción detallada del producto y la marca, 2-3 oraciones, max 400 chars, en español",
  "features": ["feature 1", "feature 2", "feature 3", "feature 4"],
  "cardDescription": "descripción ultra corta para la card, max 80 chars, en español",
  "brandValues": "slogan corto de la marca para este producto, max 60 chars"
}`

    const result = await model.generateContent([prompt])
    const text = result.response.text().trim()
    const jsonStr = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    return JSON.parse(jsonStr)
  } catch {
    return {
      description: `${garmentName} con diseño exclusivo de ${brandName}. Calidad premium, hecho en Argentina.`,
      detailedDescription: `Producto oficial de ${brandName}. Cada pieza refleja la identidad y los valores de la marca. Confeccionado con materiales de primera calidad para máxima durabilidad y confort.`,
      features: [
        `Diseño exclusivo de ${brandName}`,
        'Confección premium argentina',
        'Estampa de alta definición',
        'Calce moderno y cómodo',
      ],
      cardDescription: `${garmentName} oficial de ${brandName}. Diseño exclusivo.`,
      brandValues: tagline || `${brandName} — Diseño con identidad`,
    }
  }
}

// Standard sizing table
const STANDARD_SIZING: Record<string, string> = {
  S: 'Largo: 70cm | Ancho: 52cm | Manga: 22cm',
  M: 'Largo: 72cm | Ancho: 54cm | Manga: 23cm',
  L: 'Largo: 74cm | Ancho: 56cm | Manga: 24cm',
  XL: 'Largo: 76cm | Ancho: 58cm | Manga: 25cm',
  XXL: 'Largo: 78cm | Ancho: 60cm | Manga: 26cm',
}

function buildBannerPrompt(
  brandName: string,
  industry: string | null,
  tagline: string | null,
  colors: string[],
): string {
  const colorDesc = colors.filter(Boolean).slice(0, 3).join(', ')
  const industryHint = industry
    ? `The brand is in the "${industry}" industry. The image should evoke the spirit, energy, and culture of ${industry}.`
    : 'The brand is a streetwear/merch brand. The image should evoke urban energy and creative culture.'

  return [
    `Create a stunning, cinematic wide banner image (landscape aspect ratio, roughly 1200x400) for a brand called "${brandName}".`,
    industryHint,
    tagline ? `The brand tagline is: "${tagline}". The image should capture this feeling.` : '',
    `Style: dramatic, high-contrast, black and white or desaturated tones, editorial quality.`,
    `Think of it as a hero banner for a premium merch storefront — atmospheric, evocative, aspirational.`,
    colorDesc ? `Brand colors for subtle accent hints: ${colorDesc}.` : '',
    `The image should be abstract or scene-based (landscapes, textures, action shots, atmospheric scenes).`,
    `DO NOT include any text, logos, watermarks, or human faces.`,
    `DO NOT include any clothing items or products.`,
    `The mood should be powerful, cinematic, and aligned with the brand's identity.`,
  ].filter(Boolean).join(' ')
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId, brandName, industry, tagline, colors } = await req.json()

    if (!tenantId || !brandName) {
      return NextResponse.json({ error: 'tenantId and brandName required' }, { status: 400 })
    }

    const brandColors = (colors || []).filter(Boolean)
    const results: Array<{ name: string; success: boolean; error?: string }> = []

    // --- Generate brand banner (fire first, non-blocking for products) ---
    let bannerUrl: string | null = null
    try {
      const bannerPrompt = buildBannerPrompt(brandName, industry, tagline, brandColors)
      const bannerResult = await generateImage(bannerPrompt)
      if (bannerResult) {
        bannerUrl = await uploadBase64Image(
          bannerResult.base64,
          bannerResult.mimeType,
          tenantId,
          'brand-banner',
        )
        if (bannerUrl) {
          // Update tenant's banner_url
          await (supabaseAdmin as any)
            .from('tenants')
            .update({ banner_url: bannerUrl, updated_at: new Date().toISOString() })
            .eq('id', tenantId)
        }
      }
    } catch (err) {
      console.error('Banner generation error (non-fatal):', err)
    }

    // Generate products sequentially to avoid Gemini rate limits
    for (let i = 0; i < GARMENTS.length; i++) {
      const garment = GARMENTS[i]
      const productName = `${garment.name} ${brandName}`

      try {
        // Generate front and back images in parallel
        const [frontResult, backResult, texts] = await Promise.all([
          generateImage(buildImagePrompt(garment, 'front', brandName, industry, tagline, brandColors)),
          generateImage(buildImagePrompt(garment, 'back', brandName, industry, tagline, brandColors)),
          generateProductTexts(brandName, industry, tagline, garment.name, garment.category),
        ])

        const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

        // Upload images
        const frontUrl = frontResult
          ? await uploadBase64Image(frontResult.base64, frontResult.mimeType, tenantId, `${slug}-${garment.color}-front`)
          : null
        const backUrl = backResult
          ? await uploadBase64Image(backResult.base64, backResult.mimeType, tenantId, `${slug}-${garment.color}-back`)
          : null

        if (!frontUrl) {
          results.push({ name: productName, success: false, error: 'Failed to generate front image' })
          continue
        }

        // Generate lifestyle mockup (design composited on real garment photo)
        let lifestyleMockupUrl: string | null = null
        try {
          lifestyleMockupUrl = await generateLifestyleMockup({
            designImageUrl: frontUrl,
            garmentType: garment.garmentKey,
            garmentColor: garment.color,
            tenantId,
            productSlug: slug,
          })
        } catch (err) {
          console.error(`Lifestyle mockup error for ${slug} (non-fatal):`, err)
        }

        const metadata: ProductRichMetadata = {
          colors: [{
            name: garment.colorName,
            value: garment.color,
            hex: garment.colorHex,
            images: {
              front: frontUrl,
              back: backUrl || frontUrl,
            },
          }],
          sizes: [...garment.sizes],
          lifestyleImages: lifestyleMockupUrl ? [lifestyleMockupUrl] : [],
          detailedDescription: texts.detailedDescription,
          features: texts.features,
          sizing: Object.fromEntries(
            garment.sizes.map((s) => [s, STANDARD_SIZING[s] || ''])
          ),
          brandValues: texts.brandValues,
          cardDescription: texts.cardDescription,
        }

        await createProduct(tenantId, {
          name: productName,
          description: texts.description,
          category: garment.category,
          price: garment.price,
          images: [frontUrl, backUrl].filter(Boolean) as string[],
          tags: [garment.category, brandName],
          metadata: metadata as unknown as Record<string, unknown>,
          status: 'published',
        })

        results.push({ name: productName, success: true })
      } catch (err) {
        console.error(`Error generating product ${garment.name}:`, err)
        results.push({ name: productName, success: false, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      success: successCount > 0,
      generated: successCount,
      total: GARMENTS.length,
      results,
      banner: bannerUrl ? { success: true, url: bannerUrl } : { success: false },
    })
  } catch (err: unknown) {
    console.error('Generate products error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error generating products' },
      { status: 500 },
    )
  }
}
