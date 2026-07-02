/**
 * Moderación de reseñas del partner.
 * GET → todas las reviews de sus productos (pending primero)
 * PATCH { id, status: 'approved' | 'rejected' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const auth = await requireTenantPermission(request, 'marketing:read')
  if (!auth.ok) return auth.response
  const sb = supabaseAdmin as any

  const { data: reviews } = await sb
    .from('product_reviews')
    .select('id, product_id, customer_name, rating, title, body, verified_purchase, status, created_at')
    .eq('tenant_id', auth.tenant.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // nombre de producto para mostrar
  const ids = [...new Set((reviews || []).map((r: any) => r.product_id))]
  let names: Record<string, string> = {}
  if (ids.length) {
    const { data: prods } = await sb.from('partner_products').select('id, name').in('id', ids)
    for (const p of prods || []) names[p.id] = p.name
  }
  return NextResponse.json({
    reviews: (reviews || []).map((r: any) => ({ ...r, product_name: names[r.product_id] || '—' })),
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireTenantPermission(request, 'marketing:write')
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '')
  const status = String(body.status || '')
  if (!/^[0-9a-f-]{36}$/i.test(id) || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { error } = await (supabaseAdmin as any)
    .from('product_reviews')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', auth.tenant.id) // solo sus reviews
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
