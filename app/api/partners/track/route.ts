import { type NextRequest, NextResponse } from 'next/server'
import { trackEvent } from '@/lib/partners/analytics'

// 1x1 transparent GIF for pixel tracking
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

// POST: Track event via JSON body
export async function POST(request: NextRequest) {
  try {
    const { tenantId, event, data } = await request.json()

    if (!tenantId || !event) {
      return NextResponse.json({ error: 'tenantId and event required' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    // Awaited — NO fire-and-forget. En serverless (Vercel) el invocation puede
    // congelarse apenas se devuelve la response; una promesa sin await pierde
    // la carrera contra ese freeze y el INSERT nunca llega a completarse. Esto
    // dejaba partner_analytics_events en 0 filas de page_view en prod pese a
    // meses de trafico real (trackEvent ya atrapa sus propios errores y
    // nunca tira, asi que await acá no puede romper la respuesta al visitante).
    await trackEvent(tenantId, event, data || {}, {
      referrer: request.headers.get('referer') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      ip,
      visitorId: data?.visitorId,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// GET: Tracking pixel (1x1 GIF) with query params
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tid')
  const event = request.nextUrl.searchParams.get('e') || 'page_view'

  if (tenantId) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    // Awaited — mismo motivo que en POST: sin await, el freeze del lambda
    // gana la carrera y el INSERT nunca se completa.
    await trackEvent(tenantId, event, {}, {
      referrer: request.headers.get('referer') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      ip,
    })
  }

  return new Response(TRANSPARENT_GIF, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  })
}
