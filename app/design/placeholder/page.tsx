"use client"

import type React from "react"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useCart } from "@/lib/cartStore"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { Loader, ShoppingCart, Plus, Check, ArrowLeft, Move, X, Ruler, Info } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { MiniImageHistory } from "@/components/MiniImageHistory"
import { PrintArea } from "@/components/PrintArea"

// PRECIOS EXACTOS - ESTOS SON LOS PRECIOS REALES
const GARMENT_PRICES = {
  "aura-oversize-tshirt": 37000,
  "aldea-classic-tshirt": 33000,
  "astra-oversize-hoodie": 60000,
  lienzo: 59900,
}

const GARMENT_NAMES = {
  "aura-oversize-tshirt": "Aura Oversize T-Shirt Personalizada",
  "aldea-classic-tshirt": "Aldea Classic T-Shirt Personalizada",
  "astra-oversize-hoodie": "Astra Oversize Hoodie Personalizada",
  lienzo: "Lienzo Personalizado",
}

// COLORES DISPONIBLES POR PRENDA
const AVAILABLE_COLORS = {
  "aura-oversize-tshirt": ["black", "white", "caramel"],
  "aldea-classic-tshirt": ["black", "white"],
  "astra-oversize-hoodie": ["black", "white", "caramel", "gray", "cream"],
  lienzo: ["custom"],
}

const COLOR_NAMES = {
  black: "Negro",
  white: "Blanco",
  caramel: "Caramelo",
  gray: "Gris",
  cream: "Crema",
  custom: "Personalizado",
}

// IMÁGENES DE MEDIDAS POR PRENDA
const SIZE_GUIDE_IMAGES = {
  "aura-oversize-tshirt": "/products/tshirt-blanca-medidas.png",
  "aldea-classic-tshirt": "/products/tshirt-aldea-blanco-medidas.png",
  "astra-oversize-hoodie": "/products/hoodie-negro-medidas.png",
  lienzo: ["/products/lienzo-medidas-1.png", "/products/lienzo-medidas-2.png", "/products/lienzo-medidas-3.png"],
}

// IMÁGENES CON MODELO (LIFESTYLE)
const MODEL_IMAGES = {
  "aura-oversize-tshirt": {
    "black-front": "/products/tshirt-negra-lifestyle-1.jpeg",
    "black-back": "/products/tshirt-negra-lifestyle-2.jpeg",
    "white-front": "/products/tshirt-blanca-lifestyle-1.jpeg",
    "white-back": "/products/tshirt-blanca-lifestyle-2.jpeg",
    "caramel-front": "/products/tshirt-caramel-lifestyle-1.jpeg",
    "caramel-back": "/products/tshirt-caramel-lifestyle-2.jpeg",
  },
  "aldea-classic-tshirt": {
    "black-front": "/products/tshirt-aldea-negro-lifestyle-1.jpeg",
    "black-back": "/products/tshirt-aldea-negro-lifestyle-2.jpeg",
    "white-front": "/products/tshirt-aldea-blanco-lifestyle-1.jpeg",
    "white-back": "/products/tshirt-aldea-blanco-lifestyle-2.jpeg",
  },
  "astra-oversize-hoodie": {
    "black-front": "/products/hoodie-negro-lifestyle-1.jpeg",
    "black-back": "/products/hoodie-negro-lifestyle-2.jpeg",
    "white-front": "/products/hoodie-crema-lifestyle.png",
    "white-back": "/products/hoodie-crema-lifestyle.png",
    "caramel-front": "/products/hoodie-caramel-lifestyle-1.jpeg",
    "caramel-back": "/products/hoodie-caramel-lifestyle-2.jpeg",
    "gray-front": "/products/hoodie-gris-lifestyle.png",
    "gray-back": "/products/hoodie-gris-lifestyle.png",
    "cream-front": "/products/hoodie-crema-lifestyle.png",
    "cream-back": "/products/hoodie-crema-lifestyle.png",
  },
}

const DOUBLE_STAMPING_EXTRA = 7000

