/**
 * Lifestyle Mockup Generator
 * --------------------------
 * Composites a design/stamp onto a real lifestyle photo of a garment
 * using Gemini's image generation capabilities.
 *
 * Usage:
 *   const url = await generateLifestyleMockup({
 *     designImageUrl: 'https://...front.png',
 *     garmentType: 'tshirt',
 *     garmentColor: 'black',
 *     tenantId: 'uuid',
 *     productSlug: 'remera-emocional',
 *   })
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getGeminiClient } from '@/lib/gemini'
import fs from 'fs'
import path from 'path'

const BUCKET = 'partner-assets'

// Map garment type + color → lifestyle base photos (from /public/products/)
const LIFESTYLE_BASES: Record<string, string[]> = {
  // T-shirts
  'tshirt-black': [
    '/products/tshirt-negra-lifestyle-2.jpeg',
  ],
  'tshirt-negro': [
    '/products/tshirt-negra-lifestyle-2.jpeg',
  ],
  'tshirt-white': [
    '/products/tshirt-blanca-lifestyle-1.jpeg',
  ],
  'tshirt-blanco': [
    '/products/tshirt-blanca-lifestyle-1.jpeg',
  ],
  'tshirt-caramel': [
    '/products/tshirt-caramel-lifestyle-1.jpeg',
  ],
  'remera-black': [
    '/products/tshirt-negra-lifestyle-2.jpeg',
  ],
  'remera-negro': [
    '/products/tshirt-negra-lifestyle-2.jpeg',
  ],
  'remera-white': [
    '/products/tshirt-blanca-lifestyle-1.jpeg',
  ],
  'remera-blanco': [
    '/products/tshirt-blanca-lifestyle-1.jpeg',
  ],
  // Hoodies
  'hoodie-black': [
    '/products/hoodie-negro-lifestyle-1.jpeg',
  ],
  'hoodie-negro': [
    '/products/hoodie-negro-lifestyle-1.jpeg',
  ],
  'hoodie-caramel': [
    '/products/hoodie-caramel-lifestyle-1.jpeg',
  ],
  'hoodie-crema': [
    '/products/hoodie-crema-lifestyle.png',
  ],
  'hoodie-white': [
    '/products/hoodie-crema-lifestyle.png',
  ],
  'hoodie-blanco': [
    '/products/hoodie-crema-lifestyle.png',
  ],
  'buzo-black': [
    '/products/hoodie-negro-lifestyle-1.jpeg',
  ],
  'buzo-negro': [
    '/products/hoodie-negro-lifestyle-1.jpeg',
  ],
  'buzo-caramel': [
    '/products/hoodie-caramel-lifestyle-1.jpeg',
  ],
}

// Fallback: if no exact match, try by garment type only
const FALLBACK_BY_TYPE: Record<string, string> = {
  'tshirt': '/products/tshirt-negra-lifestyle-2.jpeg',
  'remera': '/products/tshirt-negra-lifestyle-2.jpeg',
  'hoodie': '/products/hoodie-negro-lifestyle-1.jpeg',
  'buzo': '/products/hoodie-negro-lifestyle-1.jpeg',
}

function getLifestyleBasePath(garmentType: string, garmentColor: string): string | null {
  const typeNorm = garmentType.toLowerCase().replace(/\s+/g, '-')
  const colorNorm = garmentColor.toLowerCase().replace(/\s+/g, '-')

  // Try exact match
  const key = `${typeNorm}-${colorNorm}`
  if (LIFESTYLE_BASES[key]?.[0]) return LIFESTYLE_BASES[key][0]

  // Try type-only fallback
  for (const [prefix, fallback] of Object.entries(FALLBACK_BY_TYPE)) {
    if (typeNorm.includes(prefix)) return fallback
  }

  // Last resort
  return '/products/tshirt-negra-lifestyle-2.jpeg'
}

function buildCompositePrompt(garmentType: string, isSmallLogo: boolean): string {
  const garmentName = garmentType.toLowerCase().includes('hoodie') || garmentType.toLowerCase().includes('buzo')
    ? 'hoodie'
    : 't-shirt'

  if (isSmallLogo) {
    return `Take this design/logo (first image) and realistically composite it onto the upper left chest area of the ${garmentName} the person is wearing in the second photo. The logo should be small, positioned on the chest like a mini logo placement. It should follow the natural folds and contours of the fabric, with proper perspective, lighting and shadow matching. The result should look like a real photo of someone wearing this ${garmentName} with a small chest logo. Keep the exact same photo composition, background, and model pose. Only add the small logo to the ${garmentName}.`
  }

  return `Take this design/print (first image) and realistically composite it onto the chest area of the ${garmentName} the person is wearing in the second photo. The design should follow the natural folds and contours of the fabric, with proper perspective, lighting and shadow matching. The result should look like a real photo of someone wearing this printed ${garmentName}. Keep the exact same photo composition, background, and model pose. Only add the print to the ${garmentName}.`
}

export interface LifestyleMockupParams {
  /** URL of the design/stamp image (front of the product) */
  designImageUrl: string
  /** e.g. 'tshirt', 'hoodie', 'remera', 'buzo' */
  garmentType: string
  /** e.g. 'black', 'white', 'negro', 'blanco' */
  garmentColor: string
  /** Tenant UUID for storage path */
  tenantId: string
  /** Product slug for naming the output file */
  productSlug: string
  /** If true, places logo small on chest instead of large print */
  isSmallLogo?: boolean
  /** Optional: provide a custom lifestyle base photo URL instead of auto-selecting */
  customBaseUrl?: string
}

