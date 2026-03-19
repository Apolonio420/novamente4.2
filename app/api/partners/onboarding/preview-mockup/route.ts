import { NextRequest, NextResponse } from 'next/server'
import { getGeminiClient } from '@/lib/gemini'

// Garment configs for preview mockups
const GARMENTS = [
  { id: 'tshirt-black', label: 'Remera Oversize Negra', garment: 'black oversize t-shirt', color: 'black' },
  { id: 'hoodie-caramel', label: 'Hoodie Caramel', garment: 'caramel/tan oversize hoodie', color: 'caramel' },
  { id: 'tshirt-white', label: 'Remera Classic Blanca', garment: 'white classic fit t-shirt', color: 'white' },
  { id: 'hoodie-black', label: 'Hoodie Negro', garment: 'black oversize hoodie', color: 'black' },
] as const

export async function POST(req: NextRequest) {
  try {
    const { brandName, industry, tagline, colors, garmentIndex = 0 } = await req.json()

    if (!brandName) {
      return NextResponse.json({ error: 'brandName required' }, { status: 400 })
    }

    const garment = GARMENTS[garmentIndex % GARMENTS.length]

    // Build color description
    const colorDesc = (colors || []).filter(Boolean).slice(0, 3).join(', ')
    const contrastColor = garment.color === 'black' || garment.color === 'caramel'
      ? 'light/white tones'
      : 'dark/bold tones'

    const prompt = [
      `Professional product photography of a ${garment.garment} with a custom screen-printed graphic design.`,
      `The design is for "${brandName}"${industry ? `, a ${industry} brand` : ''}.`,
      tagline ? `Brand tagline: "${tagline}".` : '',
      colorDesc ? `Design colors: ${colorDesc} with ${contrastColor} for contrast on ${garment.color} fabric.` : `Design uses ${contrastColor} for contrast on ${garment.color} fabric.`,
      `The graphic is a bold, modern streetwear-style illustration or typography printed on the chest area.`,
      `Style: high-end merch brand lookbook photo, studio lighting, clean dark gradient background.`,
      `The garment should be shown flat-lay or on invisible mannequin, centered, full garment visible.`,
      `DO NOT include any human models or faces. DO NOT add watermarks or text overlays.`,
      `The printed design should be creative, artistic, and clearly visible on the garment.`,
    ].filter(Boolean).join(' ')

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview',
    })

    const result = await model.generateContent([prompt])

    // Extract base64 image from response
    let imageBase64: string | null = null
    let mimeType = 'image/png'

    for (const cand of result.response?.candidates ?? []) {
      for (const part of cand?.content?.parts ?? []) {
        const inline = (part as any)?.inlineData
        if (inline?.mimeType?.startsWith('image/') && typeof inline?.data === 'string') {
          imageBase64 = inline.data
          mimeType = inline.mimeType
          break
        }
      }
      if (imageBase64) break
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image generated' }, { status: 422 })
    }

    return NextResponse.json({
      success: true,
      image: `data:${mimeType};base64,${imageBase64}`,
      garment: garment.id,
      label: garment.label,
    })
  } catch (err: unknown) {
    console.error('Preview mockup error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error generating mockup' },
      { status: 500 },
    )
  }
}
