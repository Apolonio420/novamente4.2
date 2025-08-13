"use client"

import { Badge } from "@/components/ui/badge"

// Coordenadas exactas del JSON proporcionado convertidas a porcentajes
const EXACT_COORDINATES = {
  "aura-oversize-tshirt": {
    front: { x: 50, y: 32, width: 28, height: 33 },
    back: { x: 50, y: 32, width: 28, height: 33 },
  },
  "aldea-classic-tshirt": {
    front: { x: 50, y: 30, width: 30, height: 35 },
    back: { x: 50, y: 30, width: 30, height: 35 },
  },
  "astra-oversize-hoodie": {
    front: { x: 50, y: 35, width: 25, height: 30 },
    back: { x: 50, y: 32, width: 28, height: 33 },
  },
  lienzo: {
    front: { x: 50, y: 50, width: 90, height: 90 },
    back: { x: 50, y: 50, width: 90, height: 90 },
  },
}

interface PrintAreaProps {
  garmentType: string
  activeTab: "front" | "back"
  className?: string
}

export function PrintArea({ garmentType, activeTab, className = "" }: PrintAreaProps) {
  // Obtener coordenadas exactas del JSON
  const garmentCoords = EXACT_COORDINATES[garmentType as keyof typeof EXACT_COORDINATES]

  if (!garmentCoords) {
    console.warn(`No exact coordinates found for garment: ${garmentType}`)
    return null
  }

  const coords = garmentCoords[activeTab]
  const { x, y, width, height } = coords

  console.log(`📐 PrintArea for ${garmentType} ${activeTab}:`, coords)

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Área de impresión con coordenadas exactas */}
      <div
        className="absolute border-2 border-red-500 border-dashed bg-red-500/10"
        style={{
          left: `${x - width / 2}%`,
          top: `${y - height / 2}%`,
          width: `${width}%`,
          height: `${height}%`,
        }}
      >
        {/* Coordenadas en la esquina superior izquierda */}
        <div className="absolute -top-6 left-0 text-xs text-red-600 font-mono bg-white px-1 rounded">
          {x},{y} ({width}×{height})
        </div>

        {/* Badge identificador en la esquina superior derecha */}
        <div className="absolute -top-6 right-0">
          <Badge variant="destructive" className="text-xs">
            EXACT JSON
          </Badge>
        </div>
      </div>
    </div>
  )
}