export async function generateLifestyleMockup(params: LifestyleMockupParams): Promise<string | null> {
  const {
    designImageUrl,
    garmentType,
    garmentColor,
    tenantId,
    productSlug,
    isSmallLogo = false,
    customBaseUrl,
  } = params

  try {
    // 1. Get lifestyle base image
    let lifestyleBuffer: Buffer
    let lifestyleMime: string

    if (customBaseUrl) {
      const res = await fetch(customBaseUrl)
      lifestyleBuffer = Buffer.from(await res.arrayBuffer())
      lifestyleMime = res.headers.get('content-type') || 'image/jpeg'
    } else {
      const basePath = getLifestyleBasePath(garmentType, garmentColor)
      if (!basePath) {
        console.error('No lifestyle base found for', garmentType, garmentColor)
        return null
      }
      // Read from public dir
      const fullPath = path.join(process.cwd(), 'public', basePath)
      if (!fs.existsSync(fullPath)) {
        console.error('Lifestyle base file not found:', fullPath)
        return null
      }
      lifestyleBuffer = fs.readFileSync(fullPath)
      lifestyleMime = basePath.endsWith('.png') ? 'image/png' : 'image/jpeg'
    }

    // 2. Get design image
    let designBuffer: Buffer
    let designMime: string

    if (designImageUrl.startsWith('http')) {
      const res = await fetch(designImageUrl)
      designBuffer = Buffer.from(await res.arrayBuffer())
      designMime = res.headers.get('content-type') || 'image/png'
    } else {
      const fullPath = path.join(process.cwd(), 'public', designImageUrl)
      designBuffer = fs.readFileSync(fullPath)
      designMime = designImageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg'
    }

    // 3. Call Gemini with both images — esto compone un stamp/diseño sobre una foto
    // lifestyle (mockup, no generación de arte desde cero) → misma cadena STAMP_MODEL.
    // A/B ciego 2026-07-11: flash gana colocación de estampa. Sin callers activos hoy
    // (código no referenciado), se deja consistente para cuando se use.
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_STAMP_MODEL || process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
    })

    const prompt = buildCompositePrompt(garmentType, isSmallLogo)

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: designMime,
          data: designBuffer.toString('base64'),
        },
      },
      {
        inlineData: {
          mimeType: lifestyleMime,
          data: lifestyleBuffer.toString('base64'),
        },
      },
      prompt,
    ])

    // Extract generated image
    for (const cand of result.response?.candidates ?? []) {
      for (const part of cand?.content?.parts ?? []) {
        const inline = (part as any)?.inlineData
        if (inline?.mimeType?.startsWith('image/') && typeof inline?.data === 'string') {
          // 4. Upload to Supabase Storage
          const ext = inline.mimeType.includes('png') ? 'png' : 'jpg'
          const storagePath = `products/${tenantId}/lifestyle-mockup-${productSlug}.${ext}`
          const buffer = Buffer.from(inline.data, 'base64')

          const { error } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(storagePath, buffer, { contentType: inline.mimeType, upsert: true })

          if (error) {
            console.error('Lifestyle mockup upload error:', error)
            return null
          }

          const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath)
          console.log(`✅ Lifestyle mockup generated: ${productSlug} (${buffer.length} bytes)`)
          return data.publicUrl
        }
      }
    }

    console.error('No image in Gemini response for lifestyle mockup')
    return null
  } catch (err) {
    console.error('Lifestyle mockup generation error:', err)
    return null
  }
}
