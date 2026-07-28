"use client"

import { useEffect, useState } from "react"
import type { LiquidationColor, LiquidationGarmentKey, LiquidationSize, LiquidationStockRow } from "@/lib/stock/liquidation"

interface StockPerSizeProps {
  productId: string
}

// Mapeo explicito id de producto (lib/products.ts) -> combinacion trackeada en
// garment_stock. Los ids no dicen "melange" (buzo-hoodie-gris = gris-melange),
// asi que no conviene inferirlo con los normalizadores acá: se declara a mano.
const PRODUCT_STOCK_MAP: Record<string, { productKey: LiquidationGarmentKey; color: LiquidationColor }> = {
  "buzo-hoodie-marron": { productKey: "buzo-oversize", color: "marron" },
  "buzo-hoodie-crema": { productKey: "buzo-oversize", color: "crema" },
  "buzo-hoodie-gris": { productKey: "buzo-oversize", color: "gris-melange" },
}

const SIZE_ORDER: LiquidationSize[] = ["S", "M", "L", "XL"]

/**
 * Chips discretos con el stock por talle para las prendas de liquidacion
 * (proveedor viejo). La pagina de producto es SSG, asi que este componente
 * client fetchea /api/stock/liquidation para tener el dato fresco.
 * Fail-open: si el fetch falla o el producto no esta trackeado, no renderiza nada.
 */
export function StockPerSize({ productId }: StockPerSizeProps) {
  const mapping = PRODUCT_STOCK_MAP[productId]
  const [rows, setRows] = useState<LiquidationStockRow[]>([])

  useEffect(() => {
    if (!mapping) return
    fetch("/api/stock/liquidation")
      .then((res) => res.json())
      .then((data) => setRows(Array.isArray(data?.rows) ? data.rows : []))
      .catch(() => {})
  }, [mapping])

  if (!mapping || rows.length === 0) return null

  const bySize = new Map(
    rows
      .filter((r) => r.productKey === mapping.productKey && r.color === mapping.color)
      .map((r) => [r.size, r.qty]),
  )

  if (bySize.size === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4" aria-label="Stock disponible por talle">
      {SIZE_ORDER.filter((size) => bySize.has(size)).map((size) => {
        const qty = bySize.get(size)!
        const outOfStock = qty <= 0
        return (
          <span
            key={size}
            className={`text-xs rounded-full px-2.5 py-1 border ${
              outOfStock
                ? "text-muted-foreground border-muted-foreground/30 bg-muted/40"
                : "text-foreground border-border bg-muted/20"
            }`}
          >
            {size} · {outOfStock ? "Sin stock" : `quedan ${qty}`}
          </span>
        )
      })}
    </div>
  )
}
