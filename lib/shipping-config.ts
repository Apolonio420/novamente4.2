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
 * PRODUCCIÓN — 24-48h hábiles desde que se confirma diseño y pago.
 *
 * Es lo que declaran docs/public/SHIPPING.md y el bot de WhatsApp
 * (novamente_b2b_bot_config.json > shipping.delivery_times.produccion).
 * lib/catalog.ts tenía su propio '2-5' que no coincidía con ninguno de los dos.
 */
export const PRODUCTION_DAYS = { min: 1, max: 2 } as const

/** "1 a 2 dias habiles" */
export function productionLine(): string {
  return `${PRODUCTION_DAYS.min} a ${PRODUCTION_DAYS.max} dias habiles`
}

/**
 * PRODUCCIÓN POR VOLUMEN (B2B) — números de Juan, 2026-08-12:
 * "50 unidades ponele mínimo 5 días, de 50 a 100 son 5 días aprox, y después
 * para arriba más o menos haciendo una proporción".
 *
 * Había SEIS tablas distintas en las landings (3-5/5-10, 5-7/7-10, 5-7/7-10/10-15…)
 * y el bot prometía 24-48h para cualquier cantidad — o sea le decía lo mismo a un
 * pedido de 1 unidad que a uno de 200.
 */
export const PRODUCTION_VOLUME = {
  /** Desde acá el pedido deja de ser on-demand y entra como tanda. */
  VOLUME_FROM_QTY: 50,
  /** Piso: ningún pedido de 50+ sale en menos de esto. */
  MIN_DAYS: 5,
  /** Ritmo de la tanda: 100 unidades ≈ 5 días hábiles. */
  UNITS_PER_DAY: 20,
} as const

/** Días hábiles de PRODUCCIÓN (sin envío) para un pedido de `qty` unidades. */
export function productionDaysForQty(qty: number): number {
  if (!(qty > 0) || qty < PRODUCTION_VOLUME.VOLUME_FROM_QTY) return PRODUCTION_DAYS.max
  return Math.max(
    PRODUCTION_VOLUME.MIN_DAYS,
    Math.ceil(qty / PRODUCTION_VOLUME.UNITS_PER_DAY),
  )
}

/** Tabla de producción por volumen para el copy de las landings B2B. */
export function productionVolumeLine(): string {
  const v = PRODUCTION_VOLUME
  const cien = productionDaysForQty(100)
  const doscientos = productionDaysForQty(200)
  return (
    `hasta ${v.VOLUME_FROM_QTY} unidades, hasta ${v.MIN_DAYS} dias habiles; ` +
    `de ${v.VOLUME_FROM_QTY} a 100 unidades, ${cien} dias habiles; ` +
    `y de ahi en adelante sumamos 1 dia habil cada ${v.UNITS_PER_DAY} unidades ` +
    `(200 unidades ≈ ${doscientos} dias)`
  )
}

/**
 * TOTAL de punta a punta = producción + envío, del caso más rápido (CABA) al
 * más lento (interior). NO se escribe a mano en ningún lado: durante meses las
 * landings decían "5-10" o "5-15 días" mientras la operación prometía 24-48h de
 * producción + 24-72h/2-4 días de envío.
 */
export function totalDeliveryDays(): { min: number; max: number } {
  const transits = SHIPPING_ZONES_PUBLIC.map((z) => z.transitDays)
  return {
    min: PRODUCTION_DAYS.min + Math.min(...transits.map((t) => t.min)),
    max: PRODUCTION_DAYS.max + Math.max(...transits.map((t) => t.max)),
  }
}

/** "2 a 6 dias habiles" */
export function totalDeliveryLine(): string {
  const { min, max } = totalDeliveryDays()
  return `${min} a ${max} dias habiles`
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
    days: '24 a 72 horas habiles',
    /** Solo transito, sin produccion — para el deliveryTime del JSON-LD. */
    transitDays: { min: 1, max: 3 },
  },
  {
    zone: 'Resto del pais',
    description: 'Todas las demas provincias',
    price: SHIPPING.RESTO,
    days: '2 a 4 dias habiles',
    transitDays: { min: 2, max: 4 },
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
 * "CABA y GBA $10.000 (24 a 72 horas habiles), Resto del pais $15.000 (2 a 4
 * dias habiles)" — para las FAQ de las landings, que dan precio y plazo.
 */
export function shippingZonesDetailLine(): string {
  return SHIPPING_ZONES_PUBLIC
    .map((z) => `${z.zone} ${formatShippingARS(z.price)} (${z.days})`)
    .join(', ')
}

/**
 * handlingTime = producción. On-demand (DTG): la prenda se estampa después de
 * la compra, son 24-48h hábiles. NO es 0-1 días.
 *
 * El transitTime va por zona (ver SHIPPING_ZONES_PUBLIC.transitDays): son los
 * mismos plazos que declara el bot de WhatsApp y docs/public/SHIPPING.md.
 */
const HANDLING_TIME_JSONLD = {
  '@type': 'QuantitativeValue',
  minValue: 1,
  maxValue: 2,
  unitCode: 'DAY',
} as const

function deliveryTimeJsonLd(transit: { min: number; max: number }) {
  return {
    '@type': 'ShippingDeliveryTime',
    handlingTime: HANDLING_TIME_JSONLD,
    transitTime: {
      '@type': 'QuantitativeValue',
      minValue: transit.min,
      maxValue: transit.max,
      unitCode: 'DAY',
    },
  }
}

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
      deliveryTime: deliveryTimeJsonLd(SHIPPING_ZONES_PUBLIC[0].transitDays),
    },
    {
      '@type': 'OfferShippingDetails',
      name: 'Resto del país',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'AR' },
      shippingRate: { '@type': 'MonetaryAmount', currency: 'ARS', value: SHIPPING.RESTO },
      deliveryTime: deliveryTimeJsonLd(SHIPPING_ZONES_PUBLIC[1].transitDays),
    },
  ] as const
}

/** Referencia al nodo MerchantReturnPolicy (definido en app/layout.tsx). */
export const RETURN_POLICY_REF = { '@id': 'https://www.novamente.ar/#return-policy' } as const
