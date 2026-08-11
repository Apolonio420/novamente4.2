import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import {
  Sparkles, Zap, Users, ArrowRight, Star, Truck,
  Shield, Clock, CheckCircle2, Palette, Package,
  Youtube, Twitch, Instagram, Mic, Gamepad2, Pen
} from "lucide-react"
import { totalDeliveryLine, productionLine, shippingZonesDetailLine } from "@/lib/shipping-config"

export const metadata: Metadata = {
  title: "Merch para Creadores de Contenido — YouTubers, Streamers e Influencers | Novamente",
  description:
    "Crea tu linea de merch personalizada con IA. Remeras, hoodies y buzos para youtubers, streamers, podcasters e influencers. Sin minimo de cantidad, sin inversion inicial. Estampado DTG premium. Envios a toda Argentina.",
  keywords: [
    "merch para youtubers",
    "merch para streamers",
    "merch personalizado creadores",
    "remeras para influencers",
    "merchandising youtubers argentina",
    "crear merch personalizado",
    "merch para podcasters",
    "remeras para streamers",
    "tienda de merch",
    "hacer merch online",
    "merch gaming",
    "merch creadores de contenido",
  ],
  openGraph: {
    title: "Merch para Creadores de Contenido con IA — Novamente",
    description:
      "Lanza tu linea de merch sin inversion. Remeras y hoodies con disenos IA, DTG premium. Sin minimo de cantidad. Para YouTubers, streamers e influencers.",
    url: "https://www.novamente.ar/merch-para-creadores",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/oversize-negro-front.jpeg",
        width: 800,
        height: 800,
        alt: "Merch para creadores de contenido — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Merch para Creadores de Contenido con IA — Novamente",
    description:
      "Lanza tu merch sin inversion. Disenos IA, DTG premium. Sin minimo. Para YouTubers, streamers e influencers.",
  },
  alternates: { canonical: "https://www.novamente.ar/merch-para-creadores" },
}

