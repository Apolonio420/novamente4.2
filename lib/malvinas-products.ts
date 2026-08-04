/**
 * Catálogo de productos COMPRABLES — Serie Malvinas.
 *
 * Datos estáticos (sin DB, sin tenant): consumidos por /malvinas/[slug] para
 * el flujo de compra real — selector de color/talle → useCart (lib/cartStore)
 * → /checkout → MercadoPago. Reusa EXACTAMENTE el mismo carrito/checkout que
 * el resto del sitio (mismo patrón que app/drops/[id]/DropClient.tsx), sin
 * tocar el motor de pagos ni las tiendas /p/ de partners.
 *
 * REGLA DE PRECIOS: el precio de cada producto es SIEMPRE el precio base de
 * la prenda en lib/catalog.ts (buscado por garmentType) — nunca un número
 * hardcodeado acá. Si lib/catalog.ts cambia, esto se actualiza solo.
 */
import { PRODUCTS as CATALOG_PRODUCTS } from "@/lib/catalog"

function basePrice(garmentType: SizeChartKey): number {
  const p = CATALOG_PRODUCTS.find((x) => x.garmentType === garmentType)
  if (!p) {
    throw new Error(
      `[malvinas-products] garmentType "${garmentType}" no existe en lib/catalog.ts — precio no derivable.`
    )
  }
  return p.price
}

export type SizeChartKey =
  | "aldea-classic-tshirt"
  | "aura-oversize-tshirt"
  | "buzo-cuello-redondo"
  | "buzo-hoodie-unisex"

/** Tabla de talles — copiada 1:1 de app/products/[id]/page.tsx (SIZE_CHARTS) para no divergir del resto del sitio. */
export const SIZE_CHARTS: Record<
  SizeChartKey,
  { sizes: string[]; width: string[]; length: string[] }
> = {
  "buzo-hoodie-unisex": {
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    width: ["64", "66", "68", "70", "72", "74"],
    length: ["67", "69", "71", "73", "75", "77"],
  },
  "buzo-cuello-redondo": {
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    width: ["65", "67", "69", "71", "73", "75"],
    length: ["66", "68", "70", "72", "74", "76"],
  },
  "aura-oversize-tshirt": {
    sizes: ["2XS", "XS", "S", "M", "L", "XL", "2XL"],
    width: ["55", "57", "59", "61", "63", "66", "69"],
    length: ["69", "71", "73", "75", "77", "79", "81"],
  },
  "aldea-classic-tshirt": {
    sizes: ["S", "M", "L", "XL", "XXL"],
    width: ["48", "52", "56", "58", "60"],
    length: ["63", "68", "72", "75", "77"],
  },
}

const GARMENT_DISPLAY_NAME: Record<SizeChartKey, string> = {
  "buzo-hoodie-unisex": "Buzo Hoodie Oversize",
  "buzo-cuello-redondo": "Buzo Cuello Redondo",
  "aura-oversize-tshirt": "Aura Oversize T-Shirt",
  "aldea-classic-tshirt": "Aldea Classic Fit T-Shirt",
}

/** Hex de swatch por color — alineado con COLOR_MAP de components/partners/storefront-designer.tsx (black/white/stone-wash); "beige" no existía ahí, se agrega acá. */
const COLOR_HEX: Record<string, string> = {
  negra: "#1a1a1a",
  negro: "#1a1a1a",
  blanca: "#f5f5f5",
  blanco: "#f5f5f5",
  beige: "#d9c7a3",
  "stone wash": "#9a9085",
}

export interface MalvinasColor {
  /** Label visible en el selector, ej. "Negra oversize" */
  name: string
  code: string
  /** Packshot de este color */
  image: string
}

export interface MalvinasProduct {
  slug: string
  name: string
  collection: "La Serie" | "Colección Minimal"
  /** Descripción corta de la prenda para mostrar bajo el título, ej. "Remera oversize" */
  garmentLabel: string
  garmentType: SizeChartKey
  price: number
  /** Foto lifestyle opcional — si existe, es la imagen hero por default */
  lifestyle?: string
  colors: MalvinasColor[]
  blurb: string
}

