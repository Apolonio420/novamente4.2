import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import {
  Package, Star, Shield, Clock, CheckCircle2,
  Truck, Palette, Sparkles, ArrowRight,
  Zap, Shirt, Layers, MessageCircle,
  Heart, Gift, Coffee, Wrench,
  Gamepad2, Music, Trophy, Users
} from "lucide-react"

export const metadata: Metadata = {
  title: "Regalos Dia del Padre 2026 — Remeras y Buzos Personalizados con IA | Novamente",
  description:
    "Regala algo unico este Dia del Padre. Remeras y buzos personalizados con inteligencia artificial y estampado DTG. Diseña un regalo con significado en minutos. Desde $21.800. Envios a toda Argentina.",
  keywords: [
    "regalo dia del padre",
    "regalos dia del padre personalizados",
    "remera dia del padre",
    "buzo dia del padre",
    "regalos personalizados dia del padre",
    "regalo para papa personalizado",
    "regalo original dia del padre",
    "remera personalizada para papa",
    "buzo personalizado para papa",
    "regalo dia del padre 2026",
    "dia del padre argentina",
    "regalos unicos dia del padre",
    "regalo papa personalizado argentina",
    "camiseta dia del padre",
    "hoodie personalizado regalo papa",
  ],
  openGraph: {
    title: "Regalos Dia del Padre 2026 — Personalizados con IA | Novamente",
    description:
      "Diseña un regalo unico para papa con inteligencia artificial. Remeras y buzos personalizados con estampado DTG premium. Desde $21.800. Envios a toda Argentina.",
    url: "https://www.novamente.ar/regalos-dia-del-padre",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/oversize-negro-front.jpeg",
        width: 800,
        height: 800,
        alt: "Regalos Dia del Padre personalizados — Novamente Argentina",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Regalos Dia del Padre 2026 — Personalizados con IA | Novamente",
    description:
      "Diseña un regalo unico para papa con IA. Remeras y buzos personalizados con estampado DTG. Desde $21.800.",
  },
  alternates: { canonical: "https://www.novamente.ar/regalos-dia-del-padre" },
}

