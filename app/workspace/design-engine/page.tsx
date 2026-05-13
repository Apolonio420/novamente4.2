'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Sparkles, Loader2, ImageIcon, Shirt, X, ZoomIn, Send, Plus, Menu, Trash2,
  Download, ArrowUp, Clock, Palette, ChevronDown, Upload as UploadIcon, ExternalLink,
  ChevronRight, TrendingUp, Info,
} from 'lucide-react'
import { authFetch } from '@/lib/partners/auth-fetch'
import type { StudioMessage, StudioSession, UsageInfo } from '@/lib/partners/studio/types'
import { createStudioMessage, createStudioSession } from '@/lib/partners/studio/types'
import {
  GARMENT_PRICING,
  TIER_THRESHOLDS,
  getTierForVolume,
  getTierLabel,
  getNextTier,
  formatPrice as formatGarmentPrice,
  type PricingTier,
  type GarmentPricing,
} from '@/lib/partners/garment-pricing'
import {
  fetchStudioSessions,
  fetchSessionMessages,
  createStudioSession as createRemoteSession,
  saveStudioMessage,
  deleteStudioSession,
  fetchUsageStats,
  type SessionSummary,
} from '@/lib/partners/studio/session-service'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StyleOption {
  key: string
  name: string
  description: string
  keywords: string
  printOptimized: boolean
}

