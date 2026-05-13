import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import B2BCatalog from "./B2BCatalog"
import { MODELS, TIERS } from "./data"

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

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-AR")}`
}

export default function B2BPricesPage() {
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

      <B2BCatalog />

      <section className="mb-14">
        <div className="text-center mb-6">
          <h2 className="novamente-heading text-2xl mb-2">Tabla de Precios Unificados</h2>
          <p className="text-sm text-muted-foreground">
            Precios finales por unidad en Pesos (ARS), incluyen estampa estandar.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left p-4 font-semibold">Producto</th>
                {TIERS.map((t) => (
                  <th
                    key={t.key}
                    className="text-right p-4 font-semibold whitespace-nowrap"
                  >
                    {t.label}
                    <span className="block text-xs font-normal text-muted-foreground">
                      ({t.range})
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODELS.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="p-4">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.subtitle}</p>
                  </td>
                  {TIERS.map((t) => (
                    <td key={t.key} className="p-4 text-right tabular-nums whitespace-nowrap">
                      {formatPrice(p.prices[t.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
          <Link href="https://wa.me/message/DRWR3O2HZY2JG1" target="_blank">
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
