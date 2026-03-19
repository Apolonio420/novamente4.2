import type { Metadata } from 'next'
import { getProductById } from '@/src/data/partners'

type Props = {
  params: Promise<{ brand: string; product: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand, product: productSlug } = await params
  const result = getProductById(brand, productSlug)

  if (!result) {
    return { title: 'Producto no encontrado' }
  }

  const { partner, product } = result
  const title = `${product.name} — ${partner.name}`
  const description = product.description || `${product.name} de ${partner.name}. Merch premium con estampado DTG.`
  const image = product.colors[0]?.images?.front || ''
  const canonicalUrl = `https://www.novamente.ar/merch/${brand}/${productSlug}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Novamente',
      locale: 'es_AR',
      type: 'website',
      ...(image && { images: [{ url: image, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image && { images: [image] }),
    },
  }
}

function buildProductSchema(product: any, partner: any, brand: string, productSlug: string) {
  const url = `https://www.novamente.ar/merch/${brand}/${productSlug}`
  const images = product.colors?.flatMap((c: any) => [c.images?.front, c.images?.back].filter(Boolean)) || []

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} de ${partner.name}`,
    url,
    image: images,
    brand: { "@type": "Brand", name: partner.name },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "ARS",
      price: product.basePrice || (typeof product.price === 'number' ? String(product.price) : String(product.price || '').replace(/[^0-9]/g, '')) || "0",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: partner.name },
    },
    ...(product.sizes?.length && { size: product.sizes }),
    ...(product.colors?.length && {
      color: product.colors.map((c: any) => c.label || c.value).join(", "),
    }),
  }
}

export default async function ProductLayout({ children, params }: Props) {
  const { brand, product: productSlug } = await params
  const result = getProductById(brand, productSlug)

  return (
    <>
      {result && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildProductSchema(result.product, result.partner, brand, productSlug)),
          }}
        />
      )}
      {children}
    </>
  )
}
