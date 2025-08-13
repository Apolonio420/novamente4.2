"use client"

import { useState, useEffect } from "react"
import { OptimizedImage } from "./OptimizedImage"
import { getUserImages, type SavedImage } from "@/lib/db"
import { Button } from "./ui/button"
import { Eye, ChevronLeft, ChevronRight } from "lucide-react"

interface ImageHistoryProps {
  userId?: string
  limit?: number
  onImageSelect: (imageUrl: string) => void
  images?: SavedImage[]
  onScrollToGenerator?: () => void
  isDesignPage?: boolean
  refreshKey?: number
  selectedImage?: string
}

// Estilos base de Novamente
const baseStyles = [
  {
    id: "style-1",
    url: "/styles/acuarela-leon.png",
    prompt: "León en estilo acuarela",
  },
  {
    id: "style-2",
    url: "/styles/geometrico-aguila.png",
    prompt: "Águila geométrica",
  },
  {
    id: "style-3",
    url: "/styles/pixel-art-astronauta.png",
    prompt: "Astronauta pixel art",
  },
  {
    id: "style-4",
    url: "/styles/pop-art-retrato.png",
    prompt: "Retrato pop art",
  },
  {
    id: "style-5",
    url: "/styles/japones-gran-ola.png",
    prompt: "Gran ola japonesa",
  },
  {
    id: "style-6",
    url: "/styles/retro-vaporwave-palmera.png",
    prompt: "Palmera vaporwave",
  },
]

export function ImageHistory({
  userId,
  limit = 20,
  onImageSelect,
  images: propImages,
  onScrollToGenerator,
  isDesignPage = false,
  refreshKey,
  selectedImage,
}: ImageHistoryProps) {
  const [images, setImages] = useState<SavedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyScrollPosition, setHistoryScrollPosition] = useState(0)
  const [stylesScrollPosition, setStylesScrollPosition] = useState(0)

  const loadImages = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔄 Loading images...")

      if (propImages) {
        console.log("📋 Using provided images:", propImages.length)
        setImages(propImages)
      } else {
        console.log("🔍 Fetching user images for userId:", userId)
        const recentImages = await getUserImages(userId)
        console.log("✅ Loaded", recentImages.length, "images")
        setImages(recentImages)
      }
    } catch (err) {
      console.error("❌ Error loading images:", err)
      setError("Error al cargar las imágenes")

      try {
        console.log("🔄 Trying localStorage fallback...")
        const localImages = JSON.parse(localStorage.getItem("saved_images") || "[]")
        console.log("📱 Found", localImages.length, "images in localStorage fallback")
        setImages(localImages.slice(0, limit))
        setError(null) // Clear error if localStorage works
      } catch (localErr) {
        console.error("❌ Error loading from localStorage:", localErr)
        setImages([]) // Ensure empty array instead of undefined
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadImages()
  }, [userId, limit, propImages, refreshKey])

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
    } catch (error) {
      console.error("Error downloading image:", error)
    }
  }

  const handleImageClick = (imageUrl: string) => {
    if (isDesignPage) {
      // Redirigir a la página de personalización con la imagen
      window.location.href = `/design/placeholder?image=${encodeURIComponent(imageUrl)}`
    } else if (onImageSelect) {
      onImageSelect(imageUrl)
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Historial skeleton */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Historial de diseños</h3>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-16 h-16 bg-gray-200 animate-pulse rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Estilos skeleton */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Estilos inspiradores</h3>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-16 h-16 bg-gray-200 animate-pulse rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && images.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadImages} variant="outline">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Historial de diseños del usuario */}
      <div>
        <div className="flex items-center justify-between mb-4">
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
          {images.length === 0 ? (
            <div className="flex items-center justify-center w-full min-h-[64px] text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600">
                <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-gray-400 text-sm">No hay diseños guardados</p>
                {onScrollToGenerator && (
                  <Button onClick={onScrollToGenerator} variant="outline" size="sm" className="mt-2 bg-transparent">
                    Crear primer diseño
                  </Button>
                )}
              </div>
            </div>
          ) : (
            images.map((image) => (
              <button
                key={image.id}
                onClick={() => handleImageClick(image.url)}
                className={`flex-shrink-0 w-16 h-16 relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                  selectedImage === image.url
                    ? "border-purple-500 ring-2 ring-purple-500/50"
                    : "border-gray-600 hover:border-gray-500"
                }`}
              >
                <OptimizedImage
                  src={`/api/proxy-image?url=${encodeURIComponent(image.url)}`}
                  alt={image.prompt}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Estilos inspiradores */}
      <div>
        <div className="flex items-center justify-between mb-4">
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
            <button
              key={style.id}
              onClick={() => handleImageClick(style.url)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                selectedImage === style.url
                  ? "border-purple-500 ring-2 ring-purple-500/50"
                  : "border-gray-600 hover:border-gray-500"
              }`}
            >
              <OptimizedImage
                src={style.url}
                alt={style.prompt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
