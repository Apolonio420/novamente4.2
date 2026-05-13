"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ZoomIn, Ruler } from "lucide-react"
import { MODELS, TIERS, type B2BModel } from "./data"

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-AR")}`
}

export default function B2BCatalog() {
  const [openModel, setOpenModel] = useState<B2BModel | null>(null)
  const [colorIdx, setColorIdx] = useState(0)
  const [imgIdx, setImgIdx] = useState(0)
  const [zoomImg, setZoomImg] = useState<string | null>(null)
  const [showChart, setShowChart] = useState(false)

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {MODELS.map((m) => {
            const cover = m.colors[0]?.images[0]
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
                  <div className="flex items-baseline justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">Desde (Bulk)</span>
                    <span className="font-bold text-lg tabular-nums">
                      {formatPrice(m.prices.bulk)}
                    </span>
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

                <a href="https://wa.me/message/DRWR3O2HZY2JG1" target="_blank" rel="noreferrer">
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
