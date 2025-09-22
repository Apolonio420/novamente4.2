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
import { StampSizeSelector } from "./StampSizeSelector"

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

// Función para obtener la imagen de la prenda según el tipo y color
const getGarmentImage = (garmentType: string, color: string) => {
  const colorMap = {
    'black': 'black',
    'white': 'white', 
    'caramel': 'caramel',
    'gray': 'gray',
    'cream': 'cream'
  }
  
  const colorCode = colorMap[color as keyof typeof colorMap] || 'black'
  
  switch (garmentType) {
    case 'aura-oversize-tshirt':
      return `/garments/tshirt-${colorCode}-oversize-front.jpeg`
    case 'aldea-classic-tshirt':
      return `/garments/tshirt-${colorCode}-classic-front.jpeg`
    case 'astra-oversize-hoodie':
      return `/garments/hoodie-${colorCode}-front.jpeg`
    case 'lienzo':
      return '/placeholder.svg'
    default:
      return '/placeholder.svg'
  }
}

// Imágenes por defecto para mostrar en el selector (sin color específico)
const GARMENT_DEFAULT_IMAGES = {
  "aura-oversize-tshirt": "/garments/tshirt-white-oversize-front.jpeg",
  "aldea-classic-tshirt": "/garments/tshirt-white-classic-front.jpeg", 
  "astra-oversize-hoodie": "/garments/hoodie-black-front.jpeg",
  "lienzo": "/placeholder.svg",
}

const COLORS_BY_GARMENT: Record<string, string[]> = {
  "aura-oversize-tshirt": ["black", "white", "caramel"],
  "aldea-classic-tshirt": ["black", "white"],
  "astra-oversize-hoodie": ["black", "caramel", "gray", "cream"],
  lienzo: ["white"],
}

const DOUBLE_STAMPING_EXTRA = 7000

