"use client"

import { useEffect } from "react"

interface ImagePreloaderProps {
  images: string[]
  priority?: boolean
}

export function ImagePreloader({ images, priority = false }: ImagePreloaderProps) {
  useEffect(() => {
    if (!priority || typeof window === "undefined") return

    // Precargar imágenes críticas
    const preloadImages = images.slice(0, 3) // Solo las primeras 3 imágenes

    preloadImages.forEach((src) => {
      if (src && !src.includes("placeholder.svg")) {
        const link = document.createElement("link")
        link.rel = "preload"
        link.as = "image"
        link.href = src
        document.head.appendChild(link)
      }
    })

    return () => {
      // Cleanup: remover los preload links
      preloadImages.forEach((src) => {
        if (src && !src.includes("placeholder.svg")) {
          const existingLink = document.querySelector(`link[href="${src}"]`)
          if (existingLink) {
            document.head.removeChild(existingLink)
          }
        }
      })
    }
  }, [images, priority])

  return null
}
