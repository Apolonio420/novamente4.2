import { supabaseAdmin } from '@/lib/supabase-admin'
import { getLiquidationStock, matchGarmentKey, matchStockColor, normalizeStockSize } from '@/lib/stock/liquidation'

/**
 * Validación de stock EN EL SUBMIT del pedido (server-side).
 *
 * Por qué existe: el stock (tanto `partner_products.stock` como
 * `garment_stock` de liquidación) recién se decrementaba al CONFIRMARSE el
 * pago (lib/payments/process-payment.ts) — nada impedía que el navegador
 * mandara un talle ya agotado al submit, así que la compra se aceptaba igual
 * y sólo el stock quedaba en 0 (clampeado) después.
 *
 * Convención respetada (misma que lib/stock/liquidation.ts y
 * partner_products.stock): SIN FILA/valor null = stock libre/ilimitado. Sólo
 * se rechaza cuando hay un tope cargado Y la cantidad pedida lo supera.
 */
export interface ItemAValidarStock {
  productId?: string | null
  partner_product_id?: string | null
  garmentType?: string | null
  product_type?: string | null
  color?: string | null
  product_color?: string | null
  size?: string | null
  product_size?: string | null
  quantity?: number | null
}

export interface ItemAgotado {
  item: string
  talle: string
  disponible: number
  pedido: number
}

export interface ResultadoStock {
  ok: boolean
  agotados: ItemAgotado[]
}

export async function validarStock(items: ItemAValidarStock[]): Promise<ResultadoStock> {
  const agotados: ItemAgotado[] = []

  // Productos de partner: stock finito vive en partner_products.stock (NULL = ilimitado).
  const partnerIds = Array.from(
    new Set(
      items
        .map((i) => i.productId || i.partner_product_id)
        .filter((v): v is string => typeof v === 'string' && v.length > 0),
    ),
  )
  const partnerStockById = new Map<string, number | null>()
  if (partnerIds.length) {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('partner_products')
        .select('id, stock')
        .in('id', partnerIds)
      if (!error && data) {
        for (const row of data as any[]) partnerStockById.set(row.id, row.stock)
      }
    } catch (err: any) {
      console.error('❌ Error consultando stock de partner_products:', err?.message)
      // Ante un error de red/DB dejamos pasar (mismo criterio que precio-real):
      // preferimos no bloquear una venta legítima por un fallo transitorio.
    }
  }

  // Liquidación por talle: una sola lectura de las filas activas (son pocas).
  const necesitaLiquidacion = items.some((i) => !(i.productId || i.partner_product_id))
  let liquidationRows: Awaited<ReturnType<typeof getLiquidationStock>> = []
  if (necesitaLiquidacion) {
    try {
      liquidationRows = await getLiquidationStock()
    } catch (err: any) {
      console.error('❌ Error consultando garment_stock:', err?.message)
      liquidationRows = []
    }
  }

  for (const item of items) {
    const qty = Number(item.quantity) || 1
    const idPartner = item.productId || item.partner_product_id

    if (idPartner) {
      const stock = partnerStockById.get(idPartner)
      if (typeof stock === 'number' && stock < qty) {
        agotados.push({
          item: String(idPartner),
          talle: String(item.size || item.product_size || ''),
          disponible: Math.max(0, stock),
          pedido: qty,
        })
      }
      continue
    }

    const productKey = matchGarmentKey(String(item.garmentType || item.product_type || ''))
    const color = matchStockColor(String(item.color || item.product_color || ''))
    const size = normalizeStockSize(String(item.size || item.product_size || ''))
    if (!productKey || !color || !size) continue // combinación no trackeada -> venta libre

    const row = liquidationRows.find((r) => r.productKey === productKey && r.color === color && r.size === size)
    if (row && row.qty < qty) {
      agotados.push({
        item: String(item.garmentType || item.product_type || productKey),
        talle: size,
        disponible: Math.max(0, row.qty),
        pedido: qty,
      })
    }
  }

  return { ok: agotados.length === 0, agotados }
}

/** Mensaje legible para el 400 del checkout. */
export function mensajeStockAgotado(agotados: ItemAgotado[]): string {
  const detalle = agotados
    .map((a) => `${a.item}${a.talle ? ` (talle ${a.talle})` : ''} — quedan ${a.disponible}, pediste ${a.pedido}`)
    .join(' · ')
  return `Sin stock suficiente: ${detalle}. Actualizá el carrito y probá de nuevo.`
}
