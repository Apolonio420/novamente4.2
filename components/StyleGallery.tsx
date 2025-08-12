"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StyleGalleryProps {
  limit?: number
  simplified?: boolean
  directToCustomization?: boolean
}

const styles = [
  {
    id: "geometrico-colibri",
    name: "Geométrico Colibrí",
    category: "Geométrico",
    image: "/styles/geometrico-colibri.png",
    prompt: "Un colibrí en estilo geométrico con formas angulares y colores vibrantes",
  },
  {
    id: "geometrico-leon",
    name: "Geométrico León",
    category: "Geométrico",
    image: "/styles/geometrico-leon.png",
    prompt: "León majestuoso en estilo geométrico con patrones triangulares y colores dorados",
  },
  {
    id: "geometrico-aguila",
    name: "Geométrico Águila",
    category: "Geométrico",
    image: "/styles/geometrico-aguila.png",
    prompt: "Águila poderosa en estilo geométrico con alas desplegadas y formas abstractas",
  },
  {
    id: "pop-art-sandia",
    name: "Pop Art Sandía",
    category: "Pop Art",
    image: "/styles/pop-art-sandia.png",
    prompt: "Sandía en estilo pop art con colores neón y efectos de cómic retro",
  },
  {
    id: "pop-art-retrato",
    name: "Pop Art Retrato",
    category: "Pop Art",
    image: "/styles/pop-art-retrato.png",
    prompt: "Retrato en estilo pop art con colores saturados y efectos de serigrafía",
  },
  {
    id: "pop-art-auto",
    name: "Pop Art Auto",
    category: "Pop Art",
    image: "/styles/pop-art-auto.png",
    prompt: "Auto clásico en estilo pop art con colores brillantes y efectos vintage",
  },
  {
    id: "pixel-art-colibri",
    name: "Pixel Art Colibrí",
    category: "Pixel Art",
    image: "/styles/pixel-art-colibri.png",
    prompt: "Colibrí en estilo pixel art 8-bit con colores retro de videojuegos",
  },
  {
    id: "pixel-art-skater",
    name: "Pixel Art Skater",
    category: "Pixel Art",
    image: "/styles/pixel-art-skater.png",
    prompt: "Skater en estilo pixel art con movimiento dinámico y estética retro gaming",
  },
  {
    id: "pixel-art-astronauta",
    name: "Pixel Art Astronauta",
    category: "Pixel Art",
    image: "/styles/pixel-art-astronauta.png",
    prompt: "Astronauta en estilo pixel art flotando en el espacio con estrellas pixeladas",
  },
  {
    id: "urbano-retrato",
    name: "Urbano Retrato",
    category: "Urbano",
    image: "/styles/urbano-retrato.png",
    prompt: "Retrato urbano con graffiti de fondo y estética street art moderna",
  },
  {
    id: "urbano-auto-clasico",
    name: "Urbano Auto Clásico",
    category: "Urbano",
    image: "/styles/urbano-auto-clasico.png",
    prompt: "Auto clásico en ambiente urbano con graffiti y estilo street art",
  },
  {
    id: "urbano-muscle-car",
    name: "Urbano Muscle Car",
    category: "Urbano",
    image: "/styles/urbano-muscle-car.png",
    prompt: "Muscle car americano en escenario urbano con efectos de velocidad",
  },
  {
    id: "retro-vaporwave-synthwave",
    name: "Retro Vaporwave",
    category: "Retro",
    image: "/styles/retro-vaporwave-synthwave.png",
    prompt: "Paisaje vaporwave con neones, palmeras y estética synthwave de los 80s",
  },
  {
    id: "retro-vaporwave-palmera",
    name: "Retro Palmera",
    category: "Retro",
    image: "/styles/retro-vaporwave-palmera.png",
    prompt: "Palmera en estilo vaporwave con colores neón y grid retro futurista",
  },
  {
    id: "retro-cassette",
    name: "Retro Cassette",
    category: "Retro",
    image: "/styles/retro-cassette.png",
    prompt: "Cassette vintage con estética retro de los 80s y colores pastel",
  },
  {
    id: "retro-typewriter",
    name: "Retro Typewriter",
    category: "Retro",
    image: "/styles/retro-typewriter.png",
    prompt: "Máquina de escribir vintage con estética retro y detalles nostálgicos",
  },
  {
    id: "surrealista-leopardo",
    name: "Surrealista Leopardo",
    category: "Surrealista",
    image: "/styles/surrealista-leopardo.png",
    prompt: "Leopardo surrealista con elementos oníricos y colores psicodélicos",
  },
  {
    id: "surrealista-guitarra",
    name: "Surrealista Guitarra",
    category: "Surrealista",
    image: "/styles/surrealista-guitarra.png",
    prompt: "Guitarra surrealista con formas imposibles y elementos fantásticos",
  },
  {
    id: "acuarela-paisaje-japones",
    name: "Acuarela Paisaje Japonés",
    category: "Acuarela",
    image: "/styles/acuarela-paisaje-japones.png",
    prompt: "Paisaje japonés en acuarela con montañas, sakura y estilo tradicional",
  },
  {
    id: "acuarela-pueblo-costero",
    name: "Acuarela Pueblo Costero",
    category: "Acuarela",
    image: "/styles/acuarela-pueblo-costero.png",
    prompt: "Pueblo costero mediterráneo en acuarela con colores suaves y luminosos",
  },
  {
    id: "acuarela-colibri",
    name: "Acuarela Colibrí",
    category: "Acuarela",
    image: "/styles/acuarela-colibri.png",
    prompt: "Colibrí delicado en acuarela con colores fluidos y técnica tradicional",
  },
  {
    id: "acuarela-leon",
    name: "Acuarela León",
    category: "Acuarela",
    image: "/styles/acuarela-leon.png",
    prompt: "León majestuoso en acuarela con melena dorada y técnica artística suave",
  },
  {
    id: "acuarela-ciudad",
    name: "Acuarela Ciudad",
    category: "Acuarela",
    image: "/styles/acuarela-ciudad.png",
    prompt: "Skyline urbano en acuarela con reflejos y colores atmosféricos",
  },
  {
    id: "japones-paisaje-tradicional",
    name: "Japonés Paisaje Tradicional",
    category: "Japonés",
    image: "/styles/japones-paisaje-tradicional.png",
    prompt: "Paisaje japonés tradicional con monte Fuji, pagoda y cerezos en flor",
  },
  {
    id: "japones-gran-ola",
    name: "Japonés Gran Ola",
    category: "Japonés",
    image: "/styles/japones-gran-ola.png",
    prompt: "Gran ola estilo Hokusai con espuma blanca y azules profundos tradicionales",
  },
]

