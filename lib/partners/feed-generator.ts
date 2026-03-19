const BASE_URL = 'https://www.novamente.ar'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function sanitizeForTsv(str: string): string {
  return str.replace(/[\t\n\r]/g, ' ').trim()
}

function formatPrice(price: number, currency = 'ARS'): string {
  return `${price.toFixed(2)} ${currency}`
}

function getProductUrl(tenantSlug: string, productSlug: string): string {
  return `${BASE_URL}/tienda/${tenantSlug}/producto/${productSlug}`
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeedTenant {
  name: string
  slug: string
  description?: string | null
}

interface FeedProduct {
  id: string
  name: string
  slug: string
  description?: string | null
  price: number | null
  images: string[]
  category?: string | null
  currency?: string
  availability?: string
  brand?: string | null
}

// ---------------------------------------------------------------------------
// Google Shopping XML (RSS 2.0 with g: namespace)
// ---------------------------------------------------------------------------

export function generateGoogleShoppingXml(
  tenant: FeedTenant,
  products: FeedProduct[],
): string {
  const storeUrl = `${BASE_URL}/tienda/${tenant.slug}`
  const storeDescription = escapeXml(tenant.description || `Tienda de ${tenant.name}`)

  const items = products
    .filter((p) => p.price && p.price > 0 && p.images.length > 0)
    .map((p) => {
      const productUrl = getProductUrl(tenant.slug, p.slug)
      const currency = p.currency || 'ARS'
      const availability = p.availability === 'out_of_stock' ? 'out of stock' : 'in stock'

      let item = ''
      item += '    <item>\n'
      item += `      <g:id>${escapeXml(p.id)}</g:id>\n`
      item += `      <title>${escapeXml(p.name)}</title>\n`
      item += `      <description>${escapeXml(p.description || p.name)}</description>\n`
      item += `      <link>${escapeXml(productUrl)}</link>\n`
      item += `      <g:image_link>${escapeXml(p.images[0])}</g:image_link>\n`

      // Additional images (up to 10)
      p.images.slice(1, 11).forEach((img) => {
        item += `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>\n`
      })

      item += `      <g:availability>${availability}</g:availability>\n`
      item += `      <g:price>${formatPrice(p.price!, currency)}</g:price>\n`
      item += `      <g:brand>${escapeXml(p.brand || tenant.name)}</g:brand>\n`
      item += `      <g:condition>new</g:condition>\n`

      if (p.category) {
        item += `      <g:product_type>${escapeXml(p.category)}</g:product_type>\n`
      }

      item += '    </item>\n'
      return item
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(tenant.name)}</title>
    <link>${escapeXml(storeUrl)}</link>
    <description>${storeDescription}</description>
${items}  </channel>
</rss>`
}

// ---------------------------------------------------------------------------
// Meta Commerce TSV
// ---------------------------------------------------------------------------

const META_TSV_HEADERS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'link',
  'image_link',
  'brand',
  'product_type',
]

export function generateMetaCommerceTsv(
  tenant: FeedTenant,
  products: FeedProduct[],
): string {
  const rows: string[] = [META_TSV_HEADERS.join('\t')]

  for (const p of products) {
    if (!p.price || p.price <= 0 || p.images.length === 0) continue

    const currency = p.currency || 'ARS'
    const availability = p.availability === 'out_of_stock' ? 'out of stock' : 'in stock'

    const row = [
      sanitizeForTsv(p.id),
      sanitizeForTsv(p.name),
      sanitizeForTsv(p.description || p.name),
      availability,
      'new',
      formatPrice(p.price, currency),
      getProductUrl(tenant.slug, p.slug),
      p.images[0],
      sanitizeForTsv(p.brand || tenant.name),
      sanitizeForTsv(p.category || ''),
    ]

    rows.push(row.join('\t'))
  }

  return rows.join('\n')
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface FeedIssue {
  field: string
  message: string
  productId?: string
  productName?: string
}

export function validateFeedProducts(products: FeedProduct[]): FeedIssue[] {
  const issues: FeedIssue[] = []

  for (const p of products) {
    if (!p.description) {
      issues.push({
        field: 'description',
        message: `Sin descripcion`,
        productId: p.id,
        productName: p.name,
      })
    }

    if (!p.images || p.images.length === 0) {
      issues.push({
        field: 'images',
        message: `Sin imagenes`,
        productId: p.id,
        productName: p.name,
      })
    }

    if (!p.price || p.price <= 0) {
      issues.push({
        field: 'price',
        message: `Sin precio o precio invalido`,
        productId: p.id,
        productName: p.name,
      })
    }

    if (!p.category) {
      issues.push({
        field: 'category',
        message: `Sin categoria`,
        productId: p.id,
        productName: p.name,
      })
    }

    if (p.name && p.name.length > 150) {
      issues.push({
        field: 'name',
        message: `Nombre demasiado largo (${p.name.length} caracteres, max 150)`,
        productId: p.id,
        productName: p.name,
      })
    }

    if (p.description && p.description.length > 5000) {
      issues.push({
        field: 'description',
        message: `Descripcion demasiado larga (${p.description.length} caracteres, max 5000)`,
        productId: p.id,
        productName: p.name,
      })
    }
  }

  return issues
}
