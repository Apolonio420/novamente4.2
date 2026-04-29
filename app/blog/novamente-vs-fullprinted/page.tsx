import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Boxes, CheckCircle2, Paintbrush, Shirt, Sparkles, Zap } from "lucide-react"
import { LandingHeroImage } from '@/components/LandingHeroImage'

export const metadata: Metadata = {
  title: "Novamente vs proveedores tradicionales: IA, DTG y on-demand",
  description:
    "Comparativa para elegir entre Novamente y un proveedor tradicional de indumentaria personalizada. IA, DTG, minimos, stock, disenos por prenda y velocidad para marcas argentinas.",
  alternates: { canonical: "https://www.novamente.ar/blog/novamente-vs-fullprinted" },
  openGraph: {
    title: "Novamente vs proveedores tradicionales de indumentaria personalizada",
    description:
      "Que cambia cuando pasas de produccion tradicional a merch on-demand con IA, DTG y storefront.",
    url: "https://www.novamente.ar/blog/novamente-vs-fullprinted",
    type: "article",
  },
}

const comparison = [
  {
    criteria: "Minimos",
    novamente: "Desde 1 unidad. Sirve para probar ideas, regalos y drops chicos.",
    traditional: "Suelen convenir mas cuando ya tenes volumen claro o una tirada cerrada.",
  },
  {
    criteria: "Disenos diferentes",
    novamente: "Cada prenda puede tener una estampa distinta sin armar matrices.",
    traditional: "Cuando hay setup por tecnica, repetir el mismo arte suele ser mas eficiente.",
  },
  {
    criteria: "Velocidad creativa",
    novamente: "La IA ayuda a pasar de idea a mockup en minutos.",
    traditional: "Depende del arte que entregue el cliente o de un proceso de diseno externo.",
  },
  {
    criteria: "Riesgo de stock",
    novamente: "On-demand: producimos cuando hay pedido.",
    traditional: "Puede requerir comprar stock o cerrar una cantidad antes de vender.",
  },
  {
    criteria: "Mejor caso de uso",
    novamente: "Creadores, bandas, marcas chicas, regalos personalizados y test de colecciones.",
    traditional: "Uniformes repetidos, grandes tiradas y producciones donde el diseno ya esta cerrado.",
  },
]

const faqItems = [
  {
    question: "Novamente es mejor que un proveedor tradicional?",
    answer:
      "Depende del caso. Novamente conviene cuando necesitas flexibilidad, IA, produccion desde 1 unidad y cero stock. Un proveedor tradicional puede convenir si ya tenes volumen alto, diseno cerrado y una tirada muy repetida.",
  },
  {
    question: "Que tecnologia usa Novamente?",
    answer:
      "Novamente combina diseno con inteligencia artificial, mockups y estampado DTG profesional para producir prendas personalizadas bajo demanda.",
  },
  {
    question: "Puedo lanzar una marca sin comprar stock?",
    answer:
      "Si. Con Novamente Studio podes tener storefront, catalogo y produccion on-demand para vender antes de producir, reduciendo el riesgo inicial.",
  },
]

