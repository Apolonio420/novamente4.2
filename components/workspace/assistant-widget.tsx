'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  ChevronDown,
  Mic,
  MicOff,
  Paperclip,
  AlertTriangle,
  Zap,
  ImageIcon,
} from 'lucide-react'
import { useAssistant } from '@/lib/assistant/assistant-context'

// ── Config ──
const API_ENDPOINT = '/api/partners/assistant/chat'
const STORAGE_KEY = 'novamente-assistant-chat'
const MAX_HISTORY = 20

// ── Types ──
interface Message {
  id: string
  role: 'user' | 'model'
  text: string
  imageUrls?: string[]
  sources?: { source: string; title?: string; score: number }[]
  superAction?: { type: string; description: string }
}

interface AssistantWidgetProps {
  /** Pre-fill the input with an error report */
  initialMessage?: string
  /** Show the widget open by default */
  defaultOpen?: boolean
  /** Pre-attached image URLs (e.g. from error boundary screenshot) */
  initialImages?: string[]
}

// ── Simple markdown: links, bold, inline code ──
function renderMarkdown(text: string) {
  const parts: (string | React.ReactElement)[] = []
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g
  let lastIndex = 0
  let match
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))

    if (match[1] && match[2]) {
      parts.push(
        <a
          key={key++}
          href={match[2]}
          className="text-violet-400 underline hover:text-violet-300 font-medium"
        >
          {match[1]}
        </a>
      )
    } else if (match[3]) {
      parts.push(
        <strong key={key++} className="font-semibold text-zinc-100">
          {match[3]}
        </strong>
      )
    } else if (match[4]) {
      parts.push(
        <code
          key={key++}
          className="bg-zinc-700 rounded px-1 py-0.5 text-xs font-mono text-zinc-300"
        >
          {match[4]}
        </code>
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length > 0 ? parts : text
}

// ── Super action parser ──
function parseSuperAction(text: string): { type: string; description: string } | null {
  const match = text.match(/\[SUPER_ACTION:(\w+)\]\s*(.+)/)
  if (!match) return null
  return { type: match[1], description: match[2] }
}

function stripSuperAction(text: string): string {
  return text.replace(/\n?\[SUPER_ACTION:\w+\]\s*.+/, '').trim()
}

// ── Speech recognition hook ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionAny = any

function useSpeechRecognition() {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionAny>(null)

  useEffect(() => {
    const w = typeof window !== 'undefined' ? (window as SpeechRecognitionAny) : null
    const SR = w?.SpeechRecognition || w?.webkitSpeechRecognition || null
    setSupported(!!SR)
    if (SR) {
      const r = new SR()
      r.lang = 'es-AR'
      r.interimResults = false
      r.maxAlternatives = 1
      recognitionRef.current = r
    }
  }, [])

  const listen = useCallback(
    (onResult: (text: string) => void) => {
      const r = recognitionRef.current
      if (!r) return

      r.onresult = (e: SpeechRecognitionAny) => {
        const transcript = e.results?.[0]?.[0]?.transcript
        if (transcript) onResult(transcript)
      }
      r.onend = () => setListening(false)
      r.onerror = () => setListening(false)

      setListening(true)
      r.start()
    },
    []
  )

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, supported, listen, stop }
}

