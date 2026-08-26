'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Sparkles, Loader2, ImageIcon, Shirt, X, ZoomIn, Send, Plus, Menu, Trash2,
  Download, ArrowUp, Clock, Palette, ChevronDown, Upload as UploadIcon, ExternalLink,
  ChevronRight, TrendingUp, Info, Pin, Check,
} from 'lucide-react'
import { authFetch } from '@/lib/partners/auth-fetch'
import { QuickDesignUpload } from '@/components/workspace/QuickDesignUpload'
import type { StudioMessage, StudioSession, UsageInfo } from '@/lib/partners/studio/types'
import { createStudioMessage, createStudioSession } from '@/lib/partners/studio/types'
import {
  TIER_THRESHOLDS,
  getTierLabel,
  getNextTier,
} from '@/lib/partners/garment-pricing'
import { formatPrice as formatGarmentPrice } from '@/lib/partners/format-price'
import type { PublicGarmentPricing } from '@/lib/partners/garment-pricing.server'
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
// Anti-413 (25/08, caso Pablo/Origen): Vercel corta cualquier request >4.5MB
// con "Request Entity Too Large" en TEXTO PLANO — res.json() explotaba con
// `Unexpected token 'R'...` y el partner veía ese jeroglífico. Dos capas:
// comprimir la imagen en el navegador ANTES de subir (una foto de celular de
// 8MB entra sobrada resizada a 2048px), y si el server igual responde no-JSON,
// traducirlo a un error humano.
// ---------------------------------------------------------------------------

const MAX_UPLOAD_BYTES = 3_000_000
const MAX_IMAGE_SIDE = 2048

async function parseApiResponse(res: Response): Promise<any> {
  const raw = await res.text()
  try { return JSON.parse(raw) } catch {
    if (res.status === 413) {
      throw new Error('La imagen es muy pesada para subir 😅 Probá con una versión más liviana (ideal menos de 3 MB).')
    }
    throw new Error(`El servidor respondió con un error (${res.status}). Probá de nuevo en un momento.`)
  }
}

async function compressImageIfNeeded(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES || !file.type.startsWith('image/')) return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bmp.width * scale))
    canvas.height = Math.max(1, Math.round(bmp.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const isPng = file.type === 'image/png'
    // PNG se re-exporta PNG (preserva transparencia, clave en diseños).
    let out: Blob | null = await new Promise(r => canvas.toBlob(r, isPng ? 'image/png' : 'image/jpeg', 0.85))
    if (!out) return file
    // Un PNG fotográfico que ni resizado baja de 3MB casi nunca usa alpha:
    // último recurso JPEG antes de dejar que el server lo rebote.
    if (out.size > MAX_UPLOAD_BYTES && isPng) {
      const jpeg: Blob | null = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.85))
      if (jpeg && jpeg.size < out.size) out = jpeg
    }
    if (out.size >= file.size) return file
    const ext = out.type === 'image/png' ? '.png' : '.jpg'
    return new File([out], file.name.replace(/\.[a-z0-9]+$/i, '') + ext, { type: out.type })
  } catch {
    return file // fail-open: mejor intentar subir el original que bloquear
  }
}

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
// Catalogo + colores (todo derivado de lib/catalog/products.ts)
// ---------------------------------------------------------------------------

import { CATALOG_PRODUCTS } from '@/lib/catalog/products'

const STAMP_INTENT_RE = /estampa|stampe|ponel[oae]?|aplica|aplicalo|mockup|pone[mr]?lo|ubicalo|coloca/i

const GARMENT_OPTIONS: { key: string; label: string }[] = CATALOG_PRODUCTS.map(p => ({
  key: p.key,
  label: p.name,
}))

// Color hex y nombres en español — derivados del catalog (cada producto tiene
// sus colores con hex y name definidos). Cubre TODOS los colores reales.
const COLOR_MAP: Record<string, string> = {}
const COLOR_LABELS: Record<string, string> = {}
for (const p of CATALOG_PRODUCTS) {
  for (const c of p.colors) {
    if (!COLOR_MAP[c.key]) COLOR_MAP[c.key] = c.hex
    if (!COLOR_LABELS[c.key]) COLOR_LABELS[c.key] = c.name
  }
}

// Garment thumbnail mapping (key → color → ruta de imagen). Derivado del
// catalog — cada color tiene su thumbnail propio en /public/garments/.
const GARMENT_THUMBNAILS: Record<string, Record<string, string>> = Object.fromEntries(
  CATALOG_PRODUCTS.map(p => [
    p.key,
    Object.fromEntries(p.colors.filter(c => c.thumbnail).map(c => [c.key, c.thumbnail!])),
  ]),
)

// ---------------------------------------------------------------------------
// Placement options per stamp mode + side
// ---------------------------------------------------------------------------

interface PlacementOption { key: string; label: string; hint: string }

