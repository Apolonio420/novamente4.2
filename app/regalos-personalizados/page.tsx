import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Package, Star, Shield, Clock, CheckCircle2,
  Truck, Palette, Sparkles, ArrowRight,
  Zap, Shirt, Layers, MessageCircle,
  Heart, Gift, Cake, GraduationCap,
  Users, PartyPopper, Music, Trophy,
  Briefcase, Calendar
} from "lucide-react"

export const metadata: Metadata = {
  title: "Regalos Personalizados con IA — Remeras, Buzos y Hoodies Unicos | Novamente",
  description:
    "Regalos personalizados para cualquier ocasion. Remeras, buzos y hoodies con disenos unicos creados con inteligencia artificial y estampado DTG premium. Desde $21.800. Envios a toda Argentina.",
  keywords: [
    "regalos personalizados",
    "regalos personalizados argentina",
    "regalo personalizado",
    "remera personalizada regalo",
    "buzo personalizado regalo",
    "regalos originales",
    "regalos unicos",
    "regalos con nombre",
    "regalos creativos",
    "regalos personalizados buenos aires",
    "regalos personalizados online",
    "regalos personalizados baratos",
    "regalos personalizados con foto",
    "regalos personalizados para mujer",
    "regalos personalizados para hombre",
    "regalos personalizados cumpleanos",
    "regalos personalizados dia del padre",
    "regalos personalizados dia de la madre",
    "regalos personalizados aniversario",
    "regalos personalizados navidad",
  ],
  openGraph: {
    title: "Regalos Personalizados con IA — Disenos Unicos | Novamente",
    description:
      "Crea regalos unicos con inteligencia artificial. Remeras, buzos y hoodies personalizados con estampado DTG premium. Desde $21.800. Envios a toda Argentina.",
    url: "https://www.novamente.ar/regalos-personalizados",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/marketing/lifestyle/hero-merch-personalizado.webp",
        width: 1600,
        height: 900,
        alt: "Regalos personalizados con IA — Novamente Argentina",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Regalos Personalizados con IA — Disenos Unicos | Novamente",
    description:
      "Crea regalos unicos con IA. Remeras y buzos personalizados con DTG. Desde $21.800.",
  },
  alternates: { canonical: "https://www.novamente.ar/regalos-personalizados" },
}

