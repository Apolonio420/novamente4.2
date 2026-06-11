/**
 * FUENTE DE VERDAD de costos de envío del sitio.
 * El carrito y el checkout DEBEN leer de acá (antes cada uno tenía sus
 * números hardcodeados y mostraban montos distintos — bug de confianza).
 */
export const SHIPPING = {
  /** Envío gratis a partir de este subtotal */
  FREE_THRESHOLD: 85000,
  /** CABA / GBA */
  BA: 7000,
  /** Resto del país */
  RESTO: 9000,
} as const

export type ShippingZone = 'BA' | 'RESTO'

export function shippingCostFor(subtotal: number, zone: ShippingZone): number {
  if (subtotal >= SHIPPING.FREE_THRESHOLD) return 0
  return zone === 'BA' ? SHIPPING.BA : SHIPPING.RESTO
}
