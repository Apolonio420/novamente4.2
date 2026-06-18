"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowRight, Wand2, Upload, ImagePlus } from "lucide-react"

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
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const launch = (text?: string) => {
    const p = (text ?? prompt).trim()
    setGoing(true)
    router.push(p.length >= 3 ? `/crear?prompt=${encodeURIComponent(p.slice(0, 500))}` : "/crear")
  }

  // Subir imagen propia → diseñar la prenda directo con esa imagen.
  const handleFile = async (file: File) => {
    setUploadError(null)
    if (!file.type.startsWith("image/")) {
      setUploadError("Tiene que ser una imagen (JPG, PNG o WebP).")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("La imagen supera los 8 MB.")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/public/design/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "No se pudo subir la imagen")
      }
      router.push(`/crear?image=${encodeURIComponent(data.url)}`)
    } catch (e) {
      setUploading(false)
      setUploadError(e instanceof Error ? e.message : "Error subiendo la imagen")
    }
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

        {/* Separador "o" + subir imagen propia */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] uppercase tracking-wider text-zinc-500">o ya tenés tu diseño</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ""
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-violet-500/50 hover:bg-white/10 active:scale-[0.98] disabled:opacity-60 sm:w-auto"
          data-cta="landing-crear-upload"
        >
          {uploading ? (
            <>
              <Upload className="h-4 w-4 animate-pulse" /> Subiendo tu imagen…
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4" /> Subí tu propia imagen y diseñá la prenda
            </>
          )}
        </button>
        {uploadError && (
          <p className="mt-2 text-xs text-red-400">{uploadError}</p>
        )}

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
