import { NextRequest, NextResponse } from 'next/server'
import { getStorefrontBySlug } from '@/lib/partners/unified-directory'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const storefront = await getStorefrontBySlug(slug)

    if (!storefront) {
      return NextResponse.json({ error: 'Storefront no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ storefront })
  } catch (error) {
    console.error('GET /api/partners/storefront/[slug] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
