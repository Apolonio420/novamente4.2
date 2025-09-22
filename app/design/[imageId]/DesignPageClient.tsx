"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DesignCustomizer } from "@/components/DesignCustomizer"
import { ImageHistory } from "@/components/ImageHistory"
import { ImageGenerator } from "@/components/ImageGenerator"
import { Loader2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getUserImages } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

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
  const [showImageHistory, setShowImageHistory] = useState(false)
  const [showImageGenerator, setShowImageGenerator] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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
          router.push("/design")
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    if (imageId) {
      loadProcessedImage()
    }
  }, [imageId, router, toast])

  // Cargar historial de imágenes
  useEffect(() => {
    const loadImageHistory = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        
        const images = await getUserImages(currentUser?.id)
        setRecentImages(images)
        console.log("📋 Historial de imágenes cargado:", images.length)
      } catch (error) {
        console.error("❌ Error cargando historial de imágenes:", error)
      }
    }

    loadImageHistory()
  }, [])

  const handleImageSelect = (imageUrl: string) => {
    // Actualizar la imagen actual con la seleccionada del historial
    setImageData(prev => prev ? {
      ...prev,
      imageUrl: imageUrl
    } : null)
    
    toast({
      title: "Imagen seleccionada",
      description: "Se ha cargado la imagen del historial",
    })
  }

  const handleImageGenerated = (imageUrl: string) => {
    // Actualizar la imagen actual con la nueva generada
    setImageData(prev => prev ? {
      ...prev,
      imageUrl: imageUrl
    } : null)
    
    // Recargar el historial para incluir la nueva imagen
    const loadImageHistory = async () => {
      try {
        const images = await getUserImages(user?.id)
        setRecentImages(images)
      } catch (error) {
        console.error("❌ Error recargando historial:", error)
      }
    }
    loadImageHistory()
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
              onClick={() => router.push("/design")}
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
              onClick={() => router.push("/design")}
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

      {/* Botones para mostrar historial y generador */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setShowImageHistory(!showImageHistory)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {showImageHistory ? 'Ocultar' : 'Mostrar'} Historial de Imágenes
        </button>
        <button
          onClick={() => setShowImageGenerator(!showImageGenerator)}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
        >
          {showImageGenerator ? 'Ocultar' : 'Mostrar'} Generador de Imágenes
        </button>
      </div>

      {/* Historial de imágenes */}
      {showImageHistory && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Tus Diseños Recientes</h2>
          <ImageHistory 
            images={recentImages}
            onImageSelect={handleImageSelect}
            selectedImage={imageData.imageUrl}
          />
        </div>
      )}

      {/* Generador de imágenes */}
      {showImageGenerator && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Generar Nueva Imagen</h2>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
            <ImageGenerator 
              onImageGenerated={handleImageGenerated}
              isAuthenticated={!!user}
            />
          </div>
        </div>
      )}
      
      <DesignCustomizer 
        initialImageUrl={imageData.imageUrl} 
        imageId={imageData.id}
      />
    </div>
  )
}