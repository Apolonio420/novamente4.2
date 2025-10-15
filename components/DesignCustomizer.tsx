"use client"

import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useCart } from "@/lib/cartStore"
import { useToast } from "@/hooks/use-toast"
import { serverLog } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { Loader, ShoppingCart, Plus, Check, ArrowLeft, ZoomIn, ZoomOut, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getGarmentMapping } from "@/lib/garment-mappings"
import { saveImageWithoutBackground } from "@/lib/db"
import { StampSizeSelector } from "./StampSizeSelector"
import { ImageGenerator } from "./ImageGenerator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"

interface DesignCustomizerProps {
  initialImageUrl: string
  imageId?: string
  onImageSelect?: (imageUrl: string, imageId?: string) => void
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

export const DesignCustomizer = forwardRef<any, DesignCustomizerProps>(({ initialImageUrl, imageId, onImageSelect }, ref) => {
  const { addItem } = useCart()
  const { toast } = useToast()
  const router = useRouter()

  const [selectedGarment, setSelectedGarment] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState("black")
  const [selectedSize, setSelectedSize] = useState("M")
  const [showOnModel, setShowOnModel] = useState(false)
  const [activeTab, setActiveTab] = useState("front")
  const [frontDesign, setFrontDesign] = useState<string | null>(null)
  const [backDesign, setBackDesign] = useState<string | null>(null)
  const [completedSteps, setCompletedSteps] = useState<{ 'step1': boolean; 'step2': boolean; 'step3': boolean; 'step3.5': boolean; 'step4': boolean; 'step5': boolean }>({
    'step1': false,
    'step2': false,
    'step3': false,
    'step3.5': false,
    'step4': false,
    'step5': false,
  })

  // Debug: Monitorear cambios en backDesign
  useEffect(() => {
    console.log('🔍 DEBUG: backDesign state updated to:', backDesign)
  }, [backDesign])

  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  // Estados para doble estampado
  const [isDoubleStamping, setIsDoubleStamping] = useState(false)
  const [stampingMode, setStampingMode] = useState<'front' | 'back' | 'both'>('front')
  const [frontStampSize, setFrontStampSize] = useState<'R1' | 'R2' | 'R3' | null>(null)
  const [backStampSize, setBackStampSize] = useState<'R1' | 'R2' | 'R3' | null>(null)
  const [frontStampPosition, setFrontStampPosition] = useState<'center' | 'left' | null>(null)
  const [backStampPosition, setBackStampPosition] = useState<'center' | 'left' | null>(null)
  
  // Paso 3.5 se considera completado cuando hay backDesign en doble estampado
  useEffect(() => {
    if (isDoubleStamping && backDesign) {
      setCompletedSteps((prev) => ({ ...prev, ['step3.5']: true }))
    }
  }, [isDoubleStamping, backDesign])

  // Estados para el flujo simplificado
  const [selectedSide, setSelectedSide] = useState<'front' | 'back' | null>(null)
  const [showDoubleStampingQuestion, setShowDoubleStampingQuestion] = useState(false)
  const [wantsDoubleStamping, setWantsDoubleStamping] = useState(false)
  const [showImageGenerator, setShowImageGenerator] = useState(false)

  // Estado para confirmar el primer estampado y forzar el segundo lado
  const [firstStampConfirmed, setFirstStampConfirmed] = useState(false)
  const [firstStampSide, setFirstStampSide] = useState<'front' | 'back' | null>(null)
  const [firstStampDetails, setFirstStampDetails] = useState<{ size: 'R1' | 'R2' | 'R3', position?: 'center' | 'left' } | null>(null)
  
  // Estados para mockups finales
  const [showFinalMockups, setShowFinalMockups] = useState(false)
  const [generatedMockups, setGeneratedMockups] = useState<{ front?: string, back?: string }>({})
  const [isGeneratingMockups, setIsGeneratingMockups] = useState(false)
  
  // Estados para modal de zoom
  const [showZoomModal, setShowZoomModal] = useState(false)
  const [zoomImageUrl, setZoomImageUrl] = useState<string>('')
  const [showMockup, setShowMockup] = useState(false)
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false)
  const [mockupImages, setMockupImages] = useState<{front?: string, back?: string}>({})
  const [currentViewIndex, setCurrentViewIndex] = useState(0) // 0: diseño original, 1: mockup frontal, 2: mockup trasero
  const [zoomImageAlt, setZoomImageAlt] = useState<string>('')

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
  const [currentStep, setCurrentStep] = useState<'step1' | 'step2' | 'step3' | 'step3.5' | 'step4' | 'step5'>('step1')
  const [editingStep, setEditingStep] = useState<string | null>(null) // Qué paso específico estás editando

  // Función para determinar si mostrar las opciones de prenda (panel derecho)
  const shouldShowGarmentOptions = () => {
    // Mostrar si no hay prenda seleccionada
    if (!selectedGarment) return true
    
    // Solo visible en Paso 1 y Paso 2
    return currentStep === 'step1' || currentStep === 'step2'
  }

  // Función para determinar qué sección mostrar en el panel derecho
  const getCurrentSection = () => {
    if (currentStep === 'step1') return 'garment-selection'
    if (currentStep === 'step2') return 'stamp-options'
    return 'garment-selection'
  }

  // Debug: Log para shouldShowGarmentOptions
  const showGarmentOptions = shouldShowGarmentOptions()
  const currentSection = getCurrentSection()
  console.log('🔍 DEBUG shouldShowGarmentOptions:', {
    selectedGarment,
    currentStep,
    currentSection,
    editingStep,
    showGarmentOptions,
    selectedSide,
    firstStampConfirmed,
    wantsDoubleStamping
  })
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)

  // Debug: Monitorear cambios en currentStep
  useEffect(() => {
    console.log('🔍 DEBUG: currentStep changed to:', currentStep)
  }, [currentStep])
  
  // Eliminado: estado de selecciones visuales; se reemplaza por flujo por pasos

  const mapping = useMemo(() => {
    if (!selectedGarment) return null
    const side = activeTab === "back" ? "back" : "front"
    const result = getGarmentMapping(selectedGarment, selectedColor, side)
    // Mapping result processed
    return result
  }, [selectedGarment, selectedColor, activeTab])

