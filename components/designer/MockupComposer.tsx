"use client"

import React, { forwardRef, useImperativeHandle, useState } from "react"
import { scrollToId } from "@/lib/ui/scroll"
import { toast } from "sonner"

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
}

const MockupComposer = forwardRef<MockupComposerHandle, Props>(function MockupComposer(
  { garment, color, side, selectedRegion, selectedImage, onComposed },
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

  // Render previo: no añadimos botones duplicados aquí
  return null
})

export default MockupComposer


