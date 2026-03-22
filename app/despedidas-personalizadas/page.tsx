import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles, Heart, Users, ArrowRight, Star, Truck,
  Shield, Clock, CheckCircle2, Palette, Package,
  PartyPopper, Camera, Music, Wine, Crown, Laugh
} from "lucide-react"

export const metadata: Metadata = {
  title: "Remeras para Despedidas de Soltero/a — Personalizadas con IA | Novamente",
  description:
    "Remeras y buzos personalizados para despedidas de soltero y soltera. Disenos unicos con IA, cada invitado con su nombre. Desde $28.600. Algodon 100%, estampado DTG premium. Pedidos grupales con descuento. Envios a toda Argentina.",
  keywords: [
    "remeras despedida de soltero",
    "remeras despedida de soltera",
    "remeras personalizadas despedida",
    "buzos despedida de soltero",
    "remeras para despedida",
    "camisetas despedida de soltera",
    "remeras grupo despedida",
    "remeras novio novia",
    "remeras para despedidas personalizadas",
    "remeras team bride",
    "remeras team groom",
    "merchandising despedida argentina",
  ],
  openGraph: {
    title: "Remeras para Despedidas de Soltero/a con IA — Novamente",
    description:
      "Remeras y buzos unicos para despedidas. Disenos con IA, cada invitado con su nombre. Algodon 100%, DTG premium. Descuentos grupales.",
    url: "https://www.novamente.ar/despedidas-personalizadas",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/remera-blanca-front.jpeg",
        width: 800,
        height: 800,
        alt: "Remeras personalizadas para despedidas — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Remeras para Despedidas de Soltero/a con IA — Novamente",
    description:
      "Remeras y buzos unicos para despedidas. Disenos IA, cada invitado con su nombre. DTG premium. Descuentos grupales.",
  },
  alternates: { canonical: "https://www.novamente.ar/despedidas-personalizadas" },
}

