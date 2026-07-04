import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import {
  Sparkles, Building2, Users, ArrowRight, Star, Truck,
  Shield, Clock, CheckCircle2, Zap, Package, Palette,
  UtensilsCrossed, Stethoscope, GraduationCap, Dumbbell,
  Store, Laptop, Repeat, BadgePercent, Shirt
} from "lucide-react"

export const metadata: Metadata = {
  title: "Uniformes Personalizados con IA — Remeras y Buzos para tu Equipo | Novamente",
  description:
    "Uniformes personalizados con inteligencia artificial para empresas, restaurantes, gimnasios y mas. Remeras desde $28.600, hoodies desde $43.000. Algodon 100%, estampado DTG premium. Pedidos recurrentes con descuento. Envios a toda Argentina.",
  keywords: [
    "uniformes personalizados argentina",
    "uniformes de trabajo personalizados",
    "uniformes empresariales",
    "uniformes para restaurantes",
    "ropa de trabajo personalizada",
    "uniformes para gastronomia",
    "uniformes corporativos",
    "remeras para staff",
    "uniformes para gimnasios",
    "ropa corporativa personalizada",
    "uniformes con logo",
    "uniformes DTG",
  ],
  openGraph: {
    title: "Uniformes Personalizados con IA — Novamente",
    description:
      "Uniformes para tu equipo con diseno IA. Remeras desde $28.600, hoodies desde $43.000. Pedidos recurrentes con descuento. Algodon 100%, DTG premium.",
    url: "https://www.novamente.ar/uniformes-personalizados",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png",
        width: 800,
        height: 800,
        alt: "Uniformes personalizados con IA — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Uniformes Personalizados con IA — Novamente",
    description:
      "Uniformes unicos para tu equipo. Remeras y hoodies con diseno IA, DTG premium. Descuentos por cantidad y pedidos recurrentes.",
  },
  alternates: { canonical: "https://www.novamente.ar/uniformes-personalizados" },
}

