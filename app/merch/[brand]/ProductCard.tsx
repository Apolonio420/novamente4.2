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

export function ProductCard({ brandId, product }: ProductCardProps) {
  const images = Array.from(
    new Set([
      ...product.colors.map((c) => c.images.front).filter(Boolean),
      ...product.lifestyleImages.filter((src) => !src.toLowerCase().includes("talles")),
    ])
  )

  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), 1200)
    return () => clearInterval(id)
  }, [images.length])

  return (
    <Link href={`/merch/${brandId}/${product.id}`} className="group">
      <div className="border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300">
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden">
          {images.map((src, i) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === index ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                src={src}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}

          {product.featured && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-primary text-white">Destacado</Badge>
            </div>
          )}

          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
              {product.category}
            </Badge>
          </div>

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold leading-tight">{product.name}</h3>
            <span className="text-xl font-bold text-primary ml-4">{product.priceLabel}</span>
          </div>

          <p className="text-muted-foreground mb-4 text-sm">{product.cardDescription}</p>

          <div className="mb-3">
            <span className="text-sm text-muted-foreground">
              Colores: <span className="font-medium">{product.colors.map((c) => c.name).join(", ")}</span>
            </span>
          </div>

          <div className="mb-4">
            <span className="text-sm text-muted-foreground">
              Talles: <span className="font-medium">{product.sizes.join(", ")}</span>
            </span>
          </div>

          <Button className="w-full bg-zinc-700 text-zinc-100 border border-zinc-600 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200">
            Comprar
          </Button>
        </div>
      </div>
    </Link>
  )
}
