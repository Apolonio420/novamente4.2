"use client"

// Mapeo exacto del JSON proporcionado - coordenadas absolutas
const EXACT_COORDINATES = {
  // Hoodies
  "astra-oversize-hoodie-black-front": { x: 112, y: 175, width: 180, height: 145 },
  "astra-oversize-hoodie-black-back": { x: 116, y: 175, width: 180, height: 240 },
  "astra-oversize-hoodie-caramel-front": { x: 112, y: 160, width: 176, height: 145 },
  "astra-oversize-hoodie-caramel-back": { x: 128, y: 155, width: 144, height: 245 },
  "astra-oversize-hoodie-white-front": { x: 116, y: 155, width: 160, height: 135 }, // cream
  "astra-oversize-hoodie-white-back": { x: 124, y: 150, width: 156, height: 255 }, // cream
  "astra-oversize-hoodie-cream-front": { x: 116, y: 155, width: 160, height: 135 },
  "astra-oversize-hoodie-cream-back": { x: 124, y: 150, width: 156, height: 255 },
  "astra-oversize-hoodie-gray-front": { x: 116, y: 145, width: 160, height: 150 },
  "astra-oversize-hoodie-gray-back": { x: 116, y: 150, width: 164, height: 255 },

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

  // Lienzo (canvas)
  "lienzo-custom-front": { x: 50, y: 50, width: 350, height: 400 },
  "lienzo-custom-back": { x: 50, y: 50, width: 350, height: 400 },
}

interface PrintAreaProps {
  garmentType: string
  activeTab: "front" | "back"
  selectedColor?: string
  className?: string
}

export function PrintArea({ garmentType, activeTab, selectedColor = "black", className = "" }: PrintAreaProps) {
  // Crear la clave para buscar las coordenadas exactas
  const garmentKey = `${garmentType}-${selectedColor}-${activeTab}` as keyof typeof EXACT_COORDINATES
  const coordinates = EXACT_COORDINATES[garmentKey]

  if (!coordinates) {
    console.warn(`No exact coordinates found for: ${garmentKey}`)
    // Fallback genérico
    return (
      <div className={`absolute inset-0 pointer-events-none ${className}`}>
        <div
          className="absolute border-2 border-red-500 border-dashed bg-red-500/10"
          style={{
            left: "25%",
            top: "30%",
            width: "50%",
            height: "40%",
          }}
        />
      </div>
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
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Área de impresión con coordenadas exactas del JSON - SIN texto ni badge */}
      <div
        className="absolute border-2 border-red-500 border-dashed bg-red-500/10"
        style={{
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
        }}
      />
    </div>
  )
}

// Exportar función para obtener las coordenadas del área de impresión
export function getPrintAreaBounds(garmentType: string, activeTab: "front" | "back", selectedColor = "black") {
  const garmentKey = `${garmentType}-${selectedColor}-${activeTab}` as keyof typeof EXACT_COORDINATES
  const coordinates = EXACT_COORDINATES[garmentKey]

  if (!coordinates) {
    // Fallback genérico
    return {
      left: 25,
      top: 30,
      width: 50,
      height: 40,
    }
  }

  // Convertir coordenadas absolutas a porcentajes
  const containerWidth = 400
  const containerHeight = 500

  const leftPercent = (coordinates.x / containerWidth) * 100
  const topPercent = (coordinates.y / containerHeight) * 100
  const widthPercent = (coordinates.width / containerWidth) * 100
  const heightPercent = (coordinates.height / containerHeight) * 100

  return {
    left: leftPercent,
    top: topPercent,
    width: widthPercent,
    height: heightPercent,
  }
}
