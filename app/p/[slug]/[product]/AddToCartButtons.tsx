"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Zap, MessageCircle } from "lucide-react"
import { useCart } from "@/lib/cartStore"
import { useToast } from "@/hooks/use-toast"
import * as fpixel from "@/lib/fpixel"

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"] as const

interface ColorOption {
  name: string
  code: string
}

interface AddToCartButtonsProps {
  productId: string
  productName: string
  brandName: string
  // tenant.id / tenant.slug del partner dueño del producto — CRÍTICO para que la
  // orden quede con tenant_id y el partner cobre su margen (sin esto tenant_id=null).
  tenantId: string
  brandSlug: string
  category: string | null
  price: number
  imageUrl: string | null
  // Talles posibles — si el partner_product.metadata.sizes existe se pasan;
  // si no, default unisex S-XXL.
  sizes?: string[]
  // Colores disponibles · cuando el partner produce el mismo diseño en
  // múltiples colores (ej: Blanco/Negro/Stone Wash) · pasados como metadata.available_colors
  availableColors?: ColorOption[]
  // Color por default (el que muestra el mockup actual del producto)
  defaultColor?: string
  // Botón de fallback WhatsApp por si el partner no quiere el flow de carrito
  // y prefiere contacto directo. Si se pasa, aparece como secundario.
  fallbackWhatsappUrl?: string
  whatsappLabel?: string
  primaryColor: string
}

export function AddToCartButtons({
  productId,
  productName,
  brandName,
  tenantId,
  brandSlug,
  category,
  price,
  imageUrl,
  sizes,
  availableColors,
  defaultColor,
  fallbackWhatsappUrl,
  whatsappLabel = "Consultar por WhatsApp",
  primaryColor,
}: AddToCartButtonsProps) {
  const availableSizes = sizes && sizes.length > 0 ? sizes : DEFAULT_SIZES
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0])
  const hasColors = availableColors && availableColors.length > 0
  const initialColor = defaultColor && availableColors?.some(c => c.name === defaultColor)
    ? defaultColor
    : (availableColors?.[0]?.name ?? "")
  const [selectedColor, setSelectedColor] = useState<string>(initialColor)
  const [adding, setAdding] = useState(false)
  const { addItem } = useCart()
  const { toast } = useToast()
  const router = useRouter()

  const viewContentFiredRef = useRef(false)
  useEffect(() => {
    if (viewContentFiredRef.current) return
    viewContentFiredRef.current = true
    fpixel.event("ViewContent", {
      content_ids: [productId],
      content_name: `${productName} — ${brandName}`,
      content_type: "product",
      content_category: category || undefined,
      value: price,
      currency: "ARS",
    })
  }, [productId, productName, brandName, category, price])

  const doAdd = () => {
    addItem({
      id: `${productId}-${selectedSize}-${selectedColor || 'def'}-${Date.now()}`,
      name: `${productName} — ${brandName}`,
      garmentType: category || "Producto",
      color: selectedColor,
      size: selectedSize,
      price,
      quantity: 1,
      image: imageUrl || "",
      tenantId,
      brandSlug,
      brandName,
    })
    fpixel.event("AddToCart", {
      content_ids: [productId],
      content_name: `${productName} — ${brandName}`,
      content_type: "product",
      content_category: category || undefined,
      value: price,
      currency: "ARS",
    })
  }

  const handleAddToCart = () => {
    setAdding(true)
    doAdd()
    toast({
      title: "Producto agregado",
      description: `${productName} agregado al carrito`,
    })
    setTimeout(() => setAdding(false), 700)
  }

  const handleBuyNow = () => {
    doAdd()
    fpixel.event("InitiateCheckout", {
      content_ids: [productId],
      content_name: `${productName} — ${brandName}`,
      content_type: "product",
      num_items: 1,
      value: price,
      currency: "ARS",
    })
    toast({
      title: "Producto agregado",
      description: `Te llevamos al checkout...`,
    })
    router.push("/checkout")
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Color picker · solo si el producto tiene available_colors en metadata */}
      {hasColors && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-zinc-500">Color</span>
            <span className="text-xs text-zinc-400">{selectedColor || "Elegí color"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableColors!.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedColor(c.name)}
                title={c.name}
                aria-label={`Color ${c.name}`}
                aria-pressed={selectedColor === c.name}
                className={`relative w-12 h-12 rounded-full border-2 transition ${
                  selectedColor === c.name
                    ? "border-white shadow-md scale-105"
                    : "border-zinc-700 hover:border-zinc-400"
                }`}
                style={{ backgroundColor: c.code }}
              >
                {selectedColor === c.name && (
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold"
                    style={{ color: c.code === '#FFFFFF' || c.code.toLowerCase() === '#fff' ? '#000' : '#fff' }}>
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-zinc-500 italic">
            El mockup muestra un color · el resto se produce a pedido sin recargo
          </span>
        </div>
      )}

      {/* Talles */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wider text-zinc-500">Talle</span>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map(size => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`min-w-[56px] h-12 rounded-md border px-4 py-2 text-base font-medium transition ${
                selectedSize === size
                  ? "border-white bg-white text-zinc-950"
                  : "border-zinc-700 bg-transparent text-zinc-300 hover:border-zinc-500"
              }`}
              aria-pressed={selectedSize === size}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Botones primarios: cart + buy now */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          variant="outline"
          onClick={handleAddToCart}
          disabled={adding}
          className="flex-1 h-14 text-base font-semibold border-zinc-700 text-white hover:bg-zinc-800"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {adding ? "Agregado" : "Agregar al carrito"}
        </Button>
        <Button
          size="lg"
          onClick={handleBuyNow}
          className="flex-1 h-14 text-base font-semibold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <Zap className="mr-2 h-5 w-5" />
          Comprar ahora
        </Button>
      </div>

      {/* WhatsApp opcional (consulta) */}
      {fallbackWhatsappUrl && (
        <a
          href={fallbackWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {whatsappLabel}
        </a>
      )}
    </div>
  )
}
