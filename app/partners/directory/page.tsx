import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPublishedTenants } from '@/lib/partners/tenant'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/partners/json-ld'
import {
  generateBreadcrumbSchema,
  generateItemListSchema,
} from '@/lib/partners/seo'
import DirectoryFilter from './directory-filter'

const BASE_URL = 'https://www.novamente.ar'

export const metadata: Metadata = {
  title: 'Marcas en Novamente — Directorio de Partners',
  description:
    'Descubri las marcas que confian en Novamente para crear y vender merch premium. Explora storefronts, catalogos y disenos unicos.',
  alternates: {
    canonical: `${BASE_URL}/partners/directory`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/partners/directory`,
    title: 'Marcas en Novamente — Directorio de Partners',
    description:
      'Descubri las marcas que confian en Novamente para crear y vender merch premium.',
    images: [
      {
        url: `${BASE_URL}/novamente-logo.png`,
        width: 1200,
        height: 630,
        alt: 'Novamente Partners Directory',
      },
    ],
    siteName: 'Novamente',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marcas en Novamente — Directorio de Partners',
    description: 'Descubri las marcas que confian en Novamente para crear y vender merch premium.',
    images: [`${BASE_URL}/novamente-logo.png`],
  },
}

export default async function PartnerDirectoryPage() {
  const allTenants = await getPublishedTenants()
  // Only show seo_indexable tenants in the public directory
  const tenants = allTenants.filter((t) => t.seo_indexable)

  // Extract unique industries for the filter
  const industries = Array.from(
    new Set(tenants.map((t) => t.industry).filter(Boolean))
  ).sort() as string[]

  // Serialize tenant data for the client filter component
  const tenantsData = tenants.map((t) => ({
    slug: t.slug,
    name: t.name,
    tagline: t.tagline,
    industry: t.industry,
    logo_url: t.logo_url,
    primary_color: t.primary_color,
  }))

  // Build ItemList for structured data
  const itemListItems = tenants.map((t, i) => ({
    name: t.name,
    url: `${BASE_URL}/p/${t.slug}`,
    ...(t.logo_url && { image: t.logo_url }),
    position: i + 1,
  }))

  return (
    <div className="min-h-screen">
      {/* JSON-LD: Breadcrumb */}
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: 'Inicio', url: BASE_URL },
          { name: 'Partners', url: `${BASE_URL}/partners` },
          { name: 'Directorio', url: `${BASE_URL}/partners/directory` },
        ])}
      />

      {/* JSON-LD: ItemList */}
      {itemListItems.length > 0 && (
        <JsonLd data={generateItemListSchema(itemListItems)} />
      )}

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">
            Directorio de Partners
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            Explorá las marcas que usan Novamente para crear y vender merch premium.
            Cada una con su storefront, catálogo y estilo único.
          </p>
        </div>
      </section>

      {/* Directory Grid with client-side filter */}
      <section className="container mx-auto px-4 pb-20">
        <DirectoryFilter tenants={tenantsData} industries={industries} />
      </section>
    </div>
  )
}
