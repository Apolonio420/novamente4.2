import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calculator, Star, Shield, Clock, CheckCircle2,
  Truck, Palette, Sparkles, ArrowRight, Package,
  Users, MessageCircle, Zap
} from "lucide-react"
import CotizadorCalculator from "@/components/cotizador-calculator"

export const metadata: Metadata = {
  title: "Cotizador Express — Presupuesto Instantaneo Remeras y Buzos | Novamente",
  description:
    "Calcula el precio de tus remeras, buzos y hoodies personalizados al instante. Descuentos por cantidad: 5% desde 10 un., 10% desde 25, 15% desde 100. Estampado DTG premium. Envios a todo Argentina.",
  keywords: [
    "cotizar remeras personalizadas",
    "presupuesto remeras estampadas",
    "cuanto sale estampar remeras",
    "precio remeras personalizadas argentina",
    "cotizador ropa personalizada",
    "presupuesto buzos personalizados",
    "precio hoodie personalizado",
    "calculadora remeras",
    "cotizar estampado DTG",
    "presupuesto ropa corporativa",
  ],
  openGraph: {
    title: "Cotizador Express — Novamente",
    description:
      "Calcula el precio de tus remeras y buzos personalizados al instante. Descuentos por cantidad automaticos.",
    url: "https://www.novamente.ar/cotizador",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/products/remera-negra-front.jpeg",
        width: 800,
        height: 800,
        alt: "Cotizador Express — Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cotizador Express — Novamente",
    description:
      "Precio instantaneo para remeras, buzos y hoodies personalizados con descuentos por cantidad.",
  },
  alternates: { canonical: "https://www.novamente.ar/cotizador" },
}

