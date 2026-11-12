import { getCatalogProduct } from "@/lib/catalog/products"
import { recargoDorsoPara } from "@/lib/pricing/recargo-doble-estampa"

/**
 * Ofertas por campana (Hot Sale, Cyber Monday, etc.).
 *
 * Source of truth para promociones temporales. Las URLs apuntan a storefronts
 * de partners (ej: novamente-mundial) o a productos del catalogo principal.
 *
 * Para agregar/quitar ofertas: editar este array. La home, /ofertas y los
 * schemas JSON-LD se actualizan automaticamente.
 */

export interface Offer {
  slug: string
  name: string
  image: string
  alt: string
  url: string
  priceCurrent: number
  priceOriginal: number
  campaign: "Hot Sale" | "Black Friday" | "Cyber Monday" | "Liquidacion"
  startsAt: string // ISO date
  endsAt: string // ISO date
  shortDescription?: string
  badge?: string
}

export const OFFERS: Offer[] = [
  {
    slug: "pasion-infinita",
    name: "Remera Oversize Pasión Infinita",
    image: "/marketing/hot-sale/pasion-infinita.jpeg",
    alt: "Remera oversize negra con collage doble estampa de cultura argentina — Hot Sale Novamente",
    url: "https://www.novamente.ar/p/novamente-mundial/remera-oversize-pasi-n-infinita",
    priceCurrent: 32900,
    priceOriginal: 44500,
    campaign: "Hot Sale",
    startsAt: "2026-05-11T00:00:00-03:00",
    endsAt: "2026-05-21T23:59:59-03:00",
    shortDescription: "Doble estampa frente + espalda, collage premium de la cultura argentina del fútbol.",
    badge: "Doble estampa",
  },
  {
    slug: "cielo-eterno",
    name: "Remera Oversize Cielo Eterno",
    image: "/marketing/hot-sale/cielo-eterno.jpeg",
    alt: "Remera oversize negra con Maradona y Messi celestial — Hot Sale Novamente",
    url: "https://www.novamente.ar/p/novamente-mundial/remera-oversize-cielo-eterno",
    priceCurrent: 29900,
    priceOriginal: 39800,
    campaign: "Hot Sale",
    startsAt: "2026-05-11T00:00:00-03:00",
    endsAt: "2026-05-21T23:59:59-03:00",
    shortDescription: "Maradona y Messi entre nubes con la copa del mundo — estampa frontal.",
    badge: "Top vendido",
  },
  {
    slug: "argentina-eterna",
    name: "Remera Argentina Eterna",
    image: "/marketing/hot-sale/argentina-eterna.jpeg",
    alt: "Remera blanca con Maradona y Messi en lineart Argentina — Hot Sale Novamente",
    url: "https://www.novamente.ar/p/novamente-mundial/remera-argentina-eterna",
    priceCurrent: 31900,
    priceOriginal: 41000,
    campaign: "Hot Sale",
    startsAt: "2026-05-11T00:00:00-03:00",
    endsAt: "2026-05-21T23:59:59-03:00",
    shortDescription: "Lineart minimalista de Maradona y Messi con la bandera argentina — estampa en espalda.",
    badge: "Diseño exclusivo",
  },
  {
    slug: "copa-mundial",
    name: "Remera Copa Novamente Mundial",
    image: "/marketing/hot-sale/copa-mundial.jpeg",
    alt: "Remera oversize negra con Messi y la copa del mundo — Hot Sale Novamente",
    url: "https://www.novamente.ar/p/novamente-mundial/remera-copa-novamente-mundial1",
    priceCurrent: 29900,
    priceOriginal: 40000,
    campaign: "Hot Sale",
    startsAt: "2026-05-11T00:00:00-03:00",
    endsAt: "2026-05-21T23:59:59-03:00",
    shortDescription: "Messi levantando la copa, ilustración épica frontal.",
  },
  {
    slug: "campeon-10",
    name: "Remera Campeón del Mundo #10",
    image: "/marketing/hot-sale/campeon-10.jpeg",
    alt: "Remera negra con crest Campeón del Mundo Lionel Messi #10 — Hot Sale Novamente",
    url: "https://www.novamente.ar/p/novamente-mundial/remera-campe-n-del-mundo-10",
    priceCurrent: 32900,
    priceOriginal: 44500,
    campaign: "Hot Sale",
    startsAt: "2026-05-11T00:00:00-03:00",
    endsAt: "2026-05-21T23:59:59-03:00",
    shortDescription: "Crest circular Campeón del Mundo 2022 — doble estampa frente y espalda.",
    badge: "Doble estampa",
  },

  // ---- Cyber Monday 2026 (lun 2/11 00:00 a dom 8/11 23:59 ART) ----
  {
    slug: "cm26-buzo-novamente-originals",
    name: "Buzo Oversize Novamente Originals",
    image: "/partners/novamente-originals/products/buzo-novamente-originals-negro-front.png",
    alt: "Buzo Oversize Novamente Originals — Cyber Monday Novamente 30% OFF",
    url: "https://www.novamente.ar/p/novamente-originals/buzo-novamente-originals",
    priceCurrent: 40600,
    priceOriginal: 58000,
    campaign: "Cyber Monday",
    startsAt: "2026-11-02T00:00:00-03:00",
    endsAt: "2026-11-08T23:59:59-03:00",
    shortDescription: "Buzo oversize Novamente Originals, estampado DTG premium, producido bajo demanda.",
    badge: "30% OFF",
  },
  {
    slug: "cm26-remera-novamente-originals",
    name: "Remera Oversize Novamente Originals",
    image: "/partners/novamente-originals/products/remera-novamente-originals-negro-front.png",
    alt: "Remera Oversize Novamente Originals — Cyber Monday Novamente 30% OFF",
    url: "https://www.novamente.ar/p/novamente-originals/remera-novamente-originals",
    priceCurrent: 24500,
    priceOriginal: 35000,
    campaign: "Cyber Monday",
    startsAt: "2026-11-02T00:00:00-03:00",
    endsAt: "2026-11-08T23:59:59-03:00",
    shortDescription: "Remera oversize Novamente Originals, estampado DTG premium, producida bajo demanda.",
    badge: "30% OFF",
  },
  {
    slug: "cm26-remera-oversize-bench-break",
    name: "Remera Oversize Bench Break",
    image: "https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/partner-assets/c803246a-ad52-4889-aafd-c4f58b6a916b/product/1774878096555.png",
    alt: "Remera Oversize Bench Break — Cyber Monday Novamente 30% OFF",
    url: "https://www.novamente.ar/p/novamente-training/remera-oversize-bench-break",
    priceCurrent: 23200,
    priceOriginal: 33200,
    campaign: "Cyber Monday",
    startsAt: "2026-11-02T00:00:00-03:00",
    endsAt: "2026-11-08T23:59:59-03:00",
    shortDescription: "Remera oversize de Novamente Training, estampa Bench Break.",
    badge: "30% OFF",
  },
  {
    slug: "cm26-remera-oversize-bob",
    name: "Remera Oversize Bob",
    image: "https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/partner-assets/c803246a-ad52-4889-aafd-c4f58b6a916b/product/1774877336680.png",
    alt: "Remera Oversize Bob — Cyber Monday Novamente 30% OFF",
    url: "https://www.novamente.ar/p/novamente-training/remera-oversize-bob",
    priceCurrent: 23200,
    priceOriginal: 33198,
    campaign: "Cyber Monday",
    startsAt: "2026-11-02T00:00:00-03:00",
    endsAt: "2026-11-08T23:59:59-03:00",
    shortDescription: "Remera oversize de Novamente Training, estampa Bob.",
    badge: "30% OFF",
  },
  {
    slug: "cm26-remera-oversize-take-the-risk",
    name: "Remera Oversize Take the Risk",
    image: "https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/partner-assets/c803246a-ad52-4889-aafd-c4f58b6a916b/product/1774877981411.png",
    alt: "Remera Oversize Take the Risk — Cyber Monday Novamente 30% OFF",
    url: "https://www.novamente.ar/p/novamente-training/remera-oversize-take-the-risk",
    priceCurrent: 23500,
    priceOriginal: 33600,
    campaign: "Cyber Monday",
    startsAt: "2026-11-02T00:00:00-03:00",
    endsAt: "2026-11-08T23:59:59-03:00",
    shortDescription: "Remera oversize de Novamente Training, estampa Take the Risk.",
    badge: "30% OFF",
  },
  {
    slug: "cm26-hoodie-oversize-walking-pr",
    name: "Hoodie Oversize Walking PR",
    image: "https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/partner-assets/c803246a-ad52-4889-aafd-c4f58b6a916b/product/1774878416400.png",
    alt: "Hoodie Oversize Walking PR — Cyber Monday Novamente 30% OFF",
    url: "https://www.novamente.ar/p/novamente-training/hoodie-oversize-walking-pr",
    priceCurrent: 41200,
    priceOriginal: 58900,
    campaign: "Cyber Monday",
    startsAt: "2026-11-02T00:00:00-03:00",
    endsAt: "2026-11-08T23:59:59-03:00",
    shortDescription: "Hoodie oversize de Novamente Training, estampa Walking PR.",
    badge: "30% OFF",
  },
  {
    slug: "cm26-remera-oversize-patricio",
    name: "Remera Oversize Patricio",
    image: "https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/partner-assets/c803246a-ad52-4889-aafd-c4f58b6a916b/product/1774878316970.png",
    alt: "Remera Oversize Patricio — Cyber Monday Novamente 30% OFF",
    url: "https://www.novamente.ar/p/novamente-training/remera-oversize-patricio",
    priceCurrent: 23200,
    priceOriginal: 33200,
    campaign: "Cyber Monday",
    startsAt: "2026-11-02T00:00:00-03:00",
    endsAt: "2026-11-08T23:59:59-03:00",
    shortDescription: "Remera oversize de Novamente Training, estampa Patricio.",
    badge: "30% OFF",
  },
  {
    slug: "cm26-remera-oversize-allergic-to-burpees",
    name: "Remera Oversize Allergic to Burpees",
    image: "https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/partner-assets/c803246a-ad52-4889-aafd-c4f58b6a916b/product/1774877855535.png",
    alt: "Remera Oversize Allergic to Burpees — Cyber Monday Novamente 30% OFF",
    url: "https://www.novamente.ar/p/novamente-training/remera-oversize-allergic-to-burpees",
    priceCurrent: 23200,
    priceOriginal: 33200,
    campaign: "Cyber Monday",
    startsAt: "2026-11-02T00:00:00-03:00",
    endsAt: "2026-11-08T23:59:59-03:00",
    shortDescription: "Remera oversize de Novamente Training, estampa Allergic to Burpees.",
    badge: "30% OFF",
  },
]

