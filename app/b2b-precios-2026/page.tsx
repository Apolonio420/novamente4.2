import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Catálogo B2B Novamente — Tarifas Exclusivas 2026",
  description: "Tarifas mayoristas Novamente para socios estratégicos.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: undefined },
}

type Tier = {
  key: "partner" | "starter" | "pro" | "drop" | "bulk"
  label: string
  range: string
  blurb: string
}

const TIERS: Tier[] = [
  { key: "partner", label: "Modelo Partner", range: "1 unidad", blurb: "Punto de entrada para compras on-demand, regalos o validación de producto (muestras)." },
  { key: "starter", label: "Starter", range: "5–9 unidades", blurb: "Ideal para lanzamientos pequeños o pedidos iniciales de stock limitado." },
  { key: "pro", label: "Pro", range: "10–20 unidades", blurb: "Diseñado para marcas en crecimiento que requieren reposición constante de productos estrella." },
  { key: "drop", label: "Drop", range: "30–99 unidades", blurb: "Optimizado para colecciones planificadas y lanzamientos de temporada." },
  { key: "bulk", label: "Bulk", range: "100+ unidades", blurb: "La tarifa más competitiva para operaciones mayoristas de alto volumen y distribución nacional." },
]

type B2BProduct = {
  id: string
  name: string
  subtitle: string
  image: string
  prices: { partner: number; starter: number; pro: number; drop: number; bulk: number }
}

const B2B_PRODUCTS: B2BProduct[] = [
  {
    id: "berlin",
    name: "Berlin",
    subtitle: "Buzo Cuello Redondo",
    image: "/products/buzo-cuello-redondo-unisex-negro-estilo-oversize/mockups nuevos productos-8.png",
    prices: { partner: 32200, starter: 31200, pro: 30200, drop: 29200, bulk: 28200 },
  },
  {
    id: "boston",
    name: "Boston",
    subtitle: "Buzo Hoodie Unisex",
    image: "/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png",
    prices: { partner: 38700, starter: 36600, pro: 34500, drop: 32400, bulk: 30300 },
  },
  {
    id: "aura",
    name: "Aura",
    subtitle: "Oversize T-Shirt",
    image: "/products/aura-tshirt-blanco-front.jpeg",
    prices: { partner: 25400, starter: 24700, pro: 24000, drop: 23200, bulk: 22500 },
  },
  {
    id: "aldea",
    name: "Aldea",
    subtitle: "Classic Fit T-Shirt",
    image: "/products/tshirt-aldea-blanco-front.jpeg",
    prices: { partner: 25700, starter: 24700, pro: 23700, drop: 22700, bulk: 21700 },
  },
  {
    id: "buenos-aires",
    name: "Buenos Aires",
    subtitle: "Remera Clásica Mujer",
    image: "/products/remera-clasica-woman-blanca/mockups nuevos productos-2.png",
    prices: { partner: 25700, starter: 24700, pro: 23700, drop: 22700, bulk: 21700 },
  },
  {
    id: "bahamas",
    name: "Bahamas",
    subtitle: "Remera Crop Mujer",
    image: "/products/remera-crop-de-mujer-negra/mockups nuevos productos-4.png",
    prices: { partner: 19300, starter: 18800, pro: 18200, drop: 17700, bulk: 17200 },
  },
  {
    id: "bali",
    name: "Bali",
    subtitle: "Musculosa",
    image: "/products/musculosa-bali-blanca/Musculosa_Rib_Blanca.png",
    prices: { partner: 17400, starter: 16800, pro: 16200, drop: 15700, bulk: 15100 },
  },
]

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-AR")}`
}

export default function B2BPricesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Material confidencial · Socios estratégicos Novamente
        </p>
        <h1 className="novamente-heading text-4xl md:text-5xl mb-4">
          Catálogo B2B Novamente
        </h1>
        <p className="text-xl text-muted-foreground mb-4">Tarifas Exclusivas 2026</p>
        <p className="max-w-3xl mx-auto text-muted-foreground">
          Novamente rediseñó su estructura comercial para ofrecer una mayor transparencia y
          escalabilidad a sus socios estratégicos. La nueva propuesta elimina la confusión de
          precios diferenciados por color, estableciendo una tarifa única por modelo de prenda.
          Esta estructura permite a los clientes crecer junto a la empresa, accediendo a mejores
          márgenes a medida que aumentan sus colecciones o drops.
        </p>
      </div>

      <section className="mb-14">
        <h2 className="novamente-heading text-2xl text-center mb-6">Estructura de Niveles por Volumen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {TIERS.map((tier) => (
            <div
              key={tier.key}
              className="rounded-xl border border-border bg-card p-5 text-center"
            >
              <p className="font-semibold text-base mb-1">{tier.label}</p>
              <p className="text-xs text-muted-foreground mb-3">({tier.range})</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{tier.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <div className="text-center mb-6">
          <h2 className="novamente-heading text-2xl mb-2">Tabla de Precios Unificados</h2>
          <p className="text-sm text-muted-foreground">
            Precios finales por unidad en Pesos (ARS), incluyen estampa estándar.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left p-4 font-semibold">Producto</th>
                {TIERS.map((t) => (
                  <th key={t.key} className="text-right p-4 font-semibold whitespace-nowrap">
                    {t.label}
                    <span className="block text-xs font-normal text-muted-foreground">
                      ({t.range})
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {B2B_PRODUCTS.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 shrink-0 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={p.image}
                          alt={`${p.name} - ${p.subtitle}`}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.subtitle}</p>
                      </div>
                    </div>
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
          Consideraciones Comerciales Importantes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              El precio de la muestra es igual al precio del <strong className="text-foreground">Modelo Partner (1 unidad)</strong>.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Si se pide más de <strong className="text-foreground">10 prendas</strong>, la muestra puede ser descontada del pedido mayorista.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Envío bonificado a partir de <strong className="text-foreground">$150.000</strong>.
            </p>
          </div>
        </div>
      </section>

      <div className="text-center bg-gradient-to-br from-primary/5 to-purple-600/5 rounded-xl p-8 border border-primary/10">
        <h3 className="novamente-heading text-2xl mb-3">¿Listo para arrancar tu marca con Novamente?</h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Coordinemos una llamada para diseñar tu drop o colección con la tarifa que mejor se ajuste a tu volumen.
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