export default function UniformesPersonalizados() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Uniformes Personalizados — Novamente",
    description:
      "Servicio de uniformes personalizados con inteligencia artificial. Remeras, hoodies y buzos con estampado DTG premium para empresas, restaurantes, gimnasios y equipos de trabajo.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Uniformes Corporativos Personalizados",
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
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cuanto cuestan los uniformes personalizados?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Los uniformes arrancan desde $28.600 por remera y $43.000 por hoodie. Ofrecemos descuentos por cantidad: 5% en 10-24 unidades, 10% en 25-49 unidades, y 15% en 50+ unidades. Para pedidos recurrentes (trimestrales/semestrales) ofrecemos un 5% adicional.",
        },
      },
      {
        "@type": "Question",
        name: "Pueden estampar el logo de mi empresa en los uniformes?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, podemos estampar tu logo exacto o usar nuestra IA para crear disenos que incorporen tu identidad de marca. Envianos tu logo por WhatsApp y armamos una muestra digital gratuita antes de producir.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tiempo demoran los uniformes?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Produccion de 3-5 dias habiles para pedidos de hasta 50 unidades, 5-10 dias para pedidos mayores. Envio adicional de 3-7 dias segun la zona. Para aperturas o eventos, recomendamos pedir con 15 dias de anticipacion.",
        },
      },
      {
        "@type": "Question",
        name: "Los uniformes se bancan los lavados frecuentes?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, usamos estampado DTG (Direct to Garment) sobre algodon 100% premium. El estampado resiste 50+ lavados sin decolorarse. Recomendamos lavar del reves en frio para maxima durabilidad, ideal para uso diario en uniformes.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo pedir talles diferentes en el mismo pedido?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, cada prenda puede ser de un talle diferente. Ofrecemos talles S a XXL en todos los modelos. Tambien podemos hacer prendas con diferentes disenos (por area, rol, o nombre del empleado) en el mismo pedido sin costo adicional.",
        },
      },
      {
        "@type": "Question",
        name: "Ofrecen plan de uniformes recurrente?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, armamos planes recurrentes trimestrales o semestrales con 5% de descuento adicional sobre el precio por cantidad. Ideal para restaurantes que renuevan staff, gimnasios con instructores rotativos, o empresas que onboardean gente seguido.",
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
        name: "Uniformes Personalizados",
        item: "https://www.novamente.ar/uniformes-personalizados",
      },
    ],
  }

  const industries = [
    {
      icon: UtensilsCrossed,
      title: "Gastronomia",
      description: "Restaurantes, cafes, cervecerías, dark kitchens. Remeras resistentes para cocina y salon con tu marca.",
      example: "Staff de 8 personas: remeras negras con logo + nombre",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      icon: Dumbbell,
      title: "Fitness y deporte",
      description: "Gimnasios, estudios de yoga, personal trainers. Musculosas y remeras transpirables con identidad.",
      example: "Instructores: musculosas + remeras para recepcion",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      icon: Laptop,
      title: "Tech y startups",
      description: "Onboarding kits, remeras de equipo, merch para eventos y conferencias tech.",
      example: "Welcome pack: hoodie + remera para cada hire",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: Stethoscope,
      title: "Salud y bienestar",
      description: "Clinicas, consultorios, farmacias, centros de estetica. Remeras con logo profesional.",
      example: "Equipo medico: remeras blancas con logo de la clinica",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Store,
      title: "Retail y comercio",
      description: "Tiendas, showrooms, pop-ups. Uniformes que refuerzan la marca en cada punto de contacto.",
      example: "Vendedores: remeras con branding y cargo",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      icon: GraduationCap,
      title: "Educacion",
      description: "Colegios, universidades, academias, jardines. Remeras para eventos, egresados y staff.",
      example: "Promocion 2026: hoodies de egresados personalizados",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
  ]

  const products = [
    { name: "Remera Classic Fit", price: "$28.600", ideal: "Gastro, retail, salud", badge: "Mas vendida" },
    { name: "Remera Oversize", price: "$31.000", ideal: "Tech, startups, creativas", badge: null },
    { name: "Musculosa Unisex", price: "$21.800", ideal: "Fitness, deporte, verano", badge: "Menor costo" },
    { name: "Buzo Hoodie Oversize", price: "$43.000", ideal: "Tech, educacion, outdoor", badge: null },
    { name: "Buzo Hoodie Oversize", price: "$55.000", ideal: "Premium, welcome packs", badge: "Premium" },
    { name: "Buzo Cuello Redondo", price: "$43.000", ideal: "Invierno, uniformes abrigados", badge: null },
  ]

  const pricingTiers = [
    { range: "1 - 9 un.", discount: "Precio regular", example: "Remera $28.600", tag: null },
    { range: "10 - 24 un.", discount: "5% OFF", example: "Remera $27.170", tag: null },
    { range: "25 - 49 un.", discount: "10% OFF", example: "Remera $25.740", tag: "Popular" },
    { range: "50+ un.", discount: "15% OFF", example: "Remera $24.310", tag: "Mejor valor" },
  ]

  const testimonials = [
    {
      quote: "Pedimos 30 remeras para el staff del restaurante. La calidad del estampado aguanta los lavados diarios sin problema. Ya hicimos 3 reposiciones.",
      name: "Martin L.",
      role: "Dueno de restaurante, Palermo",
      rating: 5,
    },
    {
      quote: "Los welcome packs con hoodie personalizada son un hit con cada nuevo hire. La IA nos genero un diseno que captura perfecto nuestra cultura.",
      name: "Lucia F.",
      role: "People Lead, startup fintech",
      rating: 5,
    },
    {
      quote: "Uniformes para 12 instructores del gimnasio. Cada uno con su nombre. Rapido, buena calidad y el precio por cantidad es imbatible.",
      name: "Tomas R.",
      role: "Dueno de crossfit box, Cordoba",
      rating: 5,
    },
  ]

  const whatsappMessage = encodeURIComponent(
    "Hola! Me interesa cotizar uniformes personalizados para mi equipo. Somos [cantidad] personas y necesitamos [tipo de prenda]. Nuestra empresa es [nombre]."
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
            <span className="text-zinc-300">Uniformes Personalizados</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-500/10 to-transparent" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-uniformes-personalizados.webp"
              alt="Equipo argentino con remeras negras corporativas Novamente personalizadas"
            />
            <div className="max-w-3xl">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 mb-6">
                <Shirt className="w-3 h-3 mr-1" />
                Uniformes con IA
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Uniformes personalizados{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  que representan tu marca
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-300 mb-4 leading-relaxed">
                Vesti a tu equipo con prendas de algodon 100% y estampado DTG premium.
                Desde <span className="text-white font-semibold">$28.600</span> por remera.
                Descuentos por cantidad y planes recurrentes.
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-zinc-400 mb-8">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Sin minimo de unidades</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Cada prenda puede ser unica</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Aguanta 50+ lavados</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg px-8 py-6"
                >
                  <a
                    href={`https://wa.me/5492235169720?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cotizar uniformes por WhatsApp
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-lg px-8 py-6"
                >
                  <Link href="/products">
                    Ver catalogo completo
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Industries */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Uniformes para cada industria
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                No importa tu rubro: armamos uniformes que refuerzan tu marca y dan identidad a tu equipo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {industries.map((ind) => (
                <Card key={ind.title} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${ind.bg} flex items-center justify-center mb-4`}>
                      <ind.icon className={`w-6 h-6 ${ind.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{ind.title}</h3>
                    <p className="text-zinc-400 mb-3">{ind.description}</p>
                    <p className="text-sm text-blue-400 italic">&quot;{ind.example}&quot;</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why recurring */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 mb-4">
                <Repeat className="w-3 h-3 mr-1" />
                Plan recurrente
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Pedidos recurrentes con 5% extra de descuento
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Arma un plan trimestral o semestral y obtene un descuento adicional que se suma al descuento por cantidad. Ideal para equipos que rotan personal o renuevan uniformes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="bg-zinc-800/50 border-zinc-700 text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-blue-400 mb-2">Trimestral</div>
                  <p className="text-zinc-400 mb-3">4 entregas al ano</p>
                  <p className="text-white font-semibold">5% extra sobre precio por cantidad</p>
                  <p className="text-sm text-zinc-500 mt-2">Ej: 25 remeras/trim = $24.453/un.</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-800/50 border-blue-500/30 border-2 text-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Recomendado</Badge>
                </div>
                <CardContent className="p-6 pt-8">
                  <div className="text-3xl font-bold text-blue-400 mb-2">Semestral</div>
                  <p className="text-zinc-400 mb-3">2 entregas al ano</p>
                  <p className="text-white font-semibold">5% extra + envio bonificado AMBA</p>
                  <p className="text-sm text-zinc-500 mt-2">Ej: 50 remeras/sem = $23.095/un.</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-800/50 border-zinc-700 text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-blue-400 mb-2">A demanda</div>
                  <p className="text-zinc-400 mb-3">Cuando necesites</p>
                  <p className="text-white font-semibold">Descuento por cantidad estandar</p>
                  <p className="text-sm text-zinc-500 mt-2">Sin compromiso, pedi cuando quieras</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Product grid */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Prendas disponibles para uniformes
              </h2>
              <p className="text-zinc-400 text-lg">
                Todas en algodon 100% premium, optimizadas para estampado DTG de alta durabilidad.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.name} className="bg-zinc-900/50 border-zinc-800 hover:border-blue-500/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                      {product.badge && (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-blue-400 mb-2">{product.price}</div>
                    <p className="text-sm text-zinc-500">Ideal para: {product.ideal}</p>
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
                Mientras mas pidas, menos pagas. Y con plan recurrente se suma un 5% adicional.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.range}
                  className={`text-center ${tier.tag ? "bg-zinc-800/50 border-blue-500/30 border-2" : "bg-zinc-900/50 border-zinc-800"}`}
                >
                  <CardContent className="p-5">
                    {tier.tag && (
                      <Badge className="bg-blue-600 text-white mb-2 text-xs">{tier.tag}</Badge>
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

        {/* How it works */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Como funciona
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { step: "1", icon: Package, title: "Contanos que necesitas", desc: "Cantidad, tipo de prenda, colores. Mandanos tu logo por WhatsApp." },
                { step: "2", icon: Palette, title: "Armamos la propuesta", desc: "Muestra digital gratuita con tu logo/diseno. Ajustamos hasta que quede perfecto." },
                { step: "3", icon: Sparkles, title: "Produccion DTG", desc: "Estampamos cada prenda con tecnologia DTG. 3-5 dias habiles." },
                { step: "4", icon: Truck, title: "Entrega a domicilio", desc: "Envio a tu empresa o local. AMBA, interior BA y todo el pais." },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-sm font-mono text-blue-400 mb-2">Paso {s.step}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-zinc-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Novamente */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
              Por que elegirnos para tus uniformes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Sparkles, title: "Diseno con IA", desc: "Nuestra IA genera disenos unicos que incorporan tu identidad de marca.", color: "text-blue-400" },
                { icon: Shield, title: "Durabilidad DTG", desc: "Estampado que resiste 50+ lavados. Ideal para uso diario en uniformes.", color: "text-emerald-400" },
                { icon: BadgePercent, title: "Descuentos acumulables", desc: "Cantidad + plan recurrente. Hasta 20% OFF en uniformes.", color: "text-amber-400" },
                { icon: Clock, title: "Entrega rapida", desc: "3-5 dias de produccion. Envios a todo el pais.", color: "text-violet-400" },
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
              Lo que dicen nuestros clientes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <Card key={t.name} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-blue-400 text-blue-400" />
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
              Calificacion promedio: <span className="text-white font-semibold">4.8/5</span> basado en 67 pedidos de uniformes
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
              Preguntas frecuentes sobre uniformes
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
            <Card className="bg-gradient-to-br from-blue-600/20 via-indigo-500/10 to-zinc-900 border-blue-500/20">
              <CardContent className="p-8 sm:p-12 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Vesti a tu equipo con Novamente
                </h2>
                <p className="text-lg text-zinc-300 mb-8 max-w-xl mx-auto">
                  Mandanos un WhatsApp con tu logo y la cantidad que necesitas. Te armamos una propuesta con muestra digital gratuita en menos de 24hs.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg px-8 py-6"
                  >
                    <a
                      href={`https://wa.me/5492235169720?text=${whatsappMessage}`}
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
                    <Link href="/crear">
                      Disenar con IA gratis
                    </Link>
                  </Button>
                </div>

                <p className="text-sm text-zinc-500 mt-6">
                  Factura A o B disponible. Aceptamos transferencia y MercadoPago.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cross-sell: Partners */}
        <section className="py-12 border-t border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-zinc-500 mb-3">
              Tenes una marca de ropa y queres vender uniformes personalizados?
            </p>
            <Button asChild variant="link" className="text-blue-400 hover:text-blue-300">
              <Link href="/partners">
                Conoce nuestro programa de Partners <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  )
}
