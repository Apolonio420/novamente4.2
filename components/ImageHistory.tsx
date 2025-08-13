"use client"

import { useState, useEffect } from "react"
import { getRecentImages, deleteImage, type SavedImage } from "@/lib/db"
import { getCurrentUser, type User } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Download, Copy, ExternalLink } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

interface ImageHistoryProps {
  onImageSelect?: (image: SavedImage) => void
  limit?: number
  showActions?: boolean
}

export function ImageHistory({ onImageSelect, limit = 12, showActions = true }: ImageHistoryProps) {
  const [images, setImages] = useState<SavedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    loadImages()
    loadUser()
  }, [limit])

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Error loading user:", error)
    }
  }

  const loadImages = async () => {
    try {
      setLoading(true)
      const currentUser = await getCurrentUser()
      const recentImages = await getRecentImages(currentUser?.id, limit)
      setImages(recentImages)
    } catch (error) {
      console.error("Error loading images:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las imágenes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (imageId: string) => {
    try {
      const success = await deleteImage(imageId)
      if (success) {
        setImages(images.filter((img) => img.id !== imageId))
        toast({
          title: "Imagen eliminada",
          description: "La imagen se eliminó correctamente",
        })
      } else {
        throw new Error("Failed to delete image")
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (image: SavedImage) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `novamente-${image.id}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

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

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "URL copiada",
        description: "La URL de la imagen se copió al portapapeles",
      })
    } catch (error) {
      console.error("Error copying URL:", error)
      toast({
        title: "Error",
        description: "No se pudo copiar la URL",
        variant: "destructive",
      })
    }
  }

  const handleOpenInNewTab = (url: string) => {
    window.open(url, "_blank")
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <Card key={i} className="aspect-square">
            <CardContent className="p-0">
              <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No hay imágenes generadas aún</p>
        <p className="text-sm text-gray-400">Las imágenes que generes aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Imágenes Recientes</h3>
        <Badge variant="secondary">{images.length} imágenes</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <Card
            key={image.id}
            className="group relative aspect-square overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onImageSelect?.(image)}
          >
            <CardContent className="p-0">
              <div className="relative w-full h-full">
                <Image
                  src={image.url || "/placeholder.svg"}
                  alt={image.prompt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />

                {/* Overlay con acciones */}
                {showActions && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(image)
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyUrl(image.url)
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenInNewTab(image.url)
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(image.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Badge con información */}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    {new Date(image.created_at).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </CardContent>

            {/* Información de la imagen */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-white text-sm font-medium truncate">{image.prompt}</p>
              {image.optimized_prompt && (
                <p className="text-white/70 text-xs truncate mt-1">{image.optimized_prompt}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {images.length >= limit && (
        <div className="text-center">
          <Button variant="outline" onClick={loadImages}>
            Cargar más imágenes
          </Button>
        </div>
      )}
    </div>
  )
}