// Función para verificar si una posición está dentro del área de impresión
function isPositionInPrintArea(
  position: { x: number; y: number },
  scale: number,
  garmentType: string,
  activeTab: "front" | "back",
): { x: number; y: number } {
  let printArea = { left: 10, top: 15, width: 80, height: 70 }

  switch (garmentType) {
    case "aura-oversize-tshirt":
    case "aldea-classic-tshirt":
      printArea = { left: 10, top: 15, width: 80, height: 70 }
      break
    case "astra-oversize-hoodie":
      if (activeTab === "front") {
        printArea = { left: 15, top: 20, width: 70, height: 50 }
      } else {
        printArea = { left: 10, top: 15, width: 80, height: 70 }
      }
      break
    case "lienzo":
      printArea = { left: 5, top: 5, width: 90, height: 90 }
      break
  }

  // Calcular el tamaño del diseño en porcentaje
  const designSize = scale * 20 // 20% es el tamaño base del diseño

  // Límites del área de impresión considerando el tamaño del diseño
  const minX = printArea.left + designSize / 2
  const maxX = printArea.left + printArea.width - designSize / 2
  const minY = printArea.top + designSize / 2
  const maxY = printArea.top + printArea.height - designSize / 2

  return {
    x: Math.max(minX, Math.min(maxX, position.x)),
    y: Math.max(minY, Math.min(maxY, position.y)),
  }
}

