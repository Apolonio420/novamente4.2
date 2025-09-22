"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Wand2, Download, Eye, Scissors, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { useSearchParams } from "next/navigation"

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

async function ensureAssetExists(pathRel: string): Promise<string> {
  // prueba tal cual
  const tryHead = async (p: string) => {
    const r = await fetch(`/garments/${p}`, { method: "HEAD" })
    return r.ok
  }

  if (await tryHead(pathRel)) return pathRel

  // si venía .png, probá .jpeg y .jpg
  if (pathRel.toLowerCase().endsWith(".png")) {
    const jpeg = pathRel.replace(/\.png$/i, ".jpeg")
    if (await tryHead(jpeg)) return jpeg
    const jpg = pathRel.replace(/\.png$/i, ".jpg")
    if (await tryHead(jpg)) return jpg
  }

  // si venía .jpeg/.jpg, probá .png
  if (pathRel.toLowerCase().endsWith(".jpeg")) {
    const png = pathRel.replace(/\.jpeg$/i, ".png")
    if (await tryHead(png)) return png
  }
  if (pathRel.toLowerCase().endsWith(".jpg")) {
    const png = pathRel.replace(/\.jpg$/i, ".png")
    if (await tryHead(png)) return png
  }

  // si no hay, devolvés el original (dejará 400 y muestra el error claro)
  return pathRel
}

