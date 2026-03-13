"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Product } from "@/src/data/partners"

interface ProductCardProps {
  brandId: string
  product: Product
}

interface ImageMeta {
  src: string
  label: "Frente" | "Dorso" | "Detalle" | null
  colorValue: string | null
}

export function ProductCard({ brandId, product }: ProductCardProps) {
  // Build image list with metadata: front+back per color → lifestyle → close-up
  const colorImages: ImageMeta[] = product.colors.flatMap((c) =>
    ([
      c.images.front ? { src: c.images.front, label: "Frente" as const, colorValue: c.value } : null,
      c.images.back  ? { src: c.images.back,  label: "Dorso"  as const, colorValue: c.value } : null,
    ]).filter(Boolean) as ImageMeta[]
  )

  const lifestyleImages: ImageMeta[] = product.lifestyleImages
    .filter((src) => !src.toLowerCase().includes("talles"))
    .map((src) => ({ src, label: null, colorValue: null }))

  const closeUpImage: ImageMeta[] = product.closeUp
    ? [{ src: product.closeUp, label: "Detalle" as const, colorValue: null }]
    : []

  // Deduplicate by src
  const allImages: ImageMeta[] = Array.from(
    new Map([...colorImages, ...lifestyleImages, ...closeUpImage].map((img) => [img.src, img])).values()
  )

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (allImages.length <= 1 || paused) return
    const id = setInterval(() => setIndex((i) => (i + 1) % allImages.length), 2500)
    return () => clearInterval(id)
  }, [allImages.length, paused])

  // Jump to first image of a given color when swatch is clicked
  function jumpToColor(colorValue: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const idx = allImages.findIndex((img) => img.colorValue === colorValue)
    if (idx !== -1) setIndex(idx)
  }

  const currentLabel = allImages[index]?.label

  return (
    <Link href={`/merch/${brandId}/${product.id}`} className="group">
      <div
        className="border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden">
          {allImages.map((img, i) => (
            <div
              key={img.src}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === index ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                src={img.src}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}

          {/* Frente / Dorso / Detalle label */}
          {currentLabel && (
            <div className="absolute top-3 left-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-black/50 text-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {currentLabel}
              </span>
            </div>
          )}

          {product.featured && (
            <div className={`absolute left-3 ${currentLabel ? "top-9" : "top-3"}`}>
              <Badge className="bg-primary text-white">Destacado</Badge>
            </div>
          )}

          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs">
              {product.category}
            </Badge>
          </div>

          {/* Dot indicators */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-base font-semibold leading-tight">{product.name}</h3>
            <span className="text-lg font-bold text-primary ml-3 shrink-0">{product.priceLabel}</span>
          </div>

          <p className="text-muted-foreground mb-3 text-sm line-clamp-2">{product.cardDescription}</p>

          {/* Clickable color swatches */}
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Colores:</span>
            <div className="flex gap-1.5">
              {product.colors.map((c) => {
                const isActive = allImages[index]?.colorValue === c.value
                return (
                  <button
                    key={c.value}
                    onClick={(e) => jumpToColor(c.value, e)}
                    className={`w-5 h-5 rounded-full shadow-sm transition-all duration-150 ${
                      isActive
                        ? "ring-2 ring-offset-1 ring-primary scale-110"
                        : "border border-muted-foreground/40 hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={`Ver color ${c.name}`}
                  />
                )
              })}
            </div>
          </div>

          <div className="mb-4">
            <span className="text-xs text-muted-foreground">
              Talles: <span className="font-medium">{product.sizes.join(", ")}</span>
            </span>
          </div>

          <Button className="w-full bg-zinc-700 text-zinc-100 border border-zinc-600 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200">
            Ver producto
          </Button>
        </div>
      </div>
    </Link>
  )
}
