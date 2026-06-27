import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import B2BCatalog from "./B2BCatalog"
import UnifiedPriceTable from "./UnifiedPriceTable"
import { TIERS, MODELS, MODEL_TO_GARMENT_KEY } from "./data"
import { getGrowthPrice } from "@/lib/partners/garment-pricing"

export const metadata: Metadata = {
  title: "Catalogo B2B Novamente — Tarifas Exclusivas 2026",
  description: "Tarifas mayoristas Novamente para socios estrategicos.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: undefined },
}

export default function B2BPricesPage() {
  // Precio Growth "desde (1u)" derivado en el server: al cliente solo le llega el
  // precio final, nunca el costo de produccion del que se deriva (regla innegociable).
  const growthByModel: Record<string, number | null> = Object.fromEntries(
    MODELS.map((m) => [m.id, getGrowthPrice(MODEL_TO_GARMENT_KEY[m.id], "partner") ?? m.growthPartner ?? null])
  )

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Material confidencial · Socios estrategicos Novamente
        </p>
        <h1 className="novamente-heading text-4xl md:text-5xl mb-4">
          Catalogo B2B Novamente
        </h1>
        <p className="text-xl text-muted-foreground mb-4">Tarifas Exclusivas 2026</p>
        <p className="max-w-3xl mx-auto text-muted-foreground">
          Novamente redisenio su estructura comercial para ofrecer mayor transparencia y
          escalabilidad a sus socios estrategicos. Tarifa unica por modelo de prenda, sin
          diferenciar precios por color. Los clientes crecen junto a la empresa y acceden a
          mejores margenes a medida que aumentan sus colecciones o drops.
        </p>
      </div>

      <section className="mb-14">
        <h2 className="novamente-heading text-2xl text-center mb-6">
          Estructura de Niveles por Volumen
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {TIERS.map((tier) => (
            <div
              key={tier.key}
              className="rounded-xl border border-border bg-card p-5 text-center hover:border-primary/30 transition-colors"
            >
              <p className="font-semibold text-base mb-1">{tier.label}</p>
              <p className="text-xs text-muted-foreground mb-3">({tier.range})</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{tier.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <B2BCatalog growthByModel={growthByModel} />

      <UnifiedPriceTable growthByModel={growthByModel} />

      <section className="mb-14">
        <h2 className="novamente-heading text-2xl text-center mb-6">
          Consideraciones Comerciales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              El precio de la muestra es igual al precio del{" "}
              <strong className="text-foreground">Modelo Partner (1 unidad)</strong>.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Si se pide mas de <strong className="text-foreground">10 prendas</strong>, la
              muestra puede ser descontada del pedido mayorista.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Envio bonificado a partir de{" "}
              <strong className="text-foreground">$150.000</strong>.
            </p>
          </div>
        </div>
      </section>

      <div className="text-center bg-gradient-to-br from-primary/5 to-purple-600/5 rounded-xl p-8 border border-primary/10">
        <h3 className="novamente-heading text-2xl mb-3">
          Listo para arrancar tu marca con Novamente?
        </h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Coordinemos una llamada para disenar tu drop o coleccion con la tarifa que mejor se
          ajuste a tu volumen.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Vi%20el%20catalogo%20B2B%202026%20y%20quiero%20coordinar%20pedido%20%2F%20drop.%20(ref%20%C2%B7%20NV-B2B26)" target="_blank">
            <Button className="rounded-lg">Hablar por WhatsApp</Button>
          </Link>
          <Link href="/partners">
            <Button variant="outline" className="rounded-lg bg-transparent">
              Conocer programa Partners
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
