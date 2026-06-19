import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles, ArrowRight, Star, CheckCircle2, Lightbulb,
  ShieldCheck, Palette, Shirt, Droplets, Zap, BookOpen,
  ThermometerSun, Clock, Layers, Heart, Leaf, AlertTriangle
} from "lucide-react"
import { LandingHeroImage } from '@/components/LandingHeroImage'

export const metadata: Metadata = {
  title: "DTG: Todo lo que necesitas saber sobre impresion directa a prenda — Guia 2026",
  description:
    "Guia completa sobre estampado DTG (Direct to Garment). Como funciona, durabilidad, cuidado de prendas, ventajas vs otros metodos, costos y por que es el futuro de la personalizacion textil en Argentina.",
  keywords: [
    "DTG que es",
    "estampado DTG",
    "impresion directa a prenda",
    "direct to garment",
    "DTG argentina",
    "DTG durabilidad",
    "cuidado remera DTG",
    "DTG vs serigrafia",
    "DTG calidad",
    "como funciona DTG",
    "remera estampada DTG",
    "DTG algodon",
  ],
  openGraph: {
    title: "DTG: Todo lo que necesitas saber — Guia completa 2026",
    description:
      "Como funciona el estampado DTG, durabilidad, cuidado de prendas, comparaciones y costos. La guia definitiva sobre Direct to Garment en Argentina.",
    url: "https://www.novamente.ar/blog/dtg-todo-lo-que-necesitas-saber",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "DTG: Todo lo que necesitas saber — Guia 2026",
    description:
      "Guia completa sobre estampado DTG: como funciona, durabilidad, cuidado y por que es el futuro de la personalizacion textil.",
  },
  alternates: { canonical: "https://www.novamente.ar/blog/dtg-todo-lo-que-necesitas-saber" },
}

const faqItems = [
  {
    question: "Cuanto dura el estampado DTG?",
    answer:
      "Un estampado DTG bien curado dura mas de 50 lavados sin perder calidad. La clave esta en seguir las instrucciones de cuidado: lavar del reves, agua fria, y no usar secadora. En condiciones normales, la vida util del estampado es similar o superior a la de la prenda misma.",
  },
  {
    question: "Se puede estampar DTG en cualquier tela?",
    answer:
      "El DTG funciona mejor en telas de algodon 100% o con al menos 80% de algodon. La tinta a base de agua se absorbe en las fibras naturales del algodon, lo que da el mejor resultado en color y durabilidad. No se recomienda para poliester puro (para eso existe la sublimacion).",
  },
  {
    question: "El estampado DTG se siente al tacto?",
    answer:
      "Practicamente no. A diferencia de la serigrafia que deja una capa plastica sobre la tela, el DTG penetra las fibras del algodon. El resultado es un estampado suave al tacto que no se agrieta ni se despega. Despues de algunos lavados, se siente completamente integrado con la tela.",
  },
  {
    question: "Cual es el costo de estampar una prenda con DTG?",
    answer:
      "El costo por unidad en DTG es mayor que en serigrafia para grandes volumenes (100+ unidades). Pero para pedidos de 1 a 50 unidades, el DTG es significativamente mas economico porque no requiere matrices, pantallas ni setup. En Novamente, una remera estampada con DTG arranca desde $28.600.",
  },
  {
    question: "DTG es ecologico?",
    answer:
      "Si. Las tintas DTG son a base de agua, certificadas OEKO-TEX, libres de solventes toxicos y PVC. Ademas, el modelo on-demand elimina la sobreproduccion: cada prenda se produce solo cuando hay un pedido real, reduciendo el desperdicio textil practicamente a cero.",
  },
  {
    question: "Puedo estampar fotos o imagenes con muchos colores en DTG?",
    answer:
      "Si, esa es una de las mayores ventajas del DTG. Usa tecnologia CMYK (como una impresora de fotos) por lo que puede reproducir millones de colores, degradados, fotografias y detalles finos que serian imposibles o muy costosos con serigrafia.",
  },
]

