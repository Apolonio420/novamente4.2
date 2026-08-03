import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import { SITE_STATS } from "@/lib/site-stats"
import {
  Sparkles, PartyPopper, Users, ArrowRight, Star, Truck,
  Shield, Clock, CheckCircle2, Palette, Package,
  Cake, Baby, Crown, Gift, Camera, Heart
} from "lucide-react"

export const metadata: Metadata = {
  title: "Remeras de Cumpleanos Personalizadas con IA",
  description:
    "Remeras y buzos personalizados para cumpleanos: infantiles, 15 anos, 18, 30, 40, 50 y mas. Disena con IA en minutos. Grupos de 5 a 50+ personas. Estampado DTG premium, algodon 100%. Envios a toda Argentina.",
  keywords: [
    "remeras de cumpleanos personalizadas",
    "remeras para cumple",
    "remeras cumpleanos 15",
    "remeras cumpleanos 30",
    "remeras cumpleanos 40",
    "remeras cumpleanos 50",
    "remeras para fiesta de cumpleanos",
    "remeras personalizadas cumpleanos argentina",
    "buzos de cumpleanos personalizados",
    "remeras tematicas cumpleanos",
    "remeras para cumple infantil",
    "remeras grupo cumpleanos",
  ],
  openGraph: {
    title: "Remeras de Cumpleanos Personalizadas con IA — Novamente",
    description:
      "Remeras y buzos personalizados para cumpleanos. Grupos de 5 a 50+. Disena con IA en minutos. DTG premium, algodon 100%.",
    url: "https://www.novamente.ar/remeras-cumpleanos",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/remera-blanca-front.jpeg",
        width: 800,
        height: 800,
        alt: "Remeras personalizadas para cumpleanos — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Remeras de Cumpleanos Personalizadas con IA — Novamente",
    description:
      "Remeras personalizadas para cumpleanos. Disena con IA. Grupos de 5 a 50+. DTG premium. Descuentos grupales.",
  },
  alternates: { canonical: "https://www.novamente.ar/remeras-cumpleanos" },
}