export function getActiveOffers(now: Date = new Date()): Offer[] {
  const ts = now.getTime()
  return OFFERS.filter(o => {
    const start = new Date(o.startsAt).getTime()
    const end = new Date(o.endsAt).getTime()
    return ts >= start && ts <= end
  })
}

export function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getDiscountPercent(offer: Offer): number {
  if (offer.priceOriginal === 0) return 0
  return Math.round(((offer.priceOriginal - offer.priceCurrent) / offer.priceOriginal) * 100)
}

/**
 * Devuelve la oferta activa asociada a un producto de partner si existe.
 * Matchea por la URL del offer (ultimo segmento) y por tenant slug en la URL.
 * Usado por la pagina del producto para aplicar tratamiento visual Hot Sale.
 */
export function getActiveOfferForProduct(
  tenantSlug: string,
  productSlug: string,
  now: Date = new Date(),
): Offer | null {
  const active = getActiveOffers(now)
  for (const offer of active) {
    try {
      const u = new URL(offer.url)
      const parts = u.pathname.split("/").filter(Boolean)
      // pathname esperado: /p/<tenantSlug>/<productSlug>
      if (parts[0] === "p" && parts[1] === tenantSlug && parts[parts.length - 1] === productSlug) {
        return offer
      }
    } catch {
      // url invalida, ignorar
    }
  }
  return null
}

