"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  // --- Nuevos estilos agregados ---
  {
    id: "line-art-planta",
    name: "Planta Line Art",
    category: "Line Art",
    image: "/styles/line-art-planta.png",
    description: "Ilustración minimalista de planta con una sola línea",
    prompt: "Ilustración minimalista de una planta en maceta en line art de una sola línea, fondo limpio, estilo moderno",
  },
  {
    id: "line-art-retrato",
    name: "Retrato Line Art",
    category: "Line Art",
    image: "/styles/line-art-retrato.png",
    description: "Retrato femenino minimalista en una sola línea",
    prompt: "Retrato femenino minimalista en line art de una sola línea, fondo suave, estética elegante",
  },
  {
    id: "retro-good-vibes",
    name: "Good Vibes Retro",
    category: "Retro",
    image: "/styles/retro-good-vibes.png",
    description: "Gráfico retro con sol y tipografía vintage",
    prompt: "Gráfico vintage estilo años 70 con sol y tipografía curva, textura desgastada, colores cálidos desaturados",
  },
  {
    id: "botanico-vintage",
    name: "Botánico Vintage",
    category: "Ilustración",
    image: "/styles/botanico-vintage.png",
    description: "Composición botánica con líneas finas y tonos naturales",
    prompt: "Ilustración botánica detallada con tinta fina y sombreado, paleta natural vintage, papel crema",
  },
  {
    id: "psicodelico-rostro-1",
    name: "Rostro Psicodélico I",
    category: "Psicodélico",
    image: "/styles/psicodelico-rostro-1.png",
    description: "Rostro cósmico con patrones y colores neón",
    prompt: "Arte psicodélico con rostro humano, patrones caleidoscópicos, colores neón, estética visionaria, detalle intrincado",
  },
  {
    id: "psicodelico-rostro-2",
    name: "Rostro Psicodélico II",
    category: "Psicodélico",
    image: "/styles/psicodelico-rostro-2.png",
    description: "Retrato caleidoscópico con ojos repetidos y halo de colores",
    prompt: "Retrato psicodélico con patrón de ojos repetidos, halo iridiscente, textura fractal, alto detalle",
  },
  {
    id: "pop-art-comic",
    name: "Pop Art Cómic",
    category: "Pop Art",
    image: "/styles/pop-art-comic.png",
    description: "Viñetas estilo cómic con tramas Ben-Day y onomatopeyas",
    prompt: "Ilustración pop art estilo cómic, puntos Ben-Day, colores planos brillantes, onomatopeyas como POW y CRASH",
  },
  {
    id: "mandala-floral",
    name: "Mandala Floral",
    category: "Ornamental",
    image: "/styles/mandala-floral.png",
    description: "Mandala floral simétrico con paleta vibrante",
    prompt: "Mandala floral simétrico, líneas finas y colores vivos, composición radial, estilo ornamental detallado",
  },
  {
    id: "bauhaus-geometrico",
    name: "Bauhaus Geométrico",
    category: "Geométrico",
    image: "/styles/bauhaus-geometrico.png",
    description: "Patrón modular con formas básicas y paleta primaria",
    prompt: "Patrón geométrico modular estilo Bauhaus con círculos, cuadrados y líneas negras, colores primarios rojo azul amarillo, fondo blanco",
  },
  {
    id: "alquimia-ojo-dorado",
    name: "Ojo Alquímico Dorado",
    category: "Místico",
    image: "/styles/alquimia-ojo-dorado.png",
    description: "Símbolos alquímicos con ojo central y lunas doradas",
    prompt: "Sello místico con símbolos alquímicos, fases lunares y ojo central, dorado metálico sobre fondo oscuro, textura serigráfica",
  },
  {
    id: "retro-endless-summer",
    name: "Endless Summer",
    category: "Retro",
    image: "/styles/retro-endless-summer.png",
    description: "Van playera retro con palmeras y sol",
    prompt: "Ilustración retro de una van en la playa con palmeras, sol al atardecer, textura vintage desgastada, paleta años 70",
  },
  // --- Adicionales existentes en public/styles ---
  {
    id: "pop-art-auto",
    name: "Auto Pop Art",
    category: "Pop Art",
    image: "/styles/pop-art-auto.png",
    description: "Auto clásico en estilo pop art con tramas retro",
    prompt: "Auto clásico en estilo pop art, puntos Ben-Day, colores planos vibrantes, alto contraste, estética cómic vintage",
  },
  {
    id: "pop-art-sandia",
    name: "Sandía Pop Art",
    category: "Pop Art",
    image: "/styles/pop-art-sandia.png",
    description: "Ilustración pop de sandía con colores intensos",
    prompt: "Ilustración de sandía en pop art, paleta brillante, puntos Ben-Day, contornos negros marcados, estética cómic",
  },
  {
    id: "retro-cassette",
    name: "Cassette Retro",
    category: "Retro",
    image: "/styles/retro-cassette.png",
    description: "Cinta de cassette vintage con textura desgastada",
    prompt: "Cassette vintage estilo años 80/90, textura desgastada, colores desaturados cálidos, diseño gráfico retro",
  },
  {
    id: "retro-typewriter",
    name: "Máquina de Escribir Retro",
    category: "Retro",
    image: "/styles/retro-typewriter.png",
    description: "Máquina de escribir clásica en estilo vintage",
    prompt: "Máquina de escribir clásica, estética vintage, grano y desgaste sutil, paleta retro, detalles tipográficos",
  },
  {
    id: "retro-vaporwave-synthwave",
    name: "Vaporwave Synthwave",
    category: "Retro",
    image: "/styles/retro-vaporwave-synthwave.png",
    description: "Paisaje synthwave con gradientes neón",
    prompt: "Paisaje synthwave vaporwave, gradientes neón, sol con líneas, grilla retro, estética 80s",
  },
  {
    id: "surrealista-guitarra",
    name: "Guitarra Surrealista",
    category: "Surrealista",
    image: "/styles/surrealista-guitarra.png",
    description: "Guitarra con elementos oníricos y composición fantástica",
    prompt: "Guitarra surrealista con elementos oníricos, deformaciones y ambiente de sueño, estilo Dalí moderno",
  },
  {
    id: "urbano-auto-clasico",
    name: "Auto Clásico Urbano",
    category: "Urbano",
    image: "/styles/urbano-auto-clasico.png",
    description: "Auto clásico con estética callejera",
    prompt: "Auto clásico en entorno urbano, estética street art, colores vibrantes, stencil y spray",
  },
  {
    id: "urbano-retrato",
    name: "Retrato Urbano",
    category: "Urbano",
    image: "/styles/urbano-retrato.png",
    description: "Retrato con estilo graffiti y arte callejero",
    prompt: "Retrato estilo urbano con graffiti, salpicaduras de pintura, contraste fuerte, arte callejero moderno",
  },
  {
    id: "pixel-art-colibri",
    name: "Colibrí Pixel Art",
    category: "Pixel Art",
    image: "/styles/pixel-art-colibri.png",
    description: "Colibrí en estilo 8-bit retro",
    prompt: "Colibrí en pixel art 8-bit, paleta vibrante, estilo videojuego retro, sprites limpios",
  },
  {
    id: "pixel-art-skater",
    name: "Skater Pixel Art",
    category: "Pixel Art",
    image: "/styles/pixel-art-skater.png",
    description: "Skater en estilo pixel art retro",
    prompt: "Skater en pixel art, 16x16/32x32 vibe, colores vivos, estilo arcade noventero",
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
  const [failedImageById, setFailedImageById] = useState<Record<string, boolean>>({})
  const [visibleCount, setVisibleCount] = useState(limit)

  const categories = Array.from(new Set(BASE_STYLES.map((style) => style.category)))

  const filteredStyles = selectedCategory
    ? BASE_STYLES.filter((style) => style.category === selectedCategory)
    : BASE_STYLES

  const displayedStyles = filteredStyles.slice(0, visibleCount)

  useEffect(() => {
    // Reset to initial limit when category changes or simplified prop changes
    setVisibleCount(limit)
  }, [selectedCategory, limit])

  const loadMoreStyles = () => {
    setVisibleCount((prev) => prev + 12)
  }

  const copyPrompt = async (style: any) => {
    try {
      await navigator.clipboard.writeText(style.prompt)
      setCopiedPrompt(style.id)
      setTimeout(() => setCopiedPrompt(null), 2000)
    } catch (err) {
      console.error("Failed to copy prompt:", err)
    }
  }

  const handleCardClick = async (style: any) => {
    await copyPrompt(style)
    if (onStyleSelect) {
      onStyleSelect(style.image)
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
            onClick={() => handleCardClick(style)}
          >
            <div className="relative aspect-square">
              <Image
                src={failedImageById[style.id] ? "/placeholder.svg" : (style.image || "/placeholder.svg")}
                alt={style.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 50vw, 33vw"
                onClick={(e) => { e.stopPropagation(); handleCardClick(style) }}
                onError={() => setFailedImageById((prev) => ({ ...prev, [style.id]: true }))}
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

      {!simplified && visibleCount < filteredStyles.length && (
        <div className="text-center">
          <Button variant="outline" onClick={loadMoreStyles}>
            Ver más estilos
          </Button>
        </div>
      )}
    </div>
  )
}
