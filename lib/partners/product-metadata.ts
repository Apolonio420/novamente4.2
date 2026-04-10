import type { PartnerProduct, Tenant } from './types'
import type { Product, ProductColor, ProductSizing } from '@/src/data/partners'

/**
 * Rich metadata stored in partner_products.metadata JSONB.
 * No DB migration needed — uses existing metadata column.
 */
export interface ProductRichMetadata {
  colors: Array<{
    name: string
    value: string
    hex: string
    images: { front: string; back: string }
  }>
  sizes: string[]
  lifestyleImages: string[]
  closeUp?: string
  detailedDescription: string
  features: string[]
  sizing: Record<string, string>
  brandValues: string
  cardDescription: string
  featured?: boolean
}

function formatPriceARS(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Converts a DB PartnerProduct → static Product interface.
 * Extracts rich data from metadata JSONB, with sensible fallbacks
 * for products that don't have full metadata yet.
 */
export function dbProductToProduct(dbProduct: PartnerProduct, tenant: Tenant): Product {
  const m = (dbProduct.metadata || {}) as Partial<ProductRichMetadata>

  // Colors: from metadata, or synthesize from flat images array
  let colors: ProductColor[]
  if (m.colors && m.colors.length > 0) {
    // Ensure each color has required fields (images, value) — they may be missing if migrated from simplified data
    colors = m.colors.map((c, i) => ({
      name: c.name || 'Default',
      value: c.value || (c.name || 'default').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      hex: c.hex || tenant.primary_color || '#000000',
      images: c.images || {
        front: dbProduct.images?.[i * 2] || dbProduct.images?.[0] || '',
        back: dbProduct.images?.[i * 2 + 1] || dbProduct.images?.[1] || dbProduct.images?.[0] || '',
      },
    }))
  } else {
    // Fallback: treat images[0] as front, images[1] as back
    colors = [{
      name: dbProduct.category || 'Default',
      value: (dbProduct.category || 'default').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      hex: tenant.primary_color || '#000000',
      images: {
        front: dbProduct.images?.[0] || '',
        back: dbProduct.images?.[1] || dbProduct.images?.[0] || '',
      },
    }]
  }

  const sizes = m.sizes || ['S', 'M', 'L', 'XL']
  const lifestyleImages = m.lifestyleImages || []
  const features = m.features || [
    `Producto oficial de ${tenant.name}`,
    'Calidad premium',
    'Diseño exclusivo',
    'Envío a todo el país',
  ]
  const sizing: ProductSizing = m.sizing || {}
  const detailedDescription = m.detailedDescription || dbProduct.description || ''
  const brandValues = m.brandValues || tenant.tagline || tenant.name
  const cardDescription = m.cardDescription || (dbProduct.description || '').slice(0, 100)

  const price = dbProduct.price || 0

  return {
    id: dbProduct.slug,
    name: dbProduct.name,
    price,
    priceLabel: formatPriceARS(price),
    colors,
    sizes,
    category: dbProduct.category || 'Productos',
    lifestyleImages,
    closeUp: m.closeUp,
    description: dbProduct.description || '',
    detailedDescription,
    features,
    sizing,
    brand: tenant.name,
    brandValues,
    featured: m.featured || false,
    cardDescription,
  }
}
