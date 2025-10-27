"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const mapLabel: Record<string, string> = {
  garment: "Elegir lado",
  side: "Elegir tamaño",
  size: "Elegir/Confirmar imagen",
  art: "🚀 Generar Mockup",
  mockup: "Continuar a Doble estampado",
  double: "Ir al Checkout",
  checkout: "Finalizar compra",
}

interface StickyCTAProps {
  state: {
    step: string
    canContinue: boolean
    primaryAction: () => void
    secondaryAction?: () => void
    loading?: boolean
    label?: string
  }
}

export function StickyCTA({ state }: StickyCTAProps) {
  const label = state.label ?? mapLabel[state.step] ?? "Continuar"

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur border-t border-zinc-800 px-safe">
      <div className="mx-auto max-w-5xl px-4 py-3 flex gap-2">
        <button
          onClick={state.primaryAction}
          disabled={!state.canContinue || state.loading}
          className={cn(
            "flex-1 rounded-lg py-3 text-white font-medium shadow-lg transition",
            state.canContinue
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95"
              : "bg-zinc-700",
            state.loading && "opacity-70"
          )}
        >
          {state.loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando…
            </span>
          ) : (
            label
          )}
        </button>
        {state.secondaryAction && (
          <button
            onClick={state.secondaryAction}
            className="rounded-lg border border-zinc-700 px-4 py-3 text-zinc-300 text-sm"
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  )
}

