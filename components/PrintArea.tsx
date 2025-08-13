"use client"

import { useState, useEffect } from "react"

interface PrintAreaProps {
  garmentType: string
  garmentColor: string
  activeTab: "front" | "back"
  designImage: string | null
  designPosition: { x: number; y: number }
  designSize: number
  onPositionChange: (position: { x: number; y: number }) => void
  onSizeChange: (size: number) => void
}

// Coordenadas exactas del JSON
const EXACT_COORDINATES = {
  "astra-oversize-hoodie-black-front": { x: 112, y: 175, width: 180, height: 145 },
  "astra-oversize-hoodie-black-back": { x: 116, y: 175, width: 180, height: 240 },
  "astra-oversize-hoodie-caramel-front": { x: 112, y: 160, width: 176, height: 145 },
  "astra-oversize-hoodie-caramel-back": { x: 128, y: 155, width: 144, height: 245 },
  "astra-oversize-hoodie-cream-front": { x: 116, y: 155, width: 160, height: 135 },
  "astra-oversize-hoodie-cream-back": { x: 124, y: 150, width: 156, height: 255 },
  "astra-oversize-hoodie-gray-front": { x: 116, y: 145, width: 160, height: 150 },
  "astra-oversize-hoodie-gray-back": { x: 116, y: 150, width: 164, height: 255 },
  "aldea-classic-tshirt-black-front": { x: 96, y: 135, width: 204, height: 265 },
  "aldea-classic-tshirt-black-back": { x: 100, y: 105, width: 192, height: 310 },
  "aldea-classic-tshirt-white-front": { x: 96, y: 125, width: 204, height: 290 },
  "aldea-classic-tshirt-white-back": { x: 112, y: 110, width: 180, height: 300 },
  "aura-oversize-tshirt-black-front": { x: 104, y: 130, width: 184, height: 275 },
  "aura-oversize-tshirt-black-back": { x: 108, y: 105, width: 184, height: 310 },
  "aura-oversize-tshirt-white-front": { x: 112, y: 115, width: 164, height: 305 },
  "aura-oversize-tshirt-white-back": { x: 120, y: 105, width: 176, height: 315 },
  "aura-oversize-tshirt-caramel-front": { x: 116, y: 120, width: 176, height: 290 },
  "aura-oversize-tshirt-caramel-back": { x: 116, y: 100, width: 172, height: 315 },
}

export function PrintArea({
  garmentType,
  garmentColor,
  activeTab,
  designImage,
  designPosition,
  designSize,
  onPositionChange,
  onSizeChange,
}: PrintAreaProps) {
  const [printArea, setPrintArea] = useState({ left: 25, top: 25, width: 50, height: 50 })

  useEffect(() => {
    // Obtener coordenadas exactas para la combinación actual
    const key = `${garmentType}-${garmentColor}-${activeTab}`
    const coords = EXACT_COORDINATES[key as keyof typeof EXACT_COORDINATES]

    if (coords) {
      // Convertir coordenadas absolutas a porcentajes (asumiendo contenedor de 400x400)
      const CONTAINER_SIZE = 400
      const newPrintArea = {
        left: (coords.x / CONTAINER_SIZE) * 100,
        top: (coords.y / CONTAINER_SIZE) * 100,
        width: (coords.width / CONTAINER_SIZE) * 100,
        height: (coords.height / CONTAINER_SIZE) * 100,
      }
      setPrintArea(newPrintArea)
    } else {
      // Fallback a coordenadas genéricas
      setPrintArea({ left: 25, top: 30, width: 50, height: 40 })
    }
  }, [garmentType, garmentColor, activeTab])

  return (
    <>
      {/* Área de impresión - solo el borde rojo punteado */}
      <div
        className="absolute border-2 border-red-500 border-dashed pointer-events-none"
        style={{
          left: `${printArea.left}%`,
          top: `${printArea.top}%`,
          width: `${printArea.width}%`,
          height: `${printArea.height}%`,
        }}
      />

      {/* Imagen de diseño */}
      {designImage && (
        <div
          className="absolute cursor-move"
          style={{
            left: `${designPosition.x}%`,
            top: `${designPosition.y}%`,
            width: `${designSize}px`,
            height: `${designSize}px`,
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          <img
            src={designImage || "/placeholder.svg"}
            alt="Diseño personalizado"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
            onError={(e) => {
              console.error("Error loading design image:", designImage)
              e.currentTarget.src = "/placeholder.svg"
            }}
          />
        </div>
      )}
    </>
  )
}
