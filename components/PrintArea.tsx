"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"

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
  // Hoodies
  "astra-oversize-hoodie-black-front": { x: 112, y: 175, width: 180, height: 145 },
  "astra-oversize-hoodie-black-back": { x: 116, y: 175, width: 180, height: 240 },
  "astra-oversize-hoodie-caramel-front": { x: 112, y: 160, width: 176, height: 145 },
  "astra-oversize-hoodie-caramel-back": { x: 128, y: 155, width: 144, height: 245 },
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
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const designRef = useRef<HTMLDivElement>(null)

  // Obtener coordenadas exactas para la combinación actual
  const getExactCoordinates = () => {
    const key = `${garmentType}-${garmentColor}-${activeTab}`
    console.log("Looking for coordinates with key:", key)

    const coords = EXACT_COORDINATES[key as keyof typeof EXACT_COORDINATES]
    if (coords) {
      console.log("Found exact coordinates:", coords)
      return coords
    }

    console.log("No exact coordinates found for:", key)
    // Fallback a coordenadas genéricas
    return { x: 100, y: 150, width: 200, height: 200 }
  }

  const exactCoords = getExactCoordinates()

  // Convertir coordenadas absolutas a porcentajes (asumiendo contenedor de 400x400)
  const CONTAINER_SIZE = 400
  const printArea = {
    left: (exactCoords.x / CONTAINER_SIZE) * 100,
    top: (exactCoords.y / CONTAINER_SIZE) * 100,
    width: (exactCoords.width / CONTAINER_SIZE) * 100,
    height: (exactCoords.height / CONTAINER_SIZE) * 100,
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!designImage) return

    setIsDragging(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - (designPosition.x * rect.width) / 100,
        y: e.clientY - rect.top - (designPosition.y * rect.height) / 100,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const newX = ((e.clientX - rect.left - dragStart.x) / rect.width) * 100
    const newY = ((e.clientY - rect.top - dragStart.y) / rect.height) * 100

    // Calcular límites basados en el área de impresión exacta
    const designWidth = designSize / 4 // Aproximación del ancho del diseño en %
    const designHeight = designSize / 4 // Aproximación del alto del diseño en %

    const minX = printArea.left
    const maxX = printArea.left + printArea.width - designWidth
    const minY = printArea.top
    const maxY = printArea.top + printArea.height - designHeight

    const constrainedX = Math.max(minX, Math.min(maxX, newX))
    const constrainedY = Math.max(minY, Math.min(maxY, newY))

    onPositionChange({ x: constrainedX, y: constrainedY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMouseMove(e as any)
      }
      const handleGlobalMouseUp = () => {
        setIsDragging(false)
      }

      document.addEventListener("mousemove", handleGlobalMouseMove)
      document.addEventListener("mouseup", handleGlobalMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove)
        document.removeEventListener("mouseup", handleGlobalMouseUp)
      }
    }
  }, [isDragging])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Área de impresión */}
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
          ref={designRef}
          className={`absolute cursor-move ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            left: `${designPosition.x}%`,
            top: `${designPosition.y}%`,
            width: `${designSize}px`,
            height: `${designSize}px`,
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
          onMouseDown={handleMouseDown}
        >
          <Image
            src={designImage || "/placeholder.svg"}
            alt="Diseño personalizado"
            width={designSize}
            height={designSize}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        </div>
      )}
    </div>
  )
}
