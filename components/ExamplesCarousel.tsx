"use client"

import { memo, useMemo } from "react"

interface ExamplesCarouselProps {
  onExampleClick?: (example: string) => void
  compact?: boolean
}

function _ExamplesCarousel({ onExampleClick, compact = false }: ExamplesCarouselProps) {
  const examples = useMemo(() => [
    "Un león majestuoso con corona dorada",
    "Mandala geométrico intrincado",
    "Gato ninja con katana",
    "Búho sabio leyendo",
    "Dragón bebé sonriente",
    "Águila con alas extendidas",
    "Robot futurista minimalista",
    "Flor de loto zen",
    "Calavera mexicana colorida",
    "Montañas nevadas minimalistas"
  ], [])

  const handleExampleClick = (example: string) => {
    if (onExampleClick) {
      onExampleClick(example)
    }
  }

  return (
    <div>
      <h3 className={`mb-1.5 ${compact ? "text-xs" : "text-sm"} text-zinc-300 font-medium`}>
        Ejemplos rápidos
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {examples.map((example) => (
          <button
            key={example}
            onClick={() => handleExampleClick(example)}
            className="snap-start min-w-max rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 transition-colors"
            data-example={example}
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  )
}

export const ExamplesCarousel = memo(_ExamplesCarousel)
