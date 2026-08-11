import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import {
  Package, Star, Shield, Clock, CheckCircle2,
  Truck, Palette, Sparkles, ArrowRight,
  Users, Zap, Store, TrendingUp, ShoppingBag, Boxes
} from "lucide-react"
import { shippingZonesDetailLine } from "@/lib/shipping-config"

export const metadata: Metadata = {
  title: "Remeras por Mayor Personalizadas — Desde 10 Unidades con Descuento | Novamente",
  description:
    "Compra remeras por mayor personalizadas con estampado DTG premium. Desde 10 unidades con 5% OFF, 25+ con 10% OFF, 100+ con 15% OFF. Sin minimo de disenos. Envios a todo Argentina. Ideal para revendedores, ferias y showrooms.",
  keywords: [
    "remeras por mayor",
    "remeras al por mayor",
    "remeras por mayor personalizadas",
    "comprar remeras por mayor",
    "remeras mayoristas",
    "remeras por mayor argentina",
    "remeras personalizadas al por mayor",
    "venta de remeras por mayor",
    "buzos por mayor",
    "ropa por mayor personalizada",
    "remeras estampadas por mayor",
    "mayorista remeras",
  ],
  openGraph: {
    title: "Remeras por Mayor Personalizadas — Novamente",
    description:
      "Compra remeras y buzos por mayor con estampado DTG. Descuentos desde 10 unidades. Sin minimo de disenos. Envios a todo Argentina.",
    url: "https://www.novamente.ar/remeras-por-mayor",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/remera-negra-front.jpeg",
        width: 800,
        height: 800,
        alt: "Remeras por mayor personalizadas — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Remeras por Mayor Personalizadas — Novamente",
    description:
      "Remeras y buzos por mayor con estampado DTG premium. Descuentos por volumen desde 10 unidades.",
  },
  alternates: { canonical: "https://www.novamente.ar/remeras-por-mayor" },
}

