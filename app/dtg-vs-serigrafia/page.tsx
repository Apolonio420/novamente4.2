import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import {
  Sparkles, ArrowRight, Star, CheckCircle2, XCircle, MinusCircle,
  Shield, Truck, Clock, Zap, Droplets, Layers, Palette
} from "lucide-react"

export const metadata: Metadata = {
  title: "DTG vs Serigrafia vs Sublimacion — Comparativa completa 2026",
  description:
    "Comparacion detallada entre DTG (Direct to Garment), serigrafia y sublimacion. Ventajas, desventajas, costos y cual conviene segun tu proyecto. Guia completa para Argentina.",
  keywords: [
    "DTG vs serigrafia",
    "DTG vs sublimacion",
    "serigrafia vs sublimacion",
    "estampado DTG",
    "estampado textil argentina",
    "impresion directa remera",
    "serigrafia remeras",
    "sublimacion remeras",
    "que metodo de estampado elegir",
    "DTG argentina",
    "mejor estampado remera personalizada",
  ],
  openGraph: {
    title: "DTG vs Serigrafia vs Sublimacion — Comparativa 2026",
    description:
      "Cual metodo de estampado conviene? Comparamos DTG, serigrafia y sublimacion en calidad, costo, durabilidad y mas.",
    url: "https://www.novamente.ar/dtg-vs-serigrafia",
    type: "article",
    images: [
      {
        url: "https://www.novamente.ar/marketing/lifestyle/blog-cover-dtg.webp",
        width: 1200,
        height: 630,
        alt: "Comparativa de metodos de estampado: DTG vs serigrafia vs sublimacion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DTG vs Serigrafia vs Sublimacion — Guia completa",
    description:
      "Todo lo que necesitas saber para elegir el metodo de estampado correcto para tu remera personalizada.",
  },
  alternates: { canonical: "https://www.novamente.ar/dtg-vs-serigrafia" },
}

type ComparisonRow = {
  feature: string
  dtg: { value: string; icon: "check" | "x" | "minus" }
  serigrafia: { value: string; icon: "check" | "x" | "minus" }
  sublimacion: { value: string; icon: "check" | "x" | "minus" }
}

const comparisonData: ComparisonRow[] = [
  {
    feature: "Minimo de unidades",
    dtg: { value: "1 unidad", icon: "check" },
    serigrafia: { value: "50+ unidades", icon: "x" },
    sublimacion: { value: "1 unidad", icon: "check" },
  },
  {
    feature: "Cantidad de colores",
    dtg: { value: "Ilimitados (CMYK)", icon: "check" },
    serigrafia: { value: "Limitados (1-6 por diseno)", icon: "minus" },
    sublimacion: { value: "Ilimitados (CMYK)", icon: "check" },
  },
  {
    feature: "Tipo de tela",
    dtg: { value: "Algodon 100%", icon: "check" },
    serigrafia: { value: "Algodon y mezclas", icon: "check" },
    sublimacion: { value: "Solo poliester blanco", icon: "x" },
  },
  {
    feature: "Calidad de detalle",
    dtg: { value: "Fotografica (alta)", icon: "check" },
    serigrafia: { value: "Buena (tintas planas)", icon: "minus" },
    sublimacion: { value: "Fotografica (alta)", icon: "check" },
  },
  {
    feature: "Durabilidad",
    dtg: { value: "Excelente (+50 lavados)", icon: "check" },
    serigrafia: { value: "Muy buena (+100 lavados)", icon: "check" },
    sublimacion: { value: "Buena (se degrada con calor)", icon: "minus" },
  },
  {
    feature: "Tacto de la prenda",
    dtg: { value: "Suave (tinta penetra la fibra)", icon: "check" },
    serigrafia: { value: "Se siente la capa de tinta", icon: "minus" },
    sublimacion: { value: "No se siente (integrado)", icon: "check" },
  },
  {
    feature: "Colores de prenda",
    dtg: { value: "Blancos y oscuros", icon: "check" },
    serigrafia: { value: "Cualquier color", icon: "check" },
    sublimacion: { value: "Solo blancos/claros", icon: "x" },
  },
  {
    feature: "Costo por unidad (1-10)",
    dtg: { value: "$28.600 - $55.000", icon: "check" },
    serigrafia: { value: "Alto (setup + pantallas)", icon: "x" },
    sublimacion: { value: "$15.000 - $25.000", icon: "check" },
  },
  {
    feature: "Costo por unidad (100+)",
    dtg: { value: "Mismo precio", icon: "minus" },
    serigrafia: { value: "Muy barato por unidad", icon: "check" },
    sublimacion: { value: "Bajo", icon: "check" },
  },
  {
    feature: "Tiempo de produccion",
    dtg: { value: "1-3 dias", icon: "check" },
    serigrafia: { value: "5-15 dias (setup)", icon: "x" },
    sublimacion: { value: "1-3 dias", icon: "check" },
  },
  {
    feature: "Personalizacion individual",
    dtg: { value: "Cada prenda diferente", icon: "check" },
    serigrafia: { value: "Todas iguales", icon: "x" },
    sublimacion: { value: "Cada prenda diferente", icon: "check" },
  },
  {
    feature: "Eco-friendly",
    dtg: { value: "Tintas a base de agua", icon: "check" },
    serigrafia: { value: "Usa solventes quimicos", icon: "x" },
    sublimacion: { value: "Tintas a base de agua", icon: "check" },
  },
]

function StatusIcon({ icon }: { icon: "check" | "x" | "minus" }) {
  if (icon === "check") return <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
  if (icon === "x") return <XCircle className="w-4 h-4 text-red-400 shrink-0" />
  return <MinusCircle className="w-4 h-4 text-yellow-400 shrink-0" />
}

export default function DtgVsSerigrafia() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "DTG vs Serigrafia vs Sublimacion — Comparativa completa 2026",
    description:
      "Guia completa comparando los tres metodos de estampado textil mas populares en Argentina.",
    author: { "@type": "Organization", name: "Novamente", url: "https://www.novamente.ar" },
    publisher: { "@type": "Organization", name: "Novamente", url: "https://www.novamente.ar" },
    datePublished: "2026-03-21",
    dateModified: "2026-03-21",
    mainEntityOfPage: "https://www.novamente.ar/dtg-vs-serigrafia",
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Que es el estampado DTG?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DTG (Direct to Garment) es un metodo de impresion textil que aplica tinta directamente sobre la fibra del algodon usando impresoras especializadas. Permite imprimir disenos con colores ilimitados, degradados y detalles fotograficos, ideal para pedidos desde 1 unidad.",
        },
      },
      {
        "@type": "Question",
        name: "Cual es la diferencia principal entre DTG y serigrafia?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La serigrafia usa pantallas fisicas (una por color) para aplicar tinta, ideal para grandes volumenes con pocos colores. El DTG imprime digitalmente sin limites de colores ni necesidad de pantallas, ideal para disenos complejos y pedidos unitarios. La serigrafia conviene a partir de 50+ unidades iguales, el DTG para 1-49 unidades personalizadas.",
        },
      },
      {
        "@type": "Question",
        name: "Es mejor la sublimacion o el DTG para remeras?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Depende del material: la sublimacion solo funciona en poliester blanco, mientras que el DTG funciona en algodon 100% (blanco y oscuro). Para remeras de algodon premium, DTG es superior. La sublimacion tiene mejor precio pero sacrifica la calidad de la tela (poliester vs algodon).",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto dura un estampado DTG?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Un estampado DTG bien hecho dura mas de 50 lavados sin perder calidad. La tinta penetra directamente en la fibra del algodon, no queda encima como una capa. Con cuidados basicos (lavar del reves, agua fria, no usar secadora), puede durar la vida util de la prenda.",
        },
      },
      {
        "@type": "Question",
        name: "Que metodo de estampado conviene para emprendedores?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Para emprendedores que recien arrancan, DTG es la mejor opcion: sin minimos de compra, sin inversion en pantallas, produccion rapida (1-3 dias) y cada prenda puede tener un diseno diferente. Solo se paga por lo que se produce, eliminando el riesgo de stock sin vender.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo estampar fotos con DTG?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si. El DTG tiene calidad fotografica porque imprime en CMYK con millones de colores. Podés estampar fotos, ilustraciones con degradados, arte digital complejo y cualquier imagen a todo color con una resolucion de hasta 1200 DPI.",
        },
      },
    ],
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.novamente.ar" },
      { "@type": "ListItem", position: 2, name: "DTG vs Serigrafia vs Sublimacion", item: "https://www.novamente.ar/dtg-vs-serigrafia" },
    ],
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center bg-novamente-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 opacity-40" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-buzos-personalizados.webp"
              alt="Estampado DTG premium en hoodie negro Novamente"
            />
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm px-4 py-1.5">
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              Guia comparativa 2026
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight mb-6 leading-[1.1]">
              <span className="text-white">DTG vs Serigrafia</span>
              <br />
              <span className="text-white/60">vs Sublimacion</span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
              Cual metodo de estampado conviene para tu proyecto? Comparamos calidad, costos,
              durabilidad y escalabilidad para que elijas con datos reales.
            </p>

            <div className="flex flex-wrap gap-4 justify-center text-sm text-white/60">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                5 min de lectura
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                Actualizado marzo 2026
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick TL;DR */}
      <section className="py-12 md:py-16 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="novamente-heading text-2xl md:text-3xl mb-8 text-center">RESUMEN RAPIDO</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-2 border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Droplets className="w-8 h-8 text-emerald-400" />
                  </div>
                  <Badge className="mb-3 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Recomendado</Badge>
                  <h3 className="text-xl font-semibold mb-2">DTG</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Impresion directa sobre algodon. Ideal para pedidos chicos (1-49 unidades) con disenos complejos.
                  </p>
                  <p className="text-xs text-emerald-400 font-medium">Mejor para: emprendedores, personalizado, disenos con muchos colores</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-white/10">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Layers className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Serigrafia</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Pantallas fisicas con tinta. Ideal para grandes volumenes (+50) con pocos colores (1-4).
                  </p>
                  <p className="text-xs text-blue-400 font-medium">Mejor para: uniformes, merchandising masivo, 1-2 colores</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-white/10">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Palette className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Sublimacion</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Transferencia con calor sobre poliester. Ideal para deportiva y all-over prints.
                  </p>
                  <p className="text-xs text-purple-400 font-medium">Mejor para: ropa deportiva, poliester, costo bajo</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="novamente-heading text-2xl md:text-3xl mb-4 text-center">TABLA COMPARATIVA COMPLETA</h2>
            <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
              12 criterios clave para elegir el metodo de estampado correcto para tu proyecto
            </p>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-white/20">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-white/80 w-1/4">Caracteristica</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-emerald-400 w-1/4">
                      <span className="flex items-center gap-2">
                        <Droplets className="w-4 h-4" /> DTG
                      </span>
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-blue-400 w-1/4">
                      <span className="flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Serigrafia
                      </span>
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-purple-400 w-1/4">
                      <span className="flex items-center gap-2">
                        <Palette className="w-4 h-4" /> Sublimacion
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 text-sm font-medium text-white/90">{row.feature}</td>
                      <td className="py-3.5 px-4 text-sm text-white/70">
                        <span className="flex items-center gap-2">
                          <StatusIcon icon={row.dtg.icon} />
                          {row.dtg.value}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-white/70">
                        <span className="flex items-center gap-2">
                          <StatusIcon icon={row.serigrafia.icon} />
                          {row.serigrafia.value}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-white/70">
                        <span className="flex items-center gap-2">
                          <StatusIcon icon={row.sublimacion.icon} />
                          {row.sublimacion.value}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {comparisonData.map((row, i) => (
                <Card key={i} className="border-white/10">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-white mb-3">{row.feature}</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <StatusIcon icon={row.dtg.icon} />
                        <div>
                          <span className="text-xs font-semibold text-emerald-400">DTG: </span>
                          <span className="text-xs text-white/70">{row.dtg.value}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <StatusIcon icon={row.serigrafia.icon} />
                        <div>
                          <span className="text-xs font-semibold text-blue-400">Serigrafia: </span>
                          <span className="text-xs text-white/70">{row.serigrafia.value}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <StatusIcon icon={row.sublimacion.icon} />
                        <div>
                          <span className="text-xs font-semibold text-purple-400">Sublimacion: </span>
                          <span className="text-xs text-white/70">{row.sublimacion.value}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Deep dive sections */}
      <section className="py-16 md:py-24 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-16">
            {/* DTG */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">DTG (Direct to Garment)</h2>
                  <p className="text-sm text-emerald-400">El metodo que usamos en Novamente</p>
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 leading-relaxed mb-4">
                  El DTG funciona como una impresora de inyeccion de tinta, pero en vez de papel imprime directamente
                  sobre la fibra del algodon. Usa tintas a base de agua que penetran la tela, logrando un tacto suave
                  (no se siente &ldquo;capa&rdquo; encima) y colores vibrantes con calidad fotografica.
                </p>
                <p className="text-white/80 leading-relaxed mb-4">
                  La gran ventaja del DTG es que <strong className="text-white">no tiene costos de setup ni minimos de compra</strong>.
                  Cada prenda se imprime individualmente, lo que significa que podes pedir 1 remera con un diseno y
                  otra con un diseno totalmente diferente al mismo precio. Es el metodo ideal para personalizacion,
                  emprendedores y merch a demanda.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-emerald-400 mb-2">Ventajas</h4>
                    <ul className="space-y-1.5 text-sm text-white/70">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Sin minimo de unidades</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Colores ilimitados</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Calidad fotografica</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Produccion rapida (1-3 dias)</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Tacto suave en la prenda</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Eco-friendly (tintas al agua)</li>
                    </ul>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-red-400 mb-2">Desventajas</h4>
                    <ul className="space-y-1.5 text-sm text-white/70">
                      <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> Precio fijo por unidad (no baja con volumen)</li>
                      <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> Solo algodon (no poliester)</li>
                      <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> En oscuros necesita capa blanca base</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Serigrafia */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Layers className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-semibold">Serigrafia (Screen Printing)</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 leading-relaxed mb-4">
                  La serigrafia es el metodo mas antiguo y extendido en la industria textil argentina.
                  Usa pantallas (una por color) por las que se fuerza tinta plastisol o a base de agua.
                  La tinta queda como una capa encima de la tela, dando un acabado solido y vibrante.
                </p>
                <p className="text-white/80 leading-relaxed mb-4">
                  El costo principal esta en el <strong className="text-white">setup: crear las pantallas</strong>.
                  Esto hace que la serigrafia no convenga para pedidos chicos (menos de 50 unidades),
                  porque el costo de setup se reparte en pocas prendas. Pero para +200 unidades iguales
                  con 1-3 colores, es imbatible en precio por unidad.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-blue-400 mb-2">Ventajas</h4>
                    <ul className="space-y-1.5 text-sm text-white/70">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Precio bajo en volumen alto</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Muy durable (+100 lavados)</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Colores Pantone exactos</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Funciona en cualquier tela</li>
                    </ul>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-red-400 mb-2">Desventajas</h4>
                    <ul className="space-y-1.5 text-sm text-white/70">
                      <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> Minimo 50+ unidades</li>
                      <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> Costo de pantallas por color</li>
                      <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> No permite degradados ni fotos</li>
                      <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> Produccion lenta (5-15 dias)</li>
                      <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> Todas las prendas deben ser iguales</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sublimacion */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Palette className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-semibold">Sublimacion</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 leading-relaxed mb-4">
                  La sublimacion imprime el diseno en un papel especial y luego lo transfiere a la tela con calor
                  y presion. La tinta se convierte en gas y penetra las fibras de poliester, fusionandose
                  permanentemente con la tela. El resultado es un estampado que no se toca ni se siente.
                </p>
                <p className="text-white/80 leading-relaxed mb-4">
                  La limitacion clave: <strong className="text-white">solo funciona en telas de poliester blancas o muy claras</strong>.
                  No funciona en algodon ni en colores oscuros. Para ropa deportiva o all-over prints
                  (estampado completo de la prenda), la sublimacion es una excelente opcion.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-purple-400 mb-2">Ventajas</h4>
                    <ul className="space-y-1.5 text-sm text-white/70">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Estampado integrado a la tela</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Permite all-over prints</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Costo bajo por unidad</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Sin minimo de unidades</li>
                    </ul>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-red-400 mb-2">Desventajas</h4>
                    <ul className="space-y-1.5 text-sm text-white/70">
                      <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> Solo poliester blanco/claro</li>
                      <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> No funciona en algodon</li>
                      <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> Se degrada con planchado directo</li>
                      <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> Tacto del poliester (menos premium)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* When to choose each */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="novamente-heading text-2xl md:text-3xl mb-4 text-center">CUAL ELEGIR SEGUN TU CASO</h2>
            <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
              No existe un metodo &ldquo;mejor&rdquo;. Cada uno tiene su caso de uso ideal.
            </p>

            <div className="space-y-4">
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-emerald-400">Elegi DTG si...</h3>
                      <ul className="space-y-1 text-sm text-white/70">
                        <li>Queres pedir 1 a 49 unidades</li>
                        <li>Tu diseno tiene muchos colores, degradados o fotos</li>
                        <li>Queres remeras de algodon premium</li>
                        <li>Cada prenda puede tener un diseno diferente</li>
                        <li>Sos emprendedor y no queres stockear</li>
                        <li>Necesitas produccion rapida (1-3 dias)</li>
                      </ul>
                      <Link href="/crear" className="inline-flex items-center gap-1 text-sm text-emerald-400 font-medium mt-3 hover:underline">
                        Proba DTG gratis con tu diseno <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Layers className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-blue-400">Elegi serigrafia si...</h3>
                      <ul className="space-y-1 text-sm text-white/70">
                        <li>Necesitas +50 unidades iguales</li>
                        <li>Tu diseno tiene 1-3 colores planos (sin degradados)</li>
                        <li>Necesitas colores Pantone exactos</li>
                        <li>Uniformes de trabajo o merchandising corporativo</li>
                        <li>La prioridad es precio por unidad en volumen</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Palette className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-purple-400">Elegi sublimacion si...</h3>
                      <ul className="space-y-1 text-sm text-white/70">
                        <li>Necesitas ropa deportiva (poliester)</li>
                        <li>Queres estampado all-over (toda la prenda)</li>
                        <li>Solo necesitas prendas blancas/claras</li>
                        <li>La prioridad es el costo mas bajo posible</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="novamente-heading text-2xl md:text-3xl mb-4">
              PREGUNTAS FRECUENTES SOBRE ESTAMPADO TEXTIL
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "Que es el estampado DTG?",
                a: "DTG (Direct to Garment) es un metodo de impresion textil que aplica tinta directamente sobre la fibra del algodon usando impresoras especializadas. Permite imprimir disenos con colores ilimitados, degradados y detalles fotograficos, ideal para pedidos desde 1 unidad.",
              },
              {
                q: "Cual es la diferencia principal entre DTG y serigrafia?",
                a: "La serigrafia usa pantallas fisicas (una por color) para aplicar tinta, ideal para grandes volumenes con pocos colores. El DTG imprime digitalmente sin limites de colores ni necesidad de pantallas, ideal para disenos complejos y pedidos unitarios. La serigrafia conviene a partir de 50+ unidades iguales, el DTG para 1-49 unidades personalizadas.",
              },
              {
                q: "Es mejor la sublimacion o el DTG para remeras?",
                a: "Depende del material: la sublimacion solo funciona en poliester blanco, mientras que el DTG funciona en algodon 100% (blanco y oscuro). Para remeras de algodon premium, DTG es superior. La sublimacion tiene mejor precio pero sacrifica la calidad de la tela.",
              },
              {
                q: "Cuanto dura un estampado DTG?",
                a: "Un estampado DTG bien hecho dura mas de 50 lavados sin perder calidad. La tinta penetra directamente en la fibra del algodon, no queda encima como una capa. Con cuidados basicos (lavar del reves, agua fria, no usar secadora), puede durar la vida util de la prenda.",
              },
              {
                q: "Que metodo conviene para emprendedores?",
                a: "Para emprendedores que arrancan, DTG es la mejor opcion: sin minimos de compra, sin inversion en pantallas, produccion rapida (1-3 dias) y cada prenda puede tener un diseno diferente. Solo se paga por lo que se produce, eliminando el riesgo de stock.",
              },
              {
                q: "Puedo estampar fotos con DTG?",
                a: "Si. El DTG tiene calidad fotografica porque imprime en CMYK con millones de colores. Podes estampar fotos, ilustraciones con degradados, arte digital complejo y cualquier imagen a todo color con resolucion de hasta 1200 DPI.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group border border-white/10 rounded-xl p-5 hover:border-emerald-500/30 transition-colors"
              >
                <summary className="text-base font-semibold cursor-pointer list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-emerald-400 group-open:rotate-45 transition-transform text-2xl ml-4 shrink-0">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="novamente-heading text-3xl md:text-4xl mb-4">
            PROBA DTG GRATIS CON TU DISENO
          </h2>
          <p className="text-xl mb-4 max-w-2xl mx-auto opacity-90">
            Crea tu diseno con inteligencia artificial y ve como queda en una remera de algodon premium.
            Sin compromiso, sin minimos.
          </p>
          <p className="text-lg mb-8 opacity-70">
            Remeras desde $28.600 · Buzos desde $43.000 · Envios a todo el pais
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/crear" data-cta="final-cta-dtg-comparison">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white hover:bg-white/90 text-emerald-700 font-semibold rounded-xl py-6 px-10 text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Crear Mi Diseno con IA
              </Button>
            </Link>
            <Link href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Vi%20su%20guia%20DTG%20vs%20Serigrafia%20y%20quiero%20asesoramiento%20para%20mi%20prenda.%20(ref%20%C2%B7%20NV-DTGSER)" target="_blank">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-emerald-700 bg-transparent py-6 px-10 text-lg"
              >
                Consultar por WhatsApp
              </Button>
            </Link>
          </div>

          <div className="flex justify-center gap-8 mt-10 text-sm opacity-70">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Pago seguro
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Produccion 1-3 dias
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              Envio a todo el pais
            </span>
          </div>
        </div>
      </section>

      {/* Partners CTA */}
      <section className="py-12 md:py-16 bg-novamente-black border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/50 text-sm mb-3">Para emprendedores y marcas</p>
          <h3 className="text-xl md:text-2xl font-semibold mb-4 text-white/90">
            Queres revender remeras y buzos con DTG?
          </h3>
          <p className="text-white/60 mb-6 max-w-xl mx-auto">
            Unite como partner de Novamente. Margenes del 60-80%, sin stock, produccion a demanda.
          </p>
          <Link href="/partners">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              Conocer programa de Partners <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
