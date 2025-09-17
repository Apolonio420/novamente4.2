"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  Wand2,
  Download,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Zap,
  Settings,
  ShieldAlert,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { saveGeneratedImage } from "@/lib/db"
import { optimizePrompt } from "@/lib/gemini"
import Image from "next/image"
import Link from "next/link"

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void
  initialGenerationCount?: number
  isAuthenticated?: boolean
}

export function ImageGenerator({
  onImageGenerated,
  initialGenerationCount = 0,
  isAuthenticated = false,
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [imageKey, setImageKey] = useState(0)
  const [selectedSize, setSelectedSize] = useState("1024x1024")
  const [showContentPolicyError, setShowContentPolicyError] = useState(false)
  const [contentPolicyErrorMessage, setContentPolicyErrorMessage] = useState("")
  const { toast } = useToast()

  // Función para obtener clases CSS del contenedor según resolución
  const getImageContainerClasses = () => {
    switch (selectedSize) {
      case "1792x1024":
        return "aspect-[16/9]" // Horizontal
      case "1024x1792":
        return "aspect-[9/16]" // Vertical
      default:
        return "aspect-square" // Cuadrada
    }
  }

  // Ejemplos rápidos optimizados
  const quickExamples = [
    "Un león majestuoso con corona dorada",
    "Mandala geométrico con patrones intrincados",
    "Gato ninja saltando con katana",
    "Búho sabio con gafas leyendo un libro",
    "Dragón bebé sonriente con alas extendidas",
    "Águila volando con alas extendidas",
  ]

  // Estilos populares
  const popularStyles = [
    "Realista",
    "Cartoon",
    "Minimalista",
    "Vintage",
    "Futurista",
    "Acuarela",
    "Pop Art",
    "Geométrico",
    "Surrealista",
    "Pixel Art",
  ]

  // Opciones de resolución
  const sizeOptions = [
    { value: "1024x1024", label: "Cuadrada (1024×1024)", description: "Ideal para logos y diseños centrados" },
    { value: "1792x1024", label: "Horizontal (1792×1024)", description: "Perfecta para diseños anchos" },
    { value: "1024x1792", label: "Vertical (1024×1792)", description: "Ideal para diseños altos" },
  ]

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Por favor, describe lo que quieres generar",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setIsOptimizing(true)
    setGeneratedImage(null)
    setImageError(false)
    setRetryCount(0)
    setImageKey((prev) => prev + 1)

    try {
      console.log("🎨 Generating image with prompt:", prompt)

      // OPTIMIZACIÓN AUTOMÁTICA CON GEMINI
      console.log("🔄 Auto-optimizing prompt with Gemini...")
      const autoOptimizedPrompt = await optimizePrompt(prompt.trim())
      setOptimizedPrompt(autoOptimizedPrompt)
      setIsOptimizing(false)

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: autoOptimizedPrompt,
          size: selectedSize,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || "Error al generar la imagen"

        if (errorMessage.includes("políticas de contenido") || errorMessage.includes("content policy")) {
          setContentPolicyErrorMessage(errorMessage)
          setShowContentPolicyError(true)
          return
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("✅ Image generated successfully:", data.imageUrl)

      setGeneratedImage(data.imageUrl)

      // Guardar en la base de datos
      try {
        const savedImage = await saveGeneratedImage(data.imageUrl, prompt.trim(), null)
        console.log("✅ Image saved to database")

        if (onImageGenerated) {
          onImageGenerated(data.imageUrl)
        }
      } catch (dbError) {
        console.error("❌ Error saving to database:", dbError)
      }

      toast({
        title: "¡Imagen generada!",
        description: `Tu diseño está listo (${selectedSize}). Optimizado con IA.`,
      })
    } catch (error) {
      console.error("❌ Error generating image:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar la imagen",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      setIsOptimizing(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedImage) return

    try {
      console.log("⬇️ Downloading image:", generatedImage)

      const proxyUrl = createProxyUrl(generatedImage)
      const response = await fetch(proxyUrl)

      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `novamente-${prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-")}-${selectedSize}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Descarga iniciada",
        description: "La imagen se está descargando",
      })
    } catch (error) {
      console.error("❌ Error downloading image:", error)
      toast({
        title: "Error",
        description: "No se pudo descargar la imagen",
        variant: "destructive",
      })
    }
  }

  const addStyleToBadge = (style: string) => {
    const currentPrompt = prompt.trim()
    const styleText = `estilo ${style.toLowerCase()}`

    // Remover estilos existentes antes de agregar el nuevo
    const styleRegex = /,?\s*estilo\s+\w+/gi
    const cleanPrompt = currentPrompt.replace(styleRegex, "").trim()

    const newPrompt = cleanPrompt ? `${cleanPrompt}, ${styleText}` : styleText
    setPrompt(newPrompt)

    toast({
      title: "Estilo actualizado",
      description: `Se cambió el estilo a "${style}"`,
    })
  }

  const createProxyUrl = useCallback(
    (originalUrl: string) => {
      if (originalUrl && originalUrl.includes("oaidalleapiprodscus.blob.core.windows.net")) {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}&t=${timestamp}&r=${random}&retry=${retryCount}&key=${imageKey}`
      }
      return originalUrl
    },
    [retryCount, imageKey],
  )

  const handleImageError = useCallback(() => {
    console.error("❌ Error loading generated image, retry count:", retryCount)
    setImageError(true)
  }, [retryCount])

  const handleImageLoad = useCallback(() => {
    console.log("✅ Image loaded successfully")
    setImageError(false)
    setRetryCount(0)
  }, [])

  const retryImageLoad = useCallback(() => {
    if (!generatedImage || retryCount >= 3) return

    console.log("🔄 Retrying image load, attempt:", retryCount + 1)
    setImageError(false)
    setRetryCount((prev) => prev + 1)
    setImageKey((prev) => prev + 1)

    setTimeout(() => {
      if (retryCount < 2) {
        const img = new window.Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          console.log("✅ Retry successful")
          setImageError(false)
        }

        img.onerror = () => {
          console.error("❌ Retry failed")
          if (retryCount < 2) {
            setTimeout(() => retryImageLoad(), 2000)
          } else {
            setImageError(true)
            toast({
              title: "Error persistente",
              description: "No se pudo cargar la imagen. Intenta generar una nueva.",
              variant: "destructive",
            })
          }
        }

        img.src = createProxyUrl(generatedImage)
      }
    }, 2000)
  }, [generatedImage, retryCount, createProxyUrl, toast])

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna izquierda - Formulario */}
        <div className="space-y-6">
          {/* Área de texto principal */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium">
                Describe tu diseño
              </label>
              <Textarea
                id="prompt"
                placeholder="Ej: Un león majestuoso con corona dorada, fondo negro..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={isGenerating}
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3" />
                <span>Tu prompt será optimizado automáticamente con IA</span>
              </div>
            </div>

            {/* Selector de resolución */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <Label className="text-sm font-medium">Resolución de imagen</Label>
              </div>
              <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="space-y-2">
                {sizeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Botón de generación */}
            <Button onClick={generateImage} disabled={isGenerating || !prompt.trim()} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isOptimizing ? "Optimizando con IA..." : "Generando imagen..."}
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generar con IA ({selectedSize})
                </>
              )}
            </Button>
          </div>

          {/* Ejemplos rápidos */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Ejemplos rápidos</h3>
            <div className="space-y-2">
              {quickExamples.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-3 px-4 bg-transparent"
                  onClick={() => setPrompt(example)}
                  disabled={isGenerating}
                >
                  <span className="text-sm">{example}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Estilos */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Estilos populares (reemplaza el anterior)</h3>
            <div className="flex flex-wrap gap-2">
              {popularStyles.map((style) => (
                <Badge
                  key={style}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => addStyleToBadge(style)}
                >
                  {style}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha - Imagen generada */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div
                className={`${getImageContainerClasses()} bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center`}
              >
                {generatedImage && !imageError ? (
                  <div className="relative w-full h-full">
                    <Image
                      key={`${imageKey}-${retryCount}`}
                      src={createProxyUrl(generatedImage) || "/placeholder.svg"}
                      alt="Imagen generada"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                      priority
                      unoptimized
                    />
                  </div>
                ) : imageError ? (
                  <div className="text-center text-muted-foreground p-8">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <p className="text-sm mb-4">Error cargando imagen</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      {retryCount >= 3 ? "Máximo de reintentos alcanzado" : `Intento ${retryCount + 1} de 3`}
                    </p>
                    {retryCount < 3 && (
                      <Button variant="outline" size="sm" onClick={retryImageLoad} className="bg-transparent">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reintentar (2s)
                      </Button>
                    )}
                    {retryCount >= 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImageError(false)
                          setRetryCount(0)
                          setImageKey((prev) => prev + 1)
                          generateImage()
                        }}
                        className="bg-transparent"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generar Nueva Imagen
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground p-8">
                    <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Tu diseño aparecerá aquí</p>
                    <p className="text-xs mt-2 opacity-75">Optimizado con IA • {selectedSize}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Acciones de la imagen */}
          {generatedImage && !imageError && (
            <div className="flex gap-2">
              <Link
                href={`/gemini-flow?image=${encodeURIComponent(generatedImage)}&prompt=${encodeURIComponent(prompt)}`}
                className="flex-1"
              >
                <Button className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Usar este Diseño
                </Button>
              </Link>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Mostrar prompt optimizado */}
          {optimizedPrompt && optimizedPrompt !== prompt && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-primary">Prompt optimizado con IA:</p>
              </div>
              <p className="text-sm text-muted-foreground">{optimizedPrompt}</p>
              <div className="mt-2 text-xs text-muted-foreground">✅ Optimizado por Gemini para mejores resultados</div>
            </div>
          )}
        </div>
      </div>

      {/* Content policy error popup */}
      <Dialog open={showContentPolicyError} onOpenChange={setShowContentPolicyError}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-left">Contenido no permitido</DialogTitle>
                <DialogDescription className="text-left">
                  Tu descripción no cumple con las políticas de contenido
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-800">
                {contentPolicyErrorMessage ||
                  "El contenido solicitado viola las políticas de contenido. Intenta con una descripción diferente."}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Sugerencias:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Evita contenido violento o inapropiado</li>
                <li>• Usa descripciones más generales y positivas</li>
                <li>• Enfócate en elementos artísticos y creativos</li>
                <li>• Prueba con diferentes palabras clave</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowContentPolicyError(false)
                setPrompt("")
              }}
              className="w-full sm:w-auto"
            >
              Limpiar descripción
            </Button>
            <Button onClick={() => setShowContentPolicyError(false)} className="w-full sm:w-auto">
              Modificar descripción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
