import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles, ArrowRight, Star, CheckCircle2, Lightbulb, TrendingUp,
  ShieldCheck, Palette, Shirt, DollarSign, Rocket, Users,
  Clock, Package, Zap, BookOpen
} from "lucide-react"

export const metadata: Metadata = {
  title: "Como crear merch personalizado sin inversion inicial — Guia completa 2026",
  description:
    "Guia paso a paso para crear y vender merch personalizado sin invertir un peso. Aprende el modelo print-on-demand con IA, como elegir productos, fijar precios y generar tu primera venta en Argentina.",
  keywords: [
    "crear merch sin inversion",
    "merch personalizado argentina",
    "vender remeras personalizadas",
    "print on demand argentina",
    "negocio de remeras",
    "emprender con merch",
    "merch con inteligencia artificial",
    "como hacer merch",
    "vender ropa personalizada",
    "negocio sin inversion",
    "emprendimiento ropa argentina",
    "merch dropshipping argentina",
  ],
  openGraph: {
    title: "Como crear merch personalizado sin inversion — Guia 2026",
    description:
      "Todo lo que necesitas saber para empezar tu negocio de merch personalizado sin invertir. Modelo print-on-demand con IA.",
    url: "https://www.novamente.ar/blog/como-crear-merch-sin-inversion",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Como crear merch sin inversion — Guia completa",
    description:
      "Aprende a crear y vender merch personalizado sin invertir un peso. Print-on-demand con IA en Argentina.",
  },
  alternates: { canonical: "https://www.novamente.ar/blog/como-crear-merch-sin-inversion" },
}

const faqItems = [
  {
    question: "Necesito capital inicial para empezar a vender merch?",
    answer:
      "No. Con el modelo print-on-demand de Novamente, no necesitas invertir en stock, maquinaria ni materiales. Creas los disenos con IA gratis, y cada prenda se produce solo cuando un cliente la compra. Tu unica inversion es tu tiempo y creatividad.",
  },
  {
    question: "Cuanto puedo ganar vendiendo merch personalizado?",
    answer:
      "Los margenes en merch personalizado van del 40% al 80%. Por ejemplo, una remera que cuesta $28.600 la podes vender a $45.000-$50.000 (ganancia de $16.400-$21.400). Un hoodie de $43.000 se vende facilmente a $75.000 (ganancia de $32.000). Con 10 ventas mensuales ya tenes un ingreso extra significativo.",
  },
  {
    question: "Necesito saber disenar para crear merch?",
    answer:
      "No. La IA de Novamente genera disenos profesionales a partir de descripciones en texto. Solo tenes que describir lo que queres (por ejemplo: 'un lobo geometrico en estilo cyberpunk') y la IA crea el diseno en segundos. Hay 37 estilos artisticos para elegir.",
  },
  {
    question: "Como es el proceso de produccion y envio?",
    answer:
      "Cada prenda se produce bajo demanda con estampado DTG (Direct to Garment) de calidad premium sobre algodon 100%. La produccion tarda 3-5 dias habiles y el envio llega a todo el pais en 2-5 dias adicionales. El cliente recibe tracking en todo momento.",
  },
  {
    question: "Puedo crear mi propia marca de ropa con esto?",
    answer:
      "Si. Con el programa Partners de Novamente podes crear tu marca completa: tu propio storefront online, catalogo personalizado, disenos exclusivos con IA, y vender con tu identidad de marca. Nosotros nos encargamos de la produccion y el envio.",
  },
  {
    question: "Que pasa si un cliente quiere devolver una prenda?",
    answer:
      "Novamente ofrece devolucion gratuita dentro de los 10 dias. Si la prenda tiene un defecto de produccion, se reemplaza sin costo. El cliente puede iniciar la devolucion facilmente y recibe reembolso completo.",
  },
]

