import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import {
  Package, Star, Shield, Clock, CheckCircle2,
  Truck, Palette, Sparkles, ArrowRight,
  Users, Zap, Heart, PartyPopper, Music,
  Trophy, Briefcase, GraduationCap, ShoppingBag,
  Shirt, Paintbrush, Layers
} from "lucide-react"

export const metadata: Metadata = {
  title: "Remeras Personalizadas Argentina con IA y DTG",
  description:
    "Remeras personalizadas con inteligencia artificial y estampado DTG premium. Desde 1 unidad, sin minimos. Oversize, classic, crop y musculosas en algodon 100%. Descuentos por cantidad. Envios a toda Argentina. Disena online en minutos.",
  keywords: [
    "remeras personalizadas",
    "remeras personalizadas argentina",
    "remeras estampadas personalizadas",
    "remeras custom",
    "remeras con estampa personalizada",
    "hacer remeras personalizadas",
    "remeras personalizadas online",
    "remeras personalizadas por unidad",
    "remeras personalizadas buenos aires",
    "remeras estampadas",
    "remeras con diseno propio",
    "estampar remeras",
    "remeras personalizadas baratas",
    "remeras DTG",
    "remeras con IA",
  ],
  openGraph: {
    title: "Remeras Personalizadas con IA — Novamente Argentina",
    description:
      "Disena remeras unicas con inteligencia artificial. Estampado DTG premium, algodon 100%, desde 1 unidad. Envios a toda Argentina.",
    url: "https://www.novamente.ar/remeras-personalizadas",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/oversize-negro-front.jpeg",
        width: 800,
        height: 800,
        alt: "Remeras personalizadas con IA — Novamente Argentina",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Remeras Personalizadas con IA — Novamente",
    description:
      "Disena remeras unicas con inteligencia artificial. Estampado DTG premium desde 1 unidad. Envios a toda Argentina.",
  },
  alternates: { canonical: "https://www.novamente.ar/remeras-personalizadas" },
}

