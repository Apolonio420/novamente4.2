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

// ---------------------------------------------------------------------------
// Envío por distancia (números de Juan, 2026-08-27)
//
//   "CABA y AMBA entre 8500 y 12000. Más lejos, de 13500 para arriba los más
//    cercanos, y cuanto más se aleja más. Pero no cobremos más de 16000."
//
// Los despachos salen de Villa Martelli (Vicente López), CP 1603. La distancia
// se estima por CÓDIGO POSTAL, que es el único dato de ubicación que el
// checkout ya pide. No pretende ser exacta: es un rango honesto para cobrar.
// ---------------------------------------------------------------------------

export const ENVIO_DISTANCIA = {
  /** AMBA: del piso al techo, según qué tan lejos del depósito. */
  AMBA_MIN: 8500,
  AMBA_MAX: 12000,
  /** Interior: arranca acá el más cercano... */
  INTERIOR_MIN: 13500,
  /** ...y nunca pasa de acá, por lejos que sea. */
  TOPE: 16000,
  /** Hasta acá se considera AMBA. */
  AMBA_KM: 70,
  /** Distancia del punto más lejano del país (Ushuaia), para escalar. */
  KM_MAX: 3000,
} as const

/**
 * Kilómetros aproximados desde Villa Martelli según el código postal.
 *
 * Los CP argentinos tienen una estructura geográfica gruesa. Cada rango lleva
 * la distancia por ruta a una ciudad representativa. Es una aproximación
 * deliberada: sirve para ubicar el envío en su franja de precio, no para
 * liquidar un flete.
 */
const KM_POR_CP: Array<{ desde: number; hasta: number; km: number; donde: string }> = [
  { desde: 1000, hasta: 1499, km: 15, donde: 'CABA' },
  { desde: 1600, hasta: 1665, km: 10, donde: 'Vicente López / San Isidro / San Martín' },
  { desde: 1666, hasta: 1749, km: 35, donde: 'Tigre / Morón / oeste del GBA' },
  { desde: 1750, hasta: 1849, km: 40, donde: 'La Matanza / sur del GBA' },
  { desde: 1850, hasta: 1899, km: 45, donde: 'Quilmes / Berazategui' },
  { desde: 1900, hasta: 1999, km: 60, donde: 'La Plata y alrededores' },
  { desde: 2000, hasta: 2199, km: 300, donde: 'Rosario / sur de Santa Fe' },
  { desde: 2200, hasta: 2499, km: 400, donde: 'Santa Fe' },
  { desde: 2500, hasta: 2999, km: 500, donde: 'Córdoba este / Santa Fe oeste' },
  { desde: 3000, hasta: 3299, km: 480, donde: 'Entre Ríos' },
  { desde: 3300, hasta: 3399, km: 1000, donde: 'Misiones' },
  { desde: 3400, hasta: 3599, km: 800, donde: 'Corrientes' },
  { desde: 3600, hasta: 3799, km: 950, donde: 'Chaco / Formosa' },
  { desde: 3800, hasta: 3999, km: 1100, donde: 'Santiago del Estero' },
  { desde: 4000, hasta: 4199, km: 1300, donde: 'Tucumán' },
  { desde: 4200, hasta: 4399, km: 1150, donde: 'Santiago del Estero norte' },
  { desde: 4400, hasta: 4599, km: 1600, donde: 'Salta' },
  { desde: 4600, hasta: 4799, km: 1750, donde: 'Jujuy' },
  { desde: 4800, hasta: 4999, km: 1150, donde: 'Catamarca / La Rioja' },
  { desde: 5000, hasta: 5299, km: 700, donde: 'Córdoba' },
  { desde: 5300, hasta: 5499, km: 1150, donde: 'La Rioja' },
  { desde: 5500, hasta: 5799, km: 1050, donde: 'Mendoza' },
  { desde: 5800, hasta: 5999, km: 800, donde: 'San Luis' },
  { desde: 6000, hasta: 6499, km: 400, donde: 'oeste de Buenos Aires' },
  { desde: 6500, hasta: 6999, km: 550, donde: 'La Pampa / oeste bonaerense' },
  { desde: 7000, hasta: 7399, km: 350, donde: 'Tandil / centro bonaerense' },
  { desde: 7400, hasta: 7999, km: 400, donde: 'Mar del Plata / costa' },
  { desde: 8000, hasta: 8299, km: 700, donde: 'Bahía Blanca' },
  { desde: 8300, hasta: 8499, km: 1150, donde: 'Neuquén' },
  { desde: 8500, hasta: 8799, km: 1000, donde: 'Río Negro' },
  { desde: 8800, hasta: 8999, km: 800, donde: 'sur bonaerense' },
  { desde: 9000, hasta: 9299, km: 1500, donde: 'Chubut' },
  { desde: 9300, hasta: 9399, km: 2200, donde: 'Santa Cruz norte' },
  { desde: 9400, hasta: 9999, km: 3000, donde: 'Tierra del Fuego' },
]

