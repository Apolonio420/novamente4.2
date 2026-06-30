"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Palette, Sparkles, ZoomIn, ShoppingCart, Check, SlidersHorizontal, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCart } from "@/lib/cartStore"
import type { Product } from "@/lib/products"
import { anchorPriceLabel } from "@/lib/catalog/anchor-price"

const CATEGORIES = ["Todos", "Hoodies", "Buzos (Crewneck)", "T-Shirts", "Remeras Crop", "Musculosas", "Remeras Mujer", "Remeras Infantiles", "Arte"] as const

const PRICE_RANGES = [
  { label: "Todos", min: 0, max: Infinity },
  { label: "Hasta $30.000", min: 0, max: 30000 },
  { label: "$30.000 - $50.000", min: 30000, max: 50000 },
  { label: "Más de $50.000", min: 50000, max: Infinity },
] as const

const SIZES = ["S", "M", "L", "XL", "XXL"] as const
const KIDS_SIZES = ["4", "6", "8", "10", "12", "14", "16"] as const

function parsePrice(priceStr: string): number {
  return parseInt(priceStr.replace(/[$.]/g, ""), 10)
}

export default function ProductsFilter({ products }: { products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState<string>("Todos")
  const [activePriceRange, setActivePriceRange] = useState(0)
  const [quickAddId, setQuickAddId] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>("M")
  const [addedId, setAddedId] = useState<string | null>(null)
  const addItem = useCart(s => s.addItem)

  const filtered = useMemo(() => {
    const range = PRICE_RANGES[activePriceRange]
    return products.filter(p => {
      if (!p.available) return false
      if (activeCategory !== "Todos" && p.category !== activeCategory) return false
      const price = parsePrice(p.price)
      if (price < range.min || price >= range.max) return false
      return true
    })
  }, [products, activeCategory, activePriceRange])

  const activeFilters = activeCategory !== "Todos" || activePriceRange !== 0
  const resultCount = filtered.length

  function handleQuickAdd(product: Product) {
    if (quickAddId === product.id) {
      const price = parsePrice(product.price)
      addItem({
        id: `${product.id}-${selectedSize}-${Date.now()}`,
        name: product.name,
        color: product.color,
        size: selectedSize,
        price,
        quantity: 1,
        image: product.images.main,
      })
      setAddedId(product.id)
      setQuickAddId(null)
      setTimeout(() => setAddedId(null), 2000)
    } else {
      setQuickAddId(product.id)
      setSelectedSize(product.category === "Remeras Infantiles" ? "8" : "M")
    }
  }

  // Group filtered products by category
  const groupedProducts = useMemo(() => {
    if (activeCategory !== "Todos") {
      return [{ name: activeCategory, items: filtered }]
    }
    const cats = ["Hoodies", "Buzos (Crewneck)", "T-Shirts", "Remeras Crop", "Musculosas", "Remeras Mujer", "Remeras Infantiles", "Arte"]
    return cats.map(c => ({ name: c, items: filtered.filter(p => p.category === c) })).filter(g => g.items.length > 0)
  }, [filtered, activeCategory])

  return (
    <>
      {/* Filter bar */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 mb-2 -mx-4 px-4 border-b border-border/10 shadow-sm">
        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 justify-center md:flex-wrap scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap text-sm py-2 px-4 rounded-md border transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-white border-primary"
                  : "bg-secondary/50 border-border/50 hover:bg-primary/10 hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Price filters + result count */}
        <div className="flex items-center gap-3 mt-3 overflow-x-auto justify-center md:flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
          {PRICE_RANGES.map((range, i) => (
            <button
              key={i}
              onClick={() => setActivePriceRange(i)}
              className={`whitespace-nowrap text-xs py-1.5 px-3 rounded-full border transition-colors ${
                activePriceRange === i
                  ? "bg-primary/10 text-primary border-primary/30 font-medium"
                  : "border-border/50 hover:bg-muted/50"
              }`}
            >
              {range.label}
            </button>
          ))}
          {activeFilters && (
            <button
              onClick={() => { setActiveCategory("Todos"); setActivePriceRange(0) }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-2"
            >
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>

        {/* Result count */}
        <div className="text-center mt-2">
          <span className="text-xs text-muted-foreground">
            {resultCount} {resultCount === 1 ? "producto" : "productos"}
          </span>
        </div>
      </div>

      {/* Product grid */}
      {groupedProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">No hay productos con estos filtros.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setActiveCategory("Todos"); setActivePriceRange(0) }}>
            Ver todos los productos
          </Button>
        </div>
      ) : (
        <div className="space-y-16">
          {groupedProducts.map(group => (
            <div key={group.name} id={`category-${group.name.replace(/\s+/g, '-').toLowerCase()}`} className="scroll-mt-40">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b pb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {group.name}
                <span className="text-sm font-normal text-muted-foreground ml-2">({group.items.length})</span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {group.items.map((product, index) => (
                  <article key={product.id} className="group" aria-label={product.name}>
                    <div className="border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      {/* Image */}
                      <Link href={`/products/${product.id}`} className="block">
                        <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-zinc-800/40 to-zinc-900/60">
                          <Image
                            src={product.images.main || "/placeholder.svg"}
                            alt={`${product.name} — prenda personalizable de Novamente`}
                            fill
                            priority={index < 6}
                            fetchPriority={index < 6 ? "high" : "auto"}
                            loading={index < 6 ? "eager" : "lazy"}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            quality={80}
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg">
                                <Palette className="w-5 h-5 text-primary" />
                              </div>
                            </div>
                          </div>
                          <div className="absolute top-2 left-2">
                            {product.available ? (
                              <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0.5">Disponible</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Pronto</Badge>
                            )}
                          </div>
                        </div>
                      </Link>

                      <div className="p-3 md:p-4 flex flex-col flex-1">
                        <h3 className="text-sm md:text-base font-semibold leading-tight line-clamp-2">{product.name}</h3>
                        <div className="flex items-center justify-between mt-1 mb-2">
                          <div className="flex flex-col leading-none">
                            {anchorPriceLabel(product.price) && (
                              <span className="text-[11px] text-muted-foreground/60 line-through">{anchorPriceLabel(product.price)}</span>
                            )}
                            <span className="text-lg md:text-xl font-bold text-primary">{product.price}</span>
                          </div>
                          <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline">{product.color}</span>
                        </div>

                        <p className="text-muted-foreground text-xs leading-relaxed flex-1 line-clamp-2 hidden md:block mb-3">{product.description}</p>

                        {/* Quick-add size selector */}
                        {quickAddId === product.id && product.category !== "Arte" && (
                          <div className="flex gap-1 mb-2 flex-wrap">
                            {(product.category === "Remeras Infantiles" ? KIDS_SIZES : SIZES).map(size => (
                              <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`text-[10px] md:text-xs px-2 py-1 rounded border transition-colors ${
                                  selectedSize === size
                                    ? "bg-primary text-white border-primary"
                                    : "border-border hover:border-primary/50"
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-1.5 mt-auto">
                          <Link href={`/products/${product.id}`} className="flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs md:text-sm"
                            >
                              Ver
                            </Button>
                          </Link>
                          {product.available && product.category !== "Arte" && (
                            <Button
                              size="sm"
                              className={`text-xs md:text-sm transition-all ${
                                addedId === product.id
                                  ? "bg-green-500 hover:bg-green-600"
                                  : quickAddId === product.id
                                    ? "bg-primary animate-pulse"
                                    : "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                              }`}
                              onClick={() => handleQuickAdd(product)}
                            >
                              {addedId === product.id ? (
                                <Check className="w-4 h-4" />
                              ) : quickAddId === product.id ? (
                                <>
                                  <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                                  <span className="hidden sm:inline">Agregar {selectedSize}</span>
                                  <span className="sm:hidden">{selectedSize}</span>
                                </>
                              ) : (
                                <ShoppingCart className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