export const MALVINAS_PRODUCTS: MalvinasProduct[] = [
  // ---------------------------------------------------------------------
  // La Serie (v2) — un color cada diseño
  // ---------------------------------------------------------------------
  {
    slug: "trapo-negra",
    name: "El trapo",
    collection: "La Serie",
    garmentLabel: "Remera negra",
    garmentType: "aldea-classic-tshirt",
    price: basePrice("aldea-classic-tshirt"),
    lifestyle: "/marketing/malvinas/trapo-negra-lifestyle.jpg",
    colors: [
      { name: "Negra", code: COLOR_HEX.negra, image: "/marketing/malvinas/trapo-negra-packshot.jpg" },
      { name: "Stone wash", code: COLOR_HEX["stone wash"], image: "/marketing/malvinas/trapo-stonewash-packshot.jpg" },
    ],
    blurb: "La bandera que se vio en la cancha, estampada al frente.",
  },
  {
    slug: "tipografica-negra",
    name: "Tipográfica",
    collection: "La Serie",
    garmentLabel: "Remera negra",
    garmentType: "aldea-classic-tshirt",
    price: basePrice("aldea-classic-tshirt"),
    lifestyle: "/marketing/malvinas/tipografica-negra-lifestyle.jpg",
    colors: [
      { name: "Negra", code: COLOR_HEX.negra, image: "/marketing/malvinas/tipografica-negra-packshot.jpg" },
      { name: "Blanca", code: COLOR_HEX.blanca, image: "/marketing/malvinas/tipografica-blanca-packshot.jpg" },
      { name: "Stone wash", code: COLOR_HEX["stone wash"], image: "/marketing/malvinas/tipografica-stonewash-packshot.jpg" },
    ],
    blurb: "La frase, directa y sin vueltas.",
  },
  {
    slug: "badge-beige",
    name: "Escudo",
    collection: "La Serie",
    garmentLabel: "Remera beige",
    garmentType: "aldea-classic-tshirt",
    price: basePrice("aldea-classic-tshirt"),
    lifestyle: "/marketing/malvinas/badge-beige-lifestyle.jpg",
    colors: [
      { name: "Beige", code: COLOR_HEX.beige, image: "/marketing/malvinas/badge-beige-packshot.jpg" },
      { name: "Blanca", code: COLOR_HEX.blanca, image: "/marketing/malvinas/badge-blanca-packshot.jpg" },
      { name: "Negra", code: COLOR_HEX.negra, image: "/marketing/malvinas/badge-negra-packshot.jpg" },
    ],
    blurb: "Sello circular con el mapa de las islas.",
  },
  {
    slug: "pincel-blanca",
    name: "Pincelada",
    collection: "La Serie",
    garmentLabel: "Remera blanca",
    garmentType: "aldea-classic-tshirt",
    price: basePrice("aldea-classic-tshirt"),
    lifestyle: "/marketing/malvinas/pincel-blanca-lifestyle.jpg",
    colors: [
      { name: "Blanca", code: COLOR_HEX.blanca, image: "/marketing/malvinas/pincel-blanca-packshot.jpg" },
      { name: "Negra", code: COLOR_HEX.negra, image: "/marketing/malvinas/pincel-negra-packshot.jpg" },
      { name: "Beige", code: COLOR_HEX.beige, image: "/marketing/malvinas/pincel-beige-packshot.jpg" },
    ],
    blurb: "Trazo suelto, en blanco y negro.",
  },
  {
    slug: "islas-minimal-blanca",
    name: "Islas",
    collection: "La Serie",
    garmentLabel: "Remera blanca",
    garmentType: "aldea-classic-tshirt",
    price: basePrice("aldea-classic-tshirt"),
    lifestyle: "/marketing/malvinas/islas-minimal-blanca-lifestyle.jpg",
    colors: [
      { name: "Blanca", code: COLOR_HEX.blanca, image: "/marketing/malvinas/islas-minimal-blanca-packshot.jpg" },
      { name: "Negra", code: COLOR_HEX.negra, image: "/marketing/malvinas/islas-minimal-negra-packshot.jpg" },
      { name: "Beige", code: COLOR_HEX.beige, image: "/marketing/malvinas/islas-minimal-beige-packshot.jpg" },
    ],
    blurb: "Silueta minimalista de las islas.",
  },
  {
    slug: "bandera-hoodie",
    name: "Bandera",
    collection: "La Serie",
    garmentLabel: "Hoodie negro",
    garmentType: "buzo-hoodie-unisex",
    price: basePrice("buzo-hoodie-unisex"),
    lifestyle: "/marketing/malvinas/bandera-hoodie-lifestyle.jpg",
    colors: [
      { name: "Negro", code: COLOR_HEX.negro, image: "/marketing/malvinas/bandera-hoodie-packshot.jpg" },
      { name: "Blanco", code: COLOR_HEX.blanco, image: "/marketing/malvinas/bandera-hoodie-blanco-packshot.jpg" },
      { name: "Stone wash", code: COLOR_HEX["stone wash"], image: "/marketing/malvinas/bandera-hoodie-stonewash-packshot.jpg" },
    ],
    blurb: "Celeste y blanca, al frente del hoodie.",
  },
  {
    slug: "carta-nautica-buzo",
    name: "Carta náutica",
    collection: "La Serie",
    garmentLabel: "Buzo stone wash",
    garmentType: "buzo-cuello-redondo",
    price: basePrice("buzo-cuello-redondo"),
    lifestyle: "/marketing/malvinas/carta-nautica-buzo-lifestyle.jpg",
    colors: [
      { name: "Stone wash", code: COLOR_HEX["stone wash"], image: "/marketing/malvinas/carta-nautica-buzo-packshot.jpg" },
      { name: "Negro", code: COLOR_HEX.negro, image: "/marketing/malvinas/carta-nautica-buzo-negro-packshot.jpg" },
      { name: "Blanco", code: COLOR_HEX.blanco, image: "/marketing/malvinas/carta-nautica-buzo-blanco-packshot.jpg" },
    ],
    blurb: "Mapa técnico de las islas, estilo carta de navegación.",
  },

  // ---------------------------------------------------------------------
  // Colección Minimal (v3) — con variantes de color
  // ---------------------------------------------------------------------
  {
    slug: "tres-estrellas",
    name: "Tres estrellas",
    collection: "Colección Minimal",
    garmentLabel: "Remera oversize",
    garmentType: "aura-oversize-tshirt",
    price: basePrice("aura-oversize-tshirt"),
    lifestyle: "/marketing/malvinas/tresestrellas-lifestyle.jpg",
    colors: [
      { name: "Negra oversize", code: COLOR_HEX.negra, image: "/marketing/malvinas/tresestrellas-negra-packshot.jpg" },
      { name: "Blanca oversize", code: COLOR_HEX.blanca, image: "/marketing/malvinas/tresestrellas-blanca-packshot.jpg" },
      { name: "Stone wash", code: COLOR_HEX["stone wash"], image: "/marketing/malvinas/tresestrellas-stonewash-packshot.jpg" },
    ],
    blurb: "Las islas y tres estrellas celestes, al frente. Minimalista y directo.",
  },
  {
    slug: "monograma",
    name: "Monograma 51°S 59°O",
    collection: "Colección Minimal",
    garmentLabel: "Remera clásica",
    garmentType: "aldea-classic-tshirt",
    price: basePrice("aldea-classic-tshirt"),
    colors: [
      { name: "Beige", code: COLOR_HEX.beige, image: "/marketing/malvinas/monograma-beige-packshot.jpg" },
      { name: "Blanca clásica", code: COLOR_HEX.blanca, image: "/marketing/malvinas/monograma-blanca-packshot.jpg" },
      { name: "Negra clásica", code: COLOR_HEX.negra, image: "/marketing/malvinas/monograma-negra-packshot.jpg" },
    ],
    blurb: "Islas chicas, una estrella y las coordenadas exactas de las Malvinas.",
  },
  {
    slug: "horizonte-buzo",
    name: "Horizonte Buzo",
    collection: "Colección Minimal",
    garmentLabel: "Buzo stone wash",
    garmentType: "buzo-cuello-redondo",
    price: basePrice("buzo-cuello-redondo"),
    lifestyle: "/marketing/malvinas/horizonte-lifestyle.jpg",
    colors: [
      { name: "Stone wash", code: COLOR_HEX["stone wash"], image: "/marketing/malvinas/horizonte-buzo-packshot.jpg" },
      { name: "Negro", code: COLOR_HEX.negro, image: "/marketing/malvinas/horizonte-buzo-negro-packshot.jpg" },
      { name: "Blanco", code: COLOR_HEX.blanco, image: "/marketing/malvinas/horizonte-buzo-blanco-packshot.jpg" },
    ],
    blurb: "Las islas y el sol saliendo sobre la línea de horizonte.",
  },
  {
    slug: "horizonte-hoodie",
    name: "Horizonte Hoodie",
    collection: "Colección Minimal",
    garmentLabel: "Hoodie negro",
    garmentType: "buzo-hoodie-unisex",
    price: basePrice("buzo-hoodie-unisex"),
    colors: [
      { name: "Negro", code: COLOR_HEX.negro, image: "/marketing/malvinas/horizonte-hoodie-packshot.jpg" },
      { name: "Blanco", code: COLOR_HEX.blanco, image: "/marketing/malvinas/horizonte-hoodie-blanco-packshot.jpg" },
      { name: "Stone wash", code: COLOR_HEX["stone wash"], image: "/marketing/malvinas/horizonte-hoodie-stonewash-packshot.jpg" },
    ],
    blurb: "Las islas y el sol saliendo sobre la línea de horizonte, versión hoodie.",
  },
]

export function getMalvinasProduct(slug: string): MalvinasProduct | undefined {
  return MALVINAS_PRODUCTS.find((p) => p.slug === slug)
}

export function garmentDisplayName(key: SizeChartKey): string {
  return GARMENT_DISPLAY_NAME[key]
}
