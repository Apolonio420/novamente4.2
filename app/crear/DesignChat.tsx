"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/lib/cartStore"
import type { DesignSession } from "./page"
import {
  Paperclip,
  Send,
  Loader2,
  ShoppingCart,
  Shirt,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { GarmentCatalog } from "./GarmentCatalog"

// ============================================================
// Types
// ============================================================

type Msg = {
  role: "user" | "assistant"
  text: string
  imageUrl?: string
  attachmentUrl?: string
  prompt?: string
}

// ============================================================
// Constants
// ============================================================

const GARMENT_OPTIONS = [
  { value: "aldea_classic_fit", label: "Remera Clásica" },
  { value: "aura_oversized", label: "Remera Oversize" },
  { value: "boston_hoodie", label: "Buzo Hoodie" },
  { value: "buzo_cuello_redondo", label: "Buzo Cuello Redondo" },
  { value: "musculosa_bali", label: "Musculosa Bali" },
  { value: "astra_crop", label: "Remera Crop" },
]

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"]

const PRICES: Record<string, number> = {
  aldea_classic_fit: 28600,
  aura_oversized: 31000,
  boston_hoodie: 52000,
  buzo_cuello_redondo: 43000,
  musculosa_bali: 21800,
  astra_crop: 23500,
}

// ============================================================
// Helpers
// ============================================================

function garmentLabel(g: string) {
  return GARMENT_OPTIONS.find((o) => o.value === g)?.label ?? g
}

const COLOR_LABELS: Record<string, string> = {
  negro: "Negro", blanco: "Blanco", stone_wash: "Stone Wash",
  gris: "Gris", crema: "Crema", marron: "Marrón", caramel: "Caramel",
}

function colorLabel(c: string) {
  return COLOR_LABELS[c] ?? c
}

// ============================================================
// Component
// ============================================================

export function DesignChat({
  session,
  setSession,
}: {
  session: DesignSession
  setSession: React.Dispatch<React.SetStateAction<DesignSession>>
}) {
  const { toast } = useToast()
  const { addItem } = useCart()

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hola! Describime el diseño que querés en tu prenda — yo lo genero. Podés pedir algo como: \"tigre psicodélico estilo años 70, colores vibrantes\".",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState<string>("Generando diseño...")
  const [mockupLoading, setMockupLoading] = useState(false)
  const [pendingAttachment, setPendingAttachment] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState("M")
  const [orientation, setOrientation] = useState<"vertical" | "horizontal" | "cuadrado">("cuadrado")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastPromptRef = useRef<string>("")

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ---- Upload attachment ----
  const handleAttach = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Solo imágenes JPG/PNG", variant: "destructive" })
      return
    }
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/public/design/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? "Error subiendo imagen")
      setPendingAttachment(data.url)
      toast({
        title: "Imagen adjuntada",
        description: "Decime qué hacer: 'usala tal cual', 'sacale el fondo', o cualquier otra modificación.",
      })
    } catch (e: any) {
      toast({ title: "Error al adjuntar", description: e.message, variant: "destructive" })
    }
  }, [toast])

  // ---- Generate design ----
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Msg = {
      role: "user",
      text,
      attachmentUrl: pendingAttachment ?? undefined,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setPendingAttachment(null)
    // Operation-specific loading label (mismo regex que el routing block)
    const willRemoveBg = /\b(sin\s+fondo|fondo\s+transparente|transparente|(sa(c|qu)[a-zíéáóú]*|quit[a-zíéáóú]*|remov[a-zíéáóú]*)\b.{0,20}\bfondo|remove\s+(the\s+)?background|no\s+background|background\s+removal|transparent\s+background)\b/i.test(text)
    const hadAttachmentLocal = !!pendingAttachment
    const hadPreviousDesignLocal = !!session.currentDesignUrl
    if (willRemoveBg && (hadAttachmentLocal || hadPreviousDesignLocal)) {
      setLoadingLabel("Removiendo fondo... (la primera vez tarda ~30s, después es instantáneo)")
    } else if (hadAttachmentLocal) {
      setLoadingLabel("Procesando tu imagen...")
    } else if (hadPreviousDesignLocal) {
      setLoadingLabel("Aplicando cambios...")
    } else {
      setLoadingLabel("Generando diseño...")
    }
    setLoading(true)

    try {
      // Decision tree:
      // 0) Intent: REMOVE BG — modelo dedicado @imgly (mucho mejor que Gemini)
      // 1) User subio imagen como referencia → image-to-image edit
      // 2) Ya hay un design previo → iterar con image-to-image edit
      // 3) Sino → generar desde texto
      const hasAttachment = !!pendingAttachment
      const hasPreviousDesign = !!session.currentDesignUrl

      // Detecta intent de bg removal. Cubre variantes coloquiales en español:
      //   "sacar el fondo" / "sácale" / "sacalo" / "sacale el fondo"
      //   "quitar" / "quitale" / "remover" / "removelo"
      //   "sin fondo" / "fondo transparente" / "transparente"
      //   English: "remove background" / "no background" / "transparent"
      const removeBgPattern = /\b(sin\s+fondo|fondo\s+transparente|transparente|(sa(c|qu)[a-zíéáóú]*|quit[a-zíéáóú]*|remov[a-zíéáóú]*)\b.{0,20}\bfondo|remove\s+(the\s+)?background|no\s+background|background\s+removal|transparent\s+background)\b/i
      const isRemoveBgIntent = removeBgPattern.test(text) && (hasAttachment || hasPreviousDesign)

      // Intent: "usá la imagen tal cual" — saltea Gemini, usa el upload directo
      const useAsIsPattern =
        /\b(tal\s+cual|tal\s+como\s+est[aá]|como\s+est[aá]|sin\s+cambi(o|os|arl[aoe]|arl)|no\s+(la\s+)?cambies|us[aá]la?\s+as[ií]|as?\s+is|como\s+viene|sin\s+modificar|no\s+modifiques)\b/i
      const isUseAsIsIntent = useAsIsPattern.test(text) && hasAttachment

      let endpoint: string
      let body: Record<string, unknown>

      if (isUseAsIsIntent) {
        // User explicitamente pidio usar la imagen tal cual — usamos el upload
        // directo como design SIN pasar por Gemini (mas rapido + cero modificacion).
        const directUrl = pendingAttachment!
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Listo, uso tu foto tal cual como diseño. Generando mockup en la prenda...",
            imageUrl: directUrl,
          },
        ])
        setSession((prev) => ({ ...prev, currentDesignUrl: directUrl, currentMockupUrl: null }))
        lastPromptRef.current = text
        setLoading(false)
        // Trigger mockup automaticamente — el user ya dijo que era lo que queria
        setTimeout(() => {
          setMockupLoading(true)
          fetch("/api/generate-mockup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              designImageUrl: directUrl,
              garmentType: session.garmentType,
              garmentColor: session.garmentColor,
              side: session.side,
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.mockupUrl) {
                setSession((prev) => ({ ...prev, currentMockupUrl: d.mockupUrl }))
                toast({ title: "Mockup listo", description: "Tu foto en la prenda 👇" })
              }
            })
            .catch(() => {
              toast({ title: "No se pudo generar el mockup", description: "Tocá 'Probar en prenda' para reintentar", variant: "destructive" })
            })
            .finally(() => setMockupLoading(false))
        }, 100)
        return
      }

      if (isRemoveBgIntent) {
        // Server-side bg removal con Gemini Nano Banana 2 + prompt quirúrgico.
        // Mucho más confiable que @imgly client-side (CSP/WASM issues en prod).
        const srcUrl = hasAttachment ? pendingAttachment! : session.currentDesignUrl!
        const removeRes = await fetch("/api/public/design/remove-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: srcUrl }),
        })
        const removeData = await removeRes.json()
        if (!removeRes.ok || !removeData.images?.[0]?.url) {
          throw new Error(removeData.error ?? "No se pudo remover el fondo")
        }
        const cleanUrl: string = removeData.images[0].url

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Listo, te lo dejé con fondo transparente:",
            imageUrl: cleanUrl,
          },
        ])
        setSession((prev) => ({ ...prev, currentDesignUrl: cleanUrl, currentMockupUrl: null }))
        lastPromptRef.current = text
        setLoading(false)
        return
      }

      // Aspect ratio según la orientación elegida
      const aspectSize =
        orientation === "vertical"
          ? { width: 768, height: 1024 }
          : orientation === "horizontal"
            ? { width: 1024, height: 768 }
            : { width: 1024, height: 1024 } // cuadrado

      if (hasAttachment || hasPreviousDesign) {
        endpoint = "/api/public/design/edit"
        body = {
          previousImageUrl: hasAttachment ? pendingAttachment : session.currentDesignUrl,
          instruction: text,
          mode: hasAttachment ? "photo" : "illustration",
          raw: true,
          garmentColor: session.garmentColor,
        }
      } else {
        endpoint = "/api/generate-image"
        body = {
          prompt: text,
          raw: true,
          size: aspectSize,
          garmentColor: session.garmentColor,
        }
      }

      const useEdit = endpoint !== "/api/generate-image"

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok || !data.images?.[0]?.url) {
        throw new Error(data.error ?? "No se pudo generar la imagen")
      }

      const imageUrl: string = data.images[0].url
      const promptUsed: string = data.promptUsed ?? text
      lastPromptRef.current = promptUsed

      const assistantMsg: Msg = {
        role: "assistant",
        text: isRemoveBgIntent
          ? "Listo, te lo dejé con fondo transparente:"
          : useEdit
            ? hasAttachment
              ? "Listo, esto es lo que conseguí con tu foto:"
              : "Acá va la versión actualizada:"
            : "Acá está tu diseño:",
        imageUrl,
        prompt: promptUsed,
      }
      setMessages((prev) => [...prev, assistantMsg])

      setSession((prev) => ({
        ...prev,
        currentDesignUrl: imageUrl,
        currentMockupUrl: null, // reset mockup on new design
      }))
    } catch (e: any) {
      toast({ title: "Error generando diseño", description: e.message, variant: "destructive" })
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Lo siento, hubo un error: ${e.message}` },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, pendingAttachment, session.currentDesignUrl, setSession, toast])

  // ---- Generate mockup ----
  const handleMockup = useCallback(async () => {
    if (!session.currentDesignUrl || mockupLoading) return
    setMockupLoading(true)
    try {
      const res = await fetch("/api/generate-mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designImageUrl: session.currentDesignUrl,
          garmentType: session.garmentType,
          garmentColor: session.garmentColor,
          side: session.side,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.mockupUrl) throw new Error(data.error ?? "Error generando mockup")
      setSession((prev) => ({ ...prev, currentMockupUrl: data.mockupUrl }))
      toast({ title: "Mockup listo", description: "Tu diseño en la prenda ya está." })
    } catch (e: any) {
      toast({ title: "Error en mockup", description: e.message, variant: "destructive" })
    } finally {
      setMockupLoading(false)
    }
  }, [session, setSession, mockupLoading, toast])

  // ---- Add to cart ----
  const handleAddToCart = useCallback(() => {
    if (!session.currentMockupUrl) return
    const id = `custom-${session.garmentType}-${session.garmentColor}-${Date.now()}`
    addItem({
      id,
      name: `${garmentLabel(session.garmentType)} Custom — Novamente`,
      garmentType: session.garmentType,
      color: session.garmentColor,
      garmentColor: session.garmentColor,
      size: selectedSize,
      price: PRICES[session.garmentType] ?? 35000,
      quantity: 1,
      image: session.currentMockupUrl,
      mockupUrl: session.currentMockupUrl,
      frontDesign: session.side === "front" ? session.currentDesignUrl ?? undefined : undefined,
      backDesign: session.side === "back" ? session.currentDesignUrl ?? undefined : undefined,
    })
    toast({ title: "Agregado al carrito", description: `${garmentLabel(session.garmentType)} talle ${selectedSize}` })
  }, [session, selectedSize, addItem, toast])

  // ---- Keyboard submit ----
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const previewUrl = session.currentMockupUrl ?? session.currentDesignUrl

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[70vh]">
      {/* ========== LEFT: Chat ========== */}
      <div className="flex flex-col flex-1 min-w-0 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                }`}
              >
                {/* User attachment preview */}
                {msg.attachmentUrl && (
                  <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                    <Image
                      src={msg.attachmentUrl}
                      alt="Referencia adjunta"
                      width={200}
                      height={200}
                      className="object-cover"
                    />
                  </div>
                )}

                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                {/* Generated image thumbnail */}
                {msg.imageUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                    <Image
                      src={msg.imageUrl}
                      alt="Diseño generado"
                      width={280}
                      height={280}
                      className="object-contain bg-white/5"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-sm text-zinc-300">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                {loadingLabel}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick action chips — solo cuando hay 1 mensaje (el welcome) */}
        {messages.length === 1 && !loading && (
          <div className="px-4 pt-1 pb-3 flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-200 hover:border-violet-500 hover:text-white transition"
            >
              📸 Subir foto + sacar fondo
            </button>
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click()
                setInput("usá esta imagen tal cual, no le cambies nada")
              }}
              className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-200 hover:border-violet-500 hover:text-white transition"
            >
              🖼️ Subir foto y usar tal cual
            </button>
            <button
              type="button"
              onClick={() => setInput("tigre psicodélico estilo años 70, colores vibrantes")}
              className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-200 hover:border-violet-500 hover:text-white transition"
            >
              🎨 Generar diseño con IA
            </button>
            <button
              type="button"
              onClick={() => setInput("dragón japonés estilo ukiyo-e, negro y rojo")}
              className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-200 hover:border-violet-500 hover:text-white transition"
            >
              🐉 Dragón ukiyo-e
            </button>
            <button
              type="button"
              onClick={() => setInput("frase tipográfica brutalista en español, alto contraste")}
              className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-200 hover:border-violet-500 hover:text-white transition"
            >
              ✏️ Tipografía
            </button>
          </div>
        )}

        {/* Smart suggestions — debajo del último mensaje del bot con imagen */}
        {!loading && session.currentDesignUrl && (
          <div className="px-4 pt-1 pb-3 flex gap-2 overflow-x-auto border-t border-zinc-800">
            {[
              { label: "Sin fondo", value: "sacale el fondo" },
              { label: "Más oscuro", value: "hacelo más oscuro y dramático" },
              { label: "Más colores", value: "más vibrante y con más colores" },
              { label: "Estilo línea", value: "convertilo a estilo line-art minimalista" },
              { label: "Más detalles", value: "agregale más detalles intrincados" },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setInput(s.value)}
                className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-500 hover:text-white transition"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Orientation selector — visible siempre que no haya imagen previa
            (cuando hay design previo el aspect ratio ya está definido) */}
        {!session.currentDesignUrl && !pendingAttachment && (
          <div className="px-4 pt-1 pb-2 border-t border-zinc-800 flex items-center gap-2">
            <span className="text-xs text-zinc-500">Orientación:</span>
            {(["vertical", "horizontal", "cuadrado"] as const).map((o) => {
              const isActive = orientation === o
              const icon = o === "vertical" ? "▯" : o === "horizontal" ? "▭" : "▢"
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrientation(o)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                    isActive
                      ? "border-violet-500 bg-violet-600/20 text-white"
                      : "border-zinc-700 bg-transparent text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  <span className="text-base leading-none">{icon}</span>
                  <span className="capitalize">{o}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Pending attachment preview */}
        {pendingAttachment && (
          <div className="px-4 py-2 border-t border-zinc-800 flex items-center gap-2">
            <div className="relative w-10 h-10 rounded overflow-hidden border border-zinc-600">
              <Image src={pendingAttachment} alt="Adjunto" fill className="object-cover" />
            </div>
            <span className="text-xs text-zinc-400 flex-1">Imagen adjuntada como referencia</span>
            <button
              className="text-zinc-500 hover:text-zinc-200 text-xs"
              onClick={() => setPendingAttachment(null)}
            >
              Quitar
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-zinc-800 p-4">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={(e) => {
                // Permite pegar imagen del clipboard (Ctrl+V) — busca un
                // ClipboardItem de tipo image/* y lo trata como attachment.
                const items = Array.from(e.clipboardData?.items ?? [])
                const imgItem = items.find((it) => it.type.startsWith("image/"))
                if (imgItem) {
                  e.preventDefault()
                  const file = imgItem.getAsFile()
                  if (file) {
                    void handleAttach(file)
                  }
                }
              }}
              placeholder={
                session.currentDesignUrl
                  ? pendingAttachment
                    ? "¿Qué hago con tu imagen? \"usala tal cual\", \"sacale el fondo\", \"hacela tipo dibujo\"..."
                    : "Sugerí un cambio: \"hacelo más oscuro\", \"agregá detalles en dorado\"..."
                  : pendingAttachment
                    ? "¿Qué hago con tu imagen? \"usala tal cual\", \"sacale el fondo\", \"hacela tipo dibujo\"..."
                    : "Describí tu diseño: \"lobo en acuarela, fondo transparente\"..."
              }
              rows={2}
              className="flex-1 resize-none bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500"
              disabled={loading}
            />

            {/* Attach button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAttach(file)
                e.target.value = ""
              }}
            />
            <Button
              variant="outline"
              size="icon"
              className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 h-[58px] shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Adjuntar imagen de referencia"
            >
              <Paperclip className="w-4 h-4 text-zinc-400" />
            </Button>

            {/* Send button */}
            <Button
              size="icon"
              aria-label="Enviar prompt"
              data-testid="send-prompt"
              className="bg-violet-600 hover:bg-violet-500 h-[58px] w-[58px] shrink-0"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <p className="text-xs text-zinc-600 mt-2">
            Enter para enviar · Shift+Enter nueva línea · 📎 o Ctrl+V para pegar imagen
          </p>
        </div>
      </div>

      {/* ========== RIGHT: Preview + Controls ========== */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4">
        {/* Preview card */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="p-3 border-b border-zinc-800">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {session.currentMockupUrl ? "Mockup en prenda" : session.currentDesignUrl ? "Diseño generado" : "Preview"}
            </p>
          </div>

          <div className="aspect-square bg-zinc-950 flex items-center justify-center">
            {previewUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={previewUrl}
                  alt={session.currentMockupUrl ? "Mockup" : "Diseño"}
                  fill
                  className="object-contain p-2"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-zinc-700">
                <Shirt className="w-12 h-12" />
                <p className="text-sm text-center px-4">
                  Tu diseño aparecerá acá
                </p>
              </div>
            )}
          </div>

          {/* Reset mockup button */}
          {session.currentMockupUrl && (
            <div className="p-2 border-t border-zinc-800">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-zinc-500 hover:text-zinc-300 text-xs"
                onClick={() => setSession((prev) => ({ ...prev, currentMockupUrl: null }))}
              >
                <RotateCcw className="w-3 h-3 mr-1.5" />
                Ver diseño sin prenda
              </Button>
            </div>
          )}
        </div>

        {/* Garment catalog */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          <GarmentCatalog
            garmentType={session.garmentType}
            garmentColor={session.garmentColor}
            side={session.side}
            onChange={({ garmentType, garmentColor, side }) =>
              setSession((prev) => ({ ...prev, garmentType, garmentColor, side, currentMockupUrl: null }))
            }
          />

          {/* Mockup button */}
          <Button
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm mt-4"
            onClick={handleMockup}
            disabled={!session.currentDesignUrl || mockupLoading}
          >
            {mockupLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Probando en prenda...
              </>
            ) : (
              <>
                <Shirt className="w-4 h-4 mr-2" />
                Probar en prenda
              </>
            )}
          </Button>
        </div>

        {/* Cart controls — only when mockup exists */}
        {session.currentMockupUrl && (
          <div className="bg-zinc-900 rounded-2xl border border-violet-800/40 p-4 space-y-3">
            <p className="text-xs font-medium text-violet-400 uppercase tracking-wider">Agregar al carrito</p>

            {/* Size selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500">Talle</label>
              <div className="flex gap-1.5 flex-wrap">
                {SIZE_OPTIONS.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      selectedSize === sz
                        ? "bg-violet-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">
                {garmentLabel(session.garmentType)} · {colorLabel(session.garmentColor)}
              </span>
              <span className="text-white font-semibold">
                ${(PRICES[session.garmentType] ?? 35000).toLocaleString("es-AR")}
              </span>
            </div>

            <Button
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Agregar al carrito
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
