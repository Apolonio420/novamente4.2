"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Move } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { PrintArea } from "@/components/PrintArea"

// Coordenadas exactas del JSON para restricciones de arrastre
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

const garmentOptions = [
  {
    id: "aura-oversize-tshirt",
    name: "Aura Oversize T-Shirt Personalizada",
    price: 37000,
    colors: ["black", "white", "caramel"],
    images: {
      "black-front": "/garments/tshirt-black-oversize-front.jpeg",
      "black-back": "/garments/tshirt-black-oversize-back.jpeg",
      "white-front": "/garments/tshirt-white-oversize-front.jpeg",
      "white-back": "/garments/tshirt-white-oversize-back.jpeg",
      "caramel-front": "/garments/tshirt-caramel-oversize-front.jpeg",
      "caramel-back": "/garments/tshirt-caramel-oversize-back.jpeg",
    },
  },
  {
    id: "aldea-classic-tshirt",
    name: "Aldea Classic T-Shirt Personalizada",
    price: 33000,
    colors: ["black", "white"],
    images: {
      "black-front": "/garments/tshirt-black-classic-front.jpeg",
      "black-back": "/garments/tshirt-black-classic-back.jpeg",
      "white-front": "/garments/tshirt-white-classic-front.jpeg",
      "white-back": "/garments/tshirt-white-classic-back.jpeg",
    },
  },
  {
    id: "astra-hoodie",
    name: "Astra Oversize Hoodie Personalizada",
    price: 60000,
    colors: ["black", "caramel", "cream", "gray"],
    images: {
      "black-front": "/garments/hoodie-black-front.jpeg",
      "black-back": "/garments/hoodie-black-back.jpeg",
      "caramel-front": "/garments/hoodie-caramel-front.jpeg",
      "caramel-back": "/garments/hoodie-caramel-back.png",
      "cream-front": "/garments/hoodie-cream-front.jpeg",
      "cream-back": "/garments/hoodie-cream-back.png",
      "gray-front": "/garments/hoodie-gray-front.jpeg",
      "gray-back": "/garments/hoodie-gray-back.png",
    },
  },
  {
    id: "lienzo",
    name: "Lienzo Personalizado",
    price: 59900,
    colors: ["white"],
    images: {
      "white-front": "/products/lienzo-main.png",
    },
  },
]

const colorNames = {
  black: "Negro",
  white: "Blanco",
  caramel: "Caramelo",
  cream: "Crema",
  gray: "Gris",
}

