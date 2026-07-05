import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles, Palette, Wand2, Shirt, Star, Truck,
  Shield, Clock, CheckCircle2, Zap, TrendingUp
} from "lucide-react"

export const metadata: Metadata = {
  title: "Hoodie Personalizado Argentina con IA",
  description:
    "Disena tu hoodie personalizado con inteligencia artificial. Buzo Hoodie Oversize desde $55.000, algodon premium, estampado DTG. 37 estilos artisticos, 6 colores. Envios a todo el pais.",
  keywords: [
    "hoodie personalizado argentina",
    "buzo personalizado",
    "hoodie custom argentina",
    "buzo con diseno propio",
    "hoodie oversize personalizado",
    "buzo estampado personalizado",
    "hoodie DTG argentina",
    "buzo con IA",
    "disenar hoodie online",
    "buzo oversize custom",
  ],
  openGraph: {
    title: "Hoodie Personalizado con IA — Novamente",
    description:
      "Crea tu hoodie unico con inteligencia artificial. Buzo Hoodie Oversize, 37 estilos, algodon premium, estampado DTG. Desde $55.000. Envios a toda Argentina.",
    url: "https://www.novamente.ar/hoodie-personalizado",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png",
        width: 800,
        height: 800,
        alt: "Hoodie personalizado con estampado DTG — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hoodie Personalizado con IA — Novamente",
    description:
      "Crea tu hoodie unico en minutos. 37 estilos artisticos, algodon premium, DTG. Desde $55.000.",
  },
  alternates: { canonical: "https://www.novamente.ar/hoodie-personalizado" },
}

