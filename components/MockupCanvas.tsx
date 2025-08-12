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

    // Mapeo específico para cada prenda y color - COMPLETO
    const garmentImageMap: Record<string, Record<string, Record<string, string>>> = {
      "aura-oversize-tshirt": {
        front: {
          black: "/products/aura-tshirt-negro-front.jpeg",
          white: "/products/tshirt-blanca-front.jpeg",
          caramel: "/products/aura-tshirt-caramel-front.jpeg",
        },
        back: {
          black: "/garments/tshirt-black-oversize-back.jpeg",
          white: "/garments/tshirt-white-oversize-back.jpeg",
          caramel: "/garments/tshirt-caramel-oversize-back.jpeg",
        },
      },
      "aldea-classic-tshirt": {
        front: {
          black: "/products/tshirt-aldea-negro-front.jpeg",
          white: "/products/tshirt-aldea-blanco-front.jpeg",
        },
        back: {
          black: "/garments/tshirt-black-classic-back.jpeg",
          white: "/garments/tshirt-white-classic-back.jpeg",
        },
      },
      "astra-oversize-hoodie": {
        front: {
          black: "/products/hoodie-negro-front.jpeg",
          caramel: "/products/hoodie-caramel-front.jpeg",
          cream: "/products/hoodie-crema-front.png",
          gray: "/products/hoodie-gris-front.png",
        },
        back: {
          black: "/garments/hoodie-black-back.png",
          caramel: "/garments/hoodie-caramel-back.png",
          cream: "/garments/hoodie-cream-back.png",
          gray: "/garments/hoodie-gray-back.png",
        },
      },
      lienzo: {
        front: {
          custom: "/products/lienzo-main.png",
        },
        back: {
          custom: "/products/lienzo-main.png",
        },
      },
    }

    // Obtener la imagen correspondiente
    const garmentImages = garmentImageMap[garmentType]
    if (garmentImages && garmentImages[side] && garmentImages[side][garmentColor]) {
      const imageUrl = garmentImages[side][garmentColor]
      console.log(`🖼️ Loading ${side} image for ${garmentType} - ${garmentColor}:`, imageUrl)
      return imageUrl
    }

    // Fallback mejorado
    console.warn(`⚠️ No image found for ${garmentType} - ${garmentColor} - ${side}, using fallback`)

    // Fallback específico por tipo de prenda
    if (garmentType === "aura-oversize-tshirt") {
      return side === "front" ? "/products/aura-tshirt-negro-front.jpeg" : "/garments/tshirt-black-oversize-back.jpeg"
    } else if (garmentType === "aldea-classic-tshirt") {
      return side === "front" ? "/products/tshirt-aldea-negro-front.jpeg" : "/garments/tshirt-black-classic-back.jpeg"
    } else if (garmentType === "astra-oversize-hoodie") {
      return side === "front" ? "/products/hoodie-negro-front.jpeg" : "/garments/hoodie-black-back.png"
    } else if (garmentType === "lienzo") {
      return "/products/lienzo-main.png"
    }

    // Fallback final
    return side === "front" ? "/products/hoodie-negro-front.jpeg" : "/garments/hoodie-black-back.png"
  }, [garmentType, garmentColor, side, showModel])

  // Precargar imagen de prenda
  const preloadGarmentImage = useCallback(async (imageUrl: string) => {
    const cacheKey = imageUrl

    if (imageCache.current.has(cacheKey)) {
      console.log("📦 Using cached garment image:", imageUrl)
      setGarmentImageLoaded(true)
      return
    }

    console.log("⬇️ Preloading garment image:", imageUrl)

    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        console.log("✅ Garment image loaded:", imageUrl)
        imageCache.current.set(cacheKey, img)
        setGarmentImageLoaded(true)
        resolve()
      }
      img.onerror = (error) => {
        console.error("❌ Failed to load garment image:", imageUrl, error)
        reject(error)
      }
      img.src = imageUrl
    })
  }, [])

  // Validar y procesar imagen de diseño - CORREGIDA
  const validateDesignImage = useCallback((imageUrl: string) => {
    console.log("🔍 Validating design image URL:", imageUrl.substring(0, 100) + "...")

    // Verificar si es una URL válida
    if (!imageUrl || typeof imageUrl !== "string") {
      console.error("❌ Invalid image URL type:", typeof imageUrl)
      throw new Error("URL de imagen inválida")
    }

    // Verificar longitud mínima
    if (imageUrl.length < 10) {
      console.error("❌ URL too short:", imageUrl.length)
      throw new Error("URL demasiado corta")
    }

    // Verificar si es una URL de v0 preview (problema conocido)
    if (imageUrl.includes("preview-novamente-storefront") && imageUrl.includes("vusercontent.net")) {
      console.error("❌ Detected corrupted v0 preview URL:", imageUrl)
      throw new Error("URL corrupta detectada - imagen no válida")
    }

    // Verificar si es base64 - VÁLIDO
    if (imageUrl.startsWith("data:image/")) {
      console.log("✅ Valid base64 image detected")
      return true
    }

    // Verificar si es HTTPS - VÁLIDO
    if (imageUrl.startsWith("https://")) {
      console.log("✅ Valid HTTPS URL detected:", imageUrl)
      return true
    }

    // Verificar si es HTTP (menos seguro pero puede funcionar)
    if (imageUrl.startsWith("http://")) {
      console.warn("⚠️ HTTP URL detected (not secure):", imageUrl)
      return true
    }

    // Si llegamos aquí, la URL no es válida
    console.error("❌ Invalid URL format:", imageUrl)
    throw new Error(`Formato de URL no válido: ${imageUrl.substring(0, 50)}...`)
  }, [])

  // Efecto para manejar cambios en la imagen de diseño
  useEffect(() => {
    console.log("🎨 Design image changed:", design.image.substring(0, 50) + "...")
    setIsLoading(true)
    setError(null)
    setDesignImageLoaded(false)

    try {
      // Validar imagen de diseño
      validateDesignImage(design.image)

      // Si la validación pasa, marcar como cargada
      setDesignImageLoaded(true)
      console.log("✅ Design image validation passed")
    } catch (validationError) {
      console.error("❌ Design image validation failed:", validationError)
      setError(validationError instanceof Error ? validationError.message : "Error de validación")
    }
  }, [design.image, validateDesignImage])

  // Efecto para precargar imagen de prenda
  useEffect(() => {
    const garmentImageUrl = getGarmentImageUrl()
    setGarmentImageLoaded(false)

    preloadGarmentImage(garmentImageUrl).catch((error) => {
      console.error("❌ Failed to preload garment image:", error)
      // No marcar como error crítico, usar fallback
      setGarmentImageLoaded(true)
    })
  }, [getGarmentImageUrl, preloadGarmentImage])

  // Efecto para controlar estado de carga
  useEffect(() => {
    if (garmentImageLoaded && designImageLoaded && !error) {
      console.log("✅ All images loaded successfully")
      setIsLoading(false)
    }
  }, [garmentImageLoaded, designImageLoaded, error])

  // Obtener el área de impresión según el tipo de prenda y vista
  const getPrintArea = useCallback(() => {
    const printAreas: Record<string, Record<string, { x: number; y: number; width: number; height: number }>> = {
      "aura-oversize-tshirt": {
        front: { x: 250, y: 300, width: 400, height: 500 },
        back: { x: 250, y: 250, width: 400, height: 500 },
      },
      "aldea-classic-tshirt": {
        front: { x: 280, y: 320, width: 350, height: 450 },
        back: { x: 280, y: 270, width: 350, height: 450 },
      },
      "astra-oversize-hoodie": {
        front: showModel ? { x: 220, y: 280, width: 260, height: 300 } : { x: 250, y: 300, width: 500, height: 600 },
        back: showModel ? { x: 220, y: 250, width: 260, height: 300 } : { x: 250, y: 250, width: 500, height: 600 },
      },
      lienzo: {
        front: { x: 100, y: 100, width: 600, height: 600 },
        back: { x: 100, y: 100, width: 600, height: 600 },
      },
    }

    return printAreas[garmentType]?.[side] || { x: 250, y: 300, width: 500, height: 600 }
  }, [garmentType, side, showModel])

  // Calcular el estilo para la imagen del diseño
  const getDesignStyle = useCallback(() => {
    const printArea = getPrintArea()

    // Calcular el tamaño del diseño basado en la escala
    const designWidth = printArea.width * design.scale
    const designHeight = printArea.height * design.scale

    // Calcular la posición centrada del diseño dentro del área de impresión
    const designX = printArea.x + (printArea.width - designWidth) / 2 + design.position.x
    const designY = printArea.y + (printArea.height - designHeight) / 2 + design.position.y

    return {
      position: "absolute" as const,
      left: `${designX}px`,
      top: `${designY}px`,
      width: `${designWidth}px`,
      height: `${designHeight}px`,
      objectFit: "contain" as const,
      cursor: isDragging ? "grabbing" : "grab",
      zIndex: 10,
    }
  }, [getPrintArea, design.scale, design.position, isDragging])

  // Verificar si la imagen está centrada (con tolerancia de 10px)
  const isImageCentered = useCallback(() => {
    const tolerance = 10
    return Math.abs(design.position.x) < tolerance && Math.abs(design.position.y) < tolerance
  }, [design.position])

  // Verificar si la imagen está cerca de los bordes del área de impresión
  const isNearPrintAreaEdge = useCallback(() => {
    const printArea = getPrintArea()
    const designStyle = getDesignStyle()

    // Extraer valores numéricos de los estilos
    const designX = Number.parseInt(designStyle.left.replace("px", ""))
    const designY = Number.parseInt(designStyle.top.replace("px", ""))
    const designWidth = Number.parseInt(designStyle.width.replace("px", ""))
    const designHeight = Number.parseInt(designStyle.height.replace("px", ""))

    const margin = 20 // Margen de seguridad en píxeles

    // Verificar si alguna parte del diseño está fuera o cerca del borde del área de impresión
    return (
      designX < printArea.x + margin ||
      designY < printArea.y + margin ||
      designX + designWidth > printArea.x + printArea.width - margin ||
      designY + designHeight > printArea.y + printArea.height - margin
    )
  }, [getPrintArea, getDesignStyle])

  // Manejadores de eventos para arrastrar y soltar
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      e.preventDefault()
      setIsDragging(true)
      setShowGuides(true)
      setDragStart({
        x: e.clientX - design.position.x,
        y: e.clientY - design.position.y,
      })
    },
    [design.position],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return

      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }

      onPositionChange(newPosition)
    },
    [isDragging, dragStart, onPositionChange],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    // Ocultar las guías después de un breve delay
    setTimeout(() => setShowGuides(false), 1000)
  }, [])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLImageElement>) => {
      e.preventDefault()
      if (e.touches.length === 1) {
        setIsDragging(true)
        setShowGuides(true)
        setDragStart({
          x: e.touches[0].clientX - design.position.x,
          y: e.touches[0].clientY - design.position.y,
        })
      }
    },
    [design.position],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging || e.touches.length !== 1) return

      const newPosition = {
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      }

      onPositionChange(newPosition)
    },
    [isDragging, dragStart, onPositionChange],
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setTimeout(() => setShowGuides(false), 1000)
  }, [])

  // Manejar errores de carga de imagen del diseño
  const handleDesignImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement
    const imageUrl = target.src
    console.error("❌ Error loading design image. URL:", imageUrl)
    console.error("❌ Error details:", e.nativeEvent)

    // Intentar determinar el tipo de error
    let errorMessage = "Error al cargar la imagen del diseño"
    if (imageUrl.includes("data:image")) {
      errorMessage = "Error al procesar la imagen base64"
    } else if (imageUrl.includes("https://")) {
      errorMessage = "Error al cargar la imagen desde URL externa"
    } else if (imageUrl.includes("preview-novamente-storefront")) {
      errorMessage = "URL corrupta detectada - imagen no válida"
    }

    setError(errorMessage)
  }, [])

  // Manejar errores de carga de imagen de la prenda
  const handleGarmentImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement
    const imageUrl = target.src
    console.error("❌ Error loading garment image:", imageUrl)

    // Fallback en caso de error
    target.src = "/placeholder.svg?height=600&width=600&text=Prenda+no+disponible"
  }, [])

  // Efecto para manejar eventos globales de mouse/touch
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false)
      setTimeout(() => setShowGuides(false), 1000)
    }

    const handleGlobalTouchEnd = () => {
      setIsDragging(false)
      setTimeout(() => setShowGuides(false), 1000)
    }

    window.addEventListener("mouseup", handleGlobalMouseUp)
    window.addEventListener("touchend", handleGlobalTouchEnd)

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp)
      window.removeEventListener("touchend", handleGlobalTouchEnd)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center space-y-3">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Cargando mockup...</p>
            <div className="flex items-center space-x-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${garmentImageLoaded ? "bg-green-500" : "bg-gray-300"}`}></div>
              <span className="text-xs">Prenda</span>
              <div className={`w-2 h-2 rounded-full ${designImageLoaded ? "bg-green-500" : "bg-gray-300"}`}></div>
              <span className="text-xs">Diseño</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <div className="text-center p-4">
          <p className="text-destructive mb-2">❌ Error al cargar el mockup</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setIsLoading(true)
              setGarmentImageLoaded(false)
              setDesignImageLoaded(false)
              // Reintentar después de un breve delay
              setTimeout(() => {
                const garmentImageUrl = getGarmentImageUrl()
                preloadGarmentImage(garmentImageUrl)
              }, 1000)
            }}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    )
  }

  const printArea = getPrintArea()
  const garmentImageUrl = getGarmentImageUrl()

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Imagen de la prenda */}
      <div className="w-full h-full flex items-center justify-center">
        <img
          ref={garmentRef}
          src={garmentImageUrl || "/placeholder.svg"}
          alt={`${garmentType} ${garmentColor} ${side}`}
          className="max-w-full max-h-full object-contain"
          key={`${garmentType}-${garmentColor}-${side}`} // Key para forzar re-render
          onError={handleGarmentImageError}
          onLoad={() => {
            console.log("✅ Garment image rendered successfully")
            setGarmentImageLoaded(true)
          }}
        />
      </div>

      {/* Área de impresión (solo visible durante el arrastre o cuando está cerca del borde) */}
      {(showGuides || isNearPrintAreaEdge()) && (
        <div
          className={`absolute border-2 ${isNearPrintAreaEdge() ? "border-red-500" : "border-blue-400"} border-dashed pointer-events-none`}
          style={{
            left: `${printArea.x}px`,
            top: `${printArea.y}px`,
            width: `${printArea.width}px`,
            height: `${printArea.height}px`,
            zIndex: 5,
          }}
        >
          {/* Etiqueta del área de impresión */}
          <div
            className={`absolute -top-6 left-0 text-xs px-2 py-1 rounded ${isNearPrintAreaEdge() ? "bg-red-500 text-white" : "bg-blue-400 text-white"}`}
          >
            {isNearPrintAreaEdge() ? "Fuera del área recomendada" : "Área de impresión"}
          </div>
        </div>
      )}

      {/* Líneas guía de centrado */}
      {(showGuides || isImageCentered()) && (
        <>
          {/* Línea vertical central */}
          <div
            className="absolute border-l-2 border-green-400 border-dashed pointer-events-none"
            style={{
              left: `${printArea.x + printArea.width / 2}px`,
              top: `${printArea.y}px`,
              height: `${printArea.height}px`,
              zIndex: 6,
            }}
          />
          {/* Línea horizontal central */}
          <div
            className="absolute border-t-2 border-green-400 border-dashed pointer-events-none"
            style={{
              left: `${printArea.x}px`,
              top: `${printArea.y + printArea.height / 2}px`,
              width: `${printArea.width}px`,
              zIndex: 6,
            }}
          />
          {/* Indicador de centrado */}
          {isImageCentered() && (
            <div
              className="absolute bg-green-400 text-white text-xs px-2 py-1 rounded pointer-events-none"
              style={{
                left: `${printArea.x + printArea.width / 2 - 30}px`,
                top: `${printArea.y - 30}px`,
                zIndex: 7,
              }}
            >
              Centrado
            </div>
          )}
        </>
      )}

      {/* Imagen del diseño */}
      {design.image && designImageLoaded && (
        <img
          ref={designRef}
          src={design.image || "/placeholder.svg"}
          alt="Design"
          style={getDesignStyle()}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onError={handleDesignImageError}
          onLoad={() => {
            console.log("✅ Design image rendered successfully:", design.image.substring(0, 50) + "...")
          }}
        />
      )}
    </div>
  )
}
