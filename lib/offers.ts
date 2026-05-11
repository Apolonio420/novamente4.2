/**
 * Ofertas activas / Hot Sale.
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

export const HOT_SALE_OFFERS: Offer[] = [
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
    endsAt: "2026-05-18T23:59:59-03:00",
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
    endsAt: "2026-05-18T23:59:59-03:00",
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
    endsAt: "2026-05-18T23:59:59-03:00",
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
    endsAt: "2026-05-18T23:59:59-03:00",
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
    endsAt: "2026-05-18T23:59:59-03:00",
    shortDescription: "Crest circular Campeón del Mundo 2022 — doble estampa frente y espalda.",
    badge: "Doble estampa",
  },
]

export function getActiveOffers(now: Date = new Date()): Offer[] {
  const ts = now.getTime()
  return HOT_SALE_OFFERS.filter(o => {
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
