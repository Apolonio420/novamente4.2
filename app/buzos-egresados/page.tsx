import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import {
  Sparkles, GraduationCap, ArrowRight, Star, Truck,
  Shield, Clock, CheckCircle2, Palette, Heart,
  Camera, PartyPopper, Flame, Music, Trophy, Shirt
} from "lucide-react"
import { PRODUCTS as CATALOG_PRODUCTS } from "@/lib/catalog"
import { SHIPPING, shippingDetailsJsonLd, RETURN_POLICY_REF } from "@/lib/shipping-config"

export const metadata: Metadata = {
  title: "Buzos de Egresados 2026 — Personalizados con IA",
  description:
    "Buzos y hoodies de egresados personalizados, con diseño incluido (con IA o el tuyo), estampado DTG y envíos a todo el país. Cotizá tu curso por WhatsApp.",
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
      "Buzos de egresados unicos con disenos generados por IA. Cada alumno con su nombre y numero. Algodon 100%, DTG premium.",
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
      "Buzos de egresados unicos con diseno IA. Cada alumno elige su nombre. Algodon 100%, DTG premium.",
  },
  alternates: { canonical: "https://www.novamente.ar/buzos-egresados" },
}

/**
 * REGLA DE PRECIOS: igual que lib/malvinas-products.ts — el precio de cada
 * modelo es SIEMPRE el precio base de lib/catalog.ts (buscado por
 * garmentType), nunca un numero hardcodeado. Si lib/catalog.ts cambia, esta
 * pagina se actualiza sola.
 */
function catalogItem(garmentType: string) {
  const item = CATALOG_PRODUCTS.find((p) => p.garmentType === garmentType)
  if (!item) {
    throw new Error(
      `[buzos-egresados] garmentType "${garmentType}" no existe en lib/catalog.ts — precio no derivable.`
    )
  }
  return item
}

