import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles, Palette, Wand2, Shirt, ArrowRight, Star, Truck,
  Shield, Clock, CheckCircle2, Zap
} from "lucide-react"

export const metadata: Metadata = {
  title: "Remera Personalizada Argentina — Disena tu remera online con IA",
  description:
    "Disena tu remera personalizada online con inteligencia artificial. Remeras desde $28.600, algodon 100%, estampado DTG premium. 37 estilos artisticos, envios a todo el pais. Crea tu diseno unico en minutos.",
  keywords: [
    "remera personalizada argentina",
    "disenar remera online",
    "remera custom",
    "remera personalizada buenos aires",
    "remera con diseno propio",
    "remera estampada personalizada",
    "remera DTG argentina",
    "remera con IA",
    "disenar remera con inteligencia artificial",
    "remera oversize personalizada",
  ],
  openGraph: {
    title: "Disena tu Remera Personalizada con IA — Novamente",
    description:
      "Crea tu remera unica con inteligencia artificial. 37 estilos, algodon 100%, estampado DTG premium. Desde $28.600. Envios a toda Argentina.",
    url: "https://www.novamente.ar/disena-tu-remera",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/aura-tshirt-blanco-front.jpeg",
        width: 800,
        height: 800,
        alt: "Remera personalizada con diseno de IA — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Disena tu Remera Personalizada con IA — Novamente",
    description:
      "Crea tu remera unica en minutos. 37 estilos artisticos, algodon 100%, DTG premium. Desde $28.600.",
  },
  alternates: { canonical: "https://www.novamente.ar/disena-tu-remera" },
}