interface GarmentOption {
  key: string
  name: string
  colors: string[]
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<string, string> = {
  black: '#1a1a1a', white: '#f5f5f5', cream: '#f5f0e1', gray: '#6b7280', marron: '#8B5E34',
}
const COLOR_LABELS: Record<string, string> = {
  black: 'Negro', white: 'Blanco', cream: 'Crema', gray: 'Gris', marron: 'Marron',
}

const STAMP_INTENT_RE = /estampa|stampe|ponel[oae]?|aplica|aplicalo|mockup|pone[mr]?lo|ubicalo|coloca/i

// Mantener sincronizado con ALL_GARMENT_PRICING (lib/partners/garment-pricing.ts).
// Las keys deben matchear exactamente para que getPartnerPlanPrice() resuelva el costo.
const GARMENT_OPTIONS: { key: string; label: string }[] = [
  { key: 'aldea-classic-tshirt', label: 'Remera Aldea Classic Fit' },
  { key: 'aura-oversize-tshirt', label: 'Remera Aura Oversize' },
  { key: 'remera-clasica-mujer', label: 'Remera Clasica Mujer' },
  { key: 'remera-crop-mujer', label: 'Remera Crop Mujer' },
  { key: 'musculosa-bali', label: 'Musculosa Bali' },
  { key: 'buzo-cuello-redondo', label: 'Buzo Cuello Redondo' },
  { key: 'buzo-hoodie-unisex', label: 'Buzo Hoodie Oversize' },
  { key: 'lienzo', label: 'Lienzo (Arte)' },
]

// Garment thumbnail mapping (key → front image path)
// Mapping de garment_key → color → ruta de thumbnail. Sincronizado con los
// archivos reales en /public/garments/. Mantener consistente con los colores
// disponibles en cada producto del catalogo Novamente.
const GARMENT_THUMBNAILS: Record<string, Record<string, string>> = {
  'aldea-classic-tshirt': {
    black: '/garments/tshirt-black-classic-front.jpeg',
    white: '/garments/tshirt-white-classic-front.jpeg',
  },
  'aura-oversize-tshirt': {
    black: '/garments/tshirt-black-oversize-front.jpeg',
    white: '/garments/tshirt-white-oversize-front.jpeg',
    caramel: '/garments/tshirt-caramel-oversize-front.png',
  },
  'remera-clasica-mujer': {
    black: '/garments/remera-clasica-mujer-black-front.png',
    white: '/garments/remera-clasica-mujer-white-front.png',
  },
  'remera-crop-mujer': {
    black: '/garments/remera-crop-mujer-black-front.png',
    chocolate: '/garments/remera-crop-mujer-chocolate-front.png',
    gray: '/garments/remera-crop-mujer-gray-front.png',
    yellow: '/garments/remera-crop-mujer-yellow-front.png',
  },
  'musculosa-bali': {
    black: '/garments/musculosa-bali-black-front.png',
    white: '/garments/musculosa-bali-white-front.png',
    gray: '/garments/musculosa-bali-gray-front.png',
  },
  'buzo-cuello-redondo': {
    black: '/garments/buzo-cuello-redondo-black-front.png',
    white: '/garments/buzo-cuello-redondo-white-front.png',
    'stone-wash': '/garments/buzo-cuello-redondo-stone-wash-front.png',
  },
  'buzo-hoodie-unisex': {
    black: '/garments/buzo-hoodie-unisex-black-front.png',
    white: '/garments/buzo-hoodie-unisex-white-front.png',
    cream: '/garments/buzo-hoodie-unisex-crema-front.jpeg',
    gray: '/garments/buzo-hoodie-unisex-gris-front.jpeg',
    marron: '/garments/buzo-hoodie-unisex-marron-front.jpeg',
    'stone-wash': '/garments/buzo-hoodie-unisex-stone-wash-front.png',
  },
  lienzo: {
    white: '/garments/lienzo-main.png',
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DesignStudioPage() {
  // Config/access state
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState('')
  const [styles, setStyles] = useState<StyleOption[]>([])
  const [garments, setGarments] = useState<GarmentOption[]>([])
  const [accessAllowed, setAccessAllowed] = useState(false)
  const [accessReason, setAccessReason] = useState('')

  // Chat state
  const [session, setSession] = useState<StudioSession>(() => createStudioSession())
  const [remoteSessionId, setRemoteSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  // UI state
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedGarment, setSelectedGarment] = useState(GARMENT_OPTIONS[0].key)
  const [selectedColor, setSelectedColor] = useState('black')
  const [selectedSide, setSelectedSide] = useState<'front' | 'back'>('front')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [styleModalOpen, setStyleModalOpen] = useState(false)
  const [useBrandEssence, setUseBrandEssence] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Usage
  const [usage, setUsage] = useState<UsageInfo | null>(null)

  // Right panel
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [showPricingTable, setShowPricingTable] = useState(false)

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // Publish dialog
  const [publishUrl, setPublishUrl] = useState<string | null>(null)
  const [publishSlot, setPublishSlot] = useState<'hero' | 'banner'>('hero')
  const [publishing, setPublishing] = useState(false)

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ---------------------------------------------------------------------------
  // Load config + sessions + usage
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function init() {
      try {
        const res = await authFetch('/api/partners/design/config')
        if (!res.ok) throw new Error('Error cargando configuracion')
        const data = await res.json()
        setAccessAllowed(data.access?.allowed ?? false)
        setAccessReason(data.access?.reason || '')
        setPlan(data.plan || '')
        setStyles(data.styles || [])
        setGarments(data.garments || [])
        if (data.styles?.length > 0) setSelectedStyle(data.styles[0].key)
        if (data.garments?.length > 0) setSelectedGarment(data.garments[0].key)
        else setSelectedGarment(GARMENT_OPTIONS[0].key)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    async function loadSessions() {
      setLoadingSessions(true)
      try {
        const remote = await fetchStudioSessions()
        setSessions(remote)
        if (remote.length > 0) {
          const latest = remote[0]
          setRemoteSessionId(latest.id)
          const msgs = await fetchSessionMessages(latest.id)
          if (msgs.length > 0) {
            setSession({
              id: latest.id,
              messages: msgs,
              createdAt: new Date(latest.createdAt).getTime(),
              updatedAt: new Date(latest.updatedAt).getTime(),
              title: latest.title || undefined,
            })
          }
        }
      } catch {}
      setLoadingSessions(false)
    }
    loadSessions()
  }, [])

  useEffect(() => {
    fetchUsageStats().then((u) => { if (u) setUsage(u) }).catch(() => {})
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session.messages])

  // ---------------------------------------------------------------------------
  // Session management
  // ---------------------------------------------------------------------------

  const ensureRemoteSession = useCallback(async (): Promise<string | null> => {
    if (remoteSessionId) return remoteSessionId
    try {
      const created = await createRemoteSession(undefined, selectedStyle, selectedGarment)
      setRemoteSessionId(created.id)
      setSession(prev => ({ ...prev, id: created.id }))
      return created.id
    } catch {
      return null
    }
  }, [remoteSessionId, selectedStyle, selectedGarment])

  const handleNewConversation = async () => {
    const newSess = createStudioSession()
    setSession(newSess)
    setRemoteSessionId(null)
    setPrompt('')
    try {
      const updated = await fetchStudioSessions()
      setSessions(updated)
    } catch {}
  }

  const handleSelectSession = async (id: string) => {
    if (id === remoteSessionId) return
    setRemoteSessionId(id)
    const summary = sessions.find(s => s.id === id)
    try {
      const msgs = await fetchSessionMessages(id)
      setSession({
        id,
        messages: msgs,
        createdAt: summary ? new Date(summary.createdAt).getTime() : Date.now(),
        updatedAt: summary ? new Date(summary.updatedAt).getTime() : Date.now(),
        title: summary?.title || undefined,
      })
    } catch {}
    setSidebarOpen(false)
  }

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteStudioSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (id === remoteSessionId) handleNewConversation()
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // Generate design / mockup
  // ---------------------------------------------------------------------------

  const updateMessages = useCallback(
    (updater: (msgs: StudioMessage[]) => StudioMessage[]) => {
      setSession(prev => ({
        ...prev,
        messages: updater(prev.messages),
        updatedAt: Date.now(),
        title: prev.title || prompt.trim().slice(0, 40),
      }))
    },
    [prompt],
  )

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return

    const currentPrompt = prompt.trim()
    const sessionId = await ensureRemoteSession()

    // User message
    const userMsg = createStudioMessage('user', currentPrompt)
    const placeholderId = crypto.randomUUID()
    const placeholder: StudioMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      type: 'design',
      isLoading: true,
      timestamp: Date.now(),
    }

    updateMessages(msgs => [...msgs, userMsg, placeholder])
    setGenerating(true)
    setPrompt('')
    setError(null)

    // Save user message remotely (fire-and-forget)
    if (sessionId) saveStudioMessage(sessionId, userMsg).catch(() => {})

    try {
      const res = await authFetch('/api/partners/design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          style: selectedStyle || undefined,
          garmentColor: selectedColor,
          garmentType: selectedGarment,
          sessionId,
          useBrandEssence,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)

      const assistantMsg: StudioMessage = {
        id: placeholderId,
        role: 'assistant',
        content: '',
        type: 'design',
        isLoading: false,
        imageUrl: data.imageUrl,
        timestamp: Date.now(),
        styleApplied: selectedStyle,
      }

      updateMessages(msgs => msgs.map(m => m.id === placeholderId ? assistantMsg : m))

      // Save assistant message + update usage
      if (sessionId) saveStudioMessage(sessionId, assistantMsg).catch(() => {})
      if (data.usage) setUsage({ ...data.usage, percentUsed: Math.round((data.usage.used / data.usage.limit) * 100) })
    } catch (err: any) {
      updateMessages(msgs =>
        msgs.map(m => m.id === placeholderId ? { ...m, isLoading: false, error: err.message } : m)
      )
    } finally {
      setGenerating(false)
    }
  }

  const handleMockup = async (designImageUrl: string) => {
    const sessionId = await ensureRemoteSession()
    const sysMsg = createStudioMessage('system', `Mockup: ${selectedGarment} · ${selectedColor} · ${selectedSide}`)
    const placeholderId = crypto.randomUUID()
    const placeholder: StudioMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      type: 'mockup',
      isLoading: true,
      timestamp: Date.now(),
    }

    updateMessages(msgs => [...msgs, sysMsg, placeholder])
    if (sessionId) saveStudioMessage(sessionId, sysMsg).catch(() => {})

    try {
      const res = await authFetch('/api/partners/design/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designImageUrl,
          garmentType: selectedGarment,
          garmentColor: selectedColor,
          side: selectedSide,
          sessionId,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)

      const assistantMsg: StudioMessage = {
        id: placeholderId,
        role: 'assistant',
        content: '',
        type: 'mockup',
        isLoading: false,
        imageUrl: data.mockupUrl,
        timestamp: Date.now(),
        garmentKey: selectedGarment,
      }

      updateMessages(msgs => msgs.map(m => m.id === placeholderId ? assistantMsg : m))
      if (sessionId) saveStudioMessage(sessionId, assistantMsg).catch(() => {})
      if (data.usage) setUsage({ ...data.usage, percentUsed: Math.round((data.usage.used / data.usage.limit) * 100) })
    } catch (err: any) {
      updateMessages(msgs =>
        msgs.map(m => m.id === placeholderId ? { ...m, isLoading: false, error: err.message } : m)
      )
    }
  }