  const framePct = useMemo(() => {
    if (!mapping || !nat) {
      // No mapping or nat available
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

  // Navegación entre pasos restaurando el último estado conocido
  const navigateToStep = (step: 'step1' | 'step2' | 'step3' | 'step3.5' | 'step4' | 'step5') => {
    serverLog('navigateToStep', {
      from: currentStep,
      to: step,
      snapshot: {
        selectedGarment,
        selectedColor,
        selectedSize,
        frontDesign: Boolean(frontDesign),
        backDesign: Boolean(backDesign),
        frontStampSize,
        backStampSize,
        isDoubleStamping,
        completedSteps,
      }
    })
    setCurrentStep(step)
    switch (step) {
      case 'step1':
        // Sólo mostrar selección de prenda
        setShowDoubleStampingQuestion(false)
        setShowFinalMockups(false)
        break
      case 'step2':
        // Mostrar panel de opciones; no tocar selecciones
        setShowDoubleStampingQuestion(false)
        setShowFinalMockups(false)
        // Permitir re-editar el primer estampado al volver
        setFirstStampConfirmed(false)
        // Restaurar vista y sub-sección de Step 2
        if (firstStampSide) {
          setSelectedSide(firstStampSide)
          handleTabChange(firstStampSide)
        } else {
          setSelectedSide('front')
          handleTabChange('front')
        }
        setEditingStep('stamp')
        setHighlightedSection('stamp-size-selection')
        setTimeout(() => {
          const section = document.querySelector('[data-section="stamp-size-selection"]')
          if (section) (section as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 50)
        serverLog('restoreStep2', {
          firstStampSide,
          selectedSide,
          frontStampSize,
          frontStampPosition,
        })
        break
      case 'step3':
        // Mostrar pregunta de doble estampado
        setShowDoubleStampingQuestion(true)
        break
      case 'step3.5':
        // Reforzar contexto de doble estampado
        setWantsDoubleStamping(true)
        setIsDoubleStamping(true)
        setStampingMode('both')
        setShowDoubleStampingQuestion(false)
        // Forzar lado opuesto y pestaña correcta, y mostrar vista original para placeholder
        if (firstStampSide) {
          const targetSide = firstStampSide === 'front' ? 'back' : 'front'
          console.log('🔍 DEBUG step3.5 navigation:', {
            firstStampSide,
            targetSide,
            currentActiveTab: activeTab,
            currentBackDesign: backDesign
          })
          setSelectedSide(targetSide)
          handleTabChange(targetSide)
          setCurrentViewIndex(0)
          // Forzar que se muestre el placeholder
          setBackDesign(null)
        }
        break
      case 'step4':
        // Mostrar mockups finales si ya están
        setShowFinalMockups(true)
        break
      case 'step5':
        // Checkout (sin acción automática)
        break
      default:
        break
    }
  }

  type StepId = 'step1' | 'step2' | 'step3' | 'step3.5' | 'step4' | 'step5'
  const isStepEnabled = (step: StepId) => step === currentStep || completedSteps[step]
  const stepClasses = (step: StepId) =>
    `${currentStep === step ? 'text-white font-semibold' : completedSteps[step] ? 'text-gray-300' : 'text-gray-500/60'} ` +
    `${isStepEnabled(step) ? 'cursor-pointer hover:text-white' : 'cursor-not-allowed'}`


  useEffect(() => {
    if (initialImageUrl) {
      // Para imágenes procesadas (con fondo removido), usar directamente la URL
      // Para imágenes de DALL-E, usar el proxy
      const processedUrl = initialImageUrl.includes("oaidalleapiprodscus.blob.core.windows.net")
        ? `/api/proxy-image?url=${encodeURIComponent(initialImageUrl)}`
        : initialImageUrl

      setFrontDesign(processedUrl)
      setOriginalImageUrl(processedUrl)
      // Setting initial design

      toast({
        title: "Imagen cargada",
        description: "La imagen procesada se ha aplicado automáticamente a la prenda",
      })
    }
  }, [initialImageUrl, toast])

  // Resetear posición cuando cambia el mapeo de la prenda
  useEffect(() => {
    if (mapping) {
      // New garment mapping loaded
    }
  }, [mapping])

  // Update available colors when garment changes
  useEffect(() => {
    if (!selectedGarment) return
    const availableColors = COLORS_BY_GARMENT[selectedGarment] || []
    if (!availableColors.includes(selectedColor)) {
      setSelectedColor(availableColors[0] || "black")
    }
  }, [selectedGarment, selectedColor])

  // Funciones para manejar el flujo dinámico
  const handleGarmentSelect = (garment: string) => {
    setSelectedGarment(garment)
    setCurrentStep('step2')
  }

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
  }

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
  }

  const handleStampSizeSelect = (size: 'R1' | 'R2' | 'R3', position?: 'center' | 'left') => {
    if (!firstStampConfirmed) {
      // Primer estampado - configurar lado seleccionado
      if (selectedSide === 'front') {
        setFrontStampSize(size)
        setFrontStampPosition(position || null)
      } else if (selectedSide === 'back') {
        setBackStampSize(size)
        setBackStampPosition(position || null)
      }
      // Guardar detalles para confirmación
      setFirstStampDetails({ size, position })
    } else {
      // Segundo estampado - forzar lado opuesto
      const targetSide = firstStampSide === 'front' ? 'back' : 'front'
      if (targetSide === 'front') {
        setFrontStampSize(size)
        setFrontStampPosition(position || null)
      } else {
        setBackStampSize(size)
        setBackStampPosition(position || null)
      }
    }
  }

  const handleSelectionClick = (selection: { type: string; value: string; label: string }) => {
    console.log('🔍 DEBUG handleSelectionClick:', selection)
    console.log('🔍 DEBUG currentStep antes:', currentStep)
    
    // Siempre volver al paso 2 (configuración completa) cuando se edita cualquier selección
    setCurrentStep('step2')
    setEditingStep(selection.type)
    
    console.log('✅ Cambiando a paso: step2 (configuración completa)')
    
    // Asegurar que el lado correcto esté seleccionado para estampados
    if (selection.type === 'stamp') {
      if (selection.label.includes('Frontal')) {
        setSelectedSide('front')
        setHighlightedSection('stamp-size-selection')
      } else if (selection.label.includes('Trasero')) {
        setSelectedSide('back')
        setHighlightedSection('stamp-size-selection')
      }
    } else {
      // Para otros tipos de selección, highlight la sección correspondiente
      if (selection.type === 'color') {
        setHighlightedSection('color-selection')
      } else if (selection.type === 'size') {
        setHighlightedSection('size-selection')
      } else {
        setHighlightedSection('stamp-options')
      }
    }
    
    // Hacer scroll hacia la sección correspondiente
    setTimeout(() => {
      let targetSection = 'stamp-options'
      
      if (selection.type === 'stamp') {
        targetSection = 'stamp-size-selection'
      } else if (selection.type === 'color') {
        targetSection = 'color-selection'
      } else if (selection.type === 'size') {
        targetSection = 'size-selection'
      }
      
      const section = document.querySelector(`[data-section="${targetSection}"]`)
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' })
        console.log(`✅ Haciendo scroll hacia ${targetSection}`)
      } else {
        console.log(`❌ No se encontró la sección ${targetSection}`)
      }
    }, 100)
    
    // Quitar el highlight después de 3 segundos
    setTimeout(() => {
      setHighlightedSection(null)
      setEditingStep(null)
    }, 3000)
    
    toast({
      title: `Modificar ${selection.type}`,
      description: `Puedes cambiar la configuración de ${selection.label}`,
    })
  }

  const handleBackToGarment = () => {
    setCurrentStep('step1')
    setStampSize(null)
    setStampPosition(null)
  }

  const handleBackToStampOptions = () => {
    setCurrentStep('step2')
  }

  const getCurrentGarmentImage = (side?: 'front' | 'back') => {
    if (!selectedGarment) return "/placeholder.svg"
    const targetSide = side || (activeTab === "back" ? "back" : "front")
    return getGarmentMapping(selectedGarment, selectedColor, targetSide)?.garmentPath ?? "/placeholder.svg"
  }

  const addBackDesign = () => {
    if (frontDesign) {
      setBackDesign(frontDesign)
      setActiveTab("back")
      setIsDoubleStamping(true) // Activar doble estampado
      setStampingMode('both')
      toast({
        title: "Diseño trasero agregado",
        description: `Se agregó el estampado trasero (+${formatCurrency(DOUBLE_STAMPING_EXTRA)})`,
      })
    }
  }

  const removeBackDesign = () => {
    setBackDesign(null)
    setActiveTab("front")
    setIsDoubleStamping(false) // Desactivar doble estampado
    setStampingMode('front')
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
    // Siempre mostrar la imagen inicial, independientemente del tab activo
    return initialImageUrl
  }


  const basePrice = selectedGarment ? (GARMENT_PRICES[selectedGarment as keyof typeof GARMENT_PRICES] || 0) : 0
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
            garmentType: selectedGarment && selectedGarment === 'astra-oversize-hoodie' ? 'hoodie' : 'tshirt',
            garmentVariant: selectedGarment && selectedGarment.includes('oversize') ? 'oversize' : 'classic',
          garmentColor: selectedColor,
          side: "front",
            stampSize: frontStampSize,
            stampPosition: frontStampPosition,
            prompt: 'estampado frontal personalizado',
            originalImageId: imageId,
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
            garmentType: selectedGarment && selectedGarment === 'astra-oversize-hoodie' ? 'hoodie' : 'tshirt',
            garmentVariant: selectedGarment && selectedGarment.includes('oversize') ? 'oversize' : 'classic',
            garmentColor: selectedColor,
            side: "back",
            stampSize: backStampSize,
            stampPosition: backStampPosition,
            prompt: 'estampado trasero personalizado',
            originalImageId: imageId,
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


  const generateMockupForCart = async () => {
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
      const mockupUrl = await generateMockupForCart()
      
      const cartItem = {
        id: `${selectedGarment}-${selectedColor}-${selectedSize}-${Date.now()}`,
        name: GARMENT_NAMES[selectedGarment as keyof typeof GARMENT_NAMES],
        garmentType: selectedGarment || undefined,
        color: selectedColor,
        size: selectedSize,
        price: finalPrice,
        quantity: 1,
        image: frontDesign, // Cambiado de imageUrl a image
        frontDesign: frontDesign || undefined,
        backDesign: backDesign || undefined,
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

  const handleImageGenerated = (imageUrl: string) => {
    if (firstStampConfirmed && wantsDoubleStamping) {
      // Segundo estampado - asignar al lado opuesto
      const targetSide = firstStampSide === 'front' ? 'back' : 'front'
      if (targetSide === 'front') {
        setFrontDesign(imageUrl)
      } else {
        setBackDesign(imageUrl)
      }
      setShowImageGenerator(false)
      toast({
        title: "Imagen agregada",
        description: `Se agregó la nueva imagen para el estampado ${targetSide === 'front' ? 'frontal' : 'trasero'}`,
      })
    } else {
      // Primer estampado o imagen inicial
      setFrontDesign(imageUrl)
      setOriginalImageUrl(imageUrl)
      toast({
        title: "Imagen generada",
        description: "Se generó una nueva imagen para estampar",
      })
    }
  }

  // Función para manejar el cambio de tab
  const handleTabChange = (newTab: 'front' | 'back') => {
    console.log('🔍 DEBUG handleTabChange:', {
      newTab,
      currentActiveTab: activeTab,
      isDoubleStamping,
      backDesign,
      currentViewIndex
    })
    
    setActiveTab(newTab)
    
    // Si cambiamos al tab back en modo doble estampado y no hay backDesign, resetear la vista
    if (isDoubleStamping && newTab === 'back' && !backDesign) {
      console.log('✅ Reseteando currentViewIndex a 0 para mostrar placeholder')
      setCurrentViewIndex(0) // Volver a la vista original (placeholder)
    }
  }

  // Función para manejar la selección de imágenes del historial
  const handleHistoryImageSelect = (imageUrl: string, selectedId?: string) => {
    console.log('🔍 DEBUG handleHistoryImageSelect:', {
      imageUrl,
      selectedId,
      isDoubleStamping,
      activeTab,
      backDesign,
      condition1: isDoubleStamping && activeTab === 'back' && !backDesign
    })
    
    if (isDoubleStamping && activeTab === 'back' && !backDesign) {
      // Si estamos en modo doble estampado, en el tab back, y no hay backDesign, asignar al segundo estampado
      console.log('✅ Asignando imagen al segundo estampado (backDesign)')
      setBackDesign(imageUrl)
      toast({
        title: "Imagen seleccionada",
        description: "Se ha seleccionado la imagen para el segundo estampado",
      })
    } else if (onImageSelect) {
      // Si hay callback del componente padre, usarlo
      console.log('✅ Usando callback del componente padre')
      onImageSelect(imageUrl, selectedId)
    } else {
      // Comportamiento por defecto
      console.log('✅ Comportamiento por defecto - asignando a frontDesign')
      setFrontDesign(imageUrl)
      setOriginalImageUrl(imageUrl)
      toast({
        title: "Imagen seleccionada",
        description: "Se ha cargado la imagen del historial",
      })
    }
  }

  // Exponer funciones al componente padre
  useImperativeHandle(ref, () => ({
    handleHistoryImageSelect: handleHistoryImageSelect
  }), [handleHistoryImageSelect])

  const handleConfirmFirstStamp = () => {
    if (!selectedSide || !firstStampDetails) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un lado y tamaño para el primer estampado.",
        variant: "destructive",
      })
      return
    }

    setFirstStampConfirmed(true)
    setFirstStampSide(selectedSide)

    // Avanzar a Paso 3: decisión de doble estampado
    setCurrentStep('step3')
    setCompletedSteps((prev) => ({ ...prev, step1: true, step2: true }))
    serverLog('stepCompleted', { step: 'step2', state: {
      selectedGarment,
      selectedColor,
      selectedSize,
      frontStampSize,
      frontStampPosition,
    } })

    // Mostrar pregunta de doble estampado
    setShowDoubleStampingQuestion(true)
    setSelectedSide(null) // Limpiar selección de lado
  }

  const handleDoubleStampingChoice = (wantsDouble: boolean) => {
    console.log('🎯 handleDoubleStampingChoice:', { wantsDouble, firstStampSide })
    setWantsDoubleStamping(wantsDouble)
    setShowDoubleStampingQuestion(false)
    
    if (wantsDouble) {
      // Configurar segundo estampado en lado opuesto
      const targetSide = firstStampSide === 'front' ? 'back' : 'front'
      console.log('🎯 Configurando doble estampado:', { targetSide })
      setSelectedSide(targetSide)
      handleTabChange(targetSide)
      setStampingMode('both')
      setIsDoubleStamping(true) // ¡ACTIVAR EL ESTADO DE DOBLE ESTAMPADO!
      console.log('✅ Estados actualizados para doble estampado')
      // Paso 3.5: configuración del segundo estampado
      setCurrentStep('step3.5')
      setCompletedSteps((prev) => ({ ...prev, step3: true }))
      serverLog('stepCompleted', { step: 'step3', wantsDouble })
    } else {
      // Continuar sin doble estampado → Paso 4
      setStampingMode('front')
      setCurrentStep('step4')
      setCompletedSteps((prev) => ({ ...prev, step3: true, ['step3.5']: true }))
      serverLog('stepCompleted', { step: 'step3', wantsDouble })
    }
  }

  const handleContinueToPurchase = async () => {
    // Verificar si ya existen mockups suficientes
    const alreadyHaveMockups = Boolean(generatedMockups.front) && (!wantsDoubleStamping || Boolean(generatedMockups.back))
    let finalMockups = generatedMockups

    if (!alreadyHaveMockups) {
      setIsGeneratingMockups(true)
      setShowFinalMockups(true)
      try {
        const mockups = await generateFinalMockups()
        setGeneratedMockups(mockups)
        finalMockups = mockups // Usar los mockups recién generados
      } catch (error) {
        console.error("Error generando mockups:", error)
        toast({
          title: "Error",
          description: "Hubo un problema generando las imágenes finales",
          variant: "destructive",
        })
        setIsGeneratingMockups(false)
        return
      }
      setIsGeneratingMockups(false)
    }

    // Crear el item para compra directa (sin agregar al carrito)
    const mockImage = finalMockups.front || getGarmentImage(selectedGarment as any, selectedColor)
    const directPurchaseItem = {
      id: `${selectedGarment || 'garment'}-${selectedColor}-${selectedSize}-${Date.now()}`,
      name: selectedGarment ? GARMENT_NAMES[selectedGarment as keyof typeof GARMENT_NAMES] : 'Prenda personalizada',
      price: GARMENT_PRICES[selectedGarment as keyof typeof GARMENT_PRICES] + (wantsDoubleStamping ? DOUBLE_STAMPING_EXTRA : 0),
      image: mockImage,
      frontMockup: finalMockups.front,
      backMockup: finalMockups.back,
      quantity: 1,
      color: selectedColor,
      size: selectedSize,
      garmentType: selectedGarment || '',
      frontDesign: frontDesign || undefined,
      backDesign: backDesign || undefined,
    }

    // Limpiar el carrito actual y agregar solo este item
    const { clearCart, addItem } = useCart.getState()
    clearCart()
    addItem(directPurchaseItem)
    
    console.log("🛒 Compra directa - Carrito limpiado y item agregado:", directPurchaseItem)
    
    setCompletedSteps((prev) => ({ ...prev, step4: true }))
    serverLog('stepCompleted', { step: 'step4', mockups: {
      hasFront: Boolean(finalMockups.front),
      hasBack: Boolean(finalMockups.back)
    } })
    
    toast({
      title: "Procediendo al checkout",
      description: "Redirigiendo a la página de pago..."
    })
    
    router.push('/checkout')
  }

  const handleAddToCartOnly = async () => {
    // Verificar si ya existen mockups suficientes
    const alreadyHaveMockups = Boolean(generatedMockups.front) && (!wantsDoubleStamping || Boolean(generatedMockups.back))
    console.log("🛒 DEBUG handleAddToCartOnly:", {
      alreadyHaveMockups,
      hasFront: Boolean(generatedMockups.front),
      hasBack: Boolean(generatedMockups.back),
      wantsDoubleStamping,
      frontDesign: Boolean(frontDesign),
      backDesign: Boolean(backDesign)
    })
    
    // Crear item del carrito inmediatamente (con o sin mockups)
    const mockImage = generatedMockups.front || getGarmentImage(selectedGarment as any, selectedColor)
    const item = {
      id: `${selectedGarment || 'garment'}-${selectedColor}-${selectedSize}-${Date.now()}`,
      name: selectedGarment ? GARMENT_NAMES[selectedGarment as keyof typeof GARMENT_NAMES] : 'Prenda personalizada',
      price: GARMENT_PRICES[selectedGarment as keyof typeof GARMENT_PRICES] + (wantsDoubleStamping ? DOUBLE_STAMPING_EXTRA : 0),
      image: mockImage,
      frontMockup: generatedMockups.front,
      backMockup: generatedMockups.back,
      quantity: 1,
      color: selectedColor,
      size: selectedSize,
      garmentType: selectedGarment || '',
      frontDesign: frontDesign || undefined,
      backDesign: backDesign || undefined,
      isGeneratingMockups: !alreadyHaveMockups,
    }
    
    console.log("🛒 Item agregado al carrito:", {
      frontMockup: item.frontMockup,
      backMockup: item.backMockup,
      image: item.image
    })
    
    // Agregar al carrito inmediatamente
    addItem(item)
    setCompletedSteps((prev) => ({ ...prev, step4: true }))
    
    // Mostrar toast y ir al carrito
    toast({ 
      title: "Agregado al carrito", 
      description: alreadyHaveMockups ? "Tu diseño se agregó correctamente." : "Generando mockups en segundo plano..." 
    })
    router.push('/cart')
    
    // Si no hay mockups, generarlos en segundo plano
    if (!alreadyHaveMockups) {
      console.log("🛒 Generando mockups en segundo plano...")
      try {
        const mockups = await generateFinalMockups()
        console.log("🛒 Mockups generados en segundo plano:", mockups)
        
        // Actualizar el item en el carrito con los mockups generados
        const updatedItem = {
          frontMockup: mockups.front,
          backMockup: mockups.back,
          image: mockups.front || item.image,
          isGeneratingMockups: false
        }
        
        // Actualizar el carrito con los mockups
        const { updateItem } = useCart.getState()
        updateItem(item.id, updatedItem)
        
        console.log("🛒 Carrito actualizado con mockups:", updatedItem)
        
        // Mostrar toast de confirmación
        toast({ 
          title: "Mockups generados", 
          description: "Las imágenes de tu prenda están listas." 
        })
        
      } catch (error) {
        console.error("Error generando mockups en segundo plano:", error)
        toast({ 
          title: "Error", 
          description: "No se pudieron generar las imágenes finales.", 
          variant: "destructive" 
        })
      }
    }
  }

  const generateFinalMockups = async () => {
    const mockups: { front?: string, back?: string } = {}
    
    console.log("🛒 generateFinalMockups - Estado actual:", {
      frontDesign: Boolean(frontDesign),
      frontStampSize,
      backDesign: Boolean(backDesign),
      backStampSize,
      selectedGarment,
      selectedColor
    })
    
    // Generar mockup frontal si existe diseño
    if (frontDesign && frontStampSize) {
      try {
        console.log("🛒 Generando mockup frontal...")
        const frontMockup = await generateStampWithParams(
          frontDesign || '',
          selectedGarment || '',
          selectedColor,
          'front',
          frontStampSize || 'R2',
          frontStampPosition || 'center'
        )
        mockups.front = frontMockup
        console.log("🛒 Mockup frontal generado y asignado:", {
          frontMockup,
          mockupsFront: mockups.front,
          mockupsObject: mockups
        })
      } catch (error) {
        console.error("Error generando mockup frontal:", error)
      }
    }
    
    // Generar mockup trasero si existe diseño
    if (backDesign && backStampSize) {
      try {
        console.log("🛒 Generando mockup trasero...")
        const backMockup = await generateStampWithParams(
          backDesign || '',
          selectedGarment || '',
          selectedColor,
          'back',
          backStampSize || 'R2',
          backStampPosition || 'center'
        )
        mockups.back = backMockup
        console.log("🛒 Mockup trasero generado y asignado:", {
          backMockup,
          mockupsBack: mockups.back,
          mockupsObject: mockups
        })
      } catch (error) {
        console.error("Error generando mockup trasero:", error)
      }
    }
    
    console.log("🛒 Mockups finales:", mockups)
    return mockups
  }

  const openZoomModal = (imageUrl: string, alt: string) => {
    setZoomImageUrl(imageUrl)
    setZoomImageAlt(alt)
    setShowZoomModal(true)
  }

  // Función para navegar entre las vistas
  const navigateView = (direction: 'prev' | 'next') => {
    const views = []
    
    // Siempre incluir el diseño original
    views.push('original')
    
    // Agregar mockups si existen
    if (mockupImages.front) views.push('front')
    if (mockupImages.back) views.push('back')
    
    if (direction === 'next') {
      setCurrentViewIndex((prev) => (prev + 1) % views.length)
    } else {
      setCurrentViewIndex((prev) => (prev - 1 + views.length) % views.length)
    }
  }

  // Función para obtener la imagen actual
  const getCurrentViewImage = () => {
    const views = []
    views.push('original')
    if (mockupImages.front) views.push('front')
    if (mockupImages.back) views.push('back')
    
    // Asegurar que el índice esté dentro del rango válido
    const safeIndex = Math.max(0, Math.min(currentViewIndex, views.length - 1))
    const currentView = views[safeIndex]
    
    // DEBUG: Log para entender qué está pasando
    console.log('🔍 DEBUG getCurrentViewImage:', {
      isDoubleStamping,
      activeTab,
      backDesign,
      currentView,
      currentViewIndex,
      views
    })
    
    // Si estamos en modo doble estampado y en el tab back sin segunda imagen, mostrar placeholder
    if (isDoubleStamping && activeTab === 'back' && !backDesign) {
      console.log('✅ Mostrando placeholder del segundo estampado')
      return 'placeholder-second-stamp'
    }
    
    switch (currentView) {
      case 'original':
        // En modo doble estampado, mostrar la imagen correspondiente al lado activo
        if (isDoubleStamping) {
          if (activeTab === 'front' && frontDesign) {
            return frontDesign
          } else if (activeTab === 'back' && backDesign) {
            return backDesign
          } else if (activeTab === 'back' && !backDesign) {
            console.log('✅ Mostrando placeholder del segundo estampado (case original)')
            return 'placeholder-second-stamp'
          }
        }
        return getCurrentDesign()
      case 'front':
        return mockupImages.front
      case 'back':
        return mockupImages.back
      default:
        return getCurrentDesign()
    }
  }

  // Función para obtener el título de la vista actual
  const getCurrentViewTitle = () => {
    const views = []
    views.push('original')
    if (mockupImages.front) views.push('front')
    if (mockupImages.back) views.push('back')
    
    // Asegurar que el índice esté dentro del rango válido
    const safeIndex = Math.max(0, Math.min(currentViewIndex, views.length - 1))
    const currentView = views[safeIndex]
    
    // Si estamos en modo doble estampado y en el tab back sin segunda imagen, mostrar título de placeholder
    if (isDoubleStamping && activeTab === 'back' && !backDesign) {
      return 'Segundo Estampado'
    }
    
    switch (currentView) {
      case 'original':
        // En modo doble estampado, mostrar título según el lado activo
        if (isDoubleStamping) {
          if (activeTab === 'front') {
            return 'Estampado Frontal'
          } else if (activeTab === 'back' && backDesign) {
            return 'Estampado Trasero'
          } else if (activeTab === 'back' && !backDesign) {
            return 'Segundo Estampado'
          }
        }
        return 'Diseño Original'
      case 'front':
        return 'Mockup Frontal'
      case 'back':
        return 'Mockup Trasero'
      default:
        return 'Diseño Original'
    }
  }

  // Función para generar un mockup usando el endpoint de estampado
  const generateStampWithParams = async (
    designImage: string,
    garmentType: string,
    garmentColor: string,
    side: 'front' | 'back',
    size: string,
    position: string
  ) => {
    try {
      // Mapear garmentType a los valores esperados por la API
      const garmentTypeMap: { [key: string]: { type: string, variant: string } } = {
        'astra-oversize-hoodie': { type: 'hoodie', variant: 'oversize' },
        'astra-oversize-tshirt': { type: 'tshirt', variant: 'oversize' },
        'astra-classic-tshirt': { type: 'tshirt', variant: 'classic' },
        'aura-oversize-tshirt': { type: 'tshirt', variant: 'oversize' },
        'aldea-classic-tshirt': { type: 'tshirt', variant: 'classic' }
      }
      
      const mappedGarment = garmentTypeMap[garmentType] || { type: 'tshirt', variant: 'classic' }
      
      const response = await fetch('/api/generate-stamp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designImageUrl: designImage,
          garmentType: mappedGarment.type,
          garmentVariant: mappedGarment.variant,
          garmentColor: garmentColor,
          side: side,
          stampSize: size,
          stampPosition: position,
          prompt: `Mockup ${side} ${size}`,
          originalImageId: imageId
        }),
      })

