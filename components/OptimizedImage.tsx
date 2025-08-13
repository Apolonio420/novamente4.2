"use client"

import { useState, useRef, useEffect } from "react"
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
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setCurrentSrc(src)
    setHasError(false)
    setIsLoading(true)
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

  const handleError = () => {
    console.error("❌ Error loading image:", currentSrc)

    if (!currentSrc.includes("placeholder.svg") && !hasError) {
      console.log("🔄 Trying placeholder fallback")
      setCurrentSrc("/unavailable-image.png")
      setHasError(false) // Reset error state para intentar con placeholder
    } else {
      setHasError(true)
    }

    setIsLoading(false)
  }

  if (hasError) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted text-muted-foreground rounded-lg", className)}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <div className="w-8 h-8 bg-muted-foreground/20 rounded-full mx-auto mb-2" />
          <span className="text-sm">Imagen no disponible</span>
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
        src={currentSrc || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={defaultBlurDataURL}
        sizes={sizes}
        quality={quality}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn("transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100", className)}
        {...props}
      />
    </div>
  )
}
