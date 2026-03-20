"use client"

import { useState, useEffect, useCallback } from "react"
import { OptimizedImage } from "./OptimizedImage"
import { Button } from "./ui/button"
import { Eye, ChevronLeft, ChevronRight } from "lucide-react"

export interface HistoryImage {
  id: string
  url: string
  prompt: string
  created_at: string
  has_bg_removed?: boolean
  url_without_bg?: string | null
}

interface ImageHistoryProps {
  userId?: string
  limit?: number
  onImageSelect?: (imageUrl: string, imageId?: string) => void
  images?: HistoryImage[]
  onScrollToGenerator?: () => void
  refreshKey?: number
  selectedImage?: string
  showStyles?: boolean
}

// Static showcase styles
const baseStyles = [
  { id: "style-1", url: "/styles/acuarela-leon.png", prompt: "Leon en estilo acuarela" },
  { id: "style-2", url: "/styles/geometrico-aguila.png", prompt: "Aguila geometrica" },
  { id: "style-3", url: "/styles/pixel-art-astronauta.png", prompt: "Astronauta pixel art" },
  { id: "style-4", url: "/styles/pop-art-retrato.png", prompt: "Retrato pop art" },
  { id: "style-5", url: "/styles/japones-gran-ola.png", prompt: "Gran ola japonesa" },
  { id: "style-6", url: "/styles/retro-vaporwave-palmera.png", prompt: "Palmera vaporwave" },
]

async function ensureSession(): Promise<void> {
  // Check if session cookie already exists
  if (document.cookie.includes("novamente_session_id=")) return
  try {
    await fetch("/api/user/session", { credentials: "include" })
  } catch {
    // Non-blocking — history just won't load for this visit
  }
}

async function fetchHistory(limit: number): Promise<HistoryImage[]> {
  try {
    const res = await fetch(`/api/images/history?limit=${limit}`, { credentials: "include" })
    if (!res.ok) return []
    const data = await res.json()
    return data.images || []
  } catch {
    return []
  }
}

export function ImageHistory({
  limit = 20,
  onImageSelect,
  images: propImages,
  onScrollToGenerator,
  refreshKey,
  selectedImage,
  showStyles = true,
}: ImageHistoryProps) {
  const [images, setImages] = useState<HistoryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [historyScrollPos, setHistoryScrollPos] = useState(0)
  const [stylesScrollPos, setStylesScrollPos] = useState(0)

  const loadImages = useCallback(async () => {
    // If caller provided images with content, use those
    if (propImages && propImages.length > 0) {
      setImages(propImages)
      setLoading(false)
      return
    }

    setLoading(true)
    // Ensure session cookie exists before fetching
    await ensureSession()
    const fetched = await fetchHistory(limit)
    setImages(fetched)
    setLoading(false)
  }, [propImages, limit])

  useEffect(() => {
    loadImages()
  }, [loadImages, refreshKey])

  const handleImageClick = (imageUrl: string, imageId?: string) => {
    if (onImageSelect) {
      onImageSelect(imageUrl, imageId)
    } else {
      window.dispatchEvent(new CustomEvent("loadImageInGenerator", { detail: { imageUrl, imageId } }))
    }
  }

  const scroll = (containerId: string, direction: "left" | "right", pos: number, setPos: (n: number) => void) => {
    const el = document.getElementById(containerId)
    if (!el) return
    const delta = direction === "left" ? -200 : 200
    const next = Math.max(0, pos + delta)
    el.scrollTo({ left: next, behavior: "smooth" })
    setPos(next)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Historial de disenos</h3>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-20 h-20 bg-gray-200 animate-pulse rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User design history */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Historial de disenos</h3>
          {images.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => scroll("history-scroll", "left", historyScrollPos, setHistoryScrollPos)} disabled={historyScrollPos === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => scroll("history-scroll", "right", historyScrollPos, setHistoryScrollPos)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div id="history-scroll" className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {images.length === 0 ? (
            <div className="flex items-center justify-center w-full min-h-[64px] text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600">
                <div className="w-6 h-6 bg-gray-600 rounded-full" />
              </div>
              <div className="ml-3">
                <p className="text-gray-400 text-sm">No hay disenos guardados</p>
                {onScrollToGenerator && (
                  <Button onClick={onScrollToGenerator} variant="outline" size="sm" className="mt-2 bg-transparent">
                    Crear primer diseno
                  </Button>
                )}
              </div>
            </div>
          ) : (
            images.map((image) => (
              <button
                key={image.id}
                onClick={() => handleImageClick(image.url, image.id)}
                className={`flex-shrink-0 w-20 h-20 relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                  selectedImage === image.url ? "border-purple-500 ring-2 ring-purple-500/50" : "border-gray-600 hover:border-gray-500"
                }`}
              >
                <OptimizedImage src={image.url} alt={image.prompt} width={80} height={80} className="object-cover w-full h-full" sizes="80px" />
                {selectedImage === image.url && <div className="absolute inset-0 ring-2 ring-purple-500/60 rounded-lg pointer-events-none" />}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Inspiring styles */}
      {showStyles && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Estilos inspiradores</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => scroll("styles-scroll", "left", stylesScrollPos, setStylesScrollPos)} disabled={stylesScrollPos === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => scroll("styles-scroll", "right", stylesScrollPos, setStylesScrollPos)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div id="styles-scroll" className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {baseStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => handleImageClick(style.url)}
                className={`w-20 h-20 relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                  selectedImage === style.url ? "border-purple-500 ring-2 ring-purple-500/50" : "border-gray-600 hover:border-gray-500"
                }`}
              >
                <OptimizedImage src={style.url} alt={style.prompt} width={80} height={80} className="object-cover w-full h-full" sizes="(max-width: 768px) 50vw, 25vw" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
