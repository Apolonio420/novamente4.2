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
  // Si el mensaje es un error, retryPrompt guarda el prompt original que fallo
  // para que el user pueda reintentar sin re-escribir.
  retryPrompt?: string
  retryAttachment?: string | null
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

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  // P6-02: Prefetch /checkout para reducir perceived latency en Buy Now.
  // Solo cuando hay mockup listo (usuario probablemente cerca de comprar).
  useEffect(() => {
    if (session.currentMockupUrl) {
      router.prefetch("/checkout")
    }
  }, [session.currentMockupUrl, router])
  const [pendingAttachment, setPendingAttachment] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState("M")
  const [orientation, setOrientation] = useState<"vertical" | "horizontal" | "cuadrado">("cuadrado")

  // P6-03: Email capture cuando user tiene mockup listo pero idlea sin comprar.
  // Una sola vez por sesion. Lead suave para recuperar despues por email.
  const [emailCaptureOpen, setEmailCaptureOpen] = useState(false)
  const [emailCaptureShown, setEmailCaptureShown] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  useEffect(() => {
    if (!session.currentMockupUrl || emailCaptureShown) return
    const t = setTimeout(() => {
      setEmailCaptureOpen(true)
      setEmailCaptureShown(true)
    }, 90_000)
    return () => clearTimeout(t)
  }, [session.currentMockupUrl, emailCaptureShown])

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
  // P6-01: regenera el mismo prompt con un nudge para obtener una variante
  // fresca (no edit-iteration). Bypassa toda la logica de iteration porque
  // queremos una imagen NUEVA, no un edit de la actual.
  const handleVariant = useCallback(async () => {
    const basePrompt = lastPromptRef.current.trim()
    if (!basePrompt || loading) return
    const nudges = [
      "varia la composicion manteniendo el concepto",
      "diferente angulo y paleta, mismo concepto",
      "otra interpretacion del mismo tema",
    ]
    const nudge = nudges[Math.floor(Math.random() * nudges.length)]
    const variantPrompt = `${basePrompt}. ${nudge}`
    setMessages((prev) => [...prev, { role: "user", text: "Probar otra variante" }])
    setLoading(true)
    setLoadingLabel("Generando variante...")
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: variantPrompt,
          raw: true,
          garmentColor: session.garmentColor,
          printArea: session.printArea,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.images?.[0]?.url) {
        throw new Error(data.error ?? "No se pudo generar la variante")
      }
      const imageUrl: string = data.images[0].url
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Otra variante del mismo concepto:", imageUrl, prompt: variantPrompt },
      ])
      setSession((prev) => ({
        ...prev,
        currentDesignUrl: imageUrl,
        frontDesignUrl: prev.side === "front" ? imageUrl : prev.frontDesignUrl,
        backDesignUrl: prev.side === "back" ? imageUrl : prev.backDesignUrl,
        currentMockupUrl: null,
        mockupGeneratedFor: null,
        designHistory: [imageUrl, ...prev.designHistory.filter((u) => u !== imageUrl)].slice(0, 5),
      }))
      fpixel.event("ViewContent", {
        content_ids: [imageUrl],
        content_name: `Variante AI — ${session.garmentType}`,
        content_type: "product",
        content_category: session.garmentType,
        value: getPrice(session.garmentType),
        currency: "ARS",
      })
    } catch (e: any) {
      toast({ title: "Error generando variante", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [loading, session.garmentColor, session.garmentType, session.printArea, setSession, toast])

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
              printArea: session.printArea,
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
          printArea: session.printArea,
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
        {
          role: "assistant",
          text: `Lo siento, hubo un error: ${e.message}`,
          retryPrompt: text,
          retryAttachment: pendingAttachment ?? null,
        },
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
          printArea: session.printArea,
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
  // Onboarding modal — solo se muestra la primera visita (no localStorage flag)
  const [showOnboarding, setShowOnboarding] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.localStorage.getItem("novamente:onboarding-seen") === "1") return
    // Solo mostrar si no hay recovery ni mockup actual (no interferir con flows activos)
    if (!session.currentMockupUrl) setShowOnboarding(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

    // 1) Si la URL trae ?recover=<URL-mockup>, restaurar directo (shareable link)
    try {
      const params = new URLSearchParams(window.location.search)
      const recoverUrl = params.get("recover")
      const recoverDesign = params.get("design")
      const recoverGarment = params.get("g")
      const recoverColor = params.get("c")
      const recoverSide = params.get("s") as "front" | "back" | null
      if (recoverUrl && recoverDesign) {
        const decodedMockup = decodeURIComponent(recoverUrl)
        const decodedDesign = decodeURIComponent(recoverDesign)
        setSession((prev) => ({
          ...prev,
          currentMockupUrl: decodedMockup,
          currentDesignUrl: decodedDesign,
          garmentType: recoverGarment ?? prev.garmentType,
          garmentColor: recoverColor ?? prev.garmentColor,
          side: recoverSide ?? "front",
          frontDesignUrl: (recoverSide ?? "front") === "front" ? decodedDesign : prev.frontDesignUrl,
          backDesignUrl: (recoverSide ?? "front") === "back" ? decodedDesign : prev.backDesignUrl,
          mockupGeneratedFor: {
            garmentType: recoverGarment ?? prev.garmentType,
            garmentColor: recoverColor ?? prev.garmentColor,
            side: recoverSide ?? "front",
            designUrl: decodedDesign,
          },
        }))
        // Limpiar query string para que no quede en la url
        window.history.replaceState({}, "", window.location.pathname)
        toast({ title: "Diseño cargado", description: "Listo para comprar — alguien te lo compartió 🎨" })
        return
      }
    } catch {}

    // 2) Sino, intentar restaurar el abandoned cart
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
      {/* Onboarding tour — primera visita */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-violet-700 rounded-2xl max-w-md w-full p-6 space-y-5">
            <div className="text-center space-y-1">
              <div className="text-3xl">✨</div>
              <h3 className="text-lg font-semibold text-white">Diseñá tu prenda en 3 pasos</h3>
              <p className="text-xs text-zinc-500">La primera vez te muestro cómo va</p>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">1</div>
                <div className="text-sm text-zinc-300">
                  <strong>Describí tu diseño</strong> o subí una foto.<br />
                  <span className="text-xs text-zinc-500">Probá templates como "Ukiyo-e", "Tipografía", "Streetwear"...</span>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">2</div>
                <div className="text-sm text-zinc-300">
                  <strong>Elegí tu prenda</strong> (remera, buzo, hoodie, crop) y color.<br />
                  <span className="text-xs text-zinc-500">Después tocá "Probar en prenda" y la IA te muestra la foto lifestyle.</span>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">3</div>
                <div className="text-sm text-zinc-300">
                  <strong>Comprala</strong> con Mercado Pago.<br />
                  <span className="text-xs text-zinc-500">Producción a pedido en Argentina · envío a todo el país.</span>
                </div>
              </div>
            </div>
            <Button
              className="w-full bg-violet-600 hover:bg-violet-500"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("novamente:onboarding-seen", "1")
                }
                setShowOnboarding(false)
              }}
            >
              Empezar a diseñar 🎨
            </Button>
          </div>
        </div>
      )}

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

      {/* P6-03: Email capture cuando user idlea con mockup listo */}
      {emailCaptureOpen && session.currentMockupUrl && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-capture-title"
          onClick={() => setEmailCaptureOpen(false)}
        >
          <div
            className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 id="email-capture-title" className="text-base font-semibold">¿Te guardo el diseño?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Te mando el mockup por mail así no lo perdés. Sin spam.
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setEmailCaptureOpen(false)}
                className="text-zinc-500 hover:text-white text-xl leading-none -mt-1"
              >
                ×
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!EMAIL_RX.test(emailInput) || emailSubmitting) return
                setEmailSubmitting(true)
                try {
                  const r = await fetch("/api/public/save-design", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: emailInput.trim(),
                      designUrl: session.currentDesignUrl,
                      mockupUrl: session.currentMockupUrl,
                      garmentType: session.garmentType,
                      garmentColor: session.garmentColor,
                    }),
                  })
                  if (r.ok) {
                    toast({ title: "Listo", description: "Te lo mandamos por mail en breve 📧" })
                    setEmailCaptureOpen(false)
                    setEmailInput("")
                  } else {
                    const d = await r.json().catch(() => ({}))
                    toast({ title: "No se pudo guardar", description: d.error ?? "Intentalo de nuevo", variant: "destructive" })
                  }
                } finally {
                  setEmailSubmitting(false)
                }
              }}
              className="flex flex-col gap-2"
            >
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="tu@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none focus:border-violet-500"
              />
              <Button
                type="submit"
                disabled={!EMAIL_RX.test(emailInput) || emailSubmitting}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                {emailSubmitting ? "Guardando..." : "Guardar diseño"}
              </Button>
              <button
                type="button"
                onClick={() => setEmailCaptureOpen(false)}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 text-center mt-1"
              >
                No, gracias
              </button>
            </form>
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
                {/* Retry button cuando el mensaje es un error con prompt guardado */}
                {msg.retryPrompt && !loading && (
                  <button
                    type="button"
                    onClick={() => {
                      if (msg.retryAttachment) setPendingAttachment(msg.retryAttachment)
                      handleSend(msg.retryPrompt!)
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded-md transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reintentar
                  </button>
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

        {/* Quick action chips + templates — solo cuando hay 1 mensaje (welcome) */}
        {messages.length === 1 && !loading && (
          <div className="px-4 pt-1 pb-3 space-y-2">
            {/* Acción upload */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 rounded-full bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 text-xs font-medium transition"
              >
                📸 Subir mi foto
              </button>
            </div>
            {/* Templates — 8 estilos populares */}
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">O probá un estilo:</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { emoji: "🐉", label: "Ukiyo-e", value: "dragón japonés estilo ukiyo-e, negro y rojo con olas y flores de cerezo" },
                  { emoji: "🔥", label: "Psicodélico 70s", value: "tigre psicodélico estilo años 70 con colores vibrantes y formas onduladas" },
                  { emoji: "💀", label: "Gótico/Noir", value: "calavera gótica con flores oscuras, rim lighting cremoso, estilo tattoo noir" },
                  { emoji: "✏️", label: "Tipografía", value: "frase tipográfica brutalista 'NO PASARÁN' en español, alto contraste, estilo poster activista" },
                  { emoji: "🌸", label: "Botánico", value: "ramo de flores silvestres argentinas con mariposas, estilo acuarela vintage" },
                  { emoji: "🎮", label: "Pixel art", value: "personaje pixel art retro estilo 16-bit, paleta vibrante, fondo transparente" },
                  { emoji: "⚡", label: "Streetwear", value: "diseño streetwear con tipografía urbana y elementos gráficos angulares, estilo Tokyo" },
                  { emoji: "🏔️", label: "Minimalista", value: "paisaje patagónico minimalista line-art, una sola línea continua, negro sobre transparente" },
                ].map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => setInput(tpl.value)}
                    className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-200 hover:border-violet-500 hover:text-white transition"
                  >
                    {tpl.emoji} {tpl.label}
                  </button>
                ))}
              </div>
            </div>
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
              aria-label="Adjuntar imagen de referencia"
            >
              <Paperclip className="w-4 h-4 text-zinc-400" aria-hidden="true" />
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

          {/* Print area selector — tamaño de la estampa sobre la prenda */}
          <div className="mt-4 space-y-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Tamaño de estampa</label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { key: "R1", label: "Chico", desc: "10×10 cm · logo en pecho" },
                { key: "R2", label: "Mediano", desc: "20×20 cm · pecho completo" },
                { key: "R3", label: "Grande", desc: "35×40 cm · espalda completa" },
              ] as const).map((pa) => (
                <button
                  key={pa.key}
                  type="button"
                  onClick={() =>
                    setSession((prev) => ({ ...prev, printArea: pa.key, currentMockupUrl: prev.mockupGeneratedFor?.designUrl === prev.currentDesignUrl ? prev.currentMockupUrl : prev.currentMockupUrl }))
                  }
                  title={pa.desc}
                  className={`text-xs rounded border py-1.5 px-1 transition flex flex-col items-center ${
                    session.printArea === pa.key
                      ? "border-violet-500 bg-violet-600/15 text-white"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  <span className="font-semibold">{pa.key}</span>
                  <span className="text-[10px] mt-0.5 leading-none">{pa.label}</span>
                </button>
              ))}
            </div>
          </div>

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

          {/* P6-01: Probar otra variante — para users que casi gustan el resultado */}
          {session.currentDesignUrl && lastPromptRef.current && (
            <Button
              variant="outline"
              className="w-full border-violet-700/40 text-violet-300 hover:bg-violet-600/10 hover:text-white text-sm mt-3"
              onClick={handleVariant}
              disabled={loading || mockupLoading}
              title="Genera otra interpretación del mismo concepto"
            >
              {loading && loadingLabel === "Generando variante..." ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando variante...
                </>
              ) : (
                <>✨ Probar otra variante</>
              )}
            </Button>
          )}

          {/* Mockup button */}
          <Button
            data-mockup-trigger="true"
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

        {/* Multi-garment preview — opcional, 1 extra mockup en otra prenda */}
        {session.currentMockupUrl && !mockupIsStale && session.currentDesignUrl && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-3">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
              También probalo en otra prenda
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {CATALOG_PRODUCTS.filter((p) => p.key !== session.garmentType)
                .slice(0, 4)
                .map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    disabled={mockupLoading}
                    onClick={() => {
                      // Cambiar de prenda + dispara mockup automaticamente
                      setSession((prev) => ({
                        ...prev,
                        garmentType: p.key,
                        garmentColor: p.colors[0]?.key ?? prev.garmentColor,
                      }))
                      // El boton "Probar en ..." se va a actualizar y user lo
                      // clickea, pero auto-disparamos para ahorrarle el step
                      setTimeout(() => {
                        const btn = document.querySelector<HTMLButtonElement>(
                          'button[data-mockup-trigger="true"]',
                        )
                        btn?.click()
                      }, 100)
                    }}
                    className="text-[11px] rounded border border-zinc-700 hover:border-violet-500 bg-zinc-800/50 hover:bg-violet-600/10 text-zinc-300 hover:text-white px-2 py-1 transition"
                    title={`Generar mockup en ${p.name}`}
                  >
                    {p.name.replace("Remera ", "").replace("Buzo ", "")}
                  </button>
                ))}
            </div>
            <p className="text-[10px] text-zinc-600 mt-1.5">
              Genera 1 mockup más (no afecta el actual)
            </p>
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
                  // Construir shareable link → al abrir restaura el mockup
                  const params = new URLSearchParams({
                    recover: session.currentMockupUrl!,
                    design: session.currentDesignUrl ?? "",
                    g: session.garmentType,
                    c: session.garmentColor,
                    s: session.side,
                  })
                  const shareUrl = `${window.location.origin}/crear?${params.toString()}`
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: `Mi diseño en Novamente · ${garmentLabel(session.garmentType)}`,
                        text: "Mirá lo que diseñé en novamente.ar 🔥",
                        url: shareUrl,
                      })
                    } catch {}
                  } else {
                    await navigator.clipboard.writeText(shareUrl)
                    toast({ title: "Link copiado", description: "Quien lo abra ve tu diseño y puede comprarlo" })
                  }
                }}
                className="flex-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs py-2 px-3 transition flex items-center justify-center gap-1.5"
              >
                📤 Compartir
              </button>
              {(() => {
                const params = new URLSearchParams({
                  recover: session.currentMockupUrl ?? "",
                  design: session.currentDesignUrl ?? "",
                  g: session.garmentType,
                  c: session.garmentColor,
                  s: session.side,
                })
                const shareUrl = typeof window !== "undefined"
                  ? `${window.location.origin}/crear?${params.toString()}`
                  : "https://novamente.ar/crear"
                return (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Mirá lo que diseñé en Novamente 🔥 — podés verlo y comprarlo acá: ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-md bg-green-700 hover:bg-green-600 text-white text-xs py-2 px-3 transition flex items-center justify-center gap-1.5"
                  >
                    💬 WhatsApp
                  </a>
                )
              })()}
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
              <details className="group">
                <summary className="cursor-pointer list-none text-white font-semibold flex items-center gap-1 hover:text-violet-300 transition">
                  ${(getPrice(session.garmentType)).toLocaleString("es-AR")}
                  <span className="text-[10px] text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="absolute right-3 mt-1 z-10 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-xs space-y-1.5 shadow-xl min-w-[220px]">
                  <p className="text-zinc-400 text-[10px] uppercase tracking-wider mb-1">Desglose</p>
                  {(() => {
                    const total = getPrice(session.garmentType)
                    // Estimacion: 65% prenda + 25% estampa DTG + 10% margen
                    const prenda = Math.round(total * 0.65)
                    const estampa = Math.round(total * 0.25)
                    const margen = total - prenda - estampa
                    return (
                      <>
                        <div className="flex justify-between text-zinc-300">
                          <span>Prenda algodón premium</span>
                          <span>${prenda.toLocaleString("es-AR")}</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Estampa DTG full color</span>
                          <span>${estampa.toLocaleString("es-AR")}</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Producción + atención</span>
                          <span>${margen.toLocaleString("es-AR")}</span>
                        </div>
                        <div className="border-t border-zinc-700 pt-1 flex justify-between font-semibold text-white">
                          <span>Total</span>
                          <span>${total.toLocaleString("es-AR")}</span>
                        </div>
                        <p className="text-[9px] text-zinc-500 pt-1">Envío aparte. Sin costos ocultos.</p>
                      </>
                    )
                  })()}
                </div>
              </details>
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

            {/* Microcopy debajo del CTA */}
            <p className="text-[10px] text-zinc-500 text-center leading-tight">
              Producción a pedido en Argentina · Envío a todo el país
            </p>
          </div>
        )}
      </div>
    </div>

      {/* Mobile sticky bottom CTA — solo visible cuando hay mockup fresh.
          En desktop se oculta porque el sidebar ya tiene los CTAs visibles. */}
      {session.currentMockupUrl && !mockupIsStale && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 px-3 py-3 flex items-center gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-zinc-500 truncate">
              {garmentLabel(session.garmentType)} · {colorLabel(session.garmentType, session.garmentColor)} · Talle {selectedSize}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-white font-semibold text-base">
                ${getPrice(session.garmentType).toLocaleString("es-AR")}
              </span>
              <span className="text-[10px] text-emerald-400">o 3x ${Math.round(getPrice(session.garmentType) / 3).toLocaleString("es-AR")}</span>
            </div>
          </div>
          <Button
            className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 h-11"
            onClick={handleBuyNow}
          >
            <Zap className="w-4 h-4 mr-1.5" />
            Comprar ya
          </Button>
        </div>
      )}
    </>
  )
}
