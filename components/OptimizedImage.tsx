"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  placeholder?: "blur" | "empty"
  blurDataURL?: string
  sizes?: string
  quality?: number
  loading?: "lazy" | "eager"
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  placeholder = "blur",
  blurDataURL,
  sizes,
  quality = 75,
  loading = "lazy",
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const [failed, setFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setCurrentSrc(src)
    setHasError(false)
    setIsLoading(true)
    setFailed(false)
  }, [src])

  // Generar un placeholder blur simple si no se proporciona uno
  const defaultBlurDataURL =
    blurDataURL ||
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="

  // Detectar si la imagen está en el viewport
  useEffect(() => {
    if (!imgRef.current || priority) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoading(false)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: "50px" },
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = useCallback(() => {
    if (!failed) {
      setFailed(true)
      // Solo un warning silencioso, no spam
      if (process.env.NODE_ENV === 'development') {
        console.warn('Image failed, using placeholder:', currentSrc?.substring(0, 50))
      }
    }
    setHasError(true)
    setIsLoading(false)
  }, [failed, currentSrc])

  if (hasError) {
    // Placeholder visual más compacto para historial
    const isSmall = (width && width <= 100) || (height && height <= 100)
    
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/50 text-muted-foreground rounded-lg overflow-hidden",
          isSmall ? "p-1" : "p-2",
          className
        )}
        style={fill ? { width: '100%', height: '100%' } : { width, height }}
      >
        <div className="text-center w-full">
          {isSmall ? (
            <div className="w-4 h-4 bg-muted-foreground/20 rounded mx-auto" />
          ) : (
            <>
              <div className="w-6 h-6 bg-muted-foreground/20 rounded-full mx-auto mb-1" />
              <span className="text-xs text-muted-foreground/60">No disponible</span>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      {/* Skeleton/Placeholder mientras carga */}
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse rounded-lg",
            fill ? "w-full h-full" : "",
          )}
          style={!fill ? { width, height } : {}}
        />
      )}

      <Image
        src={hasError ? "/unavailable-image.png" : (currentSrc || "/placeholder.svg")}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={defaultBlurDataURL}
        sizes={sizes || "(max-width: 768px) 50vw, 25vw"}
        quality={quality}
        loading={loading}
        // No optimizar imágenes del proxy, URLs externas, o assets locales estáticos
        unoptimized={Boolean(
          currentSrc?.startsWith('/api/proxy-image') ||
          currentSrc?.startsWith('http') ||
          currentSrc?.startsWith('/garments/') ||
          currentSrc?.startsWith('/styles/')
        )}
        onLoad={handleLoad}
        onError={handleError}
        className={cn("transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100", className)}
        {...props}
      />
    </div>
  )
}
