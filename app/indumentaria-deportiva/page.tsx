import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import {
  Sparkles, Users, ArrowRight, Star, Truck,
  Shield, Clock, CheckCircle2, Palette, Package,
  Trophy, Dumbbell, Target, Timer, Bike, Swords
} from "lucide-react"

export const metadata: Metadata = {
  title: "Indumentaria Deportiva Personalizada con IA | Novamente",
  description:
    "Remeras, musculosas y buzos personalizados para equipos deportivos: futbol, hockey, paddle, running, crossfit y mas. Disena con IA en minutos. Equipos de 10 a 100+ jugadores. Estampado DTG premium, algodon 100%. Envios a toda Argentina.",
  keywords: [
    "indumentaria deportiva personalizada",
    "remeras personalizadas equipo",
    "camisetas equipo deportivo",
    "remeras para equipos de futbol",
    "indumentaria deportiva personalizada argentina",
    "remeras equipo hockey",
    "remeras equipo paddle",
    "remeras equipo running",
    "remeras personalizadas club",
    "ropa deportiva personalizada",
    "camisetas personalizadas equipo",
    "remeras equipo crossfit",
  ],
  openGraph: {
    title: "Indumentaria Deportiva Personalizada con IA — Novamente",
    description:
      "Remeras y buzos personalizados para equipos deportivos. Equipos de 10 a 100+. Disena con IA en minutos. DTG premium, algodon 100%.",
    url: "https://www.novamente.ar/indumentaria-deportiva",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/remera-blanca-front.jpeg",
        width: 800,
        height: 800,
        alt: "Indumentaria deportiva personalizada — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Indumentaria Deportiva Personalizada con IA — Novamente",
    description:
      "Remeras personalizadas para equipos deportivos. Disena con IA. Equipos de 10 a 100+. DTG premium. Descuentos por volumen.",
  },
  alternates: { canonical: "https://www.novamente.ar/indumentaria-deportiva" },
}

