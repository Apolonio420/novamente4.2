import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SITE_STATS } from "@/lib/site-stats"
import {
  Sparkles, Building2, Users, ArrowRight, Star, Truck,
  Shield, Clock, CheckCircle2, Zap, Package, Palette,
  Gift, BadgePercent, Shirt, HeartHandshake
} from "lucide-react"

export const metadata: Metadata = {
  title: "Regalos Empresariales Personalizados con IA — Remeras y Hoodies Corporativos",
  description:
    "Regalos empresariales personalizados con inteligencia artificial. Remeras corporativas desde $28.600, hoodies desde $43.000. Estampado DTG premium, algodon 100%, descuentos por cantidad. Ideal para eventos, onboarding, team building y regalos corporativos.",
  keywords: [
    "regalos empresariales personalizados",
    "remeras corporativas argentina",
    "merchandising empresarial",
    "regalos corporativos personalizados",
    "indumentaria corporativa",
    "remeras para empresas",
    "hoodies corporativos",
    "regalos de empresa",
    "merchandising para eventos",
    "uniformes personalizados argentina",
    "regalos para empleados",
    "team building indumentaria",
  ],
  openGraph: {
    title: "Regalos Empresariales Personalizados con IA — Novamente",
    description:
      "Merchandising corporativo con diseno IA. Remeras desde $28.600, hoodies desde $43.000. Descuentos por cantidad. Algodon 100%, DTG premium.",
    url: "https://www.novamente.ar/regalos-empresariales",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/marketing/lifestyle/hero-subte-cinematic.webp",
        width: 1600,
        height: 900,
        alt: "Regalos empresariales personalizados con IA — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Regalos Empresariales Personalizados con IA — Novamente",
    description:
      "Merchandising corporativo unico. Remeras y hoodies con diseno IA, DTG premium. Descuentos desde 10 unidades.",
  },
  alternates: { canonical: "https://www.novamente.ar/regalos-empresariales" },
}

