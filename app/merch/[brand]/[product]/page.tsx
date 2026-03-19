import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductById, getPartnerById } from "@/src/data/partners"
import { getTenantBySlug } from "@/lib/partners/tenant"
import { getProductBySlug } from "@/lib/partners/catalog"
import { dbProductToProduct } from "@/lib/partners/product-metadata"
import { ProductDetail } from "./ProductDetail"

interface ProductPageProps {
  params: Promise<{ brand: string; product: string }>
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
    return (
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
    )
  }

  // Try DB
  const tenant = await getTenantBySlug(brand)
  if (tenant) {
    const dbProduct = await getProductBySlug(tenant.id, productSlug)
    if (dbProduct) {
      const product = dbProductToProduct(dbProduct, tenant)
      return (
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
        />
      )
    }
  }

  notFound()
}