  // ---------------------------------------------------------------------------
  // Publish to storefront
  // ---------------------------------------------------------------------------

  const handlePublish = async () => {
    if (!publishUrl) return
    setPublishing(true)
    try {
      const res = await authFetch('/api/partners/design/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetUrl: publishUrl, slot: publishSlot }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPublishUrl(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setPublishing(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Download
  // ---------------------------------------------------------------------------

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = `novamente-design-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  // ---------------------------------------------------------------------------
  // Key handler for input
  // ---------------------------------------------------------------------------

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  if (!accessAllowed) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
        <Sparkles className="h-12 w-12 text-violet-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Studio de Diseño</h2>
        <p className="text-zinc-400 mb-4">{accessReason || 'Actualiza tu plan para acceder al Studio.'}</p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ---- Sidebar ---- */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-zinc-900/95 backdrop-blur border-r border-zinc-800
        transform transition-transform duration-200
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h3 className="font-semibold text-sm text-zinc-300">Sesiones</h3>
            <div className="flex gap-2">
              <button onClick={handleNewConversation} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Nueva sesion">
                <Plus className="h-4 w-4" />
              </button>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 lg:hidden">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingSessions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-zinc-500 text-xs text-center py-8">Sin sesiones aún</p>
            ) : (
              sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors group flex items-start gap-2 ${
                    s.id === remoteSessionId ? 'bg-violet-600/20 text-violet-300' : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {s.lastImageUrl ? (
                    <img src={s.lastImageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0 mt-0.5" />
                  ) : (
                    <Sparkles className="h-4 w-4 flex-shrink-0 mt-1 opacity-40" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{s.title || 'Sin título'}</p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(s.updatedAt)}
                      {s.messageCount > 0 && <span>· {s.messageCount} msgs</span>}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id) }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ---- Main chat area ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <Sparkles className="h-5 w-5 text-violet-400" />
          <h2 className="font-semibold text-sm">Studio de Diseño</h2>
          <span className="text-xs text-zinc-500 uppercase">{plan}</span>

          {/* Usage meter */}
          {usage && (
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usage.percentUsed > 85 ? 'bg-red-500' : usage.percentUsed > 60 ? 'bg-yellow-500' : 'bg-violet-500'
                    }`}
                    style={{ width: `${Math.min(100, usage.percentUsed)}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400">
                  {usage.used}/{usage.limit} {usage.resetLabel}
                </span>
              </div>
            </div>
          )}

          {/* Brand Essence Toggle */}
          <button
            onClick={() => setUseBrandEssence(!useBrandEssence)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
              useBrandEssence ? 'bg-violet-600/20 text-violet-300 border border-violet-600/30' : 'bg-zinc-800 text-zinc-500'
            }`}
            title="Activar/desactivar esencia de marca"
          >
            <Palette className="h-3 w-3" />
            Esencia
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {session.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-300 mb-2">Bienvenido al Studio</h3>
              <p className="text-zinc-500 text-sm max-w-md">
                Describí lo que querés diseñar y la IA va a generar estampas únicas para tu marca.
                Después podés crear mockups sobre las prendas base y publicarlos en tu tienda.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {['Logo minimalista', 'Ilustracion botanica', 'Diseño cyberpunk', 'Pattern geometrico'].map(ex => (
                  <button
                    key={ex}
                    onClick={() => setPrompt(ex)}
                    className="px-3 py-1.5 rounded-full border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-violet-500 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            session.messages.map(msg => (
              <ChatBubble
                key={msg.id}
                msg={msg}
                onZoom={(url) => setLightboxUrl(url)}
                onMockup={(url) => handleMockup(url)}
                onDownload={(url) => handleDownload(url)}
                onPublish={(url) => { setPublishUrl(url); setPublishSlot('hero') }}
              />
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Compact controls bar: style + side */}
        <div className="flex items-center gap-2 px-4 py-2 border-t border-zinc-800/50 bg-zinc-900/30 overflow-x-auto">
          {/* Style selector */}
          <button
            onClick={() => setStyleModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors whitespace-nowrap"
          >
            <Sparkles className="h-3 w-3 text-violet-400" />
            {styles.find(s => s.key === selectedStyle)?.name || 'Estilo'}
          </button>

          {/* Current garment indicator (click opens right panel on mobile) */}
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors whitespace-nowrap lg:hidden"
          >
            <Shirt className="h-3 w-3" />
            {garments.find(g => g.key === selectedGarment)?.name || 'Prenda'}
            <ChevronRight className={`h-3 w-3 transition-transform ${rightPanelOpen ? 'rotate-90' : ''}`} />
          </button>

          {/* Side toggle */}
          <div className="flex items-center bg-zinc-800 rounded-lg overflow-hidden text-xs">
            <button
              onClick={() => setSelectedSide('front')}
              className={`px-2.5 py-1.5 ${selectedSide === 'front' ? 'bg-violet-600 text-white' : 'text-zinc-400'}`}
            >
              Frente
            </button>
            <button
              onClick={() => setSelectedSide('back')}
              className={`px-2.5 py-1.5 ${selectedSide === 'back' ? 'bg-violet-600 text-white' : 'text-zinc-400'}`}
            >
              Espalda
            </button>
          </div>

          <div className="ml-auto" />

          {/* Selected garment price badge */}
          {selectedGarment && GARMENT_PRICING[selectedGarment] && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md whitespace-nowrap">
              Costo: {formatGarmentPrice(GARMENT_PRICING[selectedGarment].on_demand)}
            </span>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          {error && (
            <div className="mb-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
              <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-300">✕</button>
            </div>
          )}
          {/* Garment selector */}
          <div className="mb-2 flex items-center gap-2">
            <Shirt className="h-4 w-4 text-zinc-500 flex-shrink-0" />
            <select
              value={selectedGarment}
              onChange={e => setSelectedGarment(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer"
            >
              {GARMENT_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key} className="bg-zinc-950 text-zinc-100">
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Garment thumbnail preview */}
            {(() => {
              const thumbUrl = GARMENT_THUMBNAILS[selectedGarment]?.[selectedColor]
                ?? Object.values(GARMENT_THUMBNAILS[selectedGarment] ?? {})[0]
              return thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={selectedGarment}
                  className="h-10 w-10 rounded-lg object-cover border border-zinc-700 flex-shrink-0"
                />
              ) : null
            })()}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describí tu diseño... (ej: dragon japones en estilo acuarela)"
              rows={1}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 min-h-[44px] max-h-[120px]"
              style={{ height: 'auto', overflow: 'hidden' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              className="p-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ---- Right Panel: Garments + Pricing ---- */}
      <div className={`
        fixed inset-y-0 right-0 z-40 w-80 bg-zinc-900/95 backdrop-blur border-l border-zinc-800
        transform transition-transform duration-200
        lg:relative lg:translate-x-0
        ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Panel header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h3 className="font-semibold text-sm text-zinc-300 flex items-center gap-2">
              <Shirt className="h-4 w-4 text-violet-400" />
              Prendas Base
            </h3>
            <button onClick={() => setRightPanelOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 lg:hidden">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Garment cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {garments.map(g => {
              const pricing = GARMENT_PRICING[g.key]
              const isSelected = selectedGarment === g.key
              const thumbKey = Object.keys(GARMENT_THUMBNAILS[g.key] || {})[0] || 'black'
              const thumbUrl = GARMENT_THUMBNAILS[g.key]?.[selectedColor] || GARMENT_THUMBNAILS[g.key]?.[thumbKey]

              return (
                <button
                  key={g.key}
                  onClick={() => {
                    setSelectedGarment(g.key)
                    // Reset color if not available for this garment
                    if (!g.colors.includes(selectedColor)) {
                      setSelectedColor(g.colors[0] || 'black')
                    }
                  }}
                  className={`w-full text-left rounded-xl border transition-all ${
                    isSelected
                      ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/5'
                      : 'border-zinc-800 hover:border-zinc-600 bg-zinc-800/30'
                  }`}
                >
                  <div className="flex gap-3 p-3">
                    {/* Thumbnail */}
                    {thumbUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                        <img src={thumbUrl} alt={g.name} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-violet-300' : 'text-zinc-200'}`}>
                        {g.name}
                      </p>

                      {/* Price */}
                      {pricing && (
                        <p className="text-sm font-semibold text-emerald-400 mt-0.5">
                          {formatGarmentPrice(pricing.on_demand)}
                        </p>
                      )}

                      {/* Color dots */}
                      <div className="flex items-center gap-1 mt-1.5">
                        {g.colors.map(c => (
                          <button
                            key={c}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedGarment(g.key)
                              setSelectedColor(c)
                            }}
                            className={`w-4 h-4 rounded-full border transition-all ${
                              isSelected && selectedColor === c
                                ? 'border-violet-500 scale-110 ring-1 ring-violet-500/50'
                                : 'border-zinc-600'
                            }`}
                            style={{ backgroundColor: COLOR_MAP[c] || c }}
                            title={COLOR_LABELS[c] || c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}

            {/* Tier progression card */}
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
              <button
                onClick={() => setShowPricingTable(!showPricingTable)}
                className="w-full flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-zinc-300 font-medium">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Precios por volumen
                </span>
                <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${showPricingTable ? 'rotate-180' : ''}`} />
              </button>

              {/* Current tier info */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs bg-violet-600/20 text-violet-300 px-2 py-0.5 rounded-full">
                  On Demand
                </span>
                <span className="text-xs text-zinc-500">Tu tier actual</span>
              </div>

              <p className="text-xs text-zinc-500 mt-2 flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Vendé más y desbloqueá precios más bajos automáticamente.
              </p>

              {/* Expandable pricing table */}
              {showPricingTable && (
                <div className="mt-3 space-y-3">
                  {/* Tier thresholds */}
                  <div className="space-y-1">
                    {TIER_THRESHOLDS.map((t, i) => (
                      <div key={t.tier} className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg ${
                        i === 0 ? 'bg-violet-600/10 text-violet-300' : 'text-zinc-400'
                      }`}>
                        <span className="font-medium">{t.label}</span>
                        <span>{t.minUnits === 0 ? 'Base' : `${t.minUnits}+ uds/mes`}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price table per garment */}
                  <div className="border-t border-zinc-700 pt-3">
                    <p className="text-xs font-medium text-zinc-400 mb-2">Precios por prenda</p>
                    <div className="space-y-2">
                      {Object.values(GARMENT_PRICING).map(gp => (
                        <div key={gp.key} className="text-xs">
                          <p className="text-zinc-300 font-medium mb-1">{gp.name}</p>
                          <div className="grid grid-cols-4 gap-1">
                            <span className="text-violet-300">{formatGarmentPrice(gp.on_demand)}</span>
                            <span className="text-zinc-400">{formatGarmentPrice(gp.b2b_starter)}</span>
                            <span className="text-zinc-400">{formatGarmentPrice(gp.b2b_pro)}</span>
                            <span className="text-emerald-400">{formatGarmentPrice(gp.b2b_drop)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-1 mt-2 text-[10px] text-zinc-600">
                      <span>On Demand</span>
                      <span>Starter</span>
                      <span>Pro</span>
                      <span>Drop</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* B2C suggested price hint */}
            {selectedGarment && GARMENT_PRICING[selectedGarment] && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
                <p className="text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">Precio sugerido de venta:</span>{' '}
                  {formatGarmentPrice(GARMENT_PRICING[selectedGarment].b2c_suggested)}
                </p>
                <p className="text-[10px] text-zinc-600 mt-1">
                  Margen estimado: {formatGarmentPrice(
                    GARMENT_PRICING[selectedGarment].b2c_suggested - GARMENT_PRICING[selectedGarment].on_demand
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel overlay (mobile) */}
      {rightPanelOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setRightPanelOpen(false)} />
      )}

      {/* ---- Style Modal ---- */}
      {styleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="font-semibold">Elegí un estilo</h3>
              <button onClick={() => setStyleModalOpen(false)} className="p-1 rounded-lg hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {styles.map(s => (
                  <button
                    key={s.key}
                    onClick={() => { setSelectedStyle(s.key); setStyleModalOpen(false) }}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      selectedStyle === s.key
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
                    }`}
                  >
                    <p className="font-medium text-sm mb-1">{s.name}</p>
                    <p className="text-xs text-zinc-500 line-clamp-2">{s.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Lightbox ---- */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Design" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            <button onClick={() => setLightboxUrl(null)} className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* ---- Publish Dialog ---- */}
      {publishUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="font-semibold mb-4">Publicar en tu tienda</h3>
            <img src={publishUrl} alt="Preview" className="w-full h-48 object-contain bg-zinc-800 rounded-lg mb-4" />
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 cursor-pointer hover:border-violet-500 transition-colors">
                <input type="radio" name="slot" value="hero" checked={publishSlot === 'hero'} onChange={() => setPublishSlot('hero')} className="accent-violet-500" />
                <div>
                  <p className="text-sm font-medium">Hero Image</p>
                  <p className="text-xs text-zinc-500">Imagen principal de tu tienda</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 cursor-pointer hover:border-violet-500 transition-colors">
                <input type="radio" name="slot" value="banner" checked={publishSlot === 'banner'} onChange={() => setPublishSlot('banner')} className="accent-violet-500" />
                <div>
                  <p className="text-sm font-medium">Banner</p>
                  <p className="text-xs text-zinc-500">Banner superior de tu tienda</p>
                </div>
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPublishUrl(null)} className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-sm hover:bg-zinc-800 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {publishing ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ---------------------------------------------------------------------------
// ChatBubble component
// ---------------------------------------------------------------------------

function ChatBubble({
  msg,
  onZoom,
  onMockup,
  onDownload,
  onPublish,
}: {
  msg: StudioMessage
  onZoom: (url: string) => void
  onMockup: (url: string) => void
  onDownload: (url: string) => void
  onPublish: (url: string) => void
}) {
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-zinc-500 bg-zinc-800/50 px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </div>
    )
  }

  const isUser = msg.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] sm:max-w-[70%] ${isUser ? '' : ''}`}>
        {/* Text content */}
        {msg.content && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm ${
            isUser
              ? 'bg-violet-600 text-white rounded-br-md'
              : 'bg-zinc-800 text-zinc-200 rounded-bl-md'
          }`}>
            {msg.content}
          </div>
        )}

        {/* Loading state */}
        {msg.isLoading && (
          <div className="flex items-center gap-2 bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3 mt-1">
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
            <span className="text-sm text-zinc-400">
              {msg.type === 'mockup' ? 'Generando mockup...' : 'Generando diseño...'}
            </span>
          </div>
        )}

        {/* Error state */}
        {msg.error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mt-1">
            {msg.error}
          </div>
        )}

        {/* Image */}
        {msg.imageUrl && !msg.isLoading && (
          <div className="mt-1 group relative">
            <img
              src={msg.imageUrl}
              alt={msg.type === 'mockup' ? 'Mockup' : 'Design'}
              className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onZoom(msg.imageUrl!)}
            />
            {/* Action buttons */}
            <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onZoom(msg.imageUrl!)}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs"
                title="Ampliar"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDownload(msg.imageUrl!)}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs"
                title="Descargar"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              {msg.type === 'design' && (
                <button
                  onClick={() => onMockup(msg.imageUrl!)}
                  className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs"
                  title="Crear mockup"
                >
                  <Shirt className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => onPublish(msg.imageUrl!)}
                className="p-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-500 text-white text-xs"
                title="Publicar en tienda"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Moderation blocked */}
        {msg.moderationStatus === 'blocked' && (
          <div className="text-xs text-orange-400 mt-1">⚠️ Contenido bloqueado por moderación</div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}sem`
}
