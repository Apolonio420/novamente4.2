"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowRight, Wand2 } from "lucide-react"

/**
 * Launcher del generador en la landing.
 * Reemplaza al generador viejo embebido: acá solo capturamos la idea y
 * mandamos al usuario a /crear (?prompt=) donde el flujo completo
 * (generar → editar → mockup → lifestyle → try-on → comprar) vive y se
 * mantiene UNA sola vez.
 */
const IDEAS = [
  "Tigre psicodélico años 70, colores vibrantes",
  "Gato astronauta flotando en el espacio, estilo retro",
  "Dragón japonés minimalista, línea continua",
  "Corazón de fuego estilo tattoo old school",
  "Mate y termo, ilustración kawaii",
  "Calavera con flores, estilo mexicano",
]

export function CrearLauncher() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [going, setGoing] = useState(false)

  const launch = (text?: string) => {
    const p = (text ?? prompt).trim()
    setGoing(true)
    router.push(p.length >= 3 ? `/crear?prompt=${encodeURIComponent(p.slice(0, 500))}` : "/crear")
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-violet-600/[0.12] via-zinc-900/80 to-zinc-900/80 p-6 md:p-10">
      {/* glow decorativo */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 mb-4">
          <Sparkles className="h-3.5 w-3.5" /> Gratis · sin registro · 10 segundos
        </div>
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
          Describí tu idea, la IA la diseña
        </h2>
        <p className="mt-2 text-sm md:text-base text-zinc-400">
          Y la ves al instante en una prenda real. Editala, probátela con tu selfie y pedila.
        </p>

        {/* Input principal */}
        <form
          onSubmit={(e) => { e.preventDefault(); launch() }}
          className="mt-6 flex flex-col sm:flex-row items-stretch gap-2"
        >
          <div className="relative flex-1">
            <Wand2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: tigre psicodélico años 70…"
              maxLength={500}
              className="w-full rounded-xl border border-white/15 bg-zinc-950/80 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              data-cta="landing-crear-input"
            />
          </div>
          <button
            type="submit"
            disabled={going}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-500 active:scale-[0.98] disabled:opacity-60"
            data-cta="landing-crear-submit"
          >
            {going ? "Abriendo…" : "Crear gratis"} <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Ideas para arrancar */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {IDEAS.slice(0, 4).map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => launch(idea)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-violet-500/40 hover:text-white"
            >
              {idea.split(",")[0]}
            </button>
          ))}
        </div>

        <p className="mt-6 text-[11px] text-zinc-500">
          Diseño con IA → mockup en prenda real → probátelo con tu selfie → llega en 24-48h
        </p>
      </div>
    </div>
  )
}
