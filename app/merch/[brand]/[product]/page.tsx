import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductById, getPartnerById } from "@/src/data/partners"
import { getTenantBySlug } from "@/lib/partners/tenant"
import { getProductBySlug } from "@/lib/partners/catalog"
import { dbProductToProduct } from "@/lib/partners/product-metadata"
import { ProductDetail } from "./ProductDetail"
import { ProductReviews } from "@/components/partners/product-reviews"
import type { Product } from "@/src/data/partners"

interface ProductPageProps {
  params: Promise<{ brand: string; product: string }>
}

function buildProductJsonLd(
  product: Product,
  brand: string,
  productSlug: string,
  brandName: string,
) {
  const url = `https://www.novamente.ar/merch/${brand}/${productSlug}`
  const images = product.colors
    .flatMap((c) => [c.images?.front, c.images?.back])
    .filter((s): s is string => Boolean(s))
    .map((src) => (src.startsWith("http") ? src : `https://www.novamente.ar${src.startsWith("/") ? "" : "/"}${src}`))

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: images.length > 0 ? images : undefined,
    sku: product.id,
    category: product.category,
    brand: { "@type": "Brand", name: brandName },
    offers: {
      "@type": "Offer",
      url,
      price: String(product.price),
      priceCurrency: "ARS",
      priceValidUntil: "2026-12-31",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": "https://www.novamente.ar/#organization" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "AR",
        },
        shippingRate: {
          "@type": "MonetaryAmount",
          currency: "ARS",
          value: "5500",
        },
      },
    },
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { brand, product: productSlug } = await params

  // Try static first
  const staticResult = getProductById(brand, productSlug)
  if (staticResult) {
    const { product, partner } = staticResult
    const title = `${product.name} — ${partner.name} en Novamente`
    return {
      title,
      description: product.description,
      openGraph: {
        type: 'website',
        title,
        description: product.description,
        images: product.colors[0]?.images?.front
          ? [{ url: product.colors[0].images.front, width: 800, height: 800, alt: product.name }]
          : undefined,
        siteName: 'Novamente',
        locale: 'es_AR',
      },
      alternates: {
        canonical: `https://www.novamente.ar/merch/${brand}/${productSlug}`,
      },
    }
  }

  // Try DB
  const tenant = await getTenantBySlug(brand)
  if (tenant) {
    const dbProduct = await getProductBySlug(tenant.id, productSlug)
    if (dbProduct) {
      const converted = dbProductToProduct(dbProduct, tenant)
      const title = `${converted.name} — ${tenant.name} en Novamente`
      return {
        title,
        description: converted.description,
        openGraph: {
          type: 'website',
          title,
          description: converted.description,
          images: converted.colors[0]?.images?.front
            ? [{ url: converted.colors[0].images.front, width: 800, height: 800, alt: converted.name }]
            : undefined,
          siteName: 'Novamente',
          locale: 'es_AR',
        },
        alternates: {
          canonical: `https://www.novamente.ar/merch/${brand}/${productSlug}`,
        },
      }
    }
  }

  return { title: 'Producto no encontrado' }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { brand, product: productSlug } = await params

  // Try static first (fast, in-memory)
  const staticResult = getProductById(brand, productSlug)
  if (staticResult) {
    const productJsonLd = buildProductJsonLd(
      staticResult.product,
      brand,
      productSlug,
      staticResult.partner.name,
    )
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <ProductDetail
          product={staticResult.product}
          partner={{
            id: staticResult.partner.id,
            name: staticResult.partner.name,
            description: staticResult.partner.description,
            mission: staticResult.partner.mission,
            banner: staticResult.partner.banner,
          }}
          brandSlug={brand}
        />
      </>
    )
  }

  // Try DB
  const tenant = await getTenantBySlug(brand)
  if (tenant) {
    const dbProduct = await getProductBySlug(tenant.id, productSlug)
    if (dbProduct) {
      const product = dbProductToProduct(dbProduct, tenant)
      const productJsonLd = buildProductJsonLd(product, brand, productSlug, tenant.name)
      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
          />
          <ProductDetail
            product={product}
            partner={{
              id: tenant.slug,
              name: tenant.name,
              description: tenant.description || '',
              mission: tenant.tagline || '',
              banner: tenant.banner_url || '',
            }}
            brandSlug={brand}
            tenantId={tenant.id}
            brandLogo={tenant.logo_url}
            brandColor={tenant.primary_color}
          />
          <div className="container mx-auto px-4 pb-12">
            <ProductReviews tenantSlug={brand} productId={dbProduct.id} />
          </div>
        </>
      )
    }
  }

  notFound()
}
