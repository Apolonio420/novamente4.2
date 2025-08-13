"use client"

import { Badge } from "@/components/ui/badge"

// Coordenadas exactas del JSON proporcionado
const EXACT_COORDINATES = {
  "hoodie-black-front": { x: 168, y: 200, width: 264, height: 264 },
  "hoodie-caramel-front": { x: 168, y: 200, width: 264, height: 264 },
  "hoodie-cream-front": { x: 168, y: 200, width: 264, height: 264 },
  "hoodie-gray-front": { x: 168, y: 200, width: 264, height: 264 },
  "tshirt-black-classic-front": { x: 168, y: 180, width: 264, height: 264 },
  "tshirt-white-classic-front": { x: 168, y: 180, width: 264, height: 264 },
  "tshirt-black-oversize-front": { x: 148, y: 180, width: 304, height: 304 },
  "tshirt-white-oversize-front": { x: 148, y: 180, width: 304, height: 304 },
  "tshirt-caramel-oversize-front": { x: 148, y: 180, width: 304, height: 304 },
}

interface PrintAreaProps {
  garmentType: string
  garmentColor: string
  garmentImage: string
  containerWidth?: number
  containerHeight?: number
}

export function PrintArea({
  garmentType,
  garmentColor,
  garmentImage,
  containerWidth = 600,
  containerHeight = 600,
}: PrintAreaProps) {
  // Crear la clave para buscar las coordenadas exactas
  const garmentKey = `${garmentType}-${garmentColor}-front` as keyof typeof EXACT_COORDINATES
  const coordinates = EXACT_COORDINATES[garmentKey]

  if (!coordinates) {
    console.warn(`No exact coordinates found for: ${garmentKey}`)
    return null
  }

  // Convertir coordenadas absolutas a porcentajes
  const leftPercent = (coordinates.x / containerWidth) * 100
  const topPercent = (coordinates.y / containerHeight) * 100
  const widthPercent = (coordinates.width / containerWidth) * 100
  const heightPercent = (coordinates.height / containerHeight) * 100

  return (
    <div className="relative w-full h-full">
      {/* Área de impresión con coordenadas exactas */}
      <div
        className="absolute border-2 border-dashed border-red-500 bg-red-500/10"
        style={{
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
        }}
      >
        {/* Coordenadas en la esquina superior izquierda */}
        <div className="absolute -top-6 left-0 text-xs text-red-600 font-mono bg-white px-1 rounded">
          {coordinates.x},{coordinates.y} {coordinates.width}×{coordinates.height}
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
