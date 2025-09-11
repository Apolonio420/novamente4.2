"use client"

import type React from "react"

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
    prompt: "León majestuoso en estilo acuarela, colores vibrantes, técnica de pintura fluida, arte tradicional",
  },
  {
    id: "geometrico-aguila",
    name: "Águila Geométrica",
    category: "Geométrico",
    image: "/styles/geometrico-aguila.png",
    description: "Diseño geométrico con águila",
    prompt: "Águila en estilo geométrico, formas angulares, líneas precisas, diseño minimalista moderno",
  },
  {
    id: "pixel-art-astronauta",
    name: "Astronauta Pixel",
    category: "Pixel Art",
    image: "/styles/pixel-art-astronauta.png",
    description: "Astronauta en estilo pixel art",
    prompt: "Astronauta en estilo pixel art, 8-bit retro, colores vibrantes, arte digital nostálgico",
  },
  {
    id: "pop-art-retrato",
    name: "Retrato Pop Art",
    category: "Pop Art",
    image: "/styles/pop-art-retrato.png",
    description: "Retrato en estilo pop art",
    prompt: "Retrato en estilo pop art, colores brillantes, alto contraste, estilo Andy Warhol",
  },
  {
    id: "retro-vaporwave-palmera",
    name: "Palmera Vaporwave",
    category: "Retro",
    image: "/styles/retro-vaporwave-palmera.png",
    description: "Palmera en estilo vaporwave retro",
    prompt: "Palmera en estilo vaporwave, colores neón, gradientes retro, estética años 80",
  },
  {
    id: "surrealista-leopardo",
    name: "Leopardo Surrealista",
    category: "Surrealista",
    image: "/styles/surrealista-leopardo.png",
    description: "Leopardo en estilo surrealista",
    prompt: "Leopardo surrealista, elementos oníricos, composición fantástica, estilo Salvador Dalí",
  },
  {
    id: "urbano-muscle-car",
    name: "Muscle Car Urbano",
    category: "Urbano",
    image: "/styles/urbano-muscle-car.png",
    description: "Auto clásico en estilo urbano",
    prompt: "Muscle car clásico, estilo urbano, graffiti, arte callejero, colores vibrantes",
  },
  {
    id: "japones-gran-ola",
    name: "Gran Ola Japonesa",
    category: "Japonés",
    image: "/styles/japones-gran-ola.png",
    description: "La gran ola en estilo japonés tradicional",
    prompt: "Gran ola japonesa, estilo tradicional ukiyo-e, arte clásico japonés, Hokusai",
  },
]

interface StyleGalleryProps {
  onStyleSelect?: (styleUrl: string) => void
  limit?: number
  simplified?: boolean
  directToCustomization?: boolean
}

export function StyleGallery({ onStyleSelect, limit = 8, simplified, directToCustomization }: StyleGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null)

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

  const handleImageClick = async (style: any, event: React.MouseEvent) => {
    event.stopPropagation()

    try {
      await navigator.clipboard.writeText(style.prompt)
      setCopiedPrompt(style.id)

      // Clear the notification after 2 seconds
      setTimeout(() => {
        setCopiedPrompt(null)
      }, 2000)
    } catch (err) {
      console.error("Failed to copy prompt:", err)
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
                onClick={(e) => handleImageClick(style, e)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs">
                  {style.category}
                </Badge>
              </div>
              {copiedPrompt === style.id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                    ¡Prompt copiado!
                  </div>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <h4 className="font-medium text-sm mb-1">{style.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{style.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!simplified && filteredStyles.length > limit && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setSelectedCategory(null)}>
            Ver más estilos
          </Button>
        </div>
      )}
    </div>
  )
}