/** Nombre de campania para copy/metadata. Fallback generico "Ofertas". */
export function getCampaignLabel(offers: Offer[]): string {
  const names = Array.from(new Set(offers.map(o => o.campaign)))
  return names.length === 1 ? names[0] : "Ofertas"
}

/** Imagen absoluta (para JSON-LD / OpenGraph). */
export function absoluteImageUrl(image: string, baseUrl = "https://www.novamente.ar"): string {
  return /^https?:\/\//.test(image) ? image : `${baseUrl}${image}`
}

// ════════════════════════════════════════════════════════════════════════════
// BLACK FRIDAY 2026 — /crear (prendas personalizadas de Novamente)
// ════════════════════════════════════════════════════════════════════════════
// Decisión 12/11/2026 (Juan la delegó en Contenido + Finanzas): hasta 10 % OFF
// solo en pedidos MINORISTAS de 1 a 4 prendas, del viernes 27/11 00:00 al lunes
// 30/11 23:59 (hora de Argentina). Afuera: 5+ prendas, grupos, productos de
// partners (tiendas /p/...), envío, la musculosa Bali y la tote; no se suma con
// códigos de descuento. Sin tope de pedidos.
//
// Es una regla APARTE de OFFERS a propósito: OFFERS se sincroniza a
// compare_at_price de productos de partners (offers-sync) y esto no toca
// ninguna tienda partner. El fin es automático por fecha (no depende de
// ninguna máquina ni cron): fuera de la ventana todo vuelve al precio de lista.
//
// FUENTE ÚNICA de los números: CATALOG[key].bf_2026 del bot
// (chatbot-whastapp/lib/payments/payment-link.ts). Esta tabla es su espejo con
// las keys de la web; `npm run validate:pricing` del bot la compara y falla si
// difieren. Regla: web × 0,90 redondeado arriba a $100, siempre por encima de
// la tarifa partner y sin coincidir con otro monto del catálogo.

