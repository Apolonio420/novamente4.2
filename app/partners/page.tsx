import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LandingHeroImage } from "@/components/LandingHeroImage"
import { PartnersHeroCTAs } from "@/components/PartnersHeroCTAs"
import {
  ArrowRight, Store, Palette, BarChart3, Bot,
  Zap, Shield, Globe, Sparkles,
  Compass, LogIn, ShoppingBag,
} from "lucide-react"
import type { Plan } from "@/lib/partners/types"
import { PartnersPricing } from "./PartnersPricing"

export const metadata: Metadata = {
  title: "Novamente Studio — Lanzá tu marca con storefront, IA y growth",
  description: "La unidad de Novamente para marcas y negocios: storefront, catalogo, diseño con IA, leads y operaciones sin stock ni logistica.",
  alternates: {
    canonical: "https://www.novamente.ar/partners",
  },
  openGraph: {
    type: "website",
    url: "https://www.novamente.ar/partners",
    title: "Novamente Studio — Lanzá tu marca",
    description: "Storefront, catalogo, diseño con IA y growth comercial para marcas, creadores y negocios.",
    images: [{ url: "https://www.novamente.ar/novamente-logo.png", width: 1200, height: 630, alt: "Novamente Studio" }],
    siteName: "Novamente",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Novamente Studio — Lanzá tu marca",
    description: "Storefront, catalogo, diseño con IA y growth comercial para marcas, creadores y negocios.",
    images: ["https://www.novamente.ar/novamente-logo.png"],
  },
}

const FEATURES = [
  {
    icon: Store,
    title: "Tu storefront lista",
    description: "Página profesional con tu logo, colores y productos. Lista en minutos, sin código.",
  },
  {
    icon: Palette,
    title: "Design Engine con IA",
    description: "Generá diseños y mockups con inteligencia artificial. 37 estilos artísticos disponibles.",
  },
  {
    icon: Globe,
    title: "SEO & Discovery",
    description: "Tu tienda optimizada para Google, buscadores AI y redes sociales desde el día uno.",
  },
  {
    icon: Bot,
    title: "Chatbot de ventas",
    description: "Asistente WhatsApp que vende por vos 24/7. Setup completo de Meta Business incluido.",
  },
  {
    icon: BarChart3,
    title: "Analytics y leads",
    description: "Dashboard con métricas, leads y pedidos. Sabé exactamente cómo rinde tu tienda.",
  },
  {
    icon: Shield,
    title: "Cero stock, cero riesgo",
    description: "Nosotros producimos, almacenamos y enviamos. Vos solo vendés y cobrás.",
  },
]

const TIERS: { plan: Plan; popular?: boolean; features: string[] }[] = [
  {
    plan: 'starter',
    features: [
      'Storefront con tu marca',
      'Logo, colores y banner',
      'Hasta 10 productos',
      '20 leads por mes',
      'Aparece en el directorio /marcas',
      'Prendas a precio retail (margen menor)',
      'Badge "Powered by Novamente"',
    ],
  },
  {
    plan: 'growth',
    popular: true,
    features: [
      'Todo lo de Starter +',
      'Prendas al costo Novamente (margen alto)',
      'Branding avanzado (fuentes, estilos, CTA)',
      'Productos ilimitados',
      'Leads ilimitados',
      'SEO completo + indexación',
      'Design Engine (mockups + estilos)',
      'Analytics básico',
      'Destacado en /marcas (badge Growth)',
      'Sin badge de Novamente',
      'Soporte por email',
    ],
  },
  {
    plan: 'pro',
    features: [
      'Todo lo de Growth +',
      'Chatbot WhatsApp + Instagram DM',
      'Automatización de contenido IG / FB / X',
      'Setup Meta Business completo',
      'Plantillas de Meta Ads',
      'Design Engine completo (brand-fit)',
      'Analytics avanzado',
      'Feed Meta Commerce / Google',
      'Top del directorio /marcas (badge Pro)',
      'Soporte WhatsApp prioritario',
      'Onboarding call 1:1',
    ],
  },
]

const partnersFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Qué es Novamente Studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Novamente Studio es la unidad de Novamente para empresas, marcas y emprendedores que quieren vender con una presencia digital más profesional. Incluye storefront personalizada, diseño con IA, producción on-demand, precios mayoristas, leads y envío a todo Argentina.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cuánto cuesta Novamente Studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hay 3 planes: Starter es gratis (hasta 10 productos, 20 leads/mes, prendas a precio retail). Growth cuesta USD$50/mes y suma productos ilimitados, SEO, Design Engine, analytics y prendas al costo Novamente (margen alto para el partner). Pro cuesta USD$100/mes y suma chatbot WhatsApp + Instagram, automatización de contenido para IG/FB/X, Meta Ads y onboarding 1:1.",
      },
    },
    {
      "@type": "Question",
      name: "¿Necesito tener stock o logística?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Novamente se encarga de toda la producción, almacenamiento y envío. La marca solo se dedica a vender y cobrar. Producción on-demand significa cero riesgo de inventario.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué incluye la storefront de Studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cada marca recibe una página profesional en novamente.ar con su logo, colores y productos. Todos los planes incluyen branding básico (logo, banner, colores). Los planes Growth y Pro suman SEO, branding avanzado e indexación en Google con Design Engine con IA.",
      },
    },
  ],
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.novamente.ar/" },
    { "@type": "ListItem", position: 2, name: "Studio", item: "https://www.novamente.ar/partners" },
  ],
}

export default function PartnersPage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(partnersFaqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* ── Audience Router — clarifica quién es el visitante ───────────── */}
      <section className="border-b border-zinc-800/60 bg-zinc-950/60 py-10 md:py-14">
        <div className="container mx-auto px-4">
          <p className="mb-6 text-center text-xs uppercase tracking-widest text-zinc-500">
            ¿A qué venís?
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="#pricing"
              className="group flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-purple-500/60 hover:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                  Quiero lanzar mi marca
                </p>
              </div>
              <h3 className="text-lg font-bold text-zinc-100 md:text-xl">
                Soy emprendedor o creador
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Storefront propio, catálogo, IA para diseñar y leads. Sin stock ni logística. Empezás gratis.
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-purple-300 group-hover:text-purple-200">
                Ver planes y precios <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <Link
              href="/partners/directory"
              className="group flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-pink-500/60 hover:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-pink-500/10 p-2 text-pink-400">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-pink-300">
                  Busco merch de una marca
                </p>
              </div>
              <h3 className="text-lg font-bold text-zinc-100 md:text-xl">
                Soy fan / cliente final
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Explorá los storefronts de bandas, creadores y marcas que producen con nosotros. Compra directa.
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-pink-300 group-hover:text-pink-200">
                Ver directorio de marcas <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <Link
              href="/partners/login"
              className="group flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-emerald-500/60 hover:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
                  <LogIn className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Ya tengo workspace
                </p>
              </div>
              <h3 className="text-lg font-bold text-zinc-100 md:text-xl">
                Soy partner activo
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Entrá al workspace para gestionar tu catálogo, ver órdenes, leads y campañas Meta.
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-emerald-300 group-hover:text-emerald-200">
                Iniciar sesión <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-10">
              <LandingHeroImage
                src="/marketing/lifestyle/hero-partners-storefront.webp"
                alt="Founder argentina con su prenda de marca propia producida por Novamente Studio"
              />
            </div>
            <Badge className="mb-6 bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20">
              NOVAMENTE STUDIO
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Lanzá tu marca con
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400"> storefront, IA y growth</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              La unidad de Novamente para marcas, creadores y negocios que quieren verse más pro,
              vender mejor y operar sin stock ni logística propia.
            </p>
            <PartnersHeroCTAs />
            <p className="mt-4 text-sm text-zinc-500">
              ¿Ya tenés tu workspace?{" "}
              <Link href="/partners/login" className="text-purple-400 hover:text-purple-300 underline">
                Iniciá sesión
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Todo lo que necesitás para vender</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Una plataforma completa para que tu marca tenga presencia profesional desde el primer día.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Cómo funciona</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Registrate", desc: "Creá tu cuenta y cargá tu marca en minutos." },
              { step: "02", title: "Configurá", desc: "Logo, colores, productos y estilo visual." },
              { step: "03", title: "Publicá", desc: "Tu storefront queda online al instante." },
              { step: "04", title: "Vendé", desc: "Recibí leads y pedidos. Nosotros producimos y enviamos." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">{item.step}</span>
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 border-t border-zinc-800/50" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planes transparentes</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Empezá gratis y escalá cuando quieras. Todos los planes incluyen acceso a precios mayoristas.
            </p>
          </div>
          <PartnersPricing tiers={TIERS} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t border-zinc-800/50">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para lanzar tu marca?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Sumate a Novamente Studio y empezá a vender con una presencia digital más fuerte y tu identidad bien cuidada.
            Sin inversión inicial, sin riesgo.
          </p>
          <Link href="/partners/join">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200 font-semibold px-8 h-12 text-base">
              Crear mi storefront
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-zinc-500">
            <Link href="/partners/terms" className="hover:text-zinc-300 transition-colors">
              Terminos y Condiciones
            </Link>
            <span className="text-zinc-700">|</span>
            <Link href="/partners/privacy" className="hover:text-zinc-300 transition-colors">
              Politica de Privacidad
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
