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
 *
 * Actualización 01/10 (caso la-blancq): antes esto solo miraba
 * `metadata.color` (singular). Productos con `metadata.colors` PLURAL (el
 * selector de color de la PDP) no tenían forma de completar un color
 * faltante, y si el carrito mandaba el `key` interno (ej. "stone-wash") en vez
 * del nombre visible ("Stone Wash") no se normalizaba. Ahora:
 *  - con 1 solo color definido en `colors[]`, se usa como default (igual que
 *    el singular).
 *  - si el carrito trae un color que matchea por `key` o por `name` contra
 *    `colors[]`, se normaliza al `name` canónico.
 *  - si no hay forma de resolverlo, se deja 'unknown' (no bloquea la compra)
 *    pero se loguea con console.warn para poder encontrarlo después.
 */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { esDobleEstampa } from '@/lib/partners/partner-cost'
import { parsePartnerProductColors, type ParsedPartnerColor } from '@/lib/partners/product-colors'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface DatosPartnerItem {
  productId: string
  tenantId: string | null
  dobleEstampa: boolean
  /** Color a usar cuando el carrito no trajo ninguno (metadata.color singular, o
   *  el único color de metadata.colors[] si hay exactamente uno). */
  color: string | null
  /** Colores definidos en metadata.colors[] (ya resueltos a name/hex/key) —
   *  usado para normalizar lo que mande el carrito. Vacío si el producto no
   *  define `colors[]`. */
  colorOptions?: ParsedPartnerColor[]
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
      const garmentKey = typeof meta.garmentKey === 'string' ? meta.garmentKey : undefined
      const colorOptions = parsePartnerProductColors(garmentKey, meta.colors, meta.available_colors)
      const singular = typeof meta.color === 'string' && meta.color.trim() ? meta.color.trim() : null
      const colorDefault = singular || (colorOptions.length === 1 ? colorOptions[0].name : null)
      out.set(String(p.id).toLowerCase(), {
        productId: p.id,
        tenantId: p.tenant_id ?? null,
        dobleEstampa: esDobleEstampa(meta),
        color: colorDefault,
        colorOptions,
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

  const rawColor = typeof item.product_color === 'string' ? item.product_color.trim() : ''
  const sinColor = !rawColor || rawColor.toLowerCase() === 'unknown'
  // El carrito puede mandar el `key` interno (ej. "stone-wash") en vez del
  // nombre visible — normalizamos al name canónico de metadata.colors[].
  const matched = !sinColor
    ? (d.colorOptions || []).find(
        (c) => c.name.toLowerCase() === rawColor.toLowerCase() || (c.key && c.key.toLowerCase() === rawColor.toLowerCase()),
      )
    : undefined

  let finalColor: string | null | undefined = item.product_color
  if (matched) {
    finalColor = matched.name
  } else if (sinColor && d.color) {
    finalColor = d.color
  }

  if (!finalColor || finalColor.toLowerCase() === 'unknown') {
    // No bloquea la compra — solo queda identificable en los logs para ir a
    // buscar qué producto sigue sin color cargado.
    console.warn('[checkout] item sin color', { partnerProductId: d.productId, itemName: (item as Record<string, unknown>).item_name })
  }

  return {
    ...item,
    partner_product_id: d.productId,
    product_color: finalColor,
    metadata,
  }
}

/** Atajo: resuelve y enriquece todos los ítems de un pedido. */
export async function enriquecerItemsPartner<T extends OrderItemDraft>(items: T[]): Promise<T[]> {
  const datos = await datosPartnerDeItems(items.map((i) => i.partner_product_id))
  return items.map((it) => enriquecerItemPartner(it, datos))
}