export interface EnvioEstimado {
  costo: number
  km: number
  zona: 'AMBA' | 'INTERIOR'
  donde: string
  /** true si no se pudo leer el CP y se usó el fallback. */
  estimado: boolean
}

/** Extrae los 4 dígitos del CP, tolerando formato CPA (ej. "B1603ABC"). */
export function normalizarCP(cp: string | null | undefined): number | null {
  if (!cp) return null
  const m = String(cp).match(/\d{4}/)
  if (!m) return null
  const n = parseInt(m[0], 10)
  return n >= 1000 && n <= 9999 ? n : null
}

export function kmDesdeDeposito(cp: string | null | undefined): { km: number; donde: string } | null {
  const n = normalizarCP(cp)
  if (n === null) return null
  const fila = KM_POR_CP.find((f) => n >= f.desde && n <= f.hasta)
  return fila ? { km: fila.km, donde: fila.donde } : null
}

/**
 * Costo de envío estimado por distancia. Si no hay CP legible cae a la zona
 * gruesa de siempre, así un checkout sin código postal nunca queda sin precio.
 */
export function envioPorDistancia(
  subtotal: number,
  cp: string | null | undefined,
  zonaFallback: ShippingZone = 'BA',
): EnvioEstimado {
  const ubic = kmDesdeDeposito(cp)

  if (!ubic) {
    const costo = subtotal >= SHIPPING.FREE_THRESHOLD ? 0 : (zonaFallback === 'BA' ? SHIPPING.BA : SHIPPING.RESTO)
    return {
      costo,
      km: zonaFallback === 'BA' ? ENVIO_DISTANCIA.AMBA_KM : 500,
      zona: zonaFallback === 'BA' ? 'AMBA' : 'INTERIOR',
      donde: zonaFallback === 'BA' ? 'CABA / GBA' : 'Interior',
      estimado: true,
    }
  }

  const { km, donde } = ubic
  const zona: 'AMBA' | 'INTERIOR' = km <= ENVIO_DISTANCIA.AMBA_KM ? 'AMBA' : 'INTERIOR'

  if (subtotal >= SHIPPING.FREE_THRESHOLD) {
    return { costo: 0, km, zona, donde, estimado: false }
  }

  let costo: number
  if (zona === 'AMBA') {
    // 8500 pegado al depósito → 12000 en el borde del AMBA
    const t = Math.min(1, Math.max(0, km / ENVIO_DISTANCIA.AMBA_KM))
    costo = ENVIO_DISTANCIA.AMBA_MIN + t * (ENVIO_DISTANCIA.AMBA_MAX - ENVIO_DISTANCIA.AMBA_MIN)
  } else {
    // 13500 apenas se sale del AMBA → 16000 en el extremo del país
    const t = Math.min(
      1,
      Math.max(0, (km - ENVIO_DISTANCIA.AMBA_KM) / (ENVIO_DISTANCIA.KM_MAX - ENVIO_DISTANCIA.AMBA_KM)),
    )
    costo = ENVIO_DISTANCIA.INTERIOR_MIN + t * (ENVIO_DISTANCIA.TOPE - ENVIO_DISTANCIA.INTERIOR_MIN)
  }

  // redondeo a $100 para que no queden precios con centavos raros
  costo = Math.min(ENVIO_DISTANCIA.TOPE, Math.round(costo / 100) * 100)
  return { costo, km, zona, donde, estimado: false }
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
