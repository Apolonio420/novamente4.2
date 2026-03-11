"use client"

import { useEffect } from "react"

interface ImagePreloaderProps {
  images: string[]
  priority?: boolean
}

export function ImagePreloader({ images, priority = false }: ImagePreloaderProps) {
  // Crear una clave estable para las imágenes para evitar loops de renderizado
  // causados por arrays con nuevas referencias (ej: passar images={[]})
  const imagesKey = images.join(',')

  useEffect(() => {
    if (!priority || typeof window === "undefined" || !images.length) return

    // Precargar imágenes críticas
    const preloadImages = images.slice(0, 3) // Solo las primeras 3 imágenes

    preloadImages.forEach((src) => {
      if (src && !src.includes("placeholder.svg")) {
        // Verificar si ya existe para evitar duplicados en el DOM
        if (!document.querySelector(`link[href="${src}"]`)) {
          const link = document.createElement("link")
          link.rel = "preload"
          link.as = "image"
          link.href = src
          document.head.appendChild(link)
        }
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
  }, [imagesKey, priority]) // Usamos imagesKey en lugar de images

  return null
}