// ── Main Widget ──
export function AssistantWidget({
  initialMessage,
  defaultOpen = false,
  initialImages,
}: AssistantWidgetProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(initialMessage ?? '')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingImages, setPendingImages] = useState<string[]>(initialImages ?? [])
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sendingRef = useRef(false)
  const speech = useSpeechRecognition()
  const assistant = useAssistant()

  // React to bug report from error boundary
  useEffect(() => {
    if (assistant.shouldOpen && assistant.bugReport) {
      setOpen(true)
      assistant.resetOpen()
      const bug = assistant.bugReport
      const bugMsg = `Quiero reportar un error tecnico.\n\nError: ${bug.errorMessage || 'desconocido'}\nPagina: ${bug.sourceUrl || 'desconocida'}${bug.errorDigest ? `\nID: ${bug.errorDigest}` : ''}`
      setInput(bugMsg)
      if (bug.screenshotUrl) {
        setPendingImages((prev) => [...prev, bug.screenshotUrl!])
      }
      assistant.clearBugReport()
    }
  }, [assistant])

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Message[]
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed)
      }
    } catch {}
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)))
      } catch {}
    }
  }, [messages])

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  // Auto-send initial message
  useEffect(() => {
    if (initialMessage && defaultOpen && messages.length === 0) {
      sendMessage(initialMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Solo se pueden adjuntar imagenes (JPG, PNG, WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5MB')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/partners/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      setPendingImages((prev) => [...prev.slice(-2), url])
    } catch {
      setError('Error al subir la imagen. Intenta de nuevo.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const sendMessage = async (overrideQuery?: string) => {
    const query = (overrideQuery ?? input).trim()
    if (!query || streaming || sendingRef.current) return
    sendingRef.current = true

    const imageUrls = [...pendingImages]
    if (!overrideQuery) setInput('')
    setPendingImages([])
    setError(null)

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    }
    const assistantMsg: Message = { id: `model-${Date.now()}`, role: 'model', text: '' }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    try {
      const history = messages
        .filter((m) => m.text.trim().length > 0)
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, text: m.text.slice(0, 4000) }))

      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          persona: 'partner',
          history,
          ...(imageUrls.length > 0 ? { imageUrls } : {}),
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Error del servidor' }))
        throw new Error(errBody.error || `HTTP ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream available')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'chunk') {
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last.role === 'model') {
                  const newText = last.text + event.text
                  const sa = parseSuperAction(newText)
                  updated[updated.length - 1] = {
                    ...last,
                    text: newText,
                    superAction: sa ?? last.superAction,
                  }
                }
                return updated
              })
            } else if (event.type === 'sources') {
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last.role === 'model')
                  updated[updated.length - 1] = { ...last, sources: event.sources }
                return updated
              })
            } else if (event.type === 'error') {
              setError(event.error)
            }
          } catch {}
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el asistente')
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'model' && !last.text) return prev.slice(0, -1)
        return prev
      })
    } finally {
      sendingRef.current = false
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  return (
    <>
      {/* FAB button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-violet-600 hover:bg-violet-500 px-4 py-3 shadow-lg transition-all hover:scale-105 active:scale-95 text-white"
          aria-label="Abrir asistente"
        >
          <MessageCircle className="size-5" />
          <span className="text-sm font-medium hidden sm:inline">Asistente</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col w-[400px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-5rem)] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 rounded-t-xl bg-violet-600 text-white">
            <div className="flex items-center gap-2">
              <Bot className="size-5" />
              <span className="font-semibold text-sm">Asistente Novamente</span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-md hover:bg-white/20 text-xs"
                >
                  Limpiar
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md hover:bg-white/20"
                aria-label="Cerrar"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex gap-2 items-start">
                <div className="flex-shrink-0 size-7 rounded-full flex items-center justify-center bg-violet-600/20 text-violet-400">
                  <Bot className="size-4" />
                </div>
                <div className="bg-zinc-800 rounded-lg rounded-tl-none px-3 py-2 text-sm text-zinc-300 max-w-[85%]">
                  Hola! Soy el asistente de Novamente. Preguntame sobre el workspace,
                  catalogo, design engine, leads, planes, o reporta un problema tecnico.
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const displayText = msg.superAction
                ? stripSuperAction(msg.text)
                : msg.text

              return (
                <div key={msg.id}>
                  <div
                    className={`flex gap-2 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`flex-shrink-0 size-7 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-zinc-700 text-zinc-300' : 'bg-violet-600/20 text-violet-400'}`}
                    >
                      {msg.role === 'user' ? (
                        <User className="size-4" />
                      ) : (
                        <Bot className="size-4" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap break-words ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-300 rounded-tl-none'}`}
                    >
                      {msg.imageUrls && msg.imageUrls.length > 0 && (
                        <div className="flex gap-1 mb-1">
                          {msg.imageUrls.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt="Adjunto"
                              className="w-16 h-16 rounded object-cover border border-zinc-600"
                            />
                          ))}
                        </div>
                      )}
                      {displayText ? (
                        msg.role === 'model' ? (
                          renderMarkdown(displayText)
                        ) : (
                          displayText
                        )
                      ) : streaming && msg.role === 'model' ? (
                        <span className="flex items-center gap-1 text-zinc-500">
                          <Loader2 className="size-3 animate-spin" /> Pensando...
                        </span>
                      ) : null}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-zinc-700">
                          <span className="text-xs text-zinc-500 font-medium">Fuentes:</span>
                          <ul className="mt-1 space-y-0.5">
                            {msg.sources.slice(0, 3).map((s, i) => (
                              <li key={i} className="text-xs text-zinc-500 truncate">
                                {s.title || s.source}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Super action card */}
                  {msg.superAction && (
                    <div className="ml-9 mt-2 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-1">
                        <Zap className="size-3" />
                        Super Accion Detectada
                      </div>
                      <p className="text-xs text-zinc-300">{msg.superAction.description}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Esto requiere intervencion tecnica. Se va a resolver automaticamente.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-700 p-3">
            {/* Pending image previews */}
            {pendingImages.length > 0 && (
              <div className="flex gap-1 mb-2">
                {pendingImages.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-12 h-12 rounded object-cover border border-zinc-600" />
                    <button
                      onClick={() => setPendingImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 bg-zinc-700 rounded-full p-0.5 text-zinc-300 hover:text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-end">
              {/* Mic button */}
              {speech.supported && (
                <button
                  onClick={() => {
                    if (speech.listening) {
                      speech.stop()
                    } else {
                      speech.listen((text) => setInput((prev) => prev + text))
                    }
                  }}
                  className={`flex-shrink-0 p-2 rounded-lg transition-colors ${speech.listening ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                  title={speech.listening ? 'Detener grabacion' : 'Hablar'}
                >
                  {speech.listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </button>
              )}

              {/* Attach image button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || pendingImages.length >= 3}
                className="flex-shrink-0 p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-50 transition-colors"
                title="Adjuntar imagen"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribi tu consulta..."
                className="flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[40px] max-h-[100px]"
                rows={1}
                disabled={streaming}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || streaming}
                className="flex-shrink-0 p-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 transition-colors"
              >
                {streaming ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-zinc-600 mt-1.5 text-center">
              Respuestas basadas en documentacion. Pueden contener errores.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