export default function RemerasPorMayor() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Remeras por Mayor Personalizadas — Novamente",
    description:
      "Venta de remeras, buzos y hoodies por mayor con estampado DTG premium personalizado. Descuentos por volumen desde 10 unidades. Sin minimo de disenos diferentes. Produccion rapida y envios a todo Argentina.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Venta Mayorista de Indumentaria Personalizada",
    areaServed: {
      "@type": "Country",
      name: "Argentina",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: 24310,
      highPrice: 55000,
      priceCurrency: "ARS",
      offerCount: 6,
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
        name: "Cual es el minimo para comprar por mayor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Desde 10 unidades ya accedes a precio mayorista con 5% de descuento. Con 25 unidades tenes 10% OFF y con 100+ unidades 15% OFF. No hay minimo por diseno: podes pedir 10 unidades con 10 disenos diferentes.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo pedir diferentes disenos en un mismo pedido mayorista?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. A diferencia de la serigrafia, con DTG no hay setup por diseno. Podes pedir 50 remeras con 50 disenos diferentes al mismo precio mayorista. Solo importa la cantidad total del pedido para el descuento.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tardan los pedidos por mayor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pedidos de hasta 50 unidades: 5-7 dias habiles. De 50 a 200 unidades: 7-10 dias. Mas de 200 unidades: 10-15 dias habiles. Los tiempos incluyen produccion y no incluyen el envio.",
        },
      },
      {
        "@type": "Question",
        name: "Hacen factura A para revendedores?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, emitimos factura A para monotributistas y responsables inscriptos. Tambien factura B para consumidor final. Consultanos por WhatsApp con tu CUIT y te armamos la factura correspondiente.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo pedir muestras antes de un pedido grande?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. Podes comprar 1-2 unidades al precio unitario regular para ver la calidad antes de hacer un pedido mayorista. La calidad es identica en 1 unidad o en 500 — es la misma impresora DTG y la misma tela.",
        },
      },
      {
        "@type": "Question",
        name: "Que diferencia tiene comprar por mayor en Novamente vs un mayorista comun?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Los mayoristas comunes te venden remeras lisas en packs de 100+ iguales. Novamente te vende remeras YA ESTAMPADAS con tu diseno, desde 10 unidades, sin costo de setup por diseno. Cada remera puede tener un estampado diferente al mismo precio.",
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
        name: "Remeras por Mayor",
        item: "https://www.novamente.ar/remeras-por-mayor",
      },
    ],
  }

  const useCases = [
    {
      icon: Store,
      title: "Revendedores / Showrooms",
      description: "Compras al costo mayorista y revendes con 40-60% de margen en tu local, showroom o feria. Sin compromiso de continuidad — pedis cuando necesitas.",
      example: "Showroom en Flores que revende 100+ remeras/mes",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: ShoppingBag,
      title: "Ferias y Mercados",
      description: "Llevas stock variado a ferias de emprendedores, ferias americanas, mercados de diseno. Cada remera con un diseno diferente — tu stand se destaca.",
      example: "Feriante que lleva 50 remeras con 30 disenos distintos",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      icon: TrendingUp,
      title: "Marcas propias en crecimiento",
      description: "Tu marca esta creciendo y necesitas stock. Compras por mayor para tener inventario listo y despachar rapido. Escalas sin los problemas de la serigrafia.",
      example: "Marca streetwear que stockea 200 prendas/mes",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Users,
      title: "Organizadores de eventos",
      description: "Pedidos grupales para maratones, conferencias, team building, egresados. Un solo diseno o multiples variantes — el descuento aplica igual.",
      example: "Organizador que pide 150 remeras para maraton",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      icon: Sparkles,
      title: "Emprendedores de Mercado Libre / Tienda Nube",
      description: "Vendes online y necesitas stock. Compras por mayor, publicas en ML/TN, y despachás desde tu casa. Sin minimo por diseno = catalogo enorme.",
      example: "Vendedor de ML con 200+ publicaciones de remeras unicas",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: Palette,
      title: "Estudios de diseno / Agencias",
      description: "Ofreces merch personalizado a tus clientes corporativos. Compras por mayor y facturas como servicio de branding. Nosotros producimos, vos cobras.",
      example: "Agencia que produce 50 remeras corporativas por cliente",
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
  ]

  const products = [
    {
      name: "Aldea Classic Fit T-Shirt",
      regularPrice: "$28.600",
      wholesalePrice: "$24.310",
      discount: "15% OFF (100+ un.)",
      material: "Algodon 24/1 Jersey 190g",
      ideal: "Basica mayorista, mejor margen",
    },
    {
      name: "Aura Oversize T-Shirt",
      regularPrice: "$31.000",
      wholesalePrice: "$26.350",
      discount: "15% OFF (100+ un.)",
      material: "Algodon 30/1 Jersey 210g",
      ideal: "Tendencia oversize, mas valor percibido",
    },
    {
      name: "Aura Oversize T-Shirt Stone Wash",
      regularPrice: "$31.000",
      wholesalePrice: "$26.350",
      discount: "15% OFF (100+ un.)",
      material: "Algodon Stone Wash 210g",
      ideal: "Acabado vintage premium, diferenciacion",
    },
    {
      name: "Buzo Hoodie Oversize",
      regularPrice: "$55.000",
      wholesalePrice: "$51.000",
      discount: "15% OFF (100+ un.)",
      material: "Algodon 100% frisa 350g",
      ideal: "Mayor ticket, temporada frio",
    },
    {
      name: "Musculosa Tank Top",
      regularPrice: "$21.800",
      wholesalePrice: "$18.530",
      discount: "15% OFF (100+ un.)",
      material: "Algodon 24/1 Jersey 160g",
      ideal: "Temporada verano, gimnasios",
    },
    {
      name: "Tote Bag",
      regularPrice: "$18.600",
      wholesalePrice: "$15.810",
      discount: "15% OFF (100+ un.)",
      material: "Lona 100% algodon 280g",
      ideal: "Complemento, regalo con compra",
    },
  ]

  const testimonials = [
    {
      quote: "Compro 100 remeras por mes con 30-40 disenos diferentes. Antes con serigrafia era imposible tener tanta variedad. Ahora mi showroom tiene siempre stock fresco y mis clientas vuelven porque siempre hay algo nuevo.",
      name: "Carolina M.",
      role: "Duena de showroom — Flores, CABA",
      rating: 5,
    },
    {
      quote: "Vendo en Mercado Libre remeras con disenos propios. Compro por mayor en Novamente y tengo 200+ publicaciones activas. El margen es del 50% y la calidad DTG es incomparable con lo que venden otros mayoristas.",
      name: "Diego F.",
      role: "Vendedor online — Lomas de Zamora",
      rating: 5,
    },
    {
      quote: "Para las ferias necesito variedad. Pido 50 remeras con 50 estampados distintos y pago precio mayorista igual. Antes de Novamente eso era impensable. Vendo todo en un fin de semana.",
      name: "Lucia T.",
      role: "Feriante de diseno — San Telmo, CABA",
      rating: 5,
    },
  ]

  const whatsappMessage = encodeURIComponent(
    "Hola! Quiero consultar por remeras por mayor. Necesito [cantidad] unidades de [producto]. Mi negocio es [tipo de negocio]. Necesito factura [A/B]."
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
            <span className="text-zinc-300">Remeras por Mayor</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-orange-500/10 to-transparent" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-remeras-personalizadas.webp"
              alt="Remeras personalizadas Novamente al por mayor para empresas y revendedores"
            />
            <div className="max-w-3xl">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 mb-6">
                <Boxes className="w-3 h-3 mr-1" />
                Venta mayorista
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Remeras por mayor{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                  ya estampadas
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-300 mb-4 leading-relaxed">
                Compra remeras, buzos y hoodies personalizados al por mayor con estampado DTG premium.
                Desde 10 unidades con descuento. <span className="text-white font-semibold">Sin minimo por diseno — cada prenda puede tener un estampado diferente.</span>
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-zinc-400 mb-8">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Desde 10 unidades con 5% OFF</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Sin minimo por diseno</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Factura A disponible</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-lg px-8 py-6"
                >
                  <a
                    href={`https://wa.me/5492235169720?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pedir cotizacion mayorista
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-lg px-8 py-6"
                >
                  <Link href="/cotizador">
                    Calcular precios
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
                <div className="text-2xl sm:text-3xl font-bold text-amber-400">10+</div>
                <div className="text-sm text-zinc-400">unidades minimo</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-amber-400">15%</div>
                <div className="text-sm text-zinc-400">OFF en 100+ un.</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-amber-400">5-7</div>
                <div className="text-sm text-zinc-400">dias produccion</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-amber-400">4.9/5</div>
                <div className="text-sm text-zinc-400">calificacion clientes</div>
              </div>
            </div>
          </div>
        </section>

        {/* Key differentiator */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Por que comprar por mayor en Novamente
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                No somos un mayorista comun. Te vendemos remeras YA ESTAMPADAS con tus disenos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="bg-red-500/5 border-red-500/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-red-400 mb-4">Mayorista tradicional</h3>
                  <ul className="space-y-3 text-sm text-zinc-400">
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#x2715;</span> Remeras lisas, sin estampado</li>
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#x2715;</span> Minimo 100-500 unidades iguales</li>
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#x2715;</span> Despues tenes que mandar a estampar aparte</li>
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#x2715;</span> Setup caro por cada diseno (serigrafia)</li>
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#x2715;</span> Colores limitados por costo</li>
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#x2715;</span> Riesgo de stock que no se vende</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-amber-400 mb-4">Novamente mayorista</h3>
                  <ul className="space-y-3 text-sm text-zinc-300">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" /> Remeras YA ESTAMPADAS con tu diseno</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" /> Desde 10 unidades con descuento</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" /> Produccion + estampado incluido</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" /> $0 setup por diseno (DTG)</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" /> Colores ilimitados, fotos, degradados</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" /> Compras lo justo — pedis de nuevo cuando vendes</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Discount tiers */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Descuentos por volumen
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Mientras mas pedis, mas barato sale. Los descuentos aplican sobre el total del pedido, sin importar la cantidad de disenos diferentes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
              {[
                { range: "10 — 24 unidades", discount: "5% OFF", example: "Remera Classic: $28.600 → $27.170", tag: "Arrancar" },
                { range: "25 — 99 unidades", discount: "10% OFF", example: "Remera Classic: $28.600 → $25.740", tag: "Crecer" },
                { range: "100+ unidades", discount: "15% OFF", example: "Remera Classic: $28.600 → $24.310", tag: "Escalar" },
              ].map((tier) => (
                <Card key={tier.range} className="bg-zinc-800/50 border-zinc-700 hover:border-amber-500/30 transition-all text-center">
                  <CardContent className="p-6">
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs mb-3">{tier.tag}</Badge>
                    <div className="text-3xl font-bold text-amber-400 mb-2">{tier.discount}</div>
                    <div className="text-white font-medium mb-2">{tier.range}</div>
                    <div className="text-sm text-zinc-400">{tier.example}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-2xl mx-auto">
              <p className="text-amber-300 font-medium">
                Ejemplo: 100 remeras Classic Fit a $24.310 c/u = $2.431.000 total
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                Revendes a $40.000 c/u = $4.000.000 facturados → <span className="text-white font-semibold">$1.569.000 de ganancia</span>
              </p>
            </div>
          </div>
        </section>

        {/* Products grid */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Productos disponibles por mayor
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Todos los precios incluyen estampado DTG. Los precios mayoristas son con 15% OFF (100+ unidades).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <Card key={p.name} className="bg-zinc-900/50 border-zinc-800 hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs mb-3">{p.discount}</Badge>
                    <h3 className="text-lg font-semibold text-white mb-2">{p.name}</h3>
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-2xl font-bold text-amber-400">{p.wholesalePrice}</span>
                      <span className="text-sm text-zinc-500 line-through">{p.regularPrice}</span>
                    </div>
                    <div className="space-y-1 text-sm text-zinc-400">
                      <p>{p.material}</p>
                      <p className="text-amber-300/80">{p.ideal}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button
                asChild
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <Link href="/products">
                  Ver catalogo completo con talles y colores <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Como funciona la compra mayorista
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                De WhatsApp a la entrega en 4 pasos simples.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { step: "1", icon: Zap, title: "Cotiza por WhatsApp", desc: "Contanos que necesitas: productos, cantidades, y si tenes disenos o queres usar nuestra IA. Te mandamos presupuesto en minutos." },
                { step: "2", icon: Palette, title: "Manda tus disenos", desc: "Subis tus archivos o los generamos con nuestra IA (37 estilos). Aprobas los mockups antes de producir." },
                { step: "3", icon: Package, title: "Producimos con DTG", desc: "Estampamos cada prenda con tecnologia DTG. Calidad fotografica, colores ilimitados, sin setup por diseno." },
                { step: "4", icon: Truck, title: "Entrega en tu puerta", desc: `Enviamos a todo Argentina: ${shippingZonesDetailLine()}. Retiro en Villa Martelli disponible.` },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="text-sm font-mono text-amber-400 mb-2">Paso {s.step}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-zinc-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Para quien es la compra por mayor
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Desde revendedores hasta marcas en crecimiento. Si necesitas volumen, somos tu proveedor.
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
                    <p className="text-sm text-amber-400 italic">&quot;{uc.example}&quot;</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Profit calculator */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Cuanto podes ganar revendiendo
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Numeros reales. Remera Aldea Classic Fit, precio mayorista (100+ un.) $24.310.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  scenario: "Feria (50 remeras/mes)",
                  cost: "$1.287.500",
                  revenue: "$2.000.000",
                  profit: "$712.500",
                  margin: "55% margen",
                  detail: "Compras a $25.740 (10% OFF), vendes a $40.000",
                  tag: "Feria",
                },
                {
                  scenario: "Showroom (100 remeras/mes)",
                  cost: "$2.431.000",
                  revenue: "$4.000.000",
                  profit: "$1.569.000",
                  margin: "64% margen",
                  detail: "Compras a $24.310 (15% OFF), vendes a $40.000",
                  tag: "Showroom",
                },
                {
                  scenario: "Online (200+ remeras/mes)",
                  cost: "$4.862.000",
                  revenue: "$9.000.000",
                  profit: "$4.138.000",
                  margin: "85% margen",
                  detail: "Compras a $24.310 (15% OFF), vendes a $45.000",
                  tag: "Escala",
                },
              ].map((calc) => (
                <Card key={calc.scenario} className="bg-zinc-800/50 border-zinc-700 hover:border-amber-500/30 transition-all">
                  <CardContent className="p-6">
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs mb-3">{calc.tag}</Badge>
                    <h3 className="text-lg font-semibold text-white mb-4">{calc.scenario}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Costo mayorista</span>
                        <span className="text-zinc-300">{calc.cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Facturado</span>
                        <span className="text-zinc-300">{calc.revenue}</span>
                      </div>
                      <div className="border-t border-zinc-700 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-300 font-semibold">Ganancia neta</span>
                          <span className="text-amber-400 font-bold text-lg">{calc.profit}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{calc.detail}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Production times */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Tiempos de produccion
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { range: "10 — 50 unidades", time: "5-7 dias habiles", icon: Clock },
                { range: "50 — 200 unidades", time: "7-10 dias habiles", icon: Clock },
                { range: "200+ unidades", time: "10-15 dias habiles", icon: Clock },
              ].map((t) => (
                <Card key={t.range} className="bg-zinc-900/50 border-zinc-800 text-center">
                  <CardContent className="p-6">
                    <t.icon className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                    <div className="text-white font-semibold mb-1">{t.range}</div>
                    <div className="text-amber-400 font-bold text-lg">{t.time}</div>
                    <div className="text-xs text-zinc-500 mt-1">Sin contar envio</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-6 text-zinc-500 text-sm">
              Retiro en Villa Martelli, Buenos Aires disponible sin costo de envio.
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
              Clientes mayoristas nos eligen
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <Card key={t.name} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
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
              Calificacion promedio: <span className="text-white font-semibold">4.9/5</span> basado en 340+ pedidos mayoristas
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
            <Card className="bg-gradient-to-br from-amber-600/20 via-orange-500/10 to-zinc-900 border-amber-500/20">
              <CardContent className="p-8 sm:p-12 text-center">
                <Boxes className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Empeza a comprar por mayor hoy
                </h2>
                <p className="text-lg text-zinc-300 mb-8 max-w-xl mx-auto">
                  Escribinos por WhatsApp, contanos que necesitas, y te mandamos el presupuesto en minutos.
                  Desde 10 unidades con descuento. Factura A disponible.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-lg px-8 py-6"
                  >
                    <a
                      href={`https://wa.me/5492235169720?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Pedir cotizacion mayorista
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-lg px-8 py-6"
                  >
                    <Link href="/cotizador">
                      Usar cotizador online
                    </Link>
                  </Button>
                </div>

                <p className="text-sm text-zinc-500 mt-6">
                  Respondemos en menos de 1 hora en horario comercial (lun-vie 9-18hs).
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cross-sell */}
        <section className="py-12 border-t border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-zinc-500 mb-3">
              Tambien hacemos pedidos especiales para eventos, uniformes, egresados y regalos corporativos
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild variant="link" className="text-amber-400 hover:text-amber-300">
                <Link href="/remeras-para-eventos">
                  Remeras para eventos <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-amber-400 hover:text-amber-300">
                <Link href="/uniformes-personalizados">
                  Uniformes personalizados <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-amber-400 hover:text-amber-300">
                <Link href="/regalos-empresariales">
                  Regalos empresariales <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="link" className="text-amber-400 hover:text-amber-300">
                <Link href="/lanza-tu-marca">
                  Lanza tu marca <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
