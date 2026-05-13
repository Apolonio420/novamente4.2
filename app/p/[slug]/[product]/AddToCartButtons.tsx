"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Zap, MessageCircle } from "lucide-react"
import { useCart } from "@/lib/cartStore"
import { useToast } from "@/hooks/use-toast"

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"] as const

interface AddToCartButtonsProps {
  productId: string
  productName: string
  brandName: string
  category: string | null
  price: number
  imageUrl: string | null
  // Talles posibles — si el partner_product.metadata.sizes existe se pasan;
  // si no, default unisex S-XXL.
  sizes?: string[]
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
  category,
  price,
  imageUrl,
  sizes,
  fallbackWhatsappUrl,
  whatsappLabel = "Consultar por WhatsApp",
  primaryColor,
}: AddToCartButtonsProps) {
  const availableSizes = sizes && sizes.length > 0 ? sizes : DEFAULT_SIZES
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0])
  const [adding, setAdding] = useState(false)
  const { addItem } = useCart()
  const { toast } = useToast()
  const router = useRouter()

  const doAdd = () => {
    addItem({
      id: `${productId}-${selectedSize}-${Date.now()}`,
      name: `${productName} — ${brandName}`,
      garmentType: category || "Producto",
      color: "",
      size: selectedSize,
      price,
      quantity: 1,
      image: imageUrl || "",
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
    toast({
      title: "Producto agregado",
      description: `Te llevamos al checkout...`,
    })
    router.push("/checkout")
  }

  return (
    <div className="flex flex-col gap-3">
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
