"use client"

import { useEffect, useRef } from "react"
import * as fpixel from "@/lib/fpixel"

// Dispara ViewContent al abrir una ficha de producto PROPIA (/malvinas/[slug] y
// /products/[id]). Hasta la auditoría del 31/08/2026 este evento solo existía en
// los storefronts de partners (/p/...) y en /crear, así que el embudo de las
// campañas propias quedaba ciego entre la visita y el checkout: no se podía
// saber quién miró qué producto, ni armar retargeting por ficha vista, ni darle
// a Meta señal de valor. Mismo patrón que components/partners/brand-landing-pixel.
export function ProductViewPixel({
  id,
  name,
  price,
  category,
}: {
  id: string
  name: string
  price: number
  category: string
}) {
  const firedRef = useRef(false)
  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    fpixel.event("ViewContent", {
      content_ids: [id],
      content_name: name,
      content_type: "product",
      content_category: category,
      value: price,
      currency: "ARS",
    })
  }, [id, name, price, category])
  return null
}
