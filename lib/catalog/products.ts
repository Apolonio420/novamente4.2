/**
 * Source of truth UNICA del catalogo Novamente.
 *
 * Cualquier modulo que necesite saber QUE vendemos (que productos, que colores,
 * que talles, que precios) debe importar desde aca. NO duplicar arrays de
 * productos en otros archivos.
 *
 * Consumidores:
 * - lib/partners/garment-pricing.ts (derivado: pricing tiers)
 * - lib/partners/design-engine.ts (derivado: GARMENT_TYPES para Studio)
 * - lib/products.ts (derivado: PRODUCTS B2C web)
 * - app/api/storefront/[slug]/studio/config/route.ts (publica al storefront publico)
 * - app/workspace/design-engine/page.tsx (UI partner)
 * - lib/partners/product-policy.ts (validacion categorias)
 *
 * Reglas de negocio (de CLAIMS-PERMITIDOS.md):
 * - Gramajes: buzos 300 g/m², remeras 250 g/m², crops/musculosas 150 g/m².
 * - Los buzos NO llevan cordones (hasDrawstrings: false).
 * - Talles unisex: S a XXL. Sin XS ni XXXL.
 * - Composicion: algodon 100% (peinado en remeras, frizado en buzos).
 */

export type GarmentTypeKind = 'tshirt' | 'hoodie' | 'sweatshirt' | 'tank' | 'canvas'

export interface ProductColor {
  /** Slug interno en ingles (consistencia con tooling Gemini/internacional) */
  key: string
  /** Nombre visible en espanol */
  name: string
  /** Hex aproximado para swatches */
  hex: string
  /** Path en /public/garments/ — thumbnail front del producto en este color */
  thumbnail: string | null
  /** Path en /public/products/ — imagen hero / lifestyle para PDP */
  hero: string | null
}

export interface CatalogProduct {
  /** Key canonica del producto. Usar como garment_key en todas partes. */
  key: string
  /** Nombre visible */
  name: string
  /** Categoria para filtros (matchea lib/partners/product-policy.ts) */
  category: string
  /** Tipo fisico de prenda */
  garmentType: GarmentTypeKind
  /** Fit / silueta */
  fit: string
  /** Composicion textil */
  fabric: string
  /** Gramaje en g/m² (null si no aplica como Lienzo) */
  weightGsm: number | null
  /** Precio costo Novamente — lo que paga el partner Growth/Pro (on_demand) */
  costARS: number
  /** Precio retail web — lo que paga el partner Starter y el cliente B2C */
  retailARS: number
  /** Talles disponibles */
  sizes: string[]
  /** Tabla de talles (imagen) */
  measurementsImage: string | null
  /** Colores disponibles */
  colors: ProductColor[]
  /** True si el item lleva cordones (relevante para hoodies). Buzos Novamente: false. */
  hasDrawstrings?: boolean
  /** Descripcion corta para el storefront */
  shortDescription?: string
}

