"use client"

import React, { useRef } from "react"
import { StickyCTA } from "@/components/designer/StickyCTA"
import MockupComposer, { MockupComposerHandle } from "@/components/designer/MockupComposer"
import { useWizard } from "@/components/designer/useWizard"
import { Section } from "@/components/ui/Section"

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
    <div className="min-h-screen bg-zinc-950">
      {/* Contenido principal con padding para el sticky CTA */}
      <div className="pb-24">
        <Section className="py-6 md:py-8">
          {/* Bloques/Secciones existentes */}
          <section id="step-art" className="mb-8">
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-4">
              <h2 className="text-lg font-semibold mb-4 text-zinc-100">Selección de Imagen y Tamaño</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Elegí tu imagen y el tamaño del estampado para generar el mockup.
              </p>
              {/* Aquí irían los selectores de imagen y tamaño */}
              <div className="h-32 bg-zinc-900/40 rounded-lg flex items-center justify-center text-zinc-500 text-sm">
                Selectores de imagen y tamaño
              </div>
            </div>
          </section>

          <section id="step-mockup" className="mb-8">
            <MockupComposer
              ref={composerRef}
              garment={{}}
              color="white"
              side="front"
              selectedRegion="R2_center"
              selectedImage={{ url: "" }}
              onComposed={() => {}}
              showPersistentCTA={true}
            />
          </section>
        </Section>
      </div>

      {/* Sticky CTA */}
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
    </div>
  )
}