export default function PlaceholderDesignPage() {
  const searchParams = useSearchParams()
  const imageUrl = searchParams.get("image")
  const [selectedGarment, setSelectedGarment] = useState("aura-oversize-tshirt")
  const [selectedColor, setSelectedColor] = useState("black")
  const [activeTab, setActiveTab] = useState<"front" | "back">("front")
  const [showOnModel, setShowOnModel] = useState(false)
  const [designImage, setDesignImage] = useState<string | null>(null)
  const [designPosition, setDesignPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (imageUrl) {
      console.log("🖼️ Loading image from URL parameter:", imageUrl)
      const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
      console.log("🔄 Using proxied URL:", proxiedUrl)
      setDesignImage(proxiedUrl)
    }
  }, [imageUrl])

  const selectedGarmentData = garmentOptions.find((g) => g.id === selectedGarment)

  const getGarmentImage = () => {
    if (!selectedGarmentData) return "/placeholder.svg"

    const side = activeTab
    const imageKey = `${selectedColor}-${side}` as keyof typeof selectedGarmentData.images
    const imagePath = selectedGarmentData.images[imageKey]

    console.log("🖼️ Getting garment image:", {
      selectedGarment,
      selectedColor,
      side,
      imageKey,
      imagePath,
      availableImages: Object.keys(selectedGarmentData.images),
    })

    return imagePath || "/placeholder.svg"
  }

  // Calcular límites de arrastre basados en las coordenadas exactas
  const getDragConstraints = () => {
    const coordinateKey = `${selectedGarment}-${selectedColor}-${activeTab}`
    const coordinates = EXACT_COORDINATES[coordinateKey as keyof typeof EXACT_COORDINATES]

    if (!coordinates || !containerRef.current) {
      return { left: 0, top: 0, right: 100, bottom: 100 }
    }

    const containerWidth = 400
    const containerHeight = 500
    const designSize = 80 // Tamaño del diseño en px

    // Convertir coordenadas absolutas a porcentajes
    const leftPercent = (coordinates.x / containerWidth) * 100
    const topPercent = (coordinates.y / containerHeight) * 100
    const rightPercent = ((coordinates.x + coordinates.width - designSize) / containerWidth) * 100
    const bottomPercent = ((coordinates.y + coordinates.height - designSize) / containerHeight) * 100

    return {
      left: leftPercent,
      top: topPercent,
      right: Math.max(rightPercent, leftPercent + 5), // Mínimo 5% de ancho
      bottom: Math.max(bottomPercent, topPercent + 5), // Mínimo 5% de alto
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!designImage) return

    setIsDragging(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setDragOffset({
        x: x - designPosition.x,
        y: y - designPosition.y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x
    const y = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y

    const constraints = getDragConstraints()

    // Aplicar restricciones
    const constrainedX = Math.max(constraints.left, Math.min(constraints.right, x))
    const constrainedY = Math.max(constraints.top, Math.min(constraints.bottom, y))

    setDesignPosition({ x: constrainedX, y: constrainedY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove as any)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove as any)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  if (!designImage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">No hay imagen para diseñar</h2>
            <p className="text-muted-foreground mb-6">Selecciona una imagen para comenzar a diseñar tu prenda.</p>
            <Link href="/design">
              <Button>Volver al generador</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/design">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Personaliza tu Prenda</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vista previa */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="show-model"
                        checked={showOnModel}
                        onCheckedChange={setShowOnModel}
                        disabled={selectedGarment === "lienzo"}
                      />
                      <Label htmlFor="show-model">Mostrar en modelo</Label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Move className="w-4 h-4" />
                    Arrastra para mover
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "front" | "back")}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="front">Frontal</TabsTrigger>
                    <TabsTrigger value="back" disabled={selectedGarment === "lienzo"}>
                      Trasero
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab}>
                    <div
                      ref={containerRef}
                      className="relative bg-gray-100 rounded-lg overflow-hidden aspect-[4/5] cursor-crosshair"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                    >
                      <Image
                        src={getGarmentImage() || "/placeholder.svg"}
                        alt={`${selectedGarmentData?.name} ${colorNames[selectedColor as keyof typeof colorNames]} ${activeTab}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 66vw"
                      />

                      {/* Área de impresión */}
                      <PrintArea garmentType={selectedGarment} garmentColor={selectedColor} activeTab={activeTab} />

                      {/* Imagen de diseño */}
                      {designImage && (
                        <div
                          className="absolute w-20 h-20 cursor-move"
                          style={{
                            left: `${designPosition.x}%`,
                            top: `${designPosition.y}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          <Image
                            src={designImage || "/placeholder.svg"}
                            alt="Diseño"
                            fill
                            className="object-contain"
                            sizes="80px"
                            onLoad={() => console.log("✅ Design image loaded successfully")}
                            onError={(e) => console.error("❌ Error loading design image:", e)}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Panel de configuración */}
          <div className="space-y-6">
            {/* Selección de prenda */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Elegí tu prenda</h3>
                <RadioGroup value={selectedGarment} onValueChange={setSelectedGarment}>
                  {garmentOptions.map((garment) => (
                    <div key={garment.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={garment.id} id={garment.id} />
                      <Label htmlFor={garment.id} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span>{garment.name}</span>
                          <span className="font-bold">${garment.price.toLocaleString()}</span>
                        </div>
                      </Label>
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
                  {selectedGarmentData?.colors.map((color) => (
                    <Button
                      key={color}
                      variant={selectedColor === color ? "default" : "outline"}
                      onClick={() => setSelectedColor(color)}
                      className="justify-center"
                    >
                      {colorNames[color as keyof typeof colorNames]}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Información del área de impresión */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 border-2 border-red-500 border-dashed"></div>
                  <span className="text-sm font-medium">Área de impresión</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Arrastra el diseño dentro del área marcada. Los bordes y costuras tienen restricciones de impresión.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
