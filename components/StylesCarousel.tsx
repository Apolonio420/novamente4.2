"use client"

import { memo, useMemo, useCallback, useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface StylesCarouselProps {
  onStyleSelect?: (styleId: string) => void
  selectedStyle?: string
  compact?: boolean
}

function _StylesCarousel({ onStyleSelect, selectedStyle, compact = false }: StylesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const styles = useMemo(() => [
    { id: "linear-min", name: "Minimalista Lineal", desc: "Líneas limpias, formas simples" },
    { id: "line-art", name: "Line Art", desc: "Trazos finos, estilo tatuaje" },
    { id: "sticker", name: "Sticker Style", desc: "Colores planos, borde grueso" },
    { id: "watercolor", name: "Acuarela", desc: "Pinceladas suaves, colores diluidos" },
    { id: "geometric", name: "Geométrico", desc: "Formas abstractas, patrones" },
    { id: "vintage", name: "Vintage", desc: "Estilo retro, colores sepia" },
    { id: "neon", name: "Neon", desc: "Colores brillantes, efectos glow" },
    { id: "sketch", name: "Sketch", desc: "Boceto a lápiz, líneas sueltas" }
  ], [])

  // Detectar overflow y posición del scroll
  const checkScroll = () => {
    if (!scrollContainerRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    const hasHorizontalOverflow = scrollWidth > clientWidth
    
    setHasOverflow(hasHorizontalOverflow)
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
    }
    
    // Check inicial después de que el contenido se renderice
    const timer = setTimeout(checkScroll, 100)
    
    return () => {
      window.removeEventListener('resize', checkScroll)
      if (container) {
        container.removeEventListener('scroll', checkScroll)
      }
      clearTimeout(timer)
    }
  }, [])

  const handleStyleClick = useCallback((styleId: string) => {
    if (onStyleSelect) {
      onStyleSelect(styleId)
    }
  }, [onStyleSelect])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  return (
    <div>
      <h3 className={`mb-1.5 ${compact ? "text-xs" : "text-sm"} text-zinc-300 font-medium`}>
        Estilos artísticos Novamente
      </h3>
      <div 
        className="relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Gradiente izquierdo */}
        {hasOverflow && canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-1.5 w-8 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-10" />
        )}
        
        {/* Gradiente derecho */}
        {hasOverflow && canScrollRight && (
          <div className="absolute right-0 top-0 bottom-1.5 w-8 bg-gradient-to-l from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-10" />
        )}

        {/* Flecha izquierda */}
        {hasOverflow && canScrollLeft && (
          <button
            onClick={scrollLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-zinc-900/60 text-zinc-100 hover:bg-zinc-800/70 transition-opacity duration-300 backdrop-blur-sm z-20 ${
              isHovering ? 'lg:opacity-100' : 'lg:opacity-0'
            } opacity-100 md:opacity-100`}
            aria-label="Desplazar izquierda"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        )}

        {/* Flecha derecha */}
        {hasOverflow && canScrollRight && (
          <button
            onClick={scrollRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-zinc-900/60 text-zinc-100 hover:bg-zinc-800/70 transition-opacity duration-300 backdrop-blur-sm z-20 ${
              isHovering ? 'lg:opacity-100' : 'lg:opacity-0'
            } opacity-100 md:opacity-100`}
            aria-label="Desplazar derecha"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto pb-1.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => handleStyleClick(style.id)}
              className={`snap-start min-w-[200px] rounded-lg border px-3 py-2 text-left transition-colors ${
                selectedStyle === style.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800"
              }`}
            >
              <div className="text-xs font-medium">{style.name}</div>
              <div className="text-[11px] text-zinc-400">{style.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export const StylesCarousel = memo(_StylesCarousel)
