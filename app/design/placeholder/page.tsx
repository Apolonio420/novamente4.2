"use client"

import type React from "react"

import { Suspense, useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  ShoppingCart,
  Eye,
  ChevronLeft,
  ChevronRight,
  Info,
  Scissors,
  RotateCcw,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getUserImages, saveImageWithoutBackground, type SavedImage } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { getGarmentMapping, getGarmentPositioning } from "@/lib/garment-mappings"

// Configuración de productos
const products = {
  "aura-oversize-tshirt": {
    name: "Aura Oversize T-Shirt Personalizada",
    price: 37000,
    colors: {
      black: {
        name: "Negro",
        front: "/garments/tshirt-black-oversize-front.jpeg",
        back: "/garments/tshirt-black-oversize-back.jpeg",
      },
      white: {
        name: "Blanco",
        front: "/garments/tshirt-white-oversize-front.jpeg",
        back: "/garments/tshirt-white-oversize-back.jpeg",
      },
      caramel: {
        name: "Caramelo",
        front: "/garments/tshirt-caramel-oversize-front.jpeg",
        back: "/garments/tshirt-caramel-oversize-back.jpeg",
      },
    },
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  "aldea-classic-tshirt": {
    name: "Aldea Classic T-Shirt Personalizada",
    price: 33000,
    colors: {
      black: {
        name: "Negro",
        front: "/garments/tshirt-black-classic-front.jpeg",
        back: "/garments/tshirt-black-classic-back.jpeg",
      },
      white: {
        name: "Blanco",
        front: "/garments/tshirt-white-classic-front.jpeg",
        back: "/garments/tshirt-white-classic-back.jpeg",
      },
    },
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  "astra-oversize-hoodie": {
    name: "Astra Oversize Hoodie Personalizada",
    price: 60000,
    colors: {
      black: { name: "Negro", front: "/garments/hoodie-black-front.jpeg", back: "/garments/hoodie-black-back.jpeg" },
      caramel: {
        name: "Caramelo",
        front: "/garments/hoodie-caramel-front.jpeg",
        back: "/garments/hoodie-caramel-back.png",
      },
      cream: { name: "Crema", front: "/garments/hoodie-cream-front.jpeg", back: "/garments/hoodie-cream-back.png" },
      gray: { name: "Gris", front: "/garments/hoodie-gray-front.jpeg", back: "/garments/hoodie-gray-back.png" },
    },
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  "lienzo-personalizado": {
    name: "Lienzo Personalizado",
    price: 59900,
    colors: {
      white: { name: "Blanco", front: "/products/lienzo-main.png", back: "/products/lienzo-main.png" },
    },
    sizes: ["30x40cm", "40x50cm", "50x70cm"],
  },
}

// Estilos base de Novamente
const baseStyles = [
  { id: "style-1", url: "/styles/acuarela-leon.png", prompt: "León en estilo acuarela" },
  { id: "style-2", url: "/styles/geometrico-aguila.png", prompt: "Águila geométrica" },
  { id: "style-3", url: "/styles/pixel-art-astronauta.png", prompt: "Astronauta pixel art" },
  { id: "style-4", url: "/styles/pop-art-retrato.png", prompt: "Retrato pop art" },
  { id: "style-5", url: "/styles/japones-gran-ola.png", prompt: "Gran ola japonesa" },
  { id: "style-6", url: "/styles/retro-vaporwave-palmera.png", prompt: "Palmera vaporwave" },
]

function DesignPlaceholderContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Estados principales
  const [selectedGarment, setSelectedGarment] = useState<keyof typeof products>("astra-oversize-hoodie")
  const [selectedColor, setSelectedColor] = useState("black")
  const [selectedSize, setSelectedSize] = useState("M")
  const [activeTab, setActiveTab] = useState<"front" | "back">("front")
  const [showOnModel, setShowOnModel] = useState(false)
  const [designImage, setDesignImage] = useState<string | null>(null)
  const [designPosition, setDesignPosition] = useState({ x: 50, y: 50 })
  const [designSize, setDesignSize] = useState(100)
  const [isDragging, setIsDragging] = useState(false)

  // Estados del historial
  const [userImages, setUserImages] = useState<SavedImage[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  // Estados para la eliminación de fondo
  const [currentImageId, setCurrentImageId] = useState<string | null>(null)
  const [showingWithoutBg, setShowingWithoutBg] = useState(false)
  const [removingBackground, setRemovingBackground] = useState(false)
  const [currentImageData, setCurrentImageData] = useState<SavedImage | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // Función para crear URL del proxy - SIMPLIFICADA
  const createProxyUrl = useCallback((originalUrl: string) => {
    // Solo usar proxy para URLs de DALL-E
    if (originalUrl.includes("oaidalleapiprodscus.blob.core.windows.net")) {
      return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`
    }
    // Para imágenes locales, usar directamente
    return originalUrl
  }, [])

  // Cargar imagen desde URL
  useEffect(() => {
    const imageUrl = searchParams.get("imageUrl") || searchParams.get("image")
    if (imageUrl) {
      console.log("🖼️ Loading image from URL parameter:", imageUrl.substring(0, 100) + "...")
      try {
        const decodedUrl = decodeURIComponent(imageUrl)
        const proxiedUrl = createProxyUrl(decodedUrl)
        console.log("🔄 Using proxied URL:", proxiedUrl.substring(0, 100) + "...")
        setDesignImage(proxiedUrl)

        const currentMapping = getCurrentGarmentMapping()
        if (currentMapping) {
          const positioning = getGarmentPositioning(currentMapping)
          // Convert positioning to center of print area
          setDesignPosition({
            x: Number.parseFloat(positioning.left) || 50,
            y: Number.parseFloat(positioning.top) || 50,
          })
        }

        toast({
          title: "Imagen cargada",
          description: "Tu diseño se ha cargado automáticamente en la prenda",
        })
      } catch (error) {
        console.error("❌ Error processing image URL:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la imagen del diseño",
          variant: "destructive",
        })
      }
    }
  }, [searchParams, createProxyUrl, toast])

  // Cargar historial de imágenes
  useEffect(() => {
    const loadUserImages = async () => {
      try {
        setHistoryLoading(true)
        const images = await getUserImages(undefined)
        setUserImages(images)
      } catch (error) {
        console.error("Error loading user images:", error)
        // Fallback a localStorage
        try {
          if (typeof window !== "undefined") {
            const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
            setUserImages(localImages.slice(0, 10))
          }
        } catch (localErr) {
          console.error("Error loading from localStorage:", localErr)
        }
      } finally {
        setHistoryLoading(false)
      }
    }

    loadUserImages()
  }, [])

  // Actualizar color cuando cambia la prenda
  useEffect(() => {
    const availableColors = Object.keys(products[selectedGarment].colors)
    if (!availableColors.includes(selectedColor)) {
      setSelectedColor(availableColors[0])
    }
  }, [selectedGarment, selectedColor])

  // Actualizar talle cuando cambia la prenda
  useEffect(() => {
    const availableSizes = products[selectedGarment].sizes
    if (!availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0])
    }
  }, [selectedGarment, selectedSize])

  const currentProduct = products[selectedGarment]
  const currentColorData = currentProduct.colors[selectedColor as keyof typeof currentProduct.colors]

  const handleImageSelect = (imageUrl: string, imageData?: SavedImage) => {
    console.log("🖼️ Image selected:", imageUrl)
    const proxiedUrl = createProxyUrl(imageUrl)
    setDesignImage(proxiedUrl)

    if (imageData) {
      setCurrentImageData(imageData)
      setCurrentImageId(imageData.id)
      setShowingWithoutBg(false)
    } else {
      setCurrentImageData(null)
      setCurrentImageId(null)
      setShowingWithoutBg(false)
    }

    toast({
      title: "Imagen cargada",
      description: "La imagen se ha cargado en el editor",
    })
  }

  const handleRemoveBackground = async () => {
    if (!currentImageData || !currentImageId) {
      toast({
        title: "Error",
        description: "No hay imagen seleccionada para procesar",
        variant: "destructive",
      })
      return
    }

    // If already has background removed, just toggle to it
    if (currentImageData.hasBgRemoved && currentImageData.urlWithoutBg) {
      console.log("🎭 Using existing background-removed version")
      const proxiedUrl = createProxyUrl(currentImageData.urlWithoutBg)
      setDesignImage(proxiedUrl)
      setShowingWithoutBg(true)
      toast({
        title: "Fondo removido",
        description: "Mostrando versión sin fondo guardada",
      })
      return
    }

    setRemovingBackground(true)

    try {
      console.log("🎭 Removing background for image:", currentImageId)

      const response = await fetch("/api/remove-bg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: currentImageData.url,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to remove background")
      }

      if (result.skipped) {
        toast({
          title: "Servicio no disponible",
          description: result.error || "No se pudo remover el fondo",
          variant: "destructive",
        })
        return
      }

      // Save the background-removed version
      await saveImageWithoutBackground(currentImageId, result.processedImageUrl)

      // Update current image data
      const updatedImageData = {
        ...currentImageData,
        urlWithoutBg: result.processedImageUrl,
        hasBgRemoved: true,
      }
      setCurrentImageData(updatedImageData)

      // Update the design image
      const proxiedUrl = createProxyUrl(result.processedImageUrl)
      setDesignImage(proxiedUrl)
      setShowingWithoutBg(true)

      // Update user images list
      setUserImages((prev) => prev.map((img) => (img.id === currentImageId ? updatedImageData : img)))

      toast({
        title: "¡Fondo removido!",
        description: "La imagen sin fondo se ha guardado correctamente",
      })
    } catch (error) {
      console.error("❌ Error removing background:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo remover el fondo",
        variant: "destructive",
      })
    } finally {
      setRemovingBackground(false)
    }
  }

  const handleToggleBackground = () => {
    if (!currentImageData) return

    if (showingWithoutBg && currentImageData.urlWithoutBg) {
      // Switch back to original
      const proxiedUrl = createProxyUrl(currentImageData.url)
      setDesignImage(proxiedUrl)
      setShowingWithoutBg(false)
      toast({
        title: "Versión original",
        description: "Mostrando imagen con fondo",
      })
    } else if (currentImageData.hasBgRemoved && currentImageData.urlWithoutBg) {
      // Switch to background-removed
      const proxiedUrl = createProxyUrl(currentImageData.urlWithoutBg)
      setDesignImage(proxiedUrl)
      setShowingWithoutBg(true)
      toast({
        title: "Sin fondo",
        description: "Mostrando imagen sin fondo",
      })
    }
  }

  const handleAddToCart = () => {
    // Implement the logic for adding to cart here
    console.log("Adding to cart...")
  }

  const getGarmentImage = () => {
    const colorData = currentProduct.colors[selectedColor as keyof typeof currentProduct.colors]
    if (!colorData) return "/placeholder.svg"

    const imagePath = activeTab === "front" ? colorData.front : colorData.back
    return imagePath
  }

  // Obtener coordenadas exactas para la combinación actual
  const getExactCoordinates = () => {
    const currentMapping = getCurrentGarmentMapping()

    if (currentMapping) {
      return currentMapping.coordinates
    }

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
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const newX = ((e.clientX - rect.left) / rect.width) * 100
    const newY = ((e.clientY - rect.top) / rect.height) * 100

    // Calcular límites basados en el área de impresión exacta
    const designWidth = 10 // Aproximación del ancho del diseño en %
    const designHeight = 10 // Aproximación del alto del diseño en %

    const minX = printArea.left
    const maxX = printArea.left + printArea.width - designWidth
    const minY = printArea.top
    const maxY = printArea.top + printArea.height - designHeight

    const constrainedX = Math.max(minX, Math.min(maxX, newX))
    const constrainedY = Math.max(minY, Math.min(maxY, newY))

    setDesignPosition({ x: constrainedX, y: constrainedY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const getCurrentGarmentMapping = () => {
    let garmentType = ""

    if (selectedGarment === "aura-oversize-tshirt") {
      garmentType = "tshirt-oversize"
    } else if (selectedGarment === "aldea-classic-tshirt") {
      garmentType = "tshirt-classic"
    } else if (selectedGarment === "astra-oversize-hoodie") {
      garmentType = "hoodie"
    }

    return getGarmentMapping(garmentType, selectedColor, activeTab as "front" | "back")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/design">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Personaliza tu Prenda</h1>
        </div>

        {/* Historial de diseños */}
        <div className="mb-6 space-y-4">
          {/* Historial del usuario */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Historial de diseños</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {historyLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-16 h-16 bg-gray-200 animate-pulse rounded-lg flex-shrink-0" />
                ))
              ) : userImages.length === 0 ? (
                <div className="text-center py-4 w-full">
                  <p className="text-gray-500 text-sm">No hay diseños guardados</p>
                </div>
              ) : (
                userImages.map((image) => (
                  <div
                    key={image.id}
                    className="group relative w-16 h-16 flex-shrink-0 cursor-pointer"
                    onClick={() => handleImageSelect(image.url, image)}
                  >
                    <Image
                      src={createProxyUrl(image.url) || "/placeholder.svg"}
                      alt={image.prompt}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-lg border-2 border-transparent group-hover:border-primary transition-colors"
                      onError={(e) => {
                        console.error("Error loading history image:", image.url)
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    {image.hasBgRemoved && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Scissors className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Estilos inspiradores */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Estilos inspiradores</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {baseStyles.map((style) => (
                <div
                  key={style.id}
                  className="group relative w-16 h-16 flex-shrink-0 cursor-pointer"
                  onClick={() => handleImageSelect(style.url)}
                >
                  <Image
                    src={style.url || "/placeholder.svg"}
                    alt={style.prompt}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-lg border-2 border-transparent group-hover:border-primary transition-colors"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vista previa del producto */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {/* Controles de vista */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="show-model" checked={showOnModel} onCheckedChange={setShowOnModel} />
                    <Label htmlFor="show-model">Mostrar en modelo</Label>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4" />
                    Arrastra para mover
                  </div>
                </div>

                {/* Tabs Front/Back */}
                <div className="flex bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("front")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "front"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Frontal ✓
                  </button>
                  <button
                    onClick={() => setActiveTab("back")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "back"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Trasero
                  </button>
                </div>
              </div>

              {currentImageData && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Imagen seleccionada:</span>
                    <span className="text-muted-foreground truncate max-w-[200px]">{currentImageData.prompt}</span>
                    {showingWithoutBg && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Sin fondo</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {currentImageData.hasBgRemoved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleBackground}
                        className="text-xs bg-transparent"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        {showingWithoutBg ? "Con fondo" : "Sin fondo"}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveBackground}
                      disabled={removingBackground}
                      className="text-xs bg-transparent"
                    >
                      {removingBackground ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Scissors className="w-3 h-3 mr-1" />
                          {currentImageData.hasBgRemoved ? "Ya sin fondo" : "Remover fondo"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Canvas de diseño */}
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div
                    ref={containerRef}
                    className="relative aspect-square bg-gray-100 cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  >
                    <Image
                      src={getGarmentImage() || "/placeholder.svg"}
                      alt={`${currentProduct.name} ${currentColorData?.name} ${activeTab}`}
                      fill
                      className="object-contain"
                      priority
                    />

                    <div
                      className="absolute border-2 border-red-500 border-dashed pointer-events-none opacity-50"
                      style={{
                        left: `${printArea.left}%`,
                        top: `${printArea.top}%`,
                        width: `${printArea.width}%`,
                        height: `${printArea.height}%`,
                      }}
                    >
                      <div className="absolute -bottom-6 left-0 text-xs text-red-500 bg-white px-1 rounded">
                        Área de impresión
                      </div>
                    </div>

                    {/* Imagen de diseño */}
                    {designImage && (
                      <div
                        className={`absolute cursor-move ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                        style={{
                          left: `${designPosition.x}%`,
                          top: `${designPosition.y}%`,
                          width: `${designSize}px`,
                          height: `${designSize}px`,
                          transform: "translate(-50%, -50%)",
                          zIndex: 10,
                        }}
                      >
                        <Image
                          src={designImage || "/placeholder.svg"}
                          alt="Diseño personalizado"
                          width={designSize}
                          height={designSize}
                          className="w-full h-full object-contain pointer-events-none"
                          draggable={false}
                          onError={(e) => {
                            console.error("Error loading design image:", designImage)
                            e.currentTarget.src = "/placeholder.svg"
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Panel de configuración */}
          <div className="space-y-6">
            {/* Selección de producto */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Elegí tu prenda</h3>
                <RadioGroup
                  value={selectedGarment}
                  onValueChange={(value) => setSelectedGarment(value as keyof typeof products)}
                  className="space-y-3"
                >
                  {Object.entries(products).map(([key, product]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={key} id={key} />
                        <Label htmlFor={key} className="font-medium">
                          {product.name}
                        </Label>
                      </div>
                      <span className="font-bold">${product.price.toLocaleString()}</span>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Selección de color */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Color</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(currentProduct.colors).map(([colorKey, colorData]) => (
                    <Button
                      key={colorKey}
                      variant={selectedColor === colorKey ? "default" : "outline"}
                      onClick={() => setSelectedColor(colorKey)}
                      className="justify-center"
                    >
                      {colorData.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selección de talle */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Talle</h3>
                <div className="grid grid-cols-3 gap-2">
                  {currentProduct.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      onClick={() => setSelectedSize(size)}
                      size="sm"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Información del área de impresión */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 border-2 border-red-500 border-dashed mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm mb-1">Área de impresión</h4>
                    <p className="text-sm text-muted-foreground">
                      Arrastra el diseño dentro del área marcada. Los bordes y costuras tienen restricciones de
                      impresión.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumen y botón de compra */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-2xl font-bold">${currentProduct.price.toLocaleString()}</span>
                  </div>

                  <Button onClick={handleAddToCart} className="w-full" size="lg" disabled={!designImage}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Agregar al Carrito
                  </Button>

                  {!designImage && (
                    <p className="text-sm text-muted-foreground text-center">Selecciona una imagen para continuar</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DesignPlaceholderPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Cargando...</div>}>
      <DesignPlaceholderContent />
    </Suspense>
  )
}