export function DesignCustomizer({ initialImageUrl, imageId }: DesignCustomizerProps) {
  const { addItem } = useCart()
  const { toast } = useToast()

  const [selectedGarment, setSelectedGarment] = useState("astra-oversize-hoodie")
  const [selectedColor, setSelectedColor] = useState("black")
  const [selectedSize, setSelectedSize] = useState("M")
  const [showOnModel, setShowOnModel] = useState(false)
  const [activeTab, setActiveTab] = useState("front")
  const [frontDesign, setFrontDesign] = useState<string | null>(null)
  const [backDesign, setBackDesign] = useState<string | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  // Estados para doble estampado
  const [isDoubleStamping, setIsDoubleStamping] = useState(false)
  const [stampingMode, setStampingMode] = useState<'front' | 'back' | 'both'>('front')
  const [frontStampSize, setFrontStampSize] = useState<'R1' | 'R2' | null>(null)
  const [backStampSize, setBackStampSize] = useState<'R1' | 'R2' | null>(null)
  const [frontStampPosition, setFrontStampPosition] = useState<'center' | 'left' | null>(null)
  const [backStampPosition, setBackStampPosition] = useState<'center' | 'left' | null>(null)

  const [isRemovingBg, setIsRemovingBg] = useState(false)
  const [hasBackgroundRemoved, setHasBackgroundRemoved] = useState(false)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [bgRemovedImageUrl, setBgRemovedImageUrl] = useState<string | null>(null)

  // Estados para el sistema de estampado
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)

  // Estados para el sistema de estampado
  const [stampSize, setStampSize] = useState<'R1' | 'R2' | null>(null)
  const [stampPosition, setStampPosition] = useState<'center' | 'left' | null>(null)
  const [isGeneratingStamp, setIsGeneratingStamp] = useState(false)
  const [stampedImageUrl, setStampedImageUrl] = useState<string | null>(null)

  // Estado para controlar el flujo dinámico
  const [currentStep, setCurrentStep] = useState<'garment' | 'stamp-options' | 'generate'>('garment')
  
  // Estado para acumular selecciones visualmente
  const [selections, setSelections] = useState<Array<{
    type: 'garment' | 'color' | 'size' | 'stamp'
    value: string
    label: string
    image?: string
  }>>([])

  const mapping = useMemo(() => {
    const side = activeTab === "back" ? "back" : "front"
    const result = getGarmentMapping(selectedGarment, selectedColor, side)
    console.log("[DesignCustomizer] Mapping result:", {
      selectedGarment,
      selectedColor,
      side,
      mapping: result
    })
    return result
  }, [selectedGarment, selectedColor, activeTab])

  const framePct = useMemo(() => {
    if (!mapping || !nat) {
      console.log("[DesignCustomizer] No mapping or nat:", { mapping: !!mapping, nat: !!nat })
      return null
    }
    const { x, y, width, height } = mapping.coordinates
    
    // Usar las dimensiones base del mapeo (400x500) para calcular los porcentajes
    const baseWidth = 400
    const baseHeight = 500
    
    // Calcular el factor de escala para ajustar a las dimensiones reales de la imagen
    const scaleX = nat.w / baseWidth
    const scaleY = nat.h / baseHeight
    
    const result = {
      leftPct: (x * scaleX / nat.w) * 100,
      topPct: (y * scaleY / nat.h) * 100,
      widthPct: (width * scaleX / nat.w) * 100,
      heightPct: (height * scaleY / nat.h) * 100,
    }
    console.log("[DesignCustomizer] FramePct calculation:", {
      coordinates: { x, y, width, height },
      baseDimensions: { baseWidth, baseHeight },
      nat: { w: nat.w, h: nat.h },
      scale: { scaleX, scaleY },
      result
    })
    return result
  }, [mapping, nat])

  useEffect(() => {
    if (initialImageUrl) {
      // Para imágenes procesadas (con fondo removido), usar directamente la URL
      // Para imágenes de DALL-E, usar el proxy
      const processedUrl = initialImageUrl.includes("oaidalleapiprodscus.blob.core.windows.net")
        ? `/api/proxy-image?url=${encodeURIComponent(initialImageUrl)}`
        : initialImageUrl

      setFrontDesign(processedUrl)
      setOriginalImageUrl(processedUrl)
      console.log("[DesignCustomizer] Setting initial design:", processedUrl)
      console.log("[DesignCustomizer] Image URL type:", initialImageUrl.includes("supabase.co") ? "Supabase" : "Other")

      toast({
        title: "Imagen cargada",
        description: "La imagen procesada se ha aplicado automáticamente a la prenda",
      })
    }
  }, [initialImageUrl, toast])

  // Resetear posición cuando cambia el mapeo de la prenda
  useEffect(() => {
    if (mapping) {
      console.log("[DesignCustomizer] New garment mapping loaded:", mapping.garmentPath)
    }
  }, [mapping])

  // Update available colors when garment changes
  useEffect(() => {
    const availableColors = COLORS_BY_GARMENT[selectedGarment] || []
    if (!availableColors.includes(selectedColor)) {
      setSelectedColor(availableColors[0] || "black")
    }
  }, [selectedGarment, selectedColor])

  // Funciones para manejar el flujo dinámico
  const handleGarmentSelect = (garment: string) => {
    setSelectedGarment(garment)
    setCurrentStep('stamp-options')
    
    // Actualizar selecciones
    setSelections(prev => {
      const filtered = prev.filter(s => s.type !== 'garment')
      return [...filtered, {
        type: 'garment',
        value: garment,
        label: GARMENT_NAMES[garment as keyof typeof GARMENT_NAMES],
        image: getGarmentImage(garment, selectedColor)
      }]
    })
  }

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    setSelections(prev => {
      const filtered = prev.filter(s => s.type !== 'color')
      const updated = [...filtered, {
        type: 'color',
        value: color,
        label: color === "black" ? "Negro" : color === "white" ? "Blanco" : color === "caramel" ? "Caramelo" : color === "gray" ? "Gris" : "Crema"
      }]
      
      // Actualizar también la imagen de la prenda
      const garmentIndex = updated.findIndex(s => s.type === 'garment')
      if (garmentIndex !== -1) {
        updated[garmentIndex] = {
          ...updated[garmentIndex],
          image: getGarmentImage(selectedGarment, color)
        }
      }
      
      return updated
    })
  }

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
    setSelections(prev => {
      const filtered = prev.filter(s => s.type !== 'size')
      return [...filtered, {
        type: 'size',
        value: size,
        label: `Talle ${size}`
      }]
    })
  }

  const handleStampSizeSelect = (size: 'R1' | 'R2', position?: 'center' | 'left') => {
    setStampSize(size)
    setStampPosition(position || null)
    setCurrentStep('generate')
    
    setSelections(prev => {
      const filtered = prev.filter(s => s.type !== 'stamp')
      return [...filtered, {
        type: 'stamp',
        value: `${size}${position || ''}`,
        label: `${size} ${position ? (position === 'center' ? 'Centro' : 'Izquierda') : ''}`
      }]
    })
  }

  const handleSelectionClick = (selection: { type: string; value: string }) => {
    switch (selection.type) {
      case 'garment':
        setCurrentStep('stamp-options')
        break
      case 'color':
      case 'size':
        setCurrentStep('stamp-options')
        break
      case 'stamp':
        setCurrentStep('generate')
        break
    }
  }

  const handleBackToGarment = () => {
    setCurrentStep('garment')
    setStampSize(null)
    setStampPosition(null)
    setSelections(prev => prev.filter(s => s.type === 'garment'))
  }

  const handleBackToStampOptions = () => {
    setCurrentStep('stamp-options')
    setSelections(prev => prev.filter(s => s.type !== 'stamp'))
  }

  const getGarmentImage = () => {
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
    // Siempre mostrar el diseño original en el área de estampado
    return activeTab === "front" ? frontDesign : backDesign
  }


  const basePrice = GARMENT_PRICES[selectedGarment as keyof typeof GARMENT_PRICES] || 0
  const hasDoubleStamping = isDoubleStamping && (stampingMode === 'both' || (frontDesign && backDesign))
  const finalPrice = basePrice + (hasDoubleStamping ? DOUBLE_STAMPING_EXTRA : 0)

  const generateStamp = async () => {
    if (!frontDesign) {
      toast({
        title: "Error",
        description: "No hay diseño seleccionado",
        variant: "destructive",
      })
      return null
    }

    // Validar según el modo de estampado
    if (stampingMode === 'front' && !frontStampSize) {
      toast({
        title: "Error",
        description: "Selecciona un tamaño de estampado frontal",
        variant: "destructive",
      })
      return null
    }

    if (stampingMode === 'back' && !backStampSize) {
      toast({
        title: "Error",
        description: "Selecciona un tamaño de estampado trasero",
        variant: "destructive",
      })
      return null
    }

    if (stampingMode === 'both' && (!frontStampSize || !backStampSize)) {
      toast({
        title: "Error",
        description: "Selecciona tamaños de estampado para ambos lados",
        variant: "destructive",
      })
      return null
    }

    setIsGeneratingStamp(true)

    try {
      // Limpiar estampado anterior antes de generar uno nuevo
      setStampedImageUrl(null)

      // Generar estampado frontal si es necesario
      if (stampingMode === 'front' || stampingMode === 'both') {
        const frontResponse = await fetch('/api/generate-stamp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            designImageUrl: frontDesign,
            garmentType: selectedGarment === 'astra-oversize-hoodie' ? 'hoodie' : 'tshirt',
            garmentVariant: selectedGarment.includes('oversize') ? 'oversize' : 'classic',
            garmentColor: selectedColor,
            side: "front",
            stampSize: frontStampSize,
            stampPosition: frontStampPosition,
            prompt: 'estampado frontal personalizado'
          }),
        })

        if (!frontResponse.ok) {
          throw new Error('Error generando estampado frontal')
        }

        const frontData = await frontResponse.json()
        console.log('Estampado frontal generado:', frontData)
        setStampedImageUrl(frontData.publicUrl)
      }

      // Generar estampado trasero si es necesario
      if (stampingMode === 'back' || stampingMode === 'both') {
        const backResponse = await fetch('/api/generate-stamp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            designImageUrl: frontDesign, // Usar el mismo diseño por ahora
            garmentType: selectedGarment === 'astra-oversize-hoodie' ? 'hoodie' : 'tshirt',
            garmentVariant: selectedGarment.includes('oversize') ? 'oversize' : 'classic',
            garmentColor: selectedColor,
            side: "back",
            stampSize: backStampSize,
            stampPosition: backStampPosition,
            prompt: 'estampado trasero personalizado'
          }),
        })

        if (!backResponse.ok) {
          throw new Error('Error generando estampado trasero')
        }

        const backData = await backResponse.json()
        console.log('Estampado trasero generado:', backData)
        // Aquí podrías manejar el estampado trasero por separado si es necesario
      }
      
      toast({
        title: "¡Estampado generado!",
        description: `Tu diseño ha sido estampado en la prenda${stampingMode === 'both' ? ' (ambos lados)' : ''}`,
      })

      return stampedImageUrl
    } catch (error) {
      console.error("Error generating stamp:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el estampado",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsGeneratingStamp(false)
    }
  }

  const generateMockup = async () => {
    if (!frontDesign) return null

    try {
      const response = await fetch('/api/generate-mockup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designImageUrl: frontDesign,
          garmentType: selectedGarment,
          garmentColor: selectedColor,
          side: "front",
          size: selectedSize,
          prompt: 'diseño personalizado'
        }),
      })

      if (!response.ok) {
        throw new Error('Error generando mockup')
      }

      const data = await response.json()
      console.log('Mockup generado:', data)
      return data.publicUrl
    } catch (error) {
      console.error("Error generating mockup:", error)
      throw error
    }
  }

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
      // Generar mockup antes de agregar al carrito
      const mockupUrl = await generateMockup()
      
      const cartItem = {
        id: `${selectedGarment}-${selectedColor}-${selectedSize}-${Date.now()}`,
        name: GARMENT_NAMES[selectedGarment as keyof typeof GARMENT_NAMES],
        garmentType: selectedGarment,
        color: selectedColor,
        size: selectedSize,
        price: finalPrice,
        quantity: 1,
        imageUrl: frontDesign,
        mockupUrl: mockupUrl, // URL del mockup generado
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Barra de selecciones acumuladas */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Tus Selecciones</h3>
              <div className="space-y-2">
                {selections.map((selection, index) => (
                  <div
                    key={`${selection.type}-${index}`}
                    className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSelectionClick(selection)}
                  >
                    {selection.image && (
                      <img
                        src={selection.image}
                        alt={selection.label}
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{selection.label}</p>
                    </div>
                  </div>
                ))}
                {selections.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Selecciona una prenda para comenzar
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Caja 1: Imagen fija que van a imprimir */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Tu Diseño</h3>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Esta es la imagen que se estampará en tu prenda
                </p>
                {getCurrentDesign() ? (
                  <div className="relative aspect-square max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={getCurrentDesign() || "/placeholder.svg"}
                      alt="Diseño a estampar"
                      className="w-full h-full object-contain"
                      onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                    />
                  </div>
                ) : (
                  <div className="aspect-square max-w-md mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">No hay diseño seleccionado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Caja 2: Opciones dinámicas */}
        <div className="space-y-6">
          <div className="transition-all duration-300 ease-in-out">
          {/* Paso 1: Selección de prenda */}
          {currentStep === 'garment' && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Elegí tu prenda</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(GARMENT_NAMES).map(([key, name]) => (
                    <button
                      key={key}
                      onClick={() => handleGarmentSelect(key)}
                      className="group p-4 rounded-lg border-2 text-left transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:scale-105"
                    >
                      <div className="space-y-3">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={GARMENT_DEFAULT_IMAGES[key as keyof typeof GARMENT_DEFAULT_IMAGES]}
                            alt={name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                          />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">{name}</h4>
                          <p className="text-xs font-bold text-primary">
                            {formatCurrency(GARMENT_PRICES[key as keyof typeof GARMENT_PRICES])}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paso 2: Opciones de estampado */}
          {currentStep === 'stamp-options' && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Opciones de Estampado</h3>
                    <Button variant="outline" size="sm" onClick={handleBackToGarment}>
                      ← Cambiar prenda
                    </Button>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Prenda seleccionada:</h4>
                    <p className="text-sm text-muted-foreground">
                      {GARMENT_NAMES[selectedGarment as keyof typeof GARMENT_NAMES]} - {formatCurrency(GARMENT_PRICES[selectedGarment as keyof typeof GARMENT_PRICES])}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Opciones de estampado */}
                    <div>
                      <h4 className="font-medium mb-3">Tipo de Estampado</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="double-stamping"
                            checked={isDoubleStamping}
                            onCheckedChange={setIsDoubleStamping}
                          />
                          <Label htmlFor="double-stamping" className="text-sm">
                            Doble estampado (+{formatCurrency(DOUBLE_STAMPING_EXTRA)})
                          </Label>
                        </div>
                        
                        {isDoubleStamping && (
                          <div className="ml-6 space-y-2">
                            <div className="flex space-x-4">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name="stamping-mode"
                                  value="front"
                                  checked={stampingMode === 'front'}
                                  onChange={(e) => setStampingMode(e.target.value as 'front' | 'back' | 'both')}
                                  className="text-primary"
                                />
                                <span className="text-sm">Solo frontal</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name="stamping-mode"
                                  value="back"
                                  checked={stampingMode === 'back'}
                                  onChange={(e) => setStampingMode(e.target.value as 'front' | 'back' | 'both')}
                                  className="text-primary"
                                />
                                <span className="text-sm">Solo trasero</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name="stamping-mode"
                                  value="both"
                                  checked={stampingMode === 'both'}
                                  onChange={(e) => setStampingMode(e.target.value as 'front' | 'back' | 'both')}
                                  className="text-primary"
                                />
                                <span className="text-sm">Ambos lados</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Color</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {COLORS_BY_GARMENT[selectedGarment]?.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorSelect(color)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 capitalize hover:scale-105 ${
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
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Talle</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {["S", "M", "L", "XL"].map((size) => (
                          <button
                            key={size}
                            onClick={() => handleSizeSelect(size)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                              selectedSize === size
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted hover:border-muted-foreground"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selección de tamaño de estampado según el modo */}
              {(stampingMode === 'front' || stampingMode === 'both') && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Tamaño del Estampado Frontal</h3>
                    <StampSizeSelector
                      garmentType={selectedGarment === 'astra-oversize-hoodie' ? 'hoodie' : 'tshirt'}
                      garmentVariant={selectedGarment.includes('oversize') ? 'oversize' : 'classic'}
                      garmentColor={selectedColor as 'black' | 'gray' | 'caramel' | 'white' | 'cream' | 'model'}
                      side="front"
                      onSizeSelect={(size, position) => {
                        setFrontStampSize(size)
                        setFrontStampPosition(position || null)
                        setStampSize(size)
                        setStampPosition(position || null)
                      }}
                      selectedSize={frontStampSize}
                      selectedPosition={frontStampPosition}
                    />
                  </CardContent>
                </Card>
              )}

              {(stampingMode === 'back' || stampingMode === 'both') && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Tamaño del Estampado Trasero</h3>
                    <StampSizeSelector
                      garmentType={selectedGarment === 'astra-oversize-hoodie' ? 'hoodie' : 'tshirt'}
                      garmentVariant={selectedGarment.includes('oversize') ? 'oversize' : 'classic'}
                      garmentColor={selectedColor as 'black' | 'gray' | 'caramel' | 'white' | 'cream' | 'model'}
                      side="back"
                      onSizeSelect={(size, position) => {
                        setBackStampSize(size)
                        setBackStampPosition(position || null)
                      }}
                      selectedSize={backStampSize}
                      selectedPosition={backStampPosition}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Botón para continuar */}
              <Card>
                <CardContent className="p-6">
                  <Button 
                    onClick={() => setCurrentStep('generate')}
                    className="w-full"
                    size="lg"
                    disabled={
                      (stampingMode === 'front' && !frontStampSize) ||
                      (stampingMode === 'back' && !backStampSize) ||
                      (stampingMode === 'both' && (!frontStampSize || !backStampSize))
                    }
                  >
                    Continuar a Generación
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Paso 3: Generación */}
          {currentStep === 'generate' && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Generar Estampado</h3>
                    <Button variant="outline" size="sm" onClick={handleBackToStampOptions}>
                      ← Cambiar opciones
                    </Button>
                  </div>

                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Resumen de tu selección:</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Prenda:</strong> {GARMENT_NAMES[selectedGarment as keyof typeof GARMENT_NAMES]}</p>
                      <p><strong>Color:</strong> {selectedColor === "black" ? "Negro" : selectedColor === "white" ? "Blanco" : selectedColor === "caramel" ? "Caramelo" : selectedColor === "gray" ? "Gris" : "Crema"}</p>
                      <p><strong>Talle:</strong> {selectedSize}</p>
                      <p><strong>Estampado:</strong> {stampSize} {stampPosition && `- ${stampPosition === 'center' ? 'Centro' : 'Izquierda'}`}</p>
                    </div>
                  </div>

                  <Button 
                    onClick={generateStamp}
                    disabled={isGeneratingStamp}
                    className="w-full"
                    size="lg"
                  >
                    {isGeneratingStamp ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Generando estampado...
                      </>
                    ) : (
                      "🎨 Generar Estampado con IA"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Resultado del estampado generado */}
              {stampedImageUrl && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">¡Tu prenda está lista!</h3>
                    <div className="text-center">
                      <img 
                        src={stampedImageUrl} 
                        alt="Estampado generado" 
                        className="w-full max-w-md mx-auto rounded-lg shadow-lg border-2 border-green-200"
                      />
                      <p className="text-sm text-green-700 mt-4">
                        ✅ Estampado generado exitosamente
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resumen de precio y agregar al carrito */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Resumen de Precio</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Precio base</span>
                      <span className="font-bold">{formatCurrency(basePrice)}</span>
                    </div>
                    {hasDoubleStamping && (
                      <div className="flex justify-between">
                        <span>Doble estampado</span>
                        <span className="font-bold text-primary">+{formatCurrency(DOUBLE_STAMPING_EXTRA)}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-xl font-bold text-green-600">{formatCurrency(finalPrice)}</span>
                    </div>
                  </div>
                  <Button onClick={addToCart} disabled={isAddingToCart || !stampedImageUrl} className="w-full" size="lg">
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
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
