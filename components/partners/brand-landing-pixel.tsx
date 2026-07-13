"use client"

import { useEffect, useRef } from "react"
import * as fpixel from "@/lib/fpixel"

// Dispara ViewContent al cargar la landing de marca (/p/[slug]).
// Portado desde el storefront legacy /merch/[brand] (retirado): Meta necesita
// la señal de "vio el storefront" para retargeting y optimización de campañas
// con landing en la marca. Convive con StorefrontTracker (analytics interno).
export function BrandLandingPixel({
  brandId,
  brandName,
  productCount,
}: {
  brandId: string
  brandName: string
  productCount: number
}) {
  const firedRef = useRef(false)
  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    fpixel.event("ViewContent", {
      content_ids: [brandId],
      content_name: brandName,
      content_type: "product_group",
      content_category: "brand_landing",
      num_items: productCount,
      currency: "ARS",
    })
  }, [brandId, brandName, productCount])
  return null
}
