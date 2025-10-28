"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { useEffect, useMemo } from "react"

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
    /** Habilita/deshabilita el botón secundario explícitamente (si no se pasa, siempre habilitado cuando existe) */
    secondaryEnabled?: boolean
  }
}

export function StickyCTA({ state }: StickyCTAProps) {
  const label = state.label ?? mapLabel[state.step] ?? "Continuar"
  const secondaryEnabled = state.secondaryEnabled ?? true

  // Atajo de teclado: Ctrl/Cmd + Enter en step "art" para disparar acción primaria
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.ctrlKey || e.metaKey
      if (state.step === "art" && meta && e.key === "Enter") {
        e.preventDefault()
        if (state.canContinue && !state.loading) {
          state.primaryAction()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [state.step, state.canContinue, state.loading, state.primaryAction])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur border-t border-zinc-800 px-safe">
      <div className="mx-auto max-w-5xl px-4 py-3 flex gap-2 items-center">
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
          aria-disabled={!state.canContinue || undefined}
          aria-busy={state.loading || undefined}
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
            disabled={!secondaryEnabled}
            className={cn(
              "rounded-lg border border-zinc-700 px-4 py-3 text-zinc-300 text-sm",
              !secondaryEnabled && "opacity-50 cursor-not-allowed"
            )}
            aria-disabled={!secondaryEnabled || undefined}
          >
            Siguiente
          </button>
        )}

        {/* Hint de gating en step "art" cuando no puede continuar */}
        {!state.canContinue && state.step === "art" && (
          <span className="ml-2 text-[11px] text-zinc-500">
            Generá el mockup para continuar
          </span>
        )}
      </div>
    </div>
  )
}

