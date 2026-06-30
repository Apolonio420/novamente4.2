"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, MessageCircle, Zap, TrendingUp } from "lucide-react"
import { firstYearPromoPct } from "@/lib/partners/plans"
import { formatUsdPrice } from "@/lib/partners/plan-display"

export function PlanCards() {
  const [annual, setAnnual] = useState(false)
  const growthPromo = firstYearPromoPct("growth")
  const growth = formatUsdPrice(50, annual, growthPromo)
  const pro = formatUsdPrice(100, annual)

  return (
    <>
      {/* Billing toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center rounded-full border border-border/60 bg-card/50 p-1">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
              !annual ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
              annual ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anual
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                annual ? "bg-emerald-500 text-white" : "bg-emerald-500/20 text-emerald-500"
              }`}
            >
              −15%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-24">
        {/* Starter */}
        <article className="rounded-2xl border border-border/40 bg-card/50 p-6 md:p-8 flex flex-col">
          <header className="mb-6">
            <h2 className="text-2xl font-bold mb-1">Starter</h2>
            <p className="text-sm text-muted-foreground">Para arrancar y probar el modelo.</p>
          </header>
          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold">Gratis</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Por siempre. Sin tarjeta.</p>
          </div>
          <ul className="space-y-3 text-sm flex-1 mb-6">
            {[
              "Storefront propio en novamente.ar/p/tu-marca",
              "Logo, colores, banner y branding básico",
              "Hasta 10 productos publicados",
              "20 leads / mes",
              "Diseño con IA (37 estilos)",
              "Producción on-demand sin stock",
              "Aparece en el directorio público /marcas",
              "Prendas a precio partner B2B",
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link href="/partners/join">
            <Button variant="outline" className="w-full" size="lg">
              Empezar gratis
            </Button>
          </Link>
        </article>

        {/* Growth — destacado */}
        <article className="rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/10 to-purple-600/10 p-6 md:p-8 flex flex-col relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-white text-[10px] tracking-widest uppercase">Más popular</Badge>
          </div>
          <header className="mb-6">
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
              Growth
              <TrendingUp className="w-5 h-5 text-primary" />
            </h2>
            <p className="text-sm text-muted-foreground">Para marcas que quieren crecer en serio.</p>
          </header>
          <div className="mb-6">
            {growthPromo > 0 && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 shadow-lg shadow-orange-500/30 animate-pulse">
                  🔥 {Math.round(growthPromo * 100)}% OFF · 1<sup>er</sup> año
                </span>
              </div>
            )}
            {growth.strike && (
              <span className="text-xs text-muted-foreground line-through block mb-1">{growth.strike}/mes</span>
            )}
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className={`font-bold tracking-tight ${annual ? "text-4xl" : "text-5xl"}`}>
                {growth.main}
              </span>
              <span className="text-sm text-muted-foreground">/mes</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{growth.sub}</p>
            {growthPromo > 0 && (
              <p className="text-[11px] font-semibold text-amber-500 mt-1">⚡ Solo para los primeros 100 partners</p>
            )}
          </div>
          <ul className="space-y-3 text-sm flex-1 mb-6">
            {[
              "Todo lo del plan Starter",
              "Mejor precio por prenda (margen más alto)",
              "Productos ilimitados",
              "Leads ilimitados",
              "Branding avanzado (fuentes, estilos, CTA custom)",
              "SEO completo + indexación + sitemap",
              "Design Engine completo (mockups + estilos)",
              "Analytics y dashboard de ventas",
              "Destacado en /marcas (badge Growth)",
              "Soporte por email prioritario",
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link href="/partners/join">
            <Button className="w-full" size="lg">
              Elegir Growth
            </Button>
          </Link>
        </article>

        {/* Pro */}
        <article className="rounded-2xl border border-purple-600/40 bg-gradient-to-br from-purple-950/30 to-pink-950/20 p-6 md:p-8 flex flex-col">
          <header className="mb-6">
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
              Pro
              <Zap className="w-5 h-5 text-pink-400" />
            </h2>
            <p className="text-sm text-muted-foreground">La experiencia completa con automatización de marketing.</p>
          </header>
          <div className="mb-6">
            {pro.strike && (
              <span className="text-xs text-muted-foreground line-through block mb-1">{pro.strike}/mes</span>
            )}
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className={`font-bold tracking-tight ${annual ? "text-4xl" : "text-5xl"}`}>
                {pro.main}
              </span>
              <span className="text-sm text-muted-foreground">/mes</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{pro.sub}</p>
          </div>
          <ul className="space-y-3 text-sm flex-1 mb-6">
            {[
              "Todo lo del plan Growth",
              <span key="chatbot" className="font-medium">
                <MessageCircle className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-pink-400" />
                Chatbot WhatsApp + Instagram DM
              </span>,
              <span key="content" className="font-medium">
                <Sparkles className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-pink-400" />
                Automatización de contenido IG / FB / X
              </span>,
              "Setup Meta Business completo",
              "Plantillas de Meta Ads incluidas",
              "Feed Meta Commerce / Google Shopping",
              "Analytics avanzado + atribución",
              "Top del directorio /marcas (badge Pro)",
              "Onboarding 1:1 (60 min)",
              "Soporte WhatsApp prioritario",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link href="/partners/join">
            <Button variant="outline" className="w-full border-purple-600/60 hover:bg-purple-600/10" size="lg">
              Elegir Pro
            </Button>
          </Link>
        </article>
      </section>
    </>
  )
}