export default function BlogComoCrearMerch() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Como crear merch personalizado sin inversion inicial — Guia completa 2026",
    description:
      "Guia paso a paso para crear y vender merch personalizado sin invertir un peso. Modelo print-on-demand con IA en Argentina.",
    author: {
      "@type": "Organization",
      name: "Novamente",
      url: "https://www.novamente.ar",
    },
    publisher: {
      "@type": "Organization",
      name: "Novamente",
      url: "https://www.novamente.ar",
      logo: {
        "@type": "ImageObject",
        url: "https://www.novamente.ar/novamente-logo.png",
      },
    },
    datePublished: "2026-03-21",
    dateModified: "2026-03-21",
    mainEntityOfPage: "https://www.novamente.ar/blog/como-crear-merch-sin-inversion",
    image: "https://www.novamente.ar/novamente-logo.png",
    articleSection: "Emprendimiento",
    wordCount: 2200,
    inLanguage: "es-AR",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", "[data-speakable]"],
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
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
        name: "Blog",
        item: "https://www.novamente.ar/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Como crear merch sin inversion",
        item: "https://www.novamente.ar/blog/como-crear-merch-sin-inversion",
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
        {/* Breadcrumb */}
        <nav className="max-w-4xl mx-auto px-4 pt-6 pb-2">
          <ol className="flex items-center gap-2 text-sm text-zinc-400">
            <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
            <li>/</li>
            <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            <li>/</li>
            <li className="text-zinc-200">Como crear merch sin inversion</li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              <BookOpen className="w-3 h-3 mr-1" />
              Guia completa
            </Badge>
            <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">
              12 min de lectura
            </Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6" data-speakable>
            Como crear merch personalizado sin inversion inicial
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 leading-relaxed max-w-3xl" data-speakable>
            La guia definitiva para emprendedores que quieren vender ropa personalizada sin arriesgar capital.
            Aprende el modelo print-on-demand con inteligencia artificial, paso a paso.
          </p>
          <div className="flex items-center gap-4 mt-6 text-sm text-zinc-400">
            <span>Por <strong className="text-zinc-200">Equipo Novamente</strong></span>
            <span>·</span>
            <time dateTime="2026-03-21">21 de marzo, 2026</time>
          </div>
        </header>

        {/* Article Body */}
        <article className="max-w-4xl mx-auto px-4 pb-20">
          {/* Intro */}
          <section className="prose-section mb-12">
            <p className="text-zinc-300 text-lg leading-relaxed" data-speakable>
              Empezar un negocio de ropa siempre parecio algo que requeria una inversion grande: comprar telas,
              conseguir una estampadora, tener stock, alquilar un deposito. En 2026, todo eso cambio. Con el modelo
              <strong className="text-white"> print-on-demand</strong> (impresion bajo demanda) y la ayuda de la
              <strong className="text-white"> inteligencia artificial</strong>, podes crear y vender merch
              personalizado sin invertir un solo peso en stock o equipamiento.
            </p>
            <p className="text-zinc-300 text-lg leading-relaxed mt-4">
              En esta guia te explicamos exactamente como funciona, cuanto podes ganar, y como arrancar hoy mismo
              desde Argentina.
            </p>
          </section>

          {/* Section 1: Que es el modelo print-on-demand */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3">
              <Package className="w-7 h-7 text-violet-400" />
              Que es el print-on-demand (y por que cambia todo)
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              El <strong className="text-white">print-on-demand</strong> (POD) es un modelo de negocio donde cada
              producto se fabrica solo cuando alguien lo compra. No necesitas comprar 100 remeras para empezar: se
              produce de a una, con tu diseno, y se envia directamente al cliente.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-5">
                  <DollarSign className="w-8 h-8 text-green-400 mb-3" />
                  <h3 className="font-semibold text-white mb-2">Sin inversion inicial</h3>
                  <p className="text-zinc-400 text-sm">No compras stock. Cada prenda se produce cuando se vende. Tu riesgo financiero es cero.</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-5">
                  <Package className="w-8 h-8 text-blue-400 mb-3" />
                  <h3 className="font-semibold text-white mb-2">Sin logistica</h3>
                  <p className="text-zinc-400 text-sm">No manejas envios ni deposito. Novamente produce, empaca y envia por vos.</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-5">
                  <TrendingUp className="w-8 h-8 text-violet-400 mb-3" />
                  <h3 className="font-semibold text-white mb-2">Escala sin limite</h3>
                  <p className="text-zinc-400 text-sm">Vendes 1 o 1.000 unidades con el mismo esfuerzo. La produccion escala automaticamente.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 2: Por que IA cambia el juego */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-violet-400" />
              Por que la inteligencia artificial cambia el juego
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Antes, necesitabas ser disenador grafico (o pagarle a uno) para tener disenos que la gente quiera usar.
              Hoy, la IA genera disenos profesionales en segundos a partir de una descripcion en texto.
            </p>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Novamente usa inteligencia artificial para que cualquier persona — sin experiencia en diseno — pueda
              crear estampas unicas y profesionales. Solo tenes que describir lo que queres:
            </p>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 my-6">
              <p className="text-zinc-400 text-sm mb-2">Ejemplo de prompt:</p>
              <p className="text-white italic text-lg">&quot;Un lobo aullando a la luna, estilo geometrico low-poly, con colores neon sobre fondo oscuro&quot;</p>
              <p className="text-zinc-400 text-sm mt-3">La IA genera un diseno listo para estampar en menos de 30 segundos, con 37 estilos artisticos para elegir.</p>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              Esto significa que tu catalogo puede tener decenas o cientos de disenos originales sin pagarle a nadie.
              Cada diseno es unico — no lo vas a encontrar en otra tienda.
            </p>
          </section>

          {/* Section 3: Paso a paso */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
              <Rocket className="w-7 h-7 text-violet-400" />
              Paso a paso: como empezar tu negocio de merch hoy
            </h2>

            {/* Step 1 */}
            <div className="border-l-2 border-violet-500/50 pl-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 font-bold flex items-center justify-center text-sm">1</span>
                <h3 className="text-xl font-semibold">Defini tu nicho y audiencia</h3>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-3">
                El error mas comun de los emprendedores de merch es querer venderle a todo el mundo. Elegi un nicho
                especifico: puede ser una comunidad (gamers, runners, programadores), un estilo (streetwear, minimalista,
                dark), o una causa (ecologia, feminismo, arte local).
              </p>
              <p className="text-zinc-300 leading-relaxed">
                Cuanto mas especifico sea tu nicho, mas facil es que la gente sienta que el producto &quot;es para ellos&quot;.
                Un diseno generico no vende. Un diseno que habla el idioma de una comunidad, si.
              </p>
            </div>

            {/* Step 2 */}
            <div className="border-l-2 border-violet-500/50 pl-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 font-bold flex items-center justify-center text-sm">2</span>
                <h3 className="text-xl font-semibold">Crea tus disenos con IA</h3>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-3">
                Entra al <Link href="/design" className="text-violet-400 hover:text-violet-300 underline">generador de disenos de Novamente</Link> y
                empeza a experimentar. Proba diferentes estilos, combinaciones de colores y conceptos.
              </p>
              <ul className="space-y-2 text-zinc-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">37 estilos artisticos</strong>: desde acuarela y pixel art hasta cyberpunk y art nouveau</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">Ilimitados disenos</strong>: genera todos los que quieras hasta encontrar los que te convenzan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">Vista previa en mockup</strong>: ve como queda el diseno aplicado en la prenda antes de vender</span>
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="border-l-2 border-violet-500/50 pl-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 font-bold flex items-center justify-center text-sm">3</span>
                <h3 className="text-xl font-semibold">Elegi tus productos</h3>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-3">
                Novamente ofrece mas de 10 tipos de prendas para estampar. Las mas populares para empezar:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white">Remera Aldea Classic Fit</h4>
                        <p className="text-zinc-400 text-sm mt-1">Algodon 100%, ideal para empezar</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">$28.600</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white">Remera Aura Oversize</h4>
                        <p className="text-zinc-400 text-sm mt-1">Corte oversize, tendencia 2026</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">$31.000</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white">Hoodie Cuello Redondo</h4>
                        <p className="text-zinc-400 text-sm mt-1">Mayor margen, popular en invierno</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">$43.000</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white">Buzo Hoodie Oversize</h4>
                        <p className="text-zinc-400 text-sm mt-1">Premium, el producto con mas margen</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">$60.000</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 4 */}
            <div className="border-l-2 border-violet-500/50 pl-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 font-bold flex items-center justify-center text-sm">4</span>
                <h3 className="text-xl font-semibold">Fija tus precios (y entiende el margen)</h3>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-4">
                La regla general en merch personalizado es apuntar a un <strong className="text-white">margen del 50-80%</strong>.
                Esto es posible porque el valor percibido de una prenda personalizada es mucho mayor que una generica.
              </p>
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
                <h4 className="font-semibold text-green-300 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Ejemplo de margenes reales
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-300">Remera Classic ($28.600) → Precio sugerido $45.000-$50.000</span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">+$16.400-$21.400</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-300">Remera Oversize ($31.000) → Precio sugerido $50.000-$55.000</span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">+$19.000-$24.000</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-300">Hoodie ($43.000) → Precio sugerido $70.000-$80.000</span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">+$27.000-$37.000</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-300">Buzo Hoodie ($60.000) → Precio sugerido $95.000-$110.000</span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">+$35.000-$50.000</Badge>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm mt-4">
                  Con solo 10 ventas de hoodies al mes ya estarias generando $270.000-$370.000 de ganancia neta.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="border-l-2 border-violet-500/50 pl-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 font-bold flex items-center justify-center text-sm">5</span>
                <h3 className="text-xl font-semibold">Arma tu tienda y empeza a vender</h3>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-3">
                Tenes varias opciones para vender tu merch:
              </p>
              <ul className="space-y-3 text-zinc-300">
                <li className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-white">Storefront de Novamente Partners</strong> — Tu tienda online propia, lista para vender,
                    sin necesidad de configurar hosting ni dominio. <Link href="/partners" className="text-violet-400 hover:text-violet-300 underline">Mas info aca</Link>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-white">Instagram / TikTok</strong> — Publica tus mockups en redes y redirige a tu storefront o WhatsApp para cerrar la venta.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-white">MercadoLibre</strong> — Podes publicar tus disenos como productos personalizados.
                    El cliente paga ahi y vos haces el pedido en Novamente.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-white">WhatsApp Business</strong> — El canal mas directo en Argentina. Comparti tu catalogo por WhatsApp y cobra con link de MercadoPago.
                  </span>
                </li>
              </ul>
            </div>

            {/* Step 6 */}
            <div className="border-l-2 border-violet-500/50 pl-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 font-bold flex items-center justify-center text-sm">6</span>
                <h3 className="text-xl font-semibold">Escala con el programa Partners</h3>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-3">
                Cuando ya tengas tus primeras ventas y quieras profesionalizar tu marca, el
                programa <Link href="/partners" className="text-violet-400 hover:text-violet-300 underline">Novamente Partners</Link> te
                da todo lo que necesitas:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-start gap-3">
                  <Palette className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Tu propia identidad de marca (logo, colores, nombre)</span>
                </div>
                <div className="flex items-start gap-3">
                  <Shirt className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Catalogo de productos personalizado</span>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Motor de diseno con IA ilimitado</span>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Storefront online con dominio propio</span>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Dashboard de ventas y analytics</span>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                  <span className="text-zinc-300">Soporte prioritario y asesoria</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section: 5 errores comunes */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
              <Lightbulb className="w-7 h-7 text-yellow-400" />
              5 errores que evitar al empezar con merch
            </h2>
            <div className="space-y-4">
              {[
                {
                  num: 1,
                  title: "Querer gustarle a todos",
                  text: "Elegi un nicho. Un diseno que le habla a 'todo el mundo' no le habla a nadie en particular. Los mejores emprendedores de merch son los que entienden profundamente a una comunidad.",
                },
                {
                  num: 2,
                  title: "Comprar stock antes de validar",
                  text: "Ese es el punto del print-on-demand: no necesitas stock. Valida tu idea vendiendo 5-10 unidades antes de pensar en comprar al por mayor.",
                },
                {
                  num: 3,
                  title: "Poner precios demasiado bajos",
                  text: "El merch personalizado no compite por precio con Zara o H&M. Compite por exclusividad y significado. No tengas miedo de cobrar lo que vale.",
                },
                {
                  num: 4,
                  title: "No invertir en fotos/mockups",
                  text: "La gente compra con los ojos. Un buen mockup con tu diseno aplicado vale mas que mil palabras. Usa el generador de mockups de Novamente para tener imagenes profesionales.",
                },
                {
                  num: 5,
                  title: "Rendirse antes de las 50 ventas",
                  text: "Todo negocio necesita tiempo para despegar. Los primeros 50 clientes son los mas dificiles. Despues de eso, el boca a boca y las redes hacen el trabajo.",
                },
              ].map((item) => (
                <div key={item.num} className="flex gap-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-5">
                  <span className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-300 font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {item.num}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-zinc-400 text-sm">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Calidad DTG */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3">
              <Zap className="w-7 h-7 text-violet-400" />
              Calidad que respalda tu marca: estampado DTG
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4" data-speakable>
              Novamente usa exclusivamente estampado <strong className="text-white">DTG (Direct to Garment)</strong>,
              la tecnologia de impresion textil mas avanzada del mercado. A diferencia de la serigrafia tradicional
              o la sublimacion, el DTG imprime directamente sobre la fibra del algodon con tintas a base de agua,
              logrando una calidad fotografica que dura mas de 50 lavados.
            </p>
            <p className="text-zinc-300 leading-relaxed">
              Todas las prendas son de <strong className="text-white">algodon 100%</strong>, con cortes modernos
              y terminaciones premium. Cuando tu cliente recibe la prenda, la calidad habla por si sola — y eso
              genera recompra y recomendaciones. Para entender mas sobre este metodo, visita nuestra{" "}
              <Link href="/dtg-vs-serigrafia" className="text-violet-400 hover:text-violet-300 underline">
                guia comparativa DTG vs Serigrafia vs Sublimacion
              </Link>.
            </p>
          </section>

          {/* CTA intermedio */}
          <section className="my-12 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Listo para empezar?</h2>
            <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
              Crea tu primer diseno gratis con IA y ve como queda en una prenda real. Sin registro, sin compromiso.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/design">
                <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white gap-2">
                  <Sparkles className="w-4 h-4" />
                  Crear mi primer diseno
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/partners">
                <Button size="lg" variant="outline" className="border-violet-500/50 text-violet-300 hover:bg-violet-500/10 gap-2">
                  <Users className="w-4 h-4" />
                  Conocer programa Partners
                </Button>
              </Link>
            </div>
          </section>

          {/* Section: Casos de exito */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
              <Star className="w-7 h-7 text-yellow-400" />
              Casos reales: emprendedores que ya lo estan haciendo
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-zinc-300 text-sm italic mb-3">
                    &quot;Arranque vendiendo remeras a mis seguidores de Instagram con disenos que hice en Novamente.
                    En el primer mes vendi 23 unidades sin poner un peso de mi bolsillo.&quot;
                  </p>
                  <p className="text-zinc-400 text-sm font-medium">— Martina S., Buenos Aires</p>
                  <p className="text-zinc-500 text-xs">Emprendedora de moda, +150 ventas en 6 meses</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-zinc-300 text-sm italic mb-3">
                    &quot;Tengo una comunidad de gamers y empece a hacer merch tematico con Novamente. Lo mejor es
                    que no tengo que preocuparme por la produccion ni los envios.&quot;
                  </p>
                  <p className="text-zinc-400 text-sm font-medium">— Lucas R., Cordoba</p>
                  <p className="text-zinc-500 text-xs">Streamer, vende merch a su comunidad</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
              <Lightbulb className="w-7 h-7 text-violet-400" />
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <details key={index} className="group bg-zinc-800/50 border border-zinc-700 rounded-xl">
                  <summary className="cursor-pointer p-5 font-medium text-white hover:text-violet-300 transition-colors list-none flex justify-between items-center">
                    {item.question}
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-5 pb-5 text-zinc-300 text-sm leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3" data-speakable>
              Tu marca de ropa empieza hoy
            </h2>
            <p className="text-zinc-300 mb-6 max-w-2xl mx-auto text-lg">
              No necesitas inversion, no necesitas experiencia en diseno, no necesitas deposito.
              Solo tu creatividad y ganas de emprender. Novamente se encarga del resto.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/design">
                <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white gap-2 text-lg px-8 py-6">
                  <Sparkles className="w-5 h-5" />
                  Empezar a disenar gratis
                </Button>
              </Link>
              <Link href="/products">
                <Button size="lg" variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 gap-2 text-lg px-8 py-6">
                  <Shirt className="w-5 h-5" />
                  Ver catalogo de productos
                </Button>
              </Link>
            </div>
            <p className="text-zinc-500 text-sm mt-4">
              Mas de 1.200 disenos creados · 95+ partners activos · Envios a todo el pais
            </p>
          </section>

          {/* Related posts / internal links */}
          <section className="mt-12 pt-8 border-t border-zinc-800">
            <h3 className="text-lg font-semibold mb-4 text-zinc-300">Seguir leyendo</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/dtg-vs-serigrafia" className="group">
                <Card className="bg-zinc-800/50 border-zinc-700 hover:border-violet-500/50 transition-colors h-full">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-white group-hover:text-violet-300 transition-colors mb-2">DTG vs Serigrafia vs Sublimacion</h4>
                    <p className="text-zinc-400 text-sm">Comparativa completa de metodos de estampado.</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/disena-tu-remera" className="group">
                <Card className="bg-zinc-800/50 border-zinc-700 hover:border-violet-500/50 transition-colors h-full">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-white group-hover:text-violet-300 transition-colors mb-2">Disena tu remera personalizada</h4>
                    <p className="text-zinc-400 text-sm">Crea tu remera unica con IA en minutos.</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/hoodie-personalizado" className="group">
                <Card className="bg-zinc-800/50 border-zinc-700 hover:border-violet-500/50 transition-colors h-full">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-white group-hover:text-violet-300 transition-colors mb-2">Hoodie personalizado</h4>
                    <p className="text-zinc-400 text-sm">El producto con mayor margen. Desde $43.000.</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>
        </article>
      </main>
    </>
  )
}
