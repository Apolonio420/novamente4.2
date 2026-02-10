"use client"

import { useState, useEffect, useMemo } from "react"
import { OptimizedImage } from "./OptimizedImage"
import { getUserImages, type SavedImage } from "@/lib/db"
import { Button } from "./ui/button"
import { Eye, ChevronLeft, ChevronRight } from "lucide-react"

interface ImageHistoryProps {
  userId?: string
  limit?: number
  onImageSelect?: (imageUrl: string, imageId?: string) => void
  images?: SavedImage[]
  onScrollToGenerator?: () => void
  refreshKey?: number
  selectedImage?: string
  showStyles?: boolean // Nueva prop para controlar si mostrar estilos
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
  refreshKey,
  selectedImage,
  showStyles = true, // Por defecto mostrar estilos
}: ImageHistoryProps) {
  // Filtrar imágenes de diseño (excluir mockups y assets estáticos) - debe estar antes de filterDesignImages
  const isDesignImage = (img: SavedImage): boolean => {
    const url = (img?.url || "").toLowerCase()
    const key = (img?.key || "").toLowerCase()

    if (!url && !key) return false

    // Extraer el key del proxy si es una URL de proxy
    let effectiveKey = key
    if (url.includes('/api/proxy-image')) {
      try {
        const urlObj = new URL(url, 'http://dummy')
        const keyParam = urlObj.searchParams.get('key')
        if (keyParam) {
          effectiveKey = decodeURIComponent(keyParam).toLowerCase()
        }
      } catch {
        // Si falla parsear, usar el key directamente si existe
      }
    }

    // Si tenemos un key efectivo, usarlo para validar
    const checkString = effectiveKey || url

    // Excluir mockups y assets estáticos locales
    const looksLikeMockup =
      checkString.includes('/products/') ||
      checkString.includes('/garments/') ||
      checkString.includes('/styles/') ||
      checkString.includes('/falco/products/') ||
      checkString.includes('/placeholder') ||
      checkString.includes('/logo')

    if (looksLikeMockup) return false

    // Excluir JPEGs que son probablemente mockups
    const isJpeg = checkString.endsWith('.jpg') || checkString.endsWith('.jpeg')
    if (isJpeg) return false

    // Excluir stamps y mockups derivados en R2
    if (checkString.includes('/stamps/') || checkString.includes('/mockups/')) return false

    // Incluir:
    // - URLs del proxy que apuntan a imágenes originales o procesadas
    // - URLs de R2 directas (r2.dev o cloudflarestorage.com) que sean de imágenes originales o procesadas
    // - PNGs locales válidos (que no sean mockups)
    // - URLs de Supabase storage (por compatibilidad)

    const isProxyUrl = url.includes('/api/proxy-image')
    const isR2Url = url.includes('r2.dev') || url.includes('r2.cloudflarestorage.com')
    const isSupabaseUrl = url.includes('supabase.co')
    const isPng = checkString.endsWith('.png')
    const isOriginalOrProcessed = checkString.includes('/original/') ||
      checkString.includes('/processed/') ||
      checkString.includes('images/')

    // Si es URL del proxy, verificar que el key sea de una imagen original/procesada
    if (isProxyUrl) {
      return isOriginalOrProcessed && !looksLikeMockup
    }

    // Si es URL de R2 directa, debe ser original o procesada
    if (isR2Url) {
      return isOriginalOrProcessed
    }

    // Supabase o PNGs locales válidos
    return isSupabaseUrl || (isPng && !looksLikeMockup)
  }

  // Función helper para filtrar imágenes
  const filterDesignImages = (list: SavedImage[] = []): SavedImage[] => {
    // Filtrar y evitar duplicados por id/url
    const seen = new Set<string>()
    const result: SavedImage[] = []

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Filtering images:', list.length, 'items')
    }

    for (const item of list) {
      const isDesign = isDesignImage(item)
      if (!isDesign) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Filtered out:', item.url?.substring(0, 50), 'key:', item.key?.substring(0, 50))
        }
        continue
      }

      const key = item.id || item.url || item.key
      if (key && !seen.has(key)) {
        seen.add(key)
        result.push(item)
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Included:', item.url?.substring(0, 50))
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Filtered result:', result.length, 'design images')
    }

    return result
  }

  // Inicializar con propImages exactamente como vienen del servidor para evitar hydration mismatch
  const [images, setImages] = useState<SavedImage[]>(propImages ? filterDesignImages(propImages) : [])
  const [loading, setLoading] = useState(!propImages || propImages.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [historyScrollPosition, setHistoryScrollPosition] = useState(0)
  const [stylesScrollPosition, setStylesScrollPosition] = useState(0)

  const loadImages = async () => {
    try {
      setLoading(true)
      setError(null)

      if (propImages && propImages.length > 0) {
        // Usar solo imágenes de diseño (excluir mockups/prendas)
        setImages(filterDesignImages(propImages))
        setLoading(false)
        return
      }

      // Solo hacer fetch si tenemos userId o sessionId
      if (!userId) {
        setImages([])
        setLoading(false)
        return
      }

      const recentImages = await getUserImages(userId)
      setImages(filterDesignImages(recentImages))
    } catch (err) {
      console.error("❌ Error loading images:", err)
      setError("Error al cargar las imágenes")

      if (propImages && propImages.length > 0) {
        // Use prop images as fallback
        setImages(filterDesignImages(propImages))
        setError(null)
      } else {
        setImages([])
      }
    } finally {
      setLoading(false)
    }
  }

  // Efecto principal: manejar propImages primero, luego fetch si es necesario
  // Sincronizar con propImages cuando cambien (mantener cantidad para evitar hydration mismatch)
  // Create a stable signature for images to avoid re-running effect on new array references
  const imagesSignature = useMemo(() => {
    return propImages?.map(img => img.id || img.url).join(',') || ''
  }, [propImages])

  useEffect(() => {
    if (propImages) {
      const filtered = filterDesignImages(propImages)
      // Solo actualizar si realmente cambió para evitar renders innecesarios
      setImages(prev => {
        if (prev.length !== filtered.length ||
          prev.some((img, i) => img.id !== filtered[i]?.id)) {
          return filtered
        }
        return prev
      })
      setLoading(false)
      setError(null)
    } else if (userId) {
      // Solo hacer fetch si no hay propImages y tenemos userId
      loadImages()
    } else {
      // Si no hay userId ni propImages, mantener vacío
      setImages([])
      setLoading(false)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, limit, refreshKey, imagesSignature]) // Use stable signature

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

  const handleImageClick = (imageUrl: string, imageId?: string) => {
    if (onImageSelect) {
      onImageSelect(imageUrl, imageId)
    } else {
      // Si no hay onImageSelect, buscar el generador en la página y cargar la imagen
      const event = new CustomEvent('loadImageInGenerator', {
        detail: { imageUrl, imageId }
      })
      window.dispatchEvent(event)
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
                onClick={() => handleImageClick(image.url, image.id)}
                className={`flex-shrink-0 w-20 h-20 relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${selectedImage === image.url
                  ? "border-purple-500 ring-2 ring-purple-500/50"
                  : "border-gray-600 hover:border-gray-500"
                  }`}
              >
                <OptimizedImage
                  src={image.url}
                  alt={image.prompt}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  sizes="80px"
                />
                {/* Foco visual al seleccionar */}
                {selectedImage === image.url && (
                  <div className="absolute inset-0 ring-2 ring-purple-500/60 rounded-lg pointer-events-none" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Estilos inspiradores - solo si showStyles es true */}
      {showStyles && (
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
                className={`w-20 h-20 relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${selectedImage === style.url
                  ? "border-purple-500 ring-2 ring-purple-500/50"
                  : "border-gray-600 hover:border-gray-500"
                  }`}
              >
                <OptimizedImage
                  src={style.url}
                  alt={style.prompt}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
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

