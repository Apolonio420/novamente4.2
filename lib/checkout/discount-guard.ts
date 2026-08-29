import { supabaseAdmin } from '@/lib/supabase-admin'
import { applyDiscount, type PartnerDiscountCode } from '@/lib/partners/discounts'

/**
 * Validación server-side de códigos de descuento en el submit del checkout.
 *
 * Por qué existe: el checkout sólo validaba el código contra /api/discounts/validate
 * para MOSTRARLE el descuento al cliente — pero nunca volvía a validarlo al mandar
 * el pedido. El front mandaba `total` ya con el descuento restado y el servidor lo
 * daba por bueno (o, peor, la resta rompía la comparación de precios y el checkout
 * de MercadoPago quedaba bloqueado con CUALQUIER código aplicado). `max_uses` nunca
 * se aplicaba porque nada incrementaba `uses_count`.
 *
 * Esta función vuelve a resolver el código EN EL SERVIDOR (ignora cualquier
 * discountId/discountARS que mande el navegador) y lo aplica al subtotal real.
 * Un código inválido, vencido, agotado o de otro tenant siempre da discountARS: 0 —
 * nunca baja el total por default.
 */
export interface DescuentoValidado {
  valid: boolean
  discountId: string | null
  discountCode: string | null
  discountARS: number
  reason?: string
}

export async function validarDescuento(
  code: string | null | undefined,
  subtotalRealARS: number,
): Promise<DescuentoValidado> {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return { valid: false, discountId: null, discountCode: null, discountARS: 0 }
  }
  const normalized = code.toUpperCase().trim()
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('partner_discount_codes')
      .select('*')
      .eq('code', normalized)
      .eq('active', true)
      .limit(1)

    if (error || !data?.length) {
      return {
        valid: false,
        discountId: null,
        discountCode: normalized,
        discountARS: 0,
        reason: 'Código no encontrado',
      }
    }

    const found = data[0] as PartnerDiscountCode
    const result = applyDiscount(found, subtotalRealARS)
    if (!result.valid) {
      return {
        valid: false,
        discountId: found.id,
        discountCode: normalized,
        discountARS: 0,
        reason: result.reason,
      }
    }

    return {
      valid: true,
      discountId: found.id,
      discountCode: normalized,
      discountARS: result.discountARS,
    }
  } catch (err: any) {
    // Ante cualquier error de red/DB no aplicamos el descuento — nunca bajar el
    // total por un fallo transitorio.
    console.error('validarDescuento error:', err?.message)
    return {
      valid: false,
      discountId: null,
      discountCode: normalized,
      discountARS: 0,
      reason: 'Error validando código',
    }
  }
}

/**
 * Registra el USO de un código de descuento al confirmarse la venta (pago
 * aprobado). Incremento ATÓMICO vía RPC (mismo patrón que
 * decrement_partner_product_stock / decrement_garment_stock): la condición
 * `uses_count < max_uses` vive en el propio UPDATE, no en una lectura previa,
 * así que dos confirmaciones concurrentes del mismo código no pueden pisarse
 * ni superar el tope por una carrera de lectura-y-escritura.
 *
 * Devuelve el `uses_count` resultante, o null si el código ya estaba en el
 * tope (o no existe) — en ese caso no se re-intenta ni se rompe la venta ya
 * pagada, sólo no se contabiliza el uso extra.
 */
export async function registrarUsoDescuento(discountId: string): Promise<number | null> {
  try {
    const { data, error } = await (supabaseAdmin as any).rpc('increment_discount_code_uses', {
      p_id: discountId,
    })
    if (error) {
      console.error('❌ Error incrementando uses_count del descuento:', discountId, error.message)
      return null
    }
    return typeof data === 'number' ? data : null
  } catch (err: any) {
    console.error('❌ Exception incrementando uses_count del descuento:', err?.message)
    return null
  }
}

export interface ItemMercadoPago {
  unit_price: number
  quantity: number
  [key: string]: any
}

/**
 * Reparte el descuento entre los items de PRODUCTO que se mandan a la
 * preferencia de MercadoPago (nunca sobre el envío). MercadoPago no acepta
 * unit_price <= 0 en un item, así que en vez de agregar una línea de
 * "descuento" en negativo (que MP rechaza) se reduce proporcionalmente cada
 * item — con un piso de $1 por item para no pegarle nunca un precio inválido.
 *
 * En el caso extremo de un descuento que consumiría un item entero (p. ej.
 * 100% off), el piso de $1 puede dejar unos pocos pesos sin descontar — nunca
 * se cobra DE MENOS por este redondeo, sólo, en ese caso límite, unos pesos
 * de más. El total "de verdad" (el que se guarda en la orden y se compara)
 * sale de `finalSubtotal - discountARS`, no de este reparto.
 */
export function aplicarDescuentoAItemsMP<T extends ItemMercadoPago>(
  items: T[],
  discountARS: number,
): T[] {
  if (!Number.isFinite(discountARS) || discountARS <= 0 || items.length === 0) return items

  const totalItems = items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0)
  if (totalItems <= 0) return items

  // Nunca se descuenta más de lo que valen los items en sí (deja al menos $1
  // por item — ver piso más abajo).
  const pisoTotal = items.length // $1 mínimo por item
  const descuentoAplicable = Math.max(0, Math.min(discountARS, totalItems - pisoTotal))
  if (descuentoAplicable <= 0) return items

  let restante = Math.round(descuentoAplicable)
  return items.map((item, idx) => {
    const lineTotal = item.unit_price * item.quantity
    const isLast = idx === items.length - 1
    const shareProporcional = Math.round((lineTotal / totalItems) * descuentoAplicable)
    // Nunca reducir un item por debajo de $1 en total de línea.
    const maxReducible = Math.max(0, lineTotal - 1)
    const share = isLast ? Math.min(restante, maxReducible) : Math.min(shareProporcional, restante, maxReducible)
    restante -= share
    const newLineTotal = Math.max(1, lineTotal - share)
    return { ...item, unit_price: newLineTotal / item.quantity }
  })
}
