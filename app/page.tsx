// @ts-nocheck
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { ImageHistory } from "@/components/ImageHistory"

const StyleGallery = dynamic(() => import("@/components/StyleGallery").then(m => m.StyleGallery), {
  loading: () => <div className="h-96 animate-pulse bg-zinc-900 rounded-2xl" />,
})
const HomeGeneratorWrapper = dynamic(() => import("@/components/HomeGeneratorWrapper").then(m => m.HomeGeneratorWrapper), {
  loading: () => <div className="h-[500px] animate-pulse bg-zinc-900 rounded-2xl" />,
})
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Zap, Shirt, Star, Sparkles, Palette, Wand2 } from "lucide-react"
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Novamente — Ropa personalizada con IA en Argentina",
    description: "Diseñá tu prenda única en minutos. 37 estilos artísticos, estampado DTG premium. Envíos a todo el país.",
  },
  alternates: { canonical: "https://www.novamente.ar/" },
}

export default function Home() {
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
          text: "Las remeras personalizadas arrancan desde $28.600 ARS para el modelo Aldea Classic Fit y $31.000 ARS para la Aura Oversize. Los hoodies comienzan en $55.000 ARS y el Astra Oversize Hoodie está en $60.000 ARS. Todos incluyen el diseño personalizado con IA y estampado DTG.",
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

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero Section con estética de Novamente */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 py-20 bg-novamente-black">
        <div className="absolute inset-0 bg-gradient-to-b from-novamente-blue/10 to-novamente-magenta/10 opacity-30"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <p className="novamente-heading text-lg md:text-xl mb-4 text-white/80">CREÁ TU ESTILO ÚNICO</p>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-light tracking-[0.08em] sm:tracking-[0.15em] md:tracking-[0.2em] mb-8">
            <span className="novamente-gradient-text">Ropa Personalizada con IA</span>
            <span className="sr-only"> — Novamente, indumentaria personalizada con inteligencia artificial en Argentina</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-12">
            La primera marca argentina de indumentaria que te permite crear tu diseño con inteligencia artificial.
            37 estilos artísticos, estampado DTG premium y envíos a todo el país.
          </p>

          {/* Botones actualizados */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <ScrollButton className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 transition-colors">
              <Zap className="h-5 w-5" />
              Empezar a Diseñar
            </ScrollButton>
            <Link href="/products">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-black bg-transparent"
              >
                <Shirt className="mr-2 h-5 w-5" />
                Ver Productos
              </Button>
            </Link>
          </div>

          {/* Stats más pequeñas con nueva estadística */}
          <div className="flex justify-center gap-8 pt-4">
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
      </section>

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

      {/* Generador de Imágenes */}
      <section id="generator-section" className="scroll-mt-24 py-8 md:py-10">
        <div className="container mx-auto">
          <h2 className="mb-4 text-center text-base md:text-lg font-medium tracking-tight text-zinc-100">
            GENERADOR DE DISEÑOS
          </h2>
          <p className="mb-6 text-center text-sm text-zinc-400">
            Elegí tamaño, estilo y generá con IA.
          </p>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-lg border border-white/10">
            <Suspense fallback={<div className="h-96 w-full bg-muted/30 animate-pulse rounded-lg"></div>}>
              <HomeGeneratorWrapper />
            </Suspense>
          </div>
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
      <section className="py-16 md:py-24 bg-secondary/20">
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
                    src="/products/hoodie-negro-front.jpeg"
                    alt="Astra Oversize Hoodie"
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
                      Hoodies
                    </Badge>
                  </div>
                </div>
              </Link>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold leading-tight">Astra Oversize Hoodie</h2>
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

      {/* FAQ Section — alto impacto GEO */}
      <section className="py-16 md:py-24 bg-secondary/10">
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
                Sí, ofrecemos precios mayoristas y un programa Partners para empresas que quieren crear su propia línea de merchandising. Incluye storefront personalizada, diseño con IA, producción y envío. Contactanos por WhatsApp o visitá nuestra sección de Partners para más información.
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
            <Link href="https://wa.me/message/DRWR3O2HZY2JG1" target="_blank">
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
