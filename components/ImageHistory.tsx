"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"
import { getImageHistory, type SavedImage } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface ImageHistoryProps {
  onImageSelect?: (imageUrl: string) => void
  limit?: number
}

export function ImageHistory({ onImageSelect, limit = 20 }: ImageHistoryProps) {
  const [images, setImages] = useState<SavedImage[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadImages()
  }, [limit])

  const loadImages = async () => {
    try {
      setLoading(true)
      const imageHistory = await getImageHistory(limit)
      setImages(imageHistory)
    } catch (error) {
      console.error("Error loading image history:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de imágenes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (imageUrl: string) => {
    if (onImageSelect) {
      onImageSelect(imageUrl)
      toast({
        title: "Imagen seleccionada",
        description: "La imagen se ha cargado en el editor",
      })
    }
  }

  const downloadImage = async (url: string, prompt: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `${prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_")}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(downloadUrl)

      toast({
        title: "Descarga iniciada",
        description: "La imagen se está descargando",
      })
    } catch (error) {
      console.error("Error downloading image:", error)
      toast({
        title: "Error",
        description: "No se pudo descargar la imagen",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando historial...</div>
        </CardContent>
      </Card>
    )
  }

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">No hay imágenes en el historial</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Historial de Imágenes ({images.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="relative aspect-square">
              <Image
                src={image.url || "/placeholder.svg"}
                alt={image.prompt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{image.prompt}</p>
              <div className="flex gap-2">
                {onImageSelect && (
                  <Button size="sm" onClick={() => handleImageSelect(image.url)} className="flex-1">
                    Usar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => downloadImage(image.url, image.prompt)}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open(image.url, "_blank")}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {new Date(image.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