export const BF_2026 = {
  promo: "bf-2026",
  /** Primer instante incluido. */
  startsAt: "2026-11-27T00:00:00-03:00",
  /** Primer instante EXCLUIDO (30/11 23:59:59 ART todavía entra). */
  endsAtExclusive: "2026-12-01T00:00:00-03:00",
  maxGarments: 4,
} as const

/** Precio Black Friday por prenda de /crear (key del catálogo web). Sin Bali ni tote. */
export const BF_2026_PRICES: Record<string, number> = {
  "aldea-classic-tshirt": 26000,
  "aura-oversize-tshirt": 27900,
  "remera-clasica-mujer": 26000,
  "remera-crop-mujer": 21200,
  "buzo-cuello-redondo": 38800,
  "buzo-hoodie-unisex": 49500,
  "remera-sin-mangas-bondi": 26000,
  "remera-infantil": 21200,
}

/** Mensaje cuando el carrito traía precio BF y ya no corresponde (fin de la ventana o 5+ prendas). */
export const MENSAJE_BF_2026_NO_APLICA =
  "El precio de Black Friday ya no aplica a este carrito: la promo es del 27/11 al 30/11 a las 23:59 y para pedidos de 1 a 4 prendas. Actualizamos el carrito con los precios vigentes: revisalo y volvé a confirmar."

/** Mensaje cuando se intenta sumar un código de descuento a Black Friday. */
export const MENSAJE_BF_2026_SIN_CODIGO =
  "Black Friday no se suma con códigos de descuento. Sacá el código para pagar con el precio de Black Friday."

/** Keys que no son prendas (no cuentan para el tope de 1-4). */
const NO_PRENDA = new Set(["totebag"])

export function isBf2026Window(now: Date | number = Date.now()): boolean {
  const t = typeof now === "number" ? now : now.getTime()
  return t >= Date.parse(BF_2026.startsAt) && t < Date.parse(BF_2026.endsAtExclusive)
}

/** Item mínimo de carrito para la promo (CartItem / cartItems del checkout). */
export interface BfCartItem {
  productId?: string | null
  partner_product_id?: string | null
  garmentType?: string | null
  product_type?: string | null
  quantity?: number | null
  doble_estampa?: string | null
}

function prendaKey(it: BfCartItem): string | null {
  const k = String(it.garmentType || it.product_type || "").trim()
  return k || null
}

/** Prendas del carrito: todo lo que no sea tote (los productos de partners también cuentan). */
export function bf2026CartGarments(items: BfCartItem[]): number {
  let n = 0
  for (const it of items || []) {
    const k = prendaKey(it)
    if (k && NO_PRENDA.has(k)) continue
    const q = Math.floor(Number(it.quantity ?? 1))
    n += Number.isFinite(q) && q > 0 ? q : 1
  }
  return n
}

