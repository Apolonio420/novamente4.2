import { NextRequest, NextResponse } from 'next/server'
import { generateLifestyleMockup } from '@/lib/partners/lifestyle-mockup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * POST /api/partners/mockup/lifestyle
 *
 * Generates a lifestyle mockup by compositing a design onto a real photo
 * of a person wearing the garment.
 *
 * Body:
 *   designImageUrl: string  — URL of the front design/stamp
 *   garmentType: string     — e.g. 'tshirt', 'hoodie', 'remera', 'buzo'
 *   garmentColor: string    — e.g. 'black', 'white', 'negro', 'blanco'
 *   tenantId: string        — tenant UUID
 *   productSlug: string     — product slug for output naming
 *   isSmallLogo?: boolean   — if true, places as small chest logo
 *   customBaseUrl?: string  — optional custom lifestyle photo URL
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { designImageUrl, garmentType, garmentColor, tenantId, productSlug } = body

    if (!designImageUrl || !garmentType || !garmentColor || !tenantId || !productSlug) {
      return NextResponse.json(
        { error: 'Required: designImageUrl, garmentType, garmentColor, tenantId, productSlug' },
        { status: 400 },
      )
    }

    const mockupUrl = await generateLifestyleMockup({
      designImageUrl,
      garmentType,
      garmentColor,
      tenantId,
      productSlug,
      isSmallLogo: body.isSmallLogo || false,
      customBaseUrl: body.customBaseUrl,
    })

    if (!mockupUrl) {
      return NextResponse.json({ error: 'Failed to generate lifestyle mockup' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: mockupUrl })
  } catch (err) {
    console.error('Lifestyle mockup API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
