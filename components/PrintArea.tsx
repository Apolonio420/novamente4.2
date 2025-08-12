"use client"

import { cn } from "@/lib/utils"

interface PrintAreaProps {
  garmentType: string
  garmentColor: string
  side: "front" | "back"
  className?: string
}

// Coordenadas exactas del JSON proporcionado
const EXACT_COORDINATES = {
  // Hoodies
  "hoodie-black-front": { x: 112, y: 175, width: 180, height: 145 },
  "hoodie-black-back": { x: 116, y: 175, width: 180, height: 240 },
  "hoodie-caramel-front": { x: 112, y: 160, width: 176, height: 145 },
  "hoodie-caramel-back": { x: 128, y: 155, width: 144, height: 245 },
  "hoodie-cream-front": { x: 116, y: 155, width: 160, height: 135 },
  "hoodie-cream-back": { x: 124, y: 150, width: 156, height: 255 },
  "hoodie-gray-front": { x: 116, y: 145, width: 160, height: 150 },
  "hoodie-gray-back": { x: 116, y: 150, width: 164, height: 255 },

  // T-shirts Classic
  "tshirt-black-classic-front": { x: 96, y: 135, width: 204, height: 265 },
  "tshirt-black-classic-back": { x: 100, y: 105, width: 192, height: 310 },
  "tshirt-white-classic-front": { x: 96, y: 125, width: 204, height: 290 },
  "tshirt-white-classic-back": { x: 112, y: 110, width: 180, height: 300 },

  // T-shirts Oversize
  "tshirt-black-oversize-front": { x: 104, y: 130, width: 184, height: 275 },
  "tshirt-black-oversize-back": { x: 108, y: 105, width: 184, height: 310 },
  "tshirt-white-oversize-front": { x: 112, y: 115, width: 164, height: 305 },
  "tshirt-white-oversize-back": { x: 120, y: 105, width: 176, height: 315 },
  "tshirt-caramel-oversize-front": { x: 116, y: 120, width: 176, height: 290 },
  "tshirt-caramel-oversize-back": { x: 116, y: 100, width: 172, height: 315 },
}

// Mapeo de tipos de prenda a identificadores
function getGarmentKey(garmentType: string, garmentColor: string, side: "front" | "back"): string {
  // Normalizar el tipo de prenda
  let normalizedType = garmentType.toLowerCase()

  // Mapear tipos de prenda
  if (normalizedType.includes("hoodie") || normalizedType.includes("buzo")) {
    normalizedType = "hoodie"
  } else if (normalizedType.includes("oversize")) {
    normalizedType = "tshirt-oversize"
  } else if (normalizedType.includes("classic") || normalizedType.includes("clásic")) {
    normalizedType = "tshirt-classic"
  } else if (normalizedType.includes("tshirt") || normalizedType.includes("remera")) {
    // Por defecto, las remeras son oversize
    normalizedType = "tshirt-oversize"
  }

  // Normalizar color
  let normalizedColor = garmentColor.toLowerCase()
  if (normalizedColor.includes("negro") || normalizedColor.includes("black")) {
    normalizedColor = "black"
  } else if (normalizedColor.includes("blanco") || normalizedColor.includes("white")) {
    normalizedColor = "white"
  } else if (normalizedColor.includes("caramelo") || normalizedColor.includes("caramel")) {
    normalizedColor = "caramel"
  } else if (normalizedColor.includes("crema") || normalizedColor.includes("cream")) {
    normalizedColor = "cream"
  } else if (normalizedColor.includes("gris") || normalizedColor.includes("gray")) {
    normalizedColor = "gray"
  }

  return `${normalizedType}-${normalizedColor}-${side}`
}

export function PrintArea({ garmentType, garmentColor, side, className }: PrintAreaProps) {
  // Obtener la clave del garment
  const garmentKey = getGarmentKey(garmentType, garmentColor, side)

  // Buscar coordenadas exactas
  const exactCoords = EXACT_COORDINATES[garmentKey as keyof typeof EXACT_COORDINATES]

  if (!exactCoords) {
    // Fallback a coordenadas por defecto si no se encuentran exactas
    console.warn(`No exact coordinates found for: ${garmentKey}`)
    return (
      <div
        className={cn(
          "absolute border-2 border-dashed border-primary/60 bg-primary/5 pointer-events-none",
          "transition-all duration-200",
          className,
        )}
        style={{
          left: "25%",
          top: "30%",
          width: "50%",
          height: "40%",
        }}
      />
    )
  }

  // Usar coordenadas exactas del JSON
  // Convertir coordenadas absolutas a porcentajes (asumiendo imagen base de 400x500px)
  const baseWidth = 400
  const baseHeight = 500

  const leftPercent = (exactCoords.x / baseWidth) * 100
  const topPercent = (exactCoords.y / baseHeight) * 100
  const widthPercent = (exactCoords.width / baseWidth) * 100
  const heightPercent = (exactCoords.height / baseHeight) * 100

  return (
    <div
      className={cn(
        "absolute border-2 border-dashed border-primary/60 bg-primary/5 pointer-events-none",
        "transition-all duration-200",
        className,
      )}
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
      }}
    />
  )
}