export default function RegalosEmpresariales() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Regalos Empresariales Personalizados — Novamente",
    description:
      "Servicio de indumentaria corporativa personalizada con inteligencia artificial. Remeras, hoodies y buzos con estampado DTG premium para empresas, eventos y equipos.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Merchandising Corporativo",
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
        name: "Cual es el minimo de unidades para pedidos corporativos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No hay minimo de unidades. Podes pedir desde 1 prenda. Sin embargo, ofrecemos descuentos por cantidad: 5% en 10-24 unidades, 10% en 25-49 unidades, 15% en 50-99 unidades y precios especiales para 100+ unidades.",
        },
      },
      {
        "@type": "Question",
        name: "Pueden estampar el logo de mi empresa?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, podemos estampar tu logo corporativo tal cual es, o podemos usar nuestra IA para generar disenos creativos que incorporen la identidad visual de tu marca. Envianos tu logo por WhatsApp y armamos la propuesta.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tiempo demora un pedido corporativo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "El tiempo de produccion es de 3-5 dias habiles para pedidos de hasta 50 unidades, y 5-10 dias habiles para pedidos mayores. A eso se suma 3-7 dias de envio segun la zona. Para eventos con fecha fija, recomendamos pedir con 15 dias de anticipacion.",
        },
      },
      {
        "@type": "Question",
        name: "Ofrecen factura para empresas?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, emitimos factura A o B segun la situacion fiscal de tu empresa. Tambien aceptamos ordenes de compra y ofrecemos condiciones de pago especiales para pedidos grandes (transferencia bancaria con 50% de anticipo).",
        },
      },
      {
        "@type": "Question",
        name: "Que productos estan disponibles para regalos empresariales?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ofrecemos remeras (Classic Fit desde $28.600, Oversize desde $31.000), hoodies (desde $43.000 hasta $55.000), buzos cuello redondo ($43.000), musculosas ($21.800), remeras crop ($23.500) y lienzos decorativos ($59.900). Todos en algodon 100% con estampado DTG premium.",
        },
      },
      {
        "@type": "Question",
        name: "Hacen envios a todo el pais para pedidos corporativos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, realizamos envios a toda la Argentina. Para pedidos corporativos de 25+ unidades, el envio es bonificado dentro de AMBA. Envios regulares: AMBA $5.500, Interior BA $7.000, resto del pais $9.000.",
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
        name: "Regalos Empresariales",
        item: "https://www.novamente.ar/regalos-empresariales",
      },
    ],
  }

  const useCases = [
    {
      icon: Gift,
      title: "Regalos de fin de ano",
      description: "Sorprende a tu equipo con prendas unicas personalizadas con IA. Cada persona puede tener un diseno diferente.",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      icon: Users,
      title: "Onboarding de empleados",
      description: "Kit de bienvenida con remera o hoodie de la empresa. Primera impresion memorable para nuevos integrantes.",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: Sparkles,
      title: "Eventos y conferencias",
      description: "Merchandising para stands, speakers y asistentes. Disenos exclusivos que no se repiten.",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      icon: HeartHandshake,
      title: "Team building",
      description: "Prendas para equipos, areas o proyectos especiales. Fortalece la identidad del grupo.",
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      icon: Building2,
      title: "Clientes VIP",
      description: "Regalos corporativos premium para cerrar deals o fidelizar clientes. Hoodies de alta gama con tu marca.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Zap,
      title: "Lanzamientos de producto",
      description: "Merch exclusivo para lanzamientos, betas o early adopters. Genera hype con prendas unicas.",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
  ]

  const pricingTiers = [
    {
      range: "1 - 9 unidades",
      discount: "Precio regular",
      example: "Remera $28.600 · Hoodie $43.000",
      tag: null,
    },
    {
      range: "10 - 24 unidades",
      discount: "5% OFF",
      example: "Remera $27.170 · Hoodie $40.850",
      tag: null,
    },
    {
      range: "25 - 49 unidades",
      discount: "10% OFF",
      example: "Remera $25.740 · Hoodie $38.700",
      tag: "Popular",
    },
    {
      range: "50 - 99 unidades",
      discount: "15% OFF",
      example: "Remera $24.310 · Hoodie $36.550",
      tag: "Mejor valor",
    },
    {
      range: "100+ unidades",
      discount: "Cotizacion especial",
      example: "Contactanos para precio mayorista",
      tag: "Empresas",
    },
  ]

  return (
    <div>
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

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center bg-novamente-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/15 via-transparent to-orange-500/15 opacity-40" />

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-amber-500/20 text-amber-400 border-amber-500/30 text-sm px-4 py-1.5">
                <Building2 className="w-3.5 h-3.5 mr-1.5" />
                Merchandising Corporativo
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight mb-6 leading-[1.1]">
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Regalos Empresariales</span>
                <br />
                <span className="text-white/90">Personalizados con IA</span>
              </h1>

              <p className="text-lg md:text-xl text-white/70 mb-8 max-w-lg leading-relaxed" data-speakable>
                Indumentaria corporativa unica para tu empresa. Disenos generados con IA,
                estampado DTG premium sobre algodon 100%. Descuentos por cantidad desde 10 unidades.
              </p>

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl md:text-4xl font-bold text-white">Desde $28.600</span>
                <span className="text-white/50 text-lg">por unidad</span>
              </div>
              <p className="text-amber-400/80 text-sm mb-8 flex items-center gap-1.5">
                <BadgePercent className="w-4 h-4" />
                Hasta 15% de descuento en pedidos de 50+ unidades
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Quiero%20cotizar%20regalos%20empresariales%20personalizados.%20Somos%20%5Bnombre%20empresa%5D%20y%20necesitamos%20%5Bcantidad%5D%20unidades.%20(ref%20%C2%B7%20NV-EMP-HERO)" data-cta="hero-regalos-empresariales">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90 text-white font-medium rounded-xl py-6 px-8 text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    <Package className="w-5 h-5 mr-2" />
                    Cotizar Pedido Corporativo
                  </Button>
                </Link>
                <Link href="/products">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 bg-transparent py-6 px-8 text-lg"
                  >
                    <Shirt className="w-5 h-5 mr-2" />
                    Ver Catalogo
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-green-400" />
                  Factura A y B
                </span>
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-400" />
                  Envio bonificado 25+ un.
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {SITE_STATS.averageRating} en corporativo
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-amber-500/25 via-orange-500/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950 shadow-2xl">
                <Image
                  src="/marketing/lifestyle/hero-subte-cinematic.webp"
                  alt="Kit de merch corporativo con hoodie, remeras, tote bag y packaging para empresas"
                  width={1600}
                  height={900}
                  priority
                  className="aspect-[16/10] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-5">
                  <p className="text-sm font-medium text-white">Merch corporativo listo para entregar</p>
                  <p className="text-xs text-white/70">Kits, onboarding, eventos, clientes VIP y reventa B2B</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
              PARA CADA OCASION CORPORATIVA
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Indumentaria personalizada que genera impacto en tu equipo y clientes.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {useCases.map((uc) => (
              <Card key={uc.title} className="border-2 hover:border-amber-500/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 ${uc.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <uc.icon className={`w-7 h-7 ${uc.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{uc.title}</h3>
                  <p className="text-sm text-muted-foreground">{uc.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
              DESCUENTOS POR CANTIDAD
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Cuanto mas pedis, menos pagas. Sin minimos obligatorios.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.range}
                className={`text-center border-2 transition-all duration-300 hover:shadow-lg ${
                  tier.tag === "Mejor valor"
                    ? "border-amber-500/50 shadow-amber-500/20 shadow-lg scale-[1.02]"
                    : "hover:border-amber-500/30"
                }`}
              >
                <CardContent className="p-5">
                  {tier.tag && (
                    <Badge className={`mb-3 text-xs ${
                      tier.tag === "Mejor valor"
                        ? "bg-amber-500 text-white"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    }`}>
                      {tier.tag}
                    </Badge>
                  )}
                  <p className="text-sm font-medium text-white/60 mb-1">{tier.range}</p>
                  <p className="text-xl font-bold text-amber-400 mb-2">{tier.discount}</p>
                  <p className="text-xs text-muted-foreground">{tier.example}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Precios en ARS. Incluyen diseno + estampado DTG. Envio bonificado en AMBA para 25+ unidades.
            </p>
          </div>
        </div>
      </section>

      {/* Products for corporates */}
      <section className="py-16 md:py-24 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
              PRENDAS DISPONIBLES
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Algodon 100% premium en todos los modelos. Estampado DTG que dura.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Remera Classic Fit",
                price: "Desde $28.600",
                desc: "Corte clasico, algodon peinado. Ideal para grandes cantidades.",
                img: "/products/tshirt-aldea-blanco-front.jpeg",
                colors: "Blanco, Negro",
                badge: "Mas pedida",
              },
              {
                name: "Remera Oversize",
                price: "Desde $31.000",
                desc: "Fit moderno y relajado. Tendencia urban para equipos jovenes.",
                img: "/products/aura-tshirt-blanco-front.jpeg",
                colors: "Blanco, Negro",
                badge: null,
              },
              {
                name: "Buzo Hoodie Oversize",
                price: "Desde $55.000",
                desc: "Premium con frisa interior. Regalo corporativo de alto impacto.",
                img: "/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png",
                colors: "Negro, Crema, Marron, Gris",
                badge: "Premium",
              },
              {
                name: "Buzo Hoodie Oversize",
                price: "Desde $55.000",
                desc: "Hoodie oversize con capucha y bolsillo canguro. Clasico y versatil.",
                img: "/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png",
                colors: "Negro, Gris, Crema",
                badge: null,
              },
              {
                name: "Buzo Cuello Redondo",
                price: "Desde $43.000",
                desc: "Crewneck oversize sin capucha. Elegante para oficina.",
                img: "/products/buzo-cuello-redondo-negro-front.jpeg",
                colors: "Negro, Crema, Gris",
                badge: "Oficina",
              },
              {
                name: "Musculosa",
                price: "Desde $21.800",
                desc: "Liviana y comoda. Ideal para eventos outdoor o gym corporativo.",
                img: "/products/musculosa-bali-blanca-front.jpeg",
                colors: "Blanca, Negra, Crema",
                badge: null,
              },
            ].map((p) => (
              <Card key={p.name} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-amber-500/20">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={p.img}
                    alt={`${p.name} para regalos empresariales — algodon 100% DTG`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {p.badge && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-amber-500/90 text-white text-xs">{p.badge}</Badge>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-foreground font-bold px-2 py-1">
                      {p.price}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold mb-1">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{p.desc}</p>
                  <p className="text-xs text-white/50">Colores: {p.colors}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/products">
              <Button variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                Ver catalogo completo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 md:py-20 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-2xl font-semibold mb-2">{SITE_STATS.averageRating} en pedidos corporativos</p>
            <p className="text-muted-foreground">
              Empresas de toda Argentina confian en Novamente para su merchandising
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-white/80 mb-4">
                  &ldquo;Pedimos 50 hoodies para el offsite anual y la calidad fue impresionante. El equipo de Novamente nos ayudo con el diseno y la entrega fue puntual. Ya estamos armando el segundo pedido.&rdquo;
                </p>
                <p className="text-sm font-semibold">Santiago M. — CTO, Startup SaaS</p>
              </CardContent>
            </Card>

            <Card className="border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-white/80 mb-4">
                  &ldquo;Usamos el servicio para regalos de fin de ano a nuestros 30 empleados. Cada remera tenia un diseno diferente con IA y a todos les encanto. Cero estrés, nos manejaron todo.&rdquo;
                </p>
                <p className="text-sm font-semibold">Laura P. — RRHH, Agencia Digital</p>
              </CardContent>
            </Card>

            <Card className="border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-white/80 mb-4">
                  &ldquo;Compramos 25 remeras para el stand de una expo y fueron un hit. Facturaron con Factura A sin drama. La calidad DTG es superior a cualquier serigrafia que usamos antes.&rdquo;
                </p>
                <p className="text-sm font-semibold">Federico R. — Marketing, Fintech</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
              PREGUNTAS FRECUENTES — REGALOS EMPRESARIALES
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "Cual es el minimo de unidades?",
                a: "No hay minimo. Podes pedir desde 1 prenda. Ofrecemos descuentos por cantidad: 5% (10-24 un.), 10% (25-49 un.), 15% (50-99 un.) y precio especial para 100+.",
              },
              {
                q: "Pueden estampar el logo de mi empresa?",
                a: "Si, estampamos tu logo tal cual o podemos generar disenos creativos con IA que incorporen tu identidad visual. Envianos el logo por WhatsApp y armamos la propuesta.",
              },
              {
                q: "Cuanto demora un pedido corporativo?",
                a: "3-5 dias habiles de produccion para hasta 50 unidades, 5-10 dias para pedidos mayores. Suma 3-7 dias de envio. Para eventos, recomendamos 15 dias de anticipacion.",
              },
              {
                q: "Emiten factura para empresas?",
                a: "Si, emitimos Factura A y B. Aceptamos ordenes de compra y ofrecemos condiciones de pago especiales (transferencia con 50% de anticipo) para pedidos grandes.",
              },
              {
                q: "Pueden enviar a diferentes direcciones?",
                a: "Si, podemos hacer envios individuales a diferentes domicilios (ideal para equipos remotos). Cada envio se cotiza por separado. Envio bonificado AMBA para 25+ unidades.",
              },
              {
                q: "Como es la calidad del estampado?",
                a: "Usamos estampado DTG (Direct to Garment) sobre algodon 100%. Es la tecnologia de mayor calidad: colores vibrantes, alta definicion y durabilidad profesional. Superior a serigrafia en detalle.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group border border-white/10 rounded-xl p-5 hover:border-amber-500/30 transition-colors"
              >
                <summary className="text-base font-semibold cursor-pointer list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-amber-400 group-open:rotate-45 transition-transform text-2xl ml-4 shrink-0">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
            COTIZA TUS REGALOS EMPRESARIALES
          </h2>
          <p className="text-xl mb-4 max-w-2xl mx-auto opacity-90">
            Contactanos y en 24hs te enviamos una propuesta personalizada con precios, mockups y tiempos de entrega.
          </p>
          <p className="text-lg mb-8 opacity-70">
            Desde $28.600/un. · Descuentos por cantidad · Factura A/B · Envios a todo el pais
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Quiero%20cotizar%20regalos%20empresariales%20personalizados.%20Somos%20%5Bnombre%20empresa%5D%20y%20necesitamos%20%5Bcantidad%5D%20unidades%20para%20%5Bocasion%5D.%20(ref%20%C2%B7%20NV-EMP-FINAL)" data-cta="final-cta-regalos-empresariales">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-amber-700 hover:bg-white/90 font-medium rounded-xl py-6 px-10 text-lg shadow-lg"
              >
                <Package className="w-5 h-5 mr-2" />
                Cotizar por WhatsApp
              </Button>
            </Link>
            <Link href="/crear">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white/20 bg-transparent py-6 px-10 text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Probar el Generador IA
              </Button>
            </Link>
          </div>

          <div className="flex justify-center gap-8 mt-10 text-sm opacity-70">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Propuesta en 24hs
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Factura A/B
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              Envio bonificado 25+ un.
            </span>
          </div>
        </div>
      </section>

      {/* Partners CTA */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4">
            Sos una agencia o revendedor que necesita merch para sus clientes?
          </p>
          <Link href="/partners">
            <Button variant="outline" className="border-white/20 text-white/80 hover:bg-white/10">
              Conoce nuestro Programa Partners B2B
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
