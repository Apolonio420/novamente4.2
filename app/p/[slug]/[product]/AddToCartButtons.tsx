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

/** Con qué se estampa cada lado — viene de partner_products.metadata.print */
export interface PrintSpec {
  designUrl?: string | null
  stampMode?: 'large' | 'medium' | 'chest-logo' | null
  placement?: string | null
  widthCm?: number | null
}

export interface AddToCartButtonsProps {
  /**
   * Arte y medida reales del producto. Sin esto, al proveedor le llega sólo la
   * foto del mockup y tiene que adivinar qué imprimir y de qué tamaño.
   */
  printFront?: PrintSpec | null
  printBack?: PrintSpec | null
  productId: string
  productName: string
  brandName: string
  // tenant.id / tenant.slug del partner dueño del producto — CRÍTICO para que la
  // orden quede con tenant_id y el partner cobre su margen (sin esto tenant_id=null).
  tenantId: string
  brandSlug: string
  category: string | null
  price: number
  // Precio por medida/variante: si metadata.size_prices existe, el precio cambia
  // según el talle/medida elegido (ej. lienzos 20×30/35×40/40×50 con precios distintos).
  sizePrices?: Record<string, number>
  // Etiqueta del selector ("Talle" para ropa, "Medida" para lienzos)
  sizeLabel?: string
  imageUrl: string | null
  // Talles posibles — si el partner_product.metadata.sizes existe se pasan;
  // si no, default unisex S-XXL.
  sizes?: string[]
  // Medidas por talle (metadata.sizing), ej: { S: "Ancho 48 cm · Largo 63 cm" }.
  sizing?: Record<string, string>
  // Guía de talles oficial — fallback universal: TODO producto de partner muestra
  // medidas (tabla inline si hay sizing, si no este link). Garantiza "nunca falta".
  sizeGuideUrl?: string
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
  // Modo controlado (opcional) — cuando el color elegido debe sincronizarse con
  // otro componente (ej. la galería de imágenes en ProductMediaBuy.tsx, que
  // muestra las fotos del color activo). Si no vienen, el componente usa su
  // useState interno tal cual antes — no rompe a los callers existentes.
  selectedColor?: string
  onSelectColor?: (color: string) => void
}

export function AddToCartButtons({
  productId,
  productName,
  brandName,
  tenantId,
  brandSlug,
  category,
  price,
  sizePrices,
  sizeLabel = "Talle",
  imageUrl,
  sizes,
  sizing,
  sizeGuideUrl = "/guia-de-talles-novamente.pdf",
  availableColors,
  defaultColor,
  fallbackWhatsappUrl,
  whatsappLabel = "Consultar por WhatsApp",
  primaryColor,
  selectedColor: selectedColorProp,
  onSelectColor,
  printFront,
  printBack,
}: AddToCartButtonsProps) {
  const availableSizes = sizes && sizes.length > 0 ? sizes : DEFAULT_SIZES
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0])
  // Precio efectivo según la medida elegida (variant pricing); si no hay tabla, usa el base.
  const currentPrice = (sizePrices && sizePrices[selectedSize] != null) ? sizePrices[selectedSize] : price
  const hasColors = availableColors && availableColors.length > 0
  const initialColor = defaultColor && availableColors?.some(c => c.name === defaultColor)
    ? defaultColor
    : (availableColors?.[0]?.name ?? "")
  // Estado interno (uncontrolled) — se usa siempre que el caller no pase
  // selectedColor/onSelectColor. Si los pasa (modo controlado), esos props
  // ganan y este estado queda sin usar (no se pierde nada al no controlarlo).
  const [internalSelectedColor, setInternalSelectedColor] = useState<string>(initialColor)
  const selectedColor = selectedColorProp !== undefined ? selectedColorProp : internalSelectedColor
  const setSelectedColor = onSelectColor ?? setInternalSelectedColor
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

  /** 'Chico / Logo' | 'Mediano' | 'Grande' → el R1/R2/R3 que ya usa fulfillment. */
  const stampSizeCode = (mode?: string | null): 'R1' | 'R2' | 'R3' | undefined =>
    mode === 'chest-logo' ? 'R1' : mode === 'medium' ? 'R2' : mode === 'large' ? 'R3' : undefined

  const doAdd = () => {
    addItem({
      id: `${productId}-${selectedSize}-${selectedColor || 'def'}-${Date.now()}`,
      productId,
      name: `${productName} — ${brandName}`,
      garmentType: category || "Producto",
      color: selectedColor,
      size: selectedSize,
      price: currentPrice,
      quantity: 1,
      image: imageUrl || "",
      tenantId,
      brandSlug,
      brandName,
      // lo que se imprime, separado de la foto que se muestra
      frontDesign: printFront?.designUrl || undefined,
      backDesign: printBack?.designUrl || undefined,
      frontStampSize: stampSizeCode(printFront?.stampMode),
      backStampSize: stampSizeCode(printBack?.stampMode),
      doble_estampa: printFront?.designUrl && printBack?.designUrl ? 'Si' : 'No',
      metadata: {
        print_front: printFront || null,
        print_back: printBack || null,
      },
    })
    fpixel.event("AddToCart", {
      content_ids: [productId],
      content_name: `${productName} — ${brandName}`,
      content_type: "product",
      content_category: category || undefined,
      value: currentPrice,
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
      value: currentPrice,
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

      {/* Talles / Medidas */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wider text-zinc-500">{sizeLabel}</span>
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
        {/* Medidas: tabla inline del talle elegido si hay datos + link a la guía
            (siempre presente → todo producto muestra medidas, nunca falta). */}
        <div className="flex flex-col gap-1 pt-1">
          {sizing && sizing[selectedSize] && (
            <span className="text-xs text-zinc-400">
              📏 Talle {selectedSize}: <span className="text-zinc-200">{sizing[selectedSize]}</span>
            </span>
          )}
          {sizeGuideUrl && (
            <a
              href={sizeGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
            >
              Ver guía de talles
            </a>
          )}
        </div>
      </div>

      {/* Precio en vivo según la medida (variant pricing) */}
      {sizePrices && (
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">${currentPrice.toLocaleString("es-AR")}</span>
          <span className="text-sm text-zinc-400">· {selectedSize}</span>
        </div>
      )}

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
