"use client"

import { useEffect, useState } from "react"

// Coordenadas exactas del JSON
const EXACT_COORDINATES = {
  "astra-oversize-hoodie-black-front": {
    x: 267,
    y: 467,
    width: 404,
    height: 333,
  },
  "astra-oversize-hoodie-caramel-front": {
    x: 267,
    y: 467,
    width: 404,
    height: 333,
  },
  "astra-oversize-hoodie-cream-front": {
    x: 267,
    y: 467,
    width: 404,
    height: 333,
  },
  "astra-oversize-hoodie-gray-front": {
    x: 267,
    y: 467,
    width: 404,
    height: 333,
  },
  "aura-oversize-tshirt-black-front": {
    x: 267,
    y: 467,
    width: 404,
    height: 333,
  },
  "aura-oversize-tshirt-white-front": {
    x: 267,
    y: 467,
    width: 404,
    height: 333,
  },
  "aura-oversize-tshirt-caramel-front": {
    x: 267,
    y: 467,
    width: 404,
    height: 333,
  },
  "aldea-classic-tshirt-black-front": {
    x: 267,
    y: 467,
    width: 404,
    height: 333,
  },
  "aldea-classic-tshirt-white-front": {
    x: 267,
    y: 467,
    width: 404,
    height: 333,
  },
}

interface PrintAreaProps {
  garmentKey: string
  garmentImage: {
    src: string
    width: number
    height: number
  }
}

export function PrintArea({ garmentKey, garmentImage }: PrintAreaProps) {
  const [printArea, setPrintArea] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  useEffect(() => {
    console.log("🖼️ Getting garment image:", garmentImage)
    console.log("Looking for coordinates with key:", garmentKey)

    const exactCoords = EXACT_COORDINATES[garmentKey as keyof typeof EXACT_COORDINATES]

    if (exactCoords) {
      console.log("Found exact coordinates:", exactCoords)

      // Convertir coordenadas absolutas a porcentajes
      const xPercent = (exactCoords.x / garmentImage.width) * 100
      const yPercent = (exactCoords.y / garmentImage.height) * 100
      const widthPercent = (exactCoords.width / garmentImage.width) * 100
      const heightPercent = (exactCoords.height / garmentImage.height) * 100

      setPrintArea({
        x: xPercent,
        y: yPercent,
        width: widthPercent,
        height: heightPercent,
      })
    } else {
      console.log("No exact coordinates found, using fallback")
      // Área de impresión por defecto (centro de la prenda)
      setPrintArea({
        x: 25,
        y: 35,
        width: 50,
        height: 40,
      })
    }
  }, [garmentKey, garmentImage])

  if (!printArea) {
    return null
  }

  return (
    <div
      className="absolute border-2 border-red-500 border-dashed pointer-events-none"
      style={{
        left: `${printArea.x}%`,
        top: `${printArea.y}%`,
        width: `${printArea.width}%`,
        height: `${printArea.height}%`,
      }}
    />
  )
}
