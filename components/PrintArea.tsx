"use client"

import { Badge } from "@/components/ui/badge"

// Coordenadas exactas del JSON proporcionado
const EXACT_COORDINATES = {
  "/garments/hoodie-black-front.jpeg": {
    x: 112,
    y: 175,
    width: 180,
    height: 145,
    margins: { top: 35, right: 27, bottom: 36, left: 28 },
  },
  "/garments/hoodie-black-back.jpeg": {
    x: 116,
    y: 175,
    width: 180,
    height: 240,
    margins: { top: 35, right: 26, bottom: 17, left: 29 },
  },
  "/garments/hoodie-caramel-front.jpeg": {
    x: 112,
    y: 160,
    width: 176,
    height: 145,
    margins: { top: 32, right: 28, bottom: 39, left: 28 },
  },
  "/garments/hoodie-caramel-back.png": {
    x: 128,
    y: 155,
    width: 144,
    height: 245,
    margins: { top: 31, right: 32, bottom: 20, left: 32 },
  },
  "/garments/hoodie-cream-front.jpeg": {
    x: 116,
    y: 155,
    width: 160,
    height: 135,
    margins: { top: 31, right: 31, bottom: 42, left: 29 },
  },
  "/garments/hoodie-cream-back.png": {
    x: 124,
    y: 150,
    width: 156,
    height: 255,
    margins: { top: 30, right: 30, bottom: 19, left: 31 },
  },
  "/garments/hoodie-gray-front.jpeg": {
    x: 116,
    y: 145,
    width: 160,
    height: 150,
    margins: { top: 29, right: 31, bottom: 41, left: 29 },
  },
  "/garments/hoodie-gray-back.png": {
    x: 116,
    y: 150,
    width: 164,
    height: 255,
    margins: { top: 30, right: 30, bottom: 19, left: 29 },
  },
  "/garments/tshirt-black-classic-front.jpeg": {
    x: 96,
    y: 135,
    width: 204,
    height: 265,
    margins: { top: 27, right: 25, bottom: 20, left: 24 },
  },
  "/garments/tshirt-black-classic-back.jpeg": {
    x: 100,
    y: 105,
    width: 192,
    height: 310,
    margins: { top: 21, right: 27, bottom: 17, left: 25 },
  },
  "/garments/tshirt-black-oversize-front.jpeg": {
    x: 104,
    y: 130,
    width: 184,
    height: 275,
    margins: { top: 26, right: 28, bottom: 19, left: 26 },
  },
  "/garments/tshirt-black-oversize-back.jpeg": {
    x: 108,
    y: 105,
    width: 184,
    height: 310,
    margins: { top: 21, right: 27, bottom: 17, left: 27 },
  },
  "/garments/tshirt-white-classic-front.jpeg": {
    x: 96,
    y: 125,
    width: 204,
    height: 290,
    margins: { top: 25, right: 25, bottom: 17, left: 24 },
  },
  "/garments/tshirt-white-classic-back.jpeg": {
    x: 112,
    y: 110,
    width: 180,
    height: 300,
    margins: { top: 22, right: 27, bottom: 18, left: 28 },
  },
  "/garments/tshirt-white-oversize-front.jpeg": {
    x: 112,
    y: 115,
    width: 164,
    height: 305,
    margins: { top: 23, right: 31, bottom: 16, left: 28 },
  },
  "/garments/tshirt-white-oversize-back.jpeg": {
    x: 120,
    y: 105,
    width: 176,
    height: 315,
    margins: { top: 21, right: 26, bottom: 16, left: 30 },
  },
  "/garments/tshirt-caramel-oversize-front.jpeg": {
    x: 116,
    y: 120,
    width: 176,
    height: 290,
    margins: { top: 24, right: 27, bottom: 18, left: 29 },
  },
  "/garments/tshirt-caramel-oversize-back.jpeg": {
    x: 116,
    y: 100,
    width: 172,
    height: 315,
    margins: { top: 20, right: 28, bottom: 17, left: 29 },
  },
}

interface PrintAreaProps {
  garmentPath: string
  containerWidth: number
  containerHeight: number
}

export function PrintArea({ garmentPath, containerWidth, containerHeight }: PrintAreaProps) {
  // Buscar coordenadas exactas del JSON
  const exactCoords = EXACT_COORDINATES[garmentPath as keyof typeof EXACT_COORDINATES]

  if (!exactCoords) {
    // Fallback para prendas no mapeadas
    return (
      <div
        className="absolute border-2 border-dashed border-gray-400 bg-gray-100/20 pointer-events-none"
        style={{
          left: "25%",
          top: "30%",
          width: "50%",
          height: "40%",
        }}
      >
        <div className="absolute -top-6 left-0 text-xs text-gray-500 bg-white px-1 rounded">Default Area</div>
      </div>
    )
  }

  // Convertir coordenadas absolutas a porcentajes
  const leftPercent = (exactCoords.x / 400) * 100 // Asumiendo imagen base de 400px
  const topPercent = (exactCoords.y / 500) * 100 // Asumiendo imagen base de 500px
  const widthPercent = (exactCoords.width / 400) * 100
  const heightPercent = (exactCoords.height / 500) * 100

  return (
    <>
      {/* Área de impresión principal */}
      <div
        className="absolute border-2 border-dashed border-red-500 bg-red-100/10 pointer-events-none"
        style={{
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
        }}
      >
        {/* Coordenadas en la esquina superior izquierda */}
        <div className="absolute -top-6 left-0 text-xs text-red-600 bg-white px-1 rounded shadow">
          {exactCoords.x},{exactCoords.y} ({exactCoords.width}×{exactCoords.height})
        </div>

        {/* Badge EXACT en la esquina superior derecha */}
        <Badge
          variant="secondary"
          className="absolute -top-6 right-0 text-xs bg-green-100 text-green-800 border-green-300"
        >
          EXACT JSON
        </Badge>
      </div>

      {/* Márgenes visuales */}
      <div
        className="absolute border border-dashed border-blue-300 bg-blue-50/5 pointer-events-none"
        style={{
          left: `${leftPercent - (exactCoords.margins.left / 400) * 100}%`,
          top: `${topPercent - (exactCoords.margins.top / 500) * 100}%`,
          width: `${widthPercent + ((exactCoords.margins.left + exactCoords.margins.right) / 400) * 100}%`,
          height: `${heightPercent + ((exactCoords.margins.top + exactCoords.margins.bottom) / 500) * 100}%`,
        }}
      >
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 bg-white px-1 rounded">
          Margins
        </div>
      </div>
    </>
  )
}
