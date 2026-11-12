import { getCatalogProduct } from '@/lib/catalog/products'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { resolveProductCost } from '@/lib/partners/variants'
import type { Plan } from '@/lib/partners/types'
import { recargoDorsoPara } from '@/lib/pricing/recargo-doble-estampa'
import { precioPrendaPropiaEnCarrito, BF_2026_PRICES, bf2026PriceFor } from '@/lib/offers'

/**
 * Precio real de un item del carrito, resuelto EN EL SERVIDOR.
 *
 * Por qué existe: /api/checkout recibía `unit_price` y `total` del navegador y
 * su "validación de precio" comparaba uno contra otro — o sea, la aritmética
 * del cliente contra sus propios números. Después mandaba ese mismo
 * `unit_price` a la preferencia de MercadoPago. Cualquiera podía postear
 * `unit_price: 1` y pagar $1 por un buzo de $55.000.
 *
 * Devuelve `null` cuando no se puede determinar el precio (ítem de un flujo
 * que no conocemos). En ese caso el checkout deja pasar la compra y loguea:
 * preferimos no romper una venta legítima por un caso no contemplado, pero el
 * camino conocido queda cerrado.
 */

// El recargo por doble estampa vive en un módulo propio (fuente única, sin
// ciclos: el costo del partner también lo usa). Se re-exporta acá para no
// romper a quienes lo importaban de este archivo.
export {
  RECARGO_DOBLE_ESTAMPA,
  RECARGO_DOBLE_ESTAMPA_TOTE,
  recargoDorsoPara,
} from '@/lib/pricing/recargo-doble-estampa'

/** Margen de redondeo tolerado al comparar. */
export const TOLERANCIA_ARS = 1

export interface ItemAValidar {
  productId?: string | null
  partner_product_id?: string | null
  garmentType?: string | null
  product_type?: string | null
  size?: string | null
  product_size?: string | null
  doble_estampa?: string | null
  unit_price?: number | null
  price?: number | null
  quantity?: number | null
}

/**
 * Producto de un partner: el precio sale de la fila, y si tiene precios por
 * talle/medida (metadata.size_prices) gana el del talle elegido — que es la
 * misma regla que aplica la ficha de producto.
 */
interface DatosProductoPartner {
  price: number | null
  metadata: Record<string, unknown> | null
  tenantId: string | null
}

async function datosProductoPartner(id: string): Promise<DatosProductoPartner | null> {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('partner_products')
      .select('price, metadata, tenant_id')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return {
      price: typeof data.price === 'number' ? data.price : null,
      metadata: (data.metadata as Record<string, unknown> | null) ?? null,
      tenantId: (data.tenant_id as string | null) ?? null,
    }
  } catch {
    return null
  }
}

async function planDeTenant(tenantId: string): Promise<Plan | null> {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('tenants')
      .select('plan')
      .eq('id', tenantId)
      .single()
    if (error || !data) return null
    return (data.plan as Plan | null) ?? null
  } catch {
    return null
  }
}

/**
 * Piso absoluto de sanidad cuando no se puede resolver el costo real (falta
 * `metadata.garmentKey` o el plan del tenant): productos "cargados en miles"
 * (40, 60) quedan bloqueados igual aunque no tengamos con qué comparar.
 */
export const PISO_ABSOLUTO_PARTNER_ARS = 1000

interface ResultadoPiso {
  ok: boolean
  costo: number | null
}

/**
 * El precio real de un producto de partner no puede ser menor a su costo de
 * producción — la auditoría 22/09 encontró partners que cargaron "40" o "60"
 * pensando en miles, y `partner_products.price` se cobraría tal cual.
 * `validateProductForPublish` (lib/partners/variants.ts) ya frena esto al
 * publicar/editar, pero un producto legacy publicado ANTES de ese gate podía
 * seguir comprándose por debajo del costo — este piso corre en el checkout,
 * el único lugar donde de verdad se cobra.
 */
async function pisoDeProductoPartner(id: string, precioReal: number): Promise<ResultadoPiso> {
  const datos = await datosProductoPartner(id)
  if (!datos) return { ok: true, costo: null } // no resuelve: no es este guard el que lo frena

  const plan = datos.tenantId ? await planDeTenant(datos.tenantId) : null
  const costo = plan ? resolveProductCost(datos.metadata, plan) : null

  if (costo != null) {
    return { ok: precioReal >= costo, costo }
  }
  return { ok: precioReal >= PISO_ABSOLUTO_PARTNER_ARS, costo: null }
}

async function precioDeProductoPartner(id: string, talle?: string | null): Promise<number | null> {
  const datos = await datosProductoPartner(id)
  if (!datos) return null

  const porTalle = (datos.metadata as any)?.size_prices
  if (talle && porTalle && typeof porTalle[talle] === 'number') return porTalle[talle]
  return datos.price
}

