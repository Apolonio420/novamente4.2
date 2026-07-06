// @ts-nocheck
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { ImageHistory } from "@/components/ImageHistory"

const StyleGallery = dynamic(() => import("@/components/StyleGallery").then(m => m.StyleGallery), {
  loading: () => <div className="h-96 animate-pulse bg-zinc-900 rounded-2xl" />,
})
const CrearLauncher = dynamic(() => import("@/components/CrearLauncher").then(m => m.CrearLauncher), {
  loading: () => <div className="h-[340px] animate-pulse bg-zinc-900 rounded-2xl" />,
})
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Zap, Shirt, Star, Sparkles, Palette, Wand2, Quote, Users, TrendingUp, ShieldCheck, Globe, Store, Eye, Flame } from "lucide-react"
import { getActiveOffers, formatARS, getDiscountPercent } from "@/lib/offers"
import Link from "next/link"
import Image from "next/image"
// Image history now fetches via /api/images/history (session-based)
import { ScrollButton } from "@/components/scroll-button"
import { INTERNAL_LINKS } from "@/lib/config/links"

export const metadata = {
  title: "Novamente — Diseñá tu ropa personalizada con inteligencia artificial",
  description: "Novamente es la primera marca argentina de indumentaria personalizada con IA. Elegí entre 37 estilos artísticos, diseñá tu remera, hoodie o buzo en minutos con estampado DTG premium. Más de 1.200 diseños creados y envíos a todo el país.",
  openGraph: {
    title: "Novamente — Ropa personalizada con IA en Argentina",
    description: "Diseñá tu prenda única en minutos. 37 estilos artísticos, estampado DTG premium, hoodies desde $55.000 y remeras desde $28.600. Envíos a todo el país.",
    url: "https://www.novamente.ar/",
    images: [{ url: "https://www.novamente.ar/novamente-logo.png", width: 1200, height: 630, alt: "Novamente — Ropa personalizada con inteligencia artificial" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Novamente — Ropa personalizada con IA en Argentina",
    description: "Diseñá tu prenda única en minutos. 37 estilos artísticos, estampado DTG premium. Envíos a todo el país.",
    images: ["https://www.novamente.ar/novamente-logo.png"],
  },
  alternates: { canonical: "https://www.novamente.ar/" },
}

export default function Home() {
  // Ofertas activas — respeta startsAt/endsAt definido en lib/offers.ts.
  // Si no hay activas, la seccion completa de Hot Sale no se renderiza.
  const activeOffers = getActiveOffers()

  // MerchantReturnPolicy JSON-LD
  const returnPolicyJsonLd = {
    "@context": "https://schema.org",
    "@type": "MerchantReturnPolicy",
    "@id": "https://www.novamente.ar/#return-policy",
    name: "Politica de devoluciones Novamente",
    applicableCountry: "AR",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 10,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
  }

  // HowTo JSON-LD for design process
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Cómo diseñar tu ropa personalizada con IA en Novamente",
    description: "Creá tu prenda personalizada en 3 simples pasos usando inteligencia artificial. Sin conocimientos de diseño necesarios.",
    totalTime: "PT5M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "ARS",
      value: "28600",
    },
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Describí tu idea",
        text: "Contanos qué querés en tu diseño. Podés elegir entre 37 estilos artísticos diferentes como watercolor, pixel art, street art, anime y más. La IA interpreta tu descripción y genera un diseño único.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "La IA genera tu diseño",
        text: "Nuestra inteligencia artificial Nano Banana 2 crea un diseño vectorial único optimizado para estampado textil. El proceso toma menos de 30 segundos.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Elegí tu prenda y comprá",
        text: "Seleccioná entre hoodies oversize, remeras, buzos crewneck, musculosas o lienzos. Elegí color y talle, y recibí tu prenda con estampado DTG de alta calidad en tu domicilio.",
      },
    ],
    tool: [
      { "@type": "HowToTool", name: "Navegador web o celular" },
    ],
  }

  // FAQ JSON-LD for homepage
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Qué es Novamente?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Novamente es la primera marca argentina de indumentaria personalizada con inteligencia artificial. Permite diseñar remeras, hoodies, buzos y más usando 37 estilos artísticos generados por IA, con estampado DTG premium y envíos a todo el país.",
        },
      },
      {
        "@type": "Question",
        name: "¿Cuánto cuesta una remera personalizada?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Las remeras personalizadas arrancan desde $28.600 ARS para el modelo Aldea Classic Fit y $31.000 ARS para la Aura Oversize. Los hoodies comienzan en $55.000 ARS y el Buzo Hoodie Oversize está en $55.000 ARS. Todos incluyen el diseño personalizado con IA y estampado DTG.",
        },
      },
      {
        "@type": "Question",
        name: "¿Cómo funciona el diseño con IA?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Describís tu idea en texto, elegís uno de los 37 estilos artísticos disponibles (como watercolor, pixel art, anime, street art) y nuestra IA Nano Banana 2 genera un diseño vectorial optimizado para estampado textil en menos de 30 segundos. No necesitás conocimientos de diseño.",
        },
      },
      {
        "@type": "Question",
        name: "¿Hacen envíos a todo el país?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí, realizamos envíos a toda la Argentina. AMBA $5.500, Interior de Buenos Aires $7.000 y resto del país $9.000. Despachamos desde Villa Martelli, Buenos Aires.",
        },
      },
      {
        "@type": "Question",
        name: "¿Qué es el estampado DTG?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DTG (Direct to Garment) es la tecnología de impresión textil más avanzada. Imprime directamente sobre la fibra de algodón, logrando colores vibrantes, alta definición y durabilidad excepcional. Todas nuestras prendas usan algodón 100% optimizado para DTG.",
        },
      },
    ],
  }

  // Speakable schema for AI voice assistants
  const speakableJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://www.novamente.ar/#webpage",
    name: "Novamente — Ropa personalizada con IA en Argentina",
    description: "La primera marca argentina de indumentaria personalizada con inteligencia artificial. 37 estilos artísticos, estampado DTG premium, envíos a todo el país.",
    url: "https://www.novamente.ar/",
    isPartOf: { "@id": "https://www.novamente.ar/#website" },
    about: { "@id": "https://www.novamente.ar/#organization" },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: "https://www.novamente.ar/marketing/lifestyle/hero-otono-streetwear.webp",
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".novamente-heading", "[data-speakable]"],
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.novamente.ar/" },
      ],
    },
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(returnPolicyJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableJsonLd) }}
      />

      {/* Hero Section con estética de Novamente */}
      <section className="relative overflow-hidden bg-[#08080b] px-4 py-16 md:py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-white/10"></div>
        <div className="container relative z-10 mx-auto grid min-h-[calc(100vh-96px)] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl text-left">
            <p className="mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-cyan-200">
              IA + DTG + producción local
            </p>
            <h1 className="mb-8 text-4xl font-semibold leading-[1.03] tracking-tight text-white sm:text-6xl md:text-7xl">
              <span>Ropa personalizada con IA, hecha en Argentina.</span>
            <span className="sr-only"> — Novamente, indumentaria personalizada con inteligencia artificial en Argentina</span>
          </h1>
          <p data-speakable="true" className="text-lg md:text-xl text-white/70 max-w-2xl mb-10">
            Diseñás una estampa con inteligencia artificial, elegís la prenda y la producimos bajo demanda con
            estampado DTG premium. Desde 1 unidad o para marcas que quieren vender sin stock.
          </p>

          {/* CTA principal único */}
          <div className="mb-6 flex justify-start">
            <ScrollButton className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-zinc-950 transition hover:bg-zinc-100">
              <Zap className="h-5 w-5" />
              Diseñar mi prenda
            </ScrollButton>
          </div>

          {/* CTAs secundarios diferenciados por intención (SEO link equity) */}
          <div className="mb-8 flex flex-wrap justify-start gap-2 text-xs">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 font-medium text-white/80 transition hover:border-white/50 hover:text-white"
            >
              <Shirt className="h-4 w-4" />
              Ver productos
            </Link>
            <Link
              href="/partners"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 font-medium text-white/80 transition hover:border-white/50 hover:text-white"
            >
              <Store className="h-4 w-4" />
              Producción para mi marca
            </Link>
            <Link
              href="/merchs"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 font-medium text-white/80 transition hover:border-white/50 hover:text-white"
            >
              <Sparkles className="h-4 w-4" />
              Merch para vender
            </Link>
            <Link
              href="/regalos-personalizados"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 font-medium text-white/80 transition hover:border-white/50 hover:text-white"
            >
              <Sparkles className="h-4 w-4" />
              Regalos personalizados
            </Link>
          </div>

          {/* Resumen de oferta — 3 chips concretos sin tono defensivo */}
          <div className="mb-8 flex flex-wrap gap-3 text-xs text-zinc-300">
            <span className="rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
              Remeras, hoodies, buzos, musculosas
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
              Estampado DTG premium
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
              Producción on-demand · sin stock muerto
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
              Envíos a todo el país
            </span>
          </div>

          <div className="flex flex-wrap justify-start gap-8 pt-4">
            <div>
              <div className="text-lg font-bold text-white">1.2K+</div>
              <div className="text-sm text-white/60">Diseños creados</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">95+</div>
              <div className="text-sm text-white/60">Clientes satisfechos</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-white">
                4.8 <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="text-sm text-white/60">Rating promedio</div>
            </div>
          </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] border border-white/10 bg-white/[0.03]" />
            <div className="relative grid gap-4">
              {/* Hero principal: lifestyle real argentino, persona usando la prenda con estampa generada por el bot */}
              <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                <div className="relative aspect-[4/5] sm:aspect-[4/3]">
                  <Image
                    src="/marketing/lifestyle/hero-otono-streetwear.webp"
                    alt="Hoodie gris Novamente con estampa otoño generada con IA, look streetwear argentino"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                </div>
              </div>
              {/* Mini-carrusel de 3 escenas argentinas con prenda Novamente */}
              <div className="grid grid-cols-3 gap-3">
                <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
                  <div className="relative aspect-square">
                    <Image
                      src="/marketing/lifestyle/hero-merch-personalizado.webp"
                      alt="Hoodie crema Novamente en azotea San Telmo blue hour"
                      fill
                      priority
                      fetchPriority="high"
                      className="object-cover"
                      sizes="(max-width: 1024px) 33vw, 15vw"
                    />
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
                  <div className="relative aspect-square">
                    <Image
                      src="/marketing/lifestyle/home-carousel-1.webp"
                      alt="Remera oversize negra Novamente con estampa streetwear urbano argentino"
                      fill
                      priority
                      fetchPriority="high"
                      className="object-cover"
                      sizes="(max-width: 1024px) 33vw, 15vw"
                    />
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
                  <div className="relative aspect-square">
                    <Image
                      src="/marketing/lifestyle/home-carousel-2.webp"
                      alt="Hoodie negro Novamente con diseño impreso DTG premium"
                      fill
                      priority
                      fetchPriority="high"
                      className="object-cover"
                      sizes="(max-width: 1024px) 33vw, 15vw"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                  <div className="relative aspect-square">
                    <Image
                      src="/marketing/lifestyle/hero-azotea-blue-hour.webp"
                      alt="Hoodie crema con estampa de fútbol Novamente"
                      fill
                      priority
                      fetchPriority="high"
                      className="object-cover"
                      sizes="(max-width: 1024px) 50vw, 22vw"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-zinc-950 p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-semibold text-white">4.8</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                      95 clientes que ya usan su prenda Novamente.
                      1.200 diseños generados con IA.
                    </p>
                  </div>
                  <Link
                    href="/marcas"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    Ver marcas que producen con nosotros →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hot Sale — ofertas activas. Si no hay campania vigente, la seccion no aparece. */}
      {activeOffers.length > 0 && (
      <section className="py-16 md:py-20 border-t border-orange-500/20 bg-gradient-to-b from-orange-500/[0.04] via-transparent to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-orange-500/15 text-orange-400 border-orange-500/40 text-xs tracking-widest uppercase hover:bg-orange-500/20">
              <Flame className="w-3 h-3 mr-1.5" />
              Hot Sale
            </Badge>
            <h2 className="novamente-heading text-3xl md:text-4xl mb-3">OFERTAS DE LA SEMANA</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
              {activeOffers.length} {activeOffers.length === 1 ? "oferta" : "ofertas"} con descuento — stock limitado.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5 mb-8">
            {activeOffers.map((offer, i) => {
              const discount = getDiscountPercent(offer)
              return (
                <a
                  key={offer.slug}
                  href={offer.url}
                  target="_blank"
                  rel="noopener"
                  className="group rounded-xl border border-border/40 bg-card/50 hover:border-orange-500/40 hover:bg-card transition-all overflow-hidden"
                >
                  <div className="relative aspect-square overflow-hidden bg-zinc-900">
                    <Image
                      src={offer.image}
                      alt={offer.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-orange-500 text-white text-[10px] tracking-widest uppercase border-0">
                        <Flame className="w-2.5 h-2.5 mr-1" />
                        {discount}% OFF
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-xs md:text-sm leading-tight line-clamp-2 mb-1.5">{offer.name}</h3>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-base md:text-lg font-bold text-orange-400">{formatARS(offer.priceCurrent)}</span>
                      <span className="text-[11px] md:text-xs text-muted-foreground line-through">
                        {formatARS(offer.priceOriginal)}
                      </span>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>

          <div className="text-center">
            <Link href="/ofertas">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0">
                Ver todas las ofertas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* Cómo Funciona - de v88 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">¿CÓMO FUNCIONA?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Tres pasos simples para crear tu prenda personalizada con inteligencia artificial
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Palette className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">1. Describí tu idea</h3>
                <p className="text-muted-foreground">
                  Contanos qué querés en tu diseño. Podés ser tan específico o creativo como quieras.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wand2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">2. IA genera tu diseño</h3>
                <p className="text-muted-foreground">
                  Nuestra inteligencia artificial crea un diseño único basado en tu descripción.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shirt className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">3. Elegí tu prenda</h3>
                <p className="text-muted-foreground">
                  Seleccioná el producto que más te guste y personalizá la posición de tu diseño.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Generador de Diseños — launcher hacia /crear (el flujo completo vive ahí) */}
      <section id="generator-section" className="scroll-mt-24 py-8 md:py-10">
        <div className="container mx-auto">
          <CrearLauncher />
        </div>
      </section>

      {/* Diseños Recientes - con scroll al generador */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="mb-12">
            <h2 className="novamente-heading text-3xl">TUS DISEÑOS RECIENTES</h2>
          </div>
          <Suspense fallback={<div className="h-64 w-full bg-muted/30 animate-pulse rounded-lg"></div>}>
            <ImageHistory images={[]} />
          </Suspense>
        </div>
      </section>

      {/* Explorar Estilos - LIMITADO A 4 IMÁGENES */}
      <section className="py-16 md:py-24 bg-secondary/20 cv-auto">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">EXPLORÁ NUESTROS ESTILOS</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Descubrí una variedad de estilos artísticos diseñados para inspirar tus creaciones
            </p>
          </div>

          <StyleGallery limit={6} simplified={true} directToCustomization={true} />

          <div className="text-center mt-12">
            <Link href="/styles">
              <Button size="lg" variant="outline">
                Ver Más Estilos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Productos Preview - botones van a /design */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">PRODUCTOS PREMIUM</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Prendas de alta calidad, perfectas para tus diseños personalizados
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Hoodie Preview */}
            <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
              <Link href={INTERNAL_LINKS.generator} className="block">
                <div className="aspect-square relative overflow-hidden cursor-pointer">
                  <Image
                    src="/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png"
                    alt="Buzo Hoodie Oversize"
                    fill
                    priority
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />

                  {/* Overlay sutil al hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                        <Palette className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Badge de disponibilidad */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-500 text-white">Disponible</Badge>
                  </div>

                  {/* Badge de categoría */}
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm border-primary text-primary font-medium"
                    >
                      Hoodies
                    </Badge>
                  </div>
                </div>
              </Link>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold leading-tight">Buzo Hoodie Oversize</h2>
                  <span className="text-2xl font-bold text-primary ml-4">$55.500</span>
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  Buzo oversize premium en algodón 100%, ideal para estampados DTG de alta calidad.
                </p>

                {/* Botón personalizar - va a #generator-section */}
                <div className="flex gap-2">
                  <Link href={INTERNAL_LINKS.generator} className="flex-1" data-cta="product-card-hoodie">
                    <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium rounded-xl py-3 px-6 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Personalizar Ahora
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* T-Shirt Preview */}
            <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
              <Link href={INTERNAL_LINKS.generator} className="block">
                <div className="aspect-square relative overflow-hidden cursor-pointer">
                  <Image
                    src="/products/aura-tshirt-blanco-front.jpeg"
                    alt="Aura Oversize T-Shirt"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />

                  {/* Overlay sutil al hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                        <Palette className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Badge de disponibilidad */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-500 text-white">Disponible</Badge>
                  </div>

                  {/* Badge de categoría */}
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm border-primary text-primary font-medium"
                    >
                      T-Shirts
                    </Badge>
                  </div>
                </div>
              </Link>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold leading-tight">Aura Oversize T-Shirt</h2>
                  <span className="text-2xl font-bold text-primary ml-4">$37.000</span>
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  Remera oversize en algodón peinado, base perfecta para diseños vibrantes.
                </p>

                {/* Botón personalizar - va a #generator-section */}
                <div className="flex gap-2">
                  <Link href={INTERNAL_LINKS.generator} className="flex-1" data-cta="product-card-tshirt">
                    <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium rounded-xl py-3 px-6 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Personalizar Ahora
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Canvas Preview */}
            <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
              <Link href={INTERNAL_LINKS.generator} className="block">
                <div className="aspect-square relative overflow-hidden cursor-pointer">
                  <Image
                    src="/products/lienzo-main.png"
                    alt="Lienzo Premium"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />

                  {/* Overlay sutil al hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                        <Palette className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Badge de disponibilidad */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-500 text-white">Disponible</Badge>
                  </div>

                  {/* Badge de categoría */}
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm border-primary text-primary font-medium"
                    >
                      Arte
                    </Badge>
                  </div>
                </div>
              </Link>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold leading-tight">Lienzo Premium</h2>
                  <span className="text-2xl font-bold text-primary ml-4">$59.900</span>
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  Obra impresa en lienzo textil, perfecta para decorar con tu arte personalizado.
                </p>

                {/* Botón personalizar - va a #generator-section */}
                <div className="flex gap-2">
                  <Link href={INTERNAL_LINKS.generator} className="flex-1" data-cta="product-card-lienzo">
                    <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium rounded-xl py-3 px-6 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Personalizar Ahora
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg">
                Ver Catálogo Completo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-white/10 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20">
                NOVAMENTE STUDIO
              </Badge>
              <h2 className="novamente-heading text-3xl md:text-4xl mb-4">Si tenés una marca o negocio, esta parte es para vos</h2>
              <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
                Además de la experiencia de merch para consumidores, en Novamente Studio armamos storefronts,
                catálogos, identidad visual, diseño con IA y una presencia digital más seria para marcas,
                creadores y negocios que quieren vender mejor.
              </p>
              <p className="text-sm text-muted-foreground/80 max-w-3xl mx-auto mt-4">
                Plan <span className="text-foreground font-medium">Starter gratis</span>, plan{" "}
                <span className="text-foreground font-medium">Growth a USD$50/mes</span>{" "}
                <span className="text-amber-500 font-semibold">(50% OFF el primer año para los primeros 100 partners → USD$25/mes)</span>{" "}
                con prendas al costo, y plan{" "}
                <span className="text-foreground font-medium">Pro a USD$100/mes</span> con chatbot
                WhatsApp/Instagram y automatización de contenido.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <Card className="border-white/10 bg-secondary/20">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-5">
                    <Globe className="w-6 h-6 text-purple-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Storefront y presencia digital</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Una base profesional para mostrar productos, captar consultas y ordenar mejor tu canal comercial.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-secondary/20">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-5">
                    <Store className="w-6 h-6 text-purple-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Catálogo, merch y activación</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Desde una línea de merch hasta una propuesta comercial más completa, todo con una estética consistente.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-secondary/20">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-5">
                    <Eye className="w-6 h-6 text-purple-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Demos y previews antes de publicar</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Mostramos una versión clara de cómo se va a ver tu marca para acelerar decisiones y bajar fricción.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/studio/planes">
                <Button size="lg" className="w-full sm:w-auto">
                  Ver planes y precios
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/lanza-tu-marca">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Lanzá tu marca gratis
                </Button>
              </Link>
              <Link href="/marcas">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                  Ver marcas que ya venden
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 md:py-24 cv-auto">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">LO QUE DICEN NUESTROS CLIENTES</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Más de 1.200 diseños creados por clientes de toda Argentina
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center p-6 rounded-2xl bg-secondary/30 border border-white/5">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">1.200+</div>
              <div className="text-sm text-muted-foreground">Diseños creados con IA</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-secondary/30 border border-white/5">
              <Users className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">95+</div>
              <div className="text-sm text-muted-foreground">Clientes satisfechos</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-secondary/30 border border-white/5">
              <Star className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">4.8/5</div>
              <div className="text-sm text-muted-foreground">Rating promedio</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-secondary/30 border border-white/5">
              <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">37</div>
              <div className="text-sm text-muted-foreground">Estilos artísticos</div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="relative border-white/10 bg-secondary/20">
              <CardContent className="p-8">
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 mb-6 leading-relaxed">
                  &ldquo;Increíble la calidad del estampado DTG. Pedí una remera con un diseño en watercolor y quedó exactamente como se veía en la preview. Ya hice 3 pedidos más.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">M</div>
                  <div>
                    <div className="font-semibold text-white text-sm">Martín G.</div>
                    <div className="text-xs text-muted-foreground">Buenos Aires — Buzo Hoodie Oversize</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative border-white/10 bg-secondary/20">
              <CardContent className="p-8">
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 mb-6 leading-relaxed">
                  &ldquo;Usé Novamente para hacer merch de mi marca. La IA me generó diseños que yo nunca podría haber hecho sola. El proceso es re fácil y el envío llegó en 5 días.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">S</div>
                  <div>
                    <div className="font-semibold text-white text-sm">Sofía R.</div>
                    <div className="text-xs text-muted-foreground">Córdoba — Studio B2B</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative border-white/10 bg-secondary/20">
              <CardContent className="p-8">
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/50 text-yellow-400/50"}`} />
                  ))}
                </div>
                <p className="text-white/80 mb-6 leading-relaxed">
                  &ldquo;Le regalé una remera personalizada a mi novia con un diseño en estilo anime. La calidad de la tela es buenísima y el estampado no se fue después de varios lavados.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">L</div>
                  <div>
                    <div className="font-semibold text-white text-sm">Lucas P.</div>
                    <div className="text-xs text-muted-foreground">Rosario — Remera Classic Fit</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span className="text-sm">Pago seguro con MercadoPago</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shirt className="w-5 h-5 text-primary" />
              <span className="text-sm">Algodón 100% premium</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-sm">Estampado DTG de alta calidad</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span className="text-sm">Envíos a todo el país</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section — alto impacto GEO */}
      <section className="py-16 md:py-24 bg-secondary/10 cv-auto">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">PREGUNTAS FRECUENTES</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Todo lo que necesitás saber sobre ropa personalizada con inteligencia artificial
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <details className="group border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-colors">
              <summary className="text-lg font-semibold cursor-pointer list-none flex justify-between items-center">
                ¿Qué es Novamente?
                <span className="text-primary group-open:rotate-45 transition-transform text-2xl">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Novamente es la primera marca argentina de indumentaria personalizada con inteligencia artificial. Permite diseñar remeras, hoodies, buzos y más usando 37 estilos artísticos generados por IA, con estampado DTG premium y envíos a todo el país. Más de 1.200 diseños creados por clientes satisfechos.
              </p>
            </details>

            <details className="group border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-colors">
              <summary className="text-lg font-semibold cursor-pointer list-none flex justify-between items-center">
                ¿Cuánto cuesta una remera personalizada?
                <span className="text-primary group-open:rotate-45 transition-transform text-2xl">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Las remeras personalizadas arrancan desde $28.600 ARS para el modelo Aldea Classic Fit y $31.000 ARS para la Aura Oversize. Los hoodies comienzan en $55.000 ARS. Todos los precios incluyen el diseño personalizado con IA y estampado DTG de alta calidad.
              </p>
            </details>

            <details className="group border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-colors">
              <summary className="text-lg font-semibold cursor-pointer list-none flex justify-between items-center">
                ¿Cómo funciona el diseño con IA?
                <span className="text-primary group-open:rotate-45 transition-transform text-2xl">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Es muy simple: describís tu idea en texto, elegís uno de los 37 estilos artísticos (watercolor, pixel art, anime, street art, y más) y nuestra IA genera un diseño vectorial optimizado para estampado textil en menos de 30 segundos. No necesitás conocimientos de diseño gráfico.
              </p>
            </details>

            <details className="group border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-colors">
              <summary className="text-lg font-semibold cursor-pointer list-none flex justify-between items-center">
                ¿Hacen envíos a todo el país?
                <span className="text-primary group-open:rotate-45 transition-transform text-2xl">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Sí, realizamos envíos a toda la Argentina. Los costos son: AMBA $5.500, Interior de Buenos Aires $7.000 y resto del país $9.000. Despachamos desde Villa Martelli, Buenos Aires. El tiempo de producción y envío es de 5 a 10 días hábiles.
              </p>
            </details>

            <details className="group border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-colors">
              <summary className="text-lg font-semibold cursor-pointer list-none flex justify-between items-center">
                ¿Qué es el estampado DTG y por qué es mejor?
                <span className="text-primary group-open:rotate-45 transition-transform text-2xl">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                DTG (Direct to Garment) es la tecnología de impresión textil más avanzada disponible. Imprime directamente sobre la fibra de algodón, logrando colores vibrantes, alta definición y durabilidad excepcional en cada lavado. A diferencia de la serigrafía o sublimación, el DTG permite diseños ilimitados en colores y detalles sin costos de setup. Todas nuestras prendas usan algodón 100% optimizado para esta tecnología.
              </p>
            </details>

            <details className="group border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-colors">
              <summary className="text-lg font-semibold cursor-pointer list-none flex justify-between items-center">
                ¿Puedo hacer pedidos mayoristas o para mi empresa?
                <span className="text-primary group-open:rotate-45 transition-transform text-2xl">+</span>
              </summary>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Sí, ofrecemos precios mayoristas y Novamente Studio para empresas, marcas y negocios que quieren lanzar su propia línea de merchandising o mejorar su presencia comercial. Incluye storefront personalizada, diseño con IA, producción y envío. Contactanos por WhatsApp o visitá la sección Studio para más información.
              </p>
            </details>
          </div>

          <div className="text-center mt-8">
            <Link href="/faq">
              <Button variant="outline" size="lg">
                Ver todas las preguntas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - de v88 */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="novamente-heading text-3xl md:text-4xl mb-4">¿LISTO PARA CREAR?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Empezá ahora y creá tu primera prenda personalizada con inteligencia artificial
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ScrollButton className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 transition-colors">
              <Sparkles className="h-5 w-5" />
              Crear Mi Diseño
            </ScrollButton>
            <Link href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Llego%20desde%20el%20home%20de%20la%20web%20y%20quiero%20empezar%20a%20disenar%20prendas.%20Como%20arrancamos%3F%20(ref%20%C2%B7%20NV-HOME)" target="_blank">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary bg-transparent"
              >
                Contactar por WhatsApp
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
