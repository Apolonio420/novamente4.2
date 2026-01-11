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
import { supabase } from "@/lib/supabase"
import { toPublicR2Url } from "@/lib/r2"

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
  const [showAllStyles, setShowAllStyles] = useState(false)
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
    ; (async () => {
      try {
        await fetch('/api/user/session', { cache: 'no-store' })
      } catch { }
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
          ; (window as any).__selectedHistoryImageId = imageId || null
        toast({ title: "Imagen seleccionada", description: "Cargada desde el historial" })
        // Hacer scroll al generador si existe un ancla
        const container = document.getElementById('generator')
        if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } catch { }
    }
    window.addEventListener('loadImageInGenerator', handler as EventListener)
    return () => window.removeEventListener('loadImageInGenerator', handler as EventListener)
  }, [toast])



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

  // Estilos artísticos Novamente
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

      // La imagen ya está disponible: reflejarlo de inmediato en la UI
      // para que el botón cambie de color/estado sin esperar al post-proceso.
      setGenState("ready")

      // Procesar la imagen inmediatamente para convertirla a URL de R2
      if (first.data) {
        try {
          console.log("🔄 Processing image to R2...")

          // Obtener el token de autenticación de Supabase si hay sesión activa
          let authToken: string | null = null
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.access_token) {
              authToken = session.access_token
              console.log("✅ Auth token obtained for process-design")
            }
          } catch (authError) {
            console.warn("⚠️ Could not get auth token for process-design:", authError)
          }

          const processHeaders: HeadersInit = {
            "Content-Type": "application/json",
          }

          if (authToken) {
            processHeaders["Authorization"] = `Bearer ${authToken}`
          }

          const processResponse = await fetch("/api/process-design", {
            method: "POST",
            headers: processHeaders,
            body: JSON.stringify({
              imageUrl: `data:image/png;base64,${first.data}`,
              prompt: prompt.trim(),
            }),
          })

          if (processResponse.ok) {
            const processResult = await processResponse.json()
            console.log("✅ Image processed and saved to R2:", processResult.success)

            // El endpoint ahora devuelve { success: true, image: {...}, debugId }
            const resultImageId = processResult.image?.id || processResult.imageId
            const resultImageUrl = processResult.image?.url || processResult.imageUrl || imageUrl

            // Guardar el ID de la imagen procesada para evitar reprocesamiento
            if (resultImageId) {
              setProcessedImageId(resultImageId)
            }

            if (onImageGenerated) {
              onImageGenerated(resultImageUrl)
            }
            if (isModal) {
              // En modo modal no navegamos
              return
            }
          } else {
            // Manejar errores pero no bloquear la UI (la imagen ya está generada)
            const errorData = await processResponse.json().catch(() => ({}))
            const debugId = processResponse.headers.get('X-Debug-Id') || errorData.debugId || 'unknown'
            console.error(`❌ Error processing image [${debugId}]:`, processResponse.statusText, errorData.error)

            if (onImageGenerated) {
              onImageGenerated(imageUrl)
            }
            if (isModal) {
              return
            }
          }
        } catch (processError) {
          // No bloquear la UI si falla el procesamiento (la imagen ya está generada)
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
            ; (window as any).__selectedHistoryImageId = null
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
      // Obtener el token de autenticación de Supabase si hay sesión activa
      let authToken: string | null = null
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          authToken = session.access_token
          console.log("✅ Auth token obtained from Supabase session")
        }
      } catch (authError) {
        console.warn("⚠️ Could not get auth token:", authError)
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Agregar token de autenticación si está disponible
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`
      }

      // Asegurar que tenemos un prompt válido
      // 1. Usar optimizedPrompt si existe y no está vacío
      // 2. Si no, reconstruir usando buildPrompt
      // 3. Si aún está vacío, usar un prompt por defecto
      let finalPrompt = optimizedPrompt?.trim() || ""
      if (!finalPrompt) {
        finalPrompt = buildPrompt(prompt, selectedStyle).trim()
      }
      if (!finalPrompt) {
        finalPrompt = "Diseño personalizado"
      }

      console.log("📝 Enviando prompt a process-design:", finalPrompt)

      const response = await fetch("/api/process-design", {
        method: "POST",
        headers,
        body: JSON.stringify({
          imageUrl: generatedImage,
          prompt: finalPrompt,
          userId: null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const debugId = response.headers.get('X-Debug-Id') || errorData.debugId || 'unknown'

        // Manejo específico por código de estado
        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Sesión requerida",
            description: "Iniciá sesión para guardar tus diseños",
            variant: "destructive",
          })
          // Opcional: abrir modal de login aquí
          throw new Error(errorData.error || "Sesión requerida")
        } else if (response.status === 422) {
          toast({
            title: "Datos inválidos",
            description: errorData.error || "Los datos enviados no son válidos",
            variant: "destructive",
          })
          throw new Error(errorData.error || "Datos inválidos")
        } else if (response.status === 429) {
          toast({
            title: "Límite alcanzado",
            description: errorData.error || "Alcanzaste el límite de imágenes sin iniciar sesión",
            variant: "destructive",
          })
          throw new Error(errorData.error || "Límite alcanzado")
        } else {
          // Error 500 u otro
          const errorMsg = errorData.error || "Error procesando diseño"
          console.error(`❌ Error procesando diseño [${debugId}]:`, errorMsg)
          toast({
            title: "Error",
            description: `${errorMsg} (Debug ID: ${debugId})`,
            variant: "destructive",
          })
          throw new Error(errorMsg)
        }
      }

      const data = await response.json()

      // El endpoint ahora devuelve { success: true, image: {...}, debugId }
      const imageId = data.image?.id || data.imageId
      const imageUrl = data.image?.url || data.imageUrl || generatedImage

      if (!imageId) {
        console.error("❌ No imageId in response:", data)
        throw new Error("Respuesta inválida del servidor")
      }

      if (isModal && onImageGenerated) {
        onImageGenerated(imageUrl)
      } else {
        window.location.href = `/design/${imageId}`
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
    setSelectedStyle(styleId as StyleId)
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
      title: "Estilo Novamente aplicado",
      description: `${style.name} - ${style.description}`,
    })
  }

  const createProxyUrl = useCallback(
    (originalUrl: string) => {
      if (!originalUrl) return originalUrl

      // 1. Intentar usar la utilidad central de R2
      const r2Url = toPublicR2Url(originalUrl)
      if (r2Url && r2Url !== originalUrl) return r2Url

      // 2. Solo usar proxy para imágenes de DALL-E (legacy check logic)
      if (originalUrl.includes("oaidalleapiprodscus.blob.core.windows.net")) {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 items-start">
        {/* Columna izquierda - Formulario compacto */}
        <div className="flex flex-col gap-4">
          {/* Área de texto principal - expandida */}
          <div>
            <label htmlFor="prompt" className="block text-xs text-zinc-400 mb-1.5 px-1">
              Describe tu diseño
            </label>
            <Textarea
              id="prompt"
              placeholder="Ej: Un león majestuoso con corona dorada, fondo negro..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full resize-none h-32 rounded-xl bg-zinc-900/60 border border-zinc-800 px-4 py-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all"
              disabled={isGenerating}
            />
            <p className="mt-1.5 text-[11px] text-zinc-500 px-1">Optimizado automáticamente con IA para mejor calidad.</p>
          </div>

          {/* Resoluciones - fila */}
          <div className="flex flex-wrap items-center gap-2">
            {sizeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedSize(option.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${selectedSize === option.value
                  ? "border-primary/50 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Ejemplos rápidos - Grid visible */}
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400 px-1">Ideas para Estampar</Label>
            <div className="flex flex-wrap gap-2">
              {[
                "Calavera Cyberpunk Neon",
                "Gato Astronauta Vintage",
                "Atardecer Retro 80s",
                "Lobo Geométrico Minimalista",
                "Dragón Japonés Tatuaje",
                "Astronauta Meditando",
                "Pizza Alienígena",
                "Samurai Urbano Futurista"
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setPrompt(example)}
                  className="text-[11px] px-2.5 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800 transition-all"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Estilos - Grid colapsable */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <Label className="text-xs text-zinc-400">Estilo Artístico</Label>
              <button
                onClick={() => setShowAllStyles(!showAllStyles)}
                className="text-[10px] text-primary hover:underline font-medium"
              >
                {showAllStyles ? "Ver menos" : "Ver todos los estilos"}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(showAllStyles ? novamenteStyles : novamenteStyles.slice(0, 6)).map((style) => (
                <button
                  key={style.key}
                  onClick={() => handleStyleSelect(style.key)}
                  className={`relative group overflow-hidden rounded-lg border p-2 text-left transition-all hover:border-zinc-600 ${selectedStyle === style.key
                    ? "border-primary/60 bg-primary/5 shadow-[0_0_10px_rgba(139,92,246,0.1)]"
                    : "border-zinc-800 bg-zinc-900/40"
                    }`}
                >
                  <div className="text-xs font-semibold text-zinc-200 mb-0.5">{style.name}</div>
                  <div className="text-[10px] text-zinc-500 line-clamp-1">{style.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* CTA Generar - compacto con estados */}
          <Button
            onClick={generateImage}
            disabled={genState === "generating" || !prompt.trim()}
            className={`mt-2 inline-flex items-center justify-center rounded-lg px-4 py-2 transition-colors disabled:opacity-60 ${genState === "generating"
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
        <div ref={viewerRef} className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-3 lg:p-4 shadow-lg flex flex-col items-center justify-center bg-grid-white/[0.02] min-h-[300px] lg:min-h-[450px]">
          {/* Container "hugs" the content. No fixed size unless placeholder. */}
          <div className={`overflow-hidden rounded-lg relative group flex items-center justify-center transition-all duration-300 ${!generatedImage ? 'w-full max-w-[380px] aspect-square bg-zinc-900/40 border-2 border-dashed border-zinc-800/50' : 'bg-zinc-900/20 shadow-xl border border-zinc-800/50'}`}>
            {generatedImage && !imageError ? (
              <div className="relative p-1">
                {/* Explicit dimensions to let container hug the image */}
                {(() => {
                  // Logic to fit image within a display box (e.g. max 500px tall, max 100% wide)
                  const { width, height } = getSizeParams()
                  const MAX_HEIGHT = 500
                  const aspectRatio = width / height

                  // Simple scaling logic
                  let displayHeight = Math.min(height, MAX_HEIGHT)
                  let displayWidth = displayHeight * aspectRatio

                  return (
                    <Image
                      key={`${imageKey}-${retryCount}`}
                      src={createProxyUrl(generatedImage) || "/placeholder.svg"}
                      alt="Imagen generada"
                      width={displayWidth}
                      height={displayHeight}
                      className="object-contain rounded-md w-full h-auto max-w-full"
                      priority
                      unoptimized
                    />
                  )
                })()}
              </div>
            ) : imageError ? (
              <div className="text-center p-8 w-full h-full flex flex-col items-center justify-center">
                <div className="h-12 w-12 mb-4 animate-pulse rounded-full bg-zinc-800/70" />
                <AlertTriangle className="h-10 w-10 mb-3 text-red-500/80" />
                <p className="text-sm font-medium mb-1">Error cargando imagen</p>
                <p className="text-xs text-zinc-500 mb-4 px-4">
                  {retryCount >= 3 ? "No se pudo recuperar la imagen tras varios intentos." : `Reintentando conexión (${retryCount + 1}/3)...`}
                </p>
                {retryCount < 3 && (
                  <Button variant="ghost" size="sm" onClick={retryImageLoad} className="text-xs h-8">
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin-slow" />
                    Reintentando...
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
                    className="text-xs h-8 border-zinc-700 hover:bg-zinc-800"
                  >
                    <Wand2 className="h-3 w-3 mr-2" />
                    Intentar de nuevo
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center p-8 w-full h-full flex flex-col items-center justify-center">
                <div className="h-16 w-16 mb-4 rounded-2xl bg-zinc-800/40 border border-zinc-700/30 flex items-center justify-center shadow-inner">
                  <Zap className="h-8 w-8 text-zinc-600" />
                </div>
                <p className="text-sm font-medium text-zinc-300">Tu diseño aparecerá aquí</p>
                <p className="text-xs mt-1 text-zinc-500 max-w-[200px]">
                  Elegí un estilo y describí tu idea para comenzar.
                </p>
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
