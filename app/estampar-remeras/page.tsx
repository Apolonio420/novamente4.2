import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import {
  Package, Star, Shield, Clock, CheckCircle2,
  Truck, Palette, Sparkles, ArrowRight,
  Zap, Printer, Droplets, ImageIcon,
  Shirt, Layers, MessageCircle, ThumbsUp
} from "lucide-react"

export const metadata: Metadata = {
  title: "Estampar Remeras — Servicio de Estampado DTG Premium | Novamente Argentina",
  description:
    "Servicio de estampado de remeras en Argentina. Estampado DTG directo sobre tela, colores vibrantes, desde 1 unidad. Trае tu diseno o crealo con IA. Remeras, buzos, hoodies y musculosas. Sin minimos, sin matriceria. Envios a todo el pais.",
  keywords: [
    "estampar remeras",
    "donde estampar remeras",
    "estampado de remeras",
    "servicio de estampado",
    "estampar camisetas",
    "imprimir remeras",
    "estampar remeras personalizadas",
    "estampar remeras buenos aires",
    "estampado DTG",
    "estampado digital remeras",
    "estampar buzos",
    "estampar hoodies",
    "estampado textil",
    "estampar remeras precio",
    "servicio de estampado DTG argentina",
  ],
  openGraph: {
    title: "Estampar Remeras — Servicio DTG Premium | Novamente",
    description:
      "Estampa remeras, buzos y hoodies con tecnologia DTG. Desde 1 unidad, sin matriceria, colores vibrantes. Trae tu diseno o crealo con IA.",
    url: "https://www.novamente.ar/estampar-remeras",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/oversize-negro-front.jpeg",
        width: 800,
        height: 800,
        alt: "Servicio de estampado de remeras DTG — Novamente Argentina",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Estampar Remeras — Servicio DTG Premium | Novamente",
    description:
      "Estampa remeras con tecnologia DTG. Desde 1 unidad, colores vibrantes. Trae tu diseno o crealo con nuestra IA.",
  },
  alternates: { canonical: "https://www.novamente.ar/estampar-remeras" },
}

