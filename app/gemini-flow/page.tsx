"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Wand2, Download, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface GarmentItem {
  path: string
  url: string
  type: string
  side: string
  color: string
}

interface GeneratedImage {
  url: string
  base64: string
  contentType: string
}

export default function GeminiFlowPage() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [garments, setGarments] = useState<GarmentItem[]>([])
  const [selectedGarment, setSelectedGarment] = useState("")
  const [placement, setPlacement] = useState("center")
  const [scaleHint, setScaleHint] = useState("medium")
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [loadingGarments, setLoadingGarments] = useState(true)
  const { toast } = useToast()

  // Cargar prendas disponibles
  useEffect(() => {
    const loadGarments = async (retryCount = 0) => {
      const maxRetries = 3
      const retryDelay = 1000 // 1 second

      try {
        console.log("[v0] Starting to load garments from /api/garments (attempt", retryCount + 1, ")")
        const response = await fetch("/api/garments")
        console.log("[v0] Garments API response status:", response.status)
        console.log("[v0] Garments API response ok:", response.ok)

        if (!response.ok) {
          const errorText = await response.text()
          console.log("[v0] Garments API error response:", errorText)

          if (response.status === 500 && retryCount < maxRetries) {
            console.log("[v0] Retrying garments API in", retryDelay, "ms...")
            setTimeout(() => loadGarments(retryCount + 1), retryDelay)
            return
          }

          throw new Error(`Error loading garments: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("[v0] Garments API response data:", data)

        if (data.success) {
          console.log("[v0] Found", data.items.length, "garments")
          setGarments(data.items)
          if (data.items.length > 0) {
            setSelectedGarment(data.items[0].path)
            console.log("[v0] Selected first garment:", data.items[0].path)
          }
        } else {
          throw new Error(data.error || "API returned success: false")
        }
      } catch (error) {
        console.error("[v0] Error loading garments:", error)

        if (retryCount >= maxRetries) {
          toast({
            title: "Error",
            description: "No se pudieron cargar las prendas disponibles",
            variant: "destructive",
          })
        }
      } finally {
        if (retryCount >= maxRetries || garments.length > 0) {
          setLoadingGarments(false)
        }
      }
    }

    loadGarments()
  }, [toast])

  // Generar diseño
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Por favor, describe lo que quieres generar",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedImages([])
    setResultImage(null)

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          n: 1,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al generar la imagen")
      }

      const data = await response.json()

      if (data.success && data.images && data.images.length > 0) {
        const imageData = data.images.map((img: { data: string; contentType: string }) => {
          const binaryString = atob(img.data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const blob = new Blob([bytes], { type: img.contentType })
          return {
            url: URL.createObjectURL(blob),
            base64: img.data,
            contentType: img.contentType,
          }
        })
        setGeneratedImages(imageData)

        toast({
          title: "¡Diseño generado!",
          description: "Tu diseño está listo para aplicar a una prenda",
        })
      } else {
        throw new Error("No se recibieron imágenes en la respuesta")
      }
    } catch (error) {
      console.error("Error generating image:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar la imagen",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Aplicar diseño a prenda
  const handleApplyDesign = async (generatedImage: GeneratedImage) => {
    if (!selectedGarment) {
      toast({
        title: "Error",
        description: "Por favor, selecciona una prenda",
        variant: "destructive",
      })
      return
    }

    setIsApplying(true)
    setResultImage(null)

    try {
      const response = await fetch("/api/apply-design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          designBase64: generatedImage.base64,
          productPath: selectedGarment,
          placement: `Coloca el diseño en ${placement} de la prenda`,
          scaleHint: `Tamaño ${scaleHint} del diseño`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al aplicar el diseño")
      }

      const data = await response.json()
      if (data.success && data.image) {
        // Convertir los datos de imagen a URL
        const blob = new Blob([new Uint8Array(data.image.data)], {
          type: data.image.contentType,
        })
        const imageUrl = URL.createObjectURL(blob)
        setResultImage(imageUrl)

        toast({
          title: "¡Diseño aplicado!",
          description: "Tu diseño se ha aplicado exitosamente a la prenda",
        })
      }
    } catch (error) {
      console.error("Error applying design:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo aplicar el diseño",
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  // Descargar imagen resultado
  const handleDownload = () => {
    if (!resultImage) return

    const a = document.createElement("a")
    a.href = resultImage
    a.download = `novamente-design-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Flujo Gemini</h1>
          <p className="text-muted-foreground">Genera tu diseño → Elige prenda → Aplica diseño</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel izquierdo - Controles */}
          <div className="space-y-6">
            {/* Generación de diseño */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">1. Generar Diseño</h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="prompt">Describe tu diseño</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Ej: Un león majestuoso con corona dorada..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[100px] mt-2"
                      disabled={isGenerating}
                    />
                  </div>

                  <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Selección de prenda */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">2. Elegir Prenda</h2>

                <div className="space-y-4">
                  <div>
                    <Label>Prenda</Label>
                    <Select value={selectedGarment} onValueChange={setSelectedGarment} disabled={loadingGarments}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecciona una prenda" />
                      </SelectTrigger>
                      <SelectContent>
                        {garments.map((garment) => (
                          <SelectItem key={garment.path} value={garment.path}>
                            {garment.type} {garment.color} - {garment.side}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Posición</Label>
                    <Select value={placement} onValueChange={setPlacement}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="top">Arriba</SelectItem>
                        <SelectItem value="bottom">Abajo</SelectItem>
                        <SelectItem value="left">Izquierda</SelectItem>
                        <SelectItem value="right">Derecha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tamaño</Label>
                    <Select value={scaleHint} onValueChange={setScaleHint}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeño</SelectItem>
                        <SelectItem value="medium">Mediano</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel derecho - Resultados */}
          <div className="space-y-6">
            {/* Diseños generados */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Diseños Generados</h2>

                <div className="space-y-4">
                  {generatedImages.length === 0 ? (
                    <div className="aspect-square bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <Wand2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Tu diseño aparecerá aquí</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {generatedImages.map((imageData, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square relative rounded-lg overflow-hidden border">
                            <Image
                              src={imageData.url || "/placeholder.svg"}
                              alt={`Diseño generado ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </div>
                          <Button
                            onClick={() => handleApplyDesign(imageData)}
                            disabled={isApplying || !selectedGarment}
                            className="w-full mt-2"
                          >
                            {isApplying ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Aplicando...
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Aplicar a Prenda
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resultado final */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Resultado Final</h2>

                <div className="space-y-4">
                  {!resultImage ? (
                    <div className="aspect-square bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">El resultado aparecerá aquí</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="aspect-square relative rounded-lg overflow-hidden border">
                        <Image
                          src={resultImage || "/placeholder.svg"}
                          alt="Diseño aplicado a prenda"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                      <Button onClick={handleDownload} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Resultado
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