      if (!response.ok) {
        throw new Error(`Error generando mockup: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("🛒 generateStampWithParams response:", data)
      
      // El endpoint generate-stamp devuelve publicUrl directamente
      const publicUrl = data.publicUrl
      console.log("🛒 generateStampWithParams returning:", publicUrl)
      return publicUrl
    } catch (error) {
      console.error('Error generando mockup:', error)
      throw error
    }
  }

  const generateMockup = async () => {
    console.log('🚀 Generando mockup...')
    
    if (!getCurrentDesign() || !selectedGarment || !selectedColor || !selectedSize) {
      console.log('❌ Faltan selecciones básicas')
      toast({
        title: "Error",
        description: "Selecciona una prenda, color y talle para generar el mockup",
        variant: "destructive",
      })
      return
    }

    // Validar que se haya seleccionado un tamaño de estampado para el lado activo
    const currentStampSize = activeTab === 'front' ? frontStampSize : backStampSize
    if (!currentStampSize) {
      toast({
        title: "Error",
        description: `Selecciona un tamaño de estampado para el ${activeTab === 'front' ? 'frente' : 'dorso'}`,
        variant: "destructive",
      })
      return
    }

    setIsGeneratingMockup(true)
    setShowMockup(true)

    try {
      // Generar mockup solo para el lado activo
      const mockups: { front?: string, back?: string } = {}
      
      if (activeTab === 'front') {
        // Generar mockup frontal - usar frontDesign si está disponible, sino la imagen inicial
        const designImage = frontDesign || getCurrentDesign()
        const frontMockup = await generateStampWithParams(
          designImage,
          selectedGarment,
          selectedColor,
          'front',
          frontStampSize || 'R2',
          frontStampPosition || 'center'
        )
        mockups.front = frontMockup
      } else {
        // Generar mockup trasero - usar backDesign si está disponible, sino la imagen inicial
        const designImage = backDesign || getCurrentDesign()
        const backMockup = await generateStampWithParams(
          designImage,
          selectedGarment,
          selectedColor,
          'back',
          backStampSize || 'R2',
          backStampPosition || 'center'
        )
        mockups.back = backMockup
      }
      
      setMockupImages(mockups)
      
      // Cambiar automáticamente a la vista del mockup generado
      // Calcular el índice correcto basado en las vistas disponibles
      const views = ['original']
      if (mockups.front) views.push('front')
      if (mockups.back) views.push('back')
      
      let targetIndex = 0
      if (activeTab === 'front' && mockups.front) {
        targetIndex = views.indexOf('front')
      } else if (activeTab === 'back' && mockups.back) {
        targetIndex = views.indexOf('back')
      }
      
      setCurrentViewIndex(targetIndex)

      toast({
        title: "Mockup generado",
        description: `El mockup ${activeTab === 'front' ? 'frontal' : 'trasero'} se ha generado exitosamente`,
      })

    } catch (error) {
      console.error('Error generando mockup:', error)
      toast({
        title: "Error",
        description: "No se pudo generar el mockup",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingMockup(false)
    }
  }

  // Cerrar modal con ESC
  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showZoomModal) {
        setShowZoomModal(false)
      }
    }
    
    if (showZoomModal) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [showZoomModal])

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

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Indicador simple de pasos (reemplaza 'Tus Selecciones') */}
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">Flujo</h3>
              <ol className="text-xs space-y-2">
                {(['step1','step2','step3','step3.5','step4','step5'] as StepId[]).map((step) => {
                  const labelMap: Record<StepId,string> = {
                    'step1': 'Paso 1: Elegir prenda',
                    'step2': 'Paso 2: Configurar color, talle, lado y tamaño',
                    'step3': 'Paso 3: ¿Doble estampado?',
                    'step3.5': 'Paso 3.5: Segundo estampado',
                    'step4': 'Paso 4: Mockups y precio',
                    'step5': 'Paso 5: Checkout',
                  }
                  const enabled = isStepEnabled(step)
                  return (
                    <li
                      key={step}
                      className={stepClasses(step)}
                      role="button"
                      tabIndex={enabled ? 0 : -1}
                      aria-disabled={!enabled}
                      onClick={enabled ? () => navigateToStep(step) : undefined}
                      onKeyDown={enabled ? (e) => ((e.key === 'Enter' || e.key === ' ') && navigateToStep(step)) : undefined}
                    >
                      {labelMap[step]}
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Caja 1: Imagen fija que van a imprimir */}
        <div className="space-y-4 lg:col-span-6">
          <Card>
            <CardContent className="p-6">
              {(!selectedGarment || currentStep === 'step1') && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Elegí tu prenda</h3>
                  <p className="text-sm text-muted-foreground mb-6">Seleccioná una prenda para continuar con la personalización.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(GARMENT_DEFAULT_IMAGES).map((garmentKey) => (
                      <button
                        key={garmentKey}
                        onClick={() => handleGarmentSelect(garmentKey)}
                        className={`border rounded-lg p-3 text-left hover:border-primary transition-colors`}
                      >
                        <img
                          src={GARMENT_DEFAULT_IMAGES[garmentKey as keyof typeof GARMENT_DEFAULT_IMAGES]}
                          alt={GARMENT_NAMES[garmentKey as keyof typeof GARMENT_NAMES]}
                          className="w-full aspect-square object-cover rounded-md mb-3 bg-gray-100"
                          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                        />
                        <div className="text-sm font-medium">
                          {GARMENT_NAMES[garmentKey as keyof typeof GARMENT_NAMES]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(GARMENT_PRICES[garmentKey as keyof typeof GARMENT_PRICES])}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedGarment && currentStep !== 'step1' && (
              <>
              <h3 className="text-lg font-semibold mb-4">Tu Diseño</h3>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Esta es la imagen que se estampará en tu prenda
                </p>
                {getCurrentDesign() ? (
                    <div className="relative aspect-square max-w-2xl mx-auto bg-gray-100 rounded-lg overflow-hidden">
                      {/* Imagen principal o placeholder */}
                      {(() => {
                        // LÓGICA SIMPLIFICADA: Si estamos en doble estampado, tab back, y no hay backDesign, mostrar placeholder
                        const shouldShowPlaceholder = isDoubleStamping && activeTab === 'back' && !backDesign
                        
                        console.log('🔍 DEBUG placeholder logic (render):', {
                          isDoubleStamping,
                          activeTab,
                          backDesign,
                          shouldShowPlaceholder,
                          timestamp: new Date().toISOString()
                        })
                        
                        if (shouldShowPlaceholder) {
                          console.log('🎨 Mostrando placeholder del segundo estampado')
                          return (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                              <div className="text-center p-8">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Segundo Estampado</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                  Genera una nueva imagen o elige una del historial
                                </p>
                                
                                {/* Botones de acción */}
                                <div className="space-y-3">
                                  {/* Botón para ir al generador */}
                                  <Button 
                                    onClick={() => {
                                      console.log('🎯 Botón "Generar Nueva Imagen" clickeado')
                                      // Scroll hacia el generador de imágenes
                                      const generatorSection = document.querySelector('[data-section="image-generator"]')
                                      if (generatorSection) {
                                        generatorSection.scrollIntoView({ behavior: 'smooth' })
                                      }
                                    }}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                  >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Generar Nueva Imagen
                                  </Button>
                                  
                                  {/* Indicador para historial */}
                                  <div className="flex items-center justify-center text-xs text-gray-400">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                    </svg>
                                    O elige del historial arriba
                                  </div>
                                </div>
                                
                                <div className="text-xs text-gray-400 mt-4">
                                  Tu diseño aparecerá aquí
                                </div>
                              </div>
                            </div>
                          )
                        }
                        
                        // Imagen normal
                        const currentImage = getCurrentViewImage()
                        return (
                          <img
                            src={currentImage || "/placeholder.svg"}
                            alt={getCurrentViewTitle()}
                            className="w-full h-full object-contain"
                            onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                          />
                        )
                      })()}
                      
                      {/* Título de la vista actual */}
                      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {getCurrentViewTitle()}
                      </div>
                      
                      {/* Flechas de navegación (solo si hay mockups generados) */}
                      {(mockupImages.front || mockupImages.back) && (
                        <>
                          <Button
                            onClick={() => navigateView('prev')}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white"
                            size="sm"
                            variant="ghost"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => navigateView('next')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/80 text-white"
                            size="sm"
                            variant="ghost"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
        {/* Botón Generar Mockup */}
        <div className="absolute bottom-4 right-4">
          {(() => {
            const isDisabled = isGeneratingMockup || !selectedGarment || !selectedColor || !selectedSize || !(activeTab === 'front' ? frontStampSize : backStampSize)
            return (
              <Button
                onClick={generateMockup}
                disabled={isDisabled}
                className="relative"
                size="sm"
                variant={isDisabled ? "secondary" : "default"}
                title={
                  !selectedGarment ? "Selecciona una prenda" :
                  !selectedColor ? "Selecciona un color" :
                  !selectedSize ? "Selecciona un talle" :
                  !(activeTab === 'front' ? frontStampSize : backStampSize) ? `Selecciona el tamaño del estampado ${activeTab === 'front' ? 'frontal' : 'trasero'}` :
                  "Generar mockup"
                }
              >
                {isGeneratingMockup ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  "Generar Mockup"
                )}
              </Button>
            )
          })()}
          {/* Indicador de estado */}
          {(!selectedGarment || !selectedColor || !selectedSize || !(activeTab === 'front' ? frontStampSize : backStampSize)) && !isGeneratingMockup && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>
          )}
        </div>
                    </div>
                ) : (
                  <div className="aspect-square max-w-xl mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">No hay diseño seleccionado</p>
                  </div>
                )}
                
                 {/* Botones de selección frontal/trasero - Solo mostrar si no se ha confirmado el primer estampado */}
                 {!firstStampConfirmed && (
                   <div className="mt-6" data-section="side-selection">
                     <h4 className="text-lg font-semibold mb-4 text-center">¿Dónde querés estampar tu imagen?</h4>
                     <div className="flex justify-center gap-6">
                     <button
                       onClick={() => {
                         setSelectedSide('front')
                         handleTabChange('front')
                         setStampingMode(isDoubleStamping ? 'both' : 'front')
                       }}
                       onDoubleClick={() => openZoomModal(getCurrentGarmentImage('front'), 'Frente de la prenda')}
                       className={`group relative border-2 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 ${
                         selectedSide === 'front' 
                           ? 'border-primary ring-2 ring-primary/20' 
                           : 'border-muted hover:border-primary/50'
                       }`}
                     >
                       <div className="relative w-32 h-40 overflow-hidden">
                         <img
                           src={getCurrentGarmentImage('front')}
                           alt="Frente de la prenda"
                           className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-150 group-hover:origin-center"
                           onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                         />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>
                       <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-center py-2 text-sm font-medium">
                         Frente
                       </div>
                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                           🔍 Doble click para zoom
                         </div>
                       </div>
                     </button>
                     
                    <button
                       onClick={() => {
                         setSelectedSide('back')
                         handleTabChange('back')
                         setStampingMode(isDoubleStamping ? 'both' : 'back')
                       }}
                       onDoubleClick={() => openZoomModal(getCurrentGarmentImage('back'), 'Dorso de la prenda')}
                       className={`group relative border-2 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 ${
                         selectedSide === 'back' 
                           ? 'border-primary ring-2 ring-primary/20' 
                           : 'border-muted hover:border-primary/50'
                       }`}
                     >
                       <div className="relative w-32 h-40 overflow-hidden">
                         <img
                           src={getCurrentGarmentImage('back')}
                           alt="Dorso de la prenda"
                           className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-150 group-hover:origin-center"
                            onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                          />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                        </div>
                       <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-center py-2 text-sm font-medium">
                         Dorso
                       </div>
                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                           🔍 Doble click para zoom
                        </div>
                      </div>
                    </button>
                </div>
                 </div>
                 )}
                
                {/* Selector de tamaño del estampado - Mostrar en paso 2 y paso 3.5 (segundo estampado) */}
                {(() => {
                  const shouldShowStampSelector = selectedSide && (currentStep === 'step2' || currentStep === 'step3.5')
                  console.log('🔍 DEBUG StampSizeSelector condition:', {
                    selectedSide,
                    currentStep,
                    firstStampConfirmed,
                    wantsDoubleStamping,
                    shouldShowStampSelector
                  })
                  return shouldShowStampSelector
                })() && (
                  <div className={`mt-6 transition-all duration-500 ${highlightedSection === 'stamp-size-selection' ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50/10 rounded-lg p-3' : ''}`} data-section="stamp-size-selection">
                    <h4 className="text-lg font-semibold mb-4 text-center">
                      Tamaño del Estampado {selectedSide === 'front' ? 'Frontal' : 'Trasero'}
                    </h4>
                <StampSizeSelector
                  garmentType={selectedGarment === 'astra-oversize-hoodie' ? 'hoodie' : 'tshirt'}
                  garmentVariant={selectedGarment.includes('oversize') ? 'oversize' : 'classic'}
                  garmentColor={selectedColor as 'black' | 'gray' | 'caramel' | 'white' | 'cream' | 'model'}
                  side={selectedSide || 'front'}
                  onSizeSelect={handleStampSizeSelect}
                  selectedSize={selectedSide === 'front' ? frontStampSize || undefined : backStampSize || undefined}
                  selectedPosition={selectedSide === 'front' ? frontStampPosition || undefined : backStampPosition || undefined}
                  onZoomImage={openZoomModal}
                />
                  </div>
                )}
                
                {/* Botón Siguiente para confirmar primer estampado */}
                {!firstStampConfirmed && selectedSide && (frontStampSize || backStampSize) && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      onClick={handleConfirmFirstStamp}
                      className="px-6"
                    >
                      Siguiente
                    </Button>
                  </div>
                )}

