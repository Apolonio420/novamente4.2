"use client"

import React, { forwardRef, useImperativeHandle, useState } from "react"
import { scrollToId } from "@/lib/ui/scroll"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"

export type MockupComposerHandle = {
  generate: () => Promise<void>
  isGenerating: boolean
  isReady: boolean
}

type Props = {
  garment: any
  color: string
  side: "front" | "back"
  selectedRegion: "R1_center" | "R1_left" | "R2_center" | "R3_center"
  selectedImage?: { url: string; id?: string }
  onComposed?: (url: string) => void
  showPersistentCTA?: boolean
}

const MockupComposer = forwardRef<MockupComposerHandle, Props>(function MockupComposer(
  { garment, color, side, selectedRegion, selectedImage, onComposed, showPersistentCTA = true },
  ref
) {
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  async function handleGenerateMockup() {
    try {
      setLoading(true)
      setReady(false)
      if (!selectedImage?.url) throw new Error("Elegí/confirmá una imagen.")
      if (!selectedRegion) throw new Error("Elegí tamaño/región (R1/R2/R3).")

      const res = await fetch("/api/generate-stamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garment, color, side, region: selectedRegion, image: selectedImage.url }),
      })
      if (!res.ok) {
        let msg = "Error generando mockup"
        try {
          const j = await res.json()
          if (j?.message) msg = j.message
        } catch {}
        throw new Error(msg)
      }
      const { url } = await res.json()
      onComposed?.(url)
      setReady(true)
      toast.success("Mockup generado ✅")
      scrollToId("step-mockup")
    } catch (e: any) {
      const msg = e?.message ?? "Error generando mockup"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      generate: handleGenerateMockup,
      isGenerating: loading,
      isReady: ready,
    }),
    [loading, ready, selectedRegion, selectedImage, garment, color, side]
  )

  const canGenerate = selectedImage?.url && selectedRegion && !loading

  return (
    <div className="space-y-6">
      {/* Contenido del mockup composer */}
      <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-4">
        <div className="aspect-[5/6] w-full overflow-hidden rounded-md bg-zinc-900/40 grid place-items-center">
          {ready ? (
            <div className="text-center text-zinc-400">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-violet-500" />
              <p className="text-sm">Mockup generado exitosamente</p>
            </div>
          ) : (
            <div className="text-center text-zinc-500">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-zinc-800/70 mx-auto mb-2" />
              <span className="text-xs">Tu mockup aparecerá aquí</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA persistente al final del panel */}
      {showPersistentCTA && (
        <div className="sticky bottom-4 z-30">
          <Button
            onClick={handleGenerateMockup}
            disabled={!canGenerate}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl py-3 px-6 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            aria-disabled={!canGenerate || undefined}
            aria-busy={loading || undefined}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando mockup...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                🚀 Generar Mockup
              </span>
            )}
          </Button>
          
          {!canGenerate && !loading && (
            <p className="text-center text-xs text-zinc-500 mt-2">
              {!selectedImage?.url ? "Seleccioná una imagen" : "Elegí tamaño y región"}
            </p>
          )}
        </div>
      )}
    </div>
  )
})

export default MockupComposer


