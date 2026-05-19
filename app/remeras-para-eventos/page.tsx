import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import {
  Sparkles, Trophy, Users, ArrowRight, Star, Truck,
  Shield, Clock, CheckCircle2, Palette, Package,
  CalendarDays, Dumbbell, Music, Building2, Heart, GraduationCap
} from "lucide-react"

export const metadata: Metadata = {
  title: "Remeras para Eventos — Personalizadas con IA | Novamente",
  description:
    "Remeras y buzos personalizados para eventos: maratones, conferencias, festivales, carreras solidarias, team building y mas. Pedidos de 10 a 500+ unidades con descuentos por volumen. Estampado DTG premium, algodon 100%. Envios a toda Argentina.",
  keywords: [
    "remeras para eventos",
    "remeras para maraton",
    "remeras personalizadas eventos",
    "remeras para conferencias",
    "remeras para festivales",
    "remeras para carreras",
    "remeras corporativas eventos",
    "remeras team building",
    "merchandising eventos argentina",
    "remeras personalizadas por mayor",
    "remeras para carreras solidarias",
    "remeras running personalizadas",
  ],
  openGraph: {
    title: "Remeras para Eventos con IA — Novamente",
    description:
      "Remeras y buzos personalizados para eventos. Pedidos de 10 a 500+ unidades. Estampado DTG premium, algodon 100%. Descuentos por volumen.",
    url: "https://www.novamente.ar/remeras-para-eventos",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/remera-blanca-front.jpeg",
        width: 800,
        height: 800,
        alt: "Remeras personalizadas para eventos — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Remeras para Eventos con IA — Novamente",
    description:
      "Remeras personalizadas para maratones, conferencias, festivales y mas. Pedidos de 10 a 500+ un. DTG premium. Descuentos por volumen.",
  },
  alternates: { canonical: "https://www.novamente.ar/remeras-para-eventos" },
}

