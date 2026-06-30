"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"

/**
 * Muestra frente + espalda de un color de producto levemente interpuestos en
 * un único recuadro, para productos con doble estampado. Las imágenes son
 * fotos reales ya compuestas por el partner (no hay print-area que calcular).
 */
export function TwoSidePreview({
  frontSrc,
  backSrc,
  productName,
  colorName,
  onSelectSide,
}: {
  frontSrc: string
  backSrc: string
  productName: string
  colorName: string
  onSelectSide?: (side: "front" | "back") => void
}) {
  return (
    <div className="rounded-lg border bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0">
          Doble estampado
        </Badge>
        <span className="text-xs text-muted-foreground">Frente y espalda incluidos</span>
      </div>

      <div className="relative mx-auto aspect-[3/2] w-full max-w-sm">
        {/* Espalda — atrás, levemente rotada */}
        <button
          type="button"
          onClick={() => onSelectSide?.("back")}
          aria-label={`Ver espalda de ${productName} en ${colorName}`}
          className="absolute left-0 top-1/2 w-[57%] -translate-y-1/2 -rotate-[4deg] transition-transform hover:-translate-y-[calc(50%+2px)]"
        >
          <div className="relative aspect-square overflow-hidden rounded-md border bg-white shadow-md">
            <Image src={backSrc} alt={`${productName} - espalda`} fill className="object-cover" sizes="(max-width: 640px) 50vw, 220px" />
            <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
              Espalda
            </span>
          </div>
        </button>

        {/* Frente — adelante, levemente rotada al otro lado */}
        <button
          type="button"
          onClick={() => onSelectSide?.("front")}
          aria-label={`Ver frente de ${productName} en ${colorName}`}
          className="absolute right-0 top-1/2 z-10 w-[57%] -translate-y-1/2 rotate-[4deg] transition-transform hover:-translate-y-[calc(50%+2px)]"
        >
          <div className="relative aspect-square overflow-hidden rounded-md border-2 border-primary bg-white shadow-lg">
            <Image src={frontSrc} alt={`${productName} - frente`} fill className="object-cover" sizes="(max-width: 640px) 50vw, 220px" />
            <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
              Frente
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}
