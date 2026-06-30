import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import { PromoSpotsCounter } from "@/components/partners/PromoSpotsCounter"
import {
  Sparkles, Users, ArrowRight, Star, Truck,
  Shield, Clock, CheckCircle2, Palette, Package,
  Rocket, Store, TrendingUp, ShoppingBag, Zap, Instagram
} from "lucide-react"

export const metadata: Metadata = {
  title: "Lanza Tu Marca de Ropa — Emprender con Remeras Personalizadas | Novamente",
  description:
    "Crea tu propia marca de ropa personalizada sin inversion inicial. Disena con IA, nosotros producimos y enviamos. Tienda online gratis. Sin stock, sin riesgo. Remeras, buzos y hoodies con estampado DTG premium. Programa Partner de Novamente.",
  keywords: [
    "crear marca de ropa",
    "emprender con remeras",
    "lanzar marca de ropa argentina",
    "marca de ropa personalizada",
    "emprendimiento ropa",
    "como crear una marca de ropa",
    "vender remeras personalizadas",
    "negocio de remeras",
    "emprender con ropa",
    "marca de ropa sin inversion",
    "print on demand argentina",
    "crear tienda de ropa online",
  ],
  openGraph: {
    title: "Lanza Tu Marca de Ropa — Novamente",
    description:
      "Crea tu marca de ropa personalizada sin inversion. Disena con IA, nosotros producimos y enviamos. Tienda online gratis.",
    url: "https://www.novamente.ar/lanza-tu-marca",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/remera-negra-front.jpeg",
        width: 800,
        height: 800,
        alt: "Lanza tu marca de ropa personalizada — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lanza Tu Marca de Ropa — Novamente",
    description:
      "Crea tu marca de ropa sin inversion. Disena con IA. Sin stock, sin riesgo. Tienda online gratis.",
  },
  alternates: { canonical: "https://www.novamente.ar/lanza-tu-marca" },
}