export default function HoodiePersonalizado() {
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Hoodie Personalizado con IA — Novamente",
    description:
      "Hoodie de algodon premium con diseno personalizado generado por inteligencia artificial y estampado DTG. Disponible como Buzo Hoodie Oversize.",
    image: [
      "https://www.novamente.ar/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png",
      "https://www.novamente.ar/products/buzo-hoddie-unisex-marron/front.jpeg",
      "https://www.novamente.ar/products/buzo-hoddie-unisex-crema/front.jpeg",
      "https://www.novamente.ar/products/buzo-hoddie-unisex-gris/front.jpeg",
    ],
    brand: { "@type": "Brand", name: "Novamente" },
    category: "Buzos y Hoodies Personalizados",
    material: "Algodon premium",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: 55000,
      highPrice: 55000,
      priceCurrency: "ARS",
      offerCount: 1,
      availability: "https://schema.org/InStock",
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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cuanto cuesta un hoodie personalizado en Novamente?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Los hoodies personalizados en Novamente arrancan desde $55.000 ARS para el Buzo Hoodie Oversize. Incluyen el diseno personalizado con IA y estampado DTG premium.",
        },
      },
      {
        "@type": "Question",
        name: "Que modelos de hoodie tienen disponibles?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ofrecemos Buzo Hoodie Oversize con capucha, calce oversize y 6 colores disponibles. Todos de algodon premium con estampado DTG.",
        },
      },
      {
        "@type": "Question",
        name: "En que colores vienen los hoodies?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "El Buzo Hoodie Oversize viene en negro, blanco, stone-wash, marron, crema y gris melange.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto margen puedo sacar vendiendo hoodies?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Los hoodies son el producto con mayor margen. Un Buzo Hoodie Oversize cuesta $55.000 y se vende a $95.000-110.000. Eso es un margen del 60-80% por unidad.",
        },
      },
      {
        "@type": "Question",
        name: "El estampado DTG se banca los lavados en un buzo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. El estampado DTG (Direct to Garment) imprime directamente sobre la fibra del algodon, logrando una adherencia permanente. Recomendamos lavar del reves con agua fria para mantener los colores vibrantes por mucho tiempo.",
        },
      },
      {
        "@type": "Question",
        name: "Los hoodies son unisex?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, todos nuestros modelos de hoodie son unisex. Disponibles en talles S a XXL. El Buzo Hoodie Oversize tiene calce amplio con capucha, mientras que el Cuello Redondo tiene un calce relajado sin capucha.",
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
        name: "Hoodie Personalizado",
        item: "https://www.novamente.ar/hoodie-personalizado",
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
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/15 via-transparent to-novamente-magenta/15 opacity-40" />

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <Badge className="mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30 text-sm px-4 py-1.5">
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                Producto con mayor margen
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight mb-6 leading-[1.1]">
                <span className="novamente-gradient-text">Hoodie</span>
                <br />
                <span className="text-white/90">Personalizado</span>
              </h1>

              <p className="text-lg md:text-xl text-white/70 mb-8 max-w-lg leading-relaxed">
                Disena tu hoodie unico con inteligencia artificial. Buzo Hoodie Oversize, 6 colores,
                algodon premium y estampado DTG que dura. Ideal para venta o uso personal.
              </p>

              {/* Price anchor + margin hook */}
              <div className="flex flex-col gap-2 mb-8">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-bold text-white">Desde $55.000</span>
                  <span className="text-white/50 text-lg">ARS</span>
                </div>
                <p className="text-green-400 text-sm font-medium flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Compra a $43k → Vende a $75k = $32.000 de ganancia por unidad
                </p>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/crear" data-cta="hero-hoodie">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-500/90 hover:to-red-600/90 text-white font-medium rounded-xl py-6 px-8 text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Disenar Mi Hoodie
                  </Button>
                </Link>
                <Link href="/products">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 bg-transparent py-6 px-8 text-lg"
                  >
                    <Shirt className="w-5 h-5 mr-2" />
                    Ver Todos los Modelos
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
                  4.9/5 rating
                </span>
              </div>
            </div>

            {/* Right: Product images */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[3/4] relative rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png"
                      alt="Hoodie personalizado negro oversize — algodon premium DTG"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      priority
                    />
                  </div>
                  <div className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/products/buzo-hoddie-unisex-crema/front.jpeg"
                      alt="Hoodie personalizado crema — estampado DTG premium"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/products/buzo-hoddie-unisex-marron/front.jpeg"
                      alt="Hoodie personalizado marron oversize con estampado DTG"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div className="aspect-[3/4] relative rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/products/buzo-hoddie-unisex-gris/front.jpeg"
                      alt="Hoodie personalizado gris melange — diseno con IA"
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
              COMO DISENAR TU HOODIE EN 3 PASOS
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Tu idea, tu estilo, tu hoodie. Sin conocimientos de diseno.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center border-2 hover:border-orange-500/30 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-500/20 transition-colors">
                  <Palette className="w-10 h-10 text-orange-500" />
                </div>
                <div className="text-sm font-bold text-orange-500 mb-2">PASO 1</div>
                <h3 className="text-xl font-semibold mb-3">Describi tu idea</h3>
                <p className="text-muted-foreground">
                  Un logo, una frase, un arte abstracto, un personaje... lo que imagines.
                  La IA lo interpreta y lo convierte en diseno.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-orange-500/30 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-500/20 transition-colors">
                  <Wand2 className="w-10 h-10 text-orange-500" />
                </div>
                <div className="text-sm font-bold text-orange-500 mb-2">PASO 2</div>
                <h3 className="text-xl font-semibold mb-3">Elegi estilo y modelo</h3>
                <p className="text-muted-foreground">
                  37 estilos artisticos. Buzo Hoodie Oversize. 6 colores.
                  La IA genera tu diseno en menos de 30 segundos.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-orange-500/30 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-500/20 transition-colors">
                  <Shirt className="w-10 h-10 text-orange-500" />
                </div>
                <div className="text-sm font-bold text-orange-500 mb-2">PASO 3</div>
                <h3 className="text-xl font-semibold mb-3">Pedilo</h3>
                <p className="text-muted-foreground">
                  Elegi talle y color. Paga con MercadoPago o transferencia.
                  Te llega a tu casa en 5-10 dias habiles.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/crear" data-cta="how-it-works-hoodie">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-500/90 hover:to-red-600/90 text-white font-medium rounded-xl py-6 px-10 text-lg transition-all"
              >
                <Zap className="w-5 h-5 mr-2" />
                Disenar Mi Hoodie Ahora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Hoodie colors comparison */}
      <section className="py-16 md:py-24 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">BUZO HOODIE OVERSIZE</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Algodon premium, estampado DTG y 6 colores. El producto con mayor margen de nuestro catalogo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Buzo Hoodie Oversize */}
            <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-500/20">
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src="/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png"
                  alt="Buzo Hoodie Oversize personalizado — algodon premium DTG"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-orange-500/90 text-white">Premium</Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-foreground font-bold text-lg px-3 py-1">
                    $55.000
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Buzo Hoodie Oversize</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Oversize con capucha. Corte amplio y moderno. El mas vendido para marcas.
                </p>
                <ul className="space-y-2 text-sm text-white/70 mb-4">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> 6 colores: negro, blanco, stone-wash, marron, crema, gris</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Algodon premium, calce oversize</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Talles S a XXL</li>
                </ul>
                <p className="text-xs text-green-400 mb-4 font-medium">
                  Venta sugerida: $95.000-110.000 (+60% margen)
                </p>
                <Link href="/crear" data-cta="buzo-hoodie">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-500/90 hover:to-red-600/90 text-white font-medium rounded-xl py-3">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Personalizar Hoodie
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Buzo Hoodie Oversize */}
            <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-500/20">
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src="/products/buzo-hoddie-unisex-marron/front.jpeg"
                  alt="Buzo Hoodie Oversize marron personalizado con capucha DTG"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-500/90 text-white">Popular</Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-foreground font-bold text-lg px-3 py-1">
                    $55.000
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Buzo Hoodie Oversize</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Oversize con capucha en marron. Calce amplio, ideal para marcas y drops.
                </p>
                <ul className="space-y-2 text-sm text-white/70 mb-4">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> 6 colores: negro, blanco, stone-wash, marron, crema, gris</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Algodon premium, calce oversize</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Talles S a XXL</li>
                </ul>
                <p className="text-xs text-green-400 mb-4 font-medium">
                  Venta sugerida: $85.000-95.000 (+60% margen)
                </p>
                <Link href="/crear" data-cta="buzo-hoodie-marron">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-500/90 hover:to-red-600/90 text-white font-medium rounded-xl py-3">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Personalizar Hoodie
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Buzo Hoodie Oversize */}
            <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-500/20">
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src="/products/buzo-hoddie-unisex-gris/front.jpeg"
                  alt="Buzo Hoodie Oversize gris personalizado con capucha DTG"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-blue-500/90 text-white">Mejor precio</Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-foreground font-bold text-lg px-3 py-1">
                    $55.000
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Buzo Hoodie Oversize</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Oversize con capucha en gris melange. Comodo, premium y listo para estampar.
                </p>
                <ul className="space-y-2 text-sm text-white/70 mb-4">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> 6 colores: negro, blanco, stone-wash, marron, crema, gris</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Algodon premium, calce oversize</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Talles S a XXL</li>
                </ul>
                <p className="text-xs text-green-400 mb-4 font-medium">
                  Venta sugerida: $95.000-110.000 (+60% margen)
                </p>
                <Link href="/crear" data-cta="buzo-hoodie-gris">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-500/90 hover:to-red-600/90 text-white font-medium rounded-xl py-3">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Personalizar Hoodie
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Margin calculator / business case */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
              EL PRODUCTO CON MAYOR MARGEN
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Compra hoodies personalizados y revendelos con tu marca. Sin inversion inicial en stock.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-2 border-orange-500/20 bg-orange-500/5">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">$43.000</div>
                <div className="text-sm text-muted-foreground mb-4">Costo Buzo Cuello Redondo</div>
                <div className="text-xl font-bold text-white mb-1">→ Vende a $75.000</div>
                <div className="text-green-400 font-semibold text-lg">$32.000 ganancia</div>
                <div className="text-xs text-muted-foreground mt-2">74% de margen por unidad</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-500/20 bg-orange-500/5">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">$55.000</div>
                <div className="text-sm text-muted-foreground mb-4">Costo Buzo Hoodie Oversize</div>
                <div className="text-xl font-bold text-white mb-1">→ Vende a $90.000</div>
                <div className="text-green-400 font-semibold text-lg">$35.000 ganancia</div>
                <div className="text-xs text-muted-foreground mt-2">64% de margen por unidad</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-500/20 bg-orange-500/5">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">$55.000</div>
                <div className="text-sm text-muted-foreground mb-4">Costo Buzo Hoodie Oversize</div>
                <div className="text-xl font-bold text-white mb-1">→ Vende a $100.000</div>
                <div className="text-green-400 font-semibold text-lg">$40.000 ganancia</div>
                <div className="text-xs text-muted-foreground mt-2">67% de margen por unidad</div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-10">
            <Link href="/partners" data-cta="partners-margin-hoodie">
              <Button
                size="lg"
                variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 bg-transparent py-6 px-10 text-lg"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Quiero vender hoodies con mi marca
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Novamente */}
      <section className="py-16 md:py-24 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
              POR QUE ELEGIR NOVAMENTE
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wand2 className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-2">IA que entiende</h3>
              <p className="text-sm text-muted-foreground">
                Describis tu idea, la IA genera un diseno profesional optimizado para estampado textil.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Palette className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-2">37 estilos</h3>
              <p className="text-sm text-muted-foreground">
                Watercolor, pixel art, anime, street art, minimalista, pop art y muchos mas.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-2">DTG premium</h3>
              <p className="text-sm text-muted-foreground">
                Estampado directo sobre la fibra. Colores vibrantes que resisten cada lavado.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Truck className="w-7 h-7 text-orange-500" />
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
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-2xl font-semibold mb-2">4.9/5 de rating en hoodies</p>
            <p className="text-muted-foreground">
              Mas de 350 hoodies personalizados entregados en toda Argentina
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
                  &ldquo;Compre el Buzo Hoodie Oversize en marron y la calidad es brutal. El estampado quedo perfecto, los colores son exactos a lo que vi en la preview. Ya encargue 3 mas para mi marca.&rdquo;
                </p>
                <p className="text-sm font-semibold">Lucas M. — La Plata</p>
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
                  &ldquo;El buzo cuello redondo es mi favorito. Lo use para hacer merch de mi banda y los vendimos todos en una semana. Excelente relacion precio-calidad.&rdquo;
                </p>
                <p className="text-sm font-semibold">Sofia T. — Mendoza</p>
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
                  &ldquo;Arrancamos vendiendo hoodies con la IA de Novamente y ya llevamos 40 unidades vendidas. El margen es increible y la produccion es rapida. Super recomendable.&rdquo;
                </p>
                <p className="text-sm font-semibold">Nico & Valen — CABA</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
              PREGUNTAS FRECUENTES SOBRE HOODIES PERSONALIZADOS
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "Cuanto cuesta un hoodie personalizado?",
                a: "Los hoodies arrancan desde $55.000 ARS para el Buzo Hoodie Oversize. El precio incluye el diseno con IA y estampado DTG premium.",
              },
              {
                q: "Que modelos de hoodie tienen?",
                a: "Ofrecemos Buzo Hoodie Oversize con capucha, calce oversize y 6 colores disponibles. Todos de algodon premium.",
              },
              {
                q: "En que colores vienen?",
                a: "Buzo Hoodie Oversize: negro, blanco, stone-wash, marron, crema y gris melange.",
              },
              {
                q: "Cuanto tarda en llegar?",
                a: "El tiempo total es de 5 a 10 dias habiles: 2-5 dias de produccion y estampado DTG, mas 3-7 dias de envio segun zona. Enviamos a toda Argentina.",
              },
              {
                q: "El estampado se banca los lavados?",
                a: "Si. El DTG imprime directamente sobre la fibra del algodon. Con cuidados basicos (lavar del reves, agua fria), los colores se mantienen vibrantes por mucho tiempo.",
              },
              {
                q: "Puedo vender hoodies con mi propia marca?",
                a: "Si. Con nuestro programa de Partners podes crear tu marca y vender hoodies personalizados con tu diseno. Nosotros producimos y vos vendes. Sin stock inicial. Margen del 60-80%.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group border border-white/10 rounded-xl p-5 hover:border-orange-500/30 transition-colors"
              >
                <summary className="text-base font-semibold cursor-pointer list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-orange-500 group-open:rotate-45 transition-transform text-2xl ml-4 shrink-0">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
            TU HOODIE UNICO ESTA A 3 CLICS
          </h2>
          <p className="text-xl mb-4 max-w-2xl mx-auto opacity-90">
            Disena con IA, elegi tu modelo y color, y recibilo en tu casa.
          </p>
          <p className="text-lg mb-8 opacity-70">
            Hoodies desde $55.000 · Algodon premium · Estampado DTG · Envios a todo el pais
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/crear" data-cta="final-cta-hoodie">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white hover:bg-white/90 text-orange-600 font-medium rounded-xl py-6 px-10 text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Disenar Mi Hoodie
              </Button>
            </Link>
            <Link href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Estoy%20interesado%20en%20un%20hoodie%20personalizado.%20Me%20pasan%20info%3F%20(ref%20%C2%B7%20NV-HOODIE)" target="_blank">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-orange-600 bg-transparent py-6 px-10 text-lg"
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