// ---------------------------------------------------------------------------
// Catalogo
// ---------------------------------------------------------------------------

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    key: 'aldea-classic-tshirt',
    name: 'Remera Aldea Classic Fit',
    category: 'Remera Classic',
    garmentType: 'tshirt',
    fit: 'classic',
    fabric: 'algodon 100% peinado',
    weightGsm: 250,
    costARS: 25700,
    retailARS: 31000,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    measurementsImage: '/products/tshirt-aldea-negro-medidas.png',
    shortDescription: 'Remera clasica fit regular en algodon 100% peinado. Base ideal para estampado DTG.',
    colors: [
      {
        key: 'black',
        name: 'Negro',
        hex: '#1a1a1a',
        thumbnail: '/garments/tshirt-black-classic-front.jpeg',
        hero: '/products/tshirt-aldea-negro-front.jpeg',
      },
      {
        key: 'white',
        name: 'Blanco',
        hex: '#f5f5f5',
        thumbnail: '/garments/tshirt-white-classic-front.jpeg',
        hero: '/products/tshirt-aldea-blanco-front.jpeg',
      },
    ],
  },
  {
    key: 'aura-oversize-tshirt',
    name: 'Remera Aura Oversize',
    category: 'Remera Oversize',
    garmentType: 'tshirt',
    fit: 'oversize',
    fabric: 'algodon 100% peinado fibra larga',
    weightGsm: 250,
    costARS: 25400,
    retailARS: 33000,
    sizes: ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL'],
    measurementsImage: '/products/size-charts/over.png',
    shortDescription: 'Remera oversize en algodon 100% peinado, corte amplio y caida moderna. Estampado DTG premium.',
    colors: [
      {
        key: 'black',
        name: 'Negro',
        hex: '#1a1a1a',
        thumbnail: '/garments/tshirt-black-oversize-front.jpeg',
        hero: '/products/aura-tshirt-negro-front.jpeg',
      },
      {
        key: 'white',
        name: 'Blanco',
        hex: '#f5f5f5',
        thumbnail: '/garments/tshirt-white-oversize-front.jpeg',
        hero: '/products/aura-tshirt-blanco-front.jpeg',
      },
      {
        key: 'stone-wash',
        name: 'Stone Wash',
        hex: '#9a9085',
        thumbnail: '/products/aura-oversize-tshirt-stone-wash/main.png',
        hero: '/products/aura-oversize-tshirt-stone-wash/main.png',
      },
    ],
  },
  {
    key: 'remera-clasica-mujer',
    name: 'Remera Clasica Mujer',
    category: 'Remera Mujer',
    garmentType: 'tshirt',
    fit: 'classic-women',
    fabric: 'algodon 100% peinado',
    weightGsm: 250,
    costARS: 25700,
    retailARS: 31000,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    measurementsImage: '/products/remera-clasica-woman-blanca/Medidas2.png',
    shortDescription: 'Remera clasica mujer, corte femenino entallado. Algodon 100%.',
    colors: [
      {
        key: 'black',
        name: 'Negra',
        hex: '#1a1a1a',
        thumbnail: '/garments/remera-clasica-mujer-black-front.png',
        hero: '/products/remera-clasica-woman-negra/mockups nuevos productos-3.png',
      },
      {
        key: 'white',
        name: 'Blanca',
        hex: '#f5f5f5',
        thumbnail: '/garments/remera-clasica-mujer-white-front.png',
        hero: '/products/remera-clasica-woman-blanca/mockups nuevos productos-2.png',
      },
    ],
  },
  {
    key: 'remera-crop-mujer',
    name: 'Remera Crop Mujer',
    category: 'Remera Crop Mujer',
    garmentType: 'tshirt',
    fit: 'crop',
    fabric: 'algodon 100% premium',
    weightGsm: 150,
    costARS: 19300,
    retailARS: 26000,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    measurementsImage: '/products/remera-crop-de-mujer-negra/Medidas1.png',
    shortDescription: 'Remera crop mujer en algodon liviano, ideal para verano y looks juveniles.',
    colors: [
      {
        key: 'black',
        name: 'Negra',
        hex: '#1a1a1a',
        thumbnail: '/garments/remera-crop-mujer-black-front.png',
        hero: '/products/remera-crop-de-mujer-negra/mockups nuevos productos-4.png',
      },
      {
        key: 'chocolate',
        name: 'Chocolate',
        hex: '#5C3A21',
        thumbnail: '/garments/remera-crop-mujer-chocolate-front.png',
        hero: '/products/remera-crop-de-mujer-chocolate/mockups nuevos productos-5.png',
      },
      {
        key: 'gray',
        name: 'Gris Melange',
        hex: '#9aa0a6',
        thumbnail: '/garments/remera-crop-mujer-gray-front.png',
        hero: '/products/remera-crop-de-mujer-gris/mockups nuevos productos-6.png',
      },
      {
        key: 'yellow',
        name: 'Amarillo',
        hex: '#F5C518',
        thumbnail: '/garments/remera-crop-mujer-yellow-front.png',
        hero: '/products/remera-crop-de-mujer-amarillo/mockups nuevos productos-7.png',
      },
    ],
  },
  {
    key: 'musculosa-bali',
    name: 'Musculosa Bali',
    category: 'Musculosa',
    garmentType: 'tank',
    fit: 'regular',
    fabric: 'morley premium',
    weightGsm: 150,
    costARS: 17400,
    retailARS: 24000,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    measurementsImage: '/products/musculosa-bali-blanca/Medidas3.png',
    shortDescription: 'Musculosa rib en morley premium. Calce ajustado, ideal para verano y gym.',
    colors: [
      {
        key: 'black',
        name: 'Negra',
        hex: '#1a1a1a',
        thumbnail: '/garments/musculosa-bali-black-front.png',
        hero: '/products/musculosa-bali-negra/Musculosa_Rib_Negra.png',
      },
      {
        key: 'white',
        name: 'Blanca',
        hex: '#f5f5f5',
        thumbnail: '/garments/musculosa-bali-white-front.png',
        hero: '/products/musculosa-bali-blanca/Musculosa_Rib_Blanca.png',
      },
      {
        key: 'gray',
        name: 'Gris',
        hex: '#9aa0a6',
        thumbnail: '/garments/musculosa-bali-gray-front.png',
        hero: '/products/musculosa-bali-gris/Musculosa_Rib_Gris.png',
      },
    ],
  },
  {
    key: 'buzo-cuello-redondo',
    name: 'Buzo Cuello Redondo',
    category: 'Buzo Crewneck',
    garmentType: 'sweatshirt',
    fit: 'oversize-crewneck',
    fabric: 'algodon frizado premium',
    weightGsm: 300,
    costARS: 32200,
    retailARS: 45000,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    measurementsImage: '/products/size-charts/crewneck.png',
    hasDrawstrings: false,
    shortDescription: 'Buzo crewneck oversize, algodon frizado 300 g/m². Sin cordones, calce relajado.',
    colors: [
      {
        key: 'black',
        name: 'Negro',
        hex: '#1a1a1a',
        thumbnail: '/garments/buzo-cuello-redondo-black-front.png',
        hero: '/products/buzo-cuello-redondo-unisex-negro-estilo-oversize/mockups nuevos productos-8.png',
      },
      {
        key: 'white',
        name: 'Blanco',
        hex: '#f5f5f5',
        thumbnail: '/garments/buzo-cuello-redondo-white-front.png',
        hero: '/products/buzo-cuello-redondo-unisex-blanco-estilo-oversize/mockups nuevos productos-9.png',
      },
      {
        key: 'stone-wash',
        name: 'Stone Wash',
        hex: '#9a9085',
        thumbnail: '/garments/buzo-cuello-redondo-stone-wash-front.png',
        hero: '/products/buzo-cuello-redondo-unisex-stone-wash-friza-premium-estilo-oversize/mockups nuevos productos-10.png',
      },
    ],
  },
  {
    key: 'buzo-hoodie-unisex',
    name: 'Buzo Hoodie Oversize',
    category: 'Buzo Hoodie Oversize',
    garmentType: 'hoodie',
    fit: 'oversize',
    fabric: 'algodon frizado premium',
    weightGsm: 300,
    costARS: 38700,
    retailARS: 58000,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    measurementsImage: '/products/size-charts/hoodie.png',
    hasDrawstrings: false,
    shortDescription: 'Buzo hoodie oversize, algodon frizado 300 g/m². Sin cordones, capucha tipica de oversize.',
    // Colores actuales en venta: blanco, negro, stone wash. Otros colores (marron,
    // crema, gris melange) tienen assets fisicos pero no estan en oferta actual.
    colors: [
      {
        key: 'black',
        name: 'Negro',
        hex: '#1a1a1a',
        thumbnail: '/garments/buzo-hoodie-unisex-black-front.png',
        hero: '/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png',
      },
      {
        key: 'white',
        name: 'Blanco',
        hex: '#f5f5f5',
        thumbnail: '/garments/buzo-hoodie-unisex-white-front.png',
        hero: '/products/buzo-hoddie-unisex-blanco/mockups nuevos productos-11.png',
      },
      {
        key: 'stone-wash',
        name: 'Stone Wash',
        hex: '#9a9085',
        thumbnail: '/garments/buzo-hoodie-unisex-stone-wash-front.png',
        hero: '/products/buzo-hoddie-unisex-stone-wash/mockups nuevos productos-13.png',
      },
    ],
  },
  // Lienzo Premium discontinuado del catalogo partner el 2026-05-18.
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PRODUCTS_BY_KEY: Record<string, CatalogProduct> = Object.fromEntries(
  CATALOG_PRODUCTS.map(p => [p.key, p])
)

