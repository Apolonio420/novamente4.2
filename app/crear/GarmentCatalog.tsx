"use client"

import Image from "next/image"
import { CATALOG_PRODUCTS } from "@/lib/catalog/products"
import { Check } from "lucide-react"

/**
 * Catálogo visual de prendas — usa CATALOG_PRODUCTS como fuente de verdad
 * (mismos productos/colores que el workspace de partners, pero mostrando
 * el precio retailARS = B2C). Los keys son los canónicos (hyphenated)
 * que coinciden con PATH_BUILDERS de lib/garment-mappings.ts para que
 * /api/generate-mockup funcione sin traducción.
 */

export type GarmentCatalogValue = {
  garmentType: string
  garmentColor: string
  side: "front" | "back"
}

export function GarmentCatalog({
  garmentType,
  garmentColor,
  side,
  onChange,
}: {
  garmentType: string
  garmentColor: string
  side: "front" | "back"
  onChange: (next: GarmentCatalogValue) => void
}) {
  const fmt = (n: number) => `$${n.toLocaleString("es-AR")}`

  return (
    <div className="space-y-4">
      {/* Posición (front/back) */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-400">Posición:</span>
        <button
          type="button"
          onClick={() => onChange({ garmentType, garmentColor, side: "front" })}
          className={`rounded-full px-3 py-1 font-medium transition ${
            side === "front"
              ? "bg-violet-600 text-white"
              : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          Frente
        </button>
        <button
          type="button"
          onClick={() => onChange({ garmentType, garmentColor, side: "back" })}
          className={`rounded-full px-3 py-1 font-medium transition ${
            side === "back"
              ? "bg-violet-600 text-white"
              : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          Espalda
        </button>
      </div>

      {/* Grid de prendas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {CATALOG_PRODUCTS.map((product) => {
          const isActive = product.key === garmentType
          const activeColor =
            isActive
              ? product.colors.find((c) => c.key === garmentColor) ?? product.colors[0]
              : product.colors[0]
          const thumbnail = activeColor.thumbnail
          return (
            <button
              key={product.key}
              type="button"
              onClick={() =>
                onChange({
                  garmentType: product.key,
                  garmentColor: activeColor.key,
                  side,
                })
              }
              className={`relative text-left rounded-lg border-2 p-2 transition ${
                isActive
                  ? "border-violet-500 bg-violet-600/5"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"
              }`}
            >
              {isActive && (
                <span className="absolute top-1.5 right-1.5 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <div className="relative aspect-square bg-zinc-100 rounded overflow-hidden mb-2">
                <Image
                  src={thumbnail}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="text-[11px] font-medium text-white leading-tight line-clamp-2 min-h-[28px]">
                {product.name}
              </div>
              <div className="text-xs font-bold text-violet-400 mt-1">{fmt(product.retailARS)}</div>

              {/* Color dots */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {product.colors.map((c) => {
                  const isColorActive = isActive && c.key === garmentColor
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange({
                          garmentType: product.key,
                          garmentColor: c.key,
                          side,
                        })
                      }}
                      title={c.name}
                      aria-label={`${product.name} en ${c.name}`}
                      className={`relative w-5 h-5 rounded-full border transition ${
                        isColorActive
                          ? "border-white ring-2 ring-violet-500"
                          : "border-zinc-600 hover:border-zinc-300"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isColorActive && (
                        <Check
                          className="absolute inset-0 m-auto h-3 w-3"
                          style={{
                            color:
                              c.hex.toLowerCase() === "#f5f5f5" ||
                              c.hex.toLowerCase() === "#fff" ||
                              c.hex.toLowerCase() === "#ffffff"
                                ? "#000"
                                : "#fff",
                          }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
              {isActive && (
                <div className="text-[10px] text-zinc-400 mt-1 truncate">
                  {activeColor.name}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
