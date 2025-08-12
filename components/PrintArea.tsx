"use client"

import type React from "react"

import { useMemo } from "react"

interface PrintAreaProps {
  garmentType: string
  color: string
  side: "front" | "back"
  children: React.ReactNode
  className?: string
}

// Coordenadas exactas del JSON proporcionado
const EXACT_COORDINATES = {
  "hoodie-black-front": { x: 50, y: 35, width: 25, height: 30 },
  "hoodie-black-back": { x: 50, y: 25, width: 25, height: 30 },
  "hoodie-cream-front": { x: 50, y: 35, width: 25, height: 30 },
  "hoodie-cream-back": { x: 50, y: 25, width: 25, height: 30 },
  "hoodie-caramel-front": { x: 50, y: 35, width: 25, height: 30 },
  "hoodie-caramel-back": { x: 50, y: 25, width: 25, height: 30 },
  "hoodie-gray-front": { x: 50, y: 35, width: 25, height: 30 },
  "hoodie-gray-back": { x: 50, y: 25, width: 25, height: 30 },
  "tshirt-black-classic-front": { x: 50, y: 30, width: 20, height: 25 },
  "tshirt-black-classic-back": { x: 50, y: 20, width: 20, height: 25 },
  "tshirt-white-classic-front": { x: 50, y: 30, width: 20, height: 25 },
  "tshirt-white-classic-back": { x: 50, y: 20, width: 20, height: 25 },
  "tshirt-black-oversize-front": { x: 50, y: 32, width: 22, height: 28 },
  "tshirt-black-oversize-back": { x: 50, y: 22, width: 22, height: 28 },
  "tshirt-white-oversize-front": { x: 50, y: 32, width: 22, height: 28 },
  "tshirt-white-oversize-back": { x: 50, y: 22, width: 22, height: 28 },
  "tshirt-caramel-oversize-front": { x: 50, y: 32, width: 22, height: 28 },
  "tshirt-caramel-oversize-back": { x: 50, y: 22, width: 22, height: 28 },
}

// Mapeo de tipos de prenda para compatibilidad
const GARMENT_TYPE_MAPPING: Record<string, string> = {
  "aura-oversize-tshirt": "tshirt-oversize",
  "aldea-classic-tshirt": "tshirt-classic",
  hoodie: "hoodie",
  "oversize-tshirt": "tshirt-oversize",
  "classic-tshirt": "tshirt-classic",
}

export function PrintArea({ garmentType, color, side, children, className = "" }: PrintAreaProps) {
  const coordinates = useMemo(() => {
    // Mapear el tipo de prenda
    const mappedType = GARMENT_TYPE_MAPPING[garmentType] || garmentType

    // Crear la clave para buscar coordenadas exactas
    const key = `${mappedType}-${color}-${side}`

    console.log("🎯 PrintArea lookup:", { garmentType, mappedType, color, side, key })

    // Buscar coordenadas exactas primero
    if (EXACT_COORDINATES[key as keyof typeof EXACT_COORDINATES]) {
      const coords = EXACT_COORDINATES[key as keyof typeof EXACT_COORDINATES]
      console.log("✅ Found EXACT coordinates:", coords)
      return coords
    }

    // Fallback a coordenadas por defecto basadas en tipo
    let defaultCoords
    if (mappedType.includes("hoodie")) {
      defaultCoords =
        side === "front" ? { x: 50, y: 35, width: 25, height: 30 } : { x: 50, y: 25, width: 25, height: 30 }
    } else if (mappedType.includes("oversize")) {
      defaultCoords =
        side === "front" ? { x: 50, y: 32, width: 22, height: 28 } : { x: 50, y: 22, width: 22, height: 28 }
    } else {
      // Classic t-shirt
      defaultCoords =
        side === "front" ? { x: 50, y: 30, width: 20, height: 25 } : { x: 50, y: 20, width: 20, height: 25 }
    }

    console.log("⚠️ Using fallback coordinates:", defaultCoords)
    return defaultCoords
  }, [garmentType, color, side])

  const style = {
    position: "absolute" as const,
    left: `${coordinates.x - coordinates.width / 2}%`,
    top: `${coordinates.y - coordinates.height / 2}%`,
    width: `${coordinates.width}%`,
    height: `${coordinates.height}%`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none" as const,
  }

  return (
    <div
      className={`print-area ${className}`}
      style={style}
      data-garment={garmentType}
      data-color={color}
      data-side={side}
    >
      {children}
    </div>
  )
}
