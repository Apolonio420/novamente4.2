"use client"

import { cn } from "@/lib/utils"

const steps = [
  { id: "garment", label: "Prenda" },
  { id: "side", label: "Lado" },
  { id: "size", label: "Tamaño" },
  { id: "art", label: "Imagen" },
  { id: "mockup", label: "Mockup" },
  { id: "double", label: "Doble" },
  { id: "checkout", label: "Comprar" },
] as const

function progressFromStep(step: string): string {
  const order = ["garment", "side", "size", "art", "mockup", "double", "checkout"]
  const i = Math.max(0, order.indexOf(step))
  return `${((i + 1) / order.length) * 100}%`
}

interface StickyStepperProps {
  current: string
  canJumpTo: (id: string) => boolean
}

export function StickyStepper({ current, canJumpTo }: StickyStepperProps) {
  return (
    <div className="sticky top-14 z-30 bg-zinc-950/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/50 border-b border-zinc-800">
      <div className="mx-auto max-w-5xl px-4 py-2 flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {steps.map((s, idx) => {
          const active = current === s.id
          const enabled = canJumpTo(s.id)
          return (
            <button
              key={s.id}
              disabled={!enabled}
              onClick={() => {
                const id = `step-${s.id}`
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
              }}
              className={cn(
                "text-xs rounded-full px-3 py-1.5 border transition-colors",
                active
                  ? "border-violet-500 text-violet-300 bg-violet-500/10"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600",
                !enabled && "opacity-50 cursor-not-allowed"
              )}
              aria-current={active ? "step" : undefined}
            >
              {idx + 1}. {s.label}
            </button>
          )
        })}
      </div>
      {/* Barra de progreso */}
      <div className="h-1 bg-zinc-800">
        <div
          className="h-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-300"
          style={{ width: progressFromStep(current) }}
        />
      </div>
    </div>
  )
}

