import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles, Users, ArrowRight, Star, Truck,
  Shield, Clock, CheckCircle2, Palette, Package,
  Music, Mic2, Radio, Disc3, Guitar, HeadphonesIcon
} from "lucide-react"

export const metadata: Metadata = {
  title: "Merch para Bandas y Musicos — Remeras Personalizadas | Novamente",
  description:
    "Remeras, buzos y merch personalizado para bandas, musicos y artistas. Disena con IA el logo de tu banda. Desde 1 unidad. Ideal para shows, giras, lanzamientos y venta a fans. Estampado DTG premium. Envios a toda Argentina.",
  keywords: [
    "merch para bandas",
    "remeras para bandas personalizadas",
    "merchandising musical",
    "merch bandas argentina",
    "remeras banda de rock",
    "merchandising para musicos",
    "remeras personalizadas banda",
    "merch para artistas",
    "remeras para shows",
    "merch gira musical",
    "vender merch banda",
    "remeras bandas independientes",
  ],
  openGraph: {
    title: "Merch para Bandas y Musicos — Novamente",
    description:
      "Remeras y buzos personalizados para tu banda. Disena con IA. Ideal para shows, giras y venta a fans. DTG premium, algodon 100%.",
    url: "https://www.novamente.ar/merch-para-bandas",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/remera-negra-front.jpeg",
        width: 800,
        height: 800,
        alt: "Merch para bandas personalizado — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Merch para Bandas y Musicos — Novamente",
    description:
      "Merch personalizado para bandas. Disena con IA. Shows, giras, venta a fans. DTG premium. Descuentos por volumen.",
  },
  alternates: { canonical: "https://www.novamente.ar/merch-para-bandas" },
}

