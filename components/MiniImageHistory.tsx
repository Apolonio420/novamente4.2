"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MiniImageHistoryProps {
  onImageSelect: (imageUrl: string) => void
  currentImageUrl?: string
}

export function MiniImageHistory({ onImageSelect, currentImageUrl }: MiniImageHistoryProps) {
  // Mock data - en producción esto vendría del contexto
  const mockImages = [
    { id: "1", url: "/styles/geometrico-colibri.png", prompt: "Colibrí geométrico" },
    { id: "2", url: "/styles/pop-art-sandia.png", prompt: "Sandía pop art" },
    { id: "3", url: "/styles/pixel-art-astronauta.png", prompt: "Astronauta pixel art" },
    { id: "4", url: "/styles/acuarela-leon.png", prompt: "León acuarela" },
    { id: "5", url: "/styles/retro-cassette.png", prompt: "Cassette retro" },
  ]

  const [scrollPosition, setScrollPosition] = useState(0)
  const containerWidth = 600 // Ancho aproximado del contenedor
  const itemWidth = 80 // Ancho de cada miniatura + margen

  const scrollLeft = () => {
    const newPosition = Math.max(0, scrollPosition - itemWidth * 3)
    setScrollPosition(newPosition)
  }

  const scrollRight = () => {
    const maxScroll = Math.max(0, mockImages.length * itemWidth - containerWidth)
    const newPosition = Math.min(maxScroll, scrollPosition + itemWidth * 3)
    setScrollPosition(newPosition)
  }

  if (mockImages.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Historial de diseños</h3>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollLeft}
              disabled={scrollPosition === 0}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollRight}
              disabled={scrollPosition >= mockImages.length * itemWidth - containerWidth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div
            className="flex gap-3 transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${scrollPosition}px)` }}
          >
            {mockImages.map((image) => (
              <button
                key={image.id}
                onClick={() => onImageSelect(image.url)}
                className={`flex-shrink-0 relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                  currentImageUrl === image.url
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                title={image.prompt}
              >
                <Image
                  src={image.url || "/placeholder.svg"}
                  alt={image.prompt}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
                {currentImageUrl === image.url && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