export function getCatalogProduct(key: string): CatalogProduct | undefined {
  return PRODUCTS_BY_KEY[key]
}

export function getCatalogProductColor(productKey: string, colorKey: string): ProductColor | undefined {
  return getCatalogProduct(productKey)?.colors.find(c => c.key === colorKey)
}

/** Devuelve las keys de garments disponibles. */
export function listCatalogKeys(): string[] {
  return CATALOG_PRODUCTS.map(p => p.key)
}

/** Devuelve { key, label } para selects en UI. */
export function getCatalogGarmentOptions(): Array<{ key: string; label: string }> {
  return CATALOG_PRODUCTS.map(p => ({ key: p.key, label: p.name }))
}

/**
 * Devuelve la lista de garments en formato compatible con el endpoint
 * /api/storefront/[slug]/studio/config (que el storefront publico consume).
 */
export function getStorefrontGarmentList() {
  return CATALOG_PRODUCTS.map(p => ({
    key: p.key,
    name: p.name,
    category: p.category,
    type: p.garmentType,
    fit: p.fit,
    sizes: p.sizes,
    colors: p.colors.map(c => ({
      key: c.key,
      name: c.name,
      hex: c.hex,
      thumbnail: c.thumbnail,
    })),
    price: p.retailARS,
    cost: p.costARS,
  }))
}

/** Categorias unicas para validacion (lib/partners/product-policy.ts). */
export function getCatalogCategories(): string[] {
  const set = new Set(CATALOG_PRODUCTS.map(p => p.category))
  return Array.from(set).sort()
}

/** Formatea precio en ARS con separador de miles. */
export function formatCatalogPrice(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