export default function CotizadorPage() {
  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Cotizador Express — Novamente",
    description:
      "Calculadora de precios para remeras, buzos y hoodies personalizados con estampado DTG. Descuentos automaticos por cantidad.",
    url: "https://www.novamente.ar/cotizador",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "ARS",
      lowPrice: "21800",
      highPrice: "55000",
      offerCount: "8",
    },
    provider: {
      "@type": "Organization",
      name: "Novamente",
      url: "https://www.novamente.ar",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cual es el precio de una remera personalizada?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Las remeras personalizadas arrancan desde $21.800 (Musculosa Bali) hasta $31.000 (Aura Oversize). El precio incluye la prenda + estampado DTG premium con colores ilimitados. Con descuentos por cantidad podes ahorrar hasta 15%.",
        },
      },
      {
        "@type": "Question",
        name: "Hay descuentos por cantidad?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si! 5% OFF de 10 a 24 unidades, 10% OFF de 25 a 99 unidades, y 15% OFF desde 100 unidades. Los descuentos se aplican automaticamente en el cotizador.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto tarda la produccion?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La produccion estandar demora 2-5 dias habiles. Para pedidos grandes (50+ unidades) puede ser 7-10 dias. El envio adicional es de 3-10 dias habiles segun la zona.",
        },
      },
      {
        "@type": "Question",
        name: "Hay minimo de compra?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No, no hay minimo de compra. Podes pedir desde 1 unidad. Gracias a la tecnologia DTG, cada prenda se estampa individualmente sin necesidad de grandes tiradas.",
        },
      },
      {
        "@type": "Question",
        name: "Que incluye el precio?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "El precio incluye la prenda premium + estampado DTG de alta calidad con colores ilimitados. No hay costo extra por cantidad de colores ni por complejidad del diseno. El envio se cotiza aparte segun la zona.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo ver un mockup antes de pedir?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si! Podes usar nuestro disenador con IA en novamente.ar/crear para crear tu diseno y verlo aplicado en la prenda antes de confirmar el pedido. Es gratis y sin compromiso.",
        },
      },
    ],
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.novamente.ar" },
      { "@type": "ListItem", position: 2, name: "Cotizador Express", item: "https://www.novamente.ar/cotizador" },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="min-h-screen bg-zinc-950 text-white">
        {/* Hero */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-zinc-950 to-orange-900/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.15),transparent_50%)]" />
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-6 text-sm px-4 py-1">
              <Calculator className="w-4 h-4 mr-2" />
              Precio instantaneo — sin esperas
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Cotizador{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Express
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              Calcula el precio de tus remeras, buzos y hoodies personalizados{" "}
              <span className="text-amber-400 font-semibold">al instante</span>.
              Descuentos automaticos por cantidad.
            </p>

            {/* Trust bar */}
            <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                Sin compromiso
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Desde 1 unidad
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                Envios a todo el pais
              </div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                Colores ilimitados
              </div>
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4">
            <CotizadorCalculator />
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 md:py-20 bg-zinc-900/50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12">
              Como{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                funciona
              </span>
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: "1",
                  title: "Cotiza",
                  desc: "Elegí producto y cantidad. El precio se calcula al instante con descuentos automaticos.",
                  icon: Calculator,
                  color: "amber",
                },
                {
                  step: "2",
                  title: "Disena",
                  desc: "Usa nuestro disenador con IA o subi tu diseno. Colores ilimitados, sin costo extra.",
                  icon: Palette,
                  color: "purple",
                },
                {
                  step: "3",
                  title: "Producimos",
                  desc: "Estampamos cada prenda con tecnologia DTG premium. Produccion en 2-5 dias habiles.",
                  icon: Package,
                  color: "blue",
                },
                {
                  step: "4",
                  title: "Recibí",
                  desc: "Enviamos a todo el pais. Tu pedido llega listo para usar o vender.",
                  icon: Truck,
                  color: "green",
                },
              ].map((s) => (
                <Card key={s.step} className="bg-zinc-800/50 border-zinc-700 text-center">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                      s.color === "amber" ? "bg-amber-500/20" :
                      s.color === "purple" ? "bg-purple-500/20" :
                      s.color === "blue" ? "bg-blue-500/20" :
                      "bg-green-500/20"
                    }`}>
                      <s.icon className={`w-6 h-6 ${
                        s.color === "amber" ? "text-amber-400" :
                        s.color === "purple" ? "text-purple-400" :
                        s.color === "blue" ? "text-blue-400" :
                        "text-green-400"
                      }`} />
                    </div>
                    <div className="text-xs font-bold text-zinc-500 mb-1">PASO {s.step}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                    <p className="text-sm text-zinc-400">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Volume Discount Table */}
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
              Descuentos por{" "}
              <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Cantidad
              </span>
            </h2>
            <p className="text-zinc-400 text-center mb-10 text-lg">
              Mientras mas pedis, mas ahorrás. Descuentos automaticos sin codigo.
            </p>

            <div className="overflow-hidden rounded-2xl border border-zinc-700">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Cantidad</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-zinc-300">Descuento</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-300">Ejemplo (Remera Oversize)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  <tr className="bg-zinc-900/50">
                    <td className="px-6 py-4 text-white">1-9 unidades</td>
                    <td className="px-6 py-4 text-center text-zinc-400">Precio base</td>
                    <td className="px-6 py-4 text-right text-white">$31.000 c/u</td>
                  </tr>
                  <tr className="bg-zinc-900/30">
                    <td className="px-6 py-4 text-white font-medium">10-24 unidades</td>
                    <td className="px-6 py-4 text-center">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">5% OFF</Badge>
                    </td>
                    <td className="px-6 py-4 text-right text-green-400 font-medium">$29.450 c/u</td>
                  </tr>
                  <tr className="bg-zinc-900/50">
                    <td className="px-6 py-4 text-white font-medium">25-99 unidades</td>
                    <td className="px-6 py-4 text-center">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">10% OFF</Badge>
                    </td>
                    <td className="px-6 py-4 text-right text-green-400 font-medium">$27.900 c/u</td>
                  </tr>
                  <tr className="bg-zinc-900/30">
                    <td className="px-6 py-4 text-white font-bold">100+ unidades</td>
                    <td className="px-6 py-4 text-center">
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">15% OFF</Badge>
                    </td>
                    <td className="px-6 py-4 text-right text-amber-400 font-bold">$26.350 c/u</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-20 bg-zinc-900/50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12">
              Lo que dicen nuestros{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                clientes
              </span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: "Mariana G.",
                  role: "Organizadora de eventos",
                  text: "Cotice 200 remeras para una maraton y en 2 minutos tenia el presupuesto. El precio con descuento por cantidad fue imbatible.",
                  rating: 5,
                },
                {
                  name: "Federico L.",
                  role: "Dueno de marca streetwear",
                  text: "Uso el cotizador cada vez que planeo un drop. Me permite calcular margenes al instante y decidir precios de venta.",
                  rating: 5,
                },
                {
                  name: "Carolina T.",
                  role: "RRHH - Empresa tech",
                  text: "Necesitabamos buzos de onboarding y el cotizador nos dio el precio exacto. Mandamos el presupuesto a gerencia y aprobaron en el dia.",
                  rating: 5,
                },
              ].map((t) => (
                <Card key={t.name} className="bg-zinc-800/50 border-zinc-700">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-zinc-300 text-sm mb-4 italic">&quot;{t.text}&quot;</p>
                    <div>
                      <div className="font-semibold text-white text-sm">{t.name}</div>
                      <div className="text-xs text-zinc-500">{t.role}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12">
              Preguntas{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Frecuentes
              </span>
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Cual es el precio de una remera personalizada?",
                  a: "Las remeras personalizadas arrancan desde $21.800 (Musculosa Bali) hasta $31.000 (Aura Oversize). El precio incluye la prenda + estampado DTG premium con colores ilimitados. Con descuentos por cantidad podes ahorrar hasta 15%.",
                },
                {
                  q: "Hay descuentos por cantidad?",
                  a: "Si! 5% OFF de 10 a 24 unidades, 10% OFF de 25 a 99 unidades, y 15% OFF desde 100 unidades. Los descuentos se aplican automaticamente en el cotizador.",
                },
                {
                  q: "Cuanto tarda la produccion?",
                  a: "La produccion estandar demora 2-5 dias habiles. Para pedidos grandes (50+ unidades) puede ser 7-10 dias. El envio adicional es de 3-10 dias habiles segun la zona.",
                },
                {
                  q: "Hay minimo de compra?",
                  a: "No, no hay minimo de compra. Podes pedir desde 1 unidad. Gracias a la tecnologia DTG, cada prenda se estampa individualmente sin necesidad de grandes tiradas.",
                },
                {
                  q: "Que incluye el precio?",
                  a: "El precio incluye la prenda premium + estampado DTG de alta calidad con colores ilimitados. No hay costo extra por cantidad de colores ni por complejidad del diseno. El envio se cotiza aparte segun la zona.",
                },
                {
                  q: "Puedo ver un mockup antes de pedir?",
                  a: "Si! Podes usar nuestro disenador con IA en novamente.ar/crear para crear tu diseno y verlo aplicado en la prenda antes de confirmar el pedido. Es gratis y sin compromiso.",
                },
              ].map((faq) => (
                <Card key={faq.q} className="bg-zinc-800/50 border-zinc-700">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-white mb-2">{faq.q}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-amber-900/30 via-zinc-950 to-orange-900/20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Listo para{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                pedir?
              </span>
            </h2>
            <p className="text-xl text-zinc-300 mb-10">
              Calcula tu presupuesto arriba y pedí por WhatsApp, o empeza a disenar con IA ahora mismo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-black text-base font-semibold h-14 px-8"
              >
                <Link href="/crear">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Disenar con IA
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-zinc-600 text-white hover:bg-zinc-800 text-base h-14 px-8"
              >
                <Link href="/products">
                  <Package className="w-5 h-5 mr-2" />
                  Ver Catalogo Completo
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