export default function DisenaTuRemera() {
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Remera Personalizada con IA — Novamente",
    description:
      "Remera de algodon 100% con diseno personalizado generado por inteligencia artificial y estampado DTG premium. Disponible en Classic Fit y Oversize.",
    image: [
      "https://www.novamente.ar/products/aura-tshirt-blanco-front.jpeg",
      "https://www.novamente.ar/products/aura-tshirt-negro-front.jpeg",
      "https://www.novamente.ar/products/tshirt-aldea-negro-front.jpeg",
    ],
    brand: { "@type": "Brand", name: "Novamente" },
    category: "Remeras Personalizadas",
    material: "Algodon 100%",
    offers: {
      "@type": "Offer",
      url: "https://www.novamente.ar/disena-tu-remera",
      price: "28600",
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
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "95",
      bestRating: "5",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cuanto cuesta una remera personalizada en Novamente?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Las remeras personalizadas en Novamente arrancan desde $28.600 ARS para el modelo Aldea Classic Fit y $31.000 ARS para la Aura Oversize. Ambos precios incluyen el diseno personalizado con IA y estampado DTG de alta calidad.",
        },
      },
      {
        "@type": "Question",
        name: "Como diseno mi remera con inteligencia artificial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Es muy simple: describis tu idea en texto, elegis uno de los 37 estilos artisticos disponibles (watercolor, pixel art, anime, street art, etc.) y nuestra IA genera un diseno vectorial unico optimizado para estampado textil en menos de 30 segundos. No necesitas conocimientos de diseno.",
        },
      },
      {
        "@type": "Question",
        name: "Que material son las remeras?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Todas nuestras remeras son de algodon 100% peinado premium, optimizado para estampado DTG. Ofrecemos dos modelos: Aldea Classic Fit (clasica) y Aura Oversize (amplia y moderna). Disponibles en blanco y negro.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tarda en llegar mi remera personalizada?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "El tiempo total es de 5 a 10 dias habiles: 1-3 dias de produccion y estampado DTG, mas 3-7 dias de envio. Realizamos envios a toda la Argentina: AMBA $5.500, Interior de Buenos Aires $7.000, resto del pais $9.000.",
        },
      },
      {
        "@type": "Question",
        name: "El estampado DTG se sale con los lavados?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. El estampado DTG (Direct to Garment) imprime directamente sobre la fibra del algodon, logrando una adherencia permanente. Con cuidados basicos (lavar del reves, agua fria, no usar secadora), el diseno mantiene su calidad y colores vibrantes por muchos lavados.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo usar mi propio diseno en vez de la IA?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, podes contactarnos por WhatsApp y enviarnos tu diseno propio en alta resolucion. Tambien podes usar nuestra IA para generar un diseno base y luego ajustarlo. El precio es el mismo en ambos casos.",
        },
      },
    ],
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://www.novamente.ar",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Productos",
        item: "https://www.novamente.ar/products",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Remera Personalizada",
        item: "https://www.novamente.ar/disena-tu-remera",
      },
    ],
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center bg-novamente-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-novamente-blue/15 via-transparent to-novamente-magenta/15 opacity-40" />

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 text-sm px-4 py-1.5">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Diseno con Inteligencia Artificial
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight mb-6 leading-[1.1]">
                <span className="novamente-gradient-text">Disena tu Remera</span>
                <br />
                <span className="text-white/90">Personalizada</span>
              </h1>

              <p className="text-lg md:text-xl text-white/70 mb-8 max-w-lg leading-relaxed">
                Crea un diseno unico con inteligencia artificial en menos de 30 segundos.
                Algodon 100% premium, estampado DTG y envios a todo el pais.
              </p>

              {/* Price anchor */}
              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-3xl md:text-4xl font-bold text-white">Desde $28.600</span>
                <span className="text-white/50 text-lg">ARS</span>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/design" data-cta="hero-disena-remera">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium rounded-xl py-6 px-8 text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Empezar a Disenar
                  </Button>
                </Link>
                <Link href="/products">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 bg-transparent py-6 px-8 text-lg"
                  >
                    <Shirt className="w-5 h-5 mr-2" />
                    Ver Modelos
                  </Button>
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-6 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-green-400" />
                  Pago seguro
                </span>
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-400" />
                  Envio a todo el pais
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  4.8/5 rating
                </span>
              </div>
            </div>

            {/* Right: Product images */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[3/4] relative rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/products/aura-tshirt-blanco-front.jpeg"
                      alt="Remera personalizada blanca Aura Oversize — algodon 100% con estampado DTG"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      priority
                    />
                  </div>
                  <div className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/products/tshirt-aldea-negro-front.jpeg"
                      alt="Remera personalizada negra Aldea Classic Fit — algodon premium DTG"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/products/aura-tshirt-negro-front.jpeg"
                      alt="Remera personalizada negra Aura Oversize con estampado DTG"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div className="aspect-[3/4] relative rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/products/tshirt-aldea-blanco-front.jpeg"
                      alt="Remera personalizada blanca Aldea Classic Fit — diseno con IA"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
              COMO DISENAR TU REMERA EN 3 PASOS
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Sin conocimientos de diseno. Sin programas complicados. Solo tu imaginacion.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center border-2 hover:border-primary/30 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Palette className="w-10 h-10 text-primary" />
                </div>
                <div className="text-sm font-bold text-primary mb-2">PASO 1</div>
                <h3 className="text-xl font-semibold mb-3">Describi tu idea</h3>
                <p className="text-muted-foreground">
                  Escribi lo que queres en tu remera. Puede ser un animal, una frase, un paisaje,
                  algo abstracto... lo que se te ocurra.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-primary/30 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Wand2 className="w-10 h-10 text-primary" />
                </div>
                <div className="text-sm font-bold text-primary mb-2">PASO 2</div>
                <h3 className="text-xl font-semibold mb-3">Elegi un estilo</h3>
                <p className="text-muted-foreground">
                  37 estilos artisticos: watercolor, pixel art, anime, street art, minimalista
                  y muchos mas. La IA genera tu diseno en segundos.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-primary/30 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Shirt className="w-10 h-10 text-primary" />
                </div>
                <div className="text-sm font-bold text-primary mb-2">PASO 3</div>
                <h3 className="text-xl font-semibold mb-3">Pedila</h3>
                <p className="text-muted-foreground">
                  Elegi modelo, color y talle. Pagá con MercadoPago o transferencia.
                  Te llega a tu casa en 5-10 dias habiles.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/design" data-cta="how-it-works-disena-remera">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium rounded-xl py-6 px-10 text-lg transition-all"
              >
                <Zap className="w-5 h-5 mr-2" />
                Disenar Mi Remera Ahora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Models comparison */}
      <section className="py-16 md:py-24 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">NUESTROS MODELOS DE REMERA</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Dos modelos, cuatro colores. Algodon 100% optimizado para estampado DTG.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Aldea Classic */}
            <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src="/products/tshirt-aldea-blanco-front.jpeg"
                  alt="Remera personalizada Aldea Classic Fit — algodon 100% DTG"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-500/90 text-white">Mas vendida</Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-foreground font-bold text-lg px-3 py-1">
                    $28.600
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-semibold mb-2">Aldea Classic Fit</h3>
                <p className="text-muted-foreground mb-4">
                  Corte clasico recto. Ideal para un look prolijo y casual. Algodon 100% peinado premium.
                </p>
                <ul className="space-y-2 text-sm text-white/70 mb-6">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Algodon 100% peinado</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Estampado DTG premium</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Disponible en blanco y negro</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Talles S a XXL</li>
                </ul>
                <Link href="/design" data-cta="aldea-classic-disena-remera">
                  <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium rounded-xl py-3">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Personalizar Aldea Classic
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Aura Oversize */}
            <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src="/products/aura-tshirt-blanco-front.jpeg"
                  alt="Remera personalizada Aura Oversize — fit amplio algodon premium DTG"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-purple-500/90 text-white">Oversize</Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-foreground font-bold text-lg px-3 py-1">
                    $31.000
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-semibold mb-2">Aura Oversize</h3>
                <p className="text-muted-foreground mb-4">
                  Corte amplio y moderno. Tendencia urbana con caida relajada. Algodon 100% peinado.
                </p>
                <ul className="space-y-2 text-sm text-white/70 mb-6">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Algodon 100% peinado premium</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Estampado DTG alta definicion</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Disponible en blanco y negro</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Talles S a XXL</li>
                </ul>
                <Link href="/design" data-cta="aura-oversize-disena-remera">
                  <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium rounded-xl py-3">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Personalizar Aura Oversize
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Novamente */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
              POR QUE ELEGIR NOVAMENTE
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wand2 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">IA que entiende</h3>
              <p className="text-sm text-muted-foreground">
                Describis tu idea, la IA la interpreta y genera un diseno profesional en 30 segundos.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Palette className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">37 estilos</h3>
              <p className="text-sm text-muted-foreground">
                Watercolor, pixel art, anime, street art, minimalista, pop art y muchos mas.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">DTG premium</h3>
              <p className="text-sm text-muted-foreground">
                Estampado directo sobre la fibra. Colores vibrantes que resisten cada lavado.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Truck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Todo el pais</h3>
              <p className="text-sm text-muted-foreground">
                AMBA $5.500 · Interior BA $7.000 · Resto del pais $9.000. En 5-10 dias habiles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 md:py-20 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-2xl font-semibold mb-2">4.8/5 de rating promedio</p>
            <p className="text-muted-foreground">
              Mas de 1.200 disenos creados por clientes en toda Argentina
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-white/80 mb-4">
                  &ldquo;Increible la calidad del estampado. Pedi una remera con un diseno de mi gato en estilo watercolor y quedo espectacular. Ya voy por la tercera.&rdquo;
                </p>
                <p className="text-sm font-semibold">Martin L. — CABA</p>
              </CardContent>
            </Card>

            <Card className="border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-white/80 mb-4">
                  &ldquo;Compre para regalar y fue un exitazo. La IA genero un diseno mucho mejor de lo que me imaginaba. Super recomendable.&rdquo;
                </p>
                <p className="text-sm font-semibold">Camila R. — Rosario</p>
              </CardContent>
            </Card>

            <Card className="border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-white/80 mb-4">
                  &ldquo;La Aura Oversize es comodisima y el estampado DTG tiene una definicion impresionante. Ya lave varias veces y sigue impecable.&rdquo;
                </p>
                <p className="text-sm font-semibold">Tomas G. — Cordoba</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
              PREGUNTAS FRECUENTES SOBRE REMERAS PERSONALIZADAS
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "Cuanto cuesta una remera personalizada?",
                a: "Las remeras arrancan desde $28.600 ARS (Aldea Classic Fit) y $31.000 ARS (Aura Oversize). El precio incluye el diseno personalizado con IA y el estampado DTG de alta calidad.",
              },
              {
                q: "Como funciona el diseno con IA?",
                a: "Describis lo que queres en tu remera, elegis un estilo artistico (hay 37 opciones), y nuestra IA genera un diseno unico en menos de 30 segundos. No necesitas saber nada de diseno grafico.",
              },
              {
                q: "Que material son las remeras?",
                a: "Todas nuestras remeras son de algodon 100% peinado premium, optimizado para que el estampado DTG se adhiera perfectamente y dure muchos lavados. Ofrecemos Classic Fit y Oversize.",
              },
              {
                q: "Cuanto tarda en llegar?",
                a: "El tiempo total es de 5 a 10 dias habiles: 1-3 dias de produccion y estampado, mas 3-7 dias de envio. Enviamos a toda Argentina.",
              },
              {
                q: "El estampado se sale con los lavados?",
                a: "No. El DTG imprime directamente sobre la fibra del algodon. Con cuidados basicos (lavar del reves, agua fria), los colores se mantienen vibrantes por mucho tiempo.",
              },
              {
                q: "Puedo usar mi propio diseno?",
                a: "Si, contactanos por WhatsApp y mandanos tu diseno en alta resolucion. El precio es el mismo. Tambien podes usar la IA para generar un diseno base y ajustarlo.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group border border-white/10 rounded-xl p-5 hover:border-primary/30 transition-colors"
              >
                <summary className="text-base font-semibold cursor-pointer list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-primary group-open:rotate-45 transition-transform text-2xl ml-4 shrink-0">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
            TU REMERA UNICA ESTA A 3 CLICS
          </h2>
          <p className="text-xl mb-4 max-w-2xl mx-auto opacity-90">
            Crea tu diseno con IA, elegi tu modelo y recibila en tu casa.
          </p>
          <p className="text-lg mb-8 opacity-70">
            Remeras desde $28.600 · Algodon 100% · Estampado DTG · Envios a todo el pais
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/design" data-cta="final-cta-disena-remera">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium rounded-xl py-6 px-10 text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Disenar Mi Remera
              </Button>
            </Link>
            <Link href="https://wa.me/message/DRWR3O2HZY2JG1" target="_blank">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary bg-transparent py-6 px-10 text-lg"
              >
                Consultar por WhatsApp
              </Button>
            </Link>
          </div>

          <div className="flex justify-center gap-8 mt-10 text-sm opacity-70">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Diseno en 30 seg
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Pago seguro
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              5-10 dias habiles
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