export default function MerchParaBandas() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Merch para Bandas y Musicos — Novamente",
    description:
      "Servicio de remeras, buzos y merchandising personalizado con inteligencia artificial para bandas, musicos y artistas. Estampado DTG premium sobre algodon 100%. Ideal para shows, giras, lanzamientos y venta a fans. Desde 1 unidad con descuentos por volumen.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Merchandising Musical Personalizado",
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
      ratingValue: "4.9",
      reviewCount: "280",
      bestRating: "5",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cuanto cuesta el merch para mi banda?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Remeras desde $28.600 (classic fit) y $31.000 (oversize). Musculosas desde $21.800. Hoodies desde $43.000. Descuentos por volumen: 5% en 10-24 un., 10% en 25-99 un. y 15% en 100+ unidades. Un lote de 30 remeras para un show sale $25.740/un. (10% OFF).",
        },
      },
      {
        "@type": "Question",
        name: "Puedo vender el merch a mis fans y ganar plata?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, es la idea. Compras al costo de produccion y lo vendes al precio que quieras. Ejemplo: remera a $28.600 costo → la vendes a $45.000-$55.000 en shows = $16.400-$26.400 de ganancia por remera. Si vendes 30 en un show son $492.000-$792.000 de ganancia neta.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo disenar el logo de mi banda con la IA?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, nuestra IA genera logos, arte de album, y disenos unicos para tu banda. Describis el estilo (ej: 'logo de rock pesado con calavera y rayos') y la IA crea opciones profesionales. Tambien podes subir tu arte existente y lo adaptamos.",
        },
      },
      {
        "@type": "Question",
        name: "Hay minimo de unidades?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No, podes pedir desde 1 unidad. No hay minimo. Pero si pedis 10+ unidades tenes descuentos por volumen. Muchas bandas arrancan con 20-30 para un show y despues van reponiendo segun la demanda.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tardan en llegar?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Produccion de 5-7 dias habiles para pedidos de hasta 50 unidades. Para pedidos grandes (50-100+), 7-10 dias habiles. Envio a todo el pais en 2-5 dias adicionales. Si tenes un show importante, consulta por produccion express.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo hacer disenos diferentes para cada tema o disco?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, con DTG cada remera se imprime individualmente, asi que podes tener disenos distintos: uno por tema, uno por disco, ediciones limitadas de gira, etc. No hay setup extra por diseno nuevo. Ideal para colecciones y drops.",
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
        name: "Merch para Bandas",
        item: "https://www.novamente.ar/merch-para-bandas",
      },
    ],
  }

  const useCases = [
    {
      icon: Guitar,
      title: "Rock / Indie / Punk",
      description: "Remeras con el logo de tu banda, arte de disco, o disenos de gira. La clasica del rock: merch negro con arte impactante que tus fans van a usar con orgullo.",
      example: "50 remeras negras 'Los Fundamentalistas del Aire — Gira 2026'",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      icon: Mic2,
      title: "Rap / Trap / Hip-Hop",
      description: "Merch oversize con estetica urbana. Logos, frases ichonicas, arte de single, o tu cara estilizada por IA. El trap argentino necesita merch a la altura.",
      example: "30 oversize blancas 'DUKI — Antes de Ameri Tour'",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      icon: Music,
      title: "Cumbia / Tropical / Cuarteto",
      description: "Remeras coloridas para tu banda tropical. Diseños festivos, logo con onda, merch para bailar. Ideal para vender en shows y bailantas.",
      example: "40 remeras 'La Delio Valdez — Temporada de Carnaval'",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: HeadphonesIcon,
      title: "DJs / Electronica / Productores",
      description: "Merch minimalista o psicodelico para DJs y productores. Logo, alias, arte de set. Ideal para festivales y fiestas electronicas.",
      example: "25 remeras negras 'DJ Krol — Creamfields Argentina'",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      icon: Radio,
      title: "Covers / Tributo / Acustico",
      description: "Bandas de covers que hacen shows toda la semana. Merch para el pub, la peña, el evento privado. Tu logo + las noches que toca tu banda.",
      example: "20 remeras 'The Pretenders BA — Viernes en Niceto'",
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      icon: Users,
      title: "Coros / Ensambles / Orquestas",
      description: "Remeras o buzos para tu coro, ensamble, o grupo musical. Identidad visual para presentaciones, concursos, y vida cotidiana del grupo.",
      example: "35 buzos 'Coro Municipal de San Isidro — Temporada 2026'",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ]

  const products = [
    { name: "Remera Classic Fit", price: "$28.600", ideal: "La clasica del merch. Algodon suave, ideal para estampar arte", badge: "Mas vendida", discounted: "$25.740" },
    { name: "Remera Oversize", price: "$31.000", ideal: "Look urbano, ideal para trap/rap y estetica streetwear", badge: "Tendencia", discounted: "$27.900" },
    { name: "Musculosa Unisex", price: "$21.800", ideal: "Shows de verano, festivales, recitales al aire libre", badge: null, discounted: "$19.620" },
    { name: "Remera Crop Mujer", price: "$23.500", ideal: "Fan merch femenino. Se vende rapido en shows", badge: null, discounted: "$21.150" },
    { name: "Buzo Hoodie Oversize", price: "$55.000", ideal: "Premium. Ideal para giras de invierno y ediciones limitadas", badge: "Premium", discounted: "$49.500" },
    { name: "Buzo Cuello Redondo", price: "$43.000", ideal: "Mas accesible que el hoodie. Gran margen de reventa", badge: null, discounted: "$38.700" },
  ]

  const pricingTiers = [
    { range: "1 - 9 un.", discount: "Precio regular", example: "Remera $28.600", tag: null },
    { range: "10 - 24 un.", discount: "5% OFF", example: "Remera $27.170", tag: "Primer lote" },
    { range: "25 - 99 un.", discount: "10% OFF", example: "Remera $25.740", tag: "Show" },
    { range: "100+ un.", discount: "15% OFF", example: "Remera $24.310", tag: "Gira / Festival" },
  ]

  const testimonials = [
    {
      quote: "Hacemos merch con Novamente hace 3 shows. Llevamos 30 remeras al primer recital pensando que iban a sobrar y se agotaron en una hora. Ahora pedimos 50 por show y siempre vendemos todo. La IA nos hizo un logo que parece de estudio profesional.",
      name: "Nico T.",
      role: "Vocalista, banda de rock indie — Lanús",
      rating: 5,
    },
    {
      quote: "Somos un grupo de cumbia y queriamos merch colorido que represente nuestra onda. La IA clavo el diseno a la primera. Pedimos 40 remeras para el baile del sabado y ganamos casi $700K de merch esa noche. Ahora tenemos merch en todos los shows.",
      name: "Lautaro M.",
      role: "Manager, banda de cumbia — Quilmes",
      rating: 5,
    },
    {
      quote: "Soy DJ y queria merch para un festival. Pedi 25 remeras negras con mi logo en neon que creo la IA. Las vendi todas antes de tocar. El DTG queda increible en negro. Ya estoy armando la coleccion de verano.",
      name: "Camila F.",
      role: "DJ electronica — Palermo, CABA",
      rating: 5,
    },
  ]

  const whatsappMessage = encodeURIComponent(
    "Hola! Quiero cotizar merch para mi banda/proyecto musical. Somos [nombre de la banda]. Tocamos [genero]. Necesitamos [cantidad] [remeras/buzos/musculosas]. Es para [show/gira/venta online/lanzamiento]. Ya tenemos logo: [si/no, quiero diseñar con IA]."
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
            <span className="text-zinc-300">Merch para Bandas</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-transparent" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-6">
                <Music className="w-3 h-3 mr-1" />
                Bandas y musicos
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                El merch que tu banda{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  necesita para crecer
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-300 mb-4 leading-relaxed">
                Remeras, buzos y merch personalizado para tu banda o proyecto musical.
                Disena con IA en minutos o subi tu arte. Desde{" "}
                <span className="text-white font-semibold">1 unidad</span>, sin minimos.
                Remeras desde <span className="text-white font-semibold">$24.310</span> con descuento por volumen.
                Vende en shows, online, y en giras.
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-zinc-400 mb-8">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Sin minimo de unidades</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Diseno con IA o subi tu arte</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Listo en 5-7 dias</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-lg px-8 py-6"
                >
                  <a
                    href={`https://wa.me/5491162377535?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cotizar merch para mi banda
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
                    Disenar logo con IA
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
                <div className="text-2xl sm:text-3xl font-bold text-purple-400">200+</div>
                <div className="text-sm text-zinc-400">bandas con merch</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-purple-400">4.9/5</div>
                <div className="text-sm text-zinc-400">calificacion promedio</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-purple-400">5-7 dias</div>
                <div className="text-sm text-zinc-400">produccion standard</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-purple-400">$0</div>
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
                Merch para cada genero musical
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Rock, cumbia, trap, electronica, covers o clasica. Tu musica merece merch que la represente.
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
                    <p className="text-sm text-purple-400 italic">&quot;{uc.example}&quot;</p>
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
                De la idea al merch en 4 pasos
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Mas facil que ensayar un tema nuevo. Sin minimos, sin complicaciones.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { step: "1", icon: Music, title: "Contanos de tu banda", desc: "Genero, estilo visual, si tenes logo/arte o queres que la IA diseñe uno desde cero." },
                { step: "2", icon: Sparkles, title: "Diseno con IA", desc: "La IA genera logos, arte de disco, y disenos unicos para tu merch. O subi tu arte y lo adaptamos." },
                { step: "3", icon: Package, title: "Produccion DTG", desc: "Cada prenda se imprime individualmente. Colores vibrantes sobre algodon 100% premium." },
                { step: "4", icon: Truck, title: "Listo para vender", desc: "Recibis el merch y listo para vender en shows, online, o donde quieras. El margen es tuyo." },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-sm font-mono text-purple-400 mb-2">Paso {s.step}</div>
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
                Productos para tu merch
              </h2>
              <p className="text-zinc-400 text-lg">
                Algodon 100% premium. Precios con 10% OFF para lotes de show (25+).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.name} className="bg-zinc-900/50 border-zinc-800 hover:border-purple-500/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                      {product.badge && (
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-purple-400">{product.discounted}</span>
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

        {/* Earnings calculator */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Cuanto podes ganar vendiendo merch
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Tu merch, tu precio, tu ganancia. Aca te mostramos numeros reales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  scenario: "Show chico (20 remeras)",
                  cost: "$25.740",
                  sellPrice: "$45.000",
                  profit: "$19.260",
                  total: "$385.200",
                  detail: "Costo total $514.800 → Vendes $900.000",
                },
                {
                  scenario: "Show grande (50 remeras)",
                  cost: "$25.740",
                  sellPrice: "$50.000",
                  profit: "$24.260",
                  total: "$1.213.000",
                  detail: "Costo total $1.287.000 → Vendes $2.500.000",
                },
                {
                  scenario: "Gira (100 remeras)",
                  cost: "$24.310",
                  sellPrice: "$50.000",
                  profit: "$25.690",
                  total: "$2.569.000",
                  detail: "Costo total $2.431.000 → Vendes $5.000.000",
                },
              ].map((calc) => (
                <Card key={calc.scenario} className="bg-zinc-800/50 border-zinc-700 hover:border-purple-500/30 transition-all">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">{calc.scenario}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Tu costo</span>
                        <span className="text-zinc-300">{calc.cost}/un.</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Precio de venta</span>
                        <span className="text-zinc-300">{calc.sellPrice}/un.</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Ganancia por remera</span>
                        <span className="text-purple-400 font-semibold">{calc.profit}</span>
                      </div>
                      <div className="border-t border-zinc-700 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-300 font-semibold">Ganancia total</span>
                          <span className="text-purple-400 font-bold text-lg">{calc.total}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{calc.detail}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl max-w-2xl mx-auto">
              <p className="text-purple-300 font-medium">
                Pro tip: vendiendo merch en 2-3 shows financias la grabacion del proximo disco
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                Muchas bandas generan mas ingreso por merch que por las entradas del show
              </p>
            </div>
          </div>
        </section>

        {/* Volume discounts */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Descuentos por volumen
              </h2>
              <p className="text-zinc-400 text-lg">
                Mas merch, mejor precio. Ideal para giras y festivales.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.range}
                  className={`text-center ${tier.tag === "Show" ? "bg-zinc-800/50 border-purple-500/30 border-2" : "bg-zinc-900/50 border-zinc-800"}`}
                >
                  <CardContent className="p-5">
                    {tier.tag && (
                      <Badge className={`${tier.tag === "Show" ? "bg-purple-600" : "bg-zinc-700"} text-white mb-2 text-xs`}>{tier.tag}</Badge>
                    )}
                    <div className="text-sm text-zinc-400 mb-1">{tier.range}</div>
                    <div className="text-xl font-bold text-white mb-1">{tier.discount}</div>
                    <div className="text-sm text-zinc-500">{tier.example}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Drops & editions callout */}
        <section className="py-12 bg-gradient-to-r from-purple-600/10 via-pink-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Disc3 className="w-10 h-10 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Drops, ediciones limitadas, colecciones
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-4">
              Lanza un diseno por cada single, disco, o gira. Ediciones limitadas que tus fans coleccionan. Con DTG no hay costo de setup — cada diseno es un pedido nuevo y listo.
            </p>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              Sin costo extra por diseno nuevo — ideal para drops constantes
            </Badge>
          </div>
        </section>

        {/* Partner program callout */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-4xl mx-auto px-4">
            <Card className="bg-gradient-to-br from-purple-600/10 via-pink-500/5 to-zinc-900 border-purple-500/20">
              <CardContent className="p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                      <Palette className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Queres tu propia tienda online de merch?
                    </h3>
                    <p className="text-zinc-400 mb-4">
                      Con el programa Partner de Novamente, tu banda tiene su propia tienda dentro de novamente.ar.
                      Tus fans compran directo, vos pones el precio, nosotros producimos y enviamos.
                      Ganas sin mover un dedo.
                    </p>
                    <Button
                      asChild
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                    >
                      <Link href="/partners/join">
                        Abrir mi tienda de merch <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
              Lo que dicen las bandas que ya tienen merch
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <Card key={t.name} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-purple-400 text-purple-400" />
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
              Calificacion promedio: <span className="text-white font-semibold">4.9/5</span> basado en 280 bandas y musicos
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
            <Card className="bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-zinc-900 border-purple-500/20">
              <CardContent className="p-8 sm:p-12 text-center">
                <Music className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Tu musica merece merch a la altura
                </h2>
                <p className="text-lg text-zinc-300 mb-8 max-w-xl mx-auto">
                  Mandanos un WhatsApp con el nombre de tu banda, genero, y que necesitas.
                  Te armamos propuestas y disenos con IA en minutos. Sin minimos, sin compromiso.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-lg px-8 py-6"
                  >
                    <a
                      href={`https://wa.me/5491162377535?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Cotizar merch para mi banda
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
              Tambien hacemos merch para creadores de contenido, eventos, regalos empresariales y mas
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild variant="link" className="text-purple-400 hover:text-purple-300">
                <Link href="/merch-para-creadores">
                  Merch para creadores <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-purple-400 hover:text-purple-300">
                <Link href="/remeras-para-eventos">
                  Remeras para eventos <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-purple-400 hover:text-purple-300">
                <Link href="/regalos-empresariales">
                  Regalos empresariales <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-purple-400 hover:text-purple-300">
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
