"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useCart } from "@/lib/cartStore"
import {
  X, Maximize2, Minimize2, Send, Trash2, ImagePlus, RotateCcw,
  ShoppingCart, Loader2, Sparkles, Palette, ChevronRight, Share2, Copy, Check,
} from "lucide-react"
import Image from "next/image"
import { PRODUCTS, formatPrice } from "@/lib/catalog"
import { useAssistantAuth } from "@/lib/hooks/useAssistantAuth"
import { usePageContext } from "@/lib/hooks/usePageContext"

interface SourceRef {
  title: string
  category: string
  score: number
}

interface Message {
  id: string
  role: "user" | "model"
  text: string
  images?: string[]
  actions?: ParsedAction[]
  suggestions?: string[]
  sources?: SourceRef[]
  timestamp: number
}

interface ParsedAction {
  type: string
  params: string[]
  status?: "pending" | "loading" | "done" | "error"
  result?: string
}

const STORAGE_KEY = "novamente-public-assistant"
const MAX_STORED = 50
const MAX_HISTORY = 16

// Quick replies based on page context
const PAGE_SUGGESTIONS: Record<string, string[]> = {
  "/": ["Quiero diseñar algo", "¿Cómo funciona?", "Ver productos"],
  "/products": ["¿Qué talle me conviene?", "¿Qué colores hay?", "Quiero diseñar"],
  "/styles": ["¿Cuál es el mejor estilo?", "Quiero ver manga anime", "Diseñame algo"],
  "/faq": ["¿Cuánto tarda el envío?", "¿Puedo subir mi logo?", "¿Tienen devoluciones?"],
  "/nosotros": ["¿Cómo funciona el DTG?", "Quiero ser Partner", "Ver productos"],
  "/merch": ["¿Puedo personalizar?", "¿Cuánto sale?", "Quiero diseñar algo"],
}
const DEFAULT_SUGGESTIONS = ["Ver productos", "Quiero diseñar algo", "¿Cómo funciona?"]

// Welcome bubble messages
const WELCOME_BUBBLES = [
  "¡Diseñá tu remera con IA! ✨",
  "¡Hola! ¿Necesitás ayuda? 👋",
  "¡Creá tu diseño único! 🎨",
]

// Typing indicator phrases
const TYPING_PHRASES = [
  "Pensando...",
  "Buscando info...",
  "Preparando respuesta...",
  "Analizando...",
  "Diseñando ideas...",
]

// Follow-up suggestions based on response content
function getSuggestions(text: string, actions?: ParsedAction[]): string[] {
  const hasDesign = actions?.some(a => a.type === "GENERATE_DESIGN" && a.status === "done")
  const hasMockup = actions?.some(a => a.type === "SHOW_MOCKUP" && a.status === "done")
  const hasCart = actions?.some(a => a.type === "ADD_TO_CART" && a.status === "done")
  const hasCatalog = actions?.some(a => a.type === "SHOW_CATALOG")

  if (hasCart) return ["Ir a pagar", "Agregar otra prenda", "¿Cuánto sale el envío?"]
  if (hasMockup) return ["Quiero comprarlo", "Probalo en otro color", "Generar otro diseño"]
  if (hasDesign) return ["Verlo en una remera", "Verlo en un hoodie", "Generar otro diseño"]
  if (hasCatalog) return ["Quiero diseñar algo", "¿Qué talle me conviene?", "¿Hacen envíos?"]

  const lower = text.toLowerCase()
  if (lower.includes("envío") || lower.includes("envio")) return ["Ver productos", "¿Cuánto tarda?", "Quiero comprar"]
  if (lower.includes("talle")) return ["Ver productos", "Quiero diseñar", "¿Tienen hoodie?"]
  if (lower.includes("dtg") || lower.includes("estampad")) return ["Ver productos", "¿Cuántos lavados resiste?", "Quiero diseñar"]
  if (lower.includes("partner")) return ["¿Cuánto cuesta ser Partner?", "Ver productos", "Contactar por WhatsApp"]

  return ["Ver productos", "Diseñar algo", "¿Cómo funciona?"]
}

/** Safe markdown renderer — escapes HTML first, then applies formatting */
function renderMarkdown(text: string) {
  // Escape HTML entities first to prevent XSS
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
  // Then apply safe markdown formatting
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-100">$1</strong>')
    .replace(/\[([^\]]+)\]\(((\/|https:\/\/novamente\.ar)[^)]*)\)/g, '<a href="$2" class="text-purple-400 underline hover:text-purple-300">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-700 px-1 rounded text-sm">$1</code>')
    .replace(/\n/g, "<br/>")
}

