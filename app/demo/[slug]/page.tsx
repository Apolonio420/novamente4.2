'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const DEMO_INFO: Record<string, { name: string; icon: string; color: string; suggestions: string[] }> = {
  'demo-restaurante': {
    name: 'La Parrilla de Don Carlos',
    icon: '🍽️',
    color: '#DC2626',
    suggestions: [
      'Que tienen para comer?',
      'Hacen delivery?',
      'Quiero un asado para 2',
      'Tienen opciones vegetarianas?',
    ],
  },
  'demo-clinica': {
    name: 'Centro Medico Vida Sana',
    icon: '🏥',
    color: '#0891B2',
    suggestions: [
      'Necesito un turno con dermatologo',
      'Atienden OSDE?',
      'Cual es el horario de atencion?',
      'Cuanto sale una consulta?',
    ],
  },
  'demo-inmobiliaria': {
    name: 'Propiedades del Sur',
    icon: '🏠',
    color: '#7C3AED',
    suggestions: [
      'Busco un 2 ambientes en Palermo',
      'Que alquileres tienen?',
      'Hacen tasaciones?',
      'Puedo visitar el depto de Belgrano?',
    ],
  },
  'demo-mayorista': {
    name: 'TextilPro Mayorista',
    icon: '📦',
    color: '#EA580C',
    suggestions: [
      'Pasame la lista de precios',
      'Cual es el minimo de compra?',
      'Necesito 50 remeras basicas',
      'Hacen estampado personalizado?',
    ],
  },
  'demo-peluqueria': {
    name: 'Studio Bella',
    icon: '💇',
    color: '#DB2777',
    suggestions: [
      'Cuanto sale un corte de mujer?',
      'Tienen turno para mechas el sabado?',
      'Hacen alisado de keratina?',
      'Atienden sin turno?',
    ],
  },
}

// ---------------------------------------------------------------------------
// Rich message renderer with markdown + product card detection
// ---------------------------------------------------------------------------

function MessageContent({ content, color }: { content: string; color: string }) {
  // Split content into segments: text and product lines
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let currentText: string[] = []

  const flushText = (key: string) => {
    if (currentText.length > 0) {
      elements.push(
        <span key={key} dangerouslySetInnerHTML={{
          __html: currentText.join('<br/>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
        }} />
      )
      currentText = []
    }
  }

  // Detect product lines: "- ProductName: $Price" or "**ProductName** description - $Price"
  const priceRegex = /[-•]\s*\*{0,2}(.+?)\*{0,2}\s*(?:[:,—–-])\s*(.+?)[-–]\s*\$\s*([\d.,]+)/
  const simplePriceRegex = /\*{0,2}(.+?)\*{0,2}.*?\$\s*([\d.,]+)/

  lines.forEach((line, i) => {
    const match = line.match(priceRegex)
    if (match) {
      flushText(`t${i}`)
      const [, name, desc, price] = match
      elements.push(
        <div key={`p${i}`} className="my-2 flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg" style={{ backgroundColor: `${color}25` }}>
            {getProductEmoji(name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{name.replace(/\*/g, '').trim()}</p>
            <p className="text-xs text-zinc-400 truncate">{desc.trim()}</p>
          </div>
          <div className="shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold" style={{ backgroundColor: `${color}30`, color }}>
            ${Number(price.replace(/\./g, '').replace(',', '.')).toLocaleString('es-AR')}
          </div>
        </div>
      )
    } else {
      // Check for category headers like **Carnes:** or **Entradas:**
      const categoryMatch = line.match(/^\s*\*\*(.+?):\*\*\s*$/)
      if (categoryMatch) {
        flushText(`t${i}`)
        elements.push(
          <div key={`c${i}`} className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color }}>
            {categoryMatch[1]}
          </div>
        )
      } else {
        currentText.push(line)
      }
    }
  })

  flushText('final')

  return <div className="space-y-0.5">{elements}</div>
}

function getProductEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('asado') || n.includes('carne') || n.includes('parrilla')) return '🥩'
  if (n.includes('milanesa')) return '🍖'
  if (n.includes('empanada')) return '🥟'
  if (n.includes('provoleta') || n.includes('queso')) return '🧀'
  if (n.includes('flan') || n.includes('postre') || n.includes('dulce')) return '🍮'
  if (n.includes('picada') || n.includes('tabla')) return '🧆'
  if (n.includes('ensalada') || n.includes('verdura')) return '🥗'
  if (n.includes('pizza')) return '🍕'
  if (n.includes('pasta') || n.includes('ñoqui')) return '🍝'
  if (n.includes('vino') || n.includes('bebida')) return '🍷'
  if (n.includes('corte') || n.includes('pelo') || n.includes('cabello')) return '✂️'
  if (n.includes('mecha') || n.includes('color') || n.includes('tintura')) return '🎨'
  if (n.includes('manicur')) return '💅'
  if (n.includes('alisado') || n.includes('keratina')) return '✨'
  if (n.includes('consulta') || n.includes('medic') || n.includes('clinic')) return '🩺'
  if (n.includes('pediatr') || n.includes('nino')) return '👶'
  if (n.includes('psicolog')) return '🧠'
  if (n.includes('nutrici')) return '🥦'
  if (n.includes('laboratorio') || n.includes('analisis')) return '🔬'
  if (n.includes('depto') || n.includes('departamento') || n.includes('amb')) return '🏢'
  if (n.includes('ph') || n.includes('casa')) return '🏠'
  if (n.includes('alquiler')) return '🔑'
  if (n.includes('remera') || n.includes('camiseta')) return '👕'
  if (n.includes('buzo') || n.includes('hoodie')) return '🧥'
  if (n.includes('campera')) return '🧥'
  if (n.includes('pantalon')) return '👖'
  if (n.includes('conjunto')) return '🏋️'
  return '📦'
}

