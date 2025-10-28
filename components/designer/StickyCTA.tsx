"use client"

import { cn } from "@/lib/utils"
import { Loader2, Sparkles, ArrowRight } from "lucide-react"
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

  // Determinar si es step "art" para jerarquía visual especial
  const isArtStep = state.step === "art"
  const isMockupReady = state.step === "art" && state.secondaryEnabled

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur border-t border-zinc-800 px-safe">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex gap-3 items-center">
          {/* Botón primario - "Generar Mockup" en step art, o acción principal en otros */}
          <button
            onClick={state.primaryAction}
            disabled={!state.canContinue || state.loading}
            className={cn(
              "flex-1 rounded-xl py-3.5 text-white font-medium shadow-lg transition-all duration-300",
              isArtStep 
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transform hover:scale-[1.02] hover:shadow-xl"
                : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95",
              state.canContinue
                ? ""
                : "bg-zinc-700 cursor-not-allowed",
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
              <span className="flex items-center justify-center gap-2">
                {isArtStep && <Sparkles className="h-4 w-4" />}
                {label}
              </span>
            )}
          </button>

          {/* Botón secundario - "Siguiente" */}
          {state.secondaryAction && (
            <button
              onClick={state.secondaryAction}
              disabled={!secondaryEnabled}
              className={cn(
                "rounded-xl border px-4 py-3.5 text-sm font-medium transition-all duration-300",
                isArtStep
                  ? "border-zinc-600 text-zinc-300 hover:border-zinc-500 hover:text-zinc-200"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-zinc-200",
                !secondaryEnabled && "opacity-50 cursor-not-allowed border-zinc-800 text-zinc-600"
              )}
              aria-disabled={!secondaryEnabled || undefined}
            >
              <span className="flex items-center gap-1.5">
                Siguiente
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          )}

          {/* Hint de gating en step "art" cuando no puede continuar */}
          {!state.canContinue && state.step === "art" && (
            <span className="ml-2 text-[11px] text-zinc-500 whitespace-nowrap">
              Generá el mockup para continuar
            </span>
          )}
        </div>

        {/* Indicador de atajo de teclado para step art */}
        {isArtStep && state.canContinue && !state.loading && (
          <div className="mt-2 text-center">
            <span className="text-[10px] text-zinc-600">
              Presiona <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">Enter</kbd> para generar
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