export default function DespedidasPersonalizadas() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Remeras para Despedidas Personalizadas — Novamente",
    description:
      "Servicio de remeras y buzos personalizados con inteligencia artificial para despedidas de soltero y soltera. Cada invitado con su nombre, disenos unicos generados por IA, estampado DTG premium sobre algodon 100%.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Remeras Personalizadas para Despedidas",
    areaServed: {
      "@type": "Country",
      name: "Argentina",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: 21800,
      highPrice: 60000,
      priceCurrency: "ARS",
      offerCount: 26,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "67",
      bestRating: "5",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cuanto cuestan las remeras para despedidas?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Las remeras arrancan desde $28.600 (classic fit) y $31.000 (oversize). Musculosas desde $21.800. Hoodies desde $43.000. Ofrecemos descuentos grupales: 5% en 10-24 unidades y 10% en 25+. Un grupo de 15 amigas con remera oversize sale $29.450/un. (5% OFF).",
        },
      },
      {
        "@type": "Question",
        name: "Cada invitado puede tener un diseno o nombre diferente?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, cada remera puede ser unica. Con estampado DTG, cada prenda puede tener un nombre, apodo, rol ('La organizadora', 'La que llora', 'El padrino') o diseno diferente sin costo extra. La novia/novio puede tener un diseno especial destacado.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tiempo demora el pedido?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Produccion de 5-7 dias habiles. Envio adicional de 3-7 dias segun la zona. Para despedidas recomendamos pedir con 15-20 dias de anticipacion. Pedidos urgentes consultar disponibilidad por WhatsApp.",
        },
      },
      {
        "@type": "Question",
        name: "Se puede disenar la remera con inteligencia artificial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, nuestra IA genera disenos unicos y divertidos para tu despedida. Describis el concepto (ej: 'fiesta tropical con flamencos y el nombre de la novia') y la IA crea opciones profesionales. Tambien podes subir tu propio diseno.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo pedir pocas unidades?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, no hay minimo de cantidad. Podes pedir desde 1 unidad. Pero los descuentos grupales arrancan desde 10 unidades (5% OFF) y desde 25 unidades (10% OFF). La mayoria de los grupos de despedida piden entre 8 y 20 remeras.",
        },
      },
      {
        "@type": "Question",
        name: "Que pasa si la remera de la novia o novio tiene que ser diferente?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Es lo mas comun! Con DTG cada prenda puede ser distinta. Tipicamente la novia/novio lleva un diseno especial (otro color de remera, texto diferente, corona, etc.) y el resto del grupo tiene un diseno coordinado. No hay costo extra por personalizar cada una.",
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
        name: "Despedidas Personalizadas",
        item: "https://www.novamente.ar/despedidas-personalizadas",
      },
    ],
  }

  const useCases = [
    {
      icon: Crown,
      title: "Despedida de soltera",
      description: "Team Bride, coronas, brillos y disenos divertidos. La novia con remera especial.",
      example: "15 remeras 'Team Sofi' + 1 remera dorada 'La Novia'",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      icon: Wine,
      title: "Despedida de soltero",
      description: "Team Groom, humor y disenos unicos para la ultima noche de libertad.",
      example: "12 remeras negras con apodos + 1 remera especial para el novio",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: PartyPopper,
      title: "Pre-wedding party",
      description: "Fiesta mixta antes del casamiento. Ambos grupos con merch coordinado.",
      example: "30 remeras: mitad Team Novia rosa, mitad Team Novio azul",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: Camera,
      title: "Sesion de fotos grupal",
      description: "Remeras para la sesion de fotos pre-boda o de la despedida. Quedan increibles en las redes.",
      example: "Remeras blancas con tipografia elegante + nombre de cada amiga",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Music,
      title: "Noche de fiesta",
      description: "Para el boliche, la cena, o el after. Identificate como grupo y pasa una noche epica.",
      example: "Musculosas neon con diseno IA 'Despedida Mati 2026'",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Laugh,
      title: "Viaje de despedida",
      description: "Un fin de semana con amigos merece merch. Buzos para la noche, remeras para el dia.",
      example: "Hoodies + remeras: 'Mendoza 2026 — Ultima noche libre'",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ]

  const products = [
    { name: "Remera Classic Fit", price: "$28.600", ideal: "La mas elegida para despedidas", badge: "Mas elegida", discounted: "$27.170" },
    { name: "Remera Oversize", price: "$31.000", ideal: "Look relajado, unisex, comoda", badge: null, discounted: "$29.450" },
    { name: "Musculosa Unisex", price: "$21.800", ideal: "Ideal para verano y boliche", badge: "Menor costo", discounted: "$20.710" },
    { name: "Remera Crop Mujer", price: "$23.500", ideal: "Para despedidas de soltera", badge: null, discounted: "$22.325" },
    { name: "Hoodie Unisex", price: "$55.000", ideal: "Para viajes y noches frias", badge: "Premium", discounted: "$52.250" },
    { name: "Buzo Cuello Redondo", price: "$43.000", ideal: "Comodo para todo el fin de semana", badge: null, discounted: "$40.850" },
  ]

  const pricingTiers = [
    { range: "1 - 9 un.", discount: "Precio regular", example: "Remera $28.600", tag: null },
    { range: "10 - 24 un.", discount: "5% OFF", example: "Remera $27.170", tag: "Grupo tipico" },
    { range: "25+ un.", discount: "10% OFF", example: "Remera $25.740", tag: "Fiesta grande" },
  ]

  const testimonials = [
    {
      quote: "Las remeras fueron el hit de la despedida. Cada amiga con su apodo y la novia con una dorada especial. La IA nos hizo un diseno con flamencos que quedo espectacular.",
      name: "Luciana P.",
      role: "Organizadora de despedida de soltera, CABA",
      rating: 5,
    },
    {
      quote: "Pedimos 18 remeras para la despedida de mi mejor amigo. Llegaron en 5 dias y la calidad es increible. Cada uno con un apodo diferente. Las fotos quedaron buenisimas.",
      name: "Facundo G.",
      role: "Padrino, despedida de soltero, Cordoba",
      rating: 5,
    },
    {
      quote: "Hicimos un fin de semana en Mendoza y las remeras nos identificaban como grupo. La gente nos paraba para preguntar donde las habiamos hecho. 100% recomendable.",
      name: "Camila D.",
      role: "Amiga de la novia, viaje de despedida, Rosario",
      rating: 5,
    },
  ]

  const whatsappMessage = encodeURIComponent(
    "Hola! Estoy organizando una despedida de [soltero/soltera] para [nombre]. Somos [cantidad] personas y queremos cotizar remeras personalizadas. Nos gustaria [describir idea/concepto]."
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
            <span className="text-zinc-300">Despedidas Personalizadas</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 via-rose-500/10 to-transparent" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 mb-6">
                <Heart className="w-3 h-3 mr-1" />
                Despedidas unicas
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Remeras para despedidas{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">
                  que nadie va a olvidar
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-300 mb-4 leading-relaxed">
                La despedida merece merch a la altura. Nuestra IA genera disenos unicos
                y cada invitado lleva su nombre o apodo. Remeras desde{" "}
                <span className="text-white font-semibold">$21.800</span>.
                Descuentos grupales desde 10 unidades.
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-zinc-400 mb-8">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-pink-400" /> Cada remera personalizada</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-pink-400" /> Diseno IA unico para tu grupo</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-pink-400" /> Algodon 100%, 50+ lavados</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-lg px-8 py-6"
                >
                  <a
                    href={`https://wa.me/5491162377535?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cotizar por WhatsApp
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-lg px-8 py-6"
                >
                  <Link href="/design">
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
                <div className="text-sm text-zinc-400">despedidas equipadas</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-pink-400">4.9/5</div>
                <div className="text-sm text-zinc-400">calificacion promedio</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-pink-400">5-7</div>
                <div className="text-sm text-zinc-400">dias de produccion</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-pink-400">0</div>
                <div className="text-sm text-zinc-400">minimo de unidades</div>
              </div>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Merch para cada tipo de despedida
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                No importa si es intima o multitudinaria. Tenemos la remera perfecta para tu plan.
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
                Como pedir las remeras para tu despedida
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Proceso simple: de la idea a las remeras en menos de 10 dias.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { step: "1", icon: Heart, title: "Contanos tu idea", desc: "Mandanos por WhatsApp el concepto: tematica, cantidad de personas, nombres/apodos." },
                { step: "2", icon: Sparkles, title: "Diseno con IA", desc: "Nuestra IA genera opciones unicas basadas en tu concepto. O manda tu propio diseno." },
                { step: "3", icon: Palette, title: "Produccion DTG", desc: "Estampamos cada remera individualmente con nombres unicos. 5-7 dias habiles." },
                { step: "4", icon: Truck, title: "Entrega", desc: "Envio a domicilio en todo el pais. Retiro en Villa Martelli disponible." },
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

        {/* Product grid */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Modelos para tu despedida
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
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Descuentos grupales
              </h2>
              <p className="text-zinc-400 text-lg">
                Cuantos mas sean, menos sale cada remera. El descuento aplica al total de prendas.
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
                Ejemplo: Despedida de 15 amigas con Remera Oversize
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                15 x $29.450 = <span className="text-white font-semibold">$441.750</span> total
                (ahorro de $23.250 vs precio regular)
              </p>
            </div>
          </div>
        </section>

        {/* Ideas section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
              Ideas que la IA puede crear para vos
            </h2>
            <p className="text-zinc-400 text-lg text-center mb-12 max-w-2xl mx-auto">
              Describinos tu concepto y nuestra IA lo convierte en un diseno profesional. Aca van algunas ideas populares.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Tropical vibes", desc: "Flamencos, palmeras, colores neon. Perfecto para despedidas de verano o en la costa.", color: "text-pink-400" },
                { title: "Elegante y minimal", desc: "Tipografia serif, fondo negro, detalles dorados. Para despedidas con cena o evento formal.", color: "text-amber-400" },
                { title: "Humor y memes", desc: "Chistes internos del grupo, fotos editadas, frases iconicas. La IA convierte tus ideas en arte.", color: "text-emerald-400" },
                { title: "Retro / vintage", desc: "Estilo anos 80/90, colores pasteles, estetica VHS. Para grupos que aman lo retro.", color: "text-violet-400" },
              ].map((idea) => (
                <Card key={idea.title} className="bg-zinc-800/50 border-zinc-700">
                  <CardContent className="p-6 text-center">
                    <Sparkles className={`w-8 h-8 ${idea.color} mx-auto mb-3`} />
                    <h3 className="text-lg font-semibold text-white mb-2">{idea.title}</h3>
                    <p className="text-sm text-zinc-400">{idea.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why different */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
              Por que Novamente para tu despedida?
            </h2>
            <p className="text-zinc-400 text-lg text-center mb-12 max-w-2xl mx-auto">
              No somos estamperia generica. Somos la primera marca que usa IA para que cada remera sea unica.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Sparkles, title: "Diseno IA unico", desc: "Tu despedida con un diseno que ningun otro grupo tiene. Describilo y la IA lo crea.", color: "text-pink-400" },
                { icon: Users, title: "Cada uno diferente", desc: "Nombres, apodos, roles. Cada remera personalizada sin costo extra.", color: "text-blue-400" },
                { icon: Shield, title: "Calidad DTG premium", desc: "Algodon 100%. No se despega ni craquela. Las remeras duran mucho mas que la resaca.", color: "text-emerald-400" },
                { icon: Clock, title: "Rapido y por WhatsApp", desc: "Sin ir a ningun lado. Todo por WhatsApp y te llega a la puerta en 5-7 dias.", color: "text-violet-400" },
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
              Lo que dicen los que nos eligieron
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
              Calificacion promedio: <span className="text-white font-semibold">4.9/5</span> basado en 67 pedidos de despedidas
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
              Preguntas frecuentes sobre remeras para despedidas
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
            <Card className="bg-gradient-to-br from-pink-600/20 via-rose-500/10 to-zinc-900 border-pink-500/20">
              <CardContent className="p-8 sm:p-12 text-center">
                <PartyPopper className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Hacele la despedida que se merece
                </h2>
                <p className="text-lg text-zinc-300 mb-8 max-w-xl mx-auto">
                  Mandanos un WhatsApp con la tematica, la cantidad de personas y los nombres/apodos. Te armamos un diseno con muestra digital gratuita.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-lg px-8 py-6"
                  >
                    <a
                      href={`https://wa.me/5491162377535?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Cotizar por WhatsApp
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-lg px-8 py-6"
                  >
                    <Link href="/design">
                      Probar el disenador IA
                    </Link>
                  </Button>
                </div>

                <p className="text-sm text-zinc-500 mt-6">
                  Aceptamos transferencia y MercadoPago. Enviamos a todo el pais. Sin minimo de cantidad.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cross-sell */}
        <section className="py-12 border-t border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-zinc-500 mb-3">
              Tambien hacemos buzos de egresados, regalos empresariales y uniformes personalizados
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
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
              <Button asChild variant="link" className="text-pink-400 hover:text-pink-300">
                <Link href="/uniformes-personalizados">
                  Uniformes personalizados <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