export default function RemerasPersonalizadas() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Remeras Personalizadas con IA — Novamente",
    description:
      "Servicio de personalizacion de remeras con inteligencia artificial y estampado DTG premium. Desde 1 unidad sin minimos de cantidad. Oversize, classic, crop y musculosas en algodon 100%. Produccion on-demand y envios a toda Argentina.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Personalizacion de Indumentaria con IA",
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
          text: "Desde $21.800 (musculosa) hasta $55.000 (Buzo Hoodie Oversize). La remera oversize mas popular cuesta $31.000. El precio incluye la prenda + el estampado DTG. No hay costos de setup, matriceria ni minimos de cantidad.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo pedir una sola remera personalizada?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. Producimos desde 1 unidad al mismo precio y calidad que 100. Gracias a la tecnologia DTG no hay minimos de cantidad ni costos de setup por diseno. Cada remera puede tener un estampado diferente.",
        },
      },
      {
        "@type": "Question",
        name: "Como funciona el diseno con inteligencia artificial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Describis tu idea en palabras (ej: 'un astronauta surfeando en Marte') y nuestra IA genera un diseno unico en segundos. Podes elegir entre 37 estilos artisticos (acuarela, anime, minimalista, etc.) o subir tu propio diseno. Todo el proceso es online y tarda menos de 5 minutos.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tarda en llegar mi remera personalizada?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La produccion tarda 2-5 dias habiles. El envio depende de la zona: AMBA 3-5 dias ($5.500), Interior BA 5-7 dias ($7.000), Resto del pais 7-10 dias ($9.000). Total desde que pedis hasta que llega: 5-15 dias habiles segun zona.",
        },
      },
      {
        "@type": "Question",
        name: "Que es el estampado DTG y cuanto dura?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DTG (Direct-To-Garment) es impresion directa sobre la tela con tintas de agua. El resultado es suave al tacto, con colores vibrantes y durabilidad profesional (50+ lavados). Es superior a la sublimacion (solo para telas claras sinteticas) y a la serigrafia (requiere altos minimos por diseno).",
        },
      },
      {
        "@type": "Question",
        name: "Puedo subir mi propio diseno en vez de usar la IA?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. Podes subir tu diseno, logo o ilustracion en formato PNG, JPG o SVG. Tambien podes combinar: generar una base con IA y retocarla, o subir tu logo y que la IA genere un fondo. El diseno es tuyo, Novamente solo produce la prenda.",
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
        name: "Remeras Personalizadas",
        item: "https://www.novamente.ar/remeras-personalizadas",
      },
    ],
  }

  const products = [
    {
      name: "Aura Oversize T-Shirt",
      price: 31000,
      badge: "Mas vendida",
      description: "Corte oversize, algodon 100%, 4 colores. La favorita de nuestros clientes.",
      colors: "Blanco, Negro, Marron, Stone Wash",
      link: "/products",
    },
    {
      name: "Aldea Classic Fit",
      price: 28600,
      badge: "Clasica",
      description: "Fit regular, ideal para estampados limpios y profesionales.",
      colors: "Negro, Blanco",
      link: "/products",
    },
    {
      name: "Remera Clasica Mujer",
      price: 28600,
      badge: "Mujer",
      description: "Corte femenino, algodon suave, ideal para disenos delicados.",
      colors: "Blanca, Negra",
      link: "/products",
    },
    {
      name: "Remera Crop Mujer",
      price: 23500,
      badge: "Tendencia",
      description: "Crop top moderno, ideal para looks casuales y streetwear.",
      colors: "Negra, Chocolate, Gris, Amarillo",
      link: "/products",
    },
    {
      name: "Musculosa Bali",
      price: 21800,
      badge: "Desde $21.800",
      description: "Musculosa morley, perfecta para verano y looks urbanos.",
      colors: "Blanca, Negra, Gris",
      link: "/products",
    },
    {
      name: "Buzo Hoodie Oversize",
      price: 55000,
      badge: "Premium",
      description: "Hoodie oversize con capucha, algodon pesado, maximo impacto visual.",
      colors: "Negro, Marron, Crema, Gris Melange",
      link: "/products",
    },
  ]

  const nichePages = [
    {
      icon: Heart,
      title: "Despedidas de Soltero/a",
      description: "Remeras grupales para despedidas con disenos divertidos y personalizados.",
      link: "/despedidas-personalizadas",
      color: "text-pink-400",
    },
    {
      icon: PartyPopper,
      title: "Cumpleanos",
      description: "Remeras de cumple para todas las edades: infantiles, 15, 18, 30, 40, 50+.",
      link: "/remeras-cumpleanos",
      color: "text-amber-400",
    },
    {
      icon: GraduationCap,
      title: "Egresados 2026",
      description: "Buzos y remeras de egresados con nombre de cada alumno.",
      link: "/buzos-egresados",
      color: "text-blue-400",
    },
    {
      icon: Trophy,
      title: "Equipos Deportivos",
      description: "Camisetas personalizadas para futbol, hockey, paddle, running.",
      link: "/indumentaria-deportiva",
      color: "text-emerald-400",
    },
    {
      icon: Music,
      title: "Bandas y Musicos",
      description: "Merch para shows, giras y venta a fans. Desde 1 unidad.",
      link: "/merch-para-bandas",
      color: "text-purple-400",
    },
    {
      icon: Briefcase,
      title: "Empresas",
      description: "Regalos corporativos, uniformes y merch empresarial con descuentos.",
      link: "/regalos-empresariales",
      color: "text-cyan-400",
    },
    {
      icon: Users,
      title: "Creadores de Contenido",
      description: "Merch para YouTubers, streamers e influencers. Tienda propia gratis.",
      link: "/merch-para-creadores",
      color: "text-rose-400",
    },
    {
      icon: ShoppingBag,
      title: "Eventos y Maratones",
      description: "Remeras para conferencias, festivales, carreras solidarias, 10-500+ un.",
      link: "/remeras-para-eventos",
      color: "text-orange-400",
    },
  ]

  const steps = [
    {
      number: "01",
      icon: Sparkles,
      title: "Disena con IA",
      description: "Describe tu idea en palabras o subi tu diseno. Nuestra IA genera estampas unicas en segundos. Elegis entre 37 estilos artisticos.",
    },
    {
      number: "02",
      icon: Shirt,
      title: "Elegi tu prenda",
      description: "Remera oversize, classic, crop, musculosa, buzo o hoodie. En blanco, negro y mas colores. Talles S a XXL.",
    },
    {
      number: "03",
      icon: Paintbrush,
      title: "Produccion DTG",
      description: "Estampamos tu diseno con impresion directa sobre tela (DTG). Colores vibrantes, tacto suave, 50+ lavados de durabilidad.",
    },
    {
      number: "04",
      icon: Truck,
      title: "Envio a todo el pais",
      description: "Produccion en 2-5 dias. Envio AMBA 3-5 dias ($5.500), Interior BA 5-7 dias ($7.000), Resto del pais 7-10 dias ($9.000).",
    },
  ]

  const advantages = [
    { icon: Zap, title: "Desde 1 unidad", description: "Sin minimos. 1 remera o 500 al mismo precio unitario." },
    { icon: Sparkles, title: "Diseno con IA", description: "Genera estampas unicas describiendo tu idea. 37 estilos." },
    { icon: Palette, title: "Sin costo de setup", description: "Sin matriceria, sin chapas. Cada diseno diferente sin cargo extra." },
    { icon: Shield, title: "DTG premium", description: "Impresion directa sobre tela. Colores vibrantes, 50+ lavados." },
    { icon: Package, title: "Algodon 100%", description: "Tela premium 24/1 peinado. Suave, durable, respirable." },
    { icon: Clock, title: "Produccion rapida", description: "2-5 dias habiles. Envios a toda Argentina." },
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
            <li className="text-zinc-300">Remeras Personalizadas</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-black to-black" />
          <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-remeras-personalizadas.webp"
              alt="Remera oversize negra personalizada Novamente con estampa generada con IA en CABA"
            />
            <Badge className="mb-6 bg-violet-500/20 text-violet-300 border-violet-500/30 text-sm px-4 py-1">
              <Sparkles className="w-4 h-4 mr-1" /> Diseno con Inteligencia Artificial
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Remeras Personalizadas
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                Unicas como tu idea
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto mb-8">
              Describe tu idea, nuestra IA la convierte en un diseno unico,
              y lo estampamos en DTG premium sobre algodon 100%.
              Desde 1 unidad, sin minimos, con envio a toda Argentina.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-500 text-white text-lg px-8 py-6">
                <Link href="/crear">
                  <Sparkles className="w-5 h-5 mr-2" /> Disena Tu Remera Ahora
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 text-lg px-8 py-6">
                <Link href="/cotizador">
                  <Package className="w-5 h-5 mr-2" /> Cotizar por Cantidad
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Desde $21.800</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Desde 1 unidad</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Envio a todo el pais</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Produccion en 2-5 dias</span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-zinc-800 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-violet-400">1,500+</p>
              <p className="text-sm text-zinc-400">Disenos creados</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-fuchsia-400">37</p>
              <p className="text-sm text-zinc-400">Estilos de IA</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">4.9/5</p>
              <p className="text-sm text-zinc-400">Rating clientes</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">2-5 dias</p>
              <p className="text-sm text-zinc-400">Produccion</p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Como funciona
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            En 4 pasos simples tenes tu remera personalizada en la puerta de tu casa
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step) => (
              <Card key={step.number} className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all">
                <CardContent className="p-6 text-center">
                  <span className="text-4xl font-bold text-violet-500/30">{step.number}</span>
                  <div className="flex justify-center my-4">
                    <step.icon className="w-10 h-10 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-400">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Advantages */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Por que elegir Novamente
            </h2>
            <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
              La unica marca argentina que combina inteligencia artificial + estampado DTG premium + produccion on-demand
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {advantages.map((adv) => (
                <div key={adv.title} className="flex gap-4 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <adv.icon className="w-8 h-8 text-violet-400 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{adv.title}</h3>
                    <p className="text-sm text-zinc-400">{adv.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Nuestras prendas
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Todas en algodon 100% premium. Elegí la que mas te guste y personalízala con tu diseno
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.name} className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                      {product.badge}
                    </Badge>
                    <span className="text-2xl font-bold text-white">
                      ${product.price.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-violet-300 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-zinc-400 mb-2">{product.description}</p>
                  <p className="text-xs text-zinc-500">Colores: {product.colors}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800">
              <Link href="/products">
                Ver catalogo completo <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Volume discounts */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Descuentos por cantidad
            </h2>
            <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
              Cuantas mas pidas, menos pagas. Ideal para grupos, empresas y eventos
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Card className="bg-zinc-900 border-zinc-800 text-center">
                <CardContent className="p-6">
                  <p className="text-4xl font-bold text-violet-400 mb-2">5%</p>
                  <p className="text-lg font-semibold mb-1">10 - 24 unidades</p>
                  <p className="text-sm text-zinc-400">Ej: Remera Oversize a $29.450</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-violet-500/50 text-center ring-1 ring-violet-500/20">
                <CardContent className="p-6">
                  <Badge className="mb-2 bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">Popular</Badge>
                  <p className="text-4xl font-bold text-fuchsia-400 mb-2">10%</p>
                  <p className="text-lg font-semibold mb-1">25 - 99 unidades</p>
                  <p className="text-sm text-zinc-400">Ej: Remera Oversize a $27.900</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800 text-center">
                <CardContent className="p-6">
                  <p className="text-4xl font-bold text-emerald-400 mb-2">15%</p>
                  <p className="text-lg font-semibold mb-1">100+ unidades</p>
                  <p className="text-sm text-zinc-400">Ej: Remera Oversize a $26.350</p>
                </CardContent>
              </Card>
            </div>
            <div className="text-center mt-8">
              <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-500 text-white">
                <Link href="/cotizador">
                  <Layers className="w-5 h-5 mr-2" /> Calcular mi presupuesto
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Niche pages hub */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Remeras personalizadas para cada ocasion
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Sea cual sea tu necesidad, tenemos la solucion. Hacé click para ver mas detalles
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {nichePages.map((niche) => (
              <Link key={niche.title} href={niche.link}>
                <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all h-full group cursor-pointer">
                  <CardContent className="p-5">
                    <niche.icon className={`w-8 h-8 ${niche.color} mb-3`} />
                    <h3 className="font-semibold mb-1 group-hover:text-violet-300 transition-colors">
                      {niche.title}
                    </h3>
                    <p className="text-sm text-zinc-400">{niche.description}</p>
                    <span className="text-xs text-violet-400 mt-2 inline-flex items-center">
                      Ver mas <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Link href="/uniformes-personalizados">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all h-full group cursor-pointer">
                <CardContent className="p-5">
                  <Shirt className="w-8 h-8 text-sky-400 mb-3" />
                  <h3 className="font-semibold mb-1 group-hover:text-violet-300 transition-colors">Uniformes</h3>
                  <p className="text-sm text-zinc-400">Uniformes para empresas, gastronomia, fitness y mas.</p>
                  <span className="text-xs text-violet-400 mt-2 inline-flex items-center">Ver mas <ArrowRight className="w-3 h-3 ml-1" /></span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/remeras-por-mayor">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all h-full group cursor-pointer">
                <CardContent className="p-5">
                  <ShoppingBag className="w-8 h-8 text-amber-400 mb-3" />
                  <h3 className="font-semibold mb-1 group-hover:text-violet-300 transition-colors">Por Mayor</h3>
                  <p className="text-sm text-zinc-400">Desde 10 unidades con descuento. Ideal revendedores y ferias.</p>
                  <span className="text-xs text-violet-400 mt-2 inline-flex items-center">Ver mas <ArrowRight className="w-3 h-3 ml-1" /></span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/lanza-tu-marca">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all h-full group cursor-pointer">
                <CardContent className="p-5">
                  <Sparkles className="w-8 h-8 text-fuchsia-400 mb-3" />
                  <h3 className="font-semibold mb-1 group-hover:text-violet-300 transition-colors">Lanza tu Marca</h3>
                  <p className="text-sm text-zinc-400">Crea tu marca de ropa sin inversion. Tienda online gratis.</p>
                  <span className="text-xs text-violet-400 mt-2 inline-flex items-center">Ver mas <ArrowRight className="w-3 h-3 ml-1" /></span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Lo que dicen nuestros clientes
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: "Lucia M.",
                  role: "Compradora individual",
                  text: "Pedi una remera con un diseno que la IA me genero en 10 segundos. Llego en 5 dias, la calidad del estampado es increible. Ya pedi 3 mas para regalar.",
                  rating: 5,
                },
                {
                  name: "Martin R.",
                  role: "Organizador de cumpleanos de 30",
                  text: "Hicimos 25 remeras para el cumple de mi hermano, cada una con un apodo distinto. El descuento grupal nos vino barbaro y quedaron espectaculares.",
                  rating: 5,
                },
                {
                  name: "Carolina S.",
                  role: "Fundadora de marca streetwear",
                  text: "Arranque con 10 remeras para probar, ahora produzco 200/mes. La calidad DTG es impresionante y no tuve que invertir un peso en stock al principio.",
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
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Cuanto cuesta una remera personalizada?",
                a: "Desde $21.800 (musculosa) hasta $55.000 (Buzo Hoodie Oversize). La remera oversize mas popular cuesta $31.000. El precio incluye la prenda + el estampado DTG. No hay costos de setup ni minimos.",
              },
              {
                q: "Puedo pedir 1 sola unidad?",
                a: "Si. Producimos desde 1 unidad al mismo precio y calidad. Con DTG no hay minimos de cantidad ni costos de setup por diseno.",
              },
              {
                q: "Como funciona el diseno con IA?",
                a: "Describis tu idea en palabras y la IA genera un diseno unico en segundos. Elegis entre 37 estilos artisticos. Tambien podes subir tu propio diseno.",
              },
              {
                q: "Cuanto tarda en llegar?",
                a: "Produccion: 2-5 dias. Envio: AMBA 3-5 dias ($5.500), Interior BA 5-7 dias ($7.000), Resto del pais 7-10 dias ($9.000).",
              },
              {
                q: "Que es DTG y cuanto dura?",
                a: "DTG (Direct-To-Garment) es impresion directa sobre tela. Colores vibrantes, tacto suave, durabilidad de 50+ lavados. Superior a sublimacion y serigrafia para personalizacion.",
              },
              {
                q: "Puedo subir mi propio diseno?",
                a: "Si. Subi tu diseno en PNG, JPG o SVG. Tambien podes combinar IA + tu logo. El diseno es tuyo.",
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
        </section>

        {/* Final CTA */}
        <section className="border-t border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tu idea merece existir
            </h2>
            <p className="text-lg text-zinc-300 mb-8 max-w-2xl mx-auto">
              En menos de 5 minutos podes tener tu remera personalizada con un diseno unico
              creado por inteligencia artificial. Sin minimos, sin esperas, sin complicaciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-500 text-white text-lg px-8 py-6">
                <Link href="/crear">
                  <Sparkles className="w-5 h-5 mr-2" /> Empeza a Disenar
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 text-lg px-8 py-6">
                <Link
                  href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Quiero%20hacer%20remeras%20personalizadas.%20Me%20pueden%20asesorar%3F%20(ref%20%C2%B7%20NV-REM-PERS)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