export default function RemerasCumpleanos() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Remeras de Cumpleanos Personalizadas — Novamente",
    description:
      "Servicio de remeras y buzos personalizados con inteligencia artificial para cumpleanos: infantiles, 15 anos, 18, 30, 40, 50 y tematicos. Estampado DTG premium sobre algodon 100%. Grupos de 5 a 50+ personas con descuentos grupales.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Remeras Personalizadas para Cumpleanos",
    areaServed: {
      "@type": "Country",
      name: "Argentina",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: 21800,
      highPrice: 55000,
      priceCurrency: "ARS",
      offerCount: 26,
      availability: "https://schema.org/InStock",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cuanto cuestan las remeras personalizadas para cumpleanos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Las remeras arrancan desde $28.600 (classic fit) y $31.000 (oversize). Musculosas desde $21.800. Hoodies desde $43.000. Descuentos grupales: 5% en 10-24 un. y 10% en 25+ unidades. Un grupo de 15 remeras classic sale $27.170/un. (5% OFF).",
        },
      },
      {
        "@type": "Question",
        name: "Puedo disenar las remeras con IA para el cumple?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, nuestra IA genera disenos unicos para tu cumple en minutos. Describis la tematica (ej: 'cumple 30 estilo tropical con flamencos') y la IA crea opciones profesionales. Tambien podes subir tu propio diseno o foto del cumpleanero/a.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tardan en llegar las remeras?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Produccion de 3-5 dias habiles para pedidos de hasta 25 unidades. Para grupos mas grandes (25+), 5-7 dias habiles. Envio a todo el pais en 2-5 dias adicionales. Recomendamos pedir con 2 semanas de anticipacion al cumple.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo pedir talles diferentes en un mismo pedido?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, cada remera puede ser de un talle diferente (S a XXL). Ideal para grupos de amigos o familia donde cada persona tiene su talle. El precio es el mismo sin importar el talle.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo personalizar cada remera con el nombre de cada persona?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, con estampado DTG cada remera puede tener personalizacion individual: nombre, apodo, numero, o rol ('La cumpleanera', 'El padre', 'La amiga loca'). Cada prenda se imprime individualmente.",
        },
      },
      {
        "@type": "Question",
        name: "Que tipo de cumpleanos cubren?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Todos: cumples infantiles (1-12 anos), quince anos, 18 anos, cumpleanos de adultos (30, 40, 50, 60+), cumples tematicos (decadas, peliculas, series), y celebraciones especiales. Cada cumple tiene su estilo.",
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
        name: "Remeras de Cumpleanos",
        item: "https://www.novamente.ar/remeras-cumpleanos",
      },
    ],
  }

  const useCases = [
    {
      icon: Baby,
      title: "Cumples infantiles",
      description: "Remeras tematicas para el cumple de los mas chicos. Superheroes, princesas, dinosaurios, unicornios. Todos los invitados a juego.",
      example: "15 remeras 'Cumple de Sofi — Unicornios' con nombres",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      icon: Crown,
      title: "Quince anos",
      description: "El cumple mas importante. Remeras para la corte, amigas, familia. Disenos elegantes o divertidos con la IA.",
      example: "20 remeras 'Los 15 de Valentina' con roles personalizados",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: PartyPopper,
      title: "Cumple 18 / mayoría de edad",
      description: "La primera gran fiesta. Remeras para el grupo de amigos con frases epicas, fotos y disenos que nadie se va a sacar.",
      example: "25 remeras '18 primaveras de Nico' con fotos retro",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Cake,
      title: "Cumple 30, 40, 50+",
      description: "Los cumples que se celebran en grande. Humor, nostalgia, memes. Remeras que cuentan la historia del cumpleanero.",
      example: "30 remeras 'Los 40 de Marce — Vintage Edition'",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Camera,
      title: "Cumples tematicos",
      description: "Decadas (70s, 80s, 90s), peliculas, series, memes. La IA disena lo que imagines para la tematica del cumple.",
      example: "12 remeras 'Cumple 90s — Rugrats Edition' con cada personaje",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      icon: Heart,
      title: "Cumples familiares",
      description: "Abuelos, padres, tios. Remeras para toda la familia con foto del homenajeado y mensaje personalizado.",
      example: "18 remeras 'Los 70 del Abuelo Pedro' con foto familiar",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
  ]

  const products = [
    { name: "Remera Classic Fit", price: "$28.600", ideal: "La clasica para cualquier cumple", badge: "Mas elegida", discounted: "$27.170" },
    { name: "Remera Oversize", price: "$31.000", ideal: "Look relajado y moderno", badge: null, discounted: "$29.450" },
    { name: "Musculosa Unisex", price: "$21.800", ideal: "Ideal para cumples de verano", badge: "Menor costo", discounted: "$20.710" },
    { name: "Remera Crop Mujer", price: "$23.500", ideal: "Para cumples de amigas", badge: null, discounted: "$22.325" },
    { name: "Buzo Hoodie Oversize", price: "$55.000", ideal: "Para cumples de invierno", badge: "Premium", discounted: "$52.250" },
    { name: "Buzo Cuello Redondo", price: "$43.000", ideal: "Comodo y abrigado", badge: null, discounted: "$40.850" },
  ]

  const pricingTiers = [
    { range: "1 - 9 un.", discount: "Precio regular", example: "Remera $28.600", tag: null },
    { range: "10 - 24 un.", discount: "5% OFF", example: "Remera $27.170", tag: "Cumple tipico" },
    { range: "25+ un.", discount: "10% OFF", example: "Remera $25.740", tag: "Fieston" },
  ]

  const designIdeas = [
    {
      title: "Retro / Vintage",
      desc: "Fotos de bebe del cumpleanero, tipografia retro, colores sepia. Ideal para 30-40-50.",
      color: "text-amber-400",
    },
    {
      title: "Humor / Memes",
      desc: "Frases epicas, chistes internos del grupo, memes personalizados con la cara del cumpleanero.",
      color: "text-emerald-400",
    },
    {
      title: "Tematico",
      desc: "Peliculas, series, decadas, personajes. La IA recrea tu tematica con estilo unico.",
      color: "text-violet-400",
    },
    {
      title: "Elegante / Minimalista",
      desc: "Tipografia premium, monogramas, disenos sobrios. Perfecto para quince anos y eventos formales.",
      color: "text-pink-400",
    },
  ]

  const testimonials = [
    {
      quote: "Hicimos 25 remeras para los 30 de mi mejor amiga con una foto de cuando eramos chicas y una frase interna. Se morio de risa. Todos las seguimos usando. La calidad del estampado es increible.",
      name: "Florencia M.",
      role: "Cumple 30, grupo de amigas, CABA",
      rating: 5,
    },
    {
      quote: "Para los 15 de mi hija pedi remeras para las 20 chicas de la corte con el nombre de cada una y un diseno que la IA creo con unicornios. Quedo espectacular y nos ahorramos fortunas vs otros presupuestos.",
      name: "Patricia L.",
      role: "Mama, cumple de 15, Cordoba",
      rating: 5,
    },
    {
      quote: "Le hicimos remeras sorpresa al viejo para sus 60 con una foto de el de joven. Lloro de la emocion. Pedimos 18 para toda la familia y cada una tenia el parentesco: 'El hijo mayor', 'La nuera favorita'. Un golazo.",
      name: "Santiago D.",
      role: "Cumple 60, familia, Rosario",
      rating: 5,
    },
  ]

  const whatsappMessage = encodeURIComponent(
    "Hola! Quiero cotizar remeras para un cumpleanos. Es el cumple de [nombre] que cumple [edad]. Somos [cantidad] personas. La tematica es [tematica/idea]. La fecha del cumple es [fecha]."
  )

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

      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <nav className="text-sm text-zinc-500">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-300">Remeras de Cumpleanos</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 via-violet-500/10 to-transparent" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-azotea-blue-hour.webp"
              alt="Remera personalizada Novamente para celebración de cumpleaños"
            />
            <div className="max-w-3xl">
              <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 mb-6">
                <PartyPopper className="w-3 h-3 mr-1" />
                Cumpleanos y celebraciones
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Remeras de cumpleanos{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400">
                  que nadie se saca
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-300 mb-4 leading-relaxed">
                Infantiles, 15 anos, 18, 30, 40, 50 y mas. Disena con IA en minutos
                o subi tu propio diseno. Grupos de{" "}
                <span className="text-white font-semibold">5 a 50+ personas</span>.
                Remeras desde <span className="text-white font-semibold">$27.170</span> con descuento grupal.
                Cada una personalizada con nombre, rol o apodo.
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-zinc-400 mb-8">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-pink-400" /> Personalizacion individual</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-pink-400" /> Diseno IA en minutos</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-pink-400" /> Entrega en 5-7 dias</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white text-lg px-8 py-6"
                >
                  <a
                    href={`https://wa.me/5492235169720?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cotizar para mi cumple
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-lg px-8 py-6"
                >
                  <Link href="/crear">
                    Disenar con IA gratis
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="py-8 bg-zinc-900/70 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-pink-400">300+</div>
                <div className="text-sm text-zinc-400">cumples equipados</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-pink-400">{SITE_STATS.averageRating}</div>
                <div className="text-sm text-zinc-400">calificacion promedio</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-pink-400">5-7 dias</div>
                <div className="text-sm text-zinc-400">produccion standard</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-pink-400">10%</div>
                <div className="text-sm text-zinc-400">OFF en 25+ unidades</div>
              </div>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Remeras para cada tipo de cumple
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Desde el primer anito hasta los 70+. Cada cumpleanos merece remeras que cuenten su historia.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCases.map((uc) => (
                <Card key={uc.title} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${uc.bg} flex items-center justify-center mb-4`}>
                      <uc.icon className={`w-6 h-6 ${uc.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{uc.title}</h3>
                    <p className="text-zinc-400 mb-3">{uc.description}</p>
                    <p className="text-sm text-pink-400 italic">&quot;{uc.example}&quot;</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Como pedir remeras para el cumple
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                En 4 pasos tenes las remeras listas. Pedilo con 2 semanas de anticipacion.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { step: "1", icon: PartyPopper, title: "Contanos el cumple", desc: "De quien es, cuantos anos cumple, cuantos son, y si tenes una tematica o idea en mente." },
                { step: "2", icon: Sparkles, title: "Diseno con IA", desc: "La IA genera opciones unicas para tu cumple. Retro, humor, tematico, elegante. Vos elegis." },
                { step: "3", icon: Package, title: "Produccion DTG", desc: "Cada remera se imprime individualmente. Nombres, roles, talles — todo personalizado." },
                { step: "4", icon: Truck, title: "Llegan al cumple", desc: "Envio a tu domicilio o al salon. Llegan listas para sorprender al cumpleanero/a." },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6 text-pink-400" />
                  </div>
                  <div className="text-sm font-mono text-pink-400 mb-2">Paso {s.step}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-zinc-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Design ideas */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ideas de diseno con IA
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Nuestra IA puede crear cualquier estilo. Describis la idea y genera opciones profesionales en segundos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {designIdeas.map((idea) => (
                <Card key={idea.title} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-5">
                    <Palette className={`w-6 h-6 ${idea.color} mb-3`} />
                    <h3 className="text-lg font-semibold text-white mb-2">{idea.title}</h3>
                    <p className="text-sm text-zinc-400">{idea.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Product grid */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Modelos disponibles
              </h2>
              <p className="text-zinc-400 text-lg">
                Algodon 100% premium. Precio con 5% OFF para grupos de 10+.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.name} className="bg-zinc-900/50 border-zinc-800 hover:border-pink-500/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                      {product.badge && (
                        <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-xs">
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-pink-400">{product.discounted}</span>
                      <span className="text-sm text-zinc-500 line-through">{product.price}</span>
                    </div>
                    <p className="text-sm text-zinc-500">{product.ideal}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button asChild variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                <Link href="/products">
                  Ver todos los modelos y colores <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing tiers */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Descuentos grupales
              </h2>
              <p className="text-zinc-400 text-lg">
                Cuantos mas son en el cumple, mejor el precio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.range}
                  className={`text-center ${tier.tag ? "bg-zinc-800/50 border-pink-500/30 border-2" : "bg-zinc-900/50 border-zinc-800"}`}
                >
                  <CardContent className="p-5">
                    {tier.tag && (
                      <Badge className="bg-pink-600 text-white mb-2 text-xs">{tier.tag}</Badge>
                    )}
                    <div className="text-sm text-zinc-400 mb-1">{tier.range}</div>
                    <div className="text-xl font-bold text-white mb-1">{tier.discount}</div>
                    <div className="text-sm text-zinc-500">{tier.example}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8 p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl max-w-2xl mx-auto">
              <p className="text-pink-300 font-medium">
                Ejemplo: Cumple 30 con 20 amigos — Remera Classic Fit
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                20 x $27.170 = <span className="text-white font-semibold">$543.400</span> total
                (ahorro de $28.600 vs precio regular)
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                Sale $27.170 por persona — menos que una cena
              </p>
            </div>
          </div>
        </section>

        {/* Personalization highlight */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
              Cada remera puede ser unica
            </h2>
            <p className="text-zinc-400 text-lg text-center mb-12 max-w-2xl mx-auto">
              Con DTG, cada prenda se imprime individualmente. Podes personalizar cada una con datos diferentes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, title: "Nombre de cada persona", desc: "Cada remera con el nombre o apodo del invitado.", color: "text-pink-400" },
                { icon: Gift, title: "Rol en el cumple", desc: "'La cumpleanera', 'El mejor amigo', 'La mama orgullosa'.", color: "text-violet-400" },
                { icon: Sparkles, title: "Mismo diseno, datos unicos", desc: "Un diseno base + personalizacion individual por prenda.", color: "text-amber-400" },
                { icon: Shield, title: "Calidad DTG premium", desc: "Algodon 100%. No se despega ni craquela. 50+ lavados.", color: "text-emerald-400" },
              ].map((f) => (
                <Card key={f.title} className="bg-zinc-800/50 border-zinc-700">
                  <CardContent className="p-6 text-center">
                    <f.icon className={`w-8 h-8 ${f.color} mx-auto mb-3`} />
                    <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-zinc-400">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
              Lo que dicen los que festejaron con Novamente
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <Card key={t.name} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-pink-400 text-pink-400" />
                      ))}
                    </div>
                    <p className="text-zinc-300 mb-4 italic">&quot;{t.quote}&quot;</p>
                    <div>
                      <div className="text-white font-semibold">{t.name}</div>
                      <div className="text-sm text-zinc-500">{t.role}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-6 text-zinc-500">
              Calificacion promedio: <span className="text-white font-semibold">{SITE_STATS.averageRating}</span> de nuestros clientes
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
              Preguntas frecuentes
            </h2>

            <div className="space-y-4">
              {faqJsonLd.mainEntity.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden"
                >
                  <summary className="cursor-pointer p-5 text-white font-medium hover:bg-zinc-800/80 transition-colors list-none flex items-center justify-between">
                    {faq.name}
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-5 pb-5 text-zinc-400">
                    {faq.acceptedAnswer.text}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <Card className="bg-gradient-to-br from-pink-600/20 via-violet-500/10 to-zinc-900 border-pink-500/20">
              <CardContent className="p-8 sm:p-12 text-center">
                <Cake className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Hace que este cumple sea inolvidable
                </h2>
                <p className="text-lg text-zinc-300 mb-8 max-w-xl mx-auto">
                  Mandanos un WhatsApp con los datos: de quien es el cumple, cuantos anos cumple, cuantas personas son, y si tenes alguna idea de diseno. Te armamos propuestas con IA en minutos.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white text-lg px-8 py-6"
                  >
                    <a
                      href={`https://wa.me/5492235169720?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Cotizar para mi cumple
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-lg px-8 py-6"
                  >
                    <Link href="/crear">
                      Probar el disenador IA
                    </Link>
                  </Button>
                </div>

                <p className="text-sm text-zinc-500 mt-6">
                  MercadoPago, transferencia y tarjetas. Enviamos a todo el pais.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cross-sell */}
        <section className="py-12 border-t border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-zinc-500 mb-3">
              Tambien hacemos remeras para despedidas, eventos, egresados y regalos empresariales
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild variant="link" className="text-pink-400 hover:text-pink-300">
                <Link href="/despedidas-personalizadas">
                  Despedidas de soltero/a <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-pink-400 hover:text-pink-300">
                <Link href="/remeras-para-eventos">
                  Remeras para eventos <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-pink-400 hover:text-pink-300">
                <Link href="/buzos-egresados">
                  Buzos de egresados <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-pink-400 hover:text-pink-300">
                <Link href="/regalos-empresariales">
                  Regalos empresariales <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
