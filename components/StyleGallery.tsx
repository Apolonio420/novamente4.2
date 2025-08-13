"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

// Estilos base disponibles
const BASE_STYLES = [
  {
    id: "acuarela-leon",
    name: "León Acuarela",
    category: "Acuarela",
    image: "/styles/acuarela-leon.png",
    description: "Estilo acuarela con león majestuoso",
  },
  {
    id: "geometrico-aguila",
    name: "Águila Geométrica",
    category: "Geométrico",
    image: "/styles/geometrico-aguila.png",
    description: "Diseño geométrico con águila",
  },
  {
    id: "pixel-art-astronauta",
    name: "Astronauta Pixel",
    category: "Pixel Art",
    image: "/styles/pixel-art-astronauta.png",
    description: "Astronauta en estilo pixel art",
  },
  {
    id: "pop-art-retrato",
    name: "Retrato Pop Art",
    category: "Pop Art",
    image: "/styles/pop-art-retrato.png",
    description: "Retrato en estilo pop art",
  },
  {
    id: "retro-vaporwave-palmera",
    name: "Palmera Vaporwave",
    category: "Retro",
    image: "/styles/retro-vaporwave-palmera.png",
    description: "Palmera en estilo vaporwave retro",
  },
  {
    id: "surrealista-leopardo",
    name: "Leopardo Surrealista",
    category: "Surrealista",
    image: "/styles/surrealista-leopardo.png",
    description: "Leopardo en estilo surrealista",
  },
  {
    id: "urbano-muscle-car",
    name: "Muscle Car Urbano",
    category: "Urbano",
    image: "/styles/urbano-muscle-car.png",
    description: "Auto clásico en estilo urbano",
  },
  {
    id: "japones-gran-ola",
    name: "Gran Ola Japonesa",
    category: "Japonés",
    image: "/styles/japones-gran-ola.png",
    description: "La gran ola en estilo japonés tradicional",
  },
]

interface StyleGalleryProps {
  onStyleSelect?: (styleUrl: string) => void
  limit?: number
}

export function StyleGallery({ onStyleSelect, limit = 8 }: StyleGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = Array.from(new Set(BASE_STYLES.map((style) => style.category)))

  const filteredStyles = selectedCategory
    ? BASE_STYLES.filter((style) => style.category === selectedCategory)
    : BASE_STYLES

  const displayedStyles = filteredStyles.slice(0, limit)

  const handleStyleSelect = (styleUrl: string) => {
    if (onStyleSelect) {
      onStyleSelect(styleUrl)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
        >
          Todos
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            size="sm"
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Grid de estilos */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayedStyles.map((style) => (
          <Card
            key={style.id}
            className="group cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
            onClick={() => handleStyleSelect(style.image)}
          >
            <div className="relative aspect-square">
              <Image
                src={style.image || "/placeholder.svg"}
                alt={style.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs">
                  {style.category}
                </Badge>
              </div>
            </div>
            <CardContent className="p-3">
              <h4 className="font-medium text-sm mb-1">{style.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{style.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStyles.length > limit && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setSelectedCategory(null)}>
            Ver más estilos
          </Button>
        </div>
      )}
    </div>
  )
}
