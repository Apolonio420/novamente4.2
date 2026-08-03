import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles } from "lucide-react"
import {
  ALL_GARMENT_PRICING,
  getPartnerPlanPrice,
  getPlanMargin,
} from "@/lib/partners/garment-pricing.server"
import { formatPrice } from "@/lib/partners/format-price"
import { PlanCards } from "./PlanCards"

export const metadata: Metadata = {
  title: "Planes y precios — Studio",
  description:
    "Conocé los planes de Novamente Studio: Starter gratis, Growth USD$50/mes con prendas al costo Novamente, y Pro USD$100/mes con chatbot WhatsApp/Instagram y automatización de contenido para tu marca.",
  alternates: { canonical: "https://www.novamente.ar/studio/planes" },
  openGraph: {
    title: "Planes Novamente Studio — Starter, Growth, Pro",
    description:
      "Lanzá tu marca con Novamente. 3 planes: Starter gratis, Growth USD$50, Pro USD$100. Producción on-demand, sin stock.",
    url: "https://www.novamente.ar/studio/planes",
  },
}

const baseUrl = "https://www.novamente.ar"

// JSON-LD para los 3 planes como Product / Offer
const planSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Novamente Studio",
  description: "Plataforma para que marcas y creadores lancen su tienda online con producción on-demand.",
  brand: { "@type": "Brand", name: "Novamente" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "100",
    offerCount: 3,
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "0",
        priceCurrency: "USD",
        description: "Plan gratis para empezar. Tienda online + producción on-demand.",
        url: `${baseUrl}/lanza-tu-marca`,
      },
      {
        "@type": "Offer",
        name: "Growth",
        price: "50",
        priceCurrency: "USD",
        description: "Plan para marcas en crecimiento. Prendas al costo Novamente + branding completo + analytics.",
        url: `${baseUrl}/studio/planes`,
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "100",
        priceCurrency: "USD",
        description: "Plan completo con chatbot WhatsApp/Instagram + automatización de contenido + setup Meta Ads.",
        url: `${baseUrl}/studio/planes`,
      },
    ],
  },
}

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${baseUrl}/` },
    { "@type": "ListItem", position: 2, name: "Studio", item: `${baseUrl}/studio` },
    { "@type": "ListItem", position: 3, name: "Planes", item: `${baseUrl}/studio/planes` },
  ],
}

// FAQ schema — preguntas frecuentes sobre los planes
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Cuál es la diferencia entre Starter, Growth y Pro?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Starter es gratis: storefront propio, diseño con IA, hasta 10 productos y 20 leads/mes, prendas a precio partner (mismo precio que /b2b-precios-2026). Growth (USD$50/mes) suma productos y leads ilimitados, SEO completo, Design Engine, analytics y un precio aún más bajo por prenda. Pro (USD$100/mes) suma chatbot WhatsApp + Instagram DM, automatización de contenido IG/FB/X, setup Meta Business, plantillas de Meta Ads y onboarding 1:1.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo se comparan los precios entre planes?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Los partners Starter pagan el precio publicado en /b2b-precios-2026 (por ejemplo, una remera Aldea $25.800 en lugar de $28.600 retail). Los partners Growth y Pro acceden a un precio aún más competitivo (Aldea $23.670, Buzo Hoodie $31.170) que multiplica el margen al vender a retail web. Mismo precio para todos los colores dentro de cada familia.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo cambiar de plan en cualquier momento?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Podés empezar en Starter sin tarjeta, upgradear a Growth cuando empieces a vender, y a Pro cuando necesites el chatbot y la automatización. También se puede bajar de plan o cancelar cuando quieras, sin compromiso.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué incluye el chatbot del plan Pro?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "El plan Pro incluye un chatbot personalizado para WhatsApp e Instagram DM que atiende consultas, ofrece productos y cierra ventas 24/7. También viene con setup completo de Meta Business, plantillas de Meta Ads, feed Meta Commerce, y automatización de contenido para postear en Instagram, Facebook y X.",
      },
    },
    {
      "@type": "Question",
      name: "¿Los planes anuales tienen descuento?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Además, por lanzamiento Growth tiene 50% OFF el primer año para los primeros 100 partners: US$25/mes (mensual) o US$255 el primer año (anual). Pasado el primer año, el plan anual mantiene 15% de descuento: Growth US$42.5/mes (US$510/año) y Pro US$85/mes (US$1.020/año). El pago se factura en ARS al tipo de cambio del día.",
      },
    },
    {
      "@type": "Question",
      name: "¿Aparezco en el directorio /marcas?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Todas las marcas con storefront publicado aparecen en novamente.ar/marcas. Los planes Pro aparecen primero (badge destacado), después Growth (badge Growth), después Starter. El orden dentro de cada plan es por completitud del perfil.",
      },
    },
  ],
}

// HowTo schema — como elegir tu plan
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Cómo elegir tu plan de Novamente Studio",
  description: "Guía rápida para decidir entre los planes Starter (gratis), Growth (USD$50) y Pro (USD$100).",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Empezá con Starter si estás probando",
      text: "Si todavía no tenés audiencia o estás validando si querés vender ropa, arrancá con Starter (gratis). Tenés storefront, IA y producción on-demand. Prendas a precio partner publicado en /b2b-precios-2026.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Upgradeá a Growth cuando empieces a vender",
      text: "Cuando estés haciendo 10+ ventas/mes, el plan Growth (USD$50/mes) se paga solo: pagás cada prenda más cerca del costo que en Starter, así que tu margen vendiendo a retail web sube. También sumás SEO, analytics y branding avanzado.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Subí a Pro cuando quieras escalar con automatización",
      text: "El plan Pro (USD$100/mes) suma chatbot WhatsApp + Instagram DM que vende por vos 24/7, automatización de contenido para IG/FB/X, setup Meta Business, plantillas de ads y onboarding 1:1. Ideal cuando ya no podés escalar manualmente.",
    },
  ],
}

// Productos a mostrar en la grilla de precios
const FEATURED_GARMENTS = [
  "aldea-classic-tshirt",
  "aura-oversize-tshirt",
  "remera-clasica-mujer",
  "remera-crop-mujer",
  "musculosa-bali",
  "buzo-cuello-redondo",
  "buzo-hoodie-unisex",
]

export default function PlanesPage() {
  return (
    <div className="container mx-auto px-4 py-10 md:py-16 max-w-6xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(planSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

      {/* Header */}
      <header className="text-center mb-12 md:mb-16">
        <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase border-primary/30 text-primary">
          <Sparkles className="w-3 h-3 mr-1.5" />
          Novamente Studio
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">Planes y precios transparentes</h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
          Lanzá tu marca de ropa con tienda propia, producción on-demand y diseño con IA. Sin stock, sin riesgo.
          Empezá gratis y escalá cuando quieras.
        </p>
      </header>

      {/* Plan cards with Mensual/Anual toggle */}
      <PlanCards />


      {/* Grilla de precios de prendas */}
      <section className="mb-16 md:mb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Cuánto pagás por cada prenda</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            En Starter ya pagás precios partner (más bajos que retail web). En Growth y Pro el precio baja aún más
            — vendés al mismo retail y multiplicás tu margen.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b border-border/40">
                <th className="text-left py-4 px-4 font-semibold">Producto</th>
                <th className="text-right py-4 px-4 font-medium text-muted-foreground">
                  Retail web
                  <div className="text-[10px] font-normal mt-0.5">precio público</div>
                </th>
                <th className="text-right py-4 px-4 font-medium text-muted-foreground">
                  Starter
                  <div className="text-[10px] font-normal mt-0.5">plan gratis</div>
                </th>
                <th className="text-right py-4 px-4 font-semibold text-primary bg-primary/5">
                  Growth · Pro
                  <div className="text-[10px] font-normal mt-0.5 text-muted-foreground">USD$50–100/mes</div>
                </th>
                <th className="text-right py-4 px-4 font-medium text-muted-foreground">
                  Tu margen Growth
                  <div className="text-[10px] font-normal mt-0.5">vendiendo a retail</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURED_GARMENTS.map(key => {
                const garment = ALL_GARMENT_PRICING[key]
                if (!garment) return null
                const retailPrice = garment.b2c_suggested
                const starterPrice = getPartnerPlanPrice(key, "starter")!
                const growthPrice = getPartnerPlanPrice(key, "growth")!
                const margin = getPlanMargin(key, "growth")
                return (
                  <tr key={key} className="border-b border-border/20 last:border-0 hover:bg-muted/20">
                    <td className="py-4 px-4 font-medium">{garment.name}</td>
                    <td className="py-4 px-4 text-right text-muted-foreground">{formatPrice(retailPrice)}</td>
                    <td className="py-4 px-4 text-right text-muted-foreground">{formatPrice(starterPrice)}</td>
                    <td className="py-4 px-4 text-right font-bold text-primary bg-primary/5">
                      {formatPrice(growthPrice)}
                    </td>
                    <td className="py-4 px-4 text-right text-emerald-500 font-medium">+{formatPrice(margin)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Precios en ARS. Retail web es el precio público sugerido para vender en tu storefront. Precios sujetos a actualización por inflación.
        </p>
      </section>

      {/* CTA final */}
      <section className="text-center max-w-2xl mx-auto">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-600/5 p-8 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">¿Listo para lanzar tu marca?</h2>
          <p className="text-muted-foreground mb-6">
            Empezá con el plan Starter sin tarjeta. Cuando estés vendiendo, upgrade a Growth y multiplicá tu margen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/partners/join">
              <Button size="lg">Empezar gratis</Button>
            </Link>
            <Link href="/studio">
              <Button size="lg" variant="outline">
                Conocer Novamente Studio
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