function PlaceholderContent() {
  const searchParams = useSearchParams()
  const { addItem } = useCart()
  const { toast } = useToast()

  const [selectedGarment, setSelectedGarment] = useState("aura-oversize-tshirt")
  const [selectedColor, setSelectedColor] = useState("black")
  const [selectedSize, setSelectedSize] = useState("M")
  const [showOnModel, setShowOnModel] = useState(false)
  const [activeTab, setActiveTab] = useState("front")
  const [frontDesign, setFrontDesign] = useState<string | null>(null)
  const [backDesign, setBackDesign] = useState<string | null>(null)
  const [hasFrontDesign, setHasFrontDesign] = useState(true)
  const [hasBackDesign, setHasBackDesign] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [isLoadingImage, setIsLoadingImage] = useState(true)

  const [position, setPosition] = useState({ x: 50, y: 45 })
  const [scale, setScale] = useState(0.3)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const designRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ✅ SOPORTE PARA AMBOS PARÁMETROS: imageUrl (legacy) e image (nuevo)
  const imageUrl = searchParams.get("imageUrl") || searchParams.get("image")

  // Función para crear URL del proxy
  const createProxyUrl = useCallback((originalUrl: string) => {
    if (originalUrl.includes("oaidalleapiprodscus.blob.core.windows.net")) {
      const encodedUrl = encodeURIComponent(originalUrl)
      return `/api/proxy-image?url=${encodedUrl}`
    }
    return originalUrl
  }, [])

  useEffect(() => {
    if (imageUrl) {
      console.log("🖼️ Loading image from URL parameter:", imageUrl.substring(0, 100) + "...")
      setIsLoadingImage(true)
      setImageLoadError(false)

      try {
        const decodedUrl = decodeURIComponent(imageUrl)
        const proxiedUrl = createProxyUrl(decodedUrl)

        console.log("🔄 Using proxied URL:", proxiedUrl.substring(0, 100) + "...")

        setFrontDesign(proxiedUrl)
        setIsLoadingImage(false)
      } catch (error) {
        console.error("❌ Error processing image URL:", error)
        setImageLoadError(true)
        setIsLoadingImage(false)
        toast({
          title: "Error",
          description: "No se pudo cargar la imagen del diseño",
          variant: "destructive",
        })
      }
    } else {
      console.log("❌ No image URL found in search params")
      setIsLoadingImage(false)
    }
  }, [imageUrl, createProxyUrl, toast])

  // Actualizar color disponible cuando cambia la prenda
  useEffect(() => {
    const availableColors = AVAILABLE_COLORS[selectedGarment as keyof typeof AVAILABLE_COLORS]
    if (availableColors && !availableColors.includes(selectedColor)) {
      setSelectedColor(availableColors[0])
    }
  }, [selectedGarment, selectedColor])

  // Reposicionar diseño cuando cambia la prenda
  useEffect(() => {
    const constrainedPosition = isPositionInPrintArea(position, scale, selectedGarment, activeTab)
    if (constrainedPosition.x !== position.x || constrainedPosition.y !== position.y) {
      setPosition(constrainedPosition)
    }
  }, [selectedGarment, activeTab, position, scale])

  const handleImageSelect = (newImageUrl: string) => {
    if (activeTab === "front") {
      setFrontDesign(newImageUrl)
      setHasFrontDesign(true)
    } else {
      setBackDesign(newImageUrl)
      setHasBackDesign(true)
    }

    toast({
      title: "Diseño actualizado",
      description: `Se cambió el diseño ${activeTab === "front" ? "frontal" : "trasero"}`,
    })
  }

  const addFrontDesign = () => {
    setHasFrontDesign(true)
    toast({
      title: "Diseño frontal agregado",
      description: "Se agregó el estampado frontal",
    })
  }

  const removeFrontDesign = () => {
    setHasFrontDesign(false)
    toast({
      title: "Diseño frontal eliminado",
      description: "Se eliminó el estampado frontal",
    })
  }

  const addBackDesign = () => {
    if (frontDesign) {
      setBackDesign(frontDesign)
      setHasBackDesign(true)
      setActiveTab("back")
      toast({
        title: "Diseño trasero agregado",
        description: `Se agregó el estampado trasero (+${formatCurrency(DOUBLE_STAMPING_EXTRA)})`,
      })
    }
  }

  const removeBackDesign = () => {
    setBackDesign(null)
    setHasBackDesign(false)
    setActiveTab("front")
    toast({
      title: "Diseño trasero eliminado",
      description: "Se eliminó el estampado trasero",
    })
  }

  // ✅ FUNCIÓN CORREGIDA: Obtener imagen correcta de la prenda
  const getGarmentImage = () => {
    const side = activeTab === "back" ? "back" : "front"

    if (selectedGarment === "lienzo") {
      return "/products/lienzo-main.png"
    }

    // Si está activado "mostrar en modelo", usar imágenes lifestyle
    if (showOnModel) {
      const modelImages = MODEL_IMAGES[selectedGarment as keyof typeof MODEL_IMAGES]
      if (modelImages) {
        const imageKey = `${selectedColor}-${side}`
        const modelImage = modelImages[imageKey as keyof typeof modelImages]
        if (modelImage) {
          console.log("🖼️ Using model image:", modelImage)
          return modelImage
        }
      }
    }

    // Mapeo EXACTO de las imágenes flat lay que tenemos en el proyecto
    const garmentImageMap: Record<string, Record<string, string>> = {
      "aura-oversize-tshirt": {
        "black-front": "/products/aura-tshirt-negro-front.jpeg",
        "black-back": "/garments/tshirt-black-oversize-back.jpeg",
        "white-front": "/products/tshirt-blanca-front.jpeg",
        "white-back": "/garments/tshirt-white-oversize-back.jpeg",
        "caramel-front": "/products/aura-tshirt-caramel-front.jpeg",
        "caramel-back": "/garments/tshirt-caramel-oversize-back.jpeg",
      },
      "aldea-classic-tshirt": {
        "black-front": "/products/tshirt-aldea-negro-front.jpeg",
        "black-back": "/garments/tshirt-black-classic-back.jpeg",
        "white-front": "/products/tshirt-aldea-blanco-front.jpeg",
        "white-back": "/garments/tshirt-white-classic-back.jpeg",
      },
      "astra-oversize-hoodie": {
        "black-front": "/products/hoodie-negro-front.jpeg",
        "black-back": "/garments/hoodie-black-back.png",
        "white-front": "/products/hoodie-crema-front.png", // usando crema como white
        "white-back": "/garments/hoodie-cream-back.png",
        "caramel-front": "/products/hoodie-caramel-front.jpeg",
        "caramel-back": "/garments/hoodie-caramel-back.png",
        "gray-front": "/products/hoodie-gris-front.png",
        "gray-back": "/garments/hoodie-gray-back.png",
        "cream-front": "/products/hoodie-crema-front.png",
        "cream-back": "/garments/hoodie-cream-back.png",
      },
    }

    const garmentImages = garmentImageMap[selectedGarment]
    if (!garmentImages) {
      return "/placeholder.svg?height=400&width=400&text=Prenda+no+encontrada"
    }

    const imageKey = `${selectedColor}-${side}`
    const imagePath = garmentImages[imageKey]

    console.log("🖼️ Getting garment image:", {
      selectedGarment,
      selectedColor,
      side,
      imageKey,
      imagePath,
      showOnModel,
    })

    return imagePath || "/placeholder.svg?height=400&width=400&text=Imagen+no+disponible"
  }

  const getCurrentDesign = () => {
    return activeTab === "front" ? frontDesign : backDesign
  }

  const shouldShowDesign = () => {
    return activeTab === "front" ? hasFrontDesign : hasBackDesign
  }

  // Drag & Drop functionality mejorado con restricciones
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!designRef.current || !containerRef.current) return

    e.preventDefault()
    e.stopPropagation()

    const containerRect = containerRef.current.getBoundingClientRect()
    const designRect = designRef.current.getBoundingClientRect()

    // Calcular offset desde el centro del elemento
    const designCenterX = designRect.left + designRect.width / 2
    const designCenterY = designRect.top + designRect.height / 2

    setDragOffset({
      x: e.clientX - designCenterX,
      y: e.clientY - designCenterY,
    })

    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()

      // Calcular nueva posición basada en el centro del mouse menos el offset
      const newX = ((e.clientX - dragOffset.x - containerRect.left) / containerRect.width) * 100
      const newY = ((e.clientY - dragOffset.y - containerRect.top) / containerRect.height) * 100

      // Aplicar restricciones del área de impresión
      const constrainedPosition = isPositionInPrintArea({ x: newX, y: newY }, scale, selectedGarment, activeTab)

      setPosition(constrainedPosition)
    },
    [isDragging, dragOffset, scale, selectedGarment, activeTab],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!designRef.current || !containerRef.current) return

    e.preventDefault()
    e.stopPropagation()

    const touch = e.touches[0]
    const containerRect = containerRef.current.getBoundingClientRect()
    const designRect = designRef.current.getBoundingClientRect()

    const designCenterX = designRect.left + designRect.width / 2
    const designCenterY = designRect.top + designRect.height / 2

    setDragOffset({
      x: touch.clientX - designCenterX,
      y: touch.clientY - designCenterY,
    })

    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !containerRef.current) return

      e.preventDefault()

      const touch = e.touches[0]
      const containerRect = containerRef.current.getBoundingClientRect()

      const newX = ((touch.clientX - dragOffset.x - containerRect.left) / containerRef.current.width) * 100
      const newY = ((touch.clientY - dragOffset.y - containerRect.top) / containerRef.current.height) * 100

      // Aplicar restricciones del área de impresión
      const constrainedPosition = isPositionInPrintArea({ x: newX, y: newY }, scale, selectedGarment, activeTab)

      setPosition(constrainedPosition)
    },
    [isDragging, dragOffset, scale, selectedGarment, activeTab],
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Global mouse and touch events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Función para manejar errores de carga de imagen
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("❌ Error loading design image:", e.currentTarget.src)
    setImageLoadError(true)
  }, [])

  const handleImageLoad = useCallback(() => {
    console.log("✅ Design image loaded successfully")
    setImageLoadError(false)
    setIsLoadingImage(false)
  }, [])

  // ✅ LÓGICA ACTUALIZADA: Permitir avanzar si hay al menos una imagen (frente O dorso)
  const canProceedToCart = (frontDesign && hasFrontDesign) || (backDesign && hasBackDesign)

  // CÁLCULO EXACTO DEL PRECIO FINAL
  const basePrice = GARMENT_PRICES[selectedGarment as keyof typeof GARMENT_PRICES] || 0
  const hasDoubleStamping = hasFrontDesign && hasBackDesign
  const finalPrice = basePrice + (hasDoubleStamping ? DOUBLE_STAMPING_EXTRA : 0)

  const addToCart = async () => {
    // ✅ VALIDACIÓN ACTUALIZADA: Permitir si hay al menos una imagen
    if (!canProceedToCart) {
      toast({
        title: "Error",
        description: "Debes tener al menos un diseño activo (frontal o trasero)",
        variant: "destructive",
      })
      return
    }

    setIsAddingToCart(true)

    try {
      // ✅ ESTRUCTURA CORREGIDA: Usar 'image' en lugar de 'imageUrl'
      const cartItem = {
        id: `${selectedGarment}-${selectedColor}-${selectedSize}-${Date.now()}`,
        name: GARMENT_NAMES[selectedGarment as keyof typeof GARMENT_NAMES],
        garmentType: selectedGarment,
        color: selectedColor,
        size: selectedSize,
        price: finalPrice,
        quantity: 1,
        image: frontDesign || backDesign || "", // ✅ Usar 'image' como espera el store
        frontDesign: hasFrontDesign ? frontDesign : null,
        backDesign: hasBackDesign ? backDesign : null,
      }

      console.log("🛒 Adding to cart with EXACT price:", {
        item: cartItem.name,
        basePrice,
        hasDoubleStamping,
        finalPrice: cartItem.price,
        cartItem,
      })

      addItem(cartItem)

      toast({
        title: "¡Agregado al carrito!",
        description: `${GARMENT_NAMES[selectedGarment as keyof typeof GARMENT_NAMES]} - ${formatCurrency(finalPrice)}`,
      })

      setTimeout(() => {
        window.location.href = "/cart"
      }, 1500)
    } catch (error) {
      console.error("❌ Error adding to cart:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar al carrito",
        variant: "destructive",
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  // ✅ MANEJO MEJORADO DE ERRORES: Mostrar mensaje claro si no hay imagen
  if (!imageUrl) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No hay imagen para diseñar</h1>
          <p className="text-muted-foreground mb-6">No se encontró una imagen válida en los parámetros de la URL.</p>
          <Link href="/design">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Generador
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/design">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Personaliza tu Prenda</h1>
        <div className="w-20"></div>
      </div>

      {/* Mini historial de imágenes */}
      <MiniImageHistory onImageSelect={handleImageSelect} currentImageUrl={getCurrentDesign() || undefined} />

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Vista del producto */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="model-toggle" className="text-sm">
                Mostrar en modelo
              </Label>
              <Switch id="model-toggle" checked={showOnModel} onCheckedChange={setShowOnModel} />
            </div>
            {getCurrentDesign() && shouldShowDesign() && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Move className="w-4 h-4" />
                Arrastra para mover
              </div>
            )}
          </div>

          {/* Tabs para frontal/trasero */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="front" className="flex items-center gap-2">
                Frontal
                {frontDesign && hasFrontDesign && (
                  <Badge variant="secondary" className="text-xs">
                    ✓
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="back" className="flex items-center gap-2">
                Trasero
                {backDesign && hasBackDesign && (
                  <Badge variant="secondary" className="text-xs">
                    ✓
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="front" className="mt-4">
              <Card className="relative overflow-hidden">
                <CardContent className="p-0">
                  <div
                    ref={containerRef}
                    className="relative aspect-square bg-gray-100"
                    style={{ cursor: isDragging ? "grabbing" : "default" }}
                  >
                    {/* ✅ IMAGEN DE LA PRENDA CORRECTA */}
                    <Image
                      src={getGarmentImage() || "/placeholder.svg"}
                      alt="Prenda frontal"
                      fill
                      className="object-contain pointer-events-none"
                      priority
                      onError={(e) => {
                        console.error("❌ Error loading garment image:", getGarmentImage())
                        // Fallback a placeholder si falla la imagen de la prenda
                        e.currentTarget.src = "/placeholder.svg?height=400&width=400&text=Prenda+no+disponible"
                      }}
                    />

                    {/* Área de impresión */}
                    <PrintArea garmentType={selectedGarment} activeTab="front" selectedColor={selectedColor} />

                    {/* ✅ DISEÑO SUPERPUESTO SOBRE LA PRENDA */}
                    {frontDesign && hasFrontDesign && (
                      <div
                        ref={designRef}
                        className="absolute pointer-events-auto select-none"
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          transform: `translate(-50%, -50%) scale(${scale})`,
                          width: "200px",
                          height: "200px",
                          cursor: isDragging ? "grabbing" : "grab",
                          zIndex: 10,
                        }}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                      >
                        {isLoadingImage ? (
                          <div className="w-full h-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 text-sm">
                            <Loader className="w-6 h-6 animate-spin" />
                          </div>
                        ) : imageLoadError ? (
                          <div className="w-full h-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 text-sm">
                            Error cargando imagen
                          </div>
                        ) : (
                          <img
                            src={frontDesign || "/placeholder.svg"}
                            alt="Diseño frontal"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              pointerEvents: "none",
                              userSelect: "none",
                            }}
                            onError={handleImageError}
                            onLoad={handleImageLoad}
                            draggable={false}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="back" className="mt-4">
              <Card className="relative overflow-hidden">
                <CardContent className="p-0">
                  <div
                    ref={containerRef}
                    className="relative aspect-square bg-gray-100"
                    style={{ cursor: isDragging ? "grabbing" : "default" }}
                  >
                    {/* ✅ IMAGEN DE LA PRENDA CORRECTA (TRASERA) */}
                    <Image
                      src={getGarmentImage() || "/placeholder.svg"}
                      alt="Prenda trasera"
                      fill
                      className="object-contain pointer-events-none"
                      priority
                      onError={(e) => {
                        console.error("❌ Error loading garment image:", getGarmentImage())
                        e.currentTarget.src = "/placeholder.svg?height=400&width=400&text=Prenda+no+disponible"
                      }}
                    />

                    {/* Área de impresión */}
                    <PrintArea garmentType={selectedGarment} activeTab="back" selectedColor={selectedColor} />

                    {/* ✅ DISEÑO SUPERPUESTO SOBRE LA PRENDA TRASERA */}
                    {backDesign && hasBackDesign && (
                      <div
                        ref={designRef}
                        className="absolute pointer-events-auto select-none"
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          transform: `translate(-50%, -50%) scale(${scale})`,
                          width: "200px",
                          height: "200px",
                          cursor: isDragging ? "grabbing" : "grab",
                          zIndex: 10,
                        }}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                      >
                        <img
                          src={backDesign || "/placeholder.svg"}
                          alt="Diseño trasero"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            pointerEvents: "none",
                            userSelect: "none",
                          }}
                          onError={handleImageError}
                          onLoad={handleImageLoad}
                          draggable={false}
                        />
                      </div>
                    )}
                    {!backDesign && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <p className="mb-4">Sin diseño trasero</p>
                          <Button onClick={addBackDesign} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Diseño Trasero
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Información sobre área de impresión */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Área de impresión</p>
                  <p className="text-blue-700">
                    Arrastrá el diseño dentro del área marcada.
                    {selectedGarment === "astra-oversize-hoodie" && " Las mangas y bolsillos no son imprimibles."}
                    {selectedGarment !== "lienzo" && " Los bordes y costuras tienen restricciones de impresión."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controles de escala solamente */}
          {getCurrentDesign() && shouldShowDesign() && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Ajustar Tamaño</h3>
                <div>
                  <Label className="text-xs">Tamaño: {Math.round(scale * 100)}%</Label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={scale}
                    onChange={(e) => {
                      const newScale = Number(e.target.value)
                      setScale(newScale)
                      // Reposicionar si está fuera del área de impresión
                      const constrainedPosition = isPositionInPrintArea(position, newScale, selectedGarment, activeTab)
                      setPosition(constrainedPosition)
                    }}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guía de medidas */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Ruler className="w-4 h-4" />
                <h3 className="text-sm font-medium">Guía de Medidas</h3>
              </div>
              <div className="space-y-3">
                {selectedGarment === "lienzo" ? (
                  // Para lienzo, mostrar las 3 imágenes de medidas
                  <div className="grid grid-cols-1 gap-2">
                    {(SIZE_GUIDE_IMAGES.lienzo as string[]).map((imagePath, index) => (
                      <div key={index} className="relative aspect-video bg-gray-50 rounded-lg overflow-hidden">
                        <Image
                          src={imagePath || "/placeholder.svg"}
                          alt={`Medidas lienzo ${index + 1}`}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  // Para prendas, mostrar una sola imagen
                  <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
                    <Image
                      src={
                        (SIZE_GUIDE_IMAGES[selectedGarment as keyof typeof SIZE_GUIDE_IMAGES] as string) ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt={`Medidas ${GARMENT_NAMES[selectedGarment as keyof typeof GARMENT_NAMES]}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de configuración */}
        <div className="space-y-6">
          {/* Selector de prenda */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Elegí tu prenda</h3>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(GARMENT_NAMES).map(([key, name]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedGarment(key)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      selectedGarment === key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{name}</span>
                      <span className="text-sm font-bold">
                        {formatCurrency(GARMENT_PRICES[key as keyof typeof GARMENT_PRICES])}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selector de color - RESTRINGIDO POR PRENDA */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Color</h3>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_COLORS[selectedGarment as keyof typeof AVAILABLE_COLORS]?.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`p-3 rounded-lg border-2 transition-colors capitalize ${
                      selectedColor === color
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted hover:border-muted-foreground"
                    }`}
                  >
                    {COLOR_NAMES[color as keyof typeof COLOR_NAMES]}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selector de talla */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Talle</h3>
              <div className="grid grid-cols-4 gap-2">
                {["S", "M", "L", "XL"].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted hover:border-muted-foreground"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Opciones de estampado */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Opciones de Estampado</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Estampado Frontal</p>
                    <p className="text-sm text-muted-foreground">
                      {hasFrontDesign ? "Incluido en el precio base" : "No agregado"}
                    </p>
                  </div>
                  {hasFrontDesign ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <Check className="w-3 h-3 mr-1" />
                        Activo
                      </Badge>
                      <Button size="sm" variant="outline" onClick={removeFrontDesign}>
                        <X className="w-4 h-4 mr-2" />
                        Quitar
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={addFrontDesign}>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Estampado Trasero</p>
                    <p className="text-sm text-muted-foreground">
                      {hasBackDesign ? `Por solo ${formatCurrency(DOUBLE_STAMPING_EXTRA)} extra` : "No agregado"}
                    </p>
                  </div>
                  {hasBackDesign ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-green-600">
                        <Check className="w-3 h-3 mr-1" />
                        Activo
                      </Badge>
                      <Button size="sm" variant="outline" onClick={removeBackDesign}>
                        <X className="w-4 h-4 mr-2" />
                        Quitar
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={addBackDesign}>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de precio */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Resumen de Precio</h3>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Precio base</span>
                  <span className="font-bold">{formatCurrency(basePrice)}</span>
                </div>
                {hasDoubleStamping && (
                  <div className="flex justify-between text-sm">
                    <span>Estampado trasero</span>
                    <span className="font-bold">+{formatCurrency(DOUBLE_STAMPING_EXTRA)}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(finalPrice)}</span>
                </div>
              </div>

              {/* ✅ BOTÓN ACTUALIZADO: Habilitado si hay al menos una imagen */}
              <Button onClick={addToCart} disabled={isAddingToCart || !canProceedToCart} className="w-full" size="lg">
                {isAddingToCart ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Agregar al Carrito - {formatCurrency(finalPrice)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function PlaceholderPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Cargando...</div>}>
      <PlaceholderContent />
    </Suspense>
  )
}
