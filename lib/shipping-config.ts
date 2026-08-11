/**
 * FUENTE DE VERDAD de costos de envío del sitio.
 *
 * TODO lo que diga un precio de envío tiene que salir de acá: el carrito, el
 * checkout, el fallback de /api/checkout, el prompt del bot (lib/catalog.ts),
 * el copy de las landings y el JSON-LD que lee Google.
 *
 * Había cuatro tablas distintas conviviendo (checkout 7000/9000, prompt del bot
 * y docs 5500/7000/9000, JSON-LD 5500, fallback de /api/checkout hardcodeado):
 * el bot cotizaba un número, la ficha de Google mostraba otro y el checkout
 * cobraba un tercero. Si agregás un precio de envío a mano en otro archivo,
 * volvés a romper esto.
 *
 * Origen de los despachos: Villa Martelli (Vicente López), CP 1603.
 */
export const SHIPPING = {
  /** Envío gratis a partir de este subtotal */
  FREE_THRESHOLD: 150000,
  /** CABA / GBA — cerca del depósito */
  BA: 10000,
  /** Resto del país */
  RESTO: 15000,
} as const

export type ShippingZone = 'BA' | 'RESTO'

export function shippingCostFor(subtotal: number, zone: ShippingZone): number {
  if (subtotal >= SHIPPING.FREE_THRESHOLD) return 0
  return zone === 'BA' ? SHIPPING.BA : SHIPPING.RESTO
}

export function formatShippingARS(n: number): string {
  return `$${n.toLocaleString('es-AR')}`
}

/**
 * Tabla pública de zonas — la que se muestra en /envios, /faq y el copy de las
 * landings. Dos zonas, las mismas que cobra el checkout.
 */
export const SHIPPING_ZONES_PUBLIC = [
  {
    zone: 'CABA y GBA',
    description: 'Capital Federal y Gran Buenos Aires',
    price: SHIPPING.BA,
    days: '3-5 dias habiles',
  },
  {
    zone: 'Resto del pais',
    description: 'Todas las demas provincias',
    price: SHIPPING.RESTO,
    days: '5-10 dias habiles',
  },
] as const

/** "CABA y GBA $10.000 · Resto del pais $15.000" — para copy de una línea. */
export function shippingSummaryLine(): string {
  return SHIPPING_ZONES_PUBLIC
    .map((z) => `${z.zone} ${formatShippingARS(z.price)}`)
    .join(' · ')
}

/** Igual que shippingSummaryLine pero agregando el umbral de envío gratis. */
export function shippingSummaryWithFreeThreshold(): string {
  return `${shippingSummaryLine()}. Envio gratis en pedidos desde ${formatShippingARS(SHIPPING.FREE_THRESHOLD)}.`
}

/**
 * "CABA y GBA $10.000 (3-5 dias habiles), Resto del pais $15.000 (5-10 dias
 * habiles)" — para las FAQ de las landings, que además del precio dan el plazo.
 */
export function shippingZonesDetailLine(): string {
  return SHIPPING_ZONES_PUBLIC
    .map((z) => `${z.zone} ${formatShippingARS(z.price)} (${z.days})`)
    .join(', ')
}

/**
 * Tiempos de entrega para JSON-LD. Producción on-demand (DTG): la prenda se
 * estampa después de la compra, por eso el handling no es 0-1 días.
 */
const DELIVERY_TIME_JSONLD = {
  '@type': 'ShippingDeliveryTime',
  handlingTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
  transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 10, unitCode: 'DAY' },
} as const

/**
 * `offers.shippingDetails` para schema.org / Google Merchant listings.
 *
 * Dos zonas porque tenemos dos tarifas reales: CABA (AR-C) y resto del país.
 * El envío gratis por encima del umbral no se declara acá — Google no soporta
 * umbrales en OfferShippingDetails, eso va en Merchant Center.
 */
export function shippingDetailsJsonLd() {
  return [
    {
      '@type': 'OfferShippingDetails',
      name: 'CABA',
      shippingDestination: {
        '@type': 'DefinedRegion',
        addressCountry: 'AR',
        addressRegion: 'AR-C',
      },
      shippingRate: { '@type': 'MonetaryAmount', currency: 'ARS', value: SHIPPING.BA },
      deliveryTime: DELIVERY_TIME_JSONLD,
    },
    {
      '@type': 'OfferShippingDetails',
      name: 'Resto del país',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'AR' },
      shippingRate: { '@type': 'MonetaryAmount', currency: 'ARS', value: SHIPPING.RESTO },
      deliveryTime: DELIVERY_TIME_JSONLD,
    },
  ] as const
}

/** Referencia al nodo MerchantReturnPolicy (definido en app/layout.tsx). */
export const RETURN_POLICY_REF = { '@id': 'https://www.novamente.ar/#return-policy' } as const
