"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, ShoppingCart, Eye, ChevronLeft, ChevronRight, Info } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { PrintArea } from "@/components/PrintArea"
import { OptimizedImage } from "@/components/OptimizedImage"
import { getRecentImages, type SavedImage } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

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

export default function DesignPlaceholderPage() {
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

  // Estados del historial
  const [userImages, setUserImages] = useState<SavedImage[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyScrollPosition, setHistoryScrollPosition] = useState(0)
  const [stylesScrollPosition, setStylesScrollPosition] = useState(0)

  // Cargar imagen desde URL
  useEffect(() => {
    const imageUrl = searchParams.get("image")
    if (imageUrl) {
      console.log("🖼️ Loading image from URL parameter:", imageUrl)
      const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
      console.log("🔄 Using proxied URL:", proxiedUrl)
      setDesignImage(proxiedUrl)
    }
  }, [searchParams])

  // Cargar historial de imágenes
  useEffect(() => {
    const loadUserImages = async () => {
      try {
        setHistoryLoading(true)
        const images = await getRecentImages(undefined, 10)
        setUserImages(images)
      } catch (error) {
        console.error("Error loading user images:", error)
        // Fallback a localStorage
        try {
          const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
          setUserImages(localImages.slice(0, 10))
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

  const handleImageSelect = (imageUrl: string) => {
    console.log("🖼️ Image selected:", imageUrl)
    setDesignImage(imageUrl)
    toast({
      title: "Imagen cargada",
      description: "La imagen se ha cargado en el editor",
    })
  }

  const scrollHistory = (direction: "left" | "right") => {
    const container = document.getElementById("history-scroll")
    if (container) {
      const scrollAmount = 200
      const newPosition =
        direction === "left" ? Math.max(0, historyScrollPosition - scrollAmount) : historyScrollPosition + scrollAmount

      container.scrollTo({ left: newPosition, behavior: "smooth" })
      setHistoryScrollPosition(newPosition)
    }
  }

  const scrollStyles = (direction: "left" | "right") => {
    const container = document.getElementById("styles-scroll")
    if (container) {
      const scrollAmount = 200
      const newPosition =
        direction === "left" ? Math.max(0, stylesScrollPosition - scrollAmount) : stylesScrollPosition + scrollAmount

      container.scrollTo({ left: newPosition, behavior: "smooth" })
      setStylesScrollPosition(newPosition)
    }
  }

  const handleAddToCart = () => {
    if (!designImage) {
      toast({
        title: "Imagen requerida",
        description: "Selecciona una imagen para personalizar tu prenda",
        variant: "destructive",
      })
      return
    }

    const cartItem = {
      id: `${selectedGarment}-${selectedColor}-${selectedSize}-${Date.now()}`,
      productId: selectedGarment,
      productName: currentProduct.name,
      color: selectedColor,
      colorName: currentColorData?.name || selectedColor,
      size: selectedSize,
      price: currentProduct.price,
      designImage,
      designPosition,
      designSize,
      side: activeTab,
      quantity: 1,
    }

    // Agregar al carrito (localStorage por ahora)
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    existingCart.push(cartItem)
    localStorage.setItem("cart", JSON.stringify(existingCart))

    toast({
      title: "¡Agregado al carrito!",
      description: `${currentProduct.name} agregada correctamente`,
    })

    // Disparar evento para actualizar el badge del carrito
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const getGarmentImage = () => {
    const colorData = currentProduct.colors[selectedColor as keyof typeof currentProduct.colors]
    if (!colorData) return "/placeholder.svg"

    const imagePath = activeTab === "front" ? colorData.front : colorData.back
    console.log("🖼️ Getting garment image:", {
      selectedGarment,
      selectedColor,
      side: activeTab,
      imageKey: `${selectedColor}-${activeTab}`,
      imagePath,
      colorData,
    })

    return imagePath
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollHistory("left")}
                  disabled={historyScrollPosition === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => scrollHistory("right")}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div
              id="history-scroll"
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
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
                    onClick={() => handleImageSelect(image.url)}
                  >
                    <OptimizedImage
                      src={image.url}
                      alt={image.prompt}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-lg border-2 border-transparent group-hover:border-primary transition-colors"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollStyles("left")}
                  disabled={stylesScrollPosition === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => scrollStyles("right")}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div
              id="styles-scroll"
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {baseStyles.map((style) => (
                <div
                  key={style.id}
                  className="group relative w-16 h-16 flex-shrink-0 cursor-pointer"
                  onClick={() => handleImageSelect(style.url)}
                >
                  <OptimizedImage
                    src={style.url}
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

              {/* Canvas de diseño */}
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-square bg-gray-100">
                    <Image
                      src={getGarmentImage() || "/placeholder.svg"}
                      alt={`${currentProduct.name} ${currentColorData?.name} ${activeTab}`}
                      fill
                      className="object-contain"
                      priority
                    />

                    <PrintArea
                      garmentType={selectedGarment}
                      garmentColor={selectedColor}
                      activeTab={activeTab}
                      designImage={designImage}
                      designPosition={designPosition}
                      designSize={designSize}
                      onPositionChange={setDesignPosition}
                      onSizeChange={setDesignSize}
                    />
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