export default function NovamenteVsFullprinted() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Novamente vs proveedores tradicionales: IA, DTG y produccion on-demand",
    description:
      "Comparativa entre Novamente y proveedores tradicionales de indumentaria personalizada para marcas argentinas.",
    author: { "@type": "Organization", name: "Novamente", url: "https://www.novamente.ar" },
    publisher: {
      "@type": "Organization",
      "@id": "https://www.novamente.ar/#organization",
      name: "Novamente",
    },
    datePublished: "2026-04-29",
    dateModified: "2026-04-29",
    mainEntityOfPage: "https://www.novamente.ar/blog/novamente-vs-fullprinted",
    articleSection: "Comparativas",
    inLanguage: "es-AR",
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <main className="nv-page">
        <article className="nv-container">
          <Link href="/blog" className="text-sm font-semibold text-zinc-400 hover:text-white">
            Blog
          </Link>
          <header className="mt-6 max-w-3xl">
            <LandingHeroImage
              src="/marketing/lifestyle/hero-otono-streetwear.webp"
              alt="Comparación Novamente vs proveedores tradicionales — IA, DTG y producción on-demand"
            />
            <p className="mb-3 text-xs uppercase tracking-widest text-emerald-300">Comparativas de produccion</p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Novamente vs proveedores tradicionales: IA, DTG y produccion on-demand
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-zinc-300">
              Si queres vender indumentaria personalizada, no alcanza con preguntar precio por unidad. Tambien importan
              los minimos, la velocidad para probar disenos, el riesgo de stock y que tan facil es vender antes de producir.
            </p>
          </header>

          <section className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              { icon: Sparkles, label: "IA integrada", text: "Generas ideas y mockups sin empezar de cero." },
              { icon: Shirt, label: "DTG premium", text: "Ideal para pocas unidades y estampas complejas." },
              { icon: Boxes, label: "Sin stock", text: "Producis cuando hay pedido confirmado." },
              { icon: Zap, label: "Test rapido", text: "Probas colecciones antes de invertir fuerte." },
            ].map((item) => (
              <div key={item.label} className="nv-card p-5">
                <item.icon className="mb-4 h-6 w-6 text-emerald-300" />
                <h2 className="font-semibold">{item.label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </div>
            ))}
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-bold md:text-3xl">La comparacion que importa</h2>
            <div className="mt-6 overflow-hidden rounded-lg border border-zinc-800">
              <div className="grid grid-cols-3 bg-zinc-900 text-sm font-semibold text-zinc-200">
                <div className="p-4">Criterio</div>
                <div className="p-4">Novamente</div>
                <div className="p-4">Proveedor tradicional</div>
              </div>
              {comparison.map((row) => (
                <div key={row.criteria} className="grid grid-cols-1 border-t border-zinc-800 md:grid-cols-3">
                  <div className="bg-zinc-900/50 p-4 text-sm font-semibold text-zinc-100">{row.criteria}</div>
                  <div className="p-4 text-sm leading-relaxed text-zinc-300">{row.novamente}</div>
                  <div className="p-4 text-sm leading-relaxed text-zinc-400">{row.traditional}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-6">
              <Paintbrush className="mb-4 h-7 w-7 text-emerald-300" />
              <h2 className="text-2xl font-bold">Elegiria Novamente si...</h2>
              <ul className="mt-5 space-y-3 text-zinc-300">
                {[
                  "Todavia estas validando que disenos se venden.",
                  "Queres merch para banda, creador, evento o regalo personalizado.",
                  "Necesitas varias estampas distintas en poca cantidad.",
                  "Preferis vender primero y producir despues.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
              <Boxes className="mb-4 h-7 w-7 text-zinc-300" />
              <h2 className="text-2xl font-bold">Miraria una tirada tradicional si...</h2>
              <ul className="mt-5 space-y-3 text-zinc-300">
                {[
                  "Ya sabes exactamente que producto y arte vas a repetir.",
                  "Tenes volumen grande confirmado antes de producir.",
                  "El costo por unidad es mas importante que la flexibilidad.",
                  "No necesitas IA, storefront ni operacion on-demand.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
            <div className="mt-6 space-y-4">
              {faqItems.map((item) => (
                <div key={item.question} className="nv-card p-5">
                  <h3 className="font-semibold">{item.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="nv-card mt-16 p-8 text-center">
            <h2 className="text-2xl font-bold">Proba tu primer drop sin stock</h2>
            <p className="mx-auto mt-3 max-w-2xl text-zinc-300">
              Crea un diseno con IA, elegi una prenda y valida demanda sin comprar cajas de producto por adelantado.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/design"
                className="nv-cta-primary"
              >
                Disenar una prenda <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/lanza-tu-marca"
                className="nv-cta-secondary"
              >
                Lanzar mi marca
              </Link>
            </div>
          </section>
        </article>
      </main>
    </>
  )
}
