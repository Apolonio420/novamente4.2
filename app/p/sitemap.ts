import type { MetadataRoute } from 'next'
import { getPublishedTenants } from '@/lib/partners/tenant'
import { getPublishedProducts } from '@/lib/partners/catalog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.novamente.ar'
  const tenants = await getPublishedTenants()

  const entries: MetadataRoute.Sitemap = []

  for (const tenant of tenants) {
    // Skip non-indexable tenants (starter plan or explicitly disabled)
    if (!tenant.seo_indexable) continue

    // Tenant storefront page
    entries.push({
      url: `${baseUrl}/p/${tenant.slug}`,
      lastModified: new Date(tenant.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    })

    // Product pages for this tenant
    const products = await getPublishedProducts(tenant.id)
    for (const product of products) {
      entries.push({
        url: `${baseUrl}/p/${tenant.slug}/${product.slug}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  }

  return entries
}