export default function BuzosEgresados() {
  const boston = catalogItem("buzo-hoodie-unisex")
  const berlin = catalogItem("buzo-cuello-redondo")
  const aldea = catalogItem("aldea-classic-tshirt")
  const aura = catalogItem("aura-oversize-tshirt")
  const bali = catalogItem("musculosa-bali")

  const formatPrice = (n: number) => `$${n.toLocaleString("es-AR")}`

  const products = [
    { ...boston, displayName: "Boston", ideal: "El hoodie clásico de la promo: capucha y bolsillo canguro", badge: "Más elegido" },
    { ...berlin, displayName: "Berlin", ideal: "Buzo cuello redondo, mismo estampado, opción más abrigada", badge: "Mejor precio" },
    { ...aldea, displayName: "Aldea", ideal: "Remera classic fit para el viaje, las fotos o la fiesta", badge: null },
    { ...aura, displayName: "Aura", ideal: "Remera oversize, calce relajado y moderno", badge: null },
    { ...bali, displayName: "Bali", ideal: "Musculosa liviana para el verano o el viaje", badge: null },
  ]

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Buzos de Egresados Personalizados — Novamente",
    description:
      "Servicio de buzos y remeras de egresados personalizados con inteligencia artificial. Hoodies y buzos con nombres individuales, estampado DTG premium sobre algodon 100%. Cotizacion a medida por curso.",
    provider: { "@id": "https://www.novamente.ar/#organization" },
    serviceType: "Buzos de Egresados Personalizados",
    areaServed: {
      "@type": "Country",
      name: "Argentina",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: Math.min(...products.map((p) => p.price)),
      highPrice: Math.max(...products.map((p) => p.price)),
      priceCurrency: "ARS",
      offerCount: products.length,
      availability: "https://schema.org/InStock",
    },
  }

  // Product schema por modelo — mismo patron que app/products/[id]/page.tsx.
  // Precio SIEMPRE derivado de lib/catalog.ts (ver products arriba).
  const productsJsonLd = products.map((p) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${p.displayName} — ${p.name} de Egresados`,
    description: `${p.name} personalizado para promos de egresados. ${p.ideal}. Estampado DTG, produccion propia en Argentina.`,
    image: [`https://www.novamente.ar${p.image}`],
    brand: { "@type": "Brand", name: "Novamente" },
    material: "Algodon 100%",
    category: p.category,
    offers: {
      "@type": "Offer",
      url: "https://www.novamente.ar/buzos-egresados",
      priceCurrency: "ARS",
      price: p.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      priceValidUntil: "2026-12-31",
      seller: { "@id": "https://www.novamente.ar/#organization" },
      shippingDetails: shippingDetailsJsonLd(),
      hasMerchantReturnPolicy: RETURN_POLICY_REF,
    },
  }))

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cuanto cuestan los buzos de egresados?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `El Hoodie Boston (con capucha) arranca en ${formatPrice(boston.price)} y el Buzo Berlin (cuello redondo) en ${formatPrice(berlin.price)}, precio de lista por unidad. Para pedidos de curso armamos una cotizacion a medida segun cantidad de alumnos y modelos elegidos — la coordinas con tu asesor por WhatsApp.`,
        },
      },
      {
        "@type": "Question",
        name: "Que talles tienen disponibles?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Boston y Berlin van de talle XS a 2XL; las remeras Aldea y Aura tienen su propia tabla de talles. Antes de producir coordinamos el talle de cada alumno para que le quede perfecto. Descargas la guia de talles completa en PDF desde la web.",
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
          text: "Produccion de 5 a 7 dias habiles para pedidos de curso (20 a 50 unidades), mas el envio. Para el acto o el viaje de egresados recomendamos pedir con anticipacion.",
        },
      },
      {
        "@type": "Question",
        name: "Hay un minimo de unidades para pedir?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No hay minimo estricto: podes arrancar con pocas unidades y sumar mas alumnos despues. Como cada prenda se produce individualmente con DTG, no hace falta completar un lote minimo de disenos iguales.",
        },
      },
      {
        "@type": "Question",
        name: "Como cotizo el pedido de mi curso?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Escribinos por WhatsApp con el colegio, la cantidad aproximada de alumnos y el modelo que les interesa (Boston, Berlin o ambos). Te armamos una propuesta con muestra digital gratuita antes de producir.",
        },
      },
      {
        "@type": "Question",
        name: "Como es la forma de pago?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Coordinas el pago con tu asesor por WhatsApp: transferencia bancaria o link de Mercado Pago. Para pedidos grandes de curso se puede coordinar el pago en partes para arrancar la produccion — consulta las condiciones con tu asesor.",
        },
      },
      {
        "@type": "Question",
        name: "Hacen envios a todo el pais? Cuanto cuesta?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Si. El envio a CABA/GBA sale ${formatPrice(SHIPPING.BA)} y al resto del pais ${formatPrice(SHIPPING.RESTO)}, con envio gratis en pedidos desde ${formatPrice(SHIPPING.FREE_THRESHOLD)} — la mayoria de los pedidos de curso lo supera.`,
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
      example: "Hoodie Boston con diseno artistico generado por IA",
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

  const processSteps = [
    { step: "1", icon: Sparkles, title: "Diseño", desc: "Contanos el concepto de la promo. Con IA generamos opciones originales, o usamos el diseño que ya tengan." },
    { step: "2", icon: Palette, title: "Mockup gratis", desc: "Armamos una muestra digital para aprobar, con nombres/apodos y talles de cada alumno." },
    { step: "3", icon: Shirt, title: "Producción", desc: "Estampamos cada buzo individualmente con DTG. 5-7 días hábiles para pedidos de curso." },
    { step: "4", icon: Truck, title: "Envío", desc: `A domicilio o al colegio, a todo el país. Gratis desde ${formatPrice(SHIPPING.FREE_THRESHOLD)}.` },
  ]

  const whatsappMessage = encodeURIComponent(
    "Hola! Quiero cotizar buzos de egresados para mi curso 🎓 (ref · NV-EGR2026)"
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      {productsJsonLd.map((pjld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pjld) }}
        />
      ))}
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
                y cada alumno lleva su nombre. Hoodie Boston desde{" "}
                <span className="text-white font-semibold">{formatPrice(boston.price)}</span>, Buzo Berlin desde{" "}
                <span className="text-white font-semibold">{formatPrice(berlin.price)}</span>.
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
                    data-cta="hero-buzos-egresados"
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
                  <Link href="/crear">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {processSteps.map((s) => (
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
                Algodon 100% premium, precio de lista por unidad. Cotizacion a medida para tu curso por WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.displayName} className="bg-zinc-900/50 border-zinc-800 hover:border-cyan-500/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{product.displayName} <span className="text-zinc-500 font-normal text-sm">— {product.name}</span></h3>
                      {product.badge && (
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-cyan-400 mb-2">
                      {formatPrice(product.price)}
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

        {/* Cotizacion por volumen */}
        <section className="py-16 sm:py-20 bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Cotizacion a medida para tu curso
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Cada promo es distinta: cantidad de alumnos, modelos y talles varian. Mandanos esos datos por
                WhatsApp y te armamos una propuesta de precio por unidad ajustada a tu pedido, sin vueltas.
              </p>
            </div>

            <div className="text-center mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl max-w-2xl mx-auto">
              <p className="text-cyan-300 font-medium">
                Ejemplo de referencia: 30 Hoodies Boston
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                30 x {formatPrice(boston.price)} = <span className="text-white font-semibold">{formatPrice(30 * boston.price)}</span> a precio de lista
                (el precio final para tu curso se cotiza por WhatsApp)
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
              {[
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
              ].map((t) => (
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
                      data-cta="final-cta-buzos-egresados"
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
                    <Link href="/crear">
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