export default function EstamparRemeras() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Servicio de Estampado de Remeras DTG — Novamente",
    description:
      "Servicio profesional de estampado de remeras, buzos, hoodies y musculosas con tecnologia DTG (Direct-To-Garment). Impresion directa sobre algodon 100%, colores vibrantes, desde 1 unidad sin minimos. Trae tu diseno o crealo con IA. Produccion on-demand y envios a toda Argentina.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Estampado de Indumentaria DTG",
    areaServed: {
      "@type": "Country",
      name: "Argentina",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: 21800,
      highPrice: 55000,
      priceCurrency: "ARS",
      offerCount: 9,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "520",
      bestRating: "5",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cuanto sale estampar una remera?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "El precio incluye prenda + estampado DTG. Remera oversize desde $31.000, clasica desde $28.600, crop desde $23.500, musculosa desde $21.800, buzos desde $43.000, hoodies desde $55.000. Sin costos de setup, matriceria ni minimos de cantidad.",
        },
      },
      {
        "@type": "Question",
        name: "Que metodo de estampado usan?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Usamos DTG (Direct-To-Garment), impresion digital directa sobre la tela con tintas de agua. Es el metodo mas avanzado: colores vibrantes, tacto suave (no se siente la tinta), durabilidad de 50+ lavados. Funciona en telas claras y oscuras sin limitaciones de color.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo traer mi propio diseno para estampar?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. Acepta PNG, JPG o SVG. Tambien podes crear un diseno nuevo con nuestra inteligencia artificial en segundos: describis tu idea y la IA genera el diseno. O combinar ambos: subir tu logo y que la IA genere el fondo.",
        },
      },
      {
        "@type": "Question",
        name: "Cual es el minimo de unidades para estampar?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No hay minimo. Con DTG estampamos desde 1 unidad al mismo precio y calidad que 100. Cada prenda puede tener un diseno diferente sin costo extra. Para pedidos de 10+ unidades hay descuentos por volumen.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tarda el servicio de estampado?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Produccion: 2-5 dias habiles. Envio: AMBA 3-5 dias ($5.500), Interior BA 5-7 dias ($7.000), Resto del pais 7-10 dias ($9.000). Total desde que confirmas hasta que lo recibi: 5-15 dias habiles segun zona.",
        },
      },
      {
        "@type": "Question",
        name: "Es mejor DTG que serigrafia o sublimacion?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DTG es superior para personalizacion: sin minimos (serigrafia pide 50+), sin limitacion de colores (serigrafia cobra por color), funciona en claras y oscuras (sublimacion solo en sinteticas claras), y cada prenda puede ser diferente. La serigrafia conviene solo para tirajes de 500+ unidades del mismo diseno.",
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
        name: "Estampar Remeras",
        item: "https://www.novamente.ar/estampar-remeras",
      },
    ],
  }

  const methods = [
    {
      name: "DTG (Direct-To-Garment)",
      badge: "Lo que usamos",
      highlight: true,
      pros: ["Desde 1 unidad", "Colores ilimitados", "Claras y oscuras", "Cada diseno diferente", "Tacto suave", "50+ lavados"],
      cons: [],
      ideal: "Ideal para personalizacion, pedidos chicos y medianos, disenos unicos",
    },
    {
      name: "Serigrafia",
      badge: "Tradicional",
      highlight: false,
      pros: ["Barato en +500 un.", "Alta durabilidad"],
      cons: ["Minimo 50+ unidades", "1 chapa por color ($$$)", "Mismo diseno obligatorio", "Setup lento"],
      ideal: "Solo conviene para tirajes grandes del mismo diseno",
    },
    {
      name: "Sublimacion",
      badge: "Limitado",
      highlight: false,
      pros: ["Full-print posible", "Colores vivos"],
      cons: ["Solo telas sinteticas", "Solo colores claros", "Se siente plastico", "No funciona en algodon"],
      ideal: "Solo para poliester blanco (deportivo)",
    },
  ]

  const pricingTiers = [
    { garment: "Musculosa Bali", price: 21800, description: "Morley, ideal verano" },
    { garment: "Remera Crop Mujer", price: 23500, description: "Crop top moderno" },
    { garment: "Remera Clasica", price: 28600, description: "Fit regular, unisex/mujer" },
    { garment: "Aura Oversize T-Shirt", price: 31000, description: "La mas vendida", popular: true },
    { garment: "Buzo Cuello Redondo", price: 43000, description: "Crewneck oversize" },
    { garment: "Buzo Hoodie Oversize", price: 55000, description: "Hoodie oversize" },
    { garment: "Buzo Hoodie Oversize", price: 55000, description: "Hoodie oversize" },
  ]

  const steps = [
    {
      number: "01",
      icon: ImageIcon,
      title: "Trae tu diseno o crealo con IA",
      description: "Subi tu archivo (PNG, JPG, SVG) o describe tu idea y nuestra IA genera el diseno en segundos. 37 estilos artisticos disponibles.",
    },
    {
      number: "02",
      icon: Shirt,
      title: "Elegi la prenda",
      description: "Remera oversize, clasica, crop, musculosa, buzo o hoodie. Algodon 100%, talles S a XXL, multiples colores.",
    },
    {
      number: "03",
      icon: Printer,
      title: "Estampamos con DTG",
      description: "Impresion directa sobre la tela con tintas de agua. Colores vibrantes, tacto suave, durabilidad de 50+ lavados.",
    },
    {
      number: "04",
      icon: Truck,
      title: "Te lo enviamos",
      description: "Produccion en 2-5 dias. Envio AMBA 3-5 dias ($5.500), Interior BA 5-7 dias ($7.000), Resto del pais 7-10 dias ($9.000).",
    },
  ]

  const advantages = [
    { icon: Zap, title: "Sin minimos", description: "Estampamos desde 1 unidad. No necesitas pedir 50 o 100 como en serigrafia." },
    { icon: Palette, title: "Colores ilimitados", description: "DTG imprime millones de colores sin costo extra. Sin chapas, sin limitaciones." },
    { icon: Droplets, title: "Tintas de agua", description: "Tacto suave, no se siente la tinta. La estampa es parte de la tela, no una capa encima." },
    { icon: Shield, title: "50+ lavados", description: "Durabilidad profesional. Lavar del reves, agua fria, sin secadora para maxima vida util." },
    { icon: Sparkles, title: "Diseno con IA", description: "No tenes diseno? Nuestra IA genera uno unico en segundos a partir de tu idea." },
    { icon: Clock, title: "Entrega rapida", description: "Produccion 2-5 dias habiles. Sin tiempos de setup ni esperas por matriceria." },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="min-h-screen bg-black text-white">
        {/* Breadcrumb */}
        <nav className="max-w-6xl mx-auto px-4 pt-4 pb-2" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-zinc-500">
            <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
            <li>/</li>
            <li className="text-zinc-300">Estampar Remeras</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-black to-black" />
          <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-otono-streetwear.webp"
              alt="Resultado de estampado DTG en hoodie gris Novamente"
            />
            <Badge className="mb-6 bg-orange-500/20 text-orange-300 border-orange-500/30 text-sm px-4 py-1">
              <Printer className="w-4 h-4 mr-1" /> Servicio de Estampado DTG
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Estampar Remeras
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                con tecnologia DTG premium
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto mb-8">
              Servicio de estampado directo sobre tela con la mejor tecnologia.
              Trae tu diseno o crealo con nuestra IA. Desde 1 unidad,
              sin matriceria, sin minimos. Colores vibrantes que duran 50+ lavados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-500 text-white text-lg px-8 py-6">
                <Link href="/design">
                  <Sparkles className="w-5 h-5 mr-2" /> Estampa Tu Remera Ahora
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 text-lg px-8 py-6">
                <Link
                  href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Quiero%20estampar%20remeras.%20Me%20pueden%20asesorar%20sobre%20el%20servicio%20DTG%3F%20(ref%20%C2%B7%20NV-EST)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5 mr-2" /> Consultar por WhatsApp
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Prenda + estampado desde $21.800</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Desde 1 unidad</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sin matriceria</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Envio a todo el pais</span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-zinc-800 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-orange-400">1,500+</p>
              <p className="text-sm text-zinc-400">Prendas estampadas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">50+</p>
              <p className="text-sm text-zinc-400">Lavados de durabilidad</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">4.9/5</p>
              <p className="text-sm text-zinc-400">Rating clientes</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-cyan-400">2-5 dias</p>
              <p className="text-sm text-zinc-400">Produccion</p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Como funciona el servicio de estampado
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            En 4 pasos simples tenes tu remera estampada y lista para usar
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step) => (
              <Card key={step.number} className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all">
                <CardContent className="p-6 text-center">
                  <span className="text-4xl font-bold text-orange-500/30">{step.number}</span>
                  <div className="flex justify-center my-4">
                    <step.icon className="w-10 h-10 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-400">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* DTG advantages */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Por que estampar con DTG
            </h2>
            <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
              Direct-To-Garment es la tecnologia de estampado mas avanzada del mercado
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {advantages.map((adv) => (
                <div key={adv.title} className="flex gap-4 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <adv.icon className="w-8 h-8 text-orange-400 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{adv.title}</h3>
                    <p className="text-sm text-zinc-400">{adv.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Method comparison */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            DTG vs Serigrafia vs Sublimacion
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Compara los metodos de estampado y entende por que DTG es la mejor opcion para personalizacion
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {methods.map((method) => (
              <Card
                key={method.name}
                className={`bg-zinc-900 ${method.highlight ? "border-orange-500/50 ring-1 ring-orange-500/20" : "border-zinc-800"}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={method.highlight
                      ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }>
                      {method.badge}
                    </Badge>
                    {method.highlight && <ThumbsUp className="w-5 h-5 text-orange-400" />}
                  </div>
                  <h3 className="text-lg font-semibold mb-4">{method.name}</h3>
                  {method.pros.length > 0 && (
                    <div className="mb-3">
                      {method.pros.map((pro) => (
                        <p key={pro} className="text-sm text-emerald-400 flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {pro}
                        </p>
                      ))}
                    </div>
                  )}
                  {method.cons.length > 0 && (
                    <div className="mb-3">
                      {method.cons.map((con) => (
                        <p key={con} className="text-sm text-red-400/70 flex items-center gap-2 mb-1">
                          <span className="w-3.5 h-3.5 shrink-0 text-center">✕</span> {con}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-800">{method.ideal}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-6">
            <Button asChild variant="link" className="text-orange-400 hover:text-orange-300">
              <Link href="/dtg-vs-serigrafia">
                Ver comparacion detallada <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Precios de estampado (prenda incluida)
            </h2>
            <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
              El precio incluye la prenda de algodon 100% + el estampado DTG. Sin costos ocultos
            </p>
            <div className="max-w-2xl mx-auto space-y-3">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.garment}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    tier.popular
                      ? "bg-orange-500/10 border-orange-500/30"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {tier.popular && (
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                        Popular
                      </Badge>
                    )}
                    <div>
                      <p className="font-semibold">{tier.garment}</p>
                      <p className="text-xs text-zinc-500">{tier.description}</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-white">
                    ${tier.price.toLocaleString("es-AR")}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-zinc-500 mt-6">
              Todos los precios en ARS. Incluye prenda + estampado DTG. Envio aparte.
            </p>
          </div>
        </section>

        {/* Volume discounts */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Descuentos por cantidad
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Necesitas estampar varias? Cuantas mas pidas, mejor precio
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="p-6">
                <p className="text-4xl font-bold text-orange-400 mb-2">5%</p>
                <p className="text-lg font-semibold mb-1">10 - 24 unidades</p>
                <p className="text-sm text-zinc-400">Ej: Oversize a $29.450</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-orange-500/50 text-center ring-1 ring-orange-500/20">
              <CardContent className="p-6">
                <Badge className="mb-2 bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">Popular</Badge>
                <p className="text-4xl font-bold text-amber-400 mb-2">10%</p>
                <p className="text-lg font-semibold mb-1">25 - 99 unidades</p>
                <p className="text-sm text-zinc-400">Ej: Oversize a $27.900</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="p-6">
                <p className="text-4xl font-bold text-emerald-400 mb-2">15%</p>
                <p className="text-lg font-semibold mb-1">100+ unidades</p>
                <p className="text-sm text-zinc-400">Ej: Oversize a $26.350</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-500 text-white">
              <Link href="/cotizador">
                <Layers className="w-5 h-5 mr-2" /> Calcular mi presupuesto
              </Link>
            </Button>
          </div>
        </section>

        {/* Use cases */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Que podes estampar
            </h2>
            <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
              Nuestro servicio de estampado DTG se adapta a cualquier necesidad
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Tu propio diseno", description: "Subi tu arte, logo o ilustracion. PNG, JPG o SVG.", link: "/design" },
                { title: "Diseno con IA", description: "Describe tu idea en palabras y la IA crea el diseno.", link: "/design" },
                { title: "Remeras para eventos", description: "Maratones, conferencias, festivales. 10-500+ un.", link: "/remeras-para-eventos" },
                { title: "Merch para tu marca", description: "Lanza tu linea de ropa personalizada sin stock.", link: "/lanza-tu-marca" },
                { title: "Regalos corporativos", description: "Merch empresarial con logo y branding.", link: "/regalos-empresariales" },
                { title: "Pedidos por mayor", description: "Desde 10 un. con descuento. Revendedores y ferias.", link: "/remeras-por-mayor" },
              ].map((useCase) => (
                <Link key={useCase.title} href={useCase.link}>
                  <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all h-full group cursor-pointer">
                    <CardContent className="p-5">
                      <h3 className="font-semibold mb-1 group-hover:text-orange-300 transition-colors">
                        {useCase.title}
                      </h3>
                      <p className="text-sm text-zinc-400">{useCase.description}</p>
                      <span className="text-xs text-orange-400 mt-2 inline-flex items-center">
                        Ver mas <ArrowRight className="w-3 h-3 ml-1" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Lo que dicen de nuestro estampado
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Agustin P.",
                role: "Disenador grafico",
                text: "Traje mis ilustraciones y el resultado DTG es increible. Los colores salieron exactos al archivo original. Ya mando todos mis trabajos aca.",
                rating: 5,
              },
              {
                name: "Valentina L.",
                role: "Organizadora de eventos",
                text: "Estampamos 150 remeras para una maraton en 7 dias. Cada una con numero diferente y el logo del evento. Impecable el servicio y el precio con descuento.",
                rating: 5,
              },
              {
                name: "Nicolas D.",
                role: "Fundador de marca de ropa",
                text: "Probe serigrafia, sublimacion y DTG. DTG gana lejos en calidad y flexibilidad. Ahora produzco on-demand y no tengo stock muerto.",
                rating: 5,
              },
            ].map((testimonial) => (
              <Card key={testimonial.name} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-300 mb-4 italic">&ldquo;{testimonial.text}&rdquo;</p>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-zinc-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Preguntas frecuentes sobre estampado
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Cuanto sale estampar una remera?",
                  a: "El precio incluye prenda + estampado: Oversize $31.000, Clasica $28.600, Crop $23.500, Musculosa $21.800, Buzos desde $43.000, Hoodies desde $55.000. Sin costos de setup ni minimos.",
                },
                {
                  q: "Que metodo de estampado usan?",
                  a: "DTG (Direct-To-Garment): impresion digital directa sobre la tela con tintas de agua. Colores vibrantes, tacto suave, 50+ lavados. Funciona en telas claras y oscuras.",
                },
                {
                  q: "Puedo traer mi propio diseno?",
                  a: "Si. Acepta PNG, JPG o SVG. Tambien podes crear un diseno con nuestra IA en segundos o combinar ambos.",
                },
                {
                  q: "Hay minimo de unidades?",
                  a: "No. Con DTG estampamos desde 1 unidad. Cada prenda puede tener un diseno diferente sin costo extra. Para 10+ unidades hay descuentos por volumen.",
                },
                {
                  q: "Cuanto tarda?",
                  a: "Produccion: 2-5 dias habiles. Envio: AMBA 3-5 dias ($5.500), Interior BA 5-7 dias ($7.000), Resto del pais 7-10 dias ($9.000).",
                },
                {
                  q: "DTG es mejor que serigrafia?",
                  a: "Para personalizacion si: sin minimos, colores ilimitados, cada prenda diferente. La serigrafia solo conviene para 500+ unidades del mismo diseno exacto.",
                },
              ].map((faq) => (
                <Card key={faq.q} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-sm text-zinc-400">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Estampa tu diseno hoy
            </h2>
            <p className="text-lg text-zinc-300 mb-8 max-w-2xl mx-auto">
              Trae tu diseno o crealo con IA. En menos de 5 minutos tenes tu pedido listo.
              Sin minimos, sin matriceria, sin complicaciones. Estampado DTG premium sobre algodon 100%.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-500 text-white text-lg px-8 py-6">
                <Link href="/design">
                  <Sparkles className="w-5 h-5 mr-2" /> Empeza a Estampar
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 text-lg px-8 py-6">
                <Link
                  href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Quiero%20estampar%20remeras%20con%20DTG.%20Me%20pasan%20info%3F%20(ref%20%C2%B7%20NV-EST-DTG)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
