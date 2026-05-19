import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import {
  Sparkles, GraduationCap, Users, ArrowRight, Star, Truck,
  Shield, Clock, CheckCircle2, Palette, Package, Heart,
  Camera, PartyPopper, Flame, Music, Trophy, Shirt
} from "lucide-react"

export const metadata: Metadata = {
  title: "Buzos de Egresados 2026 — Personalizados con IA | Novamente",
  description:
    "Buzos de egresados personalizados con inteligencia artificial. Hoodies desde $43.000, remeras desde $28.600. Cada alumno elige su nombre y numero. Algodon 100%, estampado DTG premium. Descuentos desde 10 unidades. Envios a toda Argentina.",
  keywords: [
    "buzos de egresados",
    "buzos egresados 2026",
    "buzos de egresados personalizados",
    "buzo egresado precio",
    "buzos promocion 2026",
    "remeras de egresados",
    "hoodies egresados argentina",
    "buzos de egresados con nombre",
    "buzos egresados baratos",
    "camperas de egresados",
    "buzos de egresados buenos aires",
    "buzos de egresados precio por mayor",
  ],
  openGraph: {
    title: "Buzos de Egresados 2026 con IA — Novamente",
    description:
      "Buzos de egresados unicos con disenos generados por IA. Hoodies desde $43.000. Cada alumno con su nombre y numero. Algodon 100%, DTG premium.",
    url: "https://www.novamente.ar/buzos-egresados",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png",
        width: 800,
        height: 800,
        alt: "Buzos de egresados personalizados con IA — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buzos de Egresados 2026 con IA — Novamente",
    description:
      "Buzos de egresados unicos con diseno IA. Cada alumno elige su nombre. Algodon 100%, DTG premium. Descuentos por curso.",
  },
  alternates: { canonical: "https://www.novamente.ar/buzos-egresados" },
}

