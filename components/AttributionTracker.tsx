"use client"

import { useEffect, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { captureAttribution } from "@/lib/attribution"

/**
 * Captura los UTMs de la URL en cada navegación (last-touch, TTL 30 días).
 * Se monta en el layout raíz, así aplica a TODO el sitio: /malvinas/[slug],
 * /buzos-egresados, /p/[slug], home, etc.
 *
 * No renderiza nada. Si no hay parámetros de campaña en la URL, no toca lo
 * guardado — la lógica vive en lib/attribution.ts.
 */
function AttributionTrackerInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    captureAttribution(searchParams?.toString() ?? "")
  }, [pathname, searchParams])

  return null
}

export default function AttributionTracker() {
  // useSearchParams necesita un boundary de Suspense para no forzar render
  // dinámico en todo el árbol (mismo patrón que components/FacebookPixel.tsx).
  return (
    <Suspense fallback={null}>
      <AttributionTrackerInner />
    </Suspense>
  )
}