export default function LanzaTuMarca() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Lanza Tu Marca de Ropa — Novamente",
    description:
      "Servicio para emprendedores que quieren crear su propia marca de ropa personalizada sin inversion inicial. Diseno con inteligencia artificial, produccion on-demand DTG premium, tienda online incluida, envios a todo el pais. Sin stock, sin riesgo.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Plataforma de Marca de Ropa Personalizada",
    areaServed: {
      "@type": "Country",
      name: "Argentina",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: 0,
      highPrice: 100,
      priceCurrency: "USD",
      offerCount: 3,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "150",
      bestRating: "5",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cuanto cuesta crear mi marca de ropa con Novamente?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "El plan Starter es 100% gratis: tenes tienda online, diseno con IA, y produccion on-demand sin costo fijo. Solo pagas cuando vendes (prendas a precio partner B2B). El plan Growth (USD$50/mes, -15% en plan anual) suma SEO completo, analytics, Design Engine y prendas a un precio aun mas competitivo para que tu margen sea mucho mayor. El plan Pro (USD$100/mes, -15% en plan anual) suma chatbot WhatsApp + Instagram, automatizacion de contenido IG/FB/X, Meta Ads y onboarding 1:1.",
        },
      },
      {
        "@type": "Question",
        name: "Necesito invertir en stock o inventario?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. El modelo es on-demand: cada prenda se produce cuando se vende. No necesitas comprar stock, alquilar deposito, ni arriesgar capital. Tu unico trabajo es disenar y vender — nosotros producimos y enviamos.",
        },
      },
      {
        "@type": "Question",
        name: "Como funciona la ganancia? Cuanto puedo ganar?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Vos pones el precio de venta. El costo de produccion es fijo (ej: remera $28.600). Si la vendes a $45.000, tu ganancia es $16.400 por remera. Vendiendo 50 remeras al mes son $820.000 de ganancia. Con 100 remeras, $1.640.000. El margen lo decidis vos.",
        },
      },
      {
        "@type": "Question",
        name: "Necesito saber disenar para crear mi marca?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Nuestra IA genera disenos profesionales a partir de descripciones de texto. Describis tu idea ('logo minimalista para marca streetwear') y la IA crea opciones en segundos. Tambien podes subir tus propios disenos si ya tenes.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tarda en estar lista mi tienda?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tu tienda puede estar online en menos de 24 horas. Te registras, elegis nombre de marca, subis o generas disenos con IA, pones precios, y listo. Tu tienda esta en novamente.ar/p/tu-marca (o tu dominio propio con Growth/Pro).",
        },
      },
      {
        "@type": "Question",
        name: "Que pasa con los envios y la atencion al cliente?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nosotros nos encargamos de todo: produccion, empaque, envio a todo el pais, y soporte logistico. Vos te concentras en disenar y hacer crecer tu marca. Es como tener un equipo de produccion completo sin contratar a nadie.",
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
        name: "Lanza Tu Marca",
        item: "https://www.novamente.ar/lanza-tu-marca",
      },
    ],
  }

  const useCases = [
    {
      icon: Instagram,
      title: "Marca de Instagram / TikTok",
      description: "La clasica: arrancas vendiendo por redes sociales, tu comunidad te sigue, y la ropa se vende sola. Streetwear, frases, aesthetic, lo que sea tu onda.",
      example: "Marca streetwear con 500 seguidores que vende 30 remeras/mes",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      icon: Palette,
      title: "Artistas / Ilustradores / Disenadores",
      description: "Tus dibujos, ilustraciones o arte en remeras y buzos. Monetiza tu arte sin perder la propiedad. Cada diseno es tuyo.",
      example: "Ilustradora que vende remeras con sus personajes en Reels",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: Rocket,
      title: "Emprendedor de primera vez",
      description: "Queres arrancar tu primer negocio y no sabes por donde. Ropa personalizada es el emprendimiento mas accesible: bajo riesgo, alta demanda, margen saludable.",
      example: "Estudiante que empieza vendiendo a companeros y escala",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Store,
      title: "Marca ya existente que quiere escalar",
      description: "Ya vendes ropa pero producis artesanalmente o con serigrafia. Con DTG podes producir desde 1 unidad sin setup, expandir tu catalogo, y dejar de stockear.",
      example: "Marca con 2K seguidores que pasa de serigrafia a DTG on-demand",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Users,
      title: "Comunidades y movimientos",
      description: "Clubes de barrio, comunidades online, colectivos, activismo. Ropa que une a la gente alrededor de una causa o identidad compartida.",
      example: "Club de running que vende remeras a sus 200 miembros",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      icon: ShoppingBag,
      title: "Revendedores / Showrooms",
      description: "Compras al costo y revendes en tu showroom, feria, o tienda. Descuentos por volumen hasta 15% OFF. Sin compromiso de continuidad.",
      example: "Showroom en Flores que revende 100+ remeras/mes con 40% margen",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
  ]

  const plans = [
    {
      name: "Starter",
      price: "Gratis",
      priceDetail: "$0 por siempre",
      features: [
        "Tienda en novamente.ar/p/tu-marca",
        "Diseno con IA ilimitado",
        "Produccion on-demand",
        "Sin stock ni inversion",
        "Soporte por WhatsApp",
      ],
      cta: "Empezar gratis",
      highlighted: false,
    },
    {
      name: "Growth",
      price: "USD$50/mes",
      priceDetail: "Prendas al costo · margen alto para vos",
      features: [
        "Todo lo de Starter +",
        "Prendas al costo Novamente (margen alto para vos)",
        "Productos y leads ilimitados",
        "Branding avanzado + SEO completo",
        "Design Engine (mockups + estilos)",
        "Analytics y metricas",
        "Destacado en /marcas",
        "Soporte prioritario por email",
      ],
      cta: "Elegir Growth",
      highlighted: true,
    },
    {
      name: "Pro",
      price: "USD$100/mes",
      priceDetail: "Chatbot + automatizacion de contenido",
      features: [
        "Todo lo de Growth +",
        "Chatbot WhatsApp + Instagram DM",
        "Automatizacion de contenido IG / FB / X",
        "Setup Meta Business + plantillas de Meta Ads",
        "Feed Meta Commerce / Google Shopping",
        "Top del directorio /marcas",
        "Onboarding 1:1 (60 min)",
        "Soporte WhatsApp prioritario",
      ],
      cta: "Elegir Pro",
      highlighted: false,
    },
  ]

  const testimonials = [
    {
      quote: "Arranque mi marca de streetwear con $0. Literal. Hice los disenos con la IA, puse la tienda online y empece a vender por Instagram. El primer mes vendi 25 remeras y gane casi $500K. Ahora es mi ingreso principal.",
      name: "Tomas R.",
      role: "Fundador de marca streetwear — La Plata",
      rating: 5,
    },
    {
      quote: "Soy ilustradora y siempre quise vender mi arte en remeras pero no tenia plata para stockear. Con Novamente subi mis dibujos, puse precios, y a la semana ya estaba vendiendo. No me tengo que preocupar por nada de produccion.",
      name: "Valentina S.",
      role: "Ilustradora y emprendedora — CABA",
      rating: 5,
    },
    {
      quote: "Teniamos una marca chica y haciamos serigrafia. Era un quilombo: minimos de 50 unidades, colores limitados, setup caro. Con Novamente producimos desde 1 unidad, los colores salen perfectos, y escalamos a 150 ventas/mes sin stress.",
      name: "Facu y Mili",
      role: "Co-fundadores de marca de ropa — Cordoba",
      rating: 5,
    },
  ]

  const whatsappMessage = encodeURIComponent(
    "Hola! Quiero lanzar mi propia marca de ropa con Novamente. Mi idea es [describir la marca/estilo]. Quiero saber mas sobre el programa Partner y como empezar."
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
            <span className="text-zinc-300">Lanza Tu Marca</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-teal-500/10 to-transparent" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-lanza-tu-marca.webp"
              alt="Founder argentina con prenda de su marca propia producida por Novamente"
            />
            <div className="max-w-3xl">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-6">
                <Rocket className="w-3 h-3 mr-1" />
                Emprendedores
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Lanza tu marca de ropa{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  sin inversion inicial
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-300 mb-4 leading-relaxed">
                Crea tu propia marca de ropa personalizada con IA.
                Nosotros producimos y enviamos. Vos diseñas, pones el precio, y te quedas con la ganancia.
                Tienda online gratis. <span className="text-white font-semibold">Sin stock, sin riesgo.</span>
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-zinc-400 mb-8">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Plan Starter 100% gratis</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sin stock ni inventario</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tienda online en 24hs</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-lg px-8 py-6"
                >
                  <Link href="/partners/join">
                    Crear mi marca gratis
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-lg px-8 py-6"
                >
                  <a
                    href={`https://wa.me/5492235169720?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Hablar con un asesor
                  </a>
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
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400">50+</div>
                <div className="text-sm text-zinc-400">marcas activas</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400">$0</div>
                <div className="text-sm text-zinc-400">inversion inicial</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400">24hs</div>
                <div className="text-sm text-zinc-400">tienda online lista</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400">40%+</div>
                <div className="text-sm text-zinc-400">margen de ganancia</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                De la idea a tu marca en 4 pasos
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Mas facil que abrir una cuenta de Instagram. En serio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { step: "1", icon: Store, title: "Registrate gratis", desc: "Elegis nombre de marca, logo, y estilo. Tu tienda esta en novamente.ar/p/tu-marca en minutos." },
                { step: "2", icon: Sparkles, title: "Disena con IA", desc: "Nuestra IA genera disenos profesionales a partir de tus ideas. Tambien podes subir tus propios disenos." },
                { step: "3", icon: TrendingUp, title: "Pone tus precios", desc: "El costo de produccion es fijo. Vos elegis el precio de venta y tu margen. Recomendamos 40-60% de margen." },
                { step: "4", icon: Package, title: "Nosotros hacemos el resto", desc: "Cuando alguien compra, nosotros producimos, empacamos y enviamos. Vos cobras la ganancia." },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-sm font-mono text-emerald-400 mb-2">Paso {s.step}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-zinc-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Para quien es esto?
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Si alguno de estos te identifica, Novamente es para vos.
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
                    <p className="text-sm text-emerald-400 italic">&quot;{uc.example}&quot;</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Earnings calculator */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Cuanto podes ganar con tu marca
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Numeros reales basados en remera classic fit a $28.600 costo → $45.000 venta.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  scenario: "Hobby (20 ventas/mes)",
                  profit: "$16.400",
                  total: "$328.000",
                  annual: "$3.936.000",
                  detail: "Vendiendo a amigos y por Instagram stories",
                  tag: "Arrancar",
                },
                {
                  scenario: "Side hustle (50 ventas/mes)",
                  profit: "$16.400",
                  total: "$820.000",
                  annual: "$9.840.000",
                  detail: "Marketing activo en redes + boca a boca",
                  tag: "Crecer",
                },
                {
                  scenario: "Negocio (100+ ventas/mes)",
                  profit: "$16.400",
                  total: "$1.640.000",
                  annual: "$19.680.000",
                  detail: "Marca establecida con comunidad y ads",
                  tag: "Escalar",
                },
              ].map((calc) => (
                <Card key={calc.scenario} className="bg-zinc-800/50 border-zinc-700 hover:border-emerald-500/30 transition-all">
                  <CardContent className="p-6">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs mb-3">{calc.tag}</Badge>
                    <h3 className="text-lg font-semibold text-white mb-4">{calc.scenario}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Ganancia por remera</span>
                        <span className="text-zinc-300">{calc.profit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Ganancia mensual</span>
                        <span className="text-emerald-400 font-semibold">{calc.total}</span>
                      </div>
                      <div className="border-t border-zinc-700 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-300 font-semibold">Ganancia anual</span>
                          <span className="text-emerald-400 font-bold text-lg">{calc.annual}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{calc.detail}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl max-w-2xl mx-auto">
              <p className="text-emerald-300 font-medium">
                Con hoodies ($55.000 costo → $85.000 venta) el margen sube a $30.000 por unidad
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                Mezclar remeras, buzos y hoodies te da un ticket promedio mas alto
              </p>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Planes para cada etapa
              </h2>
              <p className="text-zinc-400 text-lg">
                Arranca gratis y escala cuando estes listo.
              </p>
            </div>

            <PromoSpotsCounter className="mb-8" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`${plan.highlighted ? "bg-zinc-800/50 border-emerald-500/30 border-2" : "bg-zinc-900/50 border-zinc-800"}`}
                >
                  <CardContent className="p-6">
                    {plan.highlighted && (
                      <Badge className="bg-emerald-600 text-white mb-3 text-xs">Mas popular</Badge>
                    )}
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    {plan.name === "Growth" ? (
                      <>
                        <span className="text-sm text-zinc-500 line-through">{plan.price}</span>
                        <div className="text-2xl font-bold text-emerald-400">USD$25/mes</div>
                        <p className="text-[11px] font-semibold text-amber-500 mb-1">🔥 50% OFF primer año · primeros 100 partners</p>
                      </>
                    ) : (
                      <div className="text-2xl font-bold text-emerald-400 mb-1">{plan.price}</div>
                    )}
                    <p className="text-sm text-zinc-500 mb-4">{plan.priceDetail}</p>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className={`w-full ${plan.highlighted ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}
                    >
                      <Link href="/partners/join">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Novamente vs DIY */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Por que Novamente y no hacerlo solo?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="bg-red-500/5 border-red-500/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-red-400 mb-4">Hacerlo solo (serigrafia, stock)</h3>
                  <ul className="space-y-3 text-sm text-zinc-400">
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✕</span> Inversion inicial $500K-$2M en stock</li>
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✕</span> Minimo 50-100 unidades por diseno</li>
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✕</span> Riesgo de stock que no se vende</li>
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✕</span> Colores limitados (serigrafia)</li>
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✕</span> Vos empaques, envias, atendes reclamos</li>
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✕</span> Setup caro por cada diseno nuevo</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-emerald-500/5 border-emerald-500/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-emerald-400 mb-4">Con Novamente (DTG, on-demand)</h3>
                  <ul className="space-y-3 text-sm text-zinc-300">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> $0 inversion — pagas solo cuando vendes</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> Desde 1 unidad, sin minimos</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> Cero riesgo — no stockeas nada</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> Colores ilimitados, fotos, degradados</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> Nosotros producimos, empacamos y enviamos</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> $0 setup por diseno nuevo</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
              Emprendedores que ya lanzaron su marca
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <Card key={t.name} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-emerald-400 text-emerald-400" />
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
              Calificacion promedio: <span className="text-white font-semibold">4.8/5</span> basado en 150 emprendedores
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20">
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
            <Card className="bg-gradient-to-br from-emerald-600/20 via-teal-500/10 to-zinc-900 border-emerald-500/20">
              <CardContent className="p-8 sm:p-12 text-center">
                <Rocket className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Tu marca empieza hoy
                </h2>
                <p className="text-lg text-zinc-300 mb-8 max-w-xl mx-auto">
                  Registrate gratis, disena tu primer producto con IA, y tene tu tienda online en menos de 24 horas.
                  Sin inversion, sin stock, sin excusas.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-lg px-8 py-6"
                  >
                    <Link href="/partners/join">
                      Crear mi marca gratis
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-lg px-8 py-6"
                  >
                    <a
                      href={`https://wa.me/5492235169720?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Consultar por WhatsApp
                    </a>
                  </Button>
                </div>

                <p className="text-sm text-zinc-500 mt-6">
                  Plan Starter gratis por siempre. Upgrade cuando quieras. Cancela cuando quieras.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cross-sell */}
        <section className="py-12 border-t border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-zinc-500 mb-3">
              Tambien hacemos merch para bandas, creadores, eventos, equipos deportivos y regalos corporativos
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild variant="link" className="text-emerald-400 hover:text-emerald-300">
                <Link href="/merch-para-creadores">
                  Merch para creadores <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-emerald-400 hover:text-emerald-300">
                <Link href="/merch-para-bandas">
                  Merch para bandas <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-emerald-400 hover:text-emerald-300">
                <Link href="/blog/como-crear-merch-sin-inversion">
                  Guia: merch sin inversion <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-emerald-400 hover:text-emerald-300">
                <Link href="/disena-tu-remera">
                  Disena tu remera <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