export default function RegalosPersonalizados() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Regalos Personalizados con IA — Novamente",
    description:
      "Regalos personalizados para cualquier ocasion con inteligencia artificial y estampado DTG premium. Remeras, buzos y hoodies con disenos unicos. Desde 1 unidad. Produccion on-demand y envios a toda Argentina.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Regalos Personalizados",
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
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "412",
      bestRating: "5",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Que puedo regalar personalizado en Novamente?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Remeras (classic, oversize, crop, musculosa), buzos crewneck y hoodies con disenos unicos creados por inteligencia artificial o con tu propia imagen/foto. Cada prenda es de algodon 100% con estampado DTG premium que dura 50+ lavados.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto cuesta un regalo personalizado?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Desde $21.800 (musculosa) hasta $55.000 (Buzo Hoodie Oversize). El precio incluye la prenda de algodon 100% + estampado DTG. Descuentos por cantidad: 5% desde 10 un., 10% desde 25, 15% desde 100+.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo usar una foto o imagen propia para el regalo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. Podes subir cualquier imagen (foto, logo, dibujo, frase) o usar nuestra IA: describe tu idea y genera un diseno profesional en segundos. Ambas opciones estan incluidas sin costo extra.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tarda la produccion y el envio?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Produccion: 2-5 dias habiles. Envio: AMBA $5.500 (3-5 dias), Interior Buenos Aires $7.000 (5-7 dias), Resto del pais $9.000 (7-10 dias). Total aproximado: 5-15 dias segun tu zona.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo pedir un solo regalo o hay minimo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No hay minimo. Podes pedir desde 1 sola prenda personalizada. Cada una puede tener un diseno completamente diferente sin costo extra gracias a la tecnologia DTG.",
        },
      },
      {
        "@type": "Question",
        name: "Para que ocasiones sirven los regalos personalizados?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Para todo: cumpleanos, Dia del Padre, Dia de la Madre, aniversarios, despedidas de soltero/a, Navidad, egresados, eventos deportivos, regalos corporativos y mas. Cualquier ocasion especial merece un regalo unico.",
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
        name: "Regalos Personalizados",
        item: "https://www.novamente.ar/regalos-personalizados",
      },
    ],
  }

  const products = [
    { name: "Musculosa Bali", price: 21800, description: "Morley algodon, ideal verano o gym", category: "Musculosa" },
    { name: "Remera Crop Mujer", price: 23500, description: "Crop moderno, corte femenino", category: "Remera" },
    { name: "Aldea Classic Fit", price: 28600, description: "Clasica unisex, algodon 100%", category: "Remera", popular: true },
    { name: "Remera Clasica Mujer", price: 28600, description: "Fit femenino, tela premium", category: "Remera" },
    { name: "Aura Oversize T-Shirt", price: 31000, description: "Oversize premium, caida amplia", category: "Remera" },
    { name: "Buzo Cuello Redondo", price: 43000, description: "Crewneck frizado, ideal otono-invierno", category: "Buzo" },
    { name: "Buzo Hoodie Oversize", price: 55000, description: "Hoodie oversize con capucha", category: "Hoodie", popular: true },
    { name: "Buzo Hoodie Oversize", price: 55000, description: "Hoodie oversize", category: "Buzo Hoodie Oversize" },
  ]

  const occasions = [
    { icon: Cake, title: "Cumpleanos", description: "Para 15, 18, 30, 40, 50 o cualquier edad. Disenos con nombre, edad y estilo unico.", link: "/remeras-cumpleanos", color: "text-pink-400" },
    { icon: Heart, title: "Dia del Padre", description: "Remeras y buzos personalizados para papa. Disenos con IA segun sus hobbies.", link: "/regalos-dia-del-padre", color: "text-amber-400" },
    { icon: PartyPopper, title: "Despedidas", description: "Team bride/groom. Cada invitado con su nombre en un diseno unico.", link: "/despedidas-personalizadas", color: "text-purple-400" },
    { icon: GraduationCap, title: "Egresados", description: "Buzos de promo con nombre de cada alumno. Descuentos por curso completo.", link: "/buzos-egresados", color: "text-cyan-400" },
    { icon: Trophy, title: "Equipos deportivos", description: "Camisetas con nombre, numero y escudo. Futbol, hockey, paddle, running.", link: "/indumentaria-deportiva", color: "text-emerald-400" },
    { icon: Music, title: "Bandas y musicos", description: "Merch para shows, giras y lanzamientos. Vende tu propia linea.", link: "/merch-para-bandas", color: "text-red-400" },
    { icon: Briefcase, title: "Regalos empresariales", description: "Merchandising corporativo para onboarding, eventos y fin de ano.", link: "/regalos-empresariales", color: "text-blue-400" },
    { icon: Calendar, title: "Eventos", description: "Maratones, conferencias, festivales, torneos. Pedidos de 10 a 500+ un.", link: "/remeras-para-eventos", color: "text-orange-400" },
  ]

  const moreCategories = [
    { title: "Uniformes personalizados", description: "Ropa de trabajo para empresas y locales", link: "/uniformes-personalizados", icon: Users },
    { title: "Merch para creadores", description: "YouTubers, streamers e influencers", link: "/merch-para-creadores", icon: Sparkles },
    { title: "Lanza tu marca", description: "Crea tu marca de ropa sin inversion", link: "/lanza-tu-marca", icon: Package },
    { title: "Remeras por mayor", description: "Mayorista desde 10 unidades", link: "/remeras-por-mayor", icon: Layers },
  ]

  const advantages = [
    { icon: Sparkles, title: "Diseno unico con IA", description: "Describe tu idea y la IA crea un diseno que no existe en ningun otro lugar. Es verdaderamente personal." },
    { icon: Heart, title: "Significado real", description: "No es un regalo generico. Es algo pensado, diseñado por vos, con un significado que la persona va a entender." },
    { icon: Shield, title: "Calidad DTG premium", description: "Estampado directo sobre algodon 100%. Colores vibrantes que duran 50+ lavados. Se usa, no se guarda." },
    { icon: Palette, title: "Full color sin limites", description: "Fotos, degradados, millones de colores. Sin costo extra por cantidad de colores ni por complejidad de diseno." },
    { icon: Package, title: "Desde 1 unidad", description: "Un solo regalo personalizado o 100 diferentes para un evento. Cada prenda puede tener un diseno distinto." },
    { icon: Truck, title: "Envio a todo el pais", description: "Produccion 2-5 dias habiles. Envio a AMBA, Interior y todo Argentina. Pago con tarjeta, transferencia o MercadoPago." },
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
            <li className="text-zinc-300">Regalos Personalizados</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-900/20 via-black to-black" />
          <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
            <div className="grid lg:grid-cols-[1fr_0.95fr] gap-10 lg:gap-14 items-center">
              <div className="text-center lg:text-left">
                <Badge className="mb-6 bg-rose-500/20 text-rose-300 border-rose-500/30 text-sm px-4 py-1">
                  <Gift className="w-4 h-4 mr-1" /> Regalos que no existen en ningun otro lugar
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  Regalos personalizados
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">
                    creados con inteligencia artificial
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto lg:mx-0 mb-8">
                  Describe tu idea, la IA disena algo unico, y nosotros lo estampamos
                  en algodon 100% con DTG premium. Para cumpleanos, Dia del Padre, despedidas,
                  egresados, o cualquier ocasion especial. En 5 minutos tenes el regalo perfecto.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <Button asChild size="lg" className="bg-rose-600 hover:bg-rose-500 text-white text-lg px-8 py-6">
                    <Link href="/design">
                      <Sparkles className="w-5 h-5 mr-2" /> Disena Tu Regalo con IA
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 text-lg px-8 py-6">
                    <Link
                      href="https://wa.me/5491126603080?text=Hola!%20Quiero%20un%20regalo%20personalizado.%20Me%20asesoran?"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" /> Consultar por WhatsApp
                    </Link>
                  </Button>
                </div>
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-zinc-400">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Desde $21.800</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Desde 1 unidad</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Diseno con IA en minutos</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Envio a todo el pais</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-rose-500/25 via-amber-500/10 to-transparent blur-2xl" />
                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950 shadow-2xl">
                  <Image
                    src="/marketing/lifestyle/hero-regalo-pareja.webp"
                    alt="Pareja argentina con remera personalizada de regalo, momento íntimo en casa"
                    width={1600}
                    height={900}
                    priority
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-5">
                    <p className="text-sm font-medium text-white">Regalos listos para emocionar</p>
                    <p className="text-xs text-zinc-300">Prendas personalizadas, empaque cuidado y diseno unico</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-zinc-800 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-rose-400">1,500+</p>
              <p className="text-sm text-zinc-400">Regalos creados</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">37 estilos</p>
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

        {/* Galería de regalos reales — emoción del momento */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
            La cara que pone alguien cuando le regalás algo único
          </h2>
          <p className="text-zinc-400 text-center mb-10 max-w-2xl mx-auto">
            Para tu pareja, tu mejor amigo, tu viejo. Una prenda con un diseño
            pensado para esa persona — no la encontrás en ningún local.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <Image
                src="/marketing/lifestyle/hero-regalo-pareja.webp"
                alt="Regalo personalizado para pareja — remera con diseño romántico"
                fill
                className="object-cover transition group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-xs uppercase tracking-widest text-rose-300">Para tu pareja</p>
                <p className="mt-1 text-sm text-white">Aniversario, San Valentín o "porque sí"</p>
              </div>
            </div>
            <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <Image
                src="/marketing/lifestyle/hero-regalo-amigo-cumple.webp"
                alt="Regalo de cumpleaños para amigo — remera con diseño festivo"
                fill
                className="object-cover transition group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-xs uppercase tracking-widest text-amber-300">Para tu amigo</p>
                <p className="mt-1 text-sm text-white">Cumpleaños y sorpresas grupales</p>
              </div>
            </div>
            <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <Image
                src="/marketing/lifestyle/hero-regalos-dia-del-padre.webp"
                alt="Regalo del Día del Padre — remera con diseño emotivo"
                fill
                className="object-cover transition group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-xs uppercase tracking-widest text-emerald-300">Para tu viejo</p>
                <p className="mt-1 text-sm text-white">Día del padre o "por estar siempre"</p>
              </div>
            </div>
          </div>
        </section>

        {/* Occasions hub */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Un regalo perfecto para cada ocasion
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Elegí la ocasion y encontra ideas, ejemplos y precios para tu regalo personalizado
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {occasions.map((occasion) => (
              <Link key={occasion.title} href={occasion.link}>
                <Card className="bg-zinc-900 border-zinc-800 hover:border-rose-500/50 transition-all h-full group cursor-pointer">
                  <CardContent className="p-5">
                    <occasion.icon className={`w-8 h-8 ${occasion.color} mb-3`} />
                    <h3 className="font-semibold mb-1 group-hover:text-rose-300 transition-colors">
                      {occasion.title}
                    </h3>
                    <p className="text-sm text-zinc-400 mb-2">{occasion.description}</p>
                    <span className="text-xs text-rose-400 inline-flex items-center">
                      Ver regalos <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Como funciona: 4 pasos
            </h2>
            <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
              De la idea al regalo en minutos — el resto lo hacemos nosotros
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { number: "01", icon: Sparkles, title: "Describe tu idea", description: "Contale a la IA que queres: 'remera retro para los 30 de Juan' o subi tu propia foto/diseno." },
                { number: "02", icon: Shirt, title: "Elegi la prenda", description: "Remera, buzo, hoodie o musculosa. Algodon 100%, talles S a XXL, varios colores." },
                { number: "03", icon: Layers, title: "Estampado DTG", description: "Impresion directa sobre la tela. Full color, tacto suave, dura 50+ lavados." },
                { number: "04", icon: Truck, title: "Envio a tu puerta", description: "Produccion 2-5 dias. Envio a todo el pais. Llega listo para regalar." },
              ].map((step) => (
                <Card key={step.number} className="bg-zinc-900 border-zinc-800 hover:border-rose-500/50 transition-all">
                  <CardContent className="p-6 text-center">
                    <span className="text-4xl font-bold text-rose-500/30">{step.number}</span>
                    <div className="flex justify-center my-4">
                      <step.icon className="w-10 h-10 text-rose-400" />
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
            Elegí la prenda para tu regalo
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Todas personalizables con tu diseno, foto, o arte generado por IA
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card
                key={`${product.name}-${product.category}`}
                className={`bg-zinc-900 ${product.popular ? "border-rose-500/50 ring-1 ring-rose-500/20" : "border-zinc-800"} hover:border-rose-500/50 transition-all`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={
                      product.category === "Buzo Hoodie Oversize"
                        ? "bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs"
                        : product.category === "Hoodie"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs"
                        : product.category === "Buzo"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700 text-xs"
                    }>
                      {product.category}
                    </Badge>
                    {product.popular && (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                        Popular
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
          <div className="text-center mt-8 space-y-3">
            <Button asChild size="lg" className="bg-rose-600 hover:bg-rose-500 text-white">
              <Link href="/design">
                <Gift className="w-5 h-5 mr-2" /> Personalizar regalo
              </Link>
            </Button>
            <p className="text-sm text-zinc-500">
              Descuentos por cantidad: 5% desde 10 un. | 10% desde 25 | 15% desde 100+ —{" "}
              <Link href="/cotizador" className="text-rose-400 hover:underline">Cotizar ahora</Link>
            </p>
          </div>
        </section>

        {/* Advantages */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Por que un regalo personalizado con IA
            </h2>
            <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
              No es una remera mas — es algo que diseñaste vos pensando en esa persona
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {advantages.map((adv) => (
                <div key={adv.title} className="flex gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                  <adv.icon className="w-8 h-8 text-rose-400 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{adv.title}</h3>
                    <p className="text-sm text-zinc-400">{adv.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* More categories */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Mas formas de personalizar
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Regalos para empresas, marcas propias, creadores y revendedores
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {moreCategories.map((item) => (
              <Link key={item.title} href={item.link}>
                <Card className="bg-zinc-900 border-zinc-800 hover:border-rose-500/50 transition-all h-full group cursor-pointer">
                  <CardContent className="p-5">
                    <item.icon className="w-8 h-8 text-rose-400 mb-3" />
                    <h3 className="font-semibold mb-1 group-hover:text-rose-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-zinc-400">{item.description}</p>
                    <span className="text-xs text-rose-400 mt-2 inline-flex items-center">
                      Ver mas <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
                  name: "Luciana R.",
                  role: "Regalo de cumpleanos — 30 anos",
                  text: "Le regale a mi amiga una remera con un diseno IA basado en su gata. Cuando la vio se puso a llorar. La calidad es increible y el diseno parece hecho por un artista profesional.",
                  rating: 5,
                },
                {
                  name: "Martin G.",
                  role: "Grupo de amigos — despedida de soltero",
                  text: "Pedimos 12 remeras para la despedida de mi amigo. Cada una con un apodo diferente y el mismo diseno de fondo. Quedaron espectaculares y las diseñamos en 10 minutos con la IA.",
                  rating: 5,
                },
                {
                  name: "Sofia D.",
                  role: "Regalo Dia del Padre",
                  text: "Le hice un hoodie a mi viejo con una ilustracion de el pescando generada por IA. Lo usa todos los fines de semana. Dice que es la mejor prenda que tiene. La produccion fue super rapida.",
                  rating: 5,
                },
              ].map((testimonial) => (
                <Card key={testimonial.name} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-rose-400 text-rose-400" />
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
            Preguntas frecuentes sobre regalos personalizados
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Que puedo regalar personalizado?",
                a: "Remeras (classic, oversize, crop, musculosa), buzos crewneck y hoodies. Cada prenda de algodon 100% con estampado DTG premium. Podes usar tu propia imagen o crear un diseno unico con IA.",
              },
              {
                q: "Cuanto cuesta un regalo personalizado?",
                a: "Desde $21.800 (musculosa) hasta $55.000 (Buzo Hoodie Oversize). El precio incluye prenda + estampado DTG. Descuentos por cantidad: 5% desde 10 un., 10% desde 25, 15% desde 100+.",
              },
              {
                q: "Puedo usar una foto para el diseno?",
                a: "Si. Subi cualquier imagen (foto, logo, dibujo, frase) o usa la IA: describe tu idea y genera un diseno profesional en segundos. Las dos opciones estan incluidas sin costo extra.",
              },
              {
                q: "Cuanto tarda en llegar?",
                a: "Produccion: 2-5 dias habiles. Envio: AMBA $5.500 (3-5 dias), Interior BA $7.000 (5-7 dias), Resto del pais $9.000 (7-10 dias). Recomendamos pedir con 10+ dias de anticipacion.",
              },
              {
                q: "Puedo pedir 1 sola unidad?",
                a: "Si. Desde 1 prenda. Y si pedis para un grupo (cumple, despedida, equipo), cada una puede tener un diseno diferente sin costo extra.",
              },
              {
                q: "Que metodos de pago aceptan?",
                a: "Tarjeta de credito/debito, MercadoPago (cuotas sin interes), transferencia bancaria. Factura A para empresas y monotributistas.",
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
              Crea un regalo que no existe en ningun otro lugar
            </h2>
            <p className="text-lg text-zinc-300 mb-8 max-w-2xl mx-auto">
              En 5 minutos diseñas algo unico con IA. Estampado DTG premium
              sobre algodon 100%. Un regalo con significado real.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-rose-600 hover:bg-rose-500 text-white text-lg px-8 py-6">
                <Link href="/design">
                  <Sparkles className="w-5 h-5 mr-2" /> Diseña Tu Regalo Ahora
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 text-lg px-8 py-6">
                <Link
                  href="https://wa.me/5491126603080?text=Hola!%20Quiero%20un%20regalo%20personalizado.%20Me%20ayudan?"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-zinc-500">
              <Link href="/remeras-personalizadas" className="hover:text-rose-400 transition-colors">Remeras personalizadas</Link>
              <span>|</span>
              <Link href="/buzos-personalizados" className="hover:text-rose-400 transition-colors">Buzos personalizados</Link>
              <span>|</span>
              <Link href="/estampar-remeras" className="hover:text-rose-400 transition-colors">Estampar remeras</Link>
              <span>|</span>
              <Link href="/cotizador" className="hover:text-rose-400 transition-colors">Cotizador</Link>
              <span>|</span>
              <Link href="/regalos-empresariales" className="hover:text-rose-400 transition-colors">Regalos empresariales</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