/**
 * Precio BF (sin dorso) de UNA prenda propia de /crear dentro de este carrito,
 * o null si no corresponde: fuera de fecha, producto de partner, Bali/tote,
 * o el carrito tiene 5+ prendas.
 */
export function bf2026PriceFor(it: BfCartItem, cartItems: BfCartItem[], now: Date | number = Date.now()): number | null {
  if (it.productId || it.partner_product_id) return null
  const k = prendaKey(it)
  if (!k || typeof BF_2026_PRICES[k] !== "number") return null
  if (!isBf2026Window(now)) return null
  const n = bf2026CartGarments(cartItems)
  if (n < 1 || n > BF_2026.maxGarments) return null
  return BF_2026_PRICES[k]
}

/**
 * Precio que se muestra en /crear al elegir prenda (un solo ítem): el BF si hoy
 * corre la promo, o null. Para el tachado: original = retailARS, actual = esto.
 */
export function bf2026DisplayPrice(garmentKey: string, now: Date | number = Date.now()): number | null {
  return bf2026PriceFor({ garmentType: garmentKey, quantity: 1 }, [{ garmentType: garmentKey, quantity: 1 }], now)
}

/** Precio de lista de una prenda propia de /crear (catálogo + recargo de dorso), o null. */
export function precioListaPrendaPropia(it: BfCartItem): number | null {
  if (it.productId || it.partner_product_id) return null
  const k = prendaKey(it)
  const producto = k ? getCatalogProduct(k) : undefined
  if (!producto || typeof producto.retailARS !== "number") return null
  return producto.retailARS + (it.doble_estampa === "Si" ? recargoDorsoPara(k!) : 0)
}

/**
 * Precio REAL de una prenda propia de /crear dentro de este carrito: el de Black
 * Friday (+ dorso) si corresponde, o el de lista. null si no es prenda propia.
 * Es la misma regla que valida el servidor (lib/checkout/precio-real.ts).
 */
export function precioPrendaPropiaEnCarrito(it: BfCartItem, cartItems: BfCartItem[], now: Date | number = Date.now()): number | null {
  const lista = precioListaPrendaPropia(it)
  if (lista === null) return null
  const bf = bf2026PriceFor(it, cartItems, now)
  if (bf === null) return lista
  const k = prendaKey(it)!
  return bf + (it.doble_estampa === "Si" ? recargoDorsoPara(k) : 0)
}

/**
 * Reprecia el carrito para mostrar y para mandar al checkout. Solo toca prendas
 * propias de /crear a PRECIO DE LISTA (o que ya tenían BF aplicado): sale a su
 * precio BF cuando corresponde y vuelve al de lista cuando deja de corresponder
 * (5ª prenda, fin de la ventana). Cualquier otro ítem (partner, drop con precio
 * propio) queda igual. Devuelve una copia; los ítems con BF llevan
 * `bfOriginalPrice` (precio de lista) para el tachado.
 */
export function aplicarBf2026<T extends BfCartItem & { price: number; bfOriginalPrice?: number }>(
  items: T[],
  now: Date | number = Date.now(),
): Array<T & { bfOriginalPrice?: number }> {
  type Out = T & { bfOriginalPrice?: number }
  return (items || []).map((it): Out => {
    const lista = precioListaPrendaPropia(it)
    if (lista === null) return it
    const aLista = it.price === lista || it.bfOriginalPrice === lista
    if (!aLista) return it
    const real = precioPrendaPropiaEnCarrito(it, items, now)!
    const { bfOriginalPrice: _drop, ...rest } = it
    return real < lista ? ({ ...rest, price: real, bfOriginalPrice: lista } as Out) : ({ ...rest, price: lista } as Out)
  })
}

/** ¿El carrito (ya repreciado) tiene al menos una prenda con precio Black Friday? */
export function carritoConBf2026(items: Array<{ bfOriginalPrice?: number; price: number }>): boolean {
  return (items || []).some((it) => typeof it.bfOriginalPrice === "number" && it.price < it.bfOriginalPrice)
}
