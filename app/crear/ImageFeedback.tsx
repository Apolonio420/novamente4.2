"use client"

import { useMemo, useState } from "react"
import { FEEDBACK_RATINGS, type FeedbackOperation, type FeedbackRating } from "@/lib/designer/image-feedback"

/**
 * Tres caritas debajo de cada imagen generada o editada en /crear (pedido de
 * Juan 05/11/2026, R-2026-019). Primer canal de feedback sobre la calidad de
 * las imágenes del Studio. Se puede cambiar de carita: el id es por imagen y
 * el endpoint hace upsert.
 *
 * Colores con tokens (border / muted / primary), no zinc fijo: la web está
 * pasando a tema claro y este componente no tiene que tocarse para eso.
 */
export function ImageFeedback({
  imageUrl,
  prompt,
  operation,
  garmentType,
  garmentColor,
}: {
  imageUrl: string
  prompt?: string
  operation: FeedbackOperation
  garmentType?: string
  garmentColor?: string
}) {
  const id = useMemo(() => crypto.randomUUID(), [])
  const [rating, setRating] = useState<FeedbackRating | null>(null)

  function vote(value: FeedbackRating) {
    setRating(value)
    fetch("/api/public/design/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, rating: value, operation, prompt: prompt ?? null, imageUrl, garmentType, garmentColor }),
    }).catch(() => {})
  }

  return (
    <div className="mt-2 flex items-center gap-1.5" data-testid="image-feedback">
      <span className="text-xs opacity-70 mr-0.5">{rating ? "¡Gracias!" : "¿Qué te pareció?"}</span>
      {FEEDBACK_RATINGS.map((r) => {
        const selected = rating === r.value
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => vote(r.value)}
            aria-label={r.label}
            aria-pressed={selected}
            title={r.label}
            className={`h-8 w-8 rounded-full border text-base leading-none transition ${
              selected
                ? "border-primary bg-primary/20 scale-110"
                : rating
                  ? "border-border/40 opacity-40 hover:opacity-100"
                  : "border-border/40 hover:bg-muted/40 hover:scale-110"
            }`}
          >
            {r.emoji}
          </button>
        )
      })}
    </div>
  )
}