export default function IndumentariaDeportiva() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Indumentaria Deportiva Personalizada — Novamente",
    description:
      "Servicio de remeras, musculosas y buzos personalizados con inteligencia artificial para equipos deportivos: futbol, hockey, paddle, running, crossfit y mas. Estampado DTG premium sobre algodon 100%. Equipos de 10 a 100+ jugadores con descuentos por volumen.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Indumentaria Deportiva Personalizada",
    areaServed: {
      "@type": "Country",
      name: "Argentina",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: 24000,
      highPrice: 58000,
      priceCurrency: "ARS",
      offerCount: 26,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "340",
      bestRating: "5",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cuanto cuesta la indumentaria deportiva personalizada?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Remeras desde $28.600 (classic fit) y $31.000 (oversize). Musculosas desde $21.800. Hoodies desde $43.000. Descuentos por volumen: 5% en 10-24 un., 10% en 25-99 un. y 15% en 100+ unidades. Un equipo de 20 remeras classic sale $27.170/un. (5% OFF).",
        },
      },
      {
        "@type": "Question",
        name: "Puedo poner numero y nombre en cada remera?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, con estampado DTG cada remera se imprime individualmente. Cada prenda puede tener nombre, numero, posicion, y cualquier dato personalizado. Ideal para que cada jugador tenga su camiseta unica.",
        },
      },
      {
        "@type": "Question",
        name: "Sirven para jugar o son solo para usar de calle?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Las remeras son algodon 100% premium, ideales para entrenamiento, calentamiento, tercer tiempo y uso diario. Para partidos oficiales de ligas con reglamento especifico, consulta si necesitas material deportivo tecnico.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo disenar el escudo o logo del equipo con IA?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, nuestra IA puede generar logos, escudos y disenos unicos para tu equipo. Describis lo que queres (ej: 'escudo de futbol con aguila y colores azul y oro') y la IA crea opciones profesionales. Tambien podes subir tu logo existente.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tardan en estar listas?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Produccion de 5-7 dias habiles para equipos de hasta 50 unidades. Para equipos grandes (50-100+), 7-10 dias habiles. Envio a todo el pais en 2-5 dias adicionales. Pedidos urgentes consultar por WhatsApp.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo hacer pedidos recurrentes para cada temporada?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, muchos clubes y equipos nos piden cada temporada. Guardamos tu diseno base y simplemente actualizamos nombres/numeros del nuevo plantel. Descuentos especiales para clientes recurrentes.",
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
        name: "Indumentaria Deportiva",
        item: "https://www.novamente.ar/indumentaria-deportiva",
      },
    ],
  }

  const useCases = [
    {
      icon: Trophy,
      title: "Futbol (clubes y ligas amateur)",
      description: "Camisetas para tu club de barrio, liga amateur, o equipo de futbol 5/7/11. Escudo, dorsal, nombre de cada jugador. Renueva cada temporada.",
      example: "25 remeras 'Club Atletico Villa Luro' con dorsales 1-25",
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      icon: Target,
      title: "Hockey / Voley / Handball",
      description: "Equipos femeninos, masculinos y mixtos. Remeras o musculosas con colores del equipo, numeros y nombre de cada jugadora.",
      example: "18 musculosas 'Las Leonas del Oeste' con numeros",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: Dumbbell,
      title: "CrossFit / Gym / Funcional",
      description: "Box de CrossFit, grupo de funcional, o equipo de gym. Remeras y musculosas con el nombre del box y diseno que represente la comunidad.",
      example: "30 musculosas 'CrossFit Fuego — Temporada 2026'",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      icon: Bike,
      title: "Running / Ciclismo / Triatlon",
      description: "Running teams, grupos de ciclismo, triatlon. Remeras tecnicas para entrenamiento y eventos. Visibilidad de sponsors.",
      example: "40 remeras 'Buenos Aires Runners — Maraton 42K'",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      icon: Swords,
      title: "Paddle / Tenis / Squash",
      description: "Equipo de paddle para torneo, liga de tenis, grupo de squash. Remeras con nombre del equipo y numero de cada jugador.",
      example: "12 remeras 'Paddle Team Nordelta' con apodos",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Users,
      title: "Torneos y ligas organizadas",
      description: "Organizas un torneo? Remeras para todos los equipos, arbitros, staff. Cotizamos por volumen con los mejores descuentos.",
      example: "200 remeras para torneo inter-empresas (8 equipos x 25)",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ]

  const products = [
    { name: "Remera Classic Fit", price: "$28.600", ideal: "La clasica para entrenamiento y tercer tiempo", badge: "Mas elegida", discounted: "$27.170" },
    { name: "Remera Oversize", price: "$31.000", ideal: "Look relajado para fuera de cancha", badge: null, discounted: "$29.450" },
    { name: "Musculosa Unisex", price: "$21.800", ideal: "Ideal para deportes indoor y verano", badge: "Deportes", discounted: "$20.710" },
    { name: "Remera Crop Mujer", price: "$23.500", ideal: "Para equipos femeninos", badge: null, discounted: "$22.325" },
    { name: "Buzo Hoodie Oversize", price: "$55.000", ideal: "Para concentracion y salidas del club", badge: "Premium", discounted: "$52.250" },
    { name: "Buzo Cuello Redondo", price: "$43.000", ideal: "Abrigo para entrenamiento de invierno", badge: null, discounted: "$40.850" },
  ]

  const pricingTiers = [
    { range: "1 - 9 un.", discount: "Precio regular", example: "Remera $28.600", tag: null },
    { range: "10 - 24 un.", discount: "5% OFF", example: "Remera $27.170", tag: "Equipo chico" },
    { range: "25 - 99 un.", discount: "10% OFF", example: "Remera $25.740", tag: "Club" },
    { range: "100+ un.", discount: "15% OFF", example: "Remera $24.310", tag: "Torneo / Liga" },
  ]

  const testimonials = [
    {
      quote: "Hacemos las remeras del club con Novamente hace 2 temporadas. Cada jugador tiene nombre y numero, y el escudo queda impecable. Antes pagabamos el doble en una estamperia tradicional y tardaban el triple.",
      name: "Martin G.",
      role: "Delegado, Club San Lorenzo de Villa Ballester, futbol 11",
      rating: 5,
    },
    {
      quote: "Para el box de CrossFit pedimos 35 musculosas con un diseno que creo la IA a partir de nuestro logo. Quedaron increibles. Los chicos del box no paran de pedir modelos nuevos. Ya vamos por el 3er pedido.",
      name: "Agustina R.",
      role: "Owner, CrossFit Titanio, Palermo",
      rating: 5,
    },
    {
      quote: "Organizamos un torneo de paddle inter-empresas y pedimos 120 remeras para 8 equipos, cada uno con su color y nombres. Todo coordinado en 10 dias. Los sponsors quedaron chocos con la calidad.",
      name: "Federico L.",
      role: "Organizador torneo paddle, zona norte GBA",
      rating: 5,
    },
  ]

  const whatsappMessage = encodeURIComponent(
    "Hola! Quiero cotizar indumentaria para mi equipo deportivo. Deporte: [futbol/hockey/paddle/running/crossfit/otro]. Somos [cantidad] personas. El nombre del equipo es [nombre]. Necesitamos [remeras/musculosas/buzos]. Queremos incluir [numeros/nombres/logo]."
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
            <span className="text-zinc-300">Indumentaria Deportiva</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-blue-500/10 to-transparent" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-indumentaria-deportiva.webp"
              alt="Indumentaria deportiva personalizada Novamente — kit de equipo amateur argentino"
            />
            <div className="max-w-3xl">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 mb-6">
                <Trophy className="w-3 h-3 mr-1" />
                Equipos deportivos
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Indumentaria deportiva{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                  con la identidad de tu equipo
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-300 mb-4 leading-relaxed">
                Futbol, hockey, paddle, running, crossfit y mas. Disena con IA en minutos
                o subi tu escudo/logo. Equipos de{" "}
                <span className="text-white font-semibold">10 a 100+ jugadores</span>.
                Remeras desde <span className="text-white font-semibold">$24.310</span> con descuento por volumen.
                Cada una con nombre, numero y posicion.
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-zinc-400 mb-8">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-400" /> Nombre y numero por prenda</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-400" /> Escudo/logo con IA o propio</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-400" /> Entrega en 5-10 dias</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white text-lg px-8 py-6"
                >
                  <a
                    href={`https://wa.me/5491162377535?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cotizar para mi equipo
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
                    Disenar escudo con IA
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
                <div className="text-2xl sm:text-3xl font-bold text-green-400">150+</div>
                <div className="text-sm text-zinc-400">equipos equipados</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-green-400">4.8/5</div>
                <div className="text-sm text-zinc-400">calificacion promedio</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-green-400">5-10 dias</div>
                <div className="text-sm text-zinc-400">produccion standard</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-green-400">15%</div>
                <div className="text-sm text-zinc-400">OFF en 100+ unidades</div>
              </div>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Indumentaria para cada deporte
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Desde futbol de barrio hasta torneos inter-empresas. Tu equipo merece indumentaria que represente su identidad.
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
                    <p className="text-sm text-green-400 italic">&quot;{uc.example}&quot;</p>
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
                Como equipar a tu equipo
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                En 4 pasos tu equipo tiene indumentaria profesional. Sin minimos, sin complicaciones.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { step: "1", icon: Trophy, title: "Contanos de tu equipo", desc: "Deporte, cantidad de jugadores, colores, y si tenes escudo o queres que la IA cree uno." },
                { step: "2", icon: Sparkles, title: "Diseno con IA", desc: "La IA genera disenos con tu escudo, colores y estilo. O subi tu logo y lo adaptamos." },
                { step: "3", icon: Package, title: "Produccion DTG", desc: "Cada prenda se imprime individualmente con nombre, numero y personalizacion unica." },
                { step: "4", icon: Truck, title: "Listas para jugar", desc: "Envio a tu club, cancha, o domicilio. Llegan listas para entrenar y competir." },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-sm font-mono text-green-400 mb-2">Paso {s.step}</div>
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
                Modelos disponibles
              </h2>
              <p className="text-zinc-400 text-lg">
                Algodon 100% premium. Precio con 5% OFF para equipos de 10+.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.name} className="bg-zinc-900/50 border-zinc-800 hover:border-green-500/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                      {product.badge && (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-green-400">{product.discounted}</span>
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
                Descuentos por volumen
              </h2>
              <p className="text-zinc-400 text-lg">
                Mas jugadores, mejor precio por unidad.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.range}
                  className={`text-center ${tier.tag === "Club" ? "bg-zinc-800/50 border-green-500/30 border-2" : "bg-zinc-900/50 border-zinc-800"}`}
                >
                  <CardContent className="p-5">
                    {tier.tag && (
                      <Badge className={`${tier.tag === "Club" ? "bg-green-600" : "bg-zinc-700"} text-white mb-2 text-xs`}>{tier.tag}</Badge>
                    )}
                    <div className="text-sm text-zinc-400 mb-1">{tier.range}</div>
                    <div className="text-xl font-bold text-white mb-1">{tier.discount}</div>
                    <div className="text-sm text-zinc-500">{tier.example}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl max-w-2xl mx-auto">
              <p className="text-green-300 font-medium">
                Ejemplo: Equipo de futbol 11 con 25 jugadores — Remera Classic Fit
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                25 x $25.740 = <span className="text-white font-semibold">$643.500</span> total
                (10% OFF, ahorro de $71.500 vs precio regular)
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                Sale $25.740 por jugador — con nombre, numero y escudo incluido
              </p>
            </div>
          </div>
        </section>

        {/* Personalization highlight */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
              Cada camiseta es unica
            </h2>
            <p className="text-zinc-400 text-lg text-center mb-12 max-w-2xl mx-auto">
              Con DTG, cada prenda se imprime individualmente. Nombre, numero, posicion — todo personalizado.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, title: "Nombre del jugador", desc: "Cada remera con el nombre o apodo en la espalda.", color: "text-green-400" },
                { icon: Timer, title: "Numero y posicion", desc: "Dorsal adelante y atras, posicion si queres. Como los profesionales.", color: "text-blue-400" },
                { icon: Sparkles, title: "Escudo del equipo", desc: "Tu logo/escudo en alta calidad o creado por IA. Colores fieles.", color: "text-amber-400" },
                { icon: Shield, title: "Calidad DTG premium", desc: "Algodon 100%. No se despega ni craquela. Resiste 50+ lavados.", color: "text-emerald-400" },
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

        {/* Recurring orders callout */}
        <section className="py-12 bg-gradient-to-r from-green-600/10 via-blue-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Clock className="w-10 h-10 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Pedidos recurrentes: nueva temporada, nuevas camisetas
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-4">
              Guardamos tu diseno base. Cada temporada solo actualizas el plantel (nombres y numeros) y listo. Descuentos especiales para clientes recurrentes.
            </p>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              Ideal para clubes con renovacion anual de plantel
            </Badge>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
              Lo que dicen los equipos que confian en Novamente
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <Card key={t.name} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-green-400 text-green-400" />
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
              Calificacion promedio: <span className="text-white font-semibold">4.8/5</span> basado en 340 equipos equipados
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
            <Card className="bg-gradient-to-br from-green-600/20 via-blue-500/10 to-zinc-900 border-green-500/20">
              <CardContent className="p-8 sm:p-12 text-center">
                <Trophy className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Equipa a tu equipo como profesionales
                </h2>
                <p className="text-lg text-zinc-300 mb-8 max-w-xl mx-auto">
                  Mandanos un WhatsApp con tu deporte, cantidad de jugadores, y si tenes escudo o queres que lo diseñemos con IA. Te armamos propuestas en minutos.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white text-lg px-8 py-6"
                  >
                    <a
                      href={`https://wa.me/5491162377535?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Cotizar para mi equipo
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
              Tambien hacemos remeras para eventos, uniformes, egresados y regalos empresariales
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild variant="link" className="text-green-400 hover:text-green-300">
                <Link href="/remeras-para-eventos">
                  Remeras para eventos <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-green-400 hover:text-green-300">
                <Link href="/uniformes-personalizados">
                  Uniformes empresariales <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-green-400 hover:text-green-300">
                <Link href="/buzos-egresados">
                  Buzos de egresados <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-green-400 hover:text-green-300">
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
