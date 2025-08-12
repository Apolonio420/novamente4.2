"use client"

import { useState, useEffect, useRef } from "react"
import { OptimizedImage } from "./OptimizedImage"
import { cn } from "@/lib/utils"

interface LazyImageGridProps {
  images: Array<{
    src: string
    alt: string
    href?: string
  }>
  className?: string
  itemClassName?: string
  loadingCount?: number
}

export function LazyImageGrid({ images, className, itemClassName, loadingCount = 6 }: LazyImageGridProps) {
  const [visibleCount, setVisibleCount] = useState(loadingCount)
  const [isLoading, setIsLoading] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && visibleCount < images.length) {
          setIsLoading(true)

          // Simular un pequeño delay para mejor UX
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + loadingCount, images.length))
            setIsLoading(false)
          }, 100)
        }
      },
      { threshold: 0.1 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [visibleCount, images.length, isLoading, loadingCount])

  const visibleImages = images.slice(0, visibleCount)
  const hasMore = visibleCount < images.length

  return (
    <div className={cn("space-y-6", className)}>
      <div className="image-grid">
        {visibleImages.map((image, index) => (
          <div
            key={index}
            className={cn("relative group aspect-square bg-muted rounded-lg overflow-hidden", itemClassName)}
          >
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              fill
              priority={index < 3}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              quality={75}
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Intersection observer target */}
      {hasMore && (
        <div ref={observerRef} className="h-10 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Cargando más imágenes...</span>
        </div>
      )}
    </div>
  )
}