export default function MerchParaCreadores() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Merch para Creadores de Contenido — Novamente",
    description:
      "Servicio de merchandising personalizado con inteligencia artificial para creadores de contenido, youtubers, streamers, podcasters e influencers. Remeras, hoodies y buzos con disenos unicos generados por IA, estampado DTG premium sobre algodon 100%. Sin minimo de cantidad, sin inversion inicial.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Merch Personalizado para Creadores de Contenido",
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
      reviewCount: "43",
      bestRating: "5",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cuanto cuesta crear mi linea de merch?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No hay costo inicial ni inversion. Solo pagas cuando vendes o cuando pedis stock. Remeras desde $28.600, hoodies desde $43.000, musculosas desde $21.800. Con nuestro programa Partner podes vender a tu precio y quedarte con la diferencia.",
        },
      },
      {
        "@type": "Question",
        name: "Hay minimo de cantidad para pedir?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No, podes pedir desde 1 unidad. Esto es ideal para creadores que recien empiezan. A medida que crecen tus ventas, los descuentos por cantidad arrancan: 5% en 10-24 unidades y 10% en 25+. Muchos creadores empiezan con 5-10 unidades y escalan.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo disenar con inteligencia artificial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, nuestra IA genera disenos unicos para tu marca personal. Describis tu concepto, estilo, colores, y la IA crea opciones profesionales. Si tenes un logo o diseno propio, tambien podes subirlo directamente. Muchos creadores combinan ambas opciones.",
        },
      },
      {
        "@type": "Question",
        name: "Como funciona el programa Partner para creadores?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Te creas una tienda gratis en novamente.ar/p/tu-marca. Elegis productos, subis disenos (o usas IA), pones tu precio. Cuando alguien compra, nosotros producimos y enviamos. Vos te quedas con la ganancia. Sin stock, sin logistica, sin inversion.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto puedo ganar vendiendo merch?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Depende de tu audiencia y precios. Ejemplo: una remera te cuesta $28.600, la vendes a $45.000, ganas $16.400 por unidad. Un hoodie: costo $43.000, venta $70.000, ganancia $27.000. Creadores con 10K seguidores suelen vender 20-50 unidades por drop.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto demora la produccion y envio?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Produccion en ${productionLine()} con estampado DTG. Envio: ${shippingZonesDetailLine()}. Total: ${totalDeliveryLine()} desde el pedido hasta la puerta del comprador.`,
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
        name: "Merch para Creadores",
        item: "https://www.novamente.ar/merch-para-creadores",
      },
    ],
  }

  const useCases = [
    {
      icon: Youtube,
      title: "YouTubers",
      description: "Lanza merch que represente tu canal. Remeras con catchphrases, logos y disenos que tu audiencia quiere usar.",
      example: "Remera 'Sumate al club' con logo del canal + hoodie edicion limitada",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      icon: Twitch,
      title: "Streamers",
      description: "Merch gaming para tu comunidad. Emotes, inside jokes, y disenos que solo tus viewers entienden.",
      example: "Hoodie negro con emote custom + musculosa 'Sub Day 2026'",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: Instagram,
      title: "Influencers",
      description: "Ropa que extiende tu marca personal. Estetica cuidada, disenos que tus seguidores van a querer postear.",
      example: "Coleccion capsule: 3 remeras oversize con arte IA de tu estilo",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      icon: Mic,
      title: "Podcasters",
      description: "Tu podcast merece merch. Frases iconicas, logos, arte de portada en remeras que tus oyentes van a amar.",
      example: "Remera con frase viral del podcast + buzo 'Temporada 3'",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Gamepad2,
      title: "Gaming & Esports",
      description: "Uniformes para tu equipo o merch para tu marca gamer. Disenos agresivos, colores vibrantes, calidad pro.",
      example: "Set de remeras para el team + hoodie con tu logo de clan",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Pen,
      title: "Artistas & Ilustradores",
      description: "Convierte tu arte en ropa. Subi tus ilustraciones o usa IA para crear variaciones. Cada prenda es un lienzo.",
      example: "Serie de remeras con 4 ilustraciones originales en edicion limitada",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
  ]

  const products = [
    { name: "Remera Classic Fit", price: "$28.600", sellAt: "$45.000", profit: "$16.400", badge: "Mas margen %" },
    { name: "Remera Oversize", price: "$31.000", sellAt: "$50.000", profit: "$19.000", badge: "Mas vendida" },
    { name: "Musculosa Unisex", price: "$21.800", sellAt: "$35.000", profit: "$13.200", badge: "Menor costo" },
    { name: "Remera Crop Mujer", price: "$23.500", sellAt: "$38.000", profit: "$14.500", badge: null },
    { name: "Buzo Hoodie Oversize", price: "$55.000", sellAt: "$85.000", profit: "$30.000", badge: "Premium" },
    { name: "Buzo Cuello Redondo", price: "$43.000", sellAt: "$70.000", profit: "$27.000", badge: null },
  ]

  const pricingTiers = [
    { range: "1 - 9 un.", discount: "Precio regular", example: "Remera $28.600", tag: "Empezando" },
    { range: "10 - 24 un.", discount: "5% OFF", example: "Remera $27.170", tag: "Drop chico" },
    { range: "25+ un.", discount: "10% OFF", example: "Remera $25.740", tag: "Drop grande" },
  ]

  const testimonials = [
    {
      quote: "Empece con 10 remeras para probar y se vendieron en 2 dias. Ahora hago drops mensuales de 50+ unidades. La IA me genera disenos increibles que mi comunidad ama.",
      name: "Tomas R.",
      role: "YouTuber, 85K suscriptores, Buenos Aires",
      rating: 5,
    },
    {
      quote: "Lo mejor es que no tuve que invertir nada. Cree mi tienda partner, subi los disenos, y cuando alguien compra ellos se encargan de todo. Ya llevo 3 drops exitosos.",
      name: "Valentina M.",
      role: "Streamer, 12K followers, Twitch",
      rating: 5,
    },
    {
      quote: "La calidad DTG es excelente, mucho mejor que la serigrafia que use antes. Mis seguidores notan la diferencia. Y poder pedir desde 1 unidad es clave para probar disenos nuevos.",
      name: "Nicolas F.",
      role: "Podcaster e influencer, 45K en Instagram",
      rating: 4,
    },
  ]

  const steps = [
    {
      step: "01",
      title: "Crea tu marca",
      description: "Registrate gratis como Partner y arma tu tienda en novamente.ar/p/tu-marca. Sin costo inicial.",
    },
    {
      step: "02",
      title: "Disena con IA",
      description: "Usa nuestra IA para generar disenos unicos o subi tus propios logos e ilustraciones.",
    },
    {
      step: "03",
      title: "Pone tu precio",
      description: "Elegis los productos, pones el precio que quieras. La diferencia entre tu precio y el costo es tu ganancia.",
    },
    {
      step: "04",
      title: "Nosotros hacemos el resto",
      description: "Producimos con DTG, embalamos y enviamos a toda Argentina. Vos concentrate en crear contenido.",
    },
  ]

  const whatsappMessage = encodeURIComponent(
    "Hola! Soy creador de contenido y quiero armar mi linea de merch. Mi canal/cuenta es [nombre] y tengo [cantidad] seguidores. Me gustaria saber como arrancar."
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
            <span className="text-zinc-300">Merch para Creadores</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-500/10 to-transparent" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-otono-streetwear.webp"
              alt="Creador de contenido argentino con merch personalizado Novamente"
            />
            <div className="max-w-3xl">
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 mb-6">
                <Sparkles className="w-3 h-3 mr-1" />
                Para creadores de contenido
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Tu contenido merece{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                  merch a la altura
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-300 mb-4 leading-relaxed">
                Lanza tu linea de merch sin invertir un peso. Nuestra IA genera disenos
                unicos para tu marca y producimos on-demand con DTG premium.
                Sin stock, sin riesgo, sin minimos. Remeras desde{" "}
                <span className="text-white font-semibold">$28.600</span>.
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-zinc-400 mb-8">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Sin inversion inicial</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Sin minimo de cantidad</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Disenos con IA</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-violet-400" /> DTG premium</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 text-white text-lg px-8 py-6">
                  <Link href="/partners/join">
                    <Zap className="w-5 h-5 mr-2" />
                    Crea tu tienda gratis
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-lg px-8 py-6">
                  <Link href={`https://wa.me/5492235169720?text=${whatsappMessage}`} target="_blank">
                    Consultar por WhatsApp
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y border-zinc-800 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">50+</p>
              <p className="text-sm text-zinc-400">Creadores activos</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">1,200+</p>
              <p className="text-sm text-zinc-400">Disenos creados</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">4.8/5</p>
              <p className="text-sm text-zinc-400">Satisfaccion</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">2-5 dias</p>
              <p className="text-sm text-zinc-400">Produccion</p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Merch para cada tipo de creador
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                No importa tu plataforma ni tu nicho. Si tenes una audiencia, podes monetizarla con merch.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCases.map((uc, i) => (
                <Card key={i} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${uc.bg} flex items-center justify-center mb-4`}>
                      <uc.icon className={`w-6 h-6 ${uc.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{uc.title}</h3>
                    <p className="text-zinc-400 text-sm mb-3">{uc.description}</p>
                    <p className="text-xs text-zinc-500 italic">{uc.example}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-24 bg-zinc-900/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                De la idea al merch en 4 pasos
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Vos creas contenido, nosotros hacemos el merch. Asi de simple.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((s, i) => (
                <div key={i} className="relative">
                  <div className="text-5xl font-black text-violet-500/20 mb-2">{s.step}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-zinc-400 text-sm">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Profit Calculator */}
        <section className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Cuanto podes ganar con tu merch
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Vos pones el precio. La diferencia entre tu precio y el costo de produccion es tu ganancia pura.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p, i) => (
                <Card key={i} className="bg-zinc-900/50 border-zinc-800 hover:border-violet-500/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-white">{p.name}</h3>
                      {p.badge && (
                        <Badge variant="secondary" className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                          {p.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Tu costo</span>
                        <span className="text-zinc-300">{p.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Precio sugerido</span>
                        <span className="text-zinc-300">{p.sellAt}</span>
                      </div>
                      <div className="border-t border-zinc-800 pt-2 flex justify-between">
                        <span className="text-violet-400 font-semibold">Tu ganancia</span>
                        <span className="text-violet-400 font-bold text-lg">{p.profit}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 p-6 bg-violet-500/10 border border-violet-500/20 rounded-xl text-center">
              <p className="text-violet-300 text-lg">
                <span className="font-bold">Ejemplo:</span> Si vendes 30 remeras oversize en un drop → ganancia de{" "}
                <span className="text-white font-bold text-xl">$570.000</span>
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                Sin contar descuentos por volumen que aumentan tu margen aun mas
              </p>
            </div>
          </div>
        </section>

        {/* Volume discounts */}
        <section className="py-16 sm:py-24 bg-zinc-900/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Mas vendes, mas ganas
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Descuentos por cantidad que aumentan tu margen a medida que creces.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {pricingTiers.map((tier, i) => (
                <Card key={i} className={`bg-zinc-900/50 border-zinc-800 ${i === 2 ? "ring-2 ring-violet-500/30" : ""}`}>
                  <CardContent className="p-6 text-center">
                    {tier.tag && (
                      <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 mb-3 text-xs">
                        {tier.tag}
                      </Badge>
                    )}
                    <p className="text-2xl font-bold text-white mb-1">{tier.range}</p>
                    <p className="text-violet-400 font-semibold mb-2">{tier.discount}</p>
                    <p className="text-sm text-zinc-500">{tier.example}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Novamente */}
        <section className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Por que creadores eligen Novamente
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Sparkles, title: "Disenos con IA", desc: "Genera disenos unicos con inteligencia artificial. Describe tu idea y la IA crea arte profesional." },
                { icon: Package, title: "Sin stock ni riesgo", desc: "Produccion on-demand. No necesitas comprar stock por adelantado. Producimos cuando vendes." },
                { icon: Palette, title: "Tu marca, tu estilo", desc: "Tienda propia en novamente.ar con tu nombre, logo y productos. 100% personalizable." },
                { icon: Truck, title: "Envio a toda Argentina", desc: "Nosotros nos encargamos del packaging y envio. AMBA, interior y todo el pais." },
                { icon: Shield, title: "DTG premium", desc: "Estampado directo sobre algodon 100%. Colores vibrantes, durabilidad y detalle fotografico." },
                { icon: Clock, title: "Produccion rapida", desc: "2-5 dias habiles de produccion. Tu audiencia recibe su merch rapido." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-zinc-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-24 bg-zinc-900/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Creadores que ya venden con Novamente
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <Card key={i} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`w-4 h-4 ${j < t.rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"}`} />
                      ))}
                    </div>
                    <p className="text-zinc-300 text-sm mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                    <div>
                      <p className="text-white font-medium text-sm">{t.name}</p>
                      <p className="text-zinc-500 text-xs">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Preguntas frecuentes
              </h2>
            </div>

            <div className="space-y-4">
              {faqJsonLd.mainEntity.map((faq, i) => (
                <Card key={i} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6">
                    <h3 className="text-white font-semibold mb-2">{faq.name}</h3>
                    <p className="text-zinc-400 text-sm">{faq.acceptedAnswer.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-violet-950/30 to-zinc-950">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Tu audiencia ya esta lista para comprar tu merch
            </h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
              Crea tu tienda gratis en minutos. Sin inversion, sin riesgo.
              Concentrate en crear contenido, nosotros nos encargamos del resto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 text-white text-lg px-8 py-6">
                <Link href="/partners/join">
                  <Zap className="w-5 h-5 mr-2" />
                  Crear mi tienda gratis
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-lg px-8 py-6">
                <Link href={`https://wa.me/5492235169720?text=${whatsappMessage}`} target="_blank">
                  Hablar por WhatsApp
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Cross-sell */}
            <div className="mt-12 pt-8 border-t border-zinc-800">
              <p className="text-zinc-500 text-sm mb-4">Tambien te puede interesar</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <Link href="/regalos-empresariales">Regalos Empresariales</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <Link href="/uniformes-personalizados">Uniformes Personalizados</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <Link href="/disena-tu-remera">Disena tu Remera</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <Link href="/blog/como-crear-merch-sin-inversion">Guia: Merch sin Inversion</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
