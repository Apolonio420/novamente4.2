"use client"

import { useState } from "react"

export type Step = "garment" | "side" | "size" | "art" | "mockup" | "double" | "checkout"

export function useWizard() {
  const [step, setStep] = useState<Step>("garment")

  const go = (next: Step) => {
    setStep(next)
    
    // Scroll and focus after a small delay
    setTimeout(() => {
      const id = `step-${next}`
      import("@/lib/ui/scroll").then(({ scrollToIdAndFocus }) => {
        scrollToIdAndFocus(id)
      })
    }, 50)
  }

  return { step, go, setStep }
}