                {/* Pregunta de doble estampado */}
                {showDoubleStampingQuestion && (
                  <div className="mt-8 p-6 bg-muted rounded-lg">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold mb-2">¿Querés un segundo estampado?</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Elegí una opción para continuar
                      </p>
                      <div className="flex flex-col gap-3 max-w-md mx-auto">
                        <Button
                          onClick={() => handleDoubleStampingChoice(true)}
                          variant="outline"
                          className="w-full text-sm"
                        >
                          Agregar un segundo estampado (+{formatCurrency(DOUBLE_STAMPING_EXTRA)})
                        </Button>
                        <div className="flex gap-3">
                          <Button
                            onClick={handleAddToCartOnly}
                            variant="secondary"
                            className="flex-1 text-sm"
                            disabled={isGeneratingMockups}
                          >
                            Agregar al carrito
                          </Button>
                          <Button
                            onClick={handleContinueToPurchase}
                            className="flex-1 text-sm"
                          >
                            Continuar a la compra
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                

                {/* Botón continuar a compra (solo cuando ya se eligió doble y está listo) */}
                {firstStampConfirmed && !showDoubleStampingQuestion && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={handleAddToCartOnly}
                      disabled={isGeneratingMockups || (wantsDoubleStamping && !(backDesign && backStampSize))}
                      variant="secondary"
                      className="px-8 py-3 text-lg"
                    >
                      {isGeneratingMockups ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Preparando...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Agregar al carrito
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleContinueToPurchase}
                      disabled={
                        isGeneratingMockups ||
                        (wantsDoubleStamping ? !(frontDesign && backDesign && backStampSize) : !frontDesign)
                      }
                      className="px-8 py-3 text-lg"
                    >
                      {isGeneratingMockups ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Generando imágenes...
                        </>
                      ) : (
                        <>
                          Finalizar compra
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                
                {/* Resultado del estampado generado */}
                {stampedImageUrl && (
                  <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-lg font-semibold mb-4 text-center text-green-800">¡Tu prenda está lista!</h4>
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
                  </div>
                )}
                
                {/* Resumen de precio y agregar al carrito */}
                {stampedImageUrl && (
                  <div className="mt-8 p-6 bg-muted rounded-lg">
                    <h4 className="text-lg font-semibold mb-4">Resumen de Precio</h4>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span>Precio base</span>
                        <span className="font-bold">{formatCurrency(basePrice)}</span>
                      </div>
                      {isDoubleStamping && (
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
                    <Button onClick={addToCart} disabled={isAddingToCart} className="w-full" size="lg">
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
                  </div>
                )}
              </div>
              </>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Caja 2: Opciones de prenda - Solo mostrar cuando sea necesario */}
        {showGarmentOptions && (
          <div className={`space-y-6 lg:col-span-3 transition-all duration-500 ${highlightedSection === 'stamp-options' ? 'ring-4 ring-blue-500 ring-opacity-50 bg-blue-50/10 rounded-lg p-2' : ''}`} data-section="stamp-options">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Opciones de Estampado</h3>
                  <Button variant="outline" size="sm" onClick={() => setCurrentStep('step1')}>
                        ← Cambiar prenda
                      </Button>
                    </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Prenda seleccionada:</h4>
                {selectedGarment ? (
                    <p className="text-sm text-muted-foreground">
                      {GARMENT_NAMES[selectedGarment as keyof typeof GARMENT_NAMES]} - {formatCurrency(GARMENT_PRICES[selectedGarment as keyof typeof GARMENT_PRICES])}
                    </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Ninguna. Elegí una prenda para continuar.</p>
                )}
                  </div>

                  <div className="space-y-4">
                    <div data-section="color-selection">
                      <h4 className="font-medium mb-3">Color</h4>
                      <div className="grid grid-cols-2 gap-2">
                    {(selectedGarment ? COLORS_BY_GARMENT[selectedGarment] : [])?.map((color) => (
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

                    <div data-section="size-selection">
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
          </div>
        )}
      </div>
      
      {/* Modal del generador de imágenes */}
      <Dialog open={showImageGenerator} onOpenChange={setShowImageGenerator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generar Nueva Imagen</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ImageGenerator 
              onImageGenerated={(url) => {
                handleImageGenerated(url)
                // Forzar que el segundo sea el opuesto del primero
                if (firstStampSide) {
                  const target = firstStampSide === 'front' ? 'back' : 'front'
                  setSelectedSide(target)
                  handleTabChange(target)
                  setStampingMode('both')
                }
              }}
              isAuthenticated={true}
              mode="modal"
            />
                  </div>
        </DialogContent>
      </Dialog>

      {/* Modal de zoom */}
      {showZoomModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowZoomModal(false)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowZoomModal(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
              <img
                src={zoomImageUrl}
                alt={zoomImageAlt}
                className="w-full h-auto max-h-[80vh] object-contain"
                onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
              />
              <div className="p-4 bg-white">
                <h3 className="text-lg font-semibold text-center">{zoomImageAlt}</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Haz clic fuera de la imagen o presiona ESC para cerrar
                      </p>
                    </div>
                    </div>
                  </div>
                    </div>
      )}
    </div>
  )
})

DesignCustomizer.displayName = "DesignCustomizer"
