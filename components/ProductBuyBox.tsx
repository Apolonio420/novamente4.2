"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cartStore"
import {
  matchGarmentKey,
  matchStockColor,
  normalizeStockSize,
  type LiquidationStockRow,
} from "@/lib/stock/liquidation"

interface ProductBuyBoxProps {
  product: { id: string; name: string; color: string; image: string }
  /** Nombre descriptivo (productDisplayName), el mismo que usa el quick-add de /products. */
  displayName: string
  price: number
  sizes: string[]
}

/**
 * Compra directa desde la ficha /products/[id]. Antes la ficha sólo tenía
 * "Personalizar con IA" y "Consultar por WhatsApp": se compraba únicamente
 * con el quick-add del listado (QA checkout 01/10/2026). El item que agrega
 * es idéntico al del quick-add (components/ProductsFilter.tsx) para que
 * stock-guard y fulfillment lo lean igual. El talle se elige a mano: no hay
 * default, para no mandar a producir un talle que el cliente no eligió.
 */
export function ProductBuyBox({ product, displayName, price, sizes }: ProductBuyBoxProps) {
  const router = useRouter()
  const addItem = useCart((s) => s.addItem)
  const unico = sizes.length === 1
  const [size, setSize] = useState<string | null>(unico ? sizes[0] : null)
  const [falta, setFalta] = useState(false)
  const [agregado, setAgregado] = useState(false)

  // Stock por talle de liquidación (mismo criterio que el quick-add). Fail-open.
  const [stockRows, setStockRows] = useState<LiquidationStockRow[]>([])
  useEffect(() => {
    fetch("/api/stock/liquidation")
      .then((res) => res.json())
      .then((data) => setStockRows(Array.isArray(data?.rows) ? data.rows : []))
      .catch(() => {})
  }, [])
  const sinStock = (s: string) => {
    const key = matchGarmentKey(product.name)
    const color = matchStockColor(product.color)
    const norm = normalizeStockSize(s)
    if (!key || !color || !norm) return false
    const row = stockRows.find((r) => r.productKey === key && r.color === color && r.size === norm)
    return !!row && row.qty <= 0
  }

  const agregar = (): boolean => {
    if (!size || sinStock(size)) {
      setFalta(true)
      return false
    }
    addItem({
      id: `${product.id}-${size}-${Date.now()}`,
      name: displayName,
      // garmentType con el nombre "viejo": stock-guard / matchGarmentKey lo parsean así.
      garmentType: product.name,
      color: product.color,
      size,
      price,
      quantity: 1,
      image: product.image,
    })
    return true
  }

  return (
    <div className="mb-6" data-testid="product-buy-box">
      {!unico && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${falta && !size ? "text-red-500" : ""}`}>Talle:</span>
            {falta && !size && (
              <span id="talle-error" className="text-xs font-medium text-red-500">
                Elegí un talle
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Talle" aria-describedby={falta && !size ? "talle-error" : undefined}>
            {sizes.map((s) => {
              const agotado = sinStock(s)
              return (
                <button
                  key={s}
                  type="button"
                  disabled={agotado}
                  aria-pressed={size === s}
                  onClick={() => {
                    setSize(s)
                    setFalta(false)
                  }}
                  className={`min-w-12 h-11 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    size === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : falta && !size
                        ? "border-red-500"
                        : "border-border hover:border-primary/60"
                  } ${agotado ? "opacity-40 line-through cursor-not-allowed" : ""}`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          className="flex-1 rounded-xl py-6 text-lg font-semibold"
          onClick={() => {
            if (agregar()) router.push("/checkout")
          }}
        >
          Comprar ahora
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-xl py-6 text-lg"
          onClick={() => {
            if (!agregar()) return
            setAgregado(true)
            setTimeout(() => setAgregado(false), 2000)
          }}
        >
          {agregado ? <Check className="w-5 h-5 mr-2" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
          {agregado ? "¡Agregado!" : "Agregar al carrito"}
        </Button>
      </div>
    </div>
  )
}