export default function BlogDTG() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "DTG: Todo lo que necesitas saber sobre impresion directa a prenda",
    description:
      "Guia completa sobre estampado DTG: como funciona, durabilidad, cuidado de prendas, ventajas y costos en Argentina.",
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
        url: "https://www.novamente.ar/marketing/lifestyle/blog-cover-dtg.webp",
      },
    },
    datePublished: "2026-03-21",
    dateModified: "2026-03-21",
    mainEntityOfPage: "https://www.novamente.ar/blog/dtg-todo-lo-que-necesitas-saber",
    image: "https://www.novamente.ar/marketing/lifestyle/blog-cover-dtg.webp",
    articleSection: "Tecnologia textil",
    wordCount: 2400,
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
        name: "DTG: Todo lo que necesitas saber",
        item: "https://www.novamente.ar/blog/dtg-todo-lo-que-necesitas-saber",
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
            <li className="text-zinc-200">DTG: Todo lo que necesitas saber</li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <LandingHeroImage
            src="/marketing/lifestyle/blog-cover-dtg.webp"
            alt="Detalle de estampado DTG en remera negra oversize Novamente"
          />
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              <BookOpen className="w-3 h-3 mr-1" />
              Guia tecnica
            </Badge>
            <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">
              15 min de lectura
            </Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6" data-speakable>
            DTG: Todo lo que necesitas saber sobre impresion directa a prenda
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 leading-relaxed max-w-3xl" data-speakable>
            El estampado DTG (Direct to Garment) revoluciono la personalizacion textil. En esta guia
            te explicamos como funciona, cuanto dura, como cuidar tus prendas y por que elegimos
            esta tecnologia en Novamente.
          </p>
          <div className="flex items-center gap-4 mt-6 text-sm text-zinc-400">
            <span>Por <strong className="text-zinc-200">Equipo Novamente</strong></span>
            <span>·</span>
            <time dateTime="2026-03-21">21 de marzo, 2026</time>
          </div>
        </header>

        {/* Que es DTG */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" data-speakable>
            Que es el estampado DTG?
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            DTG significa <strong className="text-white">Direct to Garment</strong> (impresion directa a prenda).
            Es una tecnologia de estampado que funciona como una impresora inkjet de alta precision,
            pero en vez de imprimir sobre papel, imprime directamente sobre la tela de la prenda.
          </p>
          <p className="text-zinc-300 leading-relaxed mb-8">
            A diferencia de la serigrafia que usa pantallas y tintas plasticas, o la sublimacion que
            transfiere tinta con calor, el DTG aplica tintas a base de agua directamente sobre las fibras
            del algodon. El resultado: un estampado con calidad fotografica, suave al tacto, y que se
            integra con la tela en vez de sentarse encima.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-5">
                <Droplets className="w-8 h-8 text-emerald-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">Tintas a base de agua</h3>
                <p className="text-sm text-zinc-400">
                  Sin PVC, sin solventes toxicos. Certificadas OEKO-TEX para contacto con la piel.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-5">
                <Palette className="w-8 h-8 text-emerald-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">Millones de colores</h3>
                <p className="text-sm text-zinc-400">
                  Tecnologia CMYK que reproduce fotos, degradados y detalles imposibles con serigrafia.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-5">
                <Shirt className="w-8 h-8 text-emerald-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">Desde 1 unidad</h3>
                <p className="text-sm text-zinc-400">
                  Sin minimos de produccion. Ideal para disenos unicos, on-demand y personalizacion.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Como funciona */}
        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-zinc-800">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" data-speakable>
            Como funciona el proceso DTG paso a paso
          </h2>
          <div className="space-y-6">
            {[
              {
                step: "1",
                title: "Pre-tratamiento de la prenda",
                description: "Se aplica una solucion especial sobre la tela que prepara las fibras para recibir la tinta. Este paso es crucial: sin pre-tratamiento, los colores no fijan bien y el estampado pierde vibrancia. En prendas oscuras, el pre-tratamiento tambien ayuda a que la base blanca se adhiera correctamente.",
                icon: Droplets,
              },
              {
                step: "2",
                title: "Impresion digital directa",
                description: "La prenda se coloca en una bandeja plana debajo del cabezal de impresion. La impresora DTG aplica la tinta CMYK (y blanco en prendas oscuras) directamente sobre la tela, pixel por pixel, como una impresora de fotos. El proceso tarda entre 30 segundos y 3 minutos dependiendo del tamano y complejidad del diseno.",
                icon: Zap,
              },
              {
                step: "3",
                title: "Curado con calor",
                description: "Despues de imprimir, la prenda pasa por una prensa de calor a 160-180°C durante 35-90 segundos. Este paso fija la tinta en las fibras del algodon de forma permanente. Sin un curado correcto, el estampado se lava. Por eso en Novamente usamos equipos de curado industrial con temperatura y tiempo controlados.",
                icon: ThermometerSun,
              },
              {
                step: "4",
                title: "Control de calidad",
                description: "Cada prenda se inspecciona visualmente para verificar colores, definicion del diseno, y que no haya defectos. Si algo no cumple el estandar, se repite el proceso. Solo las prendas que pasan el QC se empaquetan y envian.",
                icon: CheckCircle2,
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-1">
                    Paso {item.step}: {item.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Durabilidad */}
        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-zinc-800">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" data-speakable>
            Durabilidad: cuanto dura un estampado DTG?
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Una de las preguntas mas frecuentes. La respuesta corta: <strong className="text-white">un
            estampado DTG bien hecho dura mas de 50 lavados</strong> sin perder color ni definicion.
            En muchos casos, la prenda se desgasta antes que el estampado.
          </p>
          <p className="text-zinc-300 leading-relaxed mb-8">
            La durabilidad depende de tres factores: la calidad de la tinta, el curado correcto,
            y el cuidado que le des a la prenda. En Novamente usamos tintas premium y equipos de
            curado industrial, asi que nuestro trabajo esta cubierto. Lo que queda de tu lado es
            el cuidado — que es bastante simple.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-emerald-500/10 border-emerald-500/20">
              <CardContent className="p-5">
                <h3 className="font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Lo que SI resiste
                </h3>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li>• 50+ ciclos de lavado en lavadora</li>
                  <li>• Uso diario sin decoloracion</li>
                  <li>• Planchado (siempre del reves)</li>
                  <li>• Sudor y humedad</li>
                  <li>• Exposicion solar moderada</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/10 border-amber-500/20">
              <CardContent className="p-5">
                <h3 className="font-semibold text-amber-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Lo que hay que evitar
                </h3>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li>• Secadora a alta temperatura</li>
                  <li>• Blanqueador o cloro</li>
                  <li>• Planchar directamente sobre el estampado</li>
                  <li>• Frotar el estampado con fuerza</li>
                  <li>• Lavado con agua caliente (&gt;40°C)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cuidado de prendas */}
        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-zinc-800">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" data-speakable>
            Como cuidar tus prendas estampadas con DTG
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-8">
            Seguir estas recomendaciones asegura que tu estampado se mantenga como nuevo
            durante toda la vida util de la prenda:
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Layers,
                title: "Lava del reves",
                description: "Siempre da vuelta la prenda antes de meterla al lavarropas. Esto protege el estampado del roce con otras prendas y reduce el desgaste mecanico.",
              },
              {
                icon: Droplets,
                title: "Agua fria o tibia",
                description: "Lava con agua fria (maximo 30°C). El agua caliente puede afectar la fijacion de la tinta a largo plazo. Ciclo suave o normal, sin centrifugado agresivo.",
              },
              {
                icon: ThermometerSun,
                title: "Evita la secadora",
                description: "El calor intenso de la secadora puede deteriorar la tinta. Mejor secar al aire, a la sombra. Si usas secadora, que sea en ciclo frio o bajo.",
              },
              {
                icon: ShieldCheck,
                title: "No uses blanqueador",
                description: "El cloro y los blanqueadores quimicos destruyen las tintas DTG. Usa jabon neutro o detergente suave. Si hay una mancha, trata localmente sin frotar sobre el estampado.",
              },
            ].map((item) => (
              <Card key={item.title} className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-5">
                  <item.icon className="w-7 h-7 text-emerald-400 mb-3" />
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA mid-article */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30">
            <CardContent className="p-8 text-center">
              <Sparkles className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                Queres ver la calidad DTG en persona?
              </h3>
              <p className="text-zinc-300 mb-6 max-w-xl mx-auto">
                Disena tu primera remera con IA y recibi una prenda estampada con DTG premium.
                Sin minimos, sin compromisos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/crear">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Disenar con IA
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-zinc-600 text-zinc-200 hover:bg-zinc-800">
                  <Link href="/products">
                    Ver catalogo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* DTG vs otros metodos */}
        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-zinc-800">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" data-speakable>
            DTG vs otros metodos de estampado
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-8">
            Cada metodo tiene su lugar. El DTG brilla en personalizacion y pedidos chicos.
            Te mostramos cuando conviene cada uno:
          </p>

          <div className="space-y-4">
            <Card className="bg-emerald-500/10 border-emerald-500/20">
              <CardContent className="p-6">
                <h3 className="font-bold text-emerald-300 text-lg mb-2">DTG — El mejor para personalizacion</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-300 mb-2">Ideal para:</p>
                    <ul className="text-sm text-zinc-400 space-y-1">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Pedidos de 1 a 50 unidades</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Disenos con muchos colores o fotos</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Prendas de algodon 100%</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Marcas on-demand sin stock</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-300 mb-2">Limitaciones:</p>
                    <ul className="text-sm text-zinc-400 space-y-1">
                      <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Costo unitario mas alto en grandes volumenes</li>
                      <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Requiere algodon (no poliester puro)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6">
                <h3 className="font-bold text-zinc-200 text-lg mb-2">Serigrafia — Para grandes tiradas uniformes</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-300 mb-2">Ideal para:</p>
                    <ul className="text-sm text-zinc-400 space-y-1">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> 100+ unidades del mismo diseno</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> Disenos simples (1-4 colores)</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> Uniformes y merchandising corporativo</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-300 mb-2">Limitaciones:</p>
                    <ul className="text-sm text-zinc-400 space-y-1">
                      <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Minimo 50-100 unidades</li>
                      <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Colores limitados por diseno</li>
                      <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Textura plastica sobre la tela</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6">
                <h3 className="font-bold text-zinc-200 text-lg mb-2">Sublimacion — Para poliester y sportswear</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-300 mb-2">Ideal para:</p>
                    <ul className="text-sm text-zinc-400 space-y-1">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> Ropa deportiva de poliester</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> Estampado all-over (toda la prenda)</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> Colores ultra-vibrantes</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-300 mb-2">Limitaciones:</p>
                    <ul className="text-sm text-zinc-400 space-y-1">
                      <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Solo funciona en poliester blanco</li>
                      <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> No sirve para algodon</li>
                      <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Se degrada con calor intenso</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-zinc-400 text-sm mt-6">
            Queres una comparacion mas detallada?{" "}
            <Link href="/dtg-vs-serigrafia" className="text-emerald-400 hover:text-emerald-300 underline">
              Lee nuestra comparativa completa DTG vs Serigrafia vs Sublimacion
            </Link>
          </p>
        </section>

        {/* Por que DTG en Novamente */}
        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-zinc-800">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" data-speakable>
            Por que Novamente usa DTG?
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-8">
            Elegimos DTG porque se alinea con nuestra mision: permitir que cualquier persona cree
            ropa unica, sin minimos de produccion, con la mejor calidad posible. Estas son las
            razones especificas:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Sparkles,
                title: "Compatibilidad con IA",
                description: "Los disenos generados por IA son complejos, con muchos colores y detalles. Solo DTG puede reproducirlos fielmente sobre tela.",
              },
              {
                icon: Heart,
                title: "Produccion on-demand",
                description: "Cada prenda se produce cuando se pide. Sin stock, sin desperdicio, sin riesgo para el emprendedor. DTG es la unica tecnologia que lo hace viable desde 1 unidad.",
              },
              {
                icon: Star,
                title: "Calidad premium",
                description: "Usamos algodon 100% de 24/1 peinado. La combinacion de tela premium + tinta DTG de calidad da un resultado que se siente y se ve profesional.",
              },
              {
                icon: Leaf,
                title: "Sustentabilidad",
                description: "Tintas a base de agua, sin sobreproduccion, sin merma de stock. Cada prenda existe porque alguien la quiso. Es moda consciente por diseno, no por marketing.",
              },
            ].map((item) => (
              <Card key={item.title} className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-5">
                  <item.icon className="w-7 h-7 text-emerald-400 mb-3" />
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Costos DTG */}
        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-zinc-800">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" data-speakable>
            Costos del estampado DTG en Argentina
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-8">
            El costo del DTG depende del tamano del estampado y la complejidad del diseno.
            En Novamente, la prenda ya incluye el estampado DTG en el precio:
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-zinc-800/50 border-zinc-700 text-center">
              <CardContent className="p-6">
                <Shirt className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 mb-1">Remera clasica</p>
                <p className="text-2xl font-bold text-white">$28.600</p>
                <p className="text-xs text-zinc-500 mt-1">Algodon 100% + DTG incluido</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700 text-center">
              <CardContent className="p-6">
                <Shirt className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 mb-1">Remera oversize</p>
                <p className="text-2xl font-bold text-white">$31.000</p>
                <p className="text-xs text-zinc-500 mt-1">Algodon 100% + DTG incluido</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700 text-center">
              <CardContent className="p-6">
                <Shirt className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 mb-1">Hoodie</p>
                <p className="text-2xl font-bold text-white">$43.000</p>
                <p className="text-xs text-zinc-500 mt-1">Frisa + DTG incluido</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-zinc-400 text-sm">
            Todos los precios incluyen la prenda + estampado DTG + packaging. Sin costos ocultos.
            Si sos partner, podes revender con margenes del 40-80%.{" "}
            <Link href="/partners" className="text-emerald-400 hover:text-emerald-300 underline">
              Conoce el programa Partners
            </Link>
          </p>
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-zinc-800">
          <h2 className="text-2xl md:text-3xl font-bold mb-8" data-speakable>
            Preguntas frecuentes sobre DTG
          </h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group bg-zinc-800/50 border border-zinc-700 rounded-lg"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-medium text-white pr-4">{item.question}</span>
                  <span className="text-zinc-400 group-open:rotate-45 transition-transform text-xl flex-shrink-0">+</span>
                </summary>
                <div className="px-5 pb-5 text-zinc-400 leading-relaxed border-t border-zinc-700/50 pt-4">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <Card className="bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 border-emerald-500/30">
            <CardContent className="p-8 md:p-12 text-center">
              <Sparkles className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Proba la calidad DTG de Novamente
              </h2>
              <p className="text-zinc-300 mb-8 max-w-xl mx-auto leading-relaxed" data-speakable>
                Disena tu prenda con inteligencia artificial y recibi estampado DTG premium
                sobre algodon 100%. Desde 1 unidad, sin compromisos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8">
                  <Link href="/crear">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Crear mi diseno con IA
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-zinc-600 text-zinc-200 hover:bg-zinc-800">
                  <Link href="/disena-tu-remera">
                    Ver remeras personalizadas
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Related posts */}
        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-zinc-800">
          <h3 className="text-xl font-bold mb-6">Seguir leyendo</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/dtg-vs-serigrafia" className="group">
              <Card className="bg-zinc-800/50 border-zinc-700 hover:border-emerald-500/50 transition-colors h-full">
                <CardContent className="p-5">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-3">Comparativa</Badge>
                  <h4 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    DTG vs Serigrafia vs Sublimacion
                  </h4>
                  <p className="text-sm text-zinc-400 mt-2">Comparacion detallada con tabla de 12 criterios</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/blog/como-crear-merch-sin-inversion" className="group">
              <Card className="bg-zinc-800/50 border-zinc-700 hover:border-violet-500/50 transition-colors h-full">
                <CardContent className="p-5">
                  <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 mb-3">Guia</Badge>
                  <h4 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                    Como crear merch sin inversion
                  </h4>
                  <p className="text-sm text-zinc-400 mt-2">Modelo print-on-demand paso a paso para emprendedores</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/hoodie-personalizado" className="group">
              <Card className="bg-zinc-800/50 border-zinc-700 hover:border-orange-500/50 transition-colors h-full">
                <CardContent className="p-5">
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 mb-3">Producto</Badge>
                  <h4 className="font-semibold text-white group-hover:text-orange-300 transition-colors">
                    Hoodie personalizado
                  </h4>
                  <p className="text-sm text-zinc-400 mt-2">Hoodies DTG premium desde $43.000 con margenes del 60-80%</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
