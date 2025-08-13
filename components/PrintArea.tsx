"use client"

// Coordenadas exactas del JSON proporcionado
const EXACT_COORDINATES = {
  // Hoodies
  "astra-hoodie-black-front": { x: 112, y: 175, width: 180, height: 145 },
  "astra-hoodie-black-back": { x: 116, y: 175, width: 180, height: 240 },
  "astra-hoodie-caramel-front": { x: 112, y: 160, width: 176, height: 145 },
  "astra-hoodie-caramel-back": { x: 128, y: 155, width: 144, height: 245 },
  "astra-hoodie-cream-front": { x: 116, y: 155, width: 160, height: 135 },
  "astra-hoodie-cream-back": { x: 124, y: 150, width: 156, height: 255 },
  "astra-hoodie-gray-front": { x: 116, y: 145, width: 160, height: 150 },
  "astra-hoodie-gray-back": { x: 116, y: 150, width: 164, height: 255 },

  // T-shirts Classic
  "aldea-classic-tshirt-black-front": { x: 96, y: 135, width: 204, height: 265 },
  "aldea-classic-tshirt-black-back": { x: 100, y: 105, width: 192, height: 310 },
  "aldea-classic-tshirt-white-front": { x: 96, y: 125, width: 204, height: 290 },
  "aldea-classic-tshirt-white-back": { x: 112, y: 110, width: 180, height: 300 },

  // T-shirts Oversize
  "aura-oversize-tshirt-black-front": { x: 104, y: 130, width: 184, height: 275 },
  "aura-oversize-tshirt-black-back": { x: 108, y: 105, width: 184, height: 310 },
  "aura-oversize-tshirt-white-front": { x: 112, y: 115, width: 164, height: 305 },
  "aura-oversize-tshirt-white-back": { x: 120, y: 105, width: 176, height: 315 },
  "aura-oversize-tshirt-caramel-front": { x: 116, y: 120, width: 176, height: 290 },
  "aura-oversize-tshirt-caramel-back": { x: 116, y: 100, width: 172, height: 315 },
}

interface PrintAreaProps {
  garmentType: string
  garmentColor: string
  activeTab: "front" | "back"
}

export function PrintArea({ garmentType, garmentColor, activeTab }: PrintAreaProps) {
  // Crear la clave para buscar las coordenadas exactas
  const coordinateKey = `${garmentType}-${garmentColor}-${activeTab}`
  const coordinates = EXACT_COORDINATES[coordinateKey as keyof typeof EXACT_COORDINATES]

  if (!coordinates) {
    console.log(`No exact coordinates found for: ${coordinateKey}`)
    // Fallback a coordenadas genéricas
    return (
      <div
        className="absolute border-2 border-red-500 border-dashed pointer-events-none"
        style={{
          left: "25%",
          top: "30%",
          width: "50%",
          height: "40%",
        }}
      />
    )
  }

  // Convertir coordenadas absolutas a porcentajes (asumiendo contenedor de 400x500px)
  const containerWidth = 400
  const containerHeight = 500

  const leftPercent = (coordinates.x / containerWidth) * 100
  const topPercent = (coordinates.y / containerHeight) * 100
  const widthPercent = (coordinates.width / containerWidth) * 100
  const heightPercent = (coordinates.height / containerHeight) * 100

  return (
    <div
      className="absolute border-2 border-red-500 border-dashed pointer-events-none"
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
      }}
    />
  )
}
