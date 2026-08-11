/**
 * /malvinas/[slug] — Página de PRODUCTO COMPRABLE de la Serie Malvinas.
 *
 * Estática (sin DB): la data vive en lib/malvinas-products.ts. La UI de
 * compra (color/talle/cantidad → carrito → checkout) la maneja
 * MalvinasProductClient, que reusa exactamente el mismo useCart + /checkout
 * (MercadoPago) que el resto del sitio — mismo patrón que
 * app/drops/[id]/DropClient.tsx. No se toca el motor de pagos.
 */
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MALVINAS_PRODUCTS, getMalvinasProduct, type MalvinasProduct } from "@/lib/malvinas-products"
import { shippingDetailsJsonLd, RETURN_POLICY_REF } from "@/lib/shipping-config"
import MalvinasProductClient from "./MalvinasProductClient"

const BASE_URL = "https://www.novamente.ar"

/**
 * Product JSON-LD — mismo patron que app/products/[id]/page.tsx. Precio
 * SIEMPRE el de product.price / product.sizeOptions (derivados de
 * lib/catalog.ts en lib/malvinas-products.ts), nunca hardcodeado aca.
 */
function buildOffers(product: MalvinasProduct) {
  const url = `${BASE_URL}/malvinas/${product.slug}`
  const base = {
    "@type": "Offer" as const,
    url,
    priceCurrency: "ARS",
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": `${BASE_URL}/#organization` },
    shippingDetails: shippingDetailsJsonLd(),
    hasMerchantReturnPolicy: RETURN_POLICY_REF,
  }
  if (product.sizeOptions && product.sizeOptions.length > 0) {
    return product.sizeOptions.map((opt) => ({ ...base, name: opt.size, price: opt.price }))
  }
  return { ...base, price: product.price }
}

function buildProductJsonLd(product: MalvinasProduct) {
  const images = product.colors.map((c) => `${BASE_URL}${c.image}`)
  if (product.lifestyle) images.unshift(`${BASE_URL}${product.lifestyle}`)
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.name} — Serie Malvinas`,
    description: `${product.garmentLabel} · ${product.blurb} Estampado DTG, diseñada y producida en Argentina.`,
    image: images,
    brand: { "@type": "Brand", name: "Novamente" },
    category: product.collection,
    offers: buildOffers(product),
  }
}

export async function generateStaticParams() {
  return MALVINAS_PRODUCTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const product = getMalvinasProduct(slug)
  if (!product) return { title: "Producto no encontrado · Novamente" }

  const title = `${product.name} — Serie Malvinas | Novamente`
  const description = `${product.name} · ${product.garmentLabel} · $${product.price.toLocaleString("es-AR")}. ${product.blurb} Estampado DTG, diseñada y producida en Argentina.`
  const image = product.lifestyle ?? product.colors[0]?.image ?? ""
  const url = `${BASE_URL}/malvinas/${product.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Novamente",
      locale: "es_AR",
      type: "website",
      images: image ? [{ url: `${BASE_URL}${image}`, width: 1080, height: 1350 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [`${BASE_URL}${image}`] : [],
    },
  }
}

export default async function MalvinasProductPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const product = getMalvinasProduct(slug)
  if (!product) notFound()

  const productJsonLd = buildProductJsonLd(product)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <MalvinasProductClient product={product} />
    </>
  )
}
