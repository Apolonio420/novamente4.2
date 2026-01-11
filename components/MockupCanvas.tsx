"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { Loader } from "lucide-react"

interface MockupCanvasProps {
  garmentType: string
  garmentColor: string
  design: {
    image: string
    position: { x: number; y: number }
    scale: number
  }
  onPositionChange: (position: { x: number; y: number }) => void
  side: "front" | "back"
  showModel?: boolean
}

export function MockupCanvas({
  garmentType,
  garmentColor,
  design,
  onPositionChange,
  side,
  showModel = false,
}: MockupCanvasProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showGuides, setShowGuides] = useState(false)
  const [garmentImageLoaded, setGarmentImageLoaded] = useState(false)
  const [designImageLoaded, setDesignImageLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const designRef = useRef<HTMLImageElement>(null)
  const garmentRef = useRef<HTMLImageElement>(null)

  // Cache para imágenes de prendas
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())

  // Mapeo completo de prendas y colores a imágenes
  const getGarmentImageUrl = useCallback(() => {
    if (showModel) {
      return side === "front" ? "/garments/hoodie-model-front.jpeg" : "/garments/hoodie-model-back.jpeg"
    }

    const garmentImageMap: Record<string, Record<string, Record<string, string>>> = {
      "aura-oversize-tshirt": {
        front: {
          black: "/garments/tshirt-black-oversize-front.jpeg",
          white: "/garments/tshirt-white-oversize-front.jpeg",
          caramel: "/garments/tshirt-caramel-oversize-front.png",
        },
        back: {
          black: "/garments/tshirt-black-oversize-back.jpeg",
          white: "/garments/tshirt-white-oversize-back.jpeg",
          caramel: "/garments/tshirt-caramel-oversize-back.jpeg",
        },
      },
      "aldea-classic-tshirt": {
        front: {
          black: "/garments/tshirt-black-classic-front.jpeg",
          white: "/garments/tshirt-white-classic-front.jpeg",
        },
        back: {
          black: "/garments/tshirt-black-classic-back.jpeg",
          white: "/garments/tshirt-white-classic-back.jpeg",
        },
      },
      "astra-oversize-hoodie": {
        front: {
          black: "/garments/hoodie-black-front.jpeg",
          caramel: "/garments/hoodie-caramel-front.jpeg",
          cream: "/garments/hoodie-cream-front.jpeg",
          gray: "/garments/hoodie-gray-front.jpeg",
        },
        back: {
          black: "/garments/hoodie-black-back.jpeg",
          caramel: "/garments/hoodie-caramel-back.png",
          cream: "/garments/hoodie-cream-back.png",
          gray: "/garments/hoodie-gray-back.png",
        },
      },
      lienzo: {
        front: {
          custom: "/garments/lienzo-main.png",
        },
        back: {
          custom: "/garments/lienzo-main.png",
        },
      },
    }

    const garmentImages = garmentImageMap[garmentType]
    if (garmentImages && garmentImages[side] && garmentImages[side][garmentColor]) {
      return garmentImages[side][garmentColor]
    }

    if (garmentType === "aura-oversize-tshirt") {
      return side === "front" ? "/garments/tshirt-black-oversize-front.jpeg" : "/garments/tshirt-black-oversize-back.jpeg"
    } else if (garmentType === "aldea-classic-tshirt") {
      return side === "front" ? "/garments/tshirt-black-classic-front.jpeg" : "/garments/tshirt-black-classic-back.jpeg"
    } else if (garmentType === "astra-oversize-hoodie") {
      return side === "front" ? "/garments/hoodie-black-front.jpeg" : "/garments/hoodie-black-back.jpeg"
    }

    return side === "front" ? "/garments/hoodie-black-front.jpeg" : "/garments/hoodie-black-back.jpeg"
  }, [garmentType, garmentColor, side, showModel])

  const preloadGarmentImage = useCallback(async (imageUrl: string) => {
    if (imageCache.current.has(imageUrl)) {
      setGarmentImageLoaded(true)
      return
    }

    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        imageCache.current.set(imageUrl, img)
        setGarmentImageLoaded(true)
        resolve()
      }
      img.onerror = reject
      img.src = imageUrl
    })
  }, [])

  const currentGarmentUrl = useRef<string>("")

  useEffect(() => {
    const imageUrl = getGarmentImageUrl()
    if (imageUrl === currentGarmentUrl.current && garmentImageLoaded) return

    currentGarmentUrl.current = imageUrl
    setIsLoading(true)
    setGarmentImageLoaded(false)
    preloadGarmentImage(imageUrl).catch(() => {
      setError("Error al cargar la imagen de la prenda")
      setIsLoading(false)
    })
  }, [getGarmentImageUrl, preloadGarmentImage, garmentImageLoaded])

  useEffect(() => {
    if (!design.image) {
      setDesignImageLoaded(false)
      return
    }
    setDesignImageLoaded(false)
    const img = new Image()
    img.onload = () => setDesignImageLoaded(true)
    img.onerror = () => setDesignImageLoaded(true)
    img.src = design.image
  }, [design.image])

  useEffect(() => {
    if (garmentImageLoaded && (!design.image || designImageLoaded)) {
      const timer = setTimeout(() => setIsLoading(false), 100)
      return () => clearTimeout(timer)
    }
  }, [garmentImageLoaded, designImageLoaded, design.image])

  const getPrintArea = useCallback(() => {
    const printAreas: Record<string, Record<string, { x: number; y: number; width: number; height: number }>> = {
      "aura-oversize-tshirt": {
        front: { x: 85, y: 110, width: 230, height: 280 },
        back: { x: 85, y: 90, width: 230, height: 310 },
      },
      "aldea-classic-tshirt": {
        front: { x: 90, y: 120, width: 220, height: 270 },
        back: { x: 90, y: 90, width: 220, height: 310 },
      },
      "astra-oversize-hoodie": {
        front: showModel ? { x: 220, y: 280, width: 260, height: 300 } : { x: 80, y: 140, width: 240, height: 240 },
        back: showModel ? { x: 220, y: 250, width: 260, height: 300 } : { x: 80, y: 140, width: 240, height: 260 },
      },
      lienzo: {
        front: { x: 50, y: 50, width: 300, height: 300 },
        back: { x: 50, y: 50, width: 300, height: 300 },
      },
    }
    return printAreas[garmentType]?.[side] || { x: 100, y: 160, width: 200, height: 180 }
  }, [garmentType, side, showModel])

  const getImprovedDesignStyle = useCallback(() => {
    const printArea = getPrintArea()
    const printAreaCenterX = printArea.x + printArea.width / 2
    const printAreaCenterY = printArea.y + printArea.height / 2

    // El punto central del diseño en la escala 400x400
    const centerX = printAreaCenterX + design.position.x
    const centerY = printAreaCenterY + design.position.y

    // Tamaño del diseño en porcentajes (base 400)
    // Usamos el área de impresión como referencia de escala 1.0
    const dWidth = printArea.width * design.scale
    const dHeight = printArea.height * design.scale

    return {
      position: "absolute" as const,
      left: `${(centerX / 400) * 100}%`,
      top: `${(centerY / 400) * 100}%`,
      width: `${(dWidth / 400) * 100}%`,
      height: `${(dHeight / 400) * 100}%`,
      objectFit: "contain" as const,
      cursor: isDragging ? "grabbing" : "grab",
      zIndex: 10,
      transform: "translate(-50%, -50%)",
    }
  }, [getPrintArea, design.scale, design.position, isDragging])

  const isImageCentered = useCallback(() => {
    return Math.abs(design.position.x) < 3 && Math.abs(design.position.y) < 3
  }, [design.position])

  const isNearPrintAreaEdge = useCallback(() => {
    const printArea = getPrintArea()
    const style = getImprovedDesignStyle()
    const left = parseFloat(style.left)
    const top = parseFloat(style.top)
    const width = parseFloat(style.width)
    const height = parseFloat(style.height)

    const paX = (printArea.x / 400) * 100
    const paY = (printArea.y / 400) * 100
    const paW = (printArea.width / 400) * 100
    const paH = (printArea.height / 400) * 100

    const dLeft = left - width / 2
    const dTop = top - height / 2

    return (
      dLeft < paX - 1 || dTop < paY - 1 || (dLeft + width) > (paX + paW + 1) || (dTop + height) > (paY + paH + 1)
    )
  }, [getPrintArea, getImprovedDesignStyle])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setShowGuides(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    const container = containerRef.current
    if (container) {
      const rect = container.getBoundingClientRect()
      const scaleX = 400 / rect.width
      const scaleY = 400 / rect.height
      onPositionChange({
        x: design.position.x + dx * scaleX,
        y: design.position.y + dy * scaleY
      })
    }
    setDragStart({ x: e.clientX, y: e.clientY })
  }, [isDragging, dragStart, design.position, onPositionChange])

  useEffect(() => {
    const up = () => {
      setIsDragging(false)
      setTimeout(() => setShowGuides(false), 1500)
    }
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove as any)
      window.addEventListener("mouseup", up)
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove as any)
      window.removeEventListener("mouseup", up)
    }
  }, [isDragging, handleMouseMove])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const printArea = getPrintArea()
  const garmentImageUrl = getGarmentImageUrl()

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={garmentImageUrl}
          alt="Prenda"
          className="max-w-full max-h-full object-contain pointer-events-none"
          onLoad={() => setGarmentImageLoaded(true)}
        />
      </div>

      {/* Solo mostrar guías si el usuario está interactuando o está cerca del borde */}
      {(showGuides || (isDragging && isNearPrintAreaEdge())) && (
        <div
          className={`absolute border-2 border-dashed pointer-events-none transition-colors ${isNearPrintAreaEdge() ? "border-red-500/50" : "border-blue-400/30"}`}
          style={{
            left: `${(printArea.x / 400) * 100}%`,
            top: `${(printArea.y / 400) * 100}%`,
            width: `${(printArea.width / 400) * 100}%`,
            height: `${(printArea.height / 400) * 100}%`,
          }}
        />
      )}

      {/* Línea de centrado solo durante el arrastre */}
      {showGuides && (
        <div
          className={cn(
            "absolute border-l border-dashed pointer-events-none transition-all duration-300",
            isImageCentered() ? "border-green-400/80 scale-y-110" : "border-zinc-500/20"
          )}
          style={{
            left: `${((printArea.x + printArea.width / 2) / 400) * 100}%`,
            top: `${(printArea.y / 400) * 100}%`,
            height: `${(printArea.height / 400) * 100}%`,
          }}
        />
      )}

      {design.image && (
        <img
          src={design.image}
          style={getImprovedDesignStyle()}
          onMouseDown={handleMouseDown}
          className="absolute drop-shadow-md hover:filter hover:brightness-110 transition-[filter]"
          alt="Diseño"
        />
      )}

      {isImageCentered() && showGuides && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500/80 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
          Centrado
        </div>
      )}
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
