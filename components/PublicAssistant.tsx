"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useCart } from "@/lib/cartStore"
import {
  MessageSquare, X, Maximize2, Minimize2, Send, Trash2,
  ShoppingCart, Loader2, Sparkles, Palette, ChevronRight,
} from "lucide-react"
import Image from "next/image"

interface Message {
  id: string
  role: "user" | "model"
  text: string
  images?: string[]
  actions?: ParsedAction[]
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

// Products for catalog cards
const CATALOG = [
  { name: "Aura Oversize T-Shirt", price: 31000, colors: "negro, blanco, caramel", image: "/products/oversize-negro-front.jpeg", garmentType: "aura-oversize-tshirt" },
  { name: "Aldea Classic T-Shirt", price: 28600, colors: "negro, blanco", image: "/products/classic-negro-front.jpeg", garmentType: "aldea-classic-tshirt" },
  { name: "Astra Oversize Hoodie", price: 60000, colors: "negro, caramel, crema, gris", image: "/products/hoodie-negro-front.jpeg", garmentType: "astra-oversize-hoodie" },
  { name: "Buzo Hoodie Unisex", price: 55000, colors: "negro, stone-wash, blanco", image: "/products/hoodie-negro-front.jpeg", garmentType: "buzo-hoodie-unisex" },
  { name: "Musculosa Bali", price: 21800, colors: "blanca, negra, gris", image: "/products/musculosa-bali-front.jpeg", garmentType: "musculosa-bali" },
]

function formatPrice(n: number) {
  return `$${n.toLocaleString("es-AR")}`
}

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-100">$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-purple-400 underline hover:text-purple-300">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-700 px-1 rounded text-sm">$1</code>')
    .replace(/\n/g, "<br/>")
}

export function PublicAssistant() {
  const pathname = usePathname()
  const router = useRouter()
  const { addItem, getTotalItems } = useCart()

  // Don't render on workspace or admin pages
  if (pathname?.startsWith("/workspace") || pathname?.startsWith("/admin")) return null

  return <AssistantInner addItem={addItem} getTotalItems={getTotalItems} router={router} />
}

function AssistantInner({
  addItem,
  getTotalItems,
  router,
}: {
  addItem: (item: any) => void
  getTotalItems: () => number
  router: ReturnType<typeof useRouter>
}) {
  const [open, setOpen] = useState(false)
  const [fullScreen, setFullScreen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Message[]
        setMessages(parsed.slice(-MAX_STORED))
      }
    } catch { /* ignore */ }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)))
    }
  }, [messages])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streaming])

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

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
          const [prompt, style] = action.params
          const res = await fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, n: 1 }),
          })
          const data = await res.json()
          if (data.success && data.images?.[0]?.url) {
            updateAction("done", data.images[0].url)
          } else {
            updateAction("error", data.error || "No se pudo generar el diseno")
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

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return

    setInput("")
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text, timestamp: Date.now() }
    addMessage(userMsg)

    const modelMsg: Message = { id: `m-${Date.now()}`, role: "model", text: "", timestamp: Date.now() }
    addMessage(modelMsg)
    setStreaming(true)

    try {
      const history = messages.slice(-MAX_HISTORY).map(m => ({ role: m.role, text: m.text }))
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, history }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error de conexion" }))
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
            }
          } catch { /* skip */ }
        }
      }

      // Parse actions from final text
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

      if (actions.length > 0) {
        const cleanText = fullText.replace(/\[ACTION:\w+\]\s*.*/g, "").trim()
        updateLastModel(m => ({ ...m, text: cleanText, actions }))

        // Auto-execute SHOW_CATALOG, SHOW_STYLES, GENERATE_DESIGN, SHOW_MOCKUP
        for (const action of actions) {
          if (["GENERATE_DESIGN", "SHOW_MOCKUP", "SHOW_CATALOG", "SHOW_STYLES"].includes(action.type)) {
            executeAction(action, modelMsg.id)
          }
        }
      }
    } catch (err) {
      updateLastModel(m => ({ ...m, text: "Error de conexion. Intenta de nuevo." }))
    } finally {
      setStreaming(false)
    }
  }, [input, streaming, messages, addMessage, updateLastModel, executeAction])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const cartCount = getTotalItems()

  // --- RENDER ---

  // FAB button
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-50 flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full px-4 py-3 shadow-lg shadow-purple-900/30 transition-all hover:scale-105"
        aria-label="Abrir asistente"
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Nova</span>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>
        )}
      </button>
    )
  }

  // Panel / Full-screen
  const panelClass = fullScreen
    ? "fixed inset-0 z-50"
    : "fixed bottom-4 right-4 z-50 w-[400px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] rounded-2xl shadow-2xl shadow-black/40"

  return (
    <div className={`${panelClass} bg-zinc-950 border border-zinc-800 flex flex-col overflow-hidden ${fullScreen ? "" : "rounded-2xl"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-600/90 backdrop-blur-sm border-b border-purple-500/30 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <span className="font-semibold text-white">Nova</span>
          <span className="text-purple-200 text-xs">Asistente IA</span>
        </div>
        <div className="flex items-center gap-1">
          {cartCount > 0 && (
            <button onClick={() => router.push("/cart")} className="p-1.5 hover:bg-purple-500/50 rounded-lg transition-colors relative" title="Ver carrito">
              <ShoppingCart className="w-4 h-4 text-white" />
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>
            </button>
          )}
          <button onClick={clearChat} className="p-1.5 hover:bg-purple-500/50 rounded-lg transition-colors" title="Limpiar chat">
            <Trash2 className="w-4 h-4 text-purple-200" />
          </button>
          <button onClick={() => setFullScreen(!fullScreen)} className="p-1.5 hover:bg-purple-500/50 rounded-lg transition-colors" title={fullScreen ? "Minimizar" : "Pantalla completa"}>
            {fullScreen ? <Minimize2 className="w-4 h-4 text-purple-200" /> : <Maximize2 className="w-4 h-4 text-purple-200" />}
          </button>
          <button onClick={() => { setOpen(false); setFullScreen(false) }} className="p-1.5 hover:bg-purple-500/50 rounded-lg transition-colors" title="Cerrar">
            <X className="w-4 h-4 text-purple-200" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <Sparkles className="w-10 h-10 text-purple-400 mx-auto" />
            <p className="text-zinc-300 font-medium">Hola! Soy Nova</p>
            <p className="text-zinc-500 text-sm max-w-[280px] mx-auto">
              Te ayudo a disenar tu ropa personalizada con IA. Preguntame lo que quieras o pedime que te genere un diseno.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {["Ver productos", "Generar un diseno", "Como funciona?"].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); setTimeout(sendMessage, 50) }}
                  className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
              msg.role === "user"
                ? "bg-purple-600 text-white"
                : "bg-zinc-800 text-zinc-200"
            }`}>
              {msg.role === "model" && !msg.text && streaming ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-zinc-400 text-sm">Pensando...</span>
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
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 px-3 py-2 shrink-0 bg-zinc-900/80">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribi tu mensaje..."
            rows={1}
            className="flex-1 bg-zinc-800 text-white text-sm rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-zinc-500 max-h-24"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl transition-colors shrink-0"
          >
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-1 text-center">Respuestas generadas por IA. Pueden contener errores.</p>
      </div>
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
          {CATALOG.map(p => (
            <div key={p.name} className="shrink-0 w-32 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700">
              <div className="h-24 bg-zinc-800 relative">
                <Image src={p.image} alt={p.name} fill className="object-cover" sizes="128px" />
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-zinc-200 truncate">{p.name}</p>
                <p className="text-xs text-purple-400 font-bold">{formatPrice(p.price)}</p>
                <p className="text-[10px] text-zinc-500 truncate">{p.colors}</p>
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
          {["acuarela-digital", "manga-anime", "pixel-art-retro", "geometrico-abstracto", "neon-cyberpunk", "vintage-poster", "sticker-style", "line-art-tatuaje"].map(s => (
            <div key={s} className="relative aspect-square rounded-md overflow-hidden bg-zinc-800">
              <Image src={`/styles/${s.replace(/-/g, "-")}.png`} alt={s} fill className="object-cover" sizes="60px" />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-500 mt-1">y 29 mas... Pedime cualquier estilo!</p>
      </div>
    )
  }

  if (action.type === "GENERATE_DESIGN") {
    if (action.status === "loading") {
      return (
        <div className="mt-3 flex items-center gap-2 bg-zinc-900 rounded-lg p-3 border border-zinc-700">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          <span className="text-xs text-zinc-300">Generando diseno con IA...</span>
        </div>
      )
    }
    if (action.status === "done" && action.result) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden border border-zinc-700">
          <div className="relative aspect-square max-w-[240px]">
            <Image src={action.result} alt="Diseno generado" fill className="object-contain bg-zinc-900" sizes="240px" />
          </div>
          <div className="p-2 bg-zinc-900 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] text-zinc-400">Diseno generado con IA</span>
          </div>
        </div>
      )
    }
    if (action.status === "error") {
      return <p className="mt-2 text-xs text-red-400">{action.result || "Error generando diseno"}</p>
    }
    return null
  }

  if (action.type === "SHOW_MOCKUP") {
    if (action.status === "loading") {
      return (
        <div className="mt-3 flex items-center gap-2 bg-zinc-900 rounded-lg p-3 border border-zinc-700">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          <span className="text-xs text-zinc-300">Creando mockup...</span>
        </div>
      )
    }
    if (action.status === "done" && action.result) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden border border-zinc-700">
          <div className="relative aspect-[4/5] max-w-[240px]">
            <Image src={action.result} alt="Mockup" fill className="object-contain bg-zinc-900" sizes="240px" />
          </div>
          <div className="p-2 bg-zinc-900 flex items-center gap-2">
            <Palette className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] text-zinc-400">Vista previa en prenda</span>
          </div>
        </div>
      )
    }
    if (action.status === "error") {
      return <p className="mt-2 text-xs text-red-400">{action.result || "Error creando mockup"}</p>
    }
    return null
  }

  if (action.type === "ADD_TO_CART") {
    if (action.status === "pending") {
      return (
        <button
          onClick={onExecute}
          className="mt-3 flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors w-full justify-center"
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
      return <div className="mt-2 text-xs text-green-400 font-medium">Agregado al carrito!</div>
    }
    return null
  }

  if (action.type === "CHECKOUT") {
    return (
      <button
        onClick={onExecute}
        className="mt-3 flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors w-full justify-center"
      >
        <ChevronRight className="w-4 h-4" />
        Ir a pagar
      </button>
    )
  }

  return null
}