export function PublicAssistant() {
  const pathname = usePathname()
  const router = useRouter()
  const { addItem, getTotalItems } = useCart()

  if (pathname?.startsWith("/admin")) return null

  return <AssistantInner addItem={addItem} getTotalItems={getTotalItems} router={router} pathname={pathname || "/"} />
}

function AssistantInner({
  addItem,
  getTotalItems,
  router,
  pathname,
}: {
  addItem: (item: any) => void
  getTotalItems: () => number
  router: ReturnType<typeof useRouter>
  pathname: string
}) {
  const auth = useAssistantAuth()
  const pageContext = usePageContext()

  const [open, setOpen] = useState(false)
  const [fullScreen, setFullScreen] = useState(false)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [typingPhrase, setTypingPhrase] = useState(0)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketSubject, setTicketSubject] = useState("")
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sendRef = useRef<(text?: string) => void>(() => {})
  const lastDesignUrlRef = useRef<string | null>(null)
  const lastMockupUrlRef = useRef<string | null>(null)

  // Per-account storage key (different history per user)
  const storageKey = auth.email ? `${STORAGE_KEY}-${auth.email}` : STORAGE_KEY

  // Load from localStorage (re-load when auth resolves to switch accounts)
  useEffect(() => {
    if (auth.loading) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as Message[]
        setMessages(parsed.slice(-MAX_STORED))
      } else {
        setMessages([])
      }
    } catch { /* ignore */ }
  }, [storageKey, auth.loading])

  // Save to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-MAX_STORED)))
    }
  }, [messages, storageKey])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streaming])

  // Auto-fullscreen on mobile when opening
  useEffect(() => {
    if (open && isMobile) setFullScreen(true)
  }, [open, isMobile])

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  // ESC to close fullscreen or panel
  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullScreen) setFullScreen(false)
        else setOpen(false)
      }
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [open, fullScreen])

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }, [])

  // Rotate typing phrases while streaming
  useEffect(() => {
    if (!streaming) return
    const interval = setInterval(() => {
      setTypingPhrase(p => (p + 1) % TYPING_PHRASES.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [streaming])

  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg])
  }, [])

  const updateLastModel = useCallback((updater: (prev: Message) => Message) => {
    setMessages(prev => {
      const copy = [...prev]
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === "model") {
          copy[i] = updater(copy[i])
          break
        }
      }
      return copy
    })
  }, [])

  const executeAction = useCallback(async (action: ParsedAction, msgId: string) => {
    const updateAction = (status: ParsedAction["status"], result?: string) => {
      setMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m
        return {
          ...m,
          actions: m.actions?.map(a => a === action ? { ...a, status, result } : a),
        }
      }))
    }

    updateAction("loading")

    try {
      switch (action.type) {
        case "GENERATE_DESIGN": {
          const [prompt] = action.params
          const res = await fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, n: 1 }),
          })
          const data = await res.json()
          if (data.success && data.images?.[0]?.url) {
            lastDesignUrlRef.current = data.images[0].url
            updateAction("done", data.images[0].url)
            // Add guided purchase suggestions after design
            setMessages(prev => prev.map(m => {
              if (m.id !== msgId) return m
              return { ...m, suggestions: ["Verlo en una remera", "Verlo en un hoodie", "Generar otro diseño"] }
            }))
          } else {
            updateAction("error", data.error || "No se pudo generar el diseño")
          }
          break
        }
        case "SHOW_MOCKUP": {
          const [designUrl, garment, color, side, size] = action.params
          const res = await fetch("/api/generate-stamp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              designImageUrl: designUrl,
              garmentType: garment?.includes("hoodie") ? "hoodie" : "tshirt",
              garmentVariant: garment?.includes("classic") ? "classic" : "oversize",
              garmentColor: color || "black",
              side: side || "front",
              stampSize: size || "R3",
              stampPosition: "center",
            }),
          })
          const data = await res.json()
          if (data.success && data.publicUrl) {
            lastMockupUrlRef.current = data.publicUrl
            updateAction("done", data.publicUrl)
          } else {
            updateAction("error", data.error || "No se pudo crear el mockup")
          }
          break
        }
        case "ADD_TO_CART": {
          const [name, garmentType, color, size, priceStr, mockupUrl] = action.params
          addItem({
            id: `nova-${Date.now()}`,
            name: name || "Prenda Personalizada",
            garmentType: garmentType || "aura-oversize-tshirt",
            color: color || "black",
            size: size || "M",
            price: parseInt(priceStr) || 31000,
            quantity: 1,
            image: mockupUrl || "/products/oversize-negro-front.jpeg",
            frontMockup: mockupUrl,
          })
          updateAction("done", "added")
          break
        }
        case "CHECKOUT": {
          router.push("/checkout")
          updateAction("done")
          break
        }
        default:
          updateAction("done")
      }
    } catch (err) {
      updateAction("error", err instanceof Error ? err.message : "Error")
    }
  }, [addItem, router])

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText || input).trim()
    if (!text || streaming) return

    // Ticket trigger for logged-in users
    if (auth.mode !== 'visitor' && (
      text.toLowerCase().includes('crear ticket') ||
      text.toLowerCase().includes('reportar problema') ||
      text.toLowerCase().includes('ticket de soporte')
    )) {
      setShowTicketForm(true)
      if (!overrideText) setInput("")
      setMessages(prev => [...prev,
        { id: `u-${Date.now()}`, role: "user" as const, text, timestamp: Date.now() },
        { id: `m-${Date.now()}`, role: "model" as const, text: '¡Dale! Completá el asunto de tu ticket y lo creamos. El contexto de esta conversación y la página actual se incluyen automáticamente.', timestamp: Date.now() },
      ])
      return
    }

    if (!overrideText) setInput("")
    const imageUrls = [...pendingImages]
    setPendingImages([])

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text, images: imageUrls.length > 0 ? imageUrls : undefined, timestamp: Date.now() }
    addMessage(userMsg)

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto"

    const modelMsgId = `m-${Date.now()}`
    const modelMsg: Message = { id: modelMsgId, role: "model", text: "", timestamp: Date.now() }
    addMessage(modelMsg)
    setStreaming(true)
    setTypingPhrase(0)

    try {
      // Build history with design context injected
      const history = messages.slice(-MAX_HISTORY).map(m => {
        let enrichedText = m.text
        // Inject action results into history so Nova knows what happened
        if (m.actions) {
          for (const a of m.actions) {
            if (a.status === "done" && a.result) {
              if (a.type === "GENERATE_DESIGN") enrichedText += `\n[Diseno generado: ${a.result}]`
              if (a.type === "SHOW_MOCKUP") enrichedText += `\n[Mockup creado: ${a.result}]`
            }
          }
        }
        return { role: m.role, text: enrichedText }
      })

      // Add context about last design/mockup for continuity
      let contextQuery = text
      if (lastDesignUrlRef.current && !text.includes("http")) {
        contextQuery += `\n[Contexto: ultimo diseno generado = ${lastDesignUrlRef.current}]`
      }
      if (lastMockupUrlRef.current && !text.includes("http")) {
        contextQuery += `\n[Contexto: ultimo mockup = ${lastMockupUrlRef.current}]`
      }

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: contextQuery,
          history,
          ...(imageUrls.length > 0 ? { imageUrls } : {}),
          role: auth.mode,
          pageContext,
          tenantSlug: auth.tenantSlug,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error de conexión" }))
        updateLastModel(m => ({ ...m, text: err.error || "Error al procesar tu mensaje." }))
        setStreaming(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No stream")

      const decoder = new TextDecoder()
      let buffer = ""
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === "chunk") {
              fullText += event.text
              updateLastModel(m => ({ ...m, text: fullText }))
            } else if (event.type === "sources" && event.sources) {
              updateLastModel(m => ({ ...m, sources: event.sources }))
            }
          } catch { /* skip */ }
        }
      }

      // Parse actions
      const actionRegex = /\[ACTION:(\w+)\]\s*(.*)/g
      const actions: ParsedAction[] = []
      let match
      while ((match = actionRegex.exec(fullText)) !== null) {
        actions.push({
          type: match[1],
          params: match[2] ? match[2].split("|").map(p => p.trim()) : [],
          status: "pending",
        })
      }

      const cleanText = fullText.replace(/\[ACTION:\w+\]\s*.*/g, "").trim()
      const suggestions = getSuggestions(cleanText, actions)
      updateLastModel(m => ({
        ...m,
        text: cleanText,
        ...(actions.length > 0 ? { actions } : {}),
        suggestions,
      }))

      // Auto-execute visual actions
      if (actions.length > 0) {
        for (const action of actions) {
          if (["GENERATE_DESIGN", "SHOW_MOCKUP", "SHOW_CATALOG", "SHOW_STYLES", "SHOW_PRICING"].includes(action.type)) {
            executeAction(action, modelMsgId)
          }
        }
      }
    } catch {
      updateLastModel(m => ({ ...m, text: "Error de conexión. Intentá de nuevo." }))
    } finally {
      setStreaming(false)
    }
  }, [input, streaming, messages, pendingImages, addMessage, updateLastModel, executeAction, auth, pageContext])

  // Keep sendRef updated for suggestion chips
  sendRef.current = sendMessage

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleImageUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newUrls: string[] = []
    for (let i = 0; i < Math.min(files.length, 3 - pendingImages.length); i++) {
      const file = files[i]
      if (!file.type.startsWith("image/")) continue
      // Convert to data URL for preview, will be sent as blob URL
      const url = URL.createObjectURL(file)
      newUrls.push(url)
    }
    setPendingImages(prev => [...prev, ...newUrls].slice(0, 3))
  }, [pendingImages.length])

  const removeImage = useCallback((idx: number) => {
    setPendingImages(prev => {
      const copy = [...prev]
      URL.revokeObjectURL(copy[idx])
      copy.splice(idx, 1)
      return copy
    })
  }, [])

  const clearChat = () => {
    setMessages([])
    lastDesignUrlRef.current = null
    lastMockupUrlRef.current = null
    localStorage.removeItem(storageKey)
  }

  const submitTicket = async () => {
    if (!ticketSubject.trim()) return
    setTicketSubmitting(true)

    // Build description from recent chat messages
    const recentMessages = messages.slice(-5).map(m =>
      `${m.role === "user" ? "Usuario" : "Nova"}: ${m.text.slice(0, 200)}`
    ).join('\n')

    const description = `${recentMessages}\n\n[Página: ${pageContext.pathname}]${pageContext.storefrontSlug ? `\n[Storefront: ${pageContext.storefrontSlug}]` : ''}`

    try {
      const res = await fetch('/api/assistant/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: ticketSubject,
          description,
          category: 'general',
          pageUrl: window.location.href,
          pageContext,
        }),
      })
      if (res.ok) {
        setMessages(prev => [...prev, {
          id: `m-${Date.now()}`,
          role: "model" as const,
          text: `✅ Ticket creado: "${ticketSubject}". Nuestro equipo lo va a resolver a la brevedad. Te notificamos por acá cuando esté listo.`,
          timestamp: Date.now(),
        }])
        setShowTicketForm(false)
        setTicketSubject("")
      } else {
        setMessages(prev => [...prev, {
          id: `m-${Date.now()}`,
          role: "model" as const,
          text: '❌ No se pudo crear el ticket. Intentá de nuevo.',
          timestamp: Date.now(),
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `m-${Date.now()}`,
        role: "model" as const,
        text: '❌ Error de conexión. Intentá de nuevo.',
        timestamp: Date.now(),
      }])
    }
    setTicketSubmitting(false)
  }

  const cartCount = getTotalItems()

  // Welcome bubble
  const [showBubble, setShowBubble] = useState(false)
  const [bubbleDismissed, setBubbleDismissed] = useState(false)
  const [bubbleIndex] = useState(() => Math.floor(Math.random() * WELCOME_BUBBLES.length))

  useEffect(() => {
    if (open || bubbleDismissed) return
    // Check if dismissed this session
    try {
      if (sessionStorage.getItem("nova-bubble-dismissed")) {
        setBubbleDismissed(true)
        return
      }
    } catch { /* ignore */ }
    const timer = setTimeout(() => setShowBubble(true), 5000)
    const hide = setTimeout(() => setShowBubble(false), 15000)
    return () => { clearTimeout(timer); clearTimeout(hide) }
  }, [open, bubbleDismissed])

  const dismissBubble = () => {
    setShowBubble(false)
    setBubbleDismissed(true)
    try { sessionStorage.setItem("nova-bubble-dismissed", "1") } catch { /* ignore */ }
  }

  // Periodic wiggle
  const [wiggle, setWiggle] = useState(false)
  useEffect(() => {
    if (open) return
    const interval = setInterval(() => {
      setWiggle(true)
      setTimeout(() => setWiggle(false), 1200)
    }, 8000)
    const first = setTimeout(() => {
      setWiggle(true)
      setTimeout(() => setWiggle(false), 1200)
    }, 3000)
    return () => { clearInterval(interval); clearTimeout(first) }
  }, [open])

  // Page-aware suggestions
  const baseReplies = PAGE_SUGGESTIONS[pathname] || DEFAULT_SUGGESTIONS
  const quickReplies = (() => {
    const suggestions = [...baseReplies]
    if (auth.mode !== 'visitor') {
      suggestions.push('Crear ticket de soporte')
    }
    if (auth.mode !== 'visitor' && pageContext.pageType === 'storefront' && pageContext.storefrontSlug === auth.tenantSlug) {
      suggestions.unshift('Modificar mi storefront')
    }
    return suggestions
  })()

  // --- RENDER ---

  if (!open) {
    return (
      <>
        <style>{`
          @keyframes nova-wiggle {
            0%, 100% { transform: rotate(0deg) scale(1); }
            15% { transform: rotate(-12deg) scale(1.1); }
            30% { transform: rotate(10deg) scale(1.15); }
            45% { transform: rotate(-8deg) scale(1.1); }
            60% { transform: rotate(6deg) scale(1.05); }
            75% { transform: rotate(-3deg) scale(1.02); }
          }
          @keyframes nova-glow {
            0%, 100% { box-shadow: 0 0 8px rgba(139,92,246,0.3), 0 4px 12px rgba(88,28,135,0.2); }
            50% { box-shadow: 0 0 20px rgba(139,92,246,0.6), 0 4px 20px rgba(168,85,247,0.4); }
          }
          @keyframes nova-wave {
            0%, 100% { opacity: 0; transform: scale(0.8); }
            50% { opacity: 0.4; transform: scale(1.4); }
          }
          @keyframes nova-bubble-in {
            0% { opacity: 0; transform: translateY(8px) scale(0.9); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes nova-dots {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
          .nova-fab { animation: nova-glow 4s ease-in-out infinite; }
          .nova-wiggle { animation: nova-wiggle 1.2s ease-in-out; }
          .nova-ring { animation: nova-wave 1.2s ease-out; }
          .nova-bubble { animation: nova-bubble-in 0.4s ease-out; }
          .nova-dot-1 { animation: nova-dots 1.4s infinite 0s; }
          .nova-dot-2 { animation: nova-dots 1.4s infinite 0.2s; }
          .nova-dot-3 { animation: nova-dots 1.4s infinite 0.4s; }
        `}</style>

        {/* Welcome bubble */}
        {showBubble && !bubbleDismissed && (
          <div className="nova-bubble fixed bottom-[7.5rem] right-4 z-50 max-w-[220px]">
            <div className="relative bg-zinc-800 border border-purple-500/30 rounded-2xl rounded-br-sm px-4 py-3 shadow-lg shadow-purple-900/20">
              <button
                onClick={dismissBubble}
                className="absolute -top-2 -right-2 w-5 h-5 bg-zinc-700 hover:bg-zinc-600 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-3 h-3" />
              </button>
              <button onClick={() => { dismissBubble(); setOpen(true) }} className="text-left">
                <p className="text-sm text-zinc-200 font-medium">{WELCOME_BUBBLES[bubbleIndex]}</p>
                <p className="text-[10px] text-purple-400 mt-1">Clickeá para chatear con Nova</p>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => { dismissBubble(); setOpen(true) }}
          className="nova-fab fixed bottom-24 right-4 z-50 flex items-center gap-2 bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white rounded-full pl-1.5 pr-4 py-1.5 transition-all hover:scale-110 group"
          aria-label="Abrir asistente Nova"
        >
          {wiggle && <span className="nova-ring absolute left-1 w-10 h-10 rounded-full border-2 border-purple-400 pointer-events-none" />}
          <Image
            src="/nova-avatar.svg"
            alt="Nova"
            width={36}
            height={36}
            className={`rounded-full ${wiggle ? "nova-wiggle" : ""}`}
          />
          {auth.mode !== 'visitor' && !auth.loading && (
            <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${auth.mode === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          )}
          <span className="text-sm font-semibold hidden sm:inline">Nova</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>
          )}
        </button>
      </>
    )
  }

  // Panel / Full-screen — on mobile always fullscreen
  const panelClass = fullScreen
    ? "fixed inset-0 z-50"
    : "fixed bottom-4 right-4 z-50 w-[400px] h-[600px] max-sm:inset-0 max-sm:w-auto max-sm:h-auto max-sm:bottom-0 max-sm:right-0 max-w-[calc(100vw-2rem)] max-sm:max-w-none max-h-[calc(100vh-2rem)] max-sm:max-h-none rounded-2xl max-sm:rounded-none shadow-2xl shadow-black/40"

  return (
    <div className={`${panelClass} bg-zinc-950 border border-zinc-800 flex flex-col overflow-hidden ${fullScreen ? "" : "rounded-2xl"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] bg-gradient-to-r from-purple-600/90 to-purple-700/90 backdrop-blur-sm border-b border-purple-500/30 shrink-0">
        <div className="flex items-center gap-2">
          <Image src="/nova-avatar.svg" alt="Nova" width={28} height={28} className="rounded-full" />
          <div>
            <span className="font-semibold text-white text-sm">
              {auth.mode === 'admin' ? 'Nova (Admin)' : auth.mode === 'partner' ? `Nova (${auth.tenantName || 'Partner'})` : 'Nova'}
            </span>
            <span className="text-purple-200 text-[10px] ml-1.5">Asistente IA</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {cartCount > 0 && (
            <button onClick={() => router.push("/cart")} className="p-1.5 hover:bg-purple-500/50 rounded-lg transition-colors relative" title="Ver carrito">
              <ShoppingCart className="w-4 h-4 text-white" />
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>
            </button>
          )}
          <button onClick={clearChat} className="p-2 sm:p-1.5 hover:bg-purple-500/50 rounded-lg transition-colors" title="Limpiar chat">
            <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 text-purple-200" />
          </button>
          {!isMobile && (
            <button onClick={() => setFullScreen(!fullScreen)} className="p-1.5 hover:bg-purple-500/50 rounded-lg transition-colors" title={fullScreen ? "Minimizar" : "Pantalla completa"}>
              {fullScreen ? <Minimize2 className="w-4 h-4 text-purple-200" /> : <Maximize2 className="w-4 h-4 text-purple-200" />}
            </button>
          )}
          <button onClick={() => { setOpen(false); setFullScreen(false) }} className="p-2 sm:p-1.5 hover:bg-purple-500/50 rounded-lg transition-colors" title="Cerrar">
            <X className="w-5 h-5 sm:w-4 sm:h-4 text-purple-200" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6 space-y-3">
            <Image src="/nova-avatar.svg" alt="Nova" width={56} height={56} className="mx-auto rounded-full" />
            <p className="text-zinc-200 font-semibold">¡Hola! Soy Nova</p>
            <p className="text-zinc-400 text-sm max-w-[280px] mx-auto">
              Te ayudo a diseñar tu ropa personalizada con IA. ¡Preguntame lo que quieras!
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {quickReplies.map(q => (
                <button
                  key={q}
                  onClick={() => sendRef.current(q)}
                  className="text-sm sm:text-xs px-4 sm:px-3 py-2 sm:py-1.5 rounded-full bg-zinc-800 text-zinc-300 hover:bg-purple-600 hover:text-white transition-colors border border-zinc-700 hover:border-purple-500"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={msg.id}>
            <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}>
              {msg.role === "model" && (
                <Image src="/nova-avatar.svg" alt="" width={24} height={24} className="rounded-full mt-1 shrink-0" />
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-zinc-800/80 text-zinc-200"
              }`}>
                {msg.role === "model" && !msg.text && streaming ? (
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex gap-1">
                      <span className="nova-dot-1 w-2 h-2 bg-purple-400 rounded-full inline-block" />
                      <span className="nova-dot-2 w-2 h-2 bg-purple-400 rounded-full inline-block" />
                      <span className="nova-dot-3 w-2 h-2 bg-purple-400 rounded-full inline-block" />
                    </div>
                    <span className="text-zinc-500 text-xs">{TYPING_PHRASES[typingPhrase]}</span>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                )}

                {/* Action cards */}
                {msg.actions?.map((action, i) => (
                  <ActionCard key={i} action={action} onExecute={() => executeAction(action, msg.id)} />
                ))}
              </div>
            </div>

            {/* User attached images */}
            {msg.role === "user" && msg.images && msg.images.length > 0 && (
              <div className="flex gap-1 justify-end mt-1">
                {msg.images.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-purple-500/30">
                    <Image src={img} alt="Adjunto" fill className="object-cover" sizes="64px" />
                  </div>
                ))}
              </div>
            )}

            {/* Sources badges */}
            {msg.role === "model" && msg.sources && msg.sources.length > 0 && !streaming && (
              <div className="flex flex-wrap gap-1 mt-1.5 ml-8">
                {msg.sources.slice(0, 3).map((s, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-800/50 text-zinc-500 border border-zinc-700/40">
                    {s.title || s.category}
                  </span>
                ))}
              </div>
            )}

            {/* Follow-up suggestion chips */}
            {msg.role === "model" && msg.suggestions && !streaming && idx === messages.length - 1 && (
              <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                {msg.suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => sendRef.current(s)}
                    className="text-[11px] px-3 py-1 rounded-full bg-zinc-800/60 text-purple-300 hover:bg-purple-600 hover:text-white transition-colors border border-zinc-700/60 hover:border-purple-500"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Ticket form */}
      {showTicketForm && auth.mode !== 'visitor' && (
        <div className="mx-3 mb-2 p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 shrink-0">
          <p className="text-sm text-purple-300 font-medium mb-2">Crear ticket de soporte</p>
          <input
            type="text"
            value={ticketSubject}
            onChange={e => setTicketSubject(e.target.value)}
            placeholder="¿Qué necesitás? (ej: Cambiar el banner)"
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 mb-2"
            onKeyDown={e => e.key === 'Enter' && submitTicket()}
          />
          <div className="flex gap-2">
            <button
              onClick={submitTicket}
              disabled={ticketSubmitting || !ticketSubject.trim()}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 disabled:opacity-50"
            >
              {ticketSubmitting ? 'Enviando...' : 'Enviar ticket'}
            </button>
            <button
              onClick={() => { setShowTicketForm(false); setTicketSubject('') }}
              className="px-3 py-1.5 rounded-lg bg-zinc-700 text-zinc-300 text-xs hover:bg-zinc-600"
            >
              Cancelar
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-1.5">
            📍 Página: {pageContext.pathname}
          </p>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-zinc-800 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shrink-0 bg-zinc-900/80">
        {/* Pending image previews */}
        {pendingImages.length > 0 && (
          <div className="flex gap-2 mb-2">
            {pendingImages.map((img, i) => (
              <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-purple-500/30 group">
                <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => { handleImageUpload(e.target.files); e.target.value = "" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={pendingImages.length >= 3 || streaming}
            className="p-3 sm:p-2.5 text-zinc-400 hover:text-purple-400 disabled:text-zinc-600 transition-colors shrink-0"
            title="Adjuntar imagen"
          >
            <ImagePlus className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize() }}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu mensaje..."
            rows={1}
            className="flex-1 bg-zinc-800 text-white text-sm sm:text-sm text-base rounded-xl px-3 py-3 sm:py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-zinc-500 max-h-24"
          />
          <button
            onClick={() => sendMessage()}
            disabled={(!input.trim() && pendingImages.length === 0) || streaming}
            className="p-3 sm:p-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl transition-colors shrink-0"
          >
            {streaming ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Send className="w-5 h-5 sm:w-4 sm:h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-1 text-center">Respuestas generadas por IA · Pueden contener errores</p>
      </div>
    </div>
  )
}

// --- Share Button ---
function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
    setShowMenu(false)
  }

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Mirá el diseño que hice con Novamente! ${url}`)}`, "_blank")
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 hover:bg-zinc-700 rounded transition-colors"
        title="Compartir"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5 text-zinc-400" />}
      </button>
      {showMenu && (
        <div className="absolute bottom-8 right-0 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg p-1 min-w-[140px] z-10">
          <button onClick={copyLink} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 rounded">
            <Copy className="w-3 h-3" /> Copiar link
          </button>
          <button onClick={shareWhatsApp} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 rounded">
            <Share2 className="w-3 h-3" /> WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}

// --- Action Card Component ---
function ActionCard({ action, onExecute }: { action: ParsedAction; onExecute: () => void }) {
  if (action.type === "SHOW_CATALOG") {
    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs text-zinc-400 font-medium">Nuestros productos:</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PRODUCTS.map(p => (
            <div key={p.name} className="shrink-0 w-32 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700 hover:border-purple-500/50 transition-colors">
              <div className="h-24 bg-zinc-800 relative">
                <Image src={p.image} alt={p.name} fill className="object-cover" sizes="128px" />
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-zinc-200 truncate">{p.name}</p>
                <p className="text-xs text-purple-400 font-bold">{formatPrice(p.price)}</p>
                <p className="text-[10px] text-zinc-500 truncate">{p.colors.join(", ")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (action.type === "SHOW_STYLES") {
    return (
      <div className="mt-3">
        <p className="text-xs text-zinc-400 font-medium mb-2">37 estilos disponibles:</p>
        <div className="grid grid-cols-4 gap-1">
          {["acuarela-leon", "geometrico-colibri", "pixel-art-astronauta", "pop-art-comic", "japones-gran-ola", "retro-vaporwave-synthwave", "line-art-retrato", "surrealista-leopardo"].map(s => (
            <div key={s} className="relative aspect-square rounded-md overflow-hidden bg-zinc-800">
              <Image src={`/styles/${s}.png`} alt={s} fill className="object-cover" sizes="60px" />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-500 mt-1">y 29 más... ¡Pedime cualquier estilo!</p>
      </div>
    )
  }

  if (action.type === "SHOW_PRICING") {
    const pricing = [
      { name: "Musculosa Bali", price: 21800 },
      { name: "Crop Mujer", price: 23500 },
      { name: "Aldea Classic", price: 28600 },
      { name: "Clásica Mujer", price: 28600 },
      { name: "Aura Oversize", price: 31000 },
      { name: "Buzo Cuello Redondo", price: 43000 },
      { name: "Buzo Hoodie Oversize", price: 55000 },
    ]
    return (
      <div className="mt-3">
        <p className="text-xs text-zinc-400 font-medium mb-2">Precios (incluyen diseño + DTG):</p>
        <div className="space-y-1">
          {pricing.map(p => (
            <div key={p.name} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-1.5 border border-zinc-800">
              <span className="text-xs text-zinc-300">{p.name}</span>
              <span className="text-xs text-purple-400 font-bold">{formatPrice(p.price)}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-500 mt-1.5">Descuentos por cantidad disponibles para B2B</p>
      </div>
    )
  }

  if (action.type === "GENERATE_DESIGN") {
    if (action.status === "loading") {
      return (
        <div className="mt-3 bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 shrink-0">
              <div className="absolute inset-0 rounded-lg bg-purple-500/20 animate-pulse" />
              <Sparkles className="w-6 h-6 text-purple-400 absolute top-3 left-3 animate-spin" style={{ animationDuration: "3s" }} />
            </div>
            <div>
              <p className="text-sm text-zinc-200 font-medium">Generando diseño...</p>
              <p className="text-[10px] text-zinc-500">Esto puede tardar unos segundos</p>
            </div>
          </div>
        </div>
      )
    }
    if (action.status === "done" && action.result) {
      return (
        <div className="mt-3 rounded-xl overflow-hidden border border-zinc-700">
          <div className="relative aspect-square w-full">
            <Image src={action.result} alt="Diseño generado" fill className="object-contain bg-zinc-900" sizes="(max-width: 640px) 80vw, 320px" />
          </div>
          <div className="p-2 bg-zinc-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-zinc-400">Diseño generado con IA</span>
            </div>
            <ShareButton url={action.result} />
          </div>
        </div>
      )
    }
    if (action.status === "error") {
      return (
        <div className="mt-2 flex items-center gap-2">
          <p className="text-xs text-red-400">{action.result || "Error generando diseño"}</p>
          <button onClick={onExecute} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      )
    }
    return null
  }

  if (action.type === "SHOW_MOCKUP") {
    if (action.status === "loading") {
      return (
        <div className="mt-3 bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400 shrink-0" />
            <div>
              <p className="text-sm text-zinc-200 font-medium">Creando mockup...</p>
              <p className="text-[10px] text-zinc-500">Estampando en la prenda</p>
            </div>
          </div>
        </div>
      )
    }
    if (action.status === "done" && action.result) {
      return (
        <div className="mt-3 rounded-xl overflow-hidden border border-zinc-700">
          <div className="relative aspect-[4/5] w-full">
            <Image src={action.result} alt="Mockup" fill className="object-contain bg-zinc-900" sizes="(max-width: 640px) 80vw, 320px" />
          </div>
          <div className="p-2 bg-zinc-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-zinc-400">Vista previa en prenda</span>
            </div>
            <ShareButton url={action.result} />
          </div>
        </div>
      )
    }
    if (action.status === "error") {
      return (
        <div className="mt-2 flex items-center gap-2">
          <p className="text-xs text-red-400">{action.result || "Error creando mockup"}</p>
          <button onClick={onExecute} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      )
    }
    return null
  }

  if (action.type === "ADD_TO_CART") {
    if (action.status === "pending") {
      return (
        <button
          onClick={onExecute}
          className="mt-3 flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] w-full justify-center"
        >
          <ShoppingCart className="w-4 h-4" />
          Agregar al carrito
        </button>
      )
    }
    if (action.status === "loading") {
      return <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Agregando...</div>
    }
    if (action.status === "done") {
      return (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-green-400 font-medium">
          <Check className="w-3.5 h-3.5" /> ¡Agregado al carrito!
        </div>
      )
    }
    return null
  }

  if (action.type === "CHECKOUT") {
    return (
      <button
        onClick={onExecute}
        className="mt-3 flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] w-full justify-center"
      >
        <ChevronRight className="w-4 h-4" />
        Ir a pagar
      </button>
    )
  }

  return null
}
