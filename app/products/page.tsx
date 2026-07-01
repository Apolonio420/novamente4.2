export const revalidate = 3600 // ISR: revalidate every hour

import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PRODUCTS, parsePrice } from "@/lib/products"
import ProductsFilter from "@/components/ProductsFilter"

export const metadata: Metadata = {
  title: "Catálogo de Productos — Remeras, Hoodies y Buzos personalizados",
  description:
    "Explorá el catálogo completo de Novamente: hoodies oversize desde $55.000, remeras desde $28.600, buzos crewneck, musculosas y lienzos. Algodón 100% premium con estampado DTG. Todos personalizables con diseño de IA.",
  openGraph: {
    title: "Productos Novamente — Ropa personalizada con IA",
    description: "Hoodies, remeras, buzos y más. Algodón 100% premium con estampado DTG personalizado con inteligencia artificial.",
    url: "https://www.novamente.ar/products",
  },
  twitter: {
    card: "summary_large_image",
    title: "Productos Novamente — Ropa personalizada con IA",
    description: "Hoodies, remeras, buzos y más. Algodón 100% premium con estampado DTG personalizado.",
  },
  alternates: { canonical: "https://www.novamente.ar/products" },
}

function generateProductsJsonLd() {
  const baseUrl = "https://www.novamente.ar"
  return PRODUCTS.filter(p => p.available).map((product) => {
    const numericPrice = parsePrice(product.price)
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: `${baseUrl}${product.images.main}`,
      brand: { "@type": "Brand", name: "Novamente" },
      category: product.category,
      color: product.color,
      material: "Algodón 100%",
      offers: {
        "@type": "Offer",
        url: `${baseUrl}/products#${product.id}`,
        priceCurrency: "ARS",
        price: numericPrice,
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        priceValidUntil: "2026-12-31",
        seller: { "@id": "https://www.novamente.ar/#organization" },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "AR" },
          shippingRate: { "@type": "MonetaryAmount", currency: "ARS", value: "5500" },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
            transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 7, unitCode: "DAY" },
          },
        },
        hasMerchantReturnPolicy: { "@id": "https://www.novamente.ar/#return-policy" },
      },
    }
  })
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.novamente.ar/" },
    { "@type": "ListItem", position: 2, name: "Productos", item: "https://www.novamente.ar/products" },
  ],
}

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://www.novamente.ar/products#webpage",
  name: "Catálogo de Productos — Novamente",
  description: "Catálogo completo de ropa personalizada con IA: hoodies, remeras, buzos, musculosas y lienzos. Algodón 100% premium con estampado DTG.",
  url: "https://www.novamente.ar/products",
  isPartOf: { "@id": "https://www.novamente.ar/#website" },
  about: { "@id": "https://www.novamente.ar/#organization" },
  speakable: {
    "@type": "SpeakableSpecification",
    cssSelector: ["h1", "[data-speakable]"],
  },
}

export default function ProductsPage() {
  const productsJsonLd = generateProductsJsonLd()

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />

      <div className="text-center mb-8">
        <h1 className="novamente-heading text-4xl md:text-5xl mb-4">CATÁLOGO DE PRODUCTOS</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto text-lg" data-speakable>
          Descubrí nuestra colección de prendas premium. Cada producto está diseñado para ser el canvas perfecto para
          tus creaciones con IA. Calidad superior, fit moderno y la base ideal para tu estilo único.
        </p>
      </div>

      <ProductsFilter products={PRODUCTS} />

      {/* Bottom CTA */}
      <div className="mt-16 text-center">
        <div className="bg-gradient-to-br from-primary/5 to-purple-600/5 rounded-xl p-8 border border-primary/10">
          <h3 className="novamente-heading text-2xl mb-4">¡CATÁLOGO COMPLETO!</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Nuestro catálogo está completo con todas las prendas y productos disponibles. Desde hoodies oversize hasta
            lienzos personalizados, tenés todo lo que necesitás para expresar tu creatividad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://www.instagram.com/novamente.ar/" target="_blank">
              <Button variant="outline" className="rounded-lg bg-transparent">
                Seguinos en Instagram
              </Button>
            </Link>
            <Link href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Estoy%20viendo%20el%20catalogo%20de%20productos%20y%20quiero%20mas%20info%20%2F%20cotizacion.%20(ref%20%C2%B7%20NV-CAT)" target="_blank">
              <Button className="rounded-lg">Consultá por WhatsApp</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
