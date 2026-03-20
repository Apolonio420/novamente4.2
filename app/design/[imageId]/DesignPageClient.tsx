"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DesignCustomizer } from "@/components/DesignCustomizer"
import { ImageHistory } from "@/components/ImageHistory"
import { ImageGenerator } from "@/components/ImageGenerator"
import { Loader2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"
import type { HistoryImage } from "@/components/ImageHistory"

interface DesignPageClientProps {
  imageId: string
}

interface ProcessedImage {
  id: string
  imageUrl: string
  prompt: string
  hasBgRemoved: boolean
}

export function DesignPageClient({ imageId }: DesignPageClientProps) {
  const [imageData, setImageData] = useState<ProcessedImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentImages, setRecentImages] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()
  
  // Referencia al DesignCustomizer para comunicación directa
  const designCustomizerRef = useRef<any>(null)

  useEffect(() => {
    const loadProcessedImage = async () => {
      try {
        console.log("🔍 Cargando imagen procesada para ID:", imageId)

        // Buscar la imagen procesada en la base de datos
        const response = await fetch(`/api/images/${imageId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Imagen no encontrada")
          }
          throw new Error(`Error del servidor: ${response.status}`)
        }

        const data = await response.json()
        console.log("✅ Imagen procesada cargada:", data)

        if (!data.success || !data.image) {
          throw new Error("Datos de imagen inválidos")
        }

        setImageData({
          id: data.image.id,
          imageUrl: data.image.url,
          prompt: data.image.prompt,
          hasBgRemoved: data.image.has_bg_removed || false,
        })

        toast({
          title: "¡Diseño cargado!",
          description: "Tu imagen procesada está lista para personalizar",
        })

      } catch (error) {
        console.error("❌ Error cargando imagen procesada:", error)
        const errorMessage = error instanceof Error ? error.message : "Error desconocido"
        setError(errorMessage)
        
        toast({
          title: "Error",
          description: `No se pudo cargar el diseño: ${errorMessage}`,
          variant: "destructive",
        })

        // Redirigir a la página de diseño principal después de un error
        setTimeout(() => {
          router.push("/#generator-section")
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    if (imageId) {
      loadProcessedImage()
    }
  }, [imageId, router, toast])

  // Load image history via server-side API (session cookie handles identity)
  useEffect(() => {
    const loadImageHistory = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        const res = await fetch("/api/images/history?limit=50", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setRecentImages(data.images || [])
        }
      } catch (error) {
        console.error("Error loading image history:", error)
      }
    }
    loadImageHistory()
  }, [])

  const handleImageSelect = (imageUrl: string, selectedId?: string) => {
    console.log('🔍 DEBUG DesignPageClient handleImageSelect:', {
      imageUrl,
      selectedId,
      timestamp: new Date().toISOString()
    })
    
    // Actualizar la imagen actual con la seleccionada del historial
    setImageData(prev => prev ? {
      ...prev,
      imageUrl: imageUrl,
      id: selectedId || prev.id
    } : null)
    
    toast({
      title: "Imagen seleccionada",
      description: "Se ha cargado la imagen del historial",
    })
  }

  // Función para manejar la selección de imágenes que puede redirigir al DesignCustomizer
  const handleImageSelectWithContext = (imageUrl: string, selectedId?: string) => {
    console.log('🔍 DEBUG DesignPageClient handleImageSelectWithContext:', {
      imageUrl,
      selectedId,
      designCustomizerRef: designCustomizerRef.current,
      timestamp: new Date().toISOString()
    })
    
    // Intentar comunicarse con el DesignCustomizer primero
    if (designCustomizerRef.current && typeof designCustomizerRef.current.handleHistoryImageSelect === 'function') {
      console.log('✅ Llamando a handleHistoryImageSelect del DesignCustomizer')
      designCustomizerRef.current.handleHistoryImageSelect(imageUrl, selectedId)
    } else {
      console.log('⚠️ DesignCustomizer no disponible, usando función original')
      handleImageSelect(imageUrl, selectedId)
    }
  }

  const handleImageGenerated = (imageUrl: string) => {
    // Actualizar la imagen actual con la nueva generada
    setImageData(prev => prev ? {
      ...prev,
      imageUrl: imageUrl
    } : null)
    
    // Reload history to include new image
    fetch("/api/images/history?limit=50", { credentials: "include" })
      .then(r => r.json())
      .then(data => setRecentImages(data.images || []))
      .catch(() => {})
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Cargando tu diseño...</h2>
            <p className="text-muted-foreground">
              Procesando imagen y preparando el editor
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Error cargando diseño</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => router.push("/#generator-section")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Volver al generador
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!imageData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Diseño no encontrado</h2>
            <p className="text-muted-foreground mb-4">
              No se pudo encontrar el diseño solicitado
            </p>
            <button
              onClick={() => router.push("/#generator-section")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Crear nuevo diseño
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Personaliza tu Diseño</h1>
        <p className="text-muted-foreground">
          Ajusta la posición, tamaño y color de tu estampado
        </p>
        {imageData.prompt && (
          <div className="mt-2 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Prompt:</span> {imageData.prompt}
            </p>
            {imageData.hasBgRemoved && (
              <p className="text-xs text-green-600 mt-1">
                ✅ Fondo removido automáticamente
              </p>
            )}
          </div>
        )}
      </div>

      {/* Historial de imágenes - clickeable para seleccionar */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Tus Diseños Recientes</h2>
        <p className="text-muted-foreground mb-4">Haz clic en cualquier diseño para seleccionarlo</p>
        <ImageHistory 
          images={recentImages}
          onImageSelect={handleImageSelectWithContext}
          selectedImage={imageData.imageUrl}
          showStyles={true}
        />
      </div>
      
      <DesignCustomizer 
        ref={designCustomizerRef}
        initialImageUrl={imageData.imageUrl} 
        imageId={imageData.id}
        onImageSelect={handleImageSelect}
      />

      {/* Generador de imágenes - al final */}
      <div className="mt-12" data-section="image-generator">
        <h2 className="text-2xl font-bold mb-4">Generar Nueva Imagen</h2>
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
          <ImageGenerator 
            onImageGenerated={handleImageGenerated}
            isAuthenticated={!!user}
          />
        </div>
      </div>
    </div>
  )
}