'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatWidgetProps {
  tenantSlug: string
  tenantName: string
  primaryColor: string
}

// ---------------------------------------------------------------------------
// Chat Widget
// ---------------------------------------------------------------------------

export default function ChatWidget({
  tenantSlug,
  tenantName,
  primaryColor,
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Persist sessionId in localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`agent_session_${tenantSlug}`)
    if (stored) setSessionId(stored)
  }, [tenantSlug])

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(`agent_session_${tenantSlug}`, sessionId)
    }
  }, [sessionId, tenantSlug])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/partners/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          sessionId,
          message: text,
        }),
      })

      if (!res.ok) throw new Error('Failed to send')

      const data = await res.json()

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId)
      }

      const aiMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errMsg: ChatMessage = {
        id: `e_${Date.now()}`,
        role: 'assistant',
        content: 'Lo siento, hubo un error. Intenta de nuevo en unos segundos.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }, [input, loading, sessionId, tenantSlug])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* ── Floating Action Button ─────────────────────────── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir chat"
          style={{ backgroundColor: primaryColor }}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 md:bottom-6 md:right-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* ── Chat Panel ─────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 md:inset-auto md:bottom-6 md:right-6 md:h-[500px] md:w-[380px] md:rounded-2xl md:border md:border-zinc-800 md:shadow-2xl">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 md:rounded-t-2xl"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {tenantName}
              </p>
              <p className="text-xs text-white/70">Asistente virtual</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${primaryColor}22` }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={primaryColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-400">
                  Hola! Escribi tu consulta y te respondo al toque.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-md text-white'
                      : 'rounded-bl-md bg-zinc-800 text-zinc-200'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { backgroundColor: primaryColor }
                      : undefined
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-zinc-800 px-4 py-3">
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-zinc-500"
                    style={{ animation: 'chatDot 1.4s infinite 0s' }}
                  />
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-zinc-500"
                    style={{ animation: 'chatDot 1.4s infinite 0.2s' }}
                  />
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-zinc-500"
                    style={{ animation: 'chatDot 1.4s infinite 0.4s' }}
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800 p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribi tu mensaje..."
                maxLength={2000}
                disabled={loading}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-zinc-500 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                aria-label="Enviar mensaje"
                style={{
                  backgroundColor: input.trim() && !loading ? primaryColor : undefined,
                }}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                  input.trim() && !loading
                    ? 'text-white hover:opacity-90'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Typing dots animation */}
          <style>{`
            @keyframes chatDot {
              0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
              40% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
