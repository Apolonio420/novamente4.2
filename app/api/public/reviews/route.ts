/**
 * Reviews públicas de productos de tiendas partner.
 *
 * GET  ?tenant=<slug>&product=<uuid> → aprobadas + promedio
 * POST { tenantSlug, productId, name, rating, title?, body?, email?, website? }
 *      → crea review en 'pending' (el partner la modera en /workspace/reviews).
 *      'website' es honeypot anti-bots: si viene con valor, se descarta.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

// Rate limit simple en memoria por IP (suficiente para una lambda; Vercel
// resetea por instancia, el honeypot + moderación cubren el resto)
const hits = new Map<string, { n: number; t: number }>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now - h.t > 60_000) { hits.set(ip, { n: 1, t: now }); return false }
  h.n++
  return h.n > 5
}

async function tenantIdFromSlug(slug: string): Promise<string | null> {
  const { data } = await (supabaseAdmin as any)
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()
  return data?.id ?? null
}

export async function GET(request: NextRequest) {
  const tenant = request.nextUrl.searchParams.get('tenant') || ''
  const product = request.nextUrl.searchParams.get('product') || ''
  if (!tenant || !product) return NextResponse.json({ error: 'tenant y product requeridos' }, { status: 400 })

  const tenantId = await tenantIdFromSlug(tenant)
  if (!tenantId) return NextResponse.json({ reviews: [], avg: null, count: 0 })

  const { data } = await (supabaseAdmin as any)
    .from('product_reviews')
    .select('id, customer_name, rating, title, body, verified_purchase, created_at')
    .eq('tenant_id', tenantId)
    .eq('product_id', product)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(30)

  const reviews = data ?? []
  const avg = reviews.length
    ? Math.round((reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null
  return NextResponse.json(
    { reviews, avg, count: reviews.length },
    { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } },
  )
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimited(ip)) return NextResponse.json({ error: 'Demasiados intentos, probá en un rato' }, { status: 429 })

  const body = await request.json().catch(() => ({}))
  // honeypot: los bots completan todos los campos
  if (body.website) return NextResponse.json({ ok: true })

  const tenantSlug = String(body.tenantSlug || '').slice(0, 80)
  const productId = String(body.productId || '')
  const name = String(body.name || '').trim().slice(0, 80)
  const rating = Math.round(Number(body.rating))
  const title = body.title ? String(body.title).trim().slice(0, 120) : null
  const text = body.body ? String(body.body).trim().slice(0, 1500) : null
  const email = body.email ? String(body.email).trim().slice(0, 120) : null

  if (!tenantSlug || !/^[0-9a-f-]{36}$/i.test(productId)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  if (!name || name.length < 2) return NextResponse.json({ error: 'Decinos tu nombre' }, { status: 400 })
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Elegí una puntuación de 1 a 5' }, { status: 400 })
  }

  const tenantId = await tenantIdFromSlug(tenantSlug)
  if (!tenantId) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })

  // verified_purchase: el email coincide con una orden confirmada del tenant
  let verified = false
  if (email) {
    const { data: order } = await (supabaseAdmin as any)
      .from('orders')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('customer_email', email)
      .eq('status', 'confirmed')
      .limit(1)
      .maybeSingle()
    verified = !!order
  }

  const { error } = await (supabaseAdmin as any).from('product_reviews').insert({
    tenant_id: tenantId,
    product_id: productId,
    customer_name: name,
    customer_email: email,
    rating,
    title,
    body: text,
    verified_purchase: verified,
    status: 'pending',
  })
  if (error) {
    console.error('[reviews] insert error:', error.message)
    return NextResponse.json({ error: 'No pudimos guardar tu reseña' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, pending: true })
}