const categories = ["Todos", ...Array.from(new Set(styles.map((style) => style.category)))]

export function StyleGallery({ limit, simplified = false, directToCustomization = false }: StyleGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [copiedStyles, setCopiedStyles] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const filteredStyles =
    selectedCategory === "Todos" ? styles : styles.filter((style) => style.category === selectedCategory)

  const displayedStyles = limit ? filteredStyles.slice(0, limit) : filteredStyles

  const handleStyleClick = async (style: any) => {
    try {
      await navigator.clipboard.writeText(style.prompt)

      setCopiedStyles((prev) => new Set(prev).add(style.id))

      toast({
        title: "Prompt copiado",
        description: `"${style.prompt}" se copió al portapapeles`,
      })

      // Remover el estado de copiado después de 2 segundos
      setTimeout(() => {
        setCopiedStyles((prev) => {
          const newSet = new Set(prev)
          newSet.delete(style.id)
          return newSet
        })
      }, 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        title: "Error",
        description: "No se pudo copiar el prompt al portapapeles",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {!simplified && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedStyles.map((style) => {
          const isCopied = copiedStyles.has(style.id)

          return (
            <Card
              key={style.id}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 group"
              onClick={() => handleStyleClick(style)}
            >
              <CardContent className="p-3">
                <div className="aspect-square relative mb-3 rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={style.image || "/placeholder.svg"}
                    alt={style.name}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />

                  {/* Overlay con icono de copiar */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                        {isCopied ? (
                          <Check className="w-6 h-6 text-green-600" />
                        ) : (
                          <Copy className="w-6 h-6 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-sm leading-tight">{style.name}</h3>
                  {!simplified && (
                    <Badge variant="secondary" className="text-xs">
                      {style.category}
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2">{style.prompt}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
