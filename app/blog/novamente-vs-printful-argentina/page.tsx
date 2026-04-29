import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, Globe2, MapPin, Sparkles, Store, Truck } from "lucide-react"
import { LandingHeroImage } from '@/components/LandingHeroImage'

export const metadata: Metadata = {
  title: "Novamente vs Printful en Argentina: que conviene para vender merch",
  description:
    "Comparativa practica para marcas argentinas: Novamente vs Printful. Produccion local, IA, DTG, envios, soporte, costos ocultos y experiencia de compra para clientes de Argentina.",
  alternates: { canonical: "https://www.novamente.ar/blog/novamente-vs-printful-argentina" },
  openGraph: {
    title: "Novamente vs Printful en Argentina",
    description:
      "Como elegir entre una plataforma local de merch con IA y una plataforma global de print-on-demand.",
    url: "https://www.novamente.ar/blog/novamente-vs-printful-argentina",
    type: "article",
  },
}

const rows = [
  {
    criteria: "Cliente principal",
    novamente: "Marcas, creadores, bandas y compradores argentinos que quieren merch local sin stock.",
    alternative: "Marcas que venden internacionalmente y necesitan una red global de fulfillment.",
  },
  {
    criteria: "Diseno",
    novamente: "IA generativa integrada, mockups y 37 estilos artisticos para crear estampas desde una idea.",
    alternative: "El vendedor normalmente sube artes ya preparados o usa herramientas externas.",
  },
  {
    criteria: "Produccion",
    novamente: "Produccion local en Argentina con DTG y foco en prendas de uso real para el mercado local.",
    alternative: "Red global de print-on-demand con catalogo amplio y fulfillment internacional.",
  },
  {
    criteria: "Experiencia del comprador argentino",
    novamente: "Precios en ARS, WhatsApp, Mercado Pago y envios dentro de Argentina.",
    alternative: "Puede requerir revisar moneda, impuestos, tiempos internacionales y condiciones de envio vigentes.",
  },
  {
    criteria: "Marca propia",
    novamente: "Storefront dentro de novamente.ar, catalogo, leads y workspace para operar sin desarrollar ecommerce.",
    alternative: "Suele integrarse con Shopify, Etsy, WooCommerce u otro ecommerce externo.",
  },
]

const faqItems = [
  {
    question: "Novamente reemplaza a Printful?",
    answer:
      "No necesariamente. Novamente esta pensado para vender y producir merch en Argentina con IA, DTG, soporte local y precios en ARS. Printful es una plataforma global de print-on-demand, util si tu prioridad es vender a multiples mercados internacionales.",
  },
  {
    question: "Que conviene si vendo solo en Argentina?",
    answer:
      "Para una marca argentina que quiere vender a clientes argentinos, suele convenir priorizar produccion local, pagos locales, WhatsApp, tiempos claros y soporte cercano. Ese es el caso de uso donde Novamente esta optimizado.",
  },
  {
    question: "Puedo usar Novamente si todavia no tengo disenos?",
    answer:
      "Si. Novamente incluye generacion de disenos con inteligencia artificial y mockups para que una marca pueda probar ideas antes de invertir en stock.",
  },
]

export default function NovamenteVsPrintfulArgentina() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Novamente vs Printful en Argentina: que conviene para vender merch",
    description:
      "Comparativa practica entre Novamente y Printful para marcas argentinas que quieren vender merch personalizado.",
    author: { "@type": "Organization", name: "Novamente", url: "https://www.novamente.ar" },
    publisher: {
      "@type": "Organization",
      "@id": "https://www.novamente.ar/#organization",
      name: "Novamente",
    },
    datePublished: "2026-04-29",
    dateModified: "2026-04-29",
    mainEntityOfPage: "https://www.novamente.ar/blog/novamente-vs-printful-argentina",
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
              src="/marketing/lifestyle/hero-merch-personalizado.webp"
              alt="Comparación Novamente vs Printful — producción local Argentina vs proveedor internacional"
            />
            <p className="mb-3 text-xs uppercase tracking-widest text-cyan-300">Comparativas para marcas argentinas</p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Novamente vs Printful en Argentina: que conviene para vender merch
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-zinc-300">
              La pregunta no es cual plataforma es "mejor" en abstracto. La pregunta util es donde vendes, que
              experiencia queres darle al cliente y cuanto control necesitas sobre diseno, tiempos y soporte local.
            </p>
          </header>

          <section className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              { icon: MapPin, label: "Foco local", text: "Argentina, ARS, WhatsApp y Mercado Pago." },
              { icon: Sparkles, label: "Diseno con IA", text: "De idea a estampa sin contratar disenador." },
              { icon: Truck, label: "On-demand", text: "Producis cuando vendes, sin stock muerto." },
              { icon: Store, label: "Storefront", text: "Presencia digital lista para tu marca." },
            ].map((item) => (
              <div key={item.label} className="nv-card p-5">
                <item.icon className="mb-4 h-6 w-6 text-cyan-300" />
                <h2 className="font-semibold">{item.label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </div>
            ))}
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-bold md:text-3xl">Comparacion rapida</h2>
            <div className="mt-6 overflow-hidden rounded-lg border border-zinc-800">
              <div className="grid grid-cols-3 bg-zinc-900 text-sm font-semibold text-zinc-200">
                <div className="p-4">Criterio</div>
                <div className="p-4">Novamente</div>
                <div className="p-4">Printful / POD global</div>
              </div>
              {rows.map((row) => (
                <div key={row.criteria} className="grid grid-cols-1 border-t border-zinc-800 md:grid-cols-3">
                  <div className="bg-zinc-900/50 p-4 text-sm font-semibold text-zinc-100">{row.criteria}</div>
                  <div className="p-4 text-sm leading-relaxed text-zinc-300">{row.novamente}</div>
                  <div className="p-4 text-sm leading-relaxed text-zinc-400">{row.alternative}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold">Cuando conviene Novamente</h2>
              <ul className="mt-5 space-y-3 text-zinc-300">
                {[
                  "Tu comprador esta en Argentina y espera pagar en pesos.",
                  "Necesitas crear disenos rapido, incluso si todavia no tenes un equipo creativo.",
                  "Queres vender merch sin armar una tienda desde cero.",
                  "Te importa tener soporte local y una operacion mas cercana.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Cuando mirar una opcion global</h2>
              <ul className="mt-5 space-y-3 text-zinc-300">
                {[
                  "Tu mercado principal esta fuera de Argentina.",
                  "Ya tenes un ecommerce internacional armado.",
                  "Necesitas un catalogo global muy amplio mas que una experiencia local curada.",
                  "Tu operacion depende de integraciones internacionales especificas.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-14 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-6 md:p-8">
            <Clock className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-bold">La decision practica</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-zinc-300">
              Si vendes en Argentina, la friccion mata conversion: moneda, soporte, tiempos, medios de pago y confianza.
              Novamente se enfoca en resolver ese recorrido local. Si tu negocio ya es global, una red internacional
              puede tener sentido para otros mercados.
            </p>
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
            <h2 className="text-2xl font-bold">Queres vender merch en Argentina?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-zinc-300">
              Crea tu prenda con IA o arma tu storefront para vender sin stock. Produccion local, DTG y envios a todo el pais.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/design"
                className="nv-cta-primary"
              >
                Disenar con IA <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/partners"
                className="nv-cta-secondary"
              >
                Ver Novamente Studio
              </Link>
            </div>
          </section>
        </article>
      </main>
    </>
  )
}
