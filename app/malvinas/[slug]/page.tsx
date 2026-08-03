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
import { MALVINAS_PRODUCTS, getMalvinasProduct } from "@/lib/malvinas-products"
import MalvinasProductClient from "./MalvinasProductClient"

const BASE_URL = "https://www.novamente.ar"

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

  return <MalvinasProductClient product={product} />
}