function getPlacementOptions(
  mode: 'large' | 'medium' | 'chest-logo',
  side: 'front' | 'back'
): PlacementOption[] {
  if (mode === 'chest-logo' && side === 'front') {
    return [
      { key: 'left-chest',  label: 'Sobre el corazón',  hint: 'Logo pequeño en el pecho izquierdo (~10×10 cm)' },
      { key: 'right-chest', label: 'Pecho derecho',     hint: 'Logo pequeño en el lado derecho del pecho, espejado al corazón' },
      { key: 'center-high', label: 'Centro alto',       hint: 'Logo centrado a la altura del esternón' },
      { key: 'pocket',      label: 'Sobre el bolsillo', hint: 'Si la prenda tiene bolsillo, aplicalo encima (si no, fallback a pecho izquierdo)' },
      { key: 'hem-left',    label: 'Dobladillo izq.',   hint: 'Detalle chico en la base de la prenda, lado izquierdo' },
      { key: 'hem-right',   label: 'Dobladillo der.',   hint: 'Detalle chico en la base de la prenda, lado derecho' },
    ]
  }
  if (mode === 'chest-logo' && side === 'back') {
    return [
      { key: 'upper-center', label: 'Nuca / cuello',   hint: 'Logo pequeño centrado debajo del cuello' },
      { key: 'upper-left',   label: 'Hombro izq.',     hint: 'Logo chico cerca del hombro izquierdo' },
      { key: 'upper-right',  label: 'Hombro der.',     hint: 'Logo chico cerca del hombro derecho' },
      { key: 'center-high',  label: 'Centro alto',     hint: 'Logo centrado en la zona alta de la espalda' },
      { key: 'hem-center',   label: 'Dobladillo',      hint: 'Detalle chico centrado en la base de la espalda' },
    ]
  }
  if (mode === 'medium' && side === 'front') {
    return [
      { key: 'center',      label: 'Centro',       hint: 'Estampa mediana (~20×25 cm) centrada en el pecho' },
      { key: 'center-high', label: 'Centro alto',  hint: 'Estampa mediana anclada hacia arriba (zona pectoral)' },
      { key: 'chest-wide',  label: 'Pecho amplio', hint: 'Estampa mediana ocupando el ancho del pecho, de hombro a hombro' },
    ]
  }
  if (mode === 'medium' && side === 'back') {
    return [
      { key: 'center',          label: 'Centro',           hint: 'Estampa mediana (~20×25 cm) centrada en la espalda' },
      { key: 'center-high',     label: 'Centro alto',      hint: 'Estampa mediana anclada hacia arriba, debajo del cuello' },
      { key: 'shoulder-blades', label: 'Entre omóplatos',  hint: 'Centrada en la zona alta de la espalda, entre los omóplatos' },
    ]
  }
  // large — ocupa casi toda el área imprimible (35×40 cm), una sola opción
  return [
    { key: 'center', label: 'Centro (35×40 cm)', hint: 'Estampa grande que ocupa casi toda el área imprimible disponible' },
  ]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DesignStudioPage() {
  // Studio mode: 'ai' = generate with AI, 'upload' = upload your own design
  // Nota: cuando se llega con ?uploadedDesignUrl=, el diseño se inyecta como
  // mensaje del chat (ver efecto más abajo) y se muestra la tab 'ai' — no la
  // de upload, que llevaba a un callejón sin salida (el diseño nunca entraba
  // al chat y el botón "Aplicar a mockup" no tenía nada sobre qué actuar).
  const [studioMode, setStudioMode] = useState<'ai' | 'upload'>('ai')

  // Config/access state
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState('')
  const [styles, setStyles] = useState<StyleOption[]>([])
  const [garments, setGarments] = useState<GarmentOption[]>([])
  // Pricing ya derivado por plan (sin `cost` crudo del proveedor) — servido por
  // GET /api/partners/design/config. Ver getAllPublicGarmentPricing.
  const [garmentPricing, setGarmentPricing] = useState<Record<string, PublicGarmentPricing>>({})
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
  const [selectedStampMode, setSelectedStampMode] = useState<'large' | 'medium' | 'chest-logo'>('large')
  const [selectedPlacement, setSelectedPlacement] = useState<string>('center')
  const [placementMenuOpen, setPlacementMenuOpen] = useState(false)
  const [placementMenuPos, setPlacementMenuPos] = useState<{ left: number; bottom: number } | null>(null)
  const placementBtnRef = useRef<HTMLButtonElement | null>(null)

  const openPlacementMenu = useCallback(() => {
    const rect = placementBtnRef.current?.getBoundingClientRect()
    if (rect) {
      const viewportH = typeof window !== 'undefined' ? window.innerHeight : 0
      setPlacementMenuPos({ left: rect.left, bottom: viewportH - rect.top + 6 })
    }
    setPlacementMenuOpen(true)
  }, [])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [styleModalOpen, setStyleModalOpen] = useState(false)
  // Default OFF: la "esencia de marca" influia demasiado en el prompt. El partner
  // la activa explicitamente si quiere que los disenos hereden su paleta/tono.
  const [useBrandEssence, setUseBrandEssence] = useState(false)
  // Última imagen subida por el partner en esta sesión — usable como referencia
  // para que "Generar con IA" haga VARIACIONES de su diseño en vez de ignorarlo.
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [useReference, setUseReference] = useState(false)
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

  // Add to catalog modal
  const [catalogModal, setCatalogModal] = useState<{
    imageUrl: string
    garmentKey?: string
    color?: string
    /** Si se setea, el producto se crea con 2 imagenes (frente + espalda) */
    backImageUrl?: string
  } | null>(null)
  const [catalogProductName, setCatalogProductName] = useState('')
  const [catalogProductPrice, setCatalogProductPrice] = useState('')
  const [catalogCreating, setCatalogCreating] = useState(false)
  const [catalogToast, setCatalogToast] = useState<string | null>(null)

  // Upload propio (logo / imagen ya creada)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Lados afianzados — para producto doble estampa frente + espalda
  // Cuando el partner afianza frente y espalda DE LA MISMA prenda+color, aparece
  // un panel "Producto doble estampa listo" que permite crear un producto con
  // las 2 imagenes (frente como principal, espalda como secundaria).
  interface PinnedSide {
    imageUrl: string
    garmentKey: string
    garmentColor: string
    side: 'front' | 'back'
    pinnedAt: number
  }
  const [pinnedFront, setPinnedFront] = useState<PinnedSide | null>(null)
  const [pinnedBack, setPinnedBack] = useState<PinnedSide | null>(null)
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
        setGarmentPricing(data.pricing || {})
        // No autoseleccionar estilo. Default "sin estilo" para que el prompt del
        // partner mande sin sesgos. Si quiere un estilo, lo abre del modal y elige.
        // (antes auto-seleccionaba el primero, lo que cambiaba el output sin que
        // el partner lo pidiera).
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

  // Reset placement to first valid option when stamp mode or side changes
  useEffect(() => {
    const opts = getPlacementOptions(selectedStampMode, selectedSide)
    if (!opts.some(o => o.key === selectedPlacement)) {
      setSelectedPlacement(opts[0]?.key || 'center')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStampMode, selectedSide])

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

  // ---------------------------------------------------------------------------
  // Inyectar diseño subido desde QuickDesignUpload (?uploadedDesignUrl=)
  // ---------------------------------------------------------------------------
  // El botón "Aplicar a mockup" del panel de subida navega acá con el diseño
  // en la URL. Antes ese query param solo decidía qué tab abrir al montar y
  // el diseño nunca entraba al chat (callejón sin salida). Lo inyectamos como
  // mensaje tipo "design" — mismo formato que produce el upload dentro del
  // chat (handleUploadDesign) — para que "Aplicar a prenda" aparezca sobre la
  // imagen. Esperamos a que loadingSessions termine para no perder la
  // inyección si la hidratación del historial remoto pisa el estado después,
  // y usamos un ref para no inyectar 2 veces (StrictMode / re-renders).
  // Solo aceptamos URLs https del storage propio (Supabase público del
  // proyecto): es lo único que devuelve /api/partners/upload. Sin este check,
  // un link armado con ?uploadedDesignUrl=<url-atacante> inyectaría una URL
  // arbitraria que después /api/partners/design/mockup fetchea server-side.
  const isTrustedDesignUrl = (raw: string): boolean => {
    try {
      const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname
      const parsed = new URL(raw)
      return !!supabaseHost && parsed.protocol === 'https:' && parsed.hostname === supabaseHost
    } catch {
      return false
    }
  }

  const uploadedDesignHandledRef = useRef(false)
  useEffect(() => {
    if (loadingSessions) return
    if (uploadedDesignHandledRef.current) return
    if (typeof window === 'undefined') return

    const sp = new URLSearchParams(window.location.search)
    const uploadedUrl = sp.get('uploadedDesignUrl')
    if (!uploadedUrl) return

    uploadedDesignHandledRef.current = true

    if (!isTrustedDesignUrl(uploadedUrl)) {
      // URL ajena al storage propio: se descarta y se limpia el param igual
      const url = new URL(window.location.href)
      url.searchParams.delete('uploadedDesignUrl')
      window.history.replaceState({}, '', url.pathname + url.search + url.hash)
      return
    }

    ;(async () => {
      const sessionId = await ensureRemoteSession()
      const assistantMsg = createStudioMessage(
        'assistant',
        'Diseño subido. Click en la imagen → ícono remera para aplicarlo a una prenda, o escribí abajo qué querés cambiarle y generá una variación con IA.',
        { type: 'design', imageUrl: uploadedUrl, isLoading: false, source: 'upload' },
      )
      updateMessages(msgs => [...msgs, assistantMsg])
      if (sessionId) saveStudioMessage(sessionId, assistantMsg).catch(() => {})
      setReferenceImage(uploadedUrl)
      setUseReference(true)

      // Limpiar el query param para no re-inyectar en refresh/navegación
      const url = new URL(window.location.href)
      url.searchParams.delete('uploadedDesignUrl')
      window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingSessions])

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
          attachedImageUrl: useReference && referenceImage ? referenceImage : undefined,
        }),
      })

      const data = await parseApiResponse(res)
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)

      const assistantMsg: StudioMessage = {
        id: placeholderId,
        role: 'assistant',
        content: '',
        type: 'design',
        isLoading: false,
        imageUrl: data.imageUrl,
        source: 'ai',
        timestamp: Date.now(),
        styleApplied: selectedStyle,
      }

      updateMessages(msgs => msgs.map(m => m.id === placeholderId ? assistantMsg : m))

      // Save assistant message + update usage
      if (sessionId) saveStudioMessage(sessionId, assistantMsg).catch(() => {})
      if (data.usage) setUsage({ ...data.usage, percentUsed: data.usage.unlimited ? 0 : Math.round((data.usage.used / data.usage.limit) * 100) })
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
          stampMode: selectedStampMode,
          placement: selectedPlacement,
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
        garmentColor: selectedColor,
        side: selectedSide,
      }

      updateMessages(msgs => msgs.map(m => m.id === placeholderId ? assistantMsg : m))
      if (sessionId) saveStudioMessage(sessionId, assistantMsg).catch(() => {})
      if (data.usage) setUsage({ ...data.usage, percentUsed: data.usage.unlimited ? 0 : Math.round((data.usage.used / data.usage.limit) * 100) })
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
  // Upload custom image / logo del partner
  // ---------------------------------------------------------------------------

  const handleUploadDesign = async (file: File) => {
    if (uploading) return
    setUploading(true)
    setError(null)
    const sessionId = await ensureRemoteSession()

    // Placeholder mientras sube
    const sysMsg = createStudioMessage('system', `Subiendo: ${file.name}`)
    const placeholderId = crypto.randomUUID()
    const placeholder: StudioMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      type: 'design',
      isLoading: true,
      timestamp: Date.now(),
    }
    updateMessages(msgs => [...msgs, sysMsg, placeholder])
    if (sessionId) saveStudioMessage(sessionId, sysMsg).catch(() => {})

    try {
      const fd = new FormData()
      fd.append('file', await compressImageIfNeeded(file))
      const res = await authFetch('/api/partners/design/upload', { method: 'POST', body: fd })
      const data = await parseApiResponse(res)
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)

      const assistantMsg: StudioMessage = {
        id: placeholderId,
        role: 'assistant',
        content: 'Diseño subido. Click en la imagen → ícono remera para aplicarlo a una prenda, o escribí abajo qué querés cambiarle y generá una variación con IA.',
        type: 'design',
        isLoading: false,
        imageUrl: data.url,
        source: 'upload',
        timestamp: Date.now(),
      }
      updateMessages(msgs => msgs.map(m => m.id === placeholderId ? assistantMsg : m))
      if (sessionId) saveStudioMessage(sessionId, assistantMsg).catch(() => {})
      setReferenceImage(data.url)
      setUseReference(true)
    } catch (err: any) {
      updateMessages(msgs =>
        msgs.map(m => m.id === placeholderId ? { ...m, isLoading: false, error: err.message } : m)
      )
      setError(err.message || 'Error subiendo imagen')
    } finally {
      setUploading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Afianzar lado (frente / espalda) para producto doble estampa
  // ---------------------------------------------------------------------------

  const handlePinSide = useCallback((msg: StudioMessage) => {
    if (msg.type !== 'mockup' || !msg.imageUrl || !msg.garmentKey || !msg.side) return
    const pin: PinnedSide = {
      imageUrl: msg.imageUrl,
      garmentKey: msg.garmentKey,
      garmentColor: msg.garmentColor || 'black',
      side: msg.side,
      pinnedAt: Date.now(),
    }

    // Si el partner cambia de prenda o color, invalidamos lo afianzado del otro lado
    const samePrenda = (other: PinnedSide | null) =>
      other && other.garmentKey === pin.garmentKey && other.garmentColor === pin.garmentColor

    if (pin.side === 'front') {
      setPinnedFront(pin)
      if (!samePrenda(pinnedBack)) setPinnedBack(null)
    } else {
      setPinnedBack(pin)
      if (!samePrenda(pinnedFront)) setPinnedFront(null)
    }
  }, [pinnedFront, pinnedBack])

  const handleUnpinSide = useCallback((side: 'front' | 'back') => {
    if (side === 'front') setPinnedFront(null)
    else setPinnedBack(null)
  }, [])

  const handleCreateDualSideProduct = useCallback(() => {
    if (!pinnedFront || !pinnedBack) return
    if (pinnedFront.garmentKey !== pinnedBack.garmentKey || pinnedFront.garmentColor !== pinnedBack.garmentColor) {
      setCatalogToast('Frente y espalda deben ser de la misma prenda y color')
      setTimeout(() => setCatalogToast(null), 3500)
      return
    }
    const cat = CATALOG_PRODUCTS.find(p => p.key === pinnedFront.garmentKey)
    setCatalogProductName(cat ? `${cat.name} ${COLOR_LABELS[pinnedFront.garmentColor] || ''} doble estampa` : 'Producto doble estampa')
    setCatalogProductPrice(cat ? String(Math.round(cat.retailARS * 1.1)) : '32000') // +10% por doble estampa
    setCatalogModal({
      imageUrl: pinnedFront.imageUrl,
      garmentKey: pinnedFront.garmentKey,
      color: pinnedFront.garmentColor,
      backImageUrl: pinnedBack.imageUrl,
    })
  }, [pinnedFront, pinnedBack])

  // ---------------------------------------------------------------------------
  // Add to catalog
  // ---------------------------------------------------------------------------

  const handleCreateCatalogProduct = async () => {
    if (!catalogModal) return
    const name = catalogProductName.trim()
    if (!name) {
      setCatalogToast('Falta nombre del producto')
      return
    }
    const price = parseInt(catalogProductPrice, 10) || 0
    const garmentKey = catalogModal.garmentKey || selectedGarment
    const colorKey = catalogModal.color || selectedColor
    const cat = CATALOG_PRODUCTS.find(p => p.key === garmentKey)

    setCatalogCreating(true)
    try {
      // Si es doble estampa, mandamos las 2 imagenes (frente primero, espalda segunda)
      const images = catalogModal.backImageUrl
        ? [catalogModal.imageUrl, catalogModal.backImageUrl]
        : [catalogModal.imageUrl]
      const isDualSide = !!catalogModal.backImageUrl
      const description = isDualSide
        ? `${cat?.name || 'Producto'} con doble estampa (frente y espalda) — diseño custom Novamente.`
        : (cat?.shortDescription || `${cat?.name || 'Producto'} con diseno custom Novamente.`)
      const tags = ['novamente', 'estampado-dtg', cat?.fit || 'oversize']
      if (isDualSide) tags.push('doble-estampa')

      const res = await authFetch('/api/partners/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category: cat?.category || 'Remera Oversize',
          price,
          images,
          tags,
          status: 'draft',
          metadata: {
            garmentKey,
            color: colorKey,
            sizes: cat?.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
            source: 'design-engine',
            dualSide: isDualSide,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCatalogToast(data.error || 'Error creando producto')
        return
      }
      const successMsg = catalogModal.backImageUrl
        ? 'Producto doble estampa creado (borrador en /workspace/catalog)'
        : 'Producto creado en tu catalogo (borrador)'
      setCatalogToast(successMsg)
      setCatalogModal(null)
      // Si era doble estampa, limpiar los lados afianzados (ya consumidos)
      if (catalogModal.backImageUrl) {
        setPinnedFront(null)
        setPinnedBack(null)
      }
      setCatalogProductName('')
      setCatalogProductPrice('')
    } catch (err: any) {
      setCatalogToast(err.message || 'Error')
    } finally {
      setCatalogCreating(false)
      setTimeout(() => setCatalogToast(null), 4000)
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
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ---- Sidebar ---- */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-zinc-900/95 backdrop-blur border-r border-zinc-800
        transform transition-all duration-200 overflow-hidden
        lg:relative lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0 lg:w-72' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h3 className="font-semibold text-sm text-zinc-300">Sesiones</h3>
            <div className="flex gap-2">
              <button onClick={handleNewConversation} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Nueva sesion">
                <Plus className="h-4 w-4" />
              </button>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400" title="Cerrar panel de sesiones">
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
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400"
            title={sidebarOpen ? 'Ocultar panel de sesiones' : 'Mostrar panel de sesiones'}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Sparkles className="h-5 w-5 text-violet-400" />
          <h2 className="font-semibold text-sm">Studio de Diseño</h2>
          <span className="text-xs text-zinc-500 uppercase">{plan}</span>

          {/* Mode tabs */}
          <div className="flex items-center gap-1 ml-2 p-1 rounded-lg bg-zinc-800/60">
            <button
              onClick={() => setStudioMode('ai')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                studioMode === 'ai'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              Generar con IA
            </button>
            <button
              onClick={() => setStudioMode('upload')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                studioMode === 'upload'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <UploadIcon className="h-3 w-3" />
              Subir mi PNG
            </button>
          </div>

          {/* Usage meter */}
          {usage && (
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {!usage.unlimited && (
                  <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usage.percentUsed > 85 ? 'bg-red-500' : usage.percentUsed > 60 ? 'bg-yellow-500' : 'bg-violet-500'
                      }`}
                      style={{ width: `${Math.min(100, usage.percentUsed)}%` }}
                    />
                  </div>
                )}
                <span className="text-xs text-zinc-400">
                  {usage.unlimited ? 'Generaciones ilimitadas ✨' : `${usage.used}/${usage.limit} ${usage.resetLabel}`}
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

          {/* Reference Image Toggle — aparece cuando el partner subió una imagen */}
          {referenceImage && (
            <button
              onClick={() => setUseReference(!useReference)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                useReference ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30' : 'bg-zinc-800 text-zinc-500'
              }`}
              title="Usar tu imagen subida como referencia: la IA genera variaciones de tu diseño en vez de crear uno nuevo desde cero"
            >
              <ImageIcon className="h-3 w-3" />
              Mi imagen
            </button>
          )}
        </div>

        {/* Upload panel (when studioMode === 'upload') */}
        {studioMode === 'upload' && (
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <QuickDesignUpload onClose={() => setStudioMode('ai')} />
          </div>
        )}

        {/* Chat messages */}
        <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 ${studioMode === 'upload' ? 'hidden' : ''}`}>
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
                onAddToCatalog={(url, gKey, gColor) => {
                  const garmentKey = gKey || selectedGarment
                  const garmentColor = gColor || selectedColor
                  const cat = CATALOG_PRODUCTS.find(p => p.key === garmentKey)
                  setCatalogProductName(cat ? `${cat.name} ${COLOR_LABELS[garmentColor] || garmentColor}` : 'Producto Novamente')
                  setCatalogProductPrice(cat ? String(cat.retailARS) : '28600')
                  setCatalogModal({ imageUrl: url, garmentKey, color: garmentColor })
                }}
                onPinSide={handlePinSide}
                isPinned={
                  !!msg.imageUrl &&
                  ((msg.side === 'front' && pinnedFront?.imageUrl === msg.imageUrl) ||
                    (msg.side === 'back' && pinnedBack?.imageUrl === msg.imageUrl))
                }
              />
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Banner doble estampa — aparece cuando hay frente y/o espalda afianzados */}
        {(pinnedFront || pinnedBack) && (
          <div className="border-t border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-zinc-900 to-emerald-950/40 px-4 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-violet-300 font-medium shrink-0">
                <Pin className="w-3.5 h-3.5" />
                Doble estampa
              </div>
              {/* Front slot */}
              <div className="flex items-center gap-2">
                {pinnedFront ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40">
                    <img src={pinnedFront.imageUrl} alt="Frente" className="w-8 h-8 rounded object-cover" />
                    <span className="text-xs text-amber-300 font-medium">Frente</span>
                    <button onClick={() => handleUnpinSide('front')} className="p-0.5 hover:bg-amber-500/20 rounded" title="Quitar frente">
                      <X className="w-3 h-3 text-amber-400" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500 px-2 py-1 rounded-lg border border-dashed border-zinc-700">
                    Frente pendiente
                  </span>
                )}
                <span className="text-zinc-600 text-xs">+</span>
                {pinnedBack ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40">
                    <img src={pinnedBack.imageUrl} alt="Espalda" className="w-8 h-8 rounded object-cover" />
                    <span className="text-xs text-amber-300 font-medium">Espalda</span>
                    <button onClick={() => handleUnpinSide('back')} className="p-0.5 hover:bg-amber-500/20 rounded" title="Quitar espalda">
                      <X className="w-3 h-3 text-amber-400" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500 px-2 py-1 rounded-lg border border-dashed border-zinc-700">
                    Espalda pendiente
                  </span>
                )}
              </div>

              {/* CTA cuando ambos estan listos */}
              {pinnedFront && pinnedBack ? (
                <button
                  onClick={handleCreateDualSideProduct}
                  className="ml-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Crear producto doble estampa
                </button>
              ) : (
                <span className="ml-auto text-[11px] text-zinc-500">
                  Generá mockup del {pinnedFront ? 'lado espalda' : 'lado frente'} y afianzalo
                </span>
              )}
            </div>
          </div>
        )}

        {/* Compact controls bar: style + side.
            Mobile: flex-wrap para que TODOS los controles (incl. Frente/Espalda)
            sean visibles sin scroll horizontal oculto. Desktop: single-row scroll. */}
        <div className={`flex flex-wrap items-center gap-2 px-4 py-2 border-t border-zinc-800/50 bg-zinc-900/30 lg:flex-nowrap lg:overflow-x-auto ${studioMode === 'upload' ? 'hidden' : ''}`}>
          {/* Style selector */}
          <button
            onClick={() => setStyleModalOpen(true)}
            className="flex items-center gap-1 flex-shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700/60 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-all duration-150 active:scale-[0.96] whitespace-nowrap"
          >
            <Sparkles className="h-3 w-3 text-violet-400" />
            {styles.find(s => s.key === selectedStyle)?.name || 'Sin estilo'}
          </button>

          {/* Current garment + color indicator (click opens right panel on mobile).
              Muestra el color actual (dot + nombre) para que el partner descubra
              que prenda Y color se eligen acá — antes "stone wash" quedaba escondido. */}
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            aria-label="Elegir prenda y color"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors whitespace-nowrap lg:hidden"
          >
            <Shirt className="h-3 w-3" />
            <span>{garments.find(g => g.key === selectedGarment)?.name || 'Prenda'}</span>
            <span
              className="w-2.5 h-2.5 rounded-full border border-zinc-500 flex-shrink-0"
              style={{ backgroundColor: COLOR_MAP[selectedColor] || selectedColor }}
            />
            <span className="text-zinc-400">{COLOR_LABELS[selectedColor] || selectedColor}</span>
            <ChevronRight className={`h-3 w-3 transition-transform ${rightPanelOpen ? 'rotate-90' : ''}`} />
          </button>

          {/* Side toggle */}
          <div className="flex items-center flex-shrink-0 bg-zinc-800 rounded-lg overflow-hidden text-xs border border-zinc-700/60 divide-x divide-zinc-700/50">
            <button
              onClick={() => setSelectedSide('front')}
              className={`px-3 py-1.5 whitespace-nowrap transition-all duration-150 active:scale-[0.96] ${selectedSide === 'front' ? 'bg-violet-600 text-white shadow-inner' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60'}`}
            >
              Frente
            </button>
            <button
              onClick={() => setSelectedSide('back')}
              className={`px-3 py-1.5 whitespace-nowrap transition-all duration-150 active:scale-[0.96] ${selectedSide === 'back' ? 'bg-violet-600 text-white shadow-inner' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60'}`}
            >
              Espalda
            </button>
          </div>

          {/* Stamp mode selector */}
          <div className="flex items-center flex-shrink-0 bg-zinc-800 rounded-lg overflow-hidden text-xs border border-zinc-700/60 divide-x divide-zinc-700/50">
            <button
              onClick={() => setSelectedStampMode('chest-logo')}
              className={`px-3 py-1.5 whitespace-nowrap transition-all duration-150 active:scale-[0.96] ${selectedStampMode === 'chest-logo' ? 'bg-violet-600 text-white shadow-inner' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60'}`}
              title="Logo pequeño en pecho o espalda (~10×10 cm)"
            >
              Chico / Logo
            </button>
            <button
              onClick={() => setSelectedStampMode('medium')}
              className={`px-3 py-1.5 whitespace-nowrap transition-all duration-150 active:scale-[0.96] ${selectedStampMode === 'medium' ? 'bg-violet-600 text-white shadow-inner' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60'}`}
              title="Estampa mediana (~20×25 cm)"
            >
              Mediano
            </button>
            <button
              onClick={() => setSelectedStampMode('large')}
              className={`px-3 py-1.5 whitespace-nowrap transition-all duration-150 active:scale-[0.96] ${selectedStampMode === 'large' ? 'bg-violet-600 text-white shadow-inner' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60'}`}
              title="Estampa grande, hasta 35×40 cm de área"
            >
              Grande
            </button>
          </div>

          {/* Placement dropdown — depende de stampMode + side */}
          {(() => {
            const placementOpts = getPlacementOptions(selectedStampMode, selectedSide)
            const current = placementOpts.find(o => o.key === selectedPlacement) || placementOpts[0]
            return (
              <div className="relative">
                <button
                  ref={placementBtnRef}
                  onClick={() => (placementMenuOpen ? setPlacementMenuOpen(false) : openPlacementMenu())}
                  className="flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700/60 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-all duration-150 active:scale-[0.96] whitespace-nowrap"
                  title={current?.hint}
                >
                  <Pin className="h-3 w-3 text-violet-400" />
                  {current?.label || 'Ubicación'}
                  <ChevronDown className={`h-3 w-3 transition-transform ${placementMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {placementMenuOpen && placementMenuPos && typeof document !== 'undefined' && createPortal(
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setPlacementMenuOpen(false)} />
                    <div
                      className="fixed w-64 max-h-72 overflow-y-auto rounded-xl border border-zinc-700/80 bg-zinc-900/95 backdrop-blur shadow-2xl z-[61]"
                      style={{ left: placementMenuPos.left, bottom: placementMenuPos.bottom }}
                    >
                      <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800 sticky top-0 bg-zinc-900/95 backdrop-blur">
                        Dónde aplicar la estampa
                      </div>
                      {placementOpts.map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => { setSelectedPlacement(opt.key); setPlacementMenuOpen(false) }}
                          className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-start gap-2 ${
                            opt.key === selectedPlacement ? 'bg-violet-600/15 text-violet-200' : 'text-zinc-300 hover:bg-zinc-800/80'
                          }`}
                        >
                          <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${opt.key === selectedPlacement ? 'text-violet-400' : 'opacity-0'}`} />
                          <div className="min-w-0">
                            <p className="font-medium leading-tight">{opt.label}</p>
                            <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">{opt.hint}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>,
                  document.body
                )}
              </div>
            )
          })()}

          <div className="ml-auto" />

          {/* Selected garment price badge — segun plan del partner */}
          {selectedGarment && garmentPricing[selectedGarment] && (() => {
            const myPrice = garmentPricing[selectedGarment].myPrice
            if (myPrice == null) return null
            return (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md whitespace-nowrap">
                Tu precio: {formatGarmentPrice(myPrice)}
              </span>
            )
          })()}
        </div>

        {/* Input area */}
        <div className={`p-4 border-t border-zinc-800 bg-zinc-900/50 ${studioMode === 'upload' ? 'hidden' : ''}`}>
          {usage && !usage.unlimited && usage.used >= usage.limit && (
            <div className="mb-3 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="font-medium">Llegaste al límite semanal ({usage.used}/{usage.limit} generaciones)</p>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  {usage.resetLabel}.{' '}
                  <a href="/workspace/billing" className="underline hover:text-amber-200">Pasá a Growth y generá sin límite.</a>
                </p>
              </div>
            </div>
          )}
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
            {/* Upload logo / imagen propia */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleUploadDesign(f)
                // reset para permitir re-subir el mismo archivo
                if (e.target) e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || generating}
              className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Subir tu propio diseño, logo o imagen"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
            </button>
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describí solo el dibujo, sin la prenda (ej: dragon japones en estilo acuarela)"
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
              disabled={!prompt.trim() || generating || (!!usage && !usage.unlimited && usage.used >= usage.limit)}
              className="p-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1.5 px-1">
            <ImageIcon className="w-3 h-3 inline mr-1" />
            <strong className="text-zinc-400">Subí tu propio diseño:</strong> logo, ilustración, foto, arte que ya tengas o que diseñaste afuera (PNG, JPG, WEBP, SVG). Después clickeá la imagen subida → ícono de remera para aplicarla como estampa sobre cualquiera de nuestras 8 prendas.
          </p>
        </div>
      </div>

      {/* Backdrop del drawer en mobile — al abrirse oscurece el fondo y permite
          cerrar tocando afuera (affordance de que se abrió un panel). */}
      {rightPanelOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setRightPanelOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ---- Right Panel: Garments + Pricing ---- */}
      <div className={`
        fixed inset-y-0 right-0 z-40 w-80 bg-zinc-900/95 backdrop-blur border-l border-zinc-800
        transform transition-transform duration-200
        lg:relative lg:translate-x-0
        ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Panel header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur">
            <h3 className="font-semibold text-sm text-zinc-300 flex items-center gap-2">
              <Shirt className="h-4 w-4 text-violet-400" />
              Prendas Base
            </h3>
            <button
              onClick={() => setRightPanelOpen(false)}
              aria-label="Cerrar panel de prendas"
              className="lg:hidden inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium"
            >
              <X className="h-4 w-4" />
              Cerrar
            </button>
          </div>

          {/* Header info */}
          <div className="px-4 py-2 border-b border-zinc-900/50 text-[10px] uppercase tracking-widest text-zinc-500">
            8 prendas disponibles · click para usar
          </div>

          {/* Garment cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {garments.map(g => {
              const pricing = garmentPricing[g.key]
              const catalogProduct = CATALOG_PRODUCTS.find(p => p.key === g.key)
              const isSelected = selectedGarment === g.key
              const thumbKey = Object.keys(GARMENT_THUMBNAILS[g.key] || {})[0] || 'black'
              const thumbUrl = GARMENT_THUMBNAILS[g.key]?.[selectedColor] || GARMENT_THUMBNAILS[g.key]?.[thumbKey]
              const availableColors = g.colors // colores ya validados por design-engine.ts contra catalog

              return (
                <div
                  key={g.key}
                  className={`rounded-xl border transition-all ${
                    isSelected
                      ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                      : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGarment(g.key)
                      if (!g.colors.includes(selectedColor)) {
                        setSelectedColor(g.colors[0] || 'black')
                      }
                    }}
                    className="w-full text-left p-3 flex gap-3"
                  >
                    {/* Thumbnail */}
                    {thumbUrl ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 ring-1 ring-zinc-700">
                        <img src={thumbUrl} alt={g.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <Shirt className="w-7 h-7 text-zinc-600" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-violet-300' : 'text-zinc-100'}`}>
                        {g.name}
                      </p>
                      {catalogProduct && (
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {catalogProduct.fit} · {catalogProduct.weightGsm ?? '—'} g/m²
                        </p>
                      )}

                      {/* Price — segun plan del partner */}
                      {pricing && (() => {
                        const planKey = (plan || '').toLowerCase() === 'pro'
                          ? 'pro'
                          : (plan || '').toLowerCase() === 'growth'
                            ? 'growth'
                            : 'starter'
                        const myPrice = pricing.myPrice
                        const retail = catalogProduct?.retailARS ?? pricing.b2c_suggested
                        if (myPrice == null) return null
                        const growthPrice = planKey === 'starter' ? pricing.growthPrice : null
                        const growthSavings = growthPrice != null ? myPrice - growthPrice : 0
                        return (
                          <>
                            <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-sm font-bold text-emerald-400">
                                {formatGarmentPrice(myPrice)}
                              </span>
                              {retail > myPrice && (
                                <span className="text-[10px] text-zinc-500">
                                  retail {formatGarmentPrice(retail)}
                                </span>
                              )}
                            </div>
                            {planKey === 'starter' && growthSavings > 0 && (
                              <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">
                                ↑ Plan Growth: +{formatGarmentPrice(growthSavings)} de margen
                              </p>
                            )}
                          </>
                        )
                      })()}

                      {/* Talles disponibles */}
                      {catalogProduct && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {catalogProduct.sizes.map(s => (
                            <span
                              key={s}
                              className="text-[9px] tracking-wider uppercase px-1 py-0.5 rounded bg-zinc-800/60 text-zinc-500 border border-zinc-700/50"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Color swatches — visibles solo cuando selected, con nombres */}
                  {isSelected && availableColors.length > 0 && (
                    <div className="border-t border-violet-500/20 px-3 pb-3 pt-2.5">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
                        Color ({availableColors.length} disponible{availableColors.length === 1 ? '' : 's'})
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {availableColors.map(c => {
                          const isColorSelected = selectedColor === c
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedColor(c)
                              }}
                              className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md border transition ${
                                isColorSelected
                                  ? 'border-violet-500 bg-violet-500/15'
                                  : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/60'
                              }`}
                              aria-pressed={isColorSelected}
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-zinc-600 flex-shrink-0"
                                style={{ backgroundColor: COLOR_MAP[c] || c }}
                              />
                              <span className={`text-[10px] truncate ${isColorSelected ? 'text-violet-200 font-medium' : 'text-zinc-400'}`}>
                                {COLOR_LABELS[c] || c}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cuando NO esta seleccionado, mostrar dots compactos */}
                  {!isSelected && availableColors.length > 0 && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="flex items-center gap-1">
                        {availableColors.slice(0, 8).map(c => (
                          <span
                            key={c}
                            className="w-3 h-3 rounded-full border border-zinc-700"
                            style={{ backgroundColor: COLOR_MAP[c] || c }}
                            title={COLOR_LABELS[c] || c}
                          />
                        ))}
                        {availableColors.length > 8 && (
                          <span className="text-[9px] text-zinc-600 ml-1">+{availableColors.length - 8}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
                Pedí más unidades en un mismo pedido y desbloqueá precios más bajos.
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
                        <span>{t.minUnits === 0 ? 'Base' : `${t.minUnits}+ uds por pedido`}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price table per garment */}
                  <div className="border-t border-zinc-700 pt-3">
                    <p className="text-xs font-medium text-zinc-400 mb-2">Precios por prenda</p>
                    <div className="space-y-2">
                      {Object.values(garmentPricing).map(gp => (
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

            {/* B2C suggested price hint — margen segun plan del partner */}
            {selectedGarment && garmentPricing[selectedGarment] && (() => {
              const myPrice = garmentPricing[selectedGarment].myPrice ?? 0
              const retail = garmentPricing[selectedGarment].b2c_suggested
              return (
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
                <p className="text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">Precio sugerido de venta:</span>{' '}
                  {formatGarmentPrice(retail)}
                </p>
                <p className="text-[10px] text-zinc-600 mt-1">
                  Margen estimado: {formatGarmentPrice(Math.max(0, retail - myPrice))}
                </p>
              </div>
              )
            })()}
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
                {/* Sin estilo — primera opcion para no sesgar el prompt */}
                <button
                  onClick={() => { setSelectedStyle(''); setStyleModalOpen(false) }}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedStyle === ''
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
                  }`}
                >
                  <p className="font-medium text-sm mb-1 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5 text-zinc-400" />
                    Sin estilo
                  </p>
                  <p className="text-xs text-zinc-500 line-clamp-2">
                    Generar exactamente lo que pidas, sin filtros artisticos.
                  </p>
                </button>
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

      {/* ─── Add to catalog modal ────────────────────────────────────── */}
      {catalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-lg">
                {catalogModal.backImageUrl ? 'Agregar al catalogo · Doble estampa' : 'Agregar al catalogo'}
              </h3>
            </div>
            {catalogModal.backImageUrl ? (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="relative">
                  <img src={catalogModal.imageUrl} alt="Frente" className="w-full h-44 object-contain bg-zinc-800 rounded-lg" />
                  <span className="absolute top-1.5 left-1.5 text-[10px] uppercase tracking-widest bg-black/70 text-white px-1.5 py-0.5 rounded">Frente</span>
                </div>
                <div className="relative">
                  <img src={catalogModal.backImageUrl} alt="Espalda" className="w-full h-44 object-contain bg-zinc-800 rounded-lg" />
                  <span className="absolute top-1.5 left-1.5 text-[10px] uppercase tracking-widest bg-black/70 text-white px-1.5 py-0.5 rounded">Espalda</span>
                </div>
              </div>
            ) : (
              <img src={catalogModal.imageUrl} alt="Mockup" className="w-full h-48 object-contain bg-zinc-800 rounded-lg mb-4" />
            )}

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-500 mb-1.5 block">Nombre del producto</label>
                <input
                  type="text"
                  value={catalogProductName}
                  onChange={e => setCatalogProductName(e.target.value)}
                  placeholder="Ej: Remera Oversize 'Mi Diseño'"
                  className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-700 rounded-md text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                  maxLength={120}
                  autoFocus
                />
                {!catalogProductName.trim() && (
                  <p className="text-[11px] text-amber-400/90 mt-1">Ingresá el nombre para poder crear el producto.</p>
                )}
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-500 mb-1.5 block">Precio de venta (ARS)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={catalogProductPrice}
                  onChange={e => setCatalogProductPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-700 rounded-md text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Sugerencia: usar el precio retail. Vas a poder editarlo despues desde /workspace/catalog.
                </p>
              </div>
              {catalogModal.garmentKey && (
                <div className="text-xs text-zinc-400 bg-zinc-800/50 rounded-md px-3 py-2">
                  <span className="text-zinc-500">Prenda base: </span>
                  <span className="font-medium text-zinc-200">
                    {CATALOG_PRODUCTS.find(p => p.key === catalogModal.garmentKey)?.name || catalogModal.garmentKey}
                  </span>
                  {catalogModal.color && (
                    <>
                      <span className="text-zinc-500 ml-2">color: </span>
                      <span className="font-medium text-zinc-200">{COLOR_LABELS[catalogModal.color] || catalogModal.color}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCatalogModal(null)}
                disabled={catalogCreating}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCatalogProduct}
                disabled={catalogCreating || !catalogProductName.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5"
              >
                {catalogCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Crear producto
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-zinc-500 mt-3 text-center">
              Se crea como <strong className="text-zinc-400">borrador</strong>. Andá a{' '}
              <a href="/workspace/catalog" className="text-violet-400 hover:underline">/workspace/catalog</a> para publicarlo.
            </p>
          </div>
        </div>
      )}

      {/* Toast catalog */}
      {catalogToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg bg-zinc-900 border border-emerald-500/30 text-sm text-emerald-300 shadow-lg">
          {catalogToast}
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
  onAddToCatalog,
  onPinSide,
  isPinned,
}: {
  msg: StudioMessage
  onZoom: (url: string) => void
  onMockup: (url: string) => void
  onDownload: (url: string) => void
  onPublish: (url: string) => void
  onAddToCatalog: (url: string, garmentKey?: string, color?: string) => void
  onPinSide: (msg: StudioMessage) => void
  isPinned: boolean
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
            {/* Procedencia: distingue el eco de un upload de un diseño generado por IA
                (sin esto se confunden — el partner cree que la IA "le devolvió" su misma imagen) */}
            {msg.source && msg.type === 'design' && (
              <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                msg.source === 'upload'
                  ? 'bg-zinc-900/80 text-zinc-300'
                  : 'bg-violet-600/80 text-white'
              }`}>
                {msg.source === 'upload' ? 'Tu imagen subida' : 'Generado con IA'}
              </span>
            )}
            {/* Action buttons — boton primario destacado segun el tipo */}
            <div className="absolute bottom-3 right-3 flex flex-wrap gap-2 justify-end">
              {/* Boton primario destacado: depende del tipo de mensaje */}
              {msg.type === 'design' && (
                <button
                  onClick={() => onMockup(msg.imageUrl!)}
                  className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all"
                  title="Aplicar a una prenda Novamente"
                >
                  <Shirt className="h-4 w-4" />
                  Aplicar a prenda
                </button>
              )}
              {msg.type === 'mockup' && (
                <>
                  {(() => {
                    // Mockups antiguos (creados antes de agregar msg.side en DB) no tienen
                    // el campo. Default a 'front' para que igual se pueda afianzar.
                    const effectiveSide = msg.side || 'front'
                    const sideLabel = effectiveSide === 'front' ? 'frente' : 'espalda'
                    return (
                      <button
                        onClick={() => onPinSide({ ...msg, side: effectiveSide })}
                        className={`px-3 py-2.5 rounded-lg text-white text-sm font-semibold inline-flex items-center gap-1.5 shadow-lg transition-all ${
                          isPinned
                            ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                            : 'bg-zinc-700 hover:bg-zinc-600 shadow-zinc-700/30'
                        }`}
                        title={isPinned ? `${sideLabel === 'frente' ? 'Frente' : 'Espalda'} afianzado` : `Afianzar ${sideLabel} para doble estampa`}
                      >
                        <Pin className="h-3.5 w-3.5" />
                        {isPinned ? 'Afianzado' : `Afianzar ${sideLabel}`}
                      </button>
                    )
                  })()}
                  <button
                    onClick={() => onAddToCatalog(msg.imageUrl!, msg.garmentKey, undefined)}
                    className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                    title="Agregar este producto a tu catalogo"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar al catalogo
                  </button>
                </>
              )}
              {/* Secundarios pequenos: zoom + publicar (descarga eliminada) */}
              <button
                onClick={() => onZoom(msg.imageUrl!)}
                className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white"
                title="Ampliar"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPublish(msg.imageUrl!)}
                className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white"
                title="Publicar en tu tienda"
              >
                <ExternalLink className="h-4 w-4" />
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
