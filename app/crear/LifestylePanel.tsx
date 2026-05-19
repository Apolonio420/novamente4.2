"use client"

import { useState } from "react"
import { Download, Share2, Loader2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DesignSession } from "./page"

type Scenario = "palermo_street" | "rooftop_sunset" | "caminito" | "fan_zone" | "cafe_san_telmo"

interface ScenarioCard {
  id: Scenario
  label: string
  description: string
  emoji: string
}

const SCENARIOS: ScenarioCard[] = [
  {
    id: "palermo_street",
    label: "Palermo Street",
    description: "Calle soleada con cafés y árboles, golden hour",
    emoji: "🌇",
  },
  {
    id: "rooftop_sunset",
    label: "Rooftop Sunset",
    description: "Terraza porteña con vista a la ciudad, cielo magic hour",
    emoji: "🏙️",
  },
  {
    id: "caminito",
    label: "Caminito",
    description: "Casas coloridas de La Boca, luz cálida de tarde",
    emoji: "🎨",
  },
  {
    id: "fan_zone",
    label: "Fan Zone",
    description: "Estadio y multitud, energía intensa",
    emoji: "⚽",
  },
  {
    id: "cafe_san_telmo",
    label: "Café San Telmo",
    description: "Café al aire libre con cortado, adoquines, luz natural",
    emoji: "☕",
  },
]

interface Props {
  session: DesignSession
}

export function LifestylePanel({ session }: Props) {
  const [generated, setGenerated] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!session.currentMockupUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <ImageIcon className="h-12 w-12 text-zinc-600" />
        <p className="text-zinc-400 text-sm max-w-xs">
          Primero hacé un mockup en modo{" "}
          <span className="text-white font-medium">Chat con IA</span> para habilitar las fotos lifestyle.
        </p>
      </div>
    )
  }

  async function generate(scenario: Scenario) {
    if (loading) return
    setLoading(scenario)
    setErrors((prev) => ({ ...prev, [scenario]: "" }))

    try {
      const res = await fetch("/api/public/design/lifestyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockupUrl: session.currentMockupUrl,
          garmentType: session.garmentType,
          scenario,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.lifestyleUrl) {
        throw new Error(data.error || "Error generando imagen")
      }
      setGenerated((prev) => ({ ...prev, [scenario]: data.lifestyleUrl }))
    } catch (e: any) {
      setErrors((prev) => ({ ...prev, [scenario]: e.message }))
    } finally {
      setLoading(null)
    }
  }

  async function handleDownload(url: string, scenario: string) {
    const link = document.createElement("a")
    link.href = url
    link.download = `novamente-lifestyle-${scenario}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleShare(url: string, label: string) {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `Mi remera Novamente — ${label}`, url })
        return
      } catch {
        // User cancelled or API not available — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url)
    alert("URL copiada al portapapeles")
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">Fotos Lifestyle</h2>
        <p className="text-sm text-zinc-400">
          Generá fotos lifestyle con tu diseño para compartir en redes
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCENARIOS.map((s) => {
          const isLoading = loading === s.id
          const imageUrl = generated[s.id]
          const error = errors[s.id]

          return (
            <div
              key={s.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col"
            >
              {/* Image area */}
              <div className="aspect-square bg-zinc-800 relative flex items-center justify-center">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={`Lifestyle ${s.label}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-500">
                    {isLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
                    ) : (
                      <>
                        <span className="text-3xl">{s.emoji}</span>
                        <span className="text-xs">{s.description}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Card footer */}
              <div className="p-3 flex flex-col gap-2">
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  {!imageUrl && (
                    <p className="text-xs text-zinc-500">{s.description}</p>
                  )}
                  {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
                </div>

                {imageUrl ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-zinc-700 text-xs"
                      onClick={() => handleDownload(imageUrl, s.id)}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Descargar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-zinc-700 text-xs"
                      onClick={() => handleShare(imageUrl, s.label)}
                    >
                      <Share2 className="h-3.5 w-3.5 mr-1" />
                      Compartir
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => generate(s.id)}
                    disabled={isLoading || !!loading}
                    className="w-full text-xs bg-white text-zinc-950 hover:bg-zinc-100"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      "Generar"
                    )}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