/** Prenda personalizada de /crear: el precio es el del catálogo. */
function precioDePrendaPropia(garmentKey: string, dobleEstampa: boolean): number | null {
  const producto = getCatalogProduct(garmentKey)
  if (!producto || typeof producto.retailARS !== 'number') return null
  return producto.retailARS + (dobleEstampa ? recargoDorsoPara(garmentKey) : 0)
}

/**
 * Contexto del carrito para la promo Black Friday 2026 (lib/offers.ts): el tope
 * de 1-4 prendas es del carrito entero y la fecha es la del SERVIDOR.
 */
export interface ContextoPromo {
  carrito: ItemAValidar[]
  now?: Date | number
}

export async function precioRealDelItem(item: ItemAValidar, promo?: ContextoPromo): Promise<number | null> {
  const idPartner = item.productId || item.partner_product_id
  if (idPartner) {
    return await precioDeProductoPartner(idPartner, item.size || item.product_size)
  }
  const prenda = item.garmentType || item.product_type
  if (prenda) {
    if (promo) {
      const conPromo = precioPrendaPropiaEnCarrito(item, promo.carrito, promo.now ?? Date.now())
      if (conPromo !== null) return conPromo
    }
    return precioDePrendaPropia(prenda, item.doble_estampa === 'Si')
  }
  return null
}

/** Precio BF (+dorso) que tendría la prenda si la promo le aplicara en un carrito de 1, ignorando fecha y tope. */
function precioBfTeorico(item: ItemAValidar): number | null {
  if (item.productId || item.partner_product_id) return null
  const k = String(item.garmentType || item.product_type || '')
  const bf = BF_2026_PRICES[k]
  if (typeof bf !== 'number') return null
  return bf + (item.doble_estampa === 'Si' ? recargoDorsoPara(k) : 0)
}

export interface ResultadoValidacion {
  ok: boolean
  /** Items donde el precio del navegador era MENOR que el real. */
  subfacturados: Array<{ item: string; cobrado: number; real: number }>
  /** Cuántos no se pudieron verificar (se dejaron pasar). */
  sinVerificar: number
  /**
   * true si algún ítem se cobra con precio Black Friday 2026 válido (para
   * etiquetar el pedido con metadata.promo = 'bf-2026').
   */
  bfAplicado: boolean
  /**
   * true si el rechazo es porque el carrito traía el precio Black Friday y ya no
   * corresponde (terminó la ventana o el carrito pasó a 5+ prendas): el mensaje
   * al cliente es otro, no "los precios no coinciden".
   */
  ofertaTerminada: boolean
  /**
   * Productos de partner cuyo precio real (no lo que mandó el navegador —
   * la fila del producto) está por debajo del costo de producción, o del
   * piso absoluto de sanidad si el costo no se pudo resolver.
   */
  bajoCosto: Array<{ item: string; real: number; costo: number | null }>
}

/**
 * Compara lo que manda el navegador contra el precio real de cada item.
 *
 * Sólo falla cuando el precio del cliente es MENOR que el real: es el caso que
 * nos hace perder plata. Si es mayor (un descuento mal aplicado, un precio que
 * subió después de agregar al carrito) se deja pasar y se reporta aparte, para
 * no bloquear a alguien que está pagando de más.
 */
export async function validarPrecios(items: ItemAValidar[], opts: { now?: Date | number } = {}): Promise<ResultadoValidacion> {
  const subfacturados: ResultadoValidacion['subfacturados'] = []
  const bajoCosto: ResultadoValidacion['bajoCosto'] = []
  let sinVerificar = 0
  let bfAplicado = false
  let ofertaTerminada = false
  const now = opts.now ?? Date.now()
  const promo: ContextoPromo = { carrito: items, now }

  for (const item of items) {
    const real = await precioRealDelItem(item, promo)
    if (real === null) { sinVerificar++; continue }
    const cobrado = Number(item.unit_price ?? item.price ?? 0)
    const nombreItem = String(item.productId || item.partner_product_id || item.garmentType || item.product_type || 'item')

    if (cobrado < real - TOLERANCIA_ARS) {
      const teorico = precioBfTeorico(item)
      if (teorico !== null && Math.abs(cobrado - teorico) <= TOLERANCIA_ARS) ofertaTerminada = true
      subfacturados.push({ item: nombreItem, cobrado, real })
      continue // ya rechazado por otro motivo; no hace falta chequear el costo
    }
    if (bf2026PriceFor(item, items, now) !== null && cobrado < real + TOLERANCIA_ARS + 1) {
      const lista = precioDePrendaPropia(String(item.garmentType || item.product_type), item.doble_estampa === 'Si')
      if (lista !== null && cobrado < lista - TOLERANCIA_ARS) bfAplicado = true
    }

    const idPartner = item.productId || item.partner_product_id
    if (idPartner) {
      const piso = await pisoDeProductoPartner(idPartner, real)
      if (!piso.ok) {
        bajoCosto.push({ item: nombreItem, real, costo: piso.costo })
      }
    }
  }

  return { ok: subfacturados.length === 0 && bajoCosto.length === 0, subfacturados, sinVerificar, bajoCosto, bfAplicado, ofertaTerminada }
}
