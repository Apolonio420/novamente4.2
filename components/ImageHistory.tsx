"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, ExternalLink, RefreshCw } from "lucide-react"
import { getRecentImages, deleteImage } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"

interface ImageHistoryProps {
  refreshKey?: number
  onImageSelect?: (imageUrl: string) => void
}

interface SavedImage {
  id: string
  url: string
  prompt: string
  optimizedPrompt?: string
  createdAt: string
  userId?: string
}

export function ImageHistory({ refreshKey = 0, onImageSelect }: ImageHistoryProps) {
  const [images, setImages] = useState<SavedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const loadImages = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔄 Loading recent images...")

      const recentImages = await getRecentImages(12)
      console.log("✅ Loaded images:", recentImages.length)

      setImages(recentImages)
    } catch (err) {
      console.error("❌ Error loading images:", err)
      setError("Error al cargar las imágenes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadImages()
  }, [refreshKey])

  const handleDelete = async (id: string) => {
    if (deletingIds.has(id)) return

    setDeletingIds((prev) => new Set(prev).add(id))

    try {
      console.log("🗑️ Deleting image:", id)
      await deleteImage(id)

      // Actualizar la lista local
      setImages((prev) => prev.filter((img) => img.id !== id))

      toast({
        title: "Imagen eliminada",
        description: "La imagen se eliminó correctamente",
      })
    } catch (err) {
      console.error("❌ Error deleting image:", err)
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen",
        variant: "destructive",
      })
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleImageSelect = (imageUrl: string) => {
    if (onImageSelect) {
      onImageSelect(imageUrl)
    }
  }

  const createProxyUrl = (originalUrl: string) => {
    // Usar proxy para URLs de Azure Blob Storage
    if (originalUrl && originalUrl.includes("oaidalleapiprodscus.blob.core.windows.net")) {
      return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`
    }
    return originalUrl
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Fecha inválida"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Historial de Imágenes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Imágenes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadImages} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (images.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Imágenes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No tienes imágenes generadas aún</p>
            <p className="text-sm text-muted-foreground">Las imágenes que generes aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Historial de Imágenes</CardTitle>
        <Badge variant="secondary">{images.length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="group relative">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/50 transition-colors">
                <Image
                  src={createProxyUrl(image.url) || "/placeholder.svg"}
                  alt={image.prompt}
                  fill
                  className="object-cover cursor-pointer"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  onClick={() => handleImageSelect(image.url)}
                  onError={(e) => {
                    console.error("❌ Error loading history image:", image.id)
                    // Ocultar imagen si falla la carga
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                  unoptimized
                />

                {/* Overlay con acciones */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Link href={`/design/placeholder?image=${encodeURIComponent(image.url)}`}>
                    <Button size="sm" variant="secondary">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(image.id)}
                    disabled={deletingIds.has(image.id)}
                  >
                    {deletingIds.has(image.id) ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Info de la imagen */}
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground line-clamp-2">{image.prompt}</p>
                <p className="text-xs text-muted-foreground">{formatDate(image.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>

        {images.length > 0 && (
          <div className="mt-4 text-center">
            <Button onClick={loadImages} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
