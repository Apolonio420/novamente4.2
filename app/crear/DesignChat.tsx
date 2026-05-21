"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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
  Zap,
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

import { CATALOG_PRODUCTS, getCatalogProduct, getCatalogProductColor } from "@/lib/catalog/products"
import * as fpixel from "@/lib/fpixel"

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"]

// Helpers usando el catalog como fuente de verdad
function garmentLabel(key: string) {
  return getCatalogProduct(key)?.name ?? key
}
function colorLabel(productKey: string, colorKey: string) {
  return getCatalogProductColor(productKey, colorKey)?.name ?? colorKey
}
function getPrice(key: string) {
  return getCatalogProduct(key)?.retailARS ?? 35000
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
  const router = useRouter()

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hola! Describime el diseño que querés en tu prenda — yo lo genero. Podés pedir algo como: \"tigre psicodélico estilo años 70, colores vibrantes\".",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState<string>("Generando diseño...")
  const [loadingSubtext, setLoadingSubtext] = useState<string>("Esto puede tardar unos segundos...")
  const [mockupLoading, setMockupLoading] = useState(false)
  const [pendingAttachment, setPendingAttachment] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState("M")
  const [orientation, setOrientation] = useState<"vertical" | "horizontal" | "cuadrado">("cuadrado")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastPromptRef = useRef<string>("")
  // Ref a handleBuyNow para que el intent detector lo pueda invocar sin
  // forward-reference problems (handleBuyNow esta declarado mas abajo)
  const buyNowRef = useRef<(() => void) | null>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Rotating subtext durante el loading — 30s se sienten como 3s con feedback
  useEffect(() => {
    if (!loading) return
    const messages = [
      "Esto puede tardar unos segundos...",
      "Optimizando trazo vectorial...",
      "Aplicando reglas de impresión textil...",
      "Verificando contraste sobre la prenda...",
      "Casi listo, dando los toques finales...",
    ]
    let idx = 0
    setLoadingSubtext(messages[0])
    const interval = setInterval(() => {
      idx = Math.min(idx + 1, messages.length - 1)
      setLoadingSubtext(messages[idx])
    }, 5000)
    return () => clearInterval(interval)
  }, [loading])

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
  // `overridePrompt` permite que botones inline disparen sin pasar por
  // el state de `input` (evita closure issues con useCallback deps).
  const handleSend = useCallback(async (overridePrompt?: string) => {
    const text = (overridePrompt ?? input).trim()
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

      // Intent: "quiero comprar" — si ya hay mockup, mandar al checkout directo
      const buyIntentPattern =
        /\b(quiero\s+(comprar|llevar|este)|me\s+lo\s+llevo|lo\s+quiero|lo\s+compro|comprar\s+(ya|esto|este)|agreg(alo|alo\s+al)|listo\s+(para|lo)\s+(comprar|llevar)|ya\s+est[áa]\s+listo|me\s+gusta\s+as[ií])\b/i
      const isBuyIntent =
        buyIntentPattern.test(text) && !!session.currentMockupUrl && !!session.currentDesignUrl
      if (isBuyIntent) {
        // Mensaje en el chat + redirect al checkout (handleBuyNow no se puede
        // llamar aca porque esta abajo; replicamos el flow inline)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Perfecto, te llevo al checkout con tu pedido cargado 🛒",
          },
        ])
        setLoading(false)
        // Disparar handleBuyNow programaticamente via ref
        setTimeout(() => buyNowRef.current?.(), 300)
        return
      }

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
        setSession((prev) => ({
          ...prev,
          currentDesignUrl: directUrl,
          frontDesignUrl: prev.side === "front" ? directUrl : prev.frontDesignUrl,
          backDesignUrl: prev.side === "back" ? directUrl : prev.backDesignUrl,
          currentMockupUrl: null,
          mockupGeneratedFor: null,
          designHistory: [directUrl, ...prev.designHistory.filter((u) => u !== directUrl)].slice(0, 5),
        }))
        lastPromptRef.current = text
        setLoading(false)
        // Trigger mockup automaticamente — el user ya dijo que era lo que queria
        setTimeout(() => {
          setMockupLoading(true)
          fetch("/api/public/design/mockup-lifestyle", {
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
              // El endpoint devuelve publicUrl (no mockupUrl) — fallback por compat
              const mockupUrl = d.publicUrl ?? d.mockupUrl
              if (mockupUrl) {
                setSession((prev) => ({
                  ...prev,
                  currentMockupUrl: mockupUrl,
                  mockupGeneratedFor: {
                    garmentType: prev.garmentType,
                    garmentColor: prev.garmentColor,
                    side: prev.side,
                    designUrl: prev.currentDesignUrl ?? "",
                  },
                }))
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
        setSession((prev) => ({
          ...prev,
          currentDesignUrl: cleanUrl,
          frontDesignUrl: prev.side === "front" ? cleanUrl : prev.frontDesignUrl,
          backDesignUrl: prev.side === "back" ? cleanUrl : prev.backDesignUrl,
          currentMockupUrl: null,
          mockupGeneratedFor: null,
          designHistory: [cleanUrl, ...prev.designHistory.filter((u) => u !== cleanUrl)].slice(0, 5),
        }))
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
        // Guardamos el design en el slot del lado actual (front o back)
        frontDesignUrl: prev.side === "front" ? imageUrl : prev.frontDesignUrl,
        backDesignUrl: prev.side === "back" ? imageUrl : prev.backDesignUrl,
        currentMockupUrl: null, // reset mockup on new design
        mockupGeneratedFor: null,
        designHistory: [imageUrl, ...prev.designHistory.filter((u) => u !== imageUrl)].slice(0, 5),
      }))
      // ViewContent → señal a Meta de "el user vio un producto/diseño". Sin
      // esto Meta no puede optimizar audiencias.
      fpixel.event("ViewContent", {
        content_ids: [imageUrl],
        content_name: `Diseño AI — ${session.garmentType}`,
        content_type: "product",
        content_category: session.garmentType,
        value: getPrice(session.garmentType),
        currency: "ARS",
      })
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

  // ---- Generate mockup LIFESTYLE ----
  // Usa Gemini para generar foto realista de persona con la prenda. Reemplaza
  // el compositor canvas estático que tenía problemas de transparencia
  // (checker pattern visible sobre la prenda).
  const handleMockup = useCallback(async () => {
    if (!session.currentDesignUrl || mockupLoading) return
    setMockupLoading(true)
    try {
      const res = await fetch("/api/public/design/mockup-lifestyle", {
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
      const mockupUrl = data.publicUrl ?? data.mockupUrl
      if (!res.ok || !mockupUrl) throw new Error(data.error ?? "Error generando mockup")
      setSession((prev) => ({
        ...prev,
        currentMockupUrl: mockupUrl,
        mockupGeneratedFor: {
          garmentType: prev.garmentType,
          garmentColor: prev.garmentColor,
          side: prev.side,
          designUrl: prev.currentDesignUrl ?? "",
        },
      }))
      toast({ title: "Mockup listo", description: "Tu prenda en una foto lifestyle 👇" })
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
    const price = getPrice(session.garmentType)
    const name = `${garmentLabel(session.garmentType)} Custom — Novamente`
    addItem({
      id,
      name,
      garmentType: session.garmentType,
      color: session.garmentColor,
      garmentColor: session.garmentColor,
      size: selectedSize,
      price,
      quantity: 1,
      image: session.currentMockupUrl,
      mockupUrl: session.currentMockupUrl,
      frontDesign: session.side === "front" ? session.currentDesignUrl ?? undefined : undefined,
      backDesign: session.side === "back" ? session.currentDesignUrl ?? undefined : undefined,
    })
    // Pixel events para que Meta+Google puedan optimizar el funnel
    fpixel.event("AddToCart", {
      content_ids: [id],
      content_name: name,
      content_type: "product",
      content_category: session.garmentType,
      value: price,
      currency: "ARS",
    })
    toast({ title: "Agregado al carrito", description: `${garmentLabel(session.garmentType)} talle ${selectedSize}` })
  }, [session, selectedSize, addItem, toast])

  // ---- Buy now: add + InitiateCheckout + redirect ----
  // 1-click checkout pattern (Amazon/Custom Ink) — convierte ~20-40% mejor que
  // pasar por el cart intermedio cuando el user ya está decidido.
  const handleBuyNow = useCallback(() => {
    if (!session.currentMockupUrl) return
    const id = `custom-${session.garmentType}-${session.garmentColor}-${Date.now()}`
    const price = getPrice(session.garmentType)
    const name = `${garmentLabel(session.garmentType)} Custom — Novamente`
    addItem({
      id,
      name,
      garmentType: session.garmentType,
      color: session.garmentColor,
      garmentColor: session.garmentColor,
      size: selectedSize,
      price,
      quantity: 1,
      image: session.currentMockupUrl,
      mockupUrl: session.currentMockupUrl,
      frontDesign: session.side === "front" ? session.currentDesignUrl ?? undefined : undefined,
      backDesign: session.side === "back" ? session.currentDesignUrl ?? undefined : undefined,
    })
    // Pixel: ambos eventos juntos para señal completa de intent
    fpixel.event("AddToCart", {
      content_ids: [id],
      content_name: name,
      content_type: "product",
      content_category: session.garmentType,
      value: price,
      currency: "ARS",
    })
    fpixel.event("InitiateCheckout", {
      content_ids: [id],
      content_name: name,
      content_type: "product",
      num_items: 1,
      value: price,
      currency: "ARS",
    })
    router.push("/checkout")
  }, [session, selectedSize, addItem, router])

  // Wire buyNowRef → handleBuyNow para que intent detector pueda invocarlo
  useEffect(() => {
    buyNowRef.current = handleBuyNow
  }, [handleBuyNow])

  // Abandoned cart recovery: si user genera mockup pero no compra, guardar
  // snapshot en localStorage. Al volver a /crear se recupera.
  useEffect(() => {
    if (typeof window === "undefined") return
    // Inline stale check (mockupIsStale declarado mas abajo)
    const isStale =
      session.currentMockupUrl !== null &&
      session.mockupGeneratedFor !== null &&
      (session.mockupGeneratedFor.garmentType !== session.garmentType ||
        session.mockupGeneratedFor.garmentColor !== session.garmentColor ||
        session.mockupGeneratedFor.side !== session.side ||
        session.mockupGeneratedFor.designUrl !== session.currentDesignUrl)
    if (session.currentMockupUrl && !isStale) {
      window.localStorage.setItem(
        "novamente:abandoned-design",
        JSON.stringify({
          mockupUrl: session.currentMockupUrl,
          designUrl: session.currentDesignUrl,
          garmentType: session.garmentType,
          garmentColor: session.garmentColor,
          side: session.side,
          savedAt: Date.now(),
        }),
      )
    }
  }, [
    session.currentMockupUrl,
    session.currentDesignUrl,
    session.garmentType,
    session.garmentColor,
    session.side,
    session.mockupGeneratedFor,
  ])

  // Al montar el componente: si hay un design abandonado <72h, recuperarlo
  const [abandonedRecovery, setAbandonedRecovery] = useState<{
    mockupUrl: string
    designUrl: string
    garmentType: string
    garmentColor: string
    side: "front" | "back"
    savedAt: number
  } | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (session.currentMockupUrl) return // ya hay diseño actual
    try {
      const raw = window.localStorage.getItem("novamente:abandoned-design")
      if (!raw) return
      const data = JSON.parse(raw)
      const ageHours = (Date.now() - (data.savedAt ?? 0)) / 3_600_000
      if (ageHours < 72 && data.mockupUrl && data.designUrl) {
        setAbandonedRecovery(data)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Keyboard submit ----
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const previewUrl = session.currentMockupUrl ?? session.currentDesignUrl

  // Stale: el mockup actual fue generado para otra prenda/color/lado/diseño
  const mockupIsStale =
    session.currentMockupUrl !== null &&
    session.mockupGeneratedFor !== null &&
    (session.mockupGeneratedFor.garmentType !== session.garmentType ||
      session.mockupGeneratedFor.garmentColor !== session.garmentColor ||
      session.mockupGeneratedFor.side !== session.side ||
      session.mockupGeneratedFor.designUrl !== session.currentDesignUrl)

  return (
    <>
      {/* Abandoned cart recovery modal */}
      {abandonedRecovery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-violet-700 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Tenés un diseño esperando 🎨</h3>
            <p className="text-sm text-zinc-400">
              La última vez creaste un mockup en {garmentLabel(abandonedRecovery.garmentType)}{" "}
              {colorLabel(abandonedRecovery.garmentType, abandonedRecovery.garmentColor)} pero no completaste la compra.
            </p>
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-zinc-700">
              <Image src={abandonedRecovery.mockupUrl} alt="Tu diseño" fill className="object-contain" unoptimized />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-violet-600 hover:bg-violet-500"
                onClick={() => {
                  setSession((prev) => ({
                    ...prev,
                    currentMockupUrl: abandonedRecovery.mockupUrl,
                    currentDesignUrl: abandonedRecovery.designUrl,
                    frontDesignUrl: abandonedRecovery.side === "front" ? abandonedRecovery.designUrl : prev.frontDesignUrl,
                    backDesignUrl: abandonedRecovery.side === "back" ? abandonedRecovery.designUrl : prev.backDesignUrl,
                    garmentType: abandonedRecovery.garmentType,
                    garmentColor: abandonedRecovery.garmentColor,
                    side: abandonedRecovery.side,
                    mockupGeneratedFor: {
                      garmentType: abandonedRecovery.garmentType,
                      garmentColor: abandonedRecovery.garmentColor,
                      side: abandonedRecovery.side,
                      designUrl: abandonedRecovery.designUrl,
                    },
                    designHistory: [abandonedRecovery.designUrl, ...prev.designHistory.filter((u) => u !== abandonedRecovery.designUrl)].slice(0, 5),
                  }))
                  setAbandonedRecovery(null)
                  toast({ title: "Diseño recuperado", description: "Listo para comprar 🛒" })
                }}
              >
                Continuar donde lo dejé
              </Button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.localStorage.removeItem("novamente:abandoned-design")
                  }
                  setAbandonedRecovery(null)
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 text-center py-2"
              >
                Empezar uno nuevo
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-zinc-300 min-w-[240px]">
                <div className="flex items-center gap-2 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  {loadingLabel}
                </div>
                <div className="text-xs text-zinc-500 mt-1 transition-opacity duration-300">
                  {loadingSubtext}
                </div>
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
              📸 Subir mi foto
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

        {/* Pending attachment — preview + 3 acciones explicitas */}
        {pendingAttachment && (
          <div className="border-t border-zinc-800 bg-zinc-900/50">
            <div className="px-4 py-3 flex items-start gap-3">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-600 shrink-0">
                <Image src={pendingAttachment} alt="Adjunto" fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Tu imagen está lista</span>
                  <button
                    className="text-zinc-500 hover:text-zinc-200 text-xs"
                    onClick={() => setPendingAttachment(null)}
                  >
                    Quitar
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mb-2.5">¿Qué hacemos con ella?</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSend("sacale el fondo y dejá solo el sujeto principal")}
                    className="rounded-full bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 text-xs font-medium transition"
                  >
                    🎯 Solo el sujeto (sacar fondo)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend("usá esta imagen tal cual, no le cambies nada")}
                    className="rounded-full border border-zinc-700 hover:border-violet-500 text-zinc-200 px-3 py-1.5 text-xs transition"
                  >
                    🖼️ Foto entera
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend("convertilo a estilo ilustración línea limpia, fondo transparente")}
                    className="rounded-full border border-zinc-700 hover:border-violet-500 text-zinc-200 px-3 py-1.5 text-xs transition"
                  >
                    ✏️ Convertir a dibujo
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-2">O escribí abajo qué querés cambiar.</p>
              </div>
            </div>
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
              onClick={() => handleSend()}
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
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {session.currentMockupUrl ? "Mockup en prenda" : session.currentDesignUrl ? "Diseño generado" : "Preview"}
            </p>
            {mockupIsStale && (
              <span className="text-[10px] font-medium text-amber-400 bg-amber-950/40 border border-amber-800/40 rounded-full px-2 py-0.5">
                Mockup desactualizado
              </span>
            )}
          </div>
          {mockupIsStale && (
            <div className="px-3 py-2 bg-amber-950/20 border-b border-amber-800/30 text-[11px] text-amber-300 leading-snug">
              Cambiaste de prenda/color desde el último mockup. Tocá "Probar en {garmentLabel(session.garmentType)} {colorLabel(session.garmentType, session.garmentColor)}" para regenerar.
            </div>
          )}

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
              setSession((prev) => {
                // Al cambiar side, currentDesignUrl pasa al diseño del nuevo lado
                // (si hay) o queda en el del lado anterior si el nuevo no tiene.
                const sideChanged = side !== prev.side
                const nextDesignForSide =
                  side === "front" ? prev.frontDesignUrl : prev.backDesignUrl
                return {
                  ...prev,
                  garmentType,
                  garmentColor,
                  side,
                  currentDesignUrl: sideChanged
                    ? nextDesignForSide ?? prev.currentDesignUrl
                    : prev.currentDesignUrl,
                  // NO reseteamos mockup aca — el stale indicator se encarga
                  // de mostrar si esta desactualizado.
                }
              })
            }
          />

          {/* Size selector — siempre visible para que el user lo elija desde temprano */}
          <div className="mt-4 space-y-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Talle</label>
            <div className="flex gap-1.5 flex-wrap">
              {SIZE_OPTIONS.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`min-w-[36px] px-2.5 py-1 rounded text-xs font-medium transition ${
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

          {/* Mockup button */}
          <Button
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm mt-4"
            onClick={handleMockup}
            disabled={!session.currentDesignUrl || mockupLoading}
          >
            {mockupLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generando foto en {garmentLabel(session.garmentType).toLowerCase()} {colorLabel(session.garmentType, session.garmentColor).toLowerCase()}...
              </>
            ) : (
              <>
                <Shirt className="w-4 h-4 mr-2" />
                Probar en {garmentLabel(session.garmentType)} {colorLabel(session.garmentType, session.garmentColor)}
              </>
            )}
          </Button>
        </div>

        {/* Design history — últimos 5 diseños generados, click para volver a usar */}
        {session.designHistory.length > 1 && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-3">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Tus diseños recientes ({session.designHistory.length})
            </p>
            <div className="flex gap-2 overflow-x-auto">
              {session.designHistory.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => {
                    setSession((prev) => ({
                      ...prev,
                      currentDesignUrl: url,
                      frontDesignUrl: prev.side === "front" ? url : prev.frontDesignUrl,
                      backDesignUrl: prev.side === "back" ? url : prev.backDesignUrl,
                    }))
                  }}
                  className={`relative w-14 h-14 shrink-0 rounded-md overflow-hidden border-2 transition ${
                    session.currentDesignUrl === url
                      ? "border-violet-500"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                  title="Usar este diseño"
                >
                  <Image src={url} alt="Diseño" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Social share — when mockup ready */}
        {session.currentMockupUrl && !mockupIsStale && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-3">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Compartir
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  const url = session.currentMockupUrl!
                  const absolute = url.startsWith("http") ? url : `${window.location.origin}${url}`
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: `Mi diseño en Novamente · ${garmentLabel(session.garmentType)}`,
                        text: "Mirá lo que diseñé en novamente.ar 🔥",
                        url: absolute,
                      })
                    } catch {}
                  } else {
                    await navigator.clipboard.writeText(absolute)
                    toast({ title: "Link copiado", description: "Pegalo donde quieras compartirlo" })
                  }
                }}
                className="flex-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs py-2 px-3 transition flex items-center justify-center gap-1.5"
              >
                📤 Compartir
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Mirá lo que diseñé en Novamente: ${session.currentMockupUrl?.startsWith("http") ? session.currentMockupUrl : ""}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-md bg-green-700 hover:bg-green-600 text-white text-xs py-2 px-3 transition flex items-center justify-center gap-1.5"
              >
                💬 WhatsApp
              </a>
              <a
                href={session.currentMockupUrl?.startsWith("http") ? session.currentMockupUrl : (typeof window !== "undefined" ? `${window.location.origin}${session.currentMockupUrl}` : "#")}
                download={`novamente-mockup-${Date.now()}.png`}
                className="flex-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs py-2 px-3 transition flex items-center justify-center gap-1.5"
              >
                ⬇️ Descargar
              </a>
            </div>
          </div>
        )}

        {/* Cart controls — only when mockup exists AND is fresh */}
        {session.currentMockupUrl && !mockupIsStale && (
          <div className="bg-zinc-900 rounded-2xl border border-violet-800/40 p-4 space-y-3">
            <p className="text-xs font-medium text-violet-400 uppercase tracking-wider">
              Agregar al carrito · Talle {selectedSize}
            </p>

            {/* Price */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">
                {garmentLabel(session.garmentType)} · {colorLabel(session.garmentType, session.garmentColor)}
              </span>
              <span className="text-white font-semibold">
                ${(getPrice(session.garmentType)).toLocaleString("es-AR")}
              </span>
            </div>
            <div className="text-[11px] text-emerald-400/90 -mt-1.5">
              o 3 cuotas de ${Math.round(getPrice(session.garmentType) / 3).toLocaleString("es-AR")} sin interés
            </div>

            {/* Price comparison vs competidor — para mostrar valor */}
            {(() => {
              const ours = getPrice(session.garmentType)
              // Comparativa estimada — Printful + envío AR es ~50% más caro
              const competitor = Math.round(ours * 1.45)
              const savings = competitor - ours
              if (savings < 5000) return null
              return (
                <div className="text-[10px] text-zinc-500 -mt-1 flex items-center gap-1">
                  <span className="text-zinc-600 line-through">${competitor.toLocaleString("es-AR")}</span>
                  <span>en otras print-on-demand del exterior</span>
                  <span className="text-emerald-400/80">· ahorrás ${savings.toLocaleString("es-AR")}</span>
                </div>
              )
            })()}

            {/* Primary CTA: comprar ahora (1-click checkout) */}
            <Button
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-base h-11"
              onClick={handleBuyNow}
            >
              <Zap className="w-4 h-4 mr-2" />
              Comprar ahora
            </Button>

            {/* Secondary CTA: solo agregar al carrito */}
            <Button
              variant="outline"
              className="w-full border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300 text-sm h-9"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-2" />
              Agregar al carrito
            </Button>

            {/* Microcopy de garantía debajo del CTA */}
            <p className="text-[10px] text-zinc-500 text-center leading-tight">
              Si no te gusta el diseño impreso, te lo rehacemos gratis
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
