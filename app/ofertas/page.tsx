import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Flame, Clock, MessageCircle } from "lucide-react"
import { getActiveOffers, formatARS, getDiscountPercent, type Offer } from "@/lib/offers"

export const revalidate = 1800 // ISR: 30 min

export const metadata: Metadata = {
  title: "Ofertas y promociones — Novamente",
  description:
    "Mirá las promos vigentes de Novamente: remeras, buzos y hoodies personalizados con IA y estampado DTG premium. Descuentos activos y stock limitado cuando hay campaña en curso.",
  alternates: { canonical: "https://www.novamente.ar/ofertas" },
  openGraph: {
    title: "Ofertas y promociones — Novamente",
    description: "Promos vigentes en remeras, buzos y hoodies personalizados con IA y estampado DTG premium.",
    url: "https://www.novamente.ar/ofertas",
    type: "website",
    images: ["https://www.novamente.ar/novamente-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ofertas y promociones — Novamente",
    description: "Promos vigentes en remeras, buzos y hoodies personalizados con IA y estampado DTG premium.",
  },
}

const baseUrl = "https://www.novamente.ar"

function buildOffersSchema(offers: Offer[]) {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${baseUrl}/ofertas#webpage`,
    name: "Ofertas y promociones — Novamente",
    description:
      "Promos vigentes en remeras, buzos y hoodies personalizados con IA y estampado DTG premium.",
    url: `${baseUrl}/ofertas`,
    isPartOf: { "@id": `${baseUrl}/#website` },
    about: { "@id": `${baseUrl}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: offers.length,
      itemListElement: offers.map((o, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          "@id": `${o.url}#product`,
          name: o.name,
          description: o.shortDescription || o.name,
          image: `${baseUrl}${o.image}`,
          url: o.url,
          brand: { "@type": "Brand", name: "Novamente" },
          offers: {
            "@type": "Offer",
            priceCurrency: "ARS",
            price: o.priceCurrent,
            priceValidUntil: o.endsAt.slice(0, 10),
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            url: o.url,
          },
        },
      })),
    },
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${baseUrl}/` },
      { "@type": "ListItem", position: 2, name: "Ofertas", item: `${baseUrl}/ofertas` },
    ],
  }

  return { itemList, breadcrumb }
}

export default function OfertasPage() {
  const offers = getActiveOffers()

  if (offers.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 md:py-32 text-center">
        <Badge className="mb-4 bg-zinc-500/15 text-zinc-400 border-zinc-500/40 text-xs tracking-widest uppercase">
          <Clock className="w-3 h-3 mr-1.5" />
          Sin ofertas activas
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          No hay ofertas activas
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed mb-8">
          Por ahora no hay promociones vigentes. Pronto vamos a tener nuevas ofertas — mientras
          tanto podés ver todo nuestro catálogo.
        </p>
        <Link href="/">
          <Button size="lg" variant="outline">
            Volver al inicio
          </Button>
        </Link>
      </div>
    )
  }

  const { itemList, breadcrumb } = buildOffersSchema(offers)
  const endsAt = offers[0]?.endsAt
  const endDate = endsAt ? new Date(endsAt) : null

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* Header */}
      <header className="text-center mb-12 md:mb-16">
        <Badge className="mb-4 bg-orange-500/15 text-orange-400 border-orange-500/40 text-xs tracking-widest uppercase hover:bg-orange-500/20">
          <Flame className="w-3 h-3 mr-1.5" />
          Promo activa
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" data-speakable>
          Ofertas y promociones
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed" data-speakable>
          {offers.length} {offers.length === 1 ? "remera oversize con descuento" : "remeras oversize con descuento"}.
          Diseños exclusivos, estampado DTG premium y stock limitado. Envíos a todo el país.
        </p>
        {endDate && (
          <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-sm text-orange-300">
            <Clock className="w-4 h-4" />
            <span>
              Termina el{" "}
              {endDate.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </header>

      {/* Grid de ofertas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {offers.map((offer, i) => {
          const discount = getDiscountPercent(offer)
          return (
            <article
              key={offer.slug}
              className="group rounded-2xl border border-border/40 bg-card/50 hover:border-orange-500/40 hover:bg-card transition-all overflow-hidden flex flex-col"
            >
              <a href={offer.url} target="_blank" rel="noopener" className="block relative aspect-square overflow-hidden bg-zinc-900">
                <Image
                  src={offer.image}
                  alt={offer.alt}
                  fill
                  priority={i < 3}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <Badge className="bg-orange-500 text-white text-xs tracking-widest uppercase border-0">
                    <Flame className="w-3 h-3 mr-1" />
                    {discount}% OFF
                  </Badge>
                  {offer.badge && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-black/60 backdrop-blur border-white/20">
                      {offer.badge}
                    </Badge>
                  )}
                </div>
              </a>

              <div className="p-5 flex flex-col flex-1">
                <h2 className="font-semibold text-lg leading-tight mb-1">
                  <a href={offer.url} target="_blank" rel="noopener" className="hover:text-orange-400 transition-colors">
                    {offer.name}
                  </a>
                </h2>
                {offer.shortDescription && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{offer.shortDescription}</p>
                )}

                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl font-bold text-orange-400">{formatARS(offer.priceCurrent)}</span>
                  <span className="text-sm text-muted-foreground line-through">{formatARS(offer.priceOriginal)}</span>
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                  <a href={offer.url} target="_blank" rel="noopener">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0">
                      Ver producto
                    </Button>
                  </a>
                  <a
                    href={`https://wa.me/5492235169720?text=${encodeURIComponent(
                      `Hola! Vi la oferta Hot Sale de "${offer.name}" a ${formatARS(offer.priceCurrent)}. Quiero comprarla.`
                    )}`}
                    target="_blank"
                    rel="noopener"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                      Pedir por WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* CTA al final */}
      <section className="mt-16 md:mt-20 text-center max-w-2xl mx-auto">
        <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/5 p-8 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">¿Querés diseñar tu propia prenda?</h2>
          <p className="text-muted-foreground mb-6">
            Más allá de las ofertas, podés crear tu diseño único con IA. Generá la estampa, elegí la prenda y la
            producimos bajo demanda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/crear">
              <Button size="lg">Diseñar con IA</Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline">
                Ver catálogo completo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
