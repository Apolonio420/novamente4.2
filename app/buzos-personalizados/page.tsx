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
  Thermometer, Paintbrush, Users,
  GraduationCap, Briefcase, PartyPopper,
  Trophy, Music, Heart
} from "lucide-react"

export const metadata: Metadata = {
  title: "Buzos Personalizados Argentina — Hoodies y Crewnecks con IA y DTG | Novamente",
  description:
    "Buzos personalizados con inteligencia artificial y estampado DTG premium. Hoodies oversize desde $55.000, crewnecks desde $43.000. Algodon 100% frizado, desde 1 unidad. Descuentos por cantidad. Envios a toda Argentina.",
  keywords: [
    "buzos personalizados",
    "buzos personalizados argentina",
    "buzo personalizado",
    "buzo estampado personalizado",
    "buzo con diseno propio",
    "buzos personalizados online",
    "buzo oversize personalizado",
    "buzos custom argentina",
    "buzo con estampa",
    "buzo hoodie personalizado",
    "buzo crewneck personalizado",
    "buzos personalizados por unidad",
    "buzos estampados DTG",
    "buzos con IA",
    "buzos personalizados buenos aires",
  ],
  openGraph: {
    title: "Buzos Personalizados con IA — Novamente Argentina",
    description:
      "Disena buzos unicos con inteligencia artificial. Hoodies y crewnecks en algodon 100% premium con estampado DTG. Desde 1 unidad. Envios a toda Argentina.",
    url: "https://www.novamente.ar/buzos-personalizados",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png",
        width: 800,
        height: 800,
        alt: "Buzos personalizados con estampado DTG — Novamente Argentina",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buzos Personalizados con IA — Novamente",
    description:
      "Disena buzos unicos con inteligencia artificial. Hoodies y crewnecks con estampado DTG premium. Desde 1 unidad.",
  },
  alternates: { canonical: "https://www.novamente.ar/buzos-personalizados" },
}

