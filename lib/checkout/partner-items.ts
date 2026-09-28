/**
 * Datos de los ítems de TIENDA PARTNER resueltos en el servidor, al crear el
 * pedido (los dos checkouts: /api/checkout y /api/checkout/transfer).
 *
 * Por qué (27/09/2026, NOV-20260926-9852): el checkout por transferencia no
 * guardaba `order_items.partner_product_id` (el de MP sí), el color quedaba
 * "unknown" cuando el producto no tiene selector de color, y nada registraba si
 * la prenda llevaba doble estampa — que define el costo del partner (+$3.500).
 * El ledger terminaba adivinando el producto por nombre.
 *
 * Todo sale de `partner_products`, no del carrito:
 *  - `partner_product_id`: solo si el producto existe (un id inválido rompería
 *    el insert — la columna es uuid).
 *  - `metadata.doble_estampa`: el producto se estampa en frente y dorso
 *    (lib/partners/partner-cost.ts). Se escribe DESPUÉS del spread de la metadata
 *    del carrito para que el navegador no pueda pisarlo.
 *  - `product_color`: si el carrito no trajo color, el del producto.
 * Para ítems que no son de partner (/crear, liquidación), `doble_estampa` sale
 * del arte que va a producción (frente y dorso).
 */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { esDobleEstampa } from '@/lib/partners/partner-cost'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface DatosPartnerItem {
  productId: string
  tenantId: string | null
  dobleEstampa: boolean
  color: string | null
}

export async function datosPartnerDeItems(ids: Array<string | null | undefined>): Promise<Map<string, DatosPartnerItem>> {
  const unicos = [...new Set(ids.filter((x): x is string => typeof x === 'string' && UUID.test(x)))]
  const out = new Map<string, DatosPartnerItem>()
  if (!unicos.length) return out
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('partner_products')
      .select('id, tenant_id, metadata')
      .in('id', unicos)
    if (error) {
      console.error('[checkout] datosPartnerDeItems:', error.message)
      return out
    }
    for (const p of data || []) {
      const meta = (p.metadata || {}) as Record<string, unknown>
      out.set(String(p.id).toLowerCase(), {
        productId: p.id,
        tenantId: p.tenant_id ?? null,
        dobleEstampa: esDobleEstampa(meta),
        color: typeof meta.color === 'string' && meta.color.trim() ? meta.color.trim() : null,
      })
    }
  } catch (e: any) {
    console.error('[checkout] datosPartnerDeItems exception:', e?.message)
  }
  return out
}

interface OrderItemDraft {
  partner_product_id?: string | null
  product_color?: string | null
  front_design_url?: string | null
  back_design_url?: string | null
  metadata?: Record<string, unknown> | null
  [key: string]: unknown
}

export function enriquecerItemPartner<T extends OrderItemDraft>(
  item: T,
  datos: Map<string, DatosPartnerItem>,
): T {
  const id = typeof item.partner_product_id === 'string' ? item.partner_product_id.toLowerCase() : null
  const d = id ? datos.get(id) : undefined
  const metadata: Record<string, unknown> = { ...(item.metadata || {}) }
  if (!d) {
    metadata.doble_estampa = !!(item.front_design_url && item.back_design_url)
    return { ...item, partner_product_id: null, metadata }
  }
  metadata.doble_estampa = d.dobleEstampa
  const sinColor = !item.product_color || item.product_color === 'unknown'
  return {
    ...item,
    partner_product_id: d.productId,
    product_color: sinColor && d.color ? d.color : item.product_color,
    metadata,
  }
}

/** Atajo: resuelve y enriquece todos los ítems de un pedido. */
export async function enriquecerItemsPartner<T extends OrderItemDraft>(items: T[]): Promise<T[]> {
  const datos = await datosPartnerDeItems(items.map((i) => i.partner_product_id))
  return items.map((it) => enriquecerItemPartner(it, datos))
}
