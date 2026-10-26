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

  // ---- Cyber Monday 2026 (lun 2/11 00:00 a mie 4/11 23:59 ART) ----
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
    endsAt: "2026-11-04T23:59:59-03:00",
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
    endsAt: "2026-11-04T23:59:59-03:00",
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
    endsAt: "2026-11-04T23:59:59-03:00",
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
    endsAt: "2026-11-04T23:59:59-03:00",
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
    endsAt: "2026-11-04T23:59:59-03:00",
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
    endsAt: "2026-11-04T23:59:59-03:00",
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
    endsAt: "2026-11-04T23:59:59-03:00",
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
    endsAt: "2026-11-04T23:59:59-03:00",
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