export default function RegalosDiaDelPadre() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Regalos Dia del Padre Personalizados — Novamente",
    description:
      "Regalos personalizados para el Dia del Padre con inteligencia artificial y estampado DTG premium. Remeras, buzos y hoodies con disenos unicos. Desde 1 unidad. Produccion on-demand y envios a toda Argentina.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Regalos Personalizados Dia del Padre",
    areaServed: {
      "@type": "Country",
      name: "Argentina",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: 24000,
      highPrice: 58000,
      priceCurrency: "ARS",
      offerCount: 9,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "285",
      bestRating: "5",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Llego a tiempo si pido ahora para el Dia del Padre?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. El Dia del Padre 2026 en Argentina es el 21 de junio. Nuestra produccion tarda 2-5 dias habiles y el envio de 3 a 10 dias segun tu zona. Te recomendamos pedir con al menos 10 dias de anticipacion para que llegue sin apuros.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo personalizar el regalo con una frase o foto?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. Podes subir tu propia imagen (foto, dibujo, logo, frase) o usar nuestra IA para crear un diseno unico. Describe tu idea — por ejemplo 'el mejor papa del mundo con estilo retro' — y la IA genera el arte en segundos.",
        },
      },
      {
        "@type": "Question",
        name: "Que regalo le puedo hacer a un papa que tiene todo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Un buzo o remera personalizada con IA es un regalo que ningun otro papa va a tener. Podes crear un diseno basado en sus hobbies (asado, futbol, pesca, musica), una frase especial, o incluso una ilustracion artistica generada por IA con su estilo.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto cuesta un regalo personalizado para el Dia del Padre?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Remeras desde $21.800 (musculosa) hasta $31.000 (oversize). Buzos desde $43.000 (crewneck) hasta $55.000 (Buzo Hoodie Oversize). El precio incluye la prenda de algodon 100% + estampado DTG. Descuentos por cantidad si compras para varios papas.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo pedir para toda la familia y que cada uno tenga diseno diferente?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. Con DTG cada prenda puede tener un diseno completamente diferente sin costo extra. Ideal si los hermanos quieren hacer regalos individuales o si quieren combinar (ej: 'Papa #1', 'El Mejor Abuelo', etc.).",
        },
      },
      {
        "@type": "Question",
        name: "Tienen envio a todo el pais?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. Envios a toda Argentina: AMBA $5.500 (3-5 dias), Interior Buenos Aires $7.000 (5-7 dias), Resto del pais $9.000 (7-10 dias). Produccion: 2-5 dias habiles adicionales.",
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
        name: "Regalos Dia del Padre",
        item: "https://www.novamente.ar/regalos-dia-del-padre",
      },
    ],
  }

  const products = [
    { name: "Musculosa Bali", price: 24000, description: "Morley algodon, ideal verano o gym", category: "Musculosa" },
    { name: "Remera Crop Mujer", price: 26000, description: "Para mama que quiere combinar", category: "Remera" },
    { name: "Remera Clasica Mujer", price: 31000, description: "Clasica para mama — combo familia", category: "Remera" },
    { name: "Aldea Classic Fit", price: 31000, description: "Fit regular, algodon 100%", category: "Remera", popular: true },
    { name: "Aura Oversize T-Shirt", price: 33000, description: "Oversize premium, caida amplia", category: "Remera" },
    { name: "Buzo Cuello Redondo", price: 45000, description: "Crewneck frizado, ideal invierno", category: "Buzo" },
    { name: "Buzo Hoodie Oversize", price: 58000, description: "Hoodie oversize con capucha", category: "Hoodie", popular: true },
    { name: "Buzo Hoodie Oversize", price: 58000, description: "Hoodie oversize", category: "Buzo Hoodie Oversize" },
  ]

  const giftIdeas = [
    { icon: Coffee, title: "Papa asador", description: "Diseno con frases de asado, parrillero experto, o ilustracion IA del rey de la parrilla." },
    { icon: Trophy, title: "Papa deportista", description: "Su equipo favorito, running, ciclismo o paddle. Nombre y numero personalizado." },
    { icon: Music, title: "Papa musico", description: "Su banda favorita, instrumento, o arte IA inspirado en rock, jazz, blues." },
    { icon: Gamepad2, title: "Papa gamer", description: "Pixel art, retro gaming, o diseno IA de su juego favorito." },
    { icon: Wrench, title: "Papa manitas", description: "Herramientas, garage, autos, motos. Ilustracion personalizada con IA." },
    { icon: Heart, title: "Papa emocional", description: "Frase especial, fecha de nacimiento de los hijos, dibujo de los nenes hecho arte con IA." },
  ]

  const advantages = [
    { icon: Sparkles, title: "Diseno unico con IA", description: "Describe tu idea y la IA crea un diseno que ningun otro papa va a tener. Es personal de verdad." },
    { icon: Zap, title: "Listo en minutos", description: "En 5 minutos tenes el diseno. En 2-5 dias habiles esta producido. Sin complicaciones." },
    { icon: Shield, title: "Calidad premium", description: "Algodon 100%, estampado DTG que dura 50+ lavados. Un regalo que se usa, no que se guarda." },
    { icon: Palette, title: "Full color sin limites", description: "Fotos, degradados, colores vibrantes. DTG imprime millones de tonos sin costo extra." },
    { icon: Package, title: "Desde 1 unidad", description: "No necesitas comprar de a muchos. Un solo regalo personalizado, perfecto." },
    { icon: Truck, title: "Envio a todo el pais", description: "AMBA, Interior y todo Argentina. Llegamos a tiempo para el Dia del Padre." },
  ]

  const familyDeals = [
    { quantity: "1 regalo", discount: "Sin descuento", example: "Remera classic $28.600", highlight: false },
    { quantity: "2-3 regalos", discount: "Precio por unidad", example: "Para papa + abuelo", highlight: false },
    { quantity: "4-9 hermanos", discount: "Consultar combo", example: "Grupo familiar coordinado", highlight: true },
    { quantity: "10+ primos/familia", discount: "5% OFF", example: "Remera classic $27.170 c/u", highlight: false },
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
            <li className="text-zinc-300">Regalos Dia del Padre</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-black to-black" />
          <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-regalos-dia-del-padre.webp"
              alt="Regalo personalizado Novamente para el Día del Padre"
            />
            <Badge className="mb-6 bg-amber-500/20 text-amber-300 border-amber-500/30 text-sm px-4 py-1">
              <Gift className="w-4 h-4 mr-1" /> Dia del Padre 2026 — 21 de Junio
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Un regalo que solo
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                su papa va a tener
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto mb-8">
              Remeras y buzos personalizados con inteligencia artificial.
              Describe la idea, la IA diseña algo unico, y nosotros lo estampamos
              en algodon 100% con DTG premium. En 5 minutos ya tenes el regalo perfecto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-500 text-white text-lg px-8 py-6">
                <Link href="/design">
                  <Sparkles className="w-5 h-5 mr-2" /> Diseña el Regalo Ahora
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 text-lg px-8 py-6">
                <Link
                  href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Quiero%20un%20regalo%20personalizado%20para%20el%20Dia%20del%20Padre.%20Me%20asesoran%3F%20(ref%20%C2%B7%20NV-PADRE)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5 mr-2" /> Consultar por WhatsApp
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Remeras desde $21.800</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Buzos desde $43.000</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Diseno con IA en minutos</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Envio a todo el pais</span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-zinc-800 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-amber-400">9 prendas</p>
              <p className="text-sm text-zinc-400">Remeras + Buzos + Hoodies</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-400">37 estilos</p>
              <p className="text-sm text-zinc-400">Estilos artisticos IA</p>
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

        {/* Gift ideas by persona */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Ideas de regalo segun el tipo de papa
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            No importa que le guste — la IA diseña algo perfecto para el
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {giftIdeas.map((idea) => (
              <div key={idea.title} className="flex gap-4 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/50 transition-all">
                <idea.icon className="w-8 h-8 text-amber-400 shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">{idea.title}</h3>
                  <p className="text-sm text-zinc-400">{idea.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-500 text-white">
              <Link href="/design">
                <Sparkles className="w-5 h-5 mr-2" /> Diseña el tuyo con IA
              </Link>
            </Button>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              4 pasos para el regalo perfecto
            </h2>
            <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
              En 5 minutos tenes un regalo unico que ningun otro papa va a tener
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { number: "01", icon: Sparkles, title: "Describe tu idea", description: "Contale a la IA que le gusta a tu papa: asado, futbol, musica, pesca. Ella diseña algo unico." },
                { number: "02", icon: Shirt, title: "Elegi la prenda", description: "Remera classic, oversize, crop, musculosa, buzo o hoodie. Algodon 100%, talles S a XXL." },
                { number: "03", icon: Layers, title: "Lo estampamos con DTG", description: "Impresion directa sobre la tela. Colores vibrantes, tacto suave. Dura 50+ lavados." },
                { number: "04", icon: Truck, title: "Llega a tu puerta", description: "Produccion 2-5 dias. Envio a todo el pais. Pedi con 10+ dias de anticipacion." },
              ].map((step) => (
                <Card key={step.number} className="bg-zinc-900 border-zinc-800 hover:border-amber-500/50 transition-all">
                  <CardContent className="p-6 text-center">
                    <span className="text-4xl font-bold text-amber-500/30">{step.number}</span>
                    <div className="flex justify-center my-4">
                      <step.icon className="w-10 h-10 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-zinc-400">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Product grid */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Elegí la prenda para papa
          </h2>
          <p className="text-zinc-400 text-center mb-4 max-w-2xl mx-auto">
            Todas personalizables con tu diseno o el que cree la IA
          </p>
          <p className="text-center mb-12">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
              Tip: En junio es invierno — un buzo o hoodie es ideal
            </Badge>
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card
                key={product.name}
                className={`bg-zinc-900 ${product.popular ? "border-amber-500/50 ring-1 ring-amber-500/20" : "border-zinc-800"} hover:border-amber-500/50 transition-all`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={
                      product.category === "Buzo Hoodie Oversize"
                        ? "bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs"
                        : product.category === "Hoodie"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs"
                        : product.category === "Buzo"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700 text-xs"
                    }>
                      {product.category}
                    </Badge>
                    {product.popular && (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                        Favorito
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                  <p className="text-xs text-zinc-500 mb-3">{product.description}</p>
                  <p className="text-xl font-bold text-white">${product.price.toLocaleString("es-AR")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-500 text-white">
              <Link href="/design">
                <Gift className="w-5 h-5 mr-2" /> Personalizar regalo
              </Link>
            </Button>
          </div>
        </section>

        {/* Advantages */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Por que es el mejor regalo
            </h2>
            <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
              No es una remera mas — es un regalo que diseñaste vos pensando en el
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {advantages.map((adv) => (
                <div key={adv.title} className="flex gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                  <adv.icon className="w-8 h-8 text-amber-400 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{adv.title}</h3>
                    <p className="text-sm text-zinc-400">{adv.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Family deals */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Regalos para toda la familia
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Juntense entre hermanos, primos o familia — cada regalo puede tener un diseno diferente
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {familyDeals.map((deal) => (
              <Card
                key={deal.quantity}
                className={`bg-zinc-900 text-center ${deal.highlight ? "border-amber-500/50 ring-1 ring-amber-500/20" : "border-zinc-800"}`}
              >
                <CardContent className="p-5">
                  <p className="text-lg font-bold text-amber-400 mb-1">{deal.quantity}</p>
                  <p className="text-sm font-semibold mb-2">{deal.discount}</p>
                  <p className="text-xs text-zinc-500">{deal.example}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-500 text-white">
              <Link href="/cotizador">
                <Package className="w-5 h-5 mr-2" /> Calcular presupuesto familiar
              </Link>
            </Button>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Lo que dicen los que ya regalaron
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: "Valentina S.",
                  role: "Hija — regalo cumple del padre",
                  text: "Le hice un buzo con una ilustracion IA de el haciendo asado. Cuando lo vio se emociono. Dice que es la mejor prenda que tiene. La calidad del estampado es increible.",
                  rating: 5,
                },
                {
                  name: "Nicolas T.",
                  role: "Hijo — Dia del Padre 2025",
                  text: "Con mis hermanos le regalamos remeras a papa y al abuelo. Cada una con un diseno diferente hecho con IA. Lo mas lindo fue que las diseñamos juntos en 10 minutos.",
                  rating: 5,
                },
                {
                  name: "Carolina M.",
                  role: "Esposa — regalo sorpresa",
                  text: "Le regale un Buzo Hoodie Oversize con un diseno de su banda favorita generado por IA. Lo usa todos los dias. Ya estoy pensando que le hago para este Dia del Padre.",
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

        {/* Urgency banner */}
        <section className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-y border-amber-500/20">
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <p className="text-lg md:text-xl font-semibold text-amber-300 mb-2">
              <Clock className="w-5 h-5 inline mr-2" />
              Dia del Padre 2026: 21 de Junio
            </p>
            <p className="text-sm text-zinc-400">
              Produccion: 2-5 dias | Envio: 3-10 dias segun zona.
              Recomendamos pedir antes del 8 de junio para asegurar la entrega.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Preguntas frecuentes sobre regalos para el Dia del Padre
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Llego a tiempo si pido ahora?",
                a: "Si. El Dia del Padre 2026 es el 21 de junio. Produccion tarda 2-5 dias y envio 3-10 dias segun tu zona. Recomendamos pedir con 10+ dias de anticipacion.",
              },
              {
                q: "Puedo usar una foto para el diseno?",
                a: "Si. Podes subir cualquier imagen (foto, dibujo, logo, frase). Tambien podes usar la IA: describe tu idea y genera un diseno unico en segundos.",
              },
              {
                q: "Que le regalo a un papa que tiene todo?",
                a: "Algo que NO puede comprarse: un buzo o remera con un diseno unico hecho con IA basado en lo que le gusta. Es personal, util, y memorable.",
              },
              {
                q: "Cuanto cuesta?",
                a: "Desde $21.800 (musculosa) hasta $55.000 (Buzo Hoodie Oversize). El precio incluye prenda de algodon 100% + estampado DTG. Recomendamos buzos para junio (invierno).",
              },
              {
                q: "Puedo pedir varios regalos con disenos diferentes?",
                a: "Si. Con DTG cada prenda puede ser unica. Ideal para regalar a papa, abuelo, suegro — cada uno con su diseno personalizado.",
              },
              {
                q: "Como es el envio?",
                a: "AMBA $5.500 (3-5 dias), Interior BA $7.000 (5-7 dias), Resto del pais $9.000 (7-10 dias). Produccion: 2-5 dias habiles adicionales.",
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

        {/* Cross-sell */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Tambien te puede interesar
            </h2>
            <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
              Mas formas de personalizar regalos y prendas
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Remeras de cumpleanos", description: "Diseños para cumples de todas las edades", link: "/remeras-cumpleanos", icon: Gift },
                { title: "Buzos personalizados", description: "Hoodies y crewnecks para el invierno", link: "/buzos-personalizados", icon: Shirt },
                { title: "Cotizador", description: "Calcula tu presupuesto al instante", link: "/cotizador", icon: Package },
                { title: "Regalos empresariales", description: "Merchandising corporativo con IA", link: "/regalos-empresariales", icon: Users },
              ].map((item) => (
                <Link key={item.title} href={item.link}>
                  <Card className="bg-zinc-900 border-zinc-800 hover:border-amber-500/50 transition-all h-full group cursor-pointer">
                    <CardContent className="p-5">
                      <item.icon className="w-8 h-8 text-amber-400 mb-3" />
                      <h3 className="font-semibold mb-1 group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-zinc-400">{item.description}</p>
                      <span className="text-xs text-amber-400 mt-2 inline-flex items-center">
                        Ver mas <ArrowRight className="w-3 h-3 ml-1" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Diseña el regalo perfecto para papa
            </h2>
            <p className="text-lg text-zinc-300 mb-8 max-w-2xl mx-auto">
              En 5 minutos tenes un diseno unico creado con IA. Estampado DTG premium
              sobre algodon 100%. Un regalo con significado que va a usar todos los dias.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-500 text-white text-lg px-8 py-6">
                <Link href="/design">
                  <Sparkles className="w-5 h-5 mr-2" /> Diseña el Regalo Ahora
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 text-lg px-8 py-6">
                <Link
                  href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Quiero%20un%20regalo%20personalizado%20para%20el%20Dia%20del%20Padre.%20Que%20me%20recomiendan%3F%20(ref%20%C2%B7%20NV-PADRE-FINAL)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-zinc-500">
              <Link href="/remeras-personalizadas" className="hover:text-amber-400 transition-colors">Remeras personalizadas</Link>
              <span>|</span>
              <Link href="/buzos-personalizados" className="hover:text-amber-400 transition-colors">Buzos personalizados</Link>
              <span>|</span>
              <Link href="/remeras-cumpleanos" className="hover:text-amber-400 transition-colors">Remeras cumpleanos</Link>
              <span>|</span>
              <Link href="/cotizador" className="hover:text-amber-400 transition-colors">Cotizador</Link>
              <span>|</span>
              <Link href="/regalos-empresariales" className="hover:text-amber-400 transition-colors">Regalos empresariales</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
