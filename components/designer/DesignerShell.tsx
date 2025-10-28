"use client"

import React, { useRef } from "react"
import { StickyCTA } from "@/components/designer/StickyCTA"
import MockupComposer, { MockupComposerHandle } from "@/components/designer/MockupComposer"
import { useWizard } from "@/components/designer/useWizard"

export default function DesignerShell() {
  const { step, go } = useWizard()
  // Estos flags deberían provenir del estado real del diseñador
  const hasGarment = true
  const hasSide = true
  const hasSize = true
  const hasImage = true

  const composerRef = useRef<MockupComposerHandle>(null)

  const canContinue =
    (step === "garment" && hasGarment) ||
    (step === "side" && hasSide) ||
    (step === "size" && hasSize) ||
    (step === "art" && hasImage) ||
    step === "mockup" ||
    step === "double" ||
    step === "checkout"

  async function primaryAction() {
    if (step === "garment") return go("side")
    if (step === "side") return go("size")
    if (step === "size") return hasImage ? go("art") : undefined
    if (step === "art") return composerRef.current?.generate()
    if (step === "mockup") return go("double")
    if (step === "double") return go("checkout")
  }

  const secondaryEnabled = !(step === "art") || !!composerRef.current?.isReady

  return (
    <>
      {/* Bloques/Secciones existentes */}
      <section id="step-art" />

      <section id="step-mockup">
        <MockupComposer
          ref={composerRef}
          garment={{}}
          color="white"
          side="front"
          selectedRegion="R2_center"
          selectedImage={{ url: "" }}
          onComposed={() => {}}
        />
      </section>

      <StickyCTA
        state={{
          step,
          canContinue,
          primaryAction,
          secondaryAction: () => go("double"),
          secondaryEnabled,
          loading: !!composerRef.current?.isGenerating,
        }}
      />
    </>
  )
}


