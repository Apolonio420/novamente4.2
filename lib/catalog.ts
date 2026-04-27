/**
 * Centralized Product Catalog — Single Source of Truth
 *
 * ALL product data lives here. PublicAssistant, public-chat system prompt,
 * and any future consumer should import from this file.
 */

export interface Product {
  name: string
  garmentType: string
  price: number
  colors: string[]
  image: string
  category: 'hoodie' | 'buzo' | 'remera' | 'musculosa' | 'lienzo'
}

export const PRODUCTS: Product[] = [
  {
    name: 'Buzo Hoodie Oversize',
    garmentType: 'buzo-hoodie-unisex',
    price: 55000,
    colors: ['negro', 'blanco', 'stone-wash', 'marron', 'gris melange', 'crema'],
    image: '/products/buzo-cuello-redondo-unisex-negro-estilo-oversize/mockups nuevos productos-8.png',
    category: 'buzo',
  },
  {
    name: 'Buzo Cuello Redondo',
    garmentType: 'buzo-cuello-redondo',
    price: 43000,
    colors: ['negro', 'blanco', 'stone-wash'],
    image: '/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png',
    category: 'buzo',
  },
  {
    name: 'Aura Oversize T-Shirt',
    garmentType: 'aura-oversize-tshirt',
    price: 31000,
    colors: ['blanco', 'negro', 'caramel', 'stone-wash'],
    image: '/products/oversize-negro-front.jpeg',
    category: 'remera',
  },
  {
    name: 'Aldea Classic Fit T-Shirt',
    garmentType: 'aldea-classic-tshirt',
    price: 28600,
    colors: ['negro', 'blanco'],
    image: '/products/classic-negro-front.jpeg',
    category: 'remera',
  },
  {
    name: 'Remera Clasica Mujer',
    garmentType: 'remera-clasica-mujer',
    price: 28600,
    colors: ['blanca', 'negra'],
    image: '/products/classic-negro-front.jpeg',
    category: 'remera',
  },
  {
    name: 'Remera Crop Mujer',
    garmentType: 'remera-crop-mujer',
    price: 23500,
    colors: ['negra', 'chocolate', 'gris melange', 'amarillo'],
    image: '/products/classic-negro-front.jpeg',
    category: 'remera',
  },
  {
    name: 'Musculosa Bali',
    garmentType: 'musculosa-bali',
    price: 21800,
    colors: ['blanca', 'negra', 'gris'],
    image: '/products/musculosa-bali-front.jpeg',
    category: 'musculosa',
  },
  {
    name: 'Lienzo Premium',
    garmentType: 'lienzo-premium',
    price: 59900,
    colors: [],
    image: '/products/lienzo-front.jpeg',
    category: 'lienzo',
  },
]

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const

export const SHIPPING_ZONES = [
  { zone: 'AMBA', price: 5500, days: '3-5' },
  { zone: 'Interior BA', price: 7000, days: '5-7' },
  { zone: 'Resto del pais', price: 9000, days: '7-10' },
] as const

export const PRODUCTION_DAYS = '2-5'

export function formatPrice(n: number): string {
  return `$${n.toLocaleString('es-AR')}`
}

/** Generate the PRODUCTOS section for AI system prompts */
export function buildProductListForPrompt(): string {
  const lines = PRODUCTS.map(p => {
    const colors = p.colors.length > 0 ? ` (${p.colors.join(', ')})` : ''
    return `- ${p.name}: ${formatPrice(p.price)}${colors}`
  })
  return lines.join('\n')
}

/** Generate shipping info for AI system prompts */
export function buildShippingForPrompt(): string {
  const zones = SHIPPING_ZONES.map(z => `${z.zone} ${formatPrice(z.price)}`).join(' | ')
  return `ENVIO: ${zones}\nPRODUCCION: ${PRODUCTION_DAYS} dias habiles | ENTREGA: 3-10 dias habiles segun zona`
}
