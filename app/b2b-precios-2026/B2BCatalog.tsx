"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ZoomIn, Ruler, Sparkles, TrendingUp } from "lucide-react"
import { MODELS, TIERS, type B2BModel } from "./data"

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-AR")}`
}

// growthByModel llega ya calculado desde el server (page.tsx): el precio Growth
// "desde (1u)" final, sin el costo del que se deriva (regla innegociable).
export default function B2BCatalog({
  growthByModel,
}: {
  growthByModel: Record<string, number | null>
}) {
  const getGrowthPrice = (modelId: string): number | null => growthByModel[modelId] ?? null
  const [openModel, setOpenModel] = useState<B2BModel | null>(null)
  const [colorIdx, setColorIdx] = useState(0)
  const [imgIdx, setImgIdx] = useState(0)
  const [zoomImg, setZoomImg] = useState<string | null>(null)
  const [showChart, setShowChart] = useState(false)
  const [showGrowthPrices, setShowGrowthPrices] = useState(false)

  function openModal(model: B2BModel) {
    setOpenModel(model)
    setColorIdx(0)
    setImgIdx(0)
    setShowChart(false)
  }

  const currentColor = openModel?.colors[colorIdx]
  const currentImg = currentColor?.images[imgIdx]

  return (
    <>
      <section className="mb-14">
        <h2 className="novamente-heading text-2xl text-center mb-2">Catalogo de Prendas</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Toca cualquier producto para ver detalle, colores disponibles y guia de talles.
        </p>

        {/* Banner Growth — beneficio sin revelar formula interna */}
        {(() => {
          // % ahorro promedio Growth vs Partner-1u (calculado sobre el catalogo visible)
          const ratios = MODELS.map(m => {
            const g = getGrowthPrice(m.id)
            return g != null && m.prices.partner > 0 ? (m.prices.partner - g) / m.prices.partner : 0
          }).filter(r => r > 0)
          const avgSavingsPct = ratios.length
            ? Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100)
            : 0
          return (
            <div className="mb-8 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-purple-600/10 to-primary/5 p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-primary font-semibold">Plan Studio Growth</p>
                    <p className="text-lg font-bold">
                      Hasta {avgSavingsPct}% menos por prenda — USD$50/mes
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground flex-1">
                  Suscribite a{" "}
                  <Link href="/studio/planes" className="text-primary font-medium underline-offset-4 hover:underline">
                    Novamente Studio Growth
                  </Link>{" "}
                  y accedé a precios partner aún más competitivos, sin tope de unidades. Tu margen vendiendo a retail se multiplica.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Button
                    variant={showGrowthPrices ? "default" : "outline"}
                    className="rounded-lg"
                    onClick={() => setShowGrowthPrices(v => !v)}
                  >
                    {showGrowthPrices ? "Ocultar precios Growth" : "Ver precios Growth"}
                  </Button>
                  <Link href="/studio/planes">
                    <Button className="rounded-lg w-full">
                      Más info
                      <TrendingUp className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )
        })()}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {MODELS.map((m) => {
            const cover = m.colors[0]?.images[0]
            const growthPrice = getGrowthPrice(m.id)
            const savingsPct = growthPrice != null && m.prices.partner > 0
              ? Math.round(((m.prices.partner - growthPrice) / m.prices.partner) * 100)
              : 0
            return (
              <button
                key={m.id}
                onClick={() => openModal(m)}
                className="group text-left bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer"
              >
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {cover && (
                    <Image
                      src={cover}
                      alt={`${m.name} - ${m.subtitle}`}
                      fill
                      sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute top-3 right-3 bg-background/90 backdrop-blur rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                  {showGrowthPrices && savingsPct > 0 && (
                    <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <Sparkles className="w-3 h-3" />
                      Growth −{savingsPct}%
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {m.colors.map((c) => (
                      <span
                        key={c.name}
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ background: c.swatch }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{m.name}</h3>
                    <span className="text-xs text-muted-foreground">{m.colors.length} colores</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{m.subtitle}</p>
                  <div className="border-t border-border pt-3 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Desde (1u)</span>
                      <span
                        className={`font-bold text-lg tabular-nums ${
                          showGrowthPrices ? "text-muted-foreground line-through font-semibold text-base" : ""
                        }`}
                      >
                        {formatPrice(m.prices.partner)}
                      </span>
                    </div>
                    {showGrowthPrices && growthPrice != null && (
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-primary font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Plan Growth
                        </span>
                        <span className="font-bold text-lg tabular-nums text-primary">
                          {formatPrice(growthPrice)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <Dialog open={!!openModel} onOpenChange={(o) => !o && setOpenModel(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0">
          {openModel && currentColor && currentImg && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="bg-muted/40 p-6">
                <div
                  className="relative aspect-square bg-white rounded-xl overflow-hidden cursor-zoom-in mb-4"
                  onClick={() => setZoomImg(currentImg)}
                >
                  <Image
                    src={currentImg}
                    alt={`${openModel.name} ${currentColor.name}`}
                    fill
                    sizes="(max-width:768px) 100vw, 50vw"
                    className="object-contain"
                    priority
                  />
                  <div className="absolute top-3 right-3 bg-background/90 backdrop-blur rounded-full p-2">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>

                {currentColor.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {currentColor.images.map((img, i) => (
                      <button
                        key={img}
                        onClick={() => setImgIdx(i)}
                        className={`relative aspect-square rounded-lg overflow-hidden bg-white border-2 transition-colors ${
                          imgIdx === i ? "border-primary" : "border-transparent hover:border-border"
                        }`}
                      >
                        <Image src={img} alt="" fill sizes="100px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8">
                <DialogTitle className="novamente-heading text-3xl mb-1">
                  {openModel.name}
                </DialogTitle>
                <DialogDescription className="text-base mb-4">
                  {openModel.subtitle}
                </DialogDescription>

                <p className="text-sm text-muted-foreground mb-5">{openModel.fabric}</p>

                <div className="mb-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Color: <span className="text-foreground font-medium">{currentColor.name}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {openModel.colors.map((c, i) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          setColorIdx(i)
                          setImgIdx(0)
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                          colorIdx === i
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-foreground/40"
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-border"
                          style={{ background: c.swatch }}
                        />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Talles disponibles
                    </p>
                    <button
                      onClick={() => setShowChart((s) => !s)}
                      className="text-xs flex items-center gap-1 text-primary hover:underline"
                    >
                      <Ruler className="w-3 h-3" />
                      {showChart ? "Ocultar guia" : "Ver guia de talles"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {openModel.sizes.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1.5 rounded-md border border-border text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  {showChart && (
                    <div className="relative w-full aspect-[4/3] mt-3 bg-white rounded-lg overflow-hidden border border-border">
                      <Image
                        src={openModel.measurementsChart}
                        alt={`${openModel.name} - Guia de talles`}
                        fill
                        sizes="(max-width:768px) 100vw, 50vw"
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 mb-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    Tarifa por volumen (ARS)
                  </p>
                  <div className="space-y-1.5">
                    {TIERS.map((t) => (
                      <div
                        key={t.key}
                        className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0"
                      >
                        <div>
                          <span className="font-medium">{t.label}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                            ({t.range})
                          </span>
                        </div>
                        <span className="font-bold tabular-nums">
                          {formatPrice(openModel.prices[t.key])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Growth highlight — debajo de la tabla de tiers */}
                {(() => {
                  const growthPrice = getGrowthPrice(openModel.id)
                  if (growthPrice == null) return null
                  const savings = openModel.prices.partner - growthPrice
                  const savingsPct = Math.round((savings / openModel.prices.partner) * 100)
                  return (
                    <div className="rounded-xl border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-purple-600/5 to-primary/5 p-4 mb-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <p className="text-xs uppercase tracking-widest text-primary font-bold">
                          Plan Studio Growth
                        </p>
                      </div>
                      <div className="flex items-baseline justify-between mb-2">
                        <div className="text-sm">
                          <p className="font-semibold">Tu precio con plan Growth</p>
                          <p className="text-xs text-muted-foreground">USD$50/mes</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold tabular-nums text-primary">
                            {formatPrice(growthPrice)}
                          </p>
                          {savings > 0 && (
                            <p className="text-xs text-emerald-500 font-semibold">
                              −{formatPrice(savings)} ({savingsPct}% vs tier 1u)
                            </p>
                          )}
                        </div>
                      </div>
                      <Link href="/studio/planes" className="block">
                        <Button variant="outline" className="w-full rounded-lg border-primary/40 hover:bg-primary/10">
                          Conocer Plan Growth
                          <TrendingUp className="w-4 h-4 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  )
                })()}

                <a href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Vi%20el%20catalogo%20B2B%202026%20y%20quiero%20cotizar%20una%20prenda%20especifica.%20(ref%20%C2%B7%20NV-B2B26-MODAL)" target="_blank" rel="noreferrer">
                  <Button className="w-full rounded-lg">
                    Cotizar {openModel.name} por WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!zoomImg} onOpenChange={(o) => !o && setZoomImg(null)}>
        <DialogContent className="max-w-4xl p-2 bg-background">
          <DialogTitle className="sr-only">Vista ampliada</DialogTitle>
          {zoomImg && (
            <div className="relative w-full h-[80vh] bg-white rounded-lg overflow-hidden">
              <Image
                src={zoomImg}
                alt="Vista ampliada"
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
