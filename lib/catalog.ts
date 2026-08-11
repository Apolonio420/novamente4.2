/**
 * Centralized Product Catalog — Single Source of Truth
 *
 * ALL product data lives here. PublicAssistant, public-chat system prompt,
 * and any future consumer should import from this file.
 *
 * Excepción: los costos de envío NO viven acá, viven en lib/shipping-config.ts
 * (única fuente de verdad, la misma que cobra el checkout).
 */
import {
  SHIPPING,
  SHIPPING_ZONES_PUBLIC,
  PRODUCTION_DAYS as PROD_DAYS,
  totalDeliveryLine,
} from './shipping-config'

export interface Product {
  name: string
  garmentType: string
  price: number
  colors: string[]
  image: string
  category: 'hoodie' | 'buzo' | 'remera' | 'musculosa' | 'lienzo' | 'accesorio'
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
    colors: ['negro', 'blanco', 'beige'],
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
    colors: ['amarillo', 'chocolate', 'gris melange', 'vison'],
    image: '/products/classic-negro-front.jpeg',
    category: 'remera',
  },
  {
    name: 'Bambino Remera Infantil',
    garmentType: 'remera-infantil',
    price: 23500,
    colors: ['blanco', 'negro', 'gris', 'amarillo', 'celeste', 'rosa'],
    image: '/products/remera-infantil-blanco/front.jpg',
    category: 'remera',
  },
  {
    name: 'Musculosa Bali',
    garmentType: 'musculosa-bali',
    price: 21800,
    colors: ['blanca', 'gris'],
    image: '/products/musculosa-bali-front.jpeg',
    category: 'musculosa',
  },
  {
    // Precio de entrada (medida 20×30cm). Desglose real por medida en
    // lib/products.ts:131 (id "lienzo") — fuente de verdad, coincide con el
    // b2c_web del motor de cotización del bot. Este es el precio "desde".
    name: 'Lienzo Premium',
    garmentType: 'lienzo-premium',
    price: 34000,
    colors: [],
    image: '/products/lienzo-front.jpeg',
    category: 'lienzo',
  },
  {
    name: 'Bahía Totebag',
    garmentType: 'totebag',
    price: 20900,
    colors: ['crudo'],
    image: '/products/totebag-crudo/front.jpg',
    category: 'accesorio',
  },
]

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const

/**
 * Zonas de envío para el prompt del bot. Derivadas de lib/shipping-config.ts:
 * antes tenía su propia tabla (AMBA 5500 / Interior BA 7000 / Resto 9000) y el
 * bot cotizaba un precio que el checkout no cobraba.
 */
export const SHIPPING_ZONES = SHIPPING_ZONES_PUBLIC

/**
 * Derivado de shipping-config: acá decía '2-5' mientras SHIPPING.md y el bot de
 * WhatsApp decían 24-48h. El chat de la tienda prometía un plazo distinto al
 * que promete todo lo demás.
 */
export const PRODUCTION_DAYS = `${PROD_DAYS.min}-${PROD_DAYS.max}`

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
  const entrega = SHIPPING_ZONES_PUBLIC.map(z => `${z.zone} ${z.days}`).join(' | ')
  return `ENVIO: ${zones} | GRATIS desde ${formatPrice(SHIPPING.FREE_THRESHOLD)}\nPRODUCCION: ${PRODUCTION_DAYS} dias habiles | ENTREGA: ${entrega} | TOTAL: ${totalDeliveryLine()}`
}