export default function BuzosEgresados() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Buzos de Egresados Personalizados — Novamente",
    description:
      "Servicio de buzos y remeras de egresados personalizados con inteligencia artificial. Hoodies y buzos con nombres individuales, estampado DTG premium sobre algodon 100%. Descuentos por curso completo.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Buzos de Egresados Personalizados",
    areaServed: {
      "@type": "Country",
      name: "Argentina",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: 28600,
      highPrice: 55000,
      priceCurrency: "ARS",
      offerCount: 26,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "83",
      bestRating: "5",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cuanto cuestan los buzos de egresados?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Los buzos de egresados arrancan desde $43.000 (buzo cuello redondo) y $55.000 (hoodie con capucha). El modelo premium oversize sale $55.000. Ofrecemos descuentos por cantidad: 5% en 10-24 unidades, 10% en 25-49 unidades, y 15% en 50+ unidades. Un curso de 30 alumnos con hoodie sale $49.500/un. (10% OFF).",
        },
      },
      {
        "@type": "Question",
        name: "Cada alumno puede tener su nombre y numero en el buzo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, cada buzo puede ser unico. Gracias al estampado DTG (impresion directa sobre la tela), cada prenda puede tener un nombre, numero, apodo o diseno diferente sin costo adicional. No hay minimo de unidades iguales.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tiempo demora el pedido de buzos de egresados?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Produccion de 5-7 dias habiles para pedidos de 20-50 unidades. Envio adicional de 3-7 dias segun la zona. Para egresados recomendamos pedir con al menos 30 dias de anticipacion al acto o viaje. Pedidos urgentes consultar disponibilidad.",
        },
      },
      {
        "@type": "Question",
        name: "Se puede disenar el buzo con inteligencia artificial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, nuestra IA genera disenos unicos a partir de lo que le describas. Podes describir el concepto de tu promocion (ej: 'galaxia con estrellas y el numero 2026') y la IA crea opciones profesionales. Tambien podes subir un diseno propio.",
        },
      },
      {
        "@type": "Question",
        name: "Los buzos de egresados aguantan el uso diario?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, usamos algodon 100% premium y estampado DTG que resiste 50+ lavados sin decolorarse. A diferencia de la serigrafia o vinilo, el DTG se integra a la fibra del algodon. Recomendamos lavar del reves en frio para maxima durabilidad.",
        },
      },
      {
        "@type": "Question",
        name: "Pueden hacer buzos y remeras para el mismo curso?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, podemos combinar buzos y remeras en el mismo pedido. Muchos cursos piden hoodies para invierno y remeras para verano/viaje de egresados. El descuento por cantidad se aplica sobre el total de prendas, no por modelo.",
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
        name: "Buzos de Egresados",
        item: "https://www.novamente.ar/buzos-egresados",
      },
    ],
  }

  const useCases = [
    {
      icon: GraduationCap,
      title: "Acto de egresados",
      description: "El clasico buzo de egresados con el nombre de cada alumno, el ano y el diseno de la promo.",
      example: "30 hoodies: frente con logo de la promo, espalda con todos los nombres",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      icon: PartyPopper,
      title: "Viaje de egresados",
      description: "Remeras y buzos para el viaje. Identifica a tu grupo y lleva un recuerdo unico.",
      example: "Remeras para Bariloche + hoodie para las noches frias",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      icon: Camera,
      title: "Fotos de promo",
      description: "Buzos para la sesion de fotos grupal. Quedan increibles con disenos IA unicos.",
      example: "Buzo Hoodie Oversize con diseno artistico generado por IA",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: Music,
      title: "Fiesta de egresados",
      description: "Remeras para la fiesta o el UPD. Disenos divertidos, cada uno con su apodo.",
      example: "Remeras con apodos de cada alumno + frase de la promo",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Trophy,
      title: "Intercolegiales",
      description: "Identifica a tu colegio en eventos deportivos o culturales con merch personalizado.",
      example: "Musculosas para deporte + remeras para la barra",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Heart,
      title: "Regalo para profes",
      description: "Sorprende a tus profesores con una remera o buzo personalizado como agradecimiento.",
      example: "Remera con firma de todos los alumnos + mensaje dedicado",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ]

  const products = [
    { name: "Buzo Hoodie Oversize", price: "$55.000", ideal: "El clasico buzo de egresados", badge: "Mas elegido", discounted: "$49.500" },
    { name: "Buzo Hoodie Oversize", price: "$55.000", ideal: "Premium, look moderno", badge: "Premium", discounted: "$54.000" },
    { name: "Buzo Cuello Redondo", price: "$43.000", ideal: "Opcion economica, mismo estampado", badge: "Mejor precio", discounted: "$38.700" },
    { name: "Remera Classic Fit", price: "$28.600", ideal: "Para el viaje, fotos, fiesta", badge: null, discounted: "$25.740" },
    { name: "Remera Oversize", price: "$31.000", ideal: "Look relajado, unisex", badge: null, discounted: "$27.900" },
    { name: "Musculosa Unisex", price: "$21.800", ideal: "Verano, deporte, playa", badge: "Menor costo", discounted: "$19.620" },
  ]

  const pricingTiers = [
    { range: "1 - 9 un.", discount: "Precio regular", example: "Hoodie $55.000", tag: null },
    { range: "10 - 24 un.", discount: "5% OFF", example: "Hoodie $52.250", tag: null },
    { range: "25 - 49 un.", discount: "10% OFF", example: "Hoodie $49.500", tag: "Curso tipico" },
    { range: "50+ un.", discount: "15% OFF", example: "Hoodie $46.750", tag: "2+ divisiones" },
  ]

  const testimonials = [
    {
      quote: "Los buzos quedaron espectaculares. Cada pibe con su nombre atras y el diseno de la promo en el frente. La IA nos genero algo que ningun otro lugar podia hacer.",
      name: "Valentina M.",
      role: "Delegada promo 2025, Colegio San Martin, CABA",
      rating: 5,
    },
    {
      quote: "Pedimos 35 hoodies y 35 remeras para el viaje. Los buzos llegaron en 6 dias y la calidad es impresionante. Despues de Bariloche siguen como nuevos.",
      name: "Tomas R.",
      role: "Padre organizador, promo 2025, La Plata",
      rating: 5,
    },
    {
      quote: "La mejor decision fue usar la IA para el diseno. Los chicos estaban emocionados viendo como quedaba. Mucho mas original que los buzos tipicos de serigrafia.",
      name: "Carolina S.",
      role: "Profesora tutora, promo 2025, Rosario",
      rating: 5,
    },
  ]

  const whatsappMessage = encodeURIComponent(
    "Hola! Somos la promo [2026] del colegio [nombre]. Somos [cantidad] alumnos y queremos cotizar buzos de egresados. Nos interesan [hoodies/remeras/ambos]."
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
            <span className="text-zinc-300">Buzos de Egresados</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-teal-500/10 to-transparent" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-buzos-egresados.webp"
              alt="Buzo hoodie crema personalizado para promo de egresados Argentina"
            />
            <div className="max-w-3xl">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 mb-6">
                <GraduationCap className="w-3 h-3 mr-1" />
                Promo 2026
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Buzos de egresados{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
                  unicos con diseno IA
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-300 mb-4 leading-relaxed">
                Tu promo merece un buzo que nadie mas tenga. Nuestra IA genera disenos originales
                y cada alumno lleva su nombre. Hoodies desde{" "}
                <span className="text-white font-semibold">$43.000</span>.
                Descuentos por curso completo.
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-zinc-400 mb-8">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Cada buzo con nombre unico</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Diseno IA exclusivo de tu promo</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Algodon 100%, 50+ lavados</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-lg px-8 py-6"
                >
                  <a
                    href={`https://wa.me/5492235169720?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cotizar buzos por WhatsApp
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
                <div className="text-2xl sm:text-3xl font-bold text-cyan-400">500+</div>
                <div className="text-sm text-zinc-400">buzos entregados</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-cyan-400">25+</div>
                <div className="text-sm text-zinc-400">promos atendidas</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-cyan-400">4.9/5</div>
                <div className="text-sm text-zinc-400">calificacion promedio</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-cyan-400">5-7</div>
                <div className="text-sm text-zinc-400">dias de produccion</div>
              </div>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Merch para cada momento de tu promo
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                No es solo un buzo: es el recuerdo de toda una etapa. Hacelo unico.
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
                    <p className="text-sm text-cyan-400 italic">&quot;{uc.example}&quot;</p>
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
                Como pedir los buzos de egresados
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Proceso simple: del concepto al buzo en menos de 10 dias.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
              {[
                { step: "1", icon: Users, title: "Juntense", desc: "Armen el grupo, decidan modelo y cantidad. Un delegado nos contacta por WhatsApp." },
                { step: "2", icon: Sparkles, title: "Disenar con IA", desc: "Describan su concepto y la IA genera opciones unicas. O manden su diseno propio." },
                { step: "3", icon: Shirt, title: "Nombres y talles", desc: "Mandenos la lista de nombres/numeros y talles de cada alumno." },
                { step: "4", icon: Palette, title: "Produccion DTG", desc: "Estampamos cada buzo individualmente. 5-7 dias habiles." },
                { step: "5", icon: Truck, title: "Entrega", desc: "Envio a domicilio o al colegio. Toda Argentina." },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-sm font-mono text-cyan-400 mb-2">Paso {s.step}</div>
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
                Modelos disponibles para egresados
              </h2>
              <p className="text-zinc-400 text-lg">
                Algodon 100% premium. Precio con 10% OFF para cursos de 25+ alumnos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.name} className="bg-zinc-900/50 border-zinc-800 hover:border-cyan-500/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                      {product.badge && (
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-cyan-400">{product.discounted}</span>
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
                Descuentos por cantidad
              </h2>
              <p className="text-zinc-400 text-lg">
                Cuantos mas sean en el curso, menos sale cada buzo. El descuento se aplica al total de prendas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.range}
                  className={`text-center ${tier.tag ? "bg-zinc-800/50 border-cyan-500/30 border-2" : "bg-zinc-900/50 border-zinc-800"}`}
                >
                  <CardContent className="p-5">
                    {tier.tag && (
                      <Badge className="bg-cyan-600 text-white mb-2 text-xs">{tier.tag}</Badge>
                    )}
                    <div className="text-sm text-zinc-400 mb-1">{tier.range}</div>
                    <div className="text-xl font-bold text-white mb-1">{tier.discount}</div>
                    <div className="text-sm text-zinc-500">{tier.example}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl max-w-2xl mx-auto">
              <p className="text-cyan-300 font-medium">
                Ejemplo: Curso de 30 alumnos con Buzo Hoodie Oversize
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                30 x $49.500 = <span className="text-white font-semibold">$1.485.000</span> total
                (ahorro de $165.000 vs precio regular)
              </p>
            </div>
          </div>
        </section>

        {/* Why different */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
              Por que Novamente y no el buzo generico?
            </h2>
            <p className="text-zinc-400 text-lg text-center mb-12 max-w-2xl mx-auto">
              No somos la tipica fabrica de buzos. Somos la primera marca que usa IA para que cada promo tenga algo realmente unico.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Sparkles, title: "Diseno IA exclusivo", desc: "Disenos que ningun otro lugar puede hacer. Tu promo con su propia identidad visual generada por IA.", color: "text-cyan-400" },
                { icon: Flame, title: "Cada buzo es unico", desc: "No hay 30 buzos iguales. Cada alumno con su nombre, numero o apodo. Sin costo extra.", color: "text-amber-400" },
                { icon: Shield, title: "Calidad DTG premium", desc: "Algodon 100%, estampado DTG que resiste 50+ lavados. No se despega, no se craquela.", color: "text-emerald-400" },
                { icon: Clock, title: "Rapido y simple", desc: "De WhatsApp al buzo en 5-7 dias habiles. Sin reuniones, sin ir a ningun lado.", color: "text-violet-400" },
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
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
              Lo que dicen las promos que nos eligieron
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <Card key={t.name} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-cyan-400 text-cyan-400" />
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
              Calificacion promedio: <span className="text-white font-semibold">4.9/5</span> basado en 83 pedidos de egresados
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
              Preguntas frecuentes sobre buzos de egresados
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

        {/* Urgency banner */}
        <section className="py-8 bg-gradient-to-r from-cyan-600/20 to-teal-600/20 border-y border-cyan-500/20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-lg text-white font-semibold mb-2">
              Las promos 2026 ya estan pidiendo sus buzos
            </p>
            <p className="text-zinc-400">
              Cuanto antes pidan, mas opciones de diseno y mas tiempo para ajustes. No dejes para ultimo momento.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <Card className="bg-gradient-to-br from-cyan-600/20 via-teal-500/10 to-zinc-900 border-cyan-500/20">
              <CardContent className="p-8 sm:p-12 text-center">
                <GraduationCap className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Tu promo merece buzos unicos
                </h2>
                <p className="text-lg text-zinc-300 mb-8 max-w-xl mx-auto">
                  Mandanos un WhatsApp con el nombre del colegio, la cantidad de alumnos y el concepto que quieren. Te armamos una propuesta con muestra digital gratuita.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-lg px-8 py-6"
                  >
                    <a
                      href={`https://wa.me/5492235169720?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Cotizar buzos por WhatsApp
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
                  Factura A o B disponible. Aceptamos transferencia y MercadoPago. Enviamos a todo el pais.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cross-sell */}
        <section className="py-12 border-t border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-zinc-500 mb-3">
              Tambien hacemos regalos empresariales y uniformes para equipos de trabajo
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild variant="link" className="text-cyan-400 hover:text-cyan-300">
                <Link href="/regalos-empresariales">
                  Regalos empresariales <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-cyan-400 hover:text-cyan-300">
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
