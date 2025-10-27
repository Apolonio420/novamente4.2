"use client"

import { memo, useMemo, useCallback } from "react"

interface StylesCarouselProps {
  onStyleSelect?: (styleId: string) => void
  selectedStyle?: string
  compact?: boolean
}

function _StylesCarousel({ onStyleSelect, selectedStyle, compact = false }: StylesCarouselProps) {
  const styles = useMemo(() => [
    { id: "linear-min", name: "Minimalista Lineal", desc: "Líneas limpias, formas simples" },
    { id: "line-art", name: "Line Art", desc: "Trazos finos, estilo tatuaje" },
    { id: "sticker", name: "Sticker Style", desc: "Colores planos, borde grueso" },
    { id: "watercolor", name: "Acuarela", desc: "Pinceladas suaves, colores diluidos" },
    { id: "geometric", name: "Geométrico", desc: "Formas abstractas, patrones" },
    { id: "vintage", name: "Vintage", desc: "Estilo retro, colores sepia" },
    { id: "neon", name: "Neon", desc: "Colores brillantes, efectos glow" },
    { id: "sketch", name: "Sketch", desc: "Boceto a lápiz, líneas sueltas" }
  ]

  const handleStyleClick = (styleId: string) => {
    if (onStyleSelect) {
      onStyleSelect(styleId)
    }
  }, [onStyleSelect])

  return (
    <div>
      <h3 className={`mb-1.5 ${compact ? "text-xs" : "text-sm"} text-zinc-300 font-medium`}>
        Estilos artísticos NovaMente
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
  )
}

export const StylesCarousel = memo(_StylesCarousel)