export default function DemoChatPage() {
  const params = useParams()
  const slug = params.slug as string
  const info = DEMO_INFO[slug]

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/partners/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug: slug, sessionId, message: msg }),
      })

      if (!res.ok) throw new Error('Failed')
      const data = await res.json()

      if (data.sessionId && data.sessionId !== sessionId) setSessionId(data.sessionId)

      setMessages(prev => [...prev, {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: data.response,
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: `e_${Date.now()}`,
        role: 'assistant',
        content: 'Error de conexion. Intenta de nuevo.',
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, sessionId, slug])

  if (!info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Demo no encontrada. <Link href="/demo" className="ml-2 text-green-400 underline">Volver</Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800" style={{ backgroundColor: `${info.color}15` }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              ←
            </Link>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
              style={{ backgroundColor: `${info.color}30` }}
            >
              {info.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{info.name}</p>
              <p className="text-xs" style={{ color: info.color }}>● Asistente IA — Online</p>
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800 px-3 py-1 text-xs text-zinc-400">DEMO</div>
        </div>
      </div>

      {/* Chat area */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-4">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {/* Welcome + suggestions */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-6 pt-12 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                style={{ backgroundColor: `${info.color}20` }}
              >
                {info.icon}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{info.name}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Chatea con el asistente virtual. Preguntale lo que quieras.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {info.suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-md text-white'
                    : 'rounded-bl-md bg-zinc-800 text-zinc-200'
                }`}
                style={msg.role === 'user' ? { backgroundColor: info.color } : undefined}
              >
                <MessageContent content={msg.content} color={info.color} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-zinc-800 px-4 py-3">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-500" />
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-500" style={{ animationDelay: '0.2s' }} />
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-500" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Escribi tu consulta..."
              maxLength={2000}
              disabled={loading}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-zinc-500 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{ backgroundColor: input.trim() && !loading ? info.color : undefined }}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                input.trim() && !loading ? 'text-white hover:opacity-90' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom CTA bar */}
      <div className="border-t border-zinc-800 bg-zinc-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <p className="text-sm text-zinc-400">
            Queres este bot para tu negocio?
          </p>
          <div className="flex gap-2">
            <a
              href="https://wa.me/5491161759011?text=Hola!%20Vi%20la%20demo%20del%20chatbot%20y%20me%20interesa"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500"
            >
              Me interesa
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
