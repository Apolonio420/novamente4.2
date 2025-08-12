"use client"

import { useState, useEffect } from "react"
import { OptimizedImage } from "./OptimizedImage"
import { ImagePreloader } from "./ImagePreloader"
import { preloadImages } from "@/lib/imageOptimization"
import { cn } from "@/lib/utils"

interface ProductImageGalleryProps {
  images: string[]
  productName: string
  className?: string
}

export function ProductImageGallery({ images, productName, className }: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPreloading, setIsPreloading] = useState(true)

  // Precargar las primeras 3 imágenes al montar el componente
  useEffect(() => {
    const preloadCriticalImages = async () => {
      try {
        await preloadImages(images.slice(0, 3))
        setIsPreloading(false)
      } catch (error) {
        console.error("Error preloading images:", error)
        setIsPreloading(false)
      }
    }

    preloadCriticalImages()
  }, [images])

  // Precargar la siguiente imagen cuando el usuario cambia de imagen
  useEffect(() => {
    const nextIndex = (currentIndex + 1) % images.length
    if (images[nextIndex]) {
      preloadImages([images[nextIndex]])
    }
  }, [currentIndex, images])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Preloader para imágenes críticas */}
      <ImagePreloader images={images} priority />

      {/* Imagen principal */}
      <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
        {isPreloading ? (
          <div className="w-full h-full bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
        ) : (
          <OptimizedImage
            src={images[currentIndex] || "/placeholder.svg"}
            alt={`${productName} - Vista ${currentIndex + 1}`}
            fill
            priority={currentIndex === 0}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={85}
            className="object-cover"
          />
        )}

        {/* Navegación de imágenes */}
        {images.length > 1 && !isPreloading && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  currentIndex === index ? "bg-white" : "bg-white/50",
                )}
                aria-label={`Ver imagen ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <div
              key={index}
              className={cn(
                "aspect-square relative rounded-md overflow-hidden cursor-pointer transition-all",
                currentIndex === index ? "ring-2 ring-primary" : "hover:opacity-80",
              )}
              onClick={() => setCurrentIndex(index)}
            >
              <OptimizedImage
                src={image || "/placeholder.svg"}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                sizes="150px"
                quality={60}
                loading={index < 4 ? "eager" : "lazy"}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