export default function GeminiFlowPage() {
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRemovingBackground, setIsRemovingBackground] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [backgroundRemovedImage, setBackgroundRemovedImage] = useState<GeneratedImage | null>(null)
  const [garments, setGarments] = useState<GarmentItem[]>([])
  const [selectedGarment, setSelectedGarment] = useState("")
  const [placement, setPlacement] = useState("center")
  const [scaleHint, setScaleHint] = useState("medium")
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [loadingGarments, setLoadingGarments] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    const imageParam = searchParams.get("image")
    const promptParam = searchParams.get("prompt")

    if (imageParam && promptParam) {
      // Convert URL to base64 for consistency
      fetch(imageParam)
        .then((response) => response.blob())
        .then((blob) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1]
            setGeneratedImages([
              {
                url: imageParam,
                base64: base64,
                contentType: "image/png",
              },
            ])
            setPrompt(promptParam)
            setCurrentStep(2) // Skip to step 2 since we already have the image
          }
          reader.readAsDataURL(blob)
        })
        .catch((error) => {
          console.error("Error loading image from URL:", error)
          toast({
            title: "Error",
            description: "No se pudo cargar la imagen desde la URL",
            variant: "destructive",
          })
        })
    }
  }, [searchParams, toast])

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
          setLoadingGarments(false)
        } else {
          throw new Error(data.error || "API returned success: false")
        }
      } catch (error) {
        console.error("[v0] Error loading garments:", error)

        if (retryCount >= maxRetries) {
          setLoadingGarments(false)
          toast({
            title: "Error",
            description: "No se pudieron cargar las prendas disponibles",
            variant: "destructive",
          })
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
    setBackgroundRemovedImage(null)
    setResultImage(null)
    setCurrentStep(1)

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          n: 1,
          includeBase64: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al generar la imagen")
      }

      const data = await response.json()

      if (data.success && data.images && data.images.length > 0) {
        const imageData = data.images.map(
          (img: { data?: string; contentType: string; url: string }): GeneratedImage => ({
            url: img.url || (img.data ? `data:${img.contentType};base64,${img.data}` : ""),
            base64: img.data || "",
            contentType: img.contentType,
          }),
        )
        setGeneratedImages(imageData)
        setCurrentStep(2)

        toast({
          title: "¡Diseño generado!",
          description: "Ahora puedes remover el fondo y aplicarlo a una prenda",
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

  const handleRemoveBackground = async (generatedImage: GeneratedImage) => {
    setIsRemovingBackground(true)

    try {
      const response = await fetch("/api/remove-background", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: `data:image/png;base64,${generatedImage.base64}`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al remover el fondo")
      }

      const data = await response.json()

      if (data.success && data.image) {
        const binaryString = atob(data.image.data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: data.image.contentType })

        setBackgroundRemovedImage({
          url: URL.createObjectURL(blob),
          base64: data.image.data,
          contentType: data.image.contentType,
        })
        setCurrentStep(3)

        toast({
          title: "¡Fondo removido!",
          description: "Ahora puedes aplicar el diseño a tu prenda",
        })
      } else {
        throw new Error("No se pudo procesar la imagen")
      }
    } catch (error) {
      console.error("Error removing background:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo remover el fondo",
        variant: "destructive",
      })
    } finally {
      setIsRemovingBackground(false)
    }
  }

  // Aplicar diseño a prenda
  const handleApplyDesign = async (imageToApply: GeneratedImage) => {
    console.log("[v0] === STARTING APPLY DESIGN ===")
    console.log("[v0] Selected garment:", selectedGarment)
    console.log("[v0] Image to apply:", {
      hasUrl: !!imageToApply.url,
      hasBase64: !!imageToApply.base64,
      base64Length: imageToApply.base64?.length || 0,
      contentType: imageToApply.contentType,
    })
    console.log("[v0] Placement:", placement)
    console.log("[v0] Scale hint:", scaleHint)

    if (!selectedGarment) {
      console.log("[v0] ERROR: No garment selected")
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
      const safePath = await ensureAssetExists(selectedGarment)

      const requestBody = {
        designBase64: `data:image/png;base64,${imageToApply.base64}`,
        productPath: safePath,
        placement,
        scaleHint,
      }

      console.log("[v0] Request body:", {
        hasDesignBase64: !!requestBody.designBase64,
        designBase64Length: requestBody.designBase64?.length || 0,
        productPath: requestBody.productPath,
        placement: requestBody.placement,
        scaleHint: requestBody.scaleHint,
      })

      console.log("[v0] Making POST request to /api/apply-design...")

      const response = await fetch("/api/apply-design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("[v0] Apply design response status:", response.status)
      console.log("[v0] Apply design response ok:", response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Apply design error response text:", errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
          console.log("[v0] Apply design error data:", errorData)
        } catch (e) {
          console.log("[v0] Could not parse error response as JSON")
          errorData = { error: errorText }
        }

        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      console.log("[v0] Apply design response successful, parsing JSON...")
      const data = await response.json()
      console.log("[v0] Apply design response data:", {
        success: data.success,
        hasImage: !!data.image,
        imageDataLength: data.image?.data?.length || 0,
        imageContentType: data.image?.contentType,
      })

      if (data.success && data.image) {
        console.log("[v0] Converting image data to blob...")
        const binaryString = atob(data.image.data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], {
          type: data.image.contentType,
        })
        const imageUrl = URL.createObjectURL(blob)
        console.log("[v0] Created blob URL:", imageUrl)
        setResultImage(imageUrl)

        toast({
          title: "¡Diseño aplicado!",
          description: "Tu diseño se ha aplicado exitosamente a la prenda",
        })
      } else {
        console.log("[v0] ERROR: Response missing success or image data")
        throw new Error("Respuesta inválida del servidor")
      }
    } catch (error) {
      console.error("[v0] Error applying design:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo aplicar el diseño",
        variant: "destructive",
      })
    } finally {
      console.log("[v0] === APPLY DESIGN FINISHED ===")
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
          <h1 className="text-3xl font-bold mb-2">Flujo de Diseño con IA</h1>
          <p className="text-muted-foreground">Genera → Remueve fondo → Aplica a prenda</p>

          <div className="flex justify-center items-center gap-4 mt-6">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? "text-primary" : "text-muted-foreground"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
              </div>
              <span className="text-sm font-medium">Generar</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`}></div>
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? "text-primary" : "text-muted-foreground"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : "2"}
              </div>
              <span className="text-sm font-medium">Remover Fondo</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep >= 3 ? "bg-primary" : "bg-muted"}`}></div>
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? "text-primary" : "text-muted-foreground"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                3
              </div>
              <span className="text-sm font-medium">Aplicar</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel izquierdo - Controles */}
          <div className="space-y-6">
            {/* Paso 1: Generación de diseño */}
            <Card className={currentStep === 1 ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    {currentStep > 1 ? <CheckCircle className="w-3 h-3" /> : "1"}
                  </div>
                  Generar Diseño
                </h2>

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

            {/* Paso 3: Selección de prenda */}
            <Card className={currentStep === 3 ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    3
                  </div>
                  Elegir Prenda y Aplicar
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label>Prenda</Label>
                    <Select
                      value={selectedGarment}
                      onValueChange={(value) => {
                        console.log("[v0] Garment selection changed to:", value)
                        setSelectedGarment(value)
                      }}
                      disabled={loadingGarments && garments.length === 0}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={loadingGarments ? "Cargando prendas..." : "Selecciona una prenda"} />
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
            {/* Paso 1: Diseños generados */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Paso 1: Diseño Original</h2>

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
                            onClick={() => handleRemoveBackground(imageData)}
                            disabled={isRemovingBackground || currentStep < 2}
                            className="w-full mt-2"
                          >
                            {isRemovingBackground ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Removiendo fondo...
                              </>
                            ) : (
                              <>
                                <Scissors className="mr-2 h-4 w-4" />
                                Remover Fondo
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

            {/* Paso 2: Imagen sin fondo */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Paso 2: Sin Fondo</h2>

                <div className="space-y-4">
                  {!backgroundRemovedImage ? (
                    <div className="aspect-square bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <Scissors className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Imagen sin fondo aparecerá aquí</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div
                        className="aspect-square relative rounded-lg overflow-hidden border bg-gray-100 bg-opacity-50"
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='a' patternUnits='userSpaceOnUse' width='20' height='20'%3e%3crect fill='%23f3f4f6' width='10' height='10'/%3e%3crect fill='%23e5e7eb' x='10' width='10' height='10'/%3e%3crect fill='%23e5e7eb' y='10' width='10' height='10'/%3e%3crect fill='%23f3f4f6' x='10' y='10' width='10' height='10'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23a)'/%3e%3c/svg%3e\")",
                        }}
                      >
                        <Image
                          src={backgroundRemovedImage.url || "/placeholder.svg"}
                          alt="Diseño sin fondo"
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                      <Button
                        onClick={() => handleApplyDesign(backgroundRemovedImage)}
                        disabled={isApplying || !selectedGarment || currentStep < 3}
                        className="w-full"
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
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Paso 3: Resultado final */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Paso 3: Resultado Final</h2>

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
