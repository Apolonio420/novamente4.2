"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useCart } from "@/lib/cartStore"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { Loader, ShoppingCart, Plus, Check, ArrowLeft, ZoomIn, ZoomOut } from "lucide-react"
import Link from "next/link"
import { getGarmentMapping } from "@/lib/garment-mappings"
import { saveImageWithoutBackground } from "@/lib/db"

interface DesignCustomizerProps {
  initialImageUrl: string
  imageId?: string
}

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

const COLORS_BY_GARMENT: Record<string, string[]> = {
  "aura-oversize-tshirt": ["black", "white", "caramel"],
  "aldea-classic-tshirt": ["black", "white"],
  "astra-oversize-hoodie": ["black", "caramel", "gray", "cream"],
  lienzo: ["white"],
}

const DOUBLE_STAMPING_EXTRA = 7000
const BASE = 400

export function DesignCustomizer({ initialImageUrl, imageId }: DesignCustomizerProps) {
  const { addItem } = useCart()
  const { toast } = useToast()

  const [selectedGarment, setSelectedGarment] = useState("aura-oversize-tshirt")
  const [selectedColor, setSelectedColor] = useState("black")
  const [selectedSize, setSelectedSize] = useState("M")
  const [showOnModel, setShowOnModel] = useState(false)
  const [activeTab, setActiveTab] = useState("front")
  const [frontDesign, setFrontDesign] = useState<string | null>(null)
  const [backDesign, setBackDesign] = useState<string | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const [isRemovingBg, setIsRemovingBg] = useState(false)
  const [hasBackgroundRemoved, setHasBackgroundRemoved] = useState(false)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [bgRemovedImageUrl, setBgRemovedImageUrl] = useState<string | null>(null)

  const [position, setPosition] = useState({ x: 50, y: 50 }) // 0-100 relativo al área
  const [designSizePct, setDesignSizePct] = useState(60) // % del ancho del área

  const mapping = useMemo(() => {
    const side = activeTab === "back" ? "back" : "front"
    return getGarmentMapping(selectedGarment, selectedColor, side)
  }, [selectedGarment, selectedColor, activeTab])

  const framePct = useMemo(() => {
    if (!mapping) return null
    const { x, y, width, height } = mapping.coordinates
    return {
      leftPct: (x / BASE) * 100,
      topPct: (y / BASE) * 100,
      widthPct: (width / BASE) * 100,
      heightPct: (height / BASE) * 100,
    }
  }, [mapping])

  useEffect(() => {
    if (initialImageUrl) {
      const processedUrl = initialImageUrl.includes("oaidalleapiprodscus.blob.core.windows.net")
        ? `/api/proxy-image?url=${encodeURIComponent(initialImageUrl)}`
        : initialImageUrl

      setFrontDesign(processedUrl)
      setOriginalImageUrl(processedUrl)
      setPosition({ x: 50, y: 50 })
      console.log("[v0] Setting initial design:", processedUrl)

      toast({
        title: "Imagen cargada",
        description: "La imagen se ha aplicado automáticamente a la prenda",
      })
    }
  }, [initialImageUrl, toast])

  const getGarmentImage = () => {
    if (selectedGarment === "lienzo") return "/products/lienzo-main.png"
    const side = activeTab === "back" ? "back" : "front"
    return getGarmentMapping(selectedGarment, selectedColor, side)?.garmentPath ?? "/placeholder.svg"
  }

  const addBackDesign = () => {
    if (frontDesign) {
      setBackDesign(frontDesign)
      setActiveTab("back")
      toast({
        title: "Diseño trasero agregado",
        description: `Se agregó el estampado trasero (+${formatCurrency(DOUBLE_STAMPING_EXTRA)})`,
      })
    }
  }

  const removeBackDesign = () => {
    setBackDesign(null)
    setActiveTab("front")
    toast({
      title: "Diseño trasero eliminado",
      description: "Se eliminó el estampado trasero",
    })
  }

  const toggleBackgroundRemoval = async () => {
    if (!originalImageUrl || !imageId) {
      toast({
        title: "Error",
        description: "No se puede procesar la imagen",
        variant: "destructive",
      })
      return
    }

    if (hasBackgroundRemoved && bgRemovedImageUrl) {
      setFrontDesign(originalImageUrl)
      setHasBackgroundRemoved(false)
      toast({
        title: "Fondo restaurado",
        description: "Se restauró la imagen original",
      })
      return
    }

    if (bgRemovedImageUrl) {
      setFrontDesign(bgRemovedImageUrl)
      setHasBackgroundRemoved(true)
      toast({
        title: "Fondo removido",
        description: "Se aplicó la versión sin fondo",
      })
      return
    }

    setIsRemovingBg(true)
    try {
      const response = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: originalImageUrl }),
      })

      if (!response.ok) throw new Error("Failed to remove background")

      const { imageUrl: bgRemovedUrl } = await response.json()

      await saveImageWithoutBackground(imageId, bgRemovedUrl)

      setBgRemovedImageUrl(bgRemovedUrl)
      setFrontDesign(bgRemovedUrl)
      setHasBackgroundRemoved(true)

      toast({
        title: "Fondo removido",
        description: "Se removió el fondo exitosamente",
      })
    } catch (error) {
      console.error("Error removing background:", error)
      toast({
        title: "Error",
        description: "No se pudo remover el fondo",
        variant: "destructive",
      })
    } finally {
      setIsRemovingBg(false)
    }
  }

  const getCurrentDesign = () => {
    return activeTab === "front" ? frontDesign : backDesign
  }

  const increaseSize = () => {
    setDesignSizePct((prev) => Math.min(120, prev + 5)) // Máximo 120% del área
  }

  const decreaseSize = () => {
    setDesignSizePct((prev) => Math.max(10, prev - 5)) // Mínimo 10% del área
  }

  const basePrice = GARMENT_PRICES[selectedGarment as keyof typeof GARMENT_PRICES] || 0
  const hasDoubleStamping = frontDesign && backDesign
  const finalPrice = basePrice + (hasDoubleStamping ? DOUBLE_STAMPING_EXTRA : 0)

  const addToCart = async () => {
    if (!frontDesign) {
      toast({
        title: "Error",
        description: "Debes tener al menos un diseño frontal",
        variant: "destructive",
      })
      return
    }

    setIsAddingToCart(true)

    try {
      const cartItem = {
        id: `${selectedGarment}-${selectedColor}-${selectedSize}-${Date.now()}`,
        name: GARMENT_NAMES[selectedGarment as keyof typeof GARMENT_NAMES],
        garmentType: selectedGarment,
        color: selectedColor,
        size: selectedSize,
        price: finalPrice,
        quantity: 1,
        imageUrl: frontDesign,
        frontDesign,
        backDesign,
      }

      console.log("🛒 Adding to cart:", cartItem)

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

  return (
    <div className="container mx-auto px-4 py-8">
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

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="model-toggle" className="text-sm">
                Mostrar en modelo
              </Label>
              <Switch id="model-toggle" checked={showOnModel} onCheckedChange={setShowOnModel} />
            </div>
            {getCurrentDesign() && imageId && (
              <div className="flex items-center gap-2">
                <Label className="text-sm">{hasBackgroundRemoved ? "Sin fondo" : "Con fondo"}</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleBackgroundRemoval}
                  disabled={isRemovingBg}
                  className="h-8 bg-transparent"
                >
                  {isRemovingBg ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : hasBackgroundRemoved ? (
                    "Restaurar fondo"
                  ) : (
                    "Remover fondo"
                  )}
                </Button>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="front" className="flex items-center gap-2">
                Frontal
                {frontDesign && (
                  <Badge variant="secondary" className="text-xs">
                    ✓
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="back" className="flex items-center gap-2">
                Trasero
                {backDesign && (
                  <Badge variant="secondary" className="text-xs">
                    ✓
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="front" className="mt-4">
              <Card className="relative overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={getGarmentImage() || "/placeholder.svg"}
                      alt="Prenda frontal"
                      className="w-full h-full object-contain"
                      onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                    />

                    {framePct && (
                      <div
                        className="absolute border-2 border-red-500 border-dashed pointer-events-none opacity-50"
                        style={{
                          left: `${framePct.leftPct}%`,
                          top: `${framePct.topPct}%`,
                          width: `${framePct.widthPct}%`,
                          height: `${framePct.heightPct}%`,
                          zIndex: 5,
                        }}
                      >
                        <div className="absolute -bottom-6 left-0 text-xs text-red-500 bg-white px-1 rounded">
                          Área de impresión
                        </div>
                      </div>
                    )}

                    {frontDesign && framePct && (
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          left: `${framePct.leftPct + (framePct.widthPct * position.x) / 100}%`,
                          top: `${framePct.topPct + (framePct.heightPct * position.y) / 100}%`,
                          width: `${framePct.widthPct * (designSizePct / 100)}%`,
                          transform: "translate(-50%, -50%)",
                          zIndex: 10,
                        }}
                      >
                        <img
                          src={frontDesign || "/placeholder.svg"}
                          alt="Diseño frontal"
                          className="w-full h-auto object-contain"
                          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="back" className="mt-4">
              <Card className="relative overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={getGarmentImage() || "/placeholder.svg"}
                      alt="Prenda trasera"
                      className="w-full h-full object-contain"
                      onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                    />

                    {framePct && (
                      <div
                        className="absolute border-2 border-red-500 border-dashed pointer-events-none opacity-50"
                        style={{
                          left: `${framePct.leftPct}%`,
                          top: `${framePct.topPct}%`,
                          width: `${framePct.widthPct}%`,
                          height: `${framePct.heightPct}%`,
                          zIndex: 5,
                        }}
                      >
                        <div className="absolute -bottom-6 left-0 text-xs text-red-500 bg-white px-1 rounded">
                          Área de impresión
                        </div>
                      </div>
                    )}

                    {backDesign && framePct && (
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          left: `${framePct.leftPct + (framePct.widthPct * position.x) / 100}%`,
                          top: `${framePct.topPct + (framePct.heightPct * position.y) / 100}%`,
                          width: `${framePct.widthPct * (designSizePct / 100)}%`,
                          transform: "translate(-50%, -50%)",
                          zIndex: 10,
                        }}
                      >
                        <img
                          src={backDesign || "/placeholder.svg"}
                          alt="Diseño trasero"
                          className="w-full h-auto object-contain"
                          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
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

          {getCurrentDesign() && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Ajustar Posición y Tamaño</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Horizontal: {position.x}%</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={position.x}
                      onChange={(e) => setPosition({ ...position, x: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vertical: {position.y}%</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={position.y}
                      onChange={(e) => setPosition({ ...position, y: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs">Tamaño del estampado: {designSizePct}%</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={decreaseSize}
                          disabled={designSizePct <= 10}
                          className="h-6 w-6 p-0 bg-transparent"
                        >
                          <ZoomOut className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={increaseSize}
                          disabled={designSizePct >= 120}
                          className="h-6 w-6 p-0"
                        >
                          <ZoomIn className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      step="5"
                      value={designSizePct}
                      onChange={(e) => setDesignSizePct(Number(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 rounded-lg appearance-none cursor-pointer size-slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10%</span>
                      <span>50%</span>
                      <span>100%</span>
                      <span>120%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
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

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Color</h3>
              <div className="grid grid-cols-2 gap-2">
                {COLORS_BY_GARMENT[selectedGarment]?.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`p-3 rounded-lg border-2 transition-colors capitalize ${
                      selectedColor === color
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted hover:border-muted-foreground"
                    }`}
                  >
                    {color === "black"
                      ? "Negro"
                      : color === "white"
                        ? "Blanco"
                        : color === "caramel"
                          ? "Caramelo"
                          : color === "gray"
                            ? "Gris"
                            : "Crema"}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

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

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Opciones de Estampado</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Estampado Frontal</p>
                    <p className="text-sm text-muted-foreground">Incluido en el precio base</p>
                  </div>
                  <Badge variant="secondary">
                    <Check className="w-3 h-3 mr-1" />
                    Activo
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Estampado Trasero</p>
                    <p className="text-sm text-muted-foreground">
                      Por solo {formatCurrency(DOUBLE_STAMPING_EXTRA)} extra
                    </p>
                  </div>
                  {backDesign ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-green-600">
                        <Check className="w-3 h-3 mr-1" />
                        Activo
                      </Badge>
                      <Button size="sm" variant="outline" onClick={removeBackDesign}>
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

              <Button onClick={addToCart} disabled={isAddingToCart || !frontDesign} className="w-full" size="lg">
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