export default function RemerasParaEventos() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Remeras para Eventos Personalizadas — Novamente",
    description:
      "Servicio de remeras y buzos personalizados con inteligencia artificial para eventos: maratones, conferencias, festivales, carreras solidarias, team building y mas. Estampado DTG premium sobre algodon 100%. Pedidos de 10 a 500+ unidades con descuentos por volumen.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Remeras Personalizadas para Eventos",
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
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "124",
      bestRating: "5",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cuanto cuestan las remeras para eventos por mayor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Las remeras arrancan desde $28.600 (classic fit) y $31.000 (oversize). Musculosas desde $21.800. Hoodies desde $43.000. Descuentos por volumen: 5% en 10-24 un., 10% en 25-99 un., y 15% en 100+ unidades. Un pedido de 100 remeras classic sale $24.310/un. (15% OFF).",
        },
      },
      {
        "@type": "Question",
        name: "Cual es el minimo de unidades para eventos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No hay minimo de unidades. Podes pedir desde 1 remera. Pero para eventos recomendamos pedidos de 10+ para aprovechar los descuentos por volumen. Manejamos pedidos de hasta 500+ unidades con coordinacion especial.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tiempo demora un pedido grande?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pedidos de hasta 50 unidades: 5-7 dias habiles. Pedidos de 50-200 unidades: 7-10 dias habiles. Pedidos de 200+: 10-15 dias habiles. Recomendamos pedir con 3-4 semanas de anticipacion al evento. Pedidos urgentes consultar por WhatsApp.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo usar la IA para disenar el logo o remera del evento?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, nuestra IA genera disenos unicos para tu evento. Describis el concepto (ej: 'maraton por la costa con olas y runners') y genera opciones profesionales. Tambien podes subir tu propio logo o diseno si ya lo tenes.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo pedir talles variados en un mismo pedido?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, cada prenda puede ser de un talle diferente. Manejamos talles S a XXL en todos los modelos. Para eventos grandes, te mandamos una planilla de talles para que distribuyas entre los participantes antes de la produccion.",
        },
      },
      {
        "@type": "Question",
        name: "Ofrecen facturacion para empresas?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, emitimos factura A o B segun necesites. Para pedidos corporativos o de fundaciones, tambien aceptamos ordenes de compra. Medios de pago: transferencia bancaria, MercadoPago, y tarjetas de credito en cuotas.",
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
        name: "Remeras para Eventos",
        item: "https://www.novamente.ar/remeras-para-eventos",
      },
    ],
  }

  const useCases = [
    {
      icon: Dumbbell,
      title: "Maratones y carreras",
      description: "Remeras tecnicas para corredores con numero, nombre y logo del evento. Ideales para 5K, 10K, 21K y maratones.",
      example: "200 remeras '5K Solidaria 2026' con numero de corredor",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      icon: Building2,
      title: "Conferencias y expos",
      description: "Merch para staff, speakers y asistentes. El recuerdo que llevan puesto despues del evento.",
      example: "150 remeras staff + 50 hoodies speakers 'Tech Summit BA'",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: Music,
      title: "Festivales y recitales",
      description: "Merchandising oficial para bandas, productoras y festivales. Cada edicion con diseno unico.",
      example: "500 remeras edicion limitada 'Festival Indie 2026'",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: Heart,
      title: "Carreras solidarias y ONGs",
      description: "Remeras para eventos beneficos, caminatas solidarias y campanas de concientizacion.",
      example: "300 remeras 'Caminata por la Salud' con sponsors",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      icon: Trophy,
      title: "Torneos deportivos",
      description: "Remeras para torneos de futbol, voley, basket, padel. Cada equipo con su diseno y colores.",
      example: "80 remeras para 8 equipos del torneo interempresarial",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: GraduationCap,
      title: "Team building corporativo",
      description: "Remeras para jornadas de integracion, hackathons, offsite y actividades de equipo.",
      example: "60 remeras 'Hackathon 2026' con nombres por equipo",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
  ]

  const products = [
    { name: "Remera Classic Fit", price: "$28.600", ideal: "La clasica para cualquier evento", badge: "Mas elegida", discounted100: "$24.310" },
    { name: "Remera Oversize", price: "$31.000", ideal: "Look moderno, super comoda", badge: null, discounted100: "$26.350" },
    { name: "Musculosa Unisex", price: "$21.800", ideal: "Ideal para maratones y verano", badge: "Menor costo", discounted100: "$18.530" },
    { name: "Remera Crop Mujer", price: "$23.500", ideal: "Para eventos de moda y lifestyle", badge: null, discounted100: "$19.975" },
    { name: "Buzo Hoodie Oversize", price: "$55.000", ideal: "Para staff, speakers y premios", badge: "Premium", discounted100: "$46.750" },
    { name: "Buzo Cuello Redondo", price: "$43.000", ideal: "Comodo para eventos de invierno", badge: null, discounted100: "$36.550" },
  ]

  const pricingTiers = [
    { range: "1 - 9 un.", discount: "Precio regular", example: "Remera $28.600", tag: null },
    { range: "10 - 24 un.", discount: "5% OFF", example: "Remera $27.170", tag: null },
    { range: "25 - 99 un.", discount: "10% OFF", example: "Remera $25.740", tag: "Eventos medianos" },
    { range: "100+ un.", discount: "15% OFF", example: "Remera $24.310", tag: "Eventos grandes" },
  ]

  const testimonials = [
    {
      quote: "Pedimos 200 remeras para la maraton solidaria y llegaron impecables en 10 dias. La calidad del estampado DTG es muy superior a la serigrafia que usabamos antes. Van a repetir todos los anos.",
      name: "Martin R.",
      role: "Organizador, Maraton Solidaria 5K, La Plata",
      rating: 5,
    },
    {
      quote: "Para la conferencia necesitabamos remeras de staff y hoodies para speakers. El diseno con IA nos ahorro semanas de ida y vuelta con disenadores. Quedo todo profesional.",
      name: "Carolina S.",
      role: "Coordinadora de eventos, empresa tech, CABA",
      rating: 5,
    },
    {
      quote: "Organizamos un torneo interempresarial de padel y cada equipo tenia su remera con colores y nombres. La gente estaba fascinada. Pedimos 80 en total y el precio por volumen fue excelente.",
      name: "Diego L.",
      role: "RRHH, torneo deportivo corporativo, Rosario",
      rating: 5,
    },
  ]

  const whatsappMessage = encodeURIComponent(
    "Hola! Estoy organizando un evento ([tipo de evento]) y necesito cotizar remeras personalizadas. Serian aproximadamente [cantidad] unidades. La fecha del evento es [fecha]. Me gustaria [describir idea/logo]."
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
            <span className="text-zinc-300">Remeras para Eventos</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-amber-500/10 to-transparent" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-merch-personalizado.webp"
              alt="Remera personalizada Novamente para staff de eventos"
            />
            <div className="max-w-3xl">
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 mb-6">
                <CalendarDays className="w-3 h-3 mr-1" />
                Eventos y competencias
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Remeras para eventos{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                  que dejan marca
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-300 mb-4 leading-relaxed">
                Maratones, conferencias, festivales, torneos, campanas solidarias.
                Tu evento merece merch profesional. Pedidos de{" "}
                <span className="text-white font-semibold">10 a 500+ unidades</span>{" "}
                con hasta <span className="text-white font-semibold">15% OFF</span> por volumen.
                Remeras desde <span className="text-white font-semibold">$24.310</span> la unidad.
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-zinc-400 mb-8">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-orange-400" /> Pedidos de 10 a 500+ un.</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-orange-400" /> Diseno IA o tu logo</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-orange-400" /> Factura A y B</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-lg px-8 py-6"
                >
                  <a
                    href={`https://wa.me/5492235169720?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cotizar para mi evento
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
                <div className="text-2xl sm:text-3xl font-bold text-orange-400">150+</div>
                <div className="text-sm text-zinc-400">eventos equipados</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-orange-400">4.8/5</div>
                <div className="text-sm text-zinc-400">calificacion promedio</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-orange-400">500+</div>
                <div className="text-sm text-zinc-400">unidades max por pedido</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-orange-400">15%</div>
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
                Remeras para cada tipo de evento
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Desde carreras de 5K hasta conferencias de 1000 personas. Tenemos la solucion para tu evento.
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
                    <p className="text-sm text-orange-400 italic">&quot;{uc.example}&quot;</p>
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
                Como pedir remeras para tu evento
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Proceso simple para pedidos de cualquier tamano. De la idea a las remeras listas para tu evento.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { step: "1", icon: CalendarDays, title: "Contanos tu evento", desc: "Tipo de evento, fecha, cantidad estimada, y si tenes logo o queres que lo disenemos con IA." },
                { step: "2", icon: Sparkles, title: "Diseno y aprobacion", desc: "Generamos opciones con IA o adaptamos tu logo. Te mandamos muestra digital para aprobar." },
                { step: "3", icon: Package, title: "Produccion DTG", desc: "Producimos todas las unidades con estampado DTG premium. Talles variados, todo en un pedido." },
                { step: "4", icon: Truck, title: "Entrega coordinada", desc: "Envio a la sede del evento, oficina o domicilio. Coordinamos fecha de entrega con anticipacion." },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="text-sm font-mono text-orange-400 mb-2">Paso {s.step}</div>
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
                Modelos disponibles para eventos
              </h2>
              <p className="text-zinc-400 text-lg">
                Algodon 100% premium. Precio con 15% OFF para pedidos de 100+ unidades.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.name} className="bg-zinc-900/50 border-zinc-800 hover:border-orange-500/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                      {product.badge && (
                        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-orange-400">{product.discounted100}</span>
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
                Cuanto mas grande el evento, mejor el precio por unidad.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.range}
                  className={`text-center ${tier.tag ? "bg-zinc-800/50 border-orange-500/30 border-2" : "bg-zinc-900/50 border-zinc-800"}`}
                >
                  <CardContent className="p-5">
                    {tier.tag && (
                      <Badge className="bg-orange-600 text-white mb-2 text-xs">{tier.tag}</Badge>
                    )}
                    <div className="text-sm text-zinc-400 mb-1">{tier.range}</div>
                    <div className="text-xl font-bold text-white mb-1">{tier.discount}</div>
                    <div className="text-sm text-zinc-500">{tier.example}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl max-w-2xl mx-auto">
              <p className="text-orange-300 font-medium">
                Ejemplo: Maraton solidaria con 200 Remeras Classic Fit
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                200 x $24.310 = <span className="text-white font-semibold">$4.862.000</span> total
                (ahorro de $858.000 vs precio regular)
              </p>
            </div>
          </div>
        </section>

        {/* Production timeline */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
              Tiempos de produccion por volumen
            </h2>
            <p className="text-zinc-400 text-lg text-center mb-12 max-w-2xl mx-auto">
              Planifica con tiempo. Recomendamos pedir con 3-4 semanas de anticipacion al evento.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { range: "Hasta 50 un.", time: "5-7 dias", tip: "Ideal para team building y torneos chicos" },
                { range: "50-200 un.", time: "7-10 dias", tip: "Conferencias y carreras medianas" },
                { range: "200+ un.", time: "10-15 dias", tip: "Maratones y festivales grandes" },
              ].map((t) => (
                <Card key={t.range} className="bg-zinc-800/50 border-zinc-700 text-center">
                  <CardContent className="p-6">
                    <Clock className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                    <div className="text-lg font-semibold text-white mb-1">{t.range}</div>
                    <div className="text-2xl font-bold text-orange-400 mb-2">{t.time}</div>
                    <p className="text-sm text-zinc-400">{t.tip}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Novamente */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
              Por que elegir Novamente para tu evento?
            </h2>
            <p className="text-zinc-400 text-lg text-center mb-12 max-w-2xl mx-auto">
              No somos estamperia generica. Somos la primera marca argentina que usa IA para merch profesional.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Sparkles, title: "Diseno IA incluido", desc: "No tenes disenador? Nuestra IA genera el logo y diseno de tu evento en minutos.", color: "text-orange-400" },
                { icon: Package, title: "Hasta 500+ unidades", desc: "Manejamos pedidos grandes con coordinacion dedicada y entrega en fecha.", color: "text-blue-400" },
                { icon: Shield, title: "Calidad DTG premium", desc: "Algodon 100%. El estampado no se despega, no craquela, aguanta 50+ lavados.", color: "text-emerald-400" },
                { icon: Palette, title: "Talles variados", desc: "S a XXL en un mismo pedido. Te mandamos planilla de talles para distribuir.", color: "text-violet-400" },
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
              Lo que dicen organizadores de eventos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <Card key={t.name} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
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
              Calificacion promedio: <span className="text-white font-semibold">4.8/5</span> basado en 124 eventos equipados
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
              Preguntas frecuentes sobre remeras para eventos
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
            <Card className="bg-gradient-to-br from-orange-600/20 via-amber-500/10 to-zinc-900 border-orange-500/20">
              <CardContent className="p-8 sm:p-12 text-center">
                <CalendarDays className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Tu evento merece merch profesional
                </h2>
                <p className="text-lg text-zinc-300 mb-8 max-w-xl mx-auto">
                  Mandanos un WhatsApp con los datos de tu evento: tipo, fecha, cantidad estimada y si tenes logo. Te armamos una cotizacion y muestra digital gratuita.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-lg px-8 py-6"
                  >
                    <a
                      href={`https://wa.me/5492235169720?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Cotizar para mi evento
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
                  Factura A y B. Transferencia, MercadoPago y tarjetas. Enviamos a todo el pais.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cross-sell */}
        <section className="py-12 border-t border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-zinc-500 mb-3">
              Tambien hacemos uniformes, regalos empresariales, buzos de egresados y merch para creadores
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild variant="link" className="text-orange-400 hover:text-orange-300">
                <Link href="/uniformes-personalizados">
                  Uniformes personalizados <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-orange-400 hover:text-orange-300">
                <Link href="/regalos-empresariales">
                  Regalos empresariales <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-orange-400 hover:text-orange-300">
                <Link href="/buzos-egresados">
                  Buzos de egresados <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-orange-400 hover:text-orange-300">
                <Link href="/merch-para-creadores">
                  Merch para creadores <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
