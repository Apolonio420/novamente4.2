/**
 * POST /api/partners/catalog/bulk-price
 *
 * Actualiza el precio (o un % de variacion) sobre todos los productos del
 * partner que cumplan un filtro. Permite cambiar precios masivamente sin
 * editar producto por producto.
 *
 * Body (alguna de estas combinaciones):
 *   {
 *     filter: {
 *       category?: string          // ej "Buzo" — matchea categorias que
 *                                  //   contengan ese texto (case-insensitive)
 *       categoryEquals?: string    // match exacto
 *       productIds?: string[]      // ids especificos
 *     },
 *     // Una de estas dos:
 *     setPrice?: number            // setea ese precio fijo (ARS)
 *     adjustPct?: number           // ajusta por % (ej +10 = +10%, -5 = -5%)
 *     // Opcional: tambien actualizar compare_at_price (precio tachado)
 *     setCompareAtPrice?: number | null
 *   }
 *
 * Respuesta:
 *   { updated: number, products: PartnerProduct[] }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const db = () => supabaseAdmin as any

export async function POST(request: NextRequest) {
  const result = await getRequestTenant(request)
  if (!result) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const { tenant } = result

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  const filter = (body.filter || {}) as {
    category?: string
    categoryEquals?: string
    productIds?: string[]
  }
  const setPrice = typeof body.setPrice === 'number' ? body.setPrice : undefined
  const adjustPct = typeof body.adjustPct === 'number' ? body.adjustPct : undefined
  const setCompareAtPrice =
    body.setCompareAtPrice === null ? null
    : typeof body.setCompareAtPrice === 'number' ? body.setCompareAtPrice
    : undefined

  if (setPrice === undefined && adjustPct === undefined && setCompareAtPrice === undefined) {
    return NextResponse.json(
      { error: 'Falta operacion: setPrice, adjustPct o setCompareAtPrice' },
      { status: 400 },
    )
  }
  if (setPrice !== undefined && setPrice < 0) {
    return NextResponse.json({ error: 'setPrice no puede ser negativo' }, { status: 400 })
  }

  // 1) Cargar productos del tenant que matcheen el filtro
  let query = db()
    .from('partner_products')
    .select('id, name, category, price, compare_at_price, status')
    .eq('tenant_id', tenant.id)

  if (filter.productIds && filter.productIds.length > 0) {
    query = query.in('id', filter.productIds)
  } else if (filter.categoryEquals) {
    query = query.ilike('category', filter.categoryEquals)
  } else if (filter.category) {
    // Match parcial case-insensitive (Postgres ilike con wildcards)
    query = query.ilike('category', `%${filter.category}%`)
  } else {
    return NextResponse.json(
      { error: 'Falta filter.category, filter.categoryEquals o filter.productIds' },
      { status: 400 },
    )
  }

  const { data: products, error: selErr } = await query
  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 })
  }
  if (!products || products.length === 0) {
    return NextResponse.json({ updated: 0, products: [] })
  }

  // 2) Para cada producto, calcular el nuevo precio y actualizar
  const updatedProducts: any[] = []
  for (const p of products) {
    const updates: Record<string, any> = {}
    if (setPrice !== undefined) {
      updates.price = setPrice
    } else if (adjustPct !== undefined && p.price != null) {
      updates.price = Math.max(0, Math.round(p.price * (1 + adjustPct / 100)))
    }
    if (setCompareAtPrice !== undefined) {
      updates.compare_at_price = setCompareAtPrice
    }
    if (Object.keys(updates).length === 0) continue

    const { data: updated, error: updErr } = await db()
      .from('partner_products')
      .update(updates)
      .eq('id', p.id)
      .eq('tenant_id', tenant.id) // safeguard
      .select()
      .single()
    if (updErr) {
      console.warn(`bulk-price update failed for ${p.id}:`, updErr.message)
      continue
    }
    if (updated) updatedProducts.push(updated)
  }

  return NextResponse.json({ updated: updatedProducts.length, products: updatedProducts })
}
