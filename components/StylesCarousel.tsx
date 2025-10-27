"use client"

interface StylesCarouselProps {
  onStyleSelect?: (styleId: string) => void
  selectedStyle?: string
}

export function StylesCarousel({ onStyleSelect, selectedStyle }: StylesCarouselProps) {
  const styles = [
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
  }

  return (
    <div>
      <h3 className="mb-2 text-sm text-zinc-300 font-medium">Estilos artísticos NovaMente</h3>
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => handleStyleClick(style.id)}
            className={`snap-start min-w-[220px] rounded-lg border px-3 py-2 text-left transition-colors ${
              selectedStyle === style.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800"
            }`}
          >
            <div className="text-sm font-medium">{style.name}</div>
            <div className="text-xs text-zinc-400">{style.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
