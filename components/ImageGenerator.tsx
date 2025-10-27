"use client"

import { useState, useCallback, useEffect, useRef } from "react"
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
import { getAllArtisticStyles } from "@/lib/advanced-prompt-optimizer"
// import { optimizePrompt } from "@/lib/gemini" // Removed - optimization handled server-side
import Image from "next/image"
import Link from "next/link"
import { ExamplesCarousel } from "@/components/ExamplesCarousel"
import { StylesCarousel } from "@/components/StylesCarousel"
import { buildPrompt, type StyleId } from "@/lib/generator/prompt"

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void
  initialGenerationCount?: number
  isAuthenticated?: boolean
  mode?: 'standalone' | 'modal'
}

export function ImageGenerator({
  onImageGenerated,
  initialGenerationCount = 0,
  isAuthenticated = false,
  mode = 'standalone',
}: ImageGeneratorProps) {
  // Estados del generador
  type GenState = "idle" | "generating" | "ready"
  const [genState, setGenState] = useState<GenState>("idle")
  
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImageId, setProcessedImageId] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<StyleId | undefined>(undefined)
  const { toast } = useToast()
  const isModal = mode === 'modal'
  const viewerRef = useRef<HTMLDivElement>(null)
  
  // Reset inteligente de estado
  useEffect(() => {
    setGenState("idle")
  }, [prompt, selectedStyle, selectedSize])
  
  // Efecto para flash y scroll cuando imagen está lista
  useEffect(() => {
    if (genState === "ready" && viewerRef.current) {
      // Desktop: flash suave
      viewerRef.current.classList.add("ring-2", "ring-emerald-500/60")
      setTimeout(() => {
        viewerRef.current?.classList.remove("ring-2", "ring-emerald-500/60")
      }, 800)
      
      // Mobile: scroll automático
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 100)
      }
    }
  }, [genState])

  // Asegurar sesión anónima antes de generar/procesar
  useEffect(() => {
    ;(async () => {
      try {
        await fetch('/api/user/session', { cache: 'no-store' })
      } catch {}
    })()
  }, [])

  // Escuchar selección desde ImageHistory (sin guardar en DB)
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const url = e?.detail?.imageUrl
        const imageId = e?.detail?.imageId as string | undefined
        if (!url) return
        setGeneratedImage(url)
        setImageError(false)
        setOptimizedPrompt(null)
        // Guardar el id para navegación directa si se usa "usar este diseño"
        ;(window as any).__selectedHistoryImageId = imageId || null
        toast({ title: "Imagen seleccionada", description: "Cargada desde el historial" })
        // Hacer scroll al generador si existe un ancla
        const container = document.getElementById('generator')
        if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } catch {}
    }
    window.addEventListener('loadImageInGenerator', handler as EventListener)
    return () => window.removeEventListener('loadImageInGenerator', handler as EventListener)
  }, [toast])

  // Función para obtener clases CSS del contenedor según resolución
  const getImageContainerClasses = () => {
    switch (selectedSize) {
      case "1792x1024":
        return "aspect-[1792/1024]" // Horizontal
      case "1024x1792":
        return "aspect-[1024/1792]" // Vertical
      default:
        return "aspect-square" // Cuadrada
    }
  }
  
  // Mapeo de tamaños a parámetros para la API
  const getSizeParams = () => {
    switch (selectedSize) {
      case "1792x1024":
        return { width: 1792, height: 1024 }
      case "1024x1792":
        return { width: 1024, height: 1792 }
      default:
        return { width: 1024, height: 1024 }
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

  // Estilos artísticos NovaMente
  const novamenteStyles = getAllArtisticStyles()

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

    setGenState("generating")
    setIsGenerating(true)
    setIsOptimizing(true)
    setGeneratedImage(null)
    setImageError(false)
    setRetryCount(0)
    setImageKey((prev) => prev + 1)

    try {
      // Construir el prompt final con el estilo aplicado
      const finalPrompt = buildPrompt(prompt, selectedStyle)
      console.log("🎨 Generating image with prompt:", finalPrompt)
      if (selectedStyle) {
        console.log("🎨 Style applied:", selectedStyle)
      }

      // Usar el prompt con estilo aplicado
      setOptimizedPrompt(finalPrompt)
      setIsOptimizing(false)

      console.log("📡 Making request to /api/generate-image...")
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: buildPrompt(prompt, selectedStyle), // Aplicar estilo al prompt
          n: 1,
          includeBase64: true,
          size: getSizeParams(),
        }),
      })

      console.log("📊 Response status:", response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ API Error:", errorData)
        const errorMessage = errorData.error || "Error al generar la imagen"

        if (errorMessage.includes("políticas de contenido") || errorMessage.includes("content policy")) {
          setContentPolicyErrorMessage(errorMessage)
          setShowContentPolicyError(true)
          return
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("📦 Full response data:", JSON.stringify(data, null, 2))
      
      const first = data?.images?.[0]
      console.log("🖼️ First image data:", JSON.stringify(first, null, 2))
      
      if (!first) {
        console.error("❌ No images in response")
        throw new Error("Respuesta inválida de generación")
      }

      // Usar base64 si está disponible, sino URL
      const imageUrl = first.data ? `data:image/png;base64,${first.data}` : first.url
      console.log("✅ Image URL/base64 set:", imageUrl ? "OK" : "MISSING")

      setGeneratedImage(imageUrl)

      // Procesar la imagen inmediatamente para convertirla a URL de R2
      if (first.data) {
        try {
          console.log("🔄 Processing image to R2...")
          const processResponse = await fetch("/api/process-design", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageUrl: `data:image/png;base64,${first.data}`,
              prompt: prompt.trim(),
            }),
          })

          if (processResponse.ok) {
            const processResult = await processResponse.json()
            console.log("✅ Image processed and saved to R2:", processResult.success)
            
            // Guardar el ID de la imagen procesada para evitar reprocesamiento
            setProcessedImageId(processResult.imageId)
            
            if (onImageGenerated) {
              onImageGenerated(processResult.imageUrl || imageUrl)
            }
            if (isModal) {
              // En modo modal no navegamos
              return
            }
          } else {
            console.error("❌ Error processing image:", processResponse.statusText)
            if (onImageGenerated) {
              onImageGenerated(imageUrl)
            }
          if (isModal) {
            return
          }
          }
        } catch (processError) {
          console.error("❌ Error processing image:", processError)
          if (onImageGenerated) {
            onImageGenerated(imageUrl)
          }
        if (isModal) {
          return
        }
        }
      } else {
        // Si no hay base64, guardar la URL directamente
        try {
          const savedImage = await saveGeneratedImage(imageUrl, prompt.trim(), undefined)
          console.log("✅ Image saved to database")
          
          if (onImageGenerated) {
            onImageGenerated(imageUrl)
          }
          if (isModal) {
            return
          }
        } catch (dbError) {
          console.error("❌ Error saving to database:", dbError)
          if (onImageGenerated) {
            onImageGenerated(imageUrl)
          }
          if (isModal) {
            return
          }
        }
      }

      // Cambiar estado a ready
      setGenState("ready")
      
      // Reset a idle después de 3 segundos
      setTimeout(() => setGenState("idle"), 3000)
      
      toast({
        title: "¡Imagen generada!",
        description: `Tu diseño está listo (${selectedSize}). Optimizado con IA.`,
      })
    } catch (error) {
      console.error("❌ Error generating image:", error)
      setGenState("idle")
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

  const handleUseDesign = async () => {
    if (!generatedImage) return

    setIsProcessing(true)
    
    try {
      console.log("🎨 Usar diseño:", generatedImage)

      // Si la imagen viene del historial
      const selectedId = (window as any).__selectedHistoryImageId as string | null
      if (selectedId) {
        if (isModal && onImageGenerated) {
          onImageGenerated(generatedImage)
          ;(window as any).__selectedHistoryImageId = null
          return
        }
        window.location.href = `/design/${selectedId}`
        return
      }

      // Si ya tenemos un imageId procesado, navegar directamente
      if (processedImageId) {
        console.log("✅ Using already processed image ID:", processedImageId)
        if (isModal && onImageGenerated) {
          onImageGenerated(generatedImage)
          return
        }
        window.location.href = `/design/${processedImageId}`
        return
      }

      // Si es una imagen recién generada (base64), procesar en servidor y navegar
      const response = await fetch("/api/process-design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: generatedImage,
          prompt: prompt.trim(),
          userId: null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error procesando diseño")
      }

      const data = await response.json()
      if (isModal && onImageGenerated) {
        onImageGenerated(data.imageUrl || generatedImage)
      } else {
        window.location.href = `/design/${data.imageId}`
      }
      
    } catch (error) {
      console.error("❌ Error procesando diseño:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo procesar el diseño",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
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

  const handleExampleClick = (example: string) => {
    setPrompt(example)
  }

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId)
    const style = novamenteStyles.find(s => s.key === styleId)
    if (style) {
      addNovamenteStyle(style)
      toast({
        title: "Estilo aplicado",
        description: `${style.name}`,
      })
    }
  }

  const addNovamenteStyle = (style: any) => {
    const currentPrompt = prompt.trim()
    const styleText = `estilo ${style.name.toLowerCase()}`

    // Remover estilos existentes antes de agregar el nuevo
    const styleRegex = /,?\s*estilo\s+[^,]+/gi
    const cleanPrompt = currentPrompt.replace(styleRegex, "").trim()

    const newPrompt = cleanPrompt ? `${cleanPrompt}, ${styleText}` : styleText
    setPrompt(newPrompt)

    toast({
      title: "Estilo NovaMente aplicado",
      description: `${style.name} - ${style.description}`,
    })
  }

  const createProxyUrl = useCallback(
    (originalUrl: string) => {
      // Solo usar proxy para imágenes de DALL-E, no para Supabase
      if (originalUrl && originalUrl.includes("oaidalleapiprodscus.blob.core.windows.net")) {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}&t=${timestamp}&r=${random}&retry=${retryCount}&key=${imageKey}`
      }
      // Para imágenes de Supabase o base64, usar directamente
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 min-h-[calc(100vh-9rem)]">
        {/* Columna izquierda - Formulario compacto */}
        <div className="flex flex-col gap-4">
          {/* Área de texto principal - compacta */}
          <div>
            <label htmlFor="prompt" className="block text-xs text-zinc-400 mb-1.5">
              Describe tu diseño
            </label>
            <Textarea
              id="prompt"
              placeholder="Ej: Un león majestuoso con corona dorada, fondo negro..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full resize-none h-20 rounded-md bg-zinc-900/60 border border-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/60"
              disabled={isGenerating}
            />
            <p className="mt-1 text-[11px] text-zinc-500">Optimizado automáticamente con IA.</p>
          </div>

          {/* Resoluciones - fila compacta */}
          <div className="flex flex-wrap items-center gap-2">
            {sizeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedSize(option.value)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  selectedSize === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-zinc-700/70 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Carrusel de ejemplos */}
          <ExamplesCarousel onExampleClick={handleExampleClick} compact />

          {/* Carrusel de estilos */}
          <StylesCarousel onStyleSelect={handleStyleSelect} selectedStyle={selectedStyle} compact />

          {/* CTA Generar - compacto con estados */}
          <Button 
            onClick={generateImage} 
            disabled={genState === "generating" || !prompt.trim()} 
            className={`mt-2 inline-flex items-center justify-center rounded-lg px-4 py-2 transition-colors disabled:opacity-60 ${
              genState === "generating"
                ? "bg-zinc-700 text-zinc-300"
                : genState === "ready"
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "bg-violet-600 text-white hover:bg-violet-500"
            }`}
          >
            {genState === "generating" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isOptimizing ? "Optimizando..." : "Generando..."}
              </>
            ) : genState === "ready" ? (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Imagen lista
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generar con IA
              </>
            )}
          </Button>
        </div>

        {/* Columna derecha - Visor */}
        <div ref={viewerRef} className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-3 lg:p-4 shadow-lg">
          <div className="aspect-[5/6] w-full overflow-hidden rounded-md bg-zinc-900/40 grid place-items-center">
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
              <div className="text-center p-4">
                <div className="h-10 w-10 mx-auto mb-3 animate-pulse rounded-lg bg-zinc-800/70" />
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-sm mb-2">Error cargando imagen</p>
                <p className="text-[11px] text-zinc-500 mb-3">
                  {retryCount >= 3 ? "Máximo de reintentos alcanzado" : `Intento ${retryCount + 1} de 3`}
                </p>
                {retryCount < 3 && (
                  <Button variant="outline" size="sm" onClick={retryImageLoad} className="bg-transparent text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reintentar
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
                    className="bg-transparent text-xs"
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Generar Nueva
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="h-10 w-10 mx-auto mb-2 animate-pulse rounded-lg bg-zinc-800/70" />
                <p className="text-sm text-zinc-400">Tu diseño aparecerá aquí</p>
                <p className="text-[11px] mt-1 text-zinc-500">Optimizado con IA</p>
              </div>
            )}
          </div>

          {/* Acciones de la imagen */}
          {generatedImage && !imageError && (
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={handleUseDesign} 
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Usar este Diseño
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Mostrar prompt optimizado */}
          {optimizedPrompt && optimizedPrompt !== prompt && (
            <div className="p-3 bg-muted rounded-lg mt-4">
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
