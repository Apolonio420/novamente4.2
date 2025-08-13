"use client"
import { useMemo } from "react"

interface PrintAreaProps {
  garmentType: string
  activeTab: "front" | "back"
  className?: string
}

// Coordenadas exactas del JSON proporcionado
const EXACT_PRINT_AREAS = {
  // Hoodies
  "hoodie-black-front": {
    margins: { top: 35, right: 27, bottom: 36, left: 28 },
    coordinates: { x: 112, y: 175, width: 180, height: 145 },
  },
  "hoodie-black-back": {
    margins: { top: 35, right: 26, bottom: 17, left: 29 },
    coordinates: { x: 116, y: 175, width: 180, height: 240 },
  },
  "hoodie-caramel-front": {
    margins: { top: 32, right: 28, bottom: 39, left: 28 },
    coordinates: { x: 112, y: 160, width: 176, height: 145 },
  },
  "hoodie-caramel-back": {
    margins: { top: 31, right: 32, bottom: 20, left: 32 },
    coordinates: { x: 128, y: 155, width: 144, height: 245 },
  },
  "hoodie-cream-front": {
    margins: { top: 31, right: 31, bottom: 42, left: 29 },
    coordinates: { x: 116, y: 155, width: 160, height: 135 },
  },
  "hoodie-cream-back": {
    margins: { top: 30, right: 30, bottom: 19, left: 31 },
    coordinates: { x: 124, y: 150, width: 156, height: 255 },
  },
  "hoodie-gray-front": {
    margins: { top: 29, right: 31, bottom: 41, left: 29 },
    coordinates: { x: 116, y: 145, width: 160, height: 150 },
  },
  "hoodie-gray-back": {
    margins: { top: 30, right: 30, bottom: 19, left: 29 },
    coordinates: { x: 116, y: 150, width: 164, height: 255 },
  },

  // T-shirts Classic
  "tshirt-black-classic-front": {
    margins: { top: 27, right: 25, bottom: 20, left: 24 },
    coordinates: { x: 96, y: 135, width: 204, height: 265 },
  },
  "tshirt-black-classic-back": {
    margins: { top: 21, right: 27, bottom: 17, left: 25 },
    coordinates: { x: 100, y: 105, width: 192, height: 310 },
  },
  "tshirt-white-classic-front": {
    margins: { top: 25, right: 25, bottom: 17, left: 24 },
    coordinates: { x: 96, y: 125, width: 204, height: 290 },
  },
  "tshirt-white-classic-back": {
    margins: { top: 22, right: 27, bottom: 18, left: 28 },
    coordinates: { x: 112, y: 110, width: 180, height: 300 },
  },

  // T-shirts Oversize
  "tshirt-black-oversize-front": {
    margins: { top: 26, right: 28, bottom: 19, left: 26 },
    coordinates: { x: 104, y: 130, width: 184, height: 275 },
  },
  "tshirt-black-oversize-back": {
    margins: { top: 21, right: 27, bottom: 17, left: 27 },
    coordinates: { x: 108, y: 105, width: 184, height: 310 },
  },
  "tshirt-white-oversize-front": {
    margins: { top: 23, right: 31, bottom: 16, left: 28 },
    coordinates: { x: 112, y: 115, width: 164, height: 305 },
  },
  "tshirt-white-oversize-back": {
    margins: { top: 21, right: 26, bottom: 16, left: 30 },
    coordinates: { x: 120, y: 105, width: 176, height: 315 },
  },
  "tshirt-caramel-oversize-front": {
    margins: { top: 24, right: 27, bottom: 18, left: 29 },
    coordinates: { x: 116, y: 120, width: 176, height: 290 },
  },
  "tshirt-caramel-oversize-back": {
    margins: { top: 20, right: 28, bottom: 17, left: 29 },
    coordinates: { x: 116, y: 100, width: 172, height: 315 },
  },
}

// Mapeo de tipos de prenda a las claves del JSON
function getGarmentKey(garmentType: string, activeTab: "front" | "back"): string {
  const side = activeTab

  // Mapear tipos de prenda
  switch (garmentType) {
    case "astra-oversize-hoodie":
      return `hoodie-black-${side}` // Default a black, se puede mejorar con color
    case "aura-oversize-tshirt":
      return `tshirt-black-oversize-${side}`
    case "aldea-classic-tshirt":
      return `tshirt-black-classic-${side}`
    default:
      return `tshirt-black-oversize-${side}`
  }
}

export function PrintArea({ garmentType, activeTab, className = "" }: PrintAreaProps) {
  const printAreaData = useMemo(() => {
    const garmentKey = getGarmentKey(garmentType, activeTab)
    const exactData = EXACT_PRINT_AREAS[garmentKey as keyof typeof EXACT_PRINT_AREAS]

    console.log("🎯 PrintArea lookup:", { garmentType, activeTab, garmentKey, exactData })

    if (exactData) {
      console.log("✅ Found EXACT coordinates:", exactData)
      return exactData
    }

    // Fallback por defecto
    const fallback = {
      margins: { top: 25, right: 25, bottom: 25, left: 25 },
      coordinates: { x: 100, y: 150, width: 200, height: 200 },
    }

    console.log("⚠️ Using fallback coordinates:", fallback)
    return fallback
  }, [garmentType, activeTab])

  return (
    <>
      {/* Área de impresión usando márgenes (método principal) */}
      <div
        className={`absolute border-2 border-dashed border-red-500 bg-red-500/10 pointer-events-none ${className}`}
        style={{
          left: `${printAreaData.margins.left}%`,
          top: `${printAreaData.margins.top}%`,
          right: `${printAreaData.margins.right}%`,
          bottom: `${printAreaData.margins.bottom}%`,
        }}
        data-garment={garmentType}
        data-side={activeTab}
      />

      {/* Indicador de coordenadas absolutas (para debug) */}
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none z-10">
        {printAreaData.coordinates.x}, {printAreaData.coordinates.y} | {printAreaData.coordinates.width}×
        {printAreaData.coordinates.height}
      </div>

      {/* Badge de coordenadas exactas */}
      <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded pointer-events-none z-10">
        EXACT JSON
      </div>
    </>
  )
}