export default function BuzosPersonalizados() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Buzos Personalizados con IA — Novamente",
    description:
      "Servicio de personalizacion de buzos con inteligencia artificial y estampado DTG premium. Hoodies oversize, crewnecks y buzos clasicos en algodon 100% frizado. Desde 1 unidad sin minimos de cantidad. Produccion on-demand y envios a toda Argentina.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Personalizacion de Buzos con IA",
    areaServed: {
      "@type": "Country",
      name: "Argentina",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: 43000,
      highPrice: 55000,
      priceCurrency: "ARS",
      offerCount: 7,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
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
        name: "Cuanto sale un buzo personalizado?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Buzos crewneck (cuello redondo) desde $43.000 y Buzo Hoodie Oversize desde $55.000. El precio incluye el buzo de algodon 100% frizado + estampado DTG. Sin costos de setup ni minimos de cantidad.",
        },
      },
      {
        "@type": "Question",
        name: "Que diferencia hay entre hoodie y crewneck?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "El hoodie tiene capucha y bolsillo canguro, es mas casual y urbano. El crewneck (cuello redondo) es mas limpio y versatil, funciona tanto para uso diario como para uniformes o eventos. Ambos son algodon 100% con interior frisa y estampado DTG.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo personalizar cada buzo con un diseno diferente?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. Con DTG cada buzo puede tener un diseno completamente diferente sin costo extra. Ideal para egresados (cada uno con su nombre), equipos (nombre + numero) o grupos donde cada integrante quiere algo unico.",
        },
      },
      {
        "@type": "Question",
        name: "Que talles hay disponibles?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Talles S, M, L, XL y XXL en todos los modelos. El fit oversize viene con caida mas amplia. Podes mezclar talles en un mismo pedido sin restricciones.",
        },
      },
      {
        "@type": "Question",
        name: "Son abrigados? Sirven para invierno?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. Todos nuestros buzos son algodon 100% con interior frisa suave y grueso. La tela es de 350-400 gsm, pensada para otono e invierno argentino. La composicion esta optimizada para estampado DTG sin perder abrigo.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tarda la produccion y el envio?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Produccion: 2-5 dias habiles. Envio: AMBA 3-5 dias ($5.500), Interior BA 5-7 dias ($7.000), Resto del pais 7-10 dias ($9.000). Total desde que confirmas hasta que lo recibi: 5-15 dias habiles segun tu zona.",
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
        name: "Buzos Personalizados",
        item: "https://www.novamente.ar/buzos-personalizados",
      },
    ],
  }

  const products = [
    { name: "Buzo Cuello Redondo Negro", price: 43000, description: "Crewneck oversize, algodon 100% frizado", category: "Crewneck" },
    { name: "Buzo Cuello Redondo Crema", price: 43000, description: "Crewneck oversize, base neutra", category: "Crewneck" },
    { name: "Buzo Cuello Redondo Gris", price: 43000, description: "Crewneck oversize, gris melange clasico", category: "Crewneck" },
    { name: "Buzo Hoodie Oversize Negro", price: 55000, description: "Hoodie oversize con capucha y bolsillo", category: "Hoodie", popular: true },
    { name: "Buzo Hoodie Oversize Marron", price: 55000, description: "Hoodie oversize, tono marron", category: "Hoodie" },
    { name: "Buzo Hoodie Oversize Crema", price: 55000, description: "Hoodie oversize, base neutra versatil", category: "Hoodie" },
    { name: "Buzo Hoodie Oversize Gris", price: 55000, description: "Hoodie oversize, gris melange", category: "Hoodie" },
  ]

  const advantages = [
    { icon: Thermometer, title: "Algodon 100% frizado", description: "Interior frisa suave y grueso (350-400 gsm). Pensado para otono e invierno argentino." },
    { icon: Zap, title: "Desde 1 unidad", description: "Sin minimos de cantidad. Personaliza 1 buzo o 500, cada uno con diseno diferente." },
    { icon: Palette, title: "Colores ilimitados", description: "DTG imprime millones de colores sin costo extra. Tu diseno sale exacto al archivo." },
    { icon: Sparkles, title: "Diseno con IA", description: "No tenes diseno? Describe tu idea y nuestra IA crea uno unico en segundos." },
    { icon: Shield, title: "50+ lavados", description: "Estampado DTG profesional que resiste el uso diario. Lavar del reves, agua fria." },
    { icon: Clock, title: "Produccion rapida", description: "2-5 dias habiles. Sin tiempos de setup ni esperas por matriceria." },
  ]

  const categories = [
    { icon: GraduationCap, title: "Egresados", description: "Cada alumno con su nombre. Descuento por curso completo.", link: "/buzos-egresados" },
    { icon: Briefcase, title: "Empresas", description: "Uniformes y regalos corporativos con logo y branding.", link: "/uniformes-personalizados" },
    { icon: PartyPopper, title: "Despedidas", description: "Grupo con diseno unico. Nombre de cada invitado.", link: "/despedidas-personalizadas" },
    { icon: Trophy, title: "Equipos deportivos", description: "Nombre, numero y escudo. Pedidos recurrentes.", link: "/indumentaria-deportiva" },
    { icon: Music, title: "Bandas y artistas", description: "Merch para shows, giras y fans.", link: "/merch-para-bandas" },
    { icon: Heart, title: "Uso personal", description: "Tu diseno o el de nuestra IA. Pieza unica.", link: "/design" },
    { icon: Users, title: "Creadores", description: "Merch on-demand para tu audiencia.", link: "/merch-para-creadores" },
    { icon: Shirt, title: "Tu propia marca", description: "Lanza tu linea de buzos sin inversion.", link: "/lanza-tu-marca" },
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
            <li className="text-zinc-300">Buzos Personalizados</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-black to-black" />
          <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-buzos-personalizados.webp"
              alt="Buzo hoodie negro Novamente personalizado con estampa, look streetwear argentino"
            />
            <Badge className="mb-6 bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-sm px-4 py-1">
              <Thermometer className="w-4 h-4 mr-1" /> Temporada Otono-Invierno 2026
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Buzos Personalizados
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                con IA y estampado DTG
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto mb-8">
              Hoodies oversize, crewnecks y buzos clasicos en algodon 100% frizado.
              Disena con nuestra IA o subi tu arte. Desde 1 unidad,
              sin minimos. Estampado DTG premium que dura 50+ lavados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg px-8 py-6">
                <Link href="/design">
                  <Sparkles className="w-5 h-5 mr-2" /> Disena Tu Buzo Ahora
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 text-lg px-8 py-6">
                <Link
                  href="https://wa.me/5491126603080?text=Hola!%20Quiero%20buzos%20personalizados.%20Me%20asesoran?"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5 mr-2" /> Consultar por WhatsApp
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Crewnecks desde $43.000</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Hoodies desde $55.000</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Algodon 100% frizado</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Envio a todo el pais</span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-zinc-800 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-indigo-400">8 modelos</p>
              <p className="text-sm text-zinc-400">Hoodies + Crewnecks</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-violet-400">4 colores</p>
              <p className="text-sm text-zinc-400">Negro, Crema, Gris, Marron</p>
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

        {/* Product grid */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Nuestros buzos
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Todos en algodon 100% con interior frisa. Personalizables con tu diseno o IA
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card
                key={product.name}
                className={`bg-zinc-900 ${product.popular ? "border-indigo-500/50 ring-1 ring-indigo-500/20" : "border-zinc-800"} hover:border-indigo-500/50 transition-all`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={
                      product.category === "Hoodie Premium"
                        ? "bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs"
                        : product.category === "Hoodie"
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs"
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
          <div className="text-center mt-8">
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white">
              <Link href="/design">
                <Paintbrush className="w-5 h-5 mr-2" /> Personalizar mi buzo
              </Link>
            </Button>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Como personalizar tu buzo
            </h2>
            <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
              En 4 pasos simples tenes tu buzo personalizado listo para usar
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { number: "01", icon: Sparkles, title: "Disena con IA o subi tu arte", description: "Describe tu idea y la IA genera el diseno. O subi tu PNG, JPG o SVG. 37 estilos artisticos disponibles." },
                { number: "02", icon: Shirt, title: "Elegi tu buzo", description: "Buzo Hoodie Oversize o crewneck. 6 colores, talles S a XXL. Algodon 100% frizado." },
                { number: "03", icon: Layers, title: "Estampado DTG", description: "Impresion directa sobre la tela con tintas de agua. Colores vibrantes, tacto suave, 50+ lavados." },
                { number: "04", icon: Truck, title: "Envio a tu puerta", description: "Produccion en 2-5 dias. Envio a todo el pais: AMBA $5.500, Interior BA $7.000, Resto $9.000." },
              ].map((step) => (
                <Card key={step.number} className="bg-zinc-900 border-zinc-800 hover:border-indigo-500/50 transition-all">
                  <CardContent className="p-6 text-center">
                    <span className="text-4xl font-bold text-indigo-500/30">{step.number}</span>
                    <div className="flex justify-center my-4">
                      <step.icon className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-zinc-400">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Advantages */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Por que elegir nuestros buzos
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Calidad premium pensada para el frio argentino con la mejor tecnologia de estampado
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {advantages.map((adv) => (
              <div key={adv.title} className="flex gap-4 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <adv.icon className="w-8 h-8 text-indigo-400 shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">{adv.title}</h3>
                  <p className="text-sm text-zinc-400">{adv.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Hoodie vs Crewneck */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Hoodie vs Crewneck: cual elegir?
            </h2>
            <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
              Ambos son algodon 100% frizado con estampado DTG. La diferencia es el estilo
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="bg-zinc-900 border-indigo-500/50 ring-1 ring-indigo-500/20">
                <CardContent className="p-6">
                  <Badge className="mb-4 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Hoodie</Badge>
                  <h3 className="text-xl font-semibold mb-4">Con capucha y bolsillo</h3>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Capucha con cordones</p>
                    <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Bolsillo canguro</p>
                    <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Look casual / urbano / streetwear</p>
                    <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Ideal para uso diario y merch</p>
                  </div>
                  <p className="text-lg font-bold">Desde $55.000 <span className="text-sm font-normal text-zinc-500">(Buzo Hoodie Oversize)</span></p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-violet-500/50 ring-1 ring-violet-500/20">
                <CardContent className="p-6">
                  <Badge className="mb-4 bg-violet-500/20 text-violet-300 border-violet-500/30">Crewneck</Badge>
                  <h3 className="text-xl font-semibold mb-4">Cuello redondo limpio</h3>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Cuello redondo clasico</p>
                    <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Sin capucha — mas formal</p>
                    <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Versatil: casual, laboral, eventos</p>
                    <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Ideal para uniformes y egresados</p>
                  </div>
                  <p className="text-lg font-bold">Desde $43.000 <span className="text-sm font-normal text-zinc-500">(oversize)</span></p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Volume discounts */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Descuentos por cantidad
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Pedidos grupales para egresados, empresas, eventos o mayoristas
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="p-6">
                <p className="text-4xl font-bold text-indigo-400 mb-2">5%</p>
                <p className="text-lg font-semibold mb-1">10 - 24 unidades</p>
                <p className="text-sm text-zinc-400">Ej: Crewneck a $40.850</p>
                <p className="text-xs text-zinc-500">Buzo Hoodie Oversize a $52.250</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-indigo-500/50 text-center ring-1 ring-indigo-500/20">
              <CardContent className="p-6">
                <Badge className="mb-2 bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs">Popular</Badge>
                <p className="text-4xl font-bold text-violet-400 mb-2">10%</p>
                <p className="text-lg font-semibold mb-1">25 - 99 unidades</p>
                <p className="text-sm text-zinc-400">Ej: Crewneck a $38.700</p>
                <p className="text-xs text-zinc-500">Buzo Hoodie Oversize a $49.500</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="p-6">
                <p className="text-4xl font-bold text-emerald-400 mb-2">15%</p>
                <p className="text-lg font-semibold mb-1">100+ unidades</p>
                <p className="text-sm text-zinc-400">Ej: Crewneck a $36.550</p>
                <p className="text-xs text-zinc-500">Buzo Hoodie Oversize a $46.750</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white">
              <Link href="/cotizador">
                <Package className="w-5 h-5 mr-2" /> Calcular mi presupuesto
              </Link>
            </Button>
          </div>
        </section>

        {/* Categories / Use cases */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Buzos personalizados para cada ocasion
            </h2>
            <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
              Sea cual sea tu necesidad, tenemos el buzo ideal
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link key={cat.title} href={cat.link}>
                  <Card className="bg-zinc-900 border-zinc-800 hover:border-indigo-500/50 transition-all h-full group cursor-pointer">
                    <CardContent className="p-5">
                      <cat.icon className="w-8 h-8 text-indigo-400 mb-3" />
                      <h3 className="font-semibold mb-1 group-hover:text-indigo-300 transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-sm text-zinc-400">{cat.description}</p>
                      <span className="text-xs text-indigo-400 mt-2 inline-flex items-center">
                        Ver mas <ArrowRight className="w-3 h-3 ml-1" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Lo que dicen nuestros clientes
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Camila R.",
                role: "Delegada de egresados",
                text: "Hicimos 45 buzos crewneck para la promo, cada uno con nombre y apodo. La calidad es excelente, son super abrigados y el estampado quedo perfecto. El descuento por cantidad nos salvo.",
                rating: 5,
              },
              {
                name: "Martin G.",
                role: "Fundador de marca streetwear",
                text: "Los hoodies oversize son increibles. La caida, la tela, el estampado DTG — todo de primera. Produzco on-demand y no tengo stock muerto. Mis clientes repiten.",
                rating: 5,
              },
              {
                name: "Lucia F.",
                role: "Compradora particular",
                text: "Me diseñe un buzo con la IA para regalarle a mi novio. En 5 minutos tenia el diseno, en 5 dias llego a casa. La calidad me sorprendio, es grueso y abrigado de verdad.",
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
        </section>

        {/* FAQ */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Preguntas frecuentes sobre buzos personalizados
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Cuanto sale un buzo personalizado?",
                  a: "Crewneck (cuello redondo) desde $43.000 y Buzo Hoodie Oversize desde $55.000. Precio incluye buzo + estampado DTG. Sin costos de setup ni minimos.",
                },
                {
                  q: "Que diferencia hay entre hoodie y crewneck?",
                  a: "El hoodie tiene capucha y bolsillo canguro (mas casual/urbano). El crewneck es cuello redondo sin capucha (mas limpio/versatil). Ambos son algodon 100% frizado con DTG.",
                },
                {
                  q: "Puedo hacer cada buzo con un diseno diferente?",
                  a: "Si. Con DTG cada buzo puede ser unico sin costo extra. Ideal para egresados con nombres, equipos con numeros, o grupos donde cada persona quiere algo distinto.",
                },
                {
                  q: "Que talles tienen?",
                  a: "S, M, L, XL y XXL en todos los modelos. El fit oversize tiene caida mas amplia. Podes mezclar talles en un mismo pedido.",
                },
                {
                  q: "Son abrigados para invierno?",
                  a: "Si. Algodon 100% con interior frisa (350-400 gsm). Pensados para otono e invierno argentino. La tela es gruesa y suave.",
                },
                {
                  q: "Cuanto tarda la produccion?",
                  a: "2-5 dias habiles de produccion. Envio: AMBA 3-5 dias ($5.500), Interior BA 5-7 dias ($7.000), Resto del pais 7-10 dias ($9.000).",
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
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Disena tu buzo personalizado hoy
            </h2>
            <p className="text-lg text-zinc-300 mb-8 max-w-2xl mx-auto">
              Hoodies y crewnecks en algodon 100% frizado con estampado DTG premium.
              Desde 1 unidad, cada uno con diseno unico. Describe tu idea o subi tu arte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg px-8 py-6">
                <Link href="/design">
                  <Sparkles className="w-5 h-5 mr-2" /> Crear Mi Buzo
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 text-lg px-8 py-6">
                <Link
                  href="https://wa.me/5491126603080?text=Hola!%20Quiero%20buzos%20personalizados.%20Me%20pasan%20modelos%20y%20precios?"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-zinc-500">
              <Link href="/remeras-personalizadas" className="hover:text-indigo-400 transition-colors">Remeras personalizadas</Link>
              <span>|</span>
              <Link href="/hoodie-personalizado" className="hover:text-indigo-400 transition-colors">Hoodie personalizado</Link>
              <span>|</span>
              <Link href="/estampar-remeras" className="hover:text-indigo-400 transition-colors">Estampar remeras</Link>
              <span>|</span>
              <Link href="/cotizador" className="hover:text-indigo-400 transition-colors">Cotizador</Link>
              <span>|</span>
              <Link href="/remeras-por-mayor" className="hover:text-indigo-400 transition-colors">Por mayor</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
