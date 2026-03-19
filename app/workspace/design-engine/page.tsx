'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sparkles, Loader2, ImageIcon, Shirt, X, ZoomIn, Filter, ArrowRight } from 'lucide-react'
import { authFetch } from '@/lib/partners/auth-fetch'

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

interface DesignAccess {
  allowed: boolean
  mode?: string
  reason?: string
}

interface DesignConfig {
  palette: string[] | null
  forbidden_colors: string[] | null
  tone: string | null
  supported_styles: string[] | null
  supported_garments: string[] | null
}

interface Asset {
  id: string
  type: 'design' | 'mockup'
  public_url: string
  metadata: Record<string, unknown>
  created_at: string
}

// ---------------------------------------------------------------------------
// Color map for garment selector
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<string, string> = {
  black: '#1a1a1a',
  white: '#f5f5f5',
  cream: '#f5f0e1',
  gray: '#6b7280',
}

const COLOR_LABELS: Record<string, string> = {
  black: 'Negro',
  white: 'Blanco',
  cream: 'Crema',
  gray: 'Gris',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DesignEnginePage() {
  // State: config/access
  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState<DesignAccess | null>(null)
  const [plan, setPlan] = useState('')
  const [styles, setStyles] = useState<StyleOption[]>([])
  const [garments, setGarments] = useState<GarmentOption[]>([])
  const [config, setConfig] = useState<DesignConfig | null>(null)

  // State: design tool
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedGarment, setSelectedGarment] = useState('')
  const [selectedColor, setSelectedColor] = useState('black')
  const [selectedSide, setSelectedSide] = useState<'front' | 'back'>('front')
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [generatedAssetId, setGeneratedAssetId] = useState<string | null>(null)

  // State: mockup
  const [creatingMockup, setCreatingMockup] = useState(false)
  const [mockupImage, setMockupImage] = useState<string | null>(null)

  // State: gallery
  const [assets, setAssets] = useState<Asset[]>([])
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'design' | 'mockup'>('all')
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // State: error
  const [error, setError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Load config
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await authFetch('/api/partners/design/config')
        if (!res.ok) throw new Error('Error cargando configuracion')
        const data = await res.json()
        setAccess(data.access)
        setPlan(data.plan)
        setStyles(data.styles || [])
        setGarments(data.garments || [])
        setConfig(data.config || null)
        if (data.styles?.length > 0) {
          setSelectedStyle(data.styles[0].key)
        }
        if (data.garments?.length > 0) {
          setSelectedGarment(data.garments[0].key)
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [])

  // ---------------------------------------------------------------------------
  // Load gallery
  // ---------------------------------------------------------------------------

  const loadAssets = useCallback(async () => {
    setGalleryLoading(true)
    try {
      const typeParam = galleryFilter !== 'all' ? `?type=${galleryFilter}` : ''
      const res = await authFetch(`/api/partners/design/assets${typeParam}`)
      if (res.ok) {
        const data = await res.json()
        setAssets(data.assets || [])
      }
    } catch {
      // Silent fail
    } finally {
      setGalleryLoading(false)
    }
  }, [galleryFilter])

  useEffect(() => {
    if (access?.allowed) loadAssets()
  }, [access, galleryFilter, loadAssets])

  // ---------------------------------------------------------------------------
  // Generate design
  // ---------------------------------------------------------------------------

  async function handleGenerate() {
    if (!prompt.trim()) return
    setGenerating(true)
    setError(null)
    setGeneratedImage(null)
    setMockupImage(null)

    try {
      const res = await authFetch('/api/partners/design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle || undefined,
          garmentColor: selectedColor || undefined,
          garmentType: selectedGarment || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error generando')

      setGeneratedImage(data.imageBase64 || data.imageUrl)
      setGeneratedAssetId(data.assetId)
      // Refresh gallery
      loadAssets()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Create mockup
  // ---------------------------------------------------------------------------

  async function handleCreateMockup() {
    if (!generatedImage) return
    setCreatingMockup(true)
    setError(null)
    setMockupImage(null)

    try {
      const res = await authFetch('/api/partners/design/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designImageUrl: generatedImage,
          garmentType: selectedGarment,
          garmentColor: selectedColor,
          side: selectedSide,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error generando mockup')

      setMockupImage(data.mockupBase64 || data.mockupUrl)
      loadAssets()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreatingMockup(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render: loading
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: disabled
  // ---------------------------------------------------------------------------

  if (!access?.allowed) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-zinc-500" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-3">Design Engine</h1>
        <p className="text-zinc-400 mb-6">
          {access?.reason || 'El Design Engine no esta disponible en tu plan actual.'}
        </p>
        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-zinc-800 text-zinc-400 mb-6">
          Plan: {plan}
        </span>
        <div className="mt-4">
          <button className="px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-500 transition-colors">
            Actualizar plan
          </button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const currentGarment = garments.find((g) => g.key === selectedGarment)
  const availableColors = currentGarment?.colors || ['black']
  const modeLabel: Record<string, string> = {
    mockups_only: 'Solo Mockups',
    presets: 'Presets',
    full_brand_fit: 'Full Brand Fit',
  }
  const canGenerate = access.mode !== 'mockups_only'

  // ---------------------------------------------------------------------------
  // Render: design tool
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            Design Engine
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Genera disenos y mockups para tus productos
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-violet-600/20 text-violet-400 border border-violet-600/30 self-start">
          {modeLabel[access.mode || ''] || access.mode}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Input panel */}
        <div className="space-y-6">
          {/* Style selector */}
          {canGenerate && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Estilo artistico
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1">
                {styles.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSelectedStyle(s.key)}
                    className={`text-left p-3 rounded-xl border transition-all text-sm ${
                      selectedStyle === s.key
                        ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-xs opacity-70 truncate mt-0.5">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prompt */}
          {canGenerate && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Describe tu diseno
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Un astronauta meditando en el espacio, rodeado de planetas..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 resize-none"
              />
            </div>
          )}

          {/* Garment selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              <Shirt className="w-4 h-4 inline mr-1 -mt-0.5" />
              Prenda
            </label>
            <div className="flex flex-wrap gap-2">
              {garments.map((g) => (
                <button
                  key={g.key}
                  onClick={() => {
                    setSelectedGarment(g.key)
                    if (!g.colors.includes(selectedColor)) {
                      setSelectedColor(g.colors[0])
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedGarment === g.key
                      ? 'bg-violet-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Color
            </label>
            <div className="flex gap-3">
              {availableColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  title={COLOR_LABELS[c] || c}
                  className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                    selectedColor === c
                      ? 'border-violet-500 ring-2 ring-violet-500/30'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                  style={{ backgroundColor: COLOR_MAP[c] || c }}
                >
                  {selectedColor === c && (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: c === 'black' || c === 'gray' ? '#fff' : '#000',
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Side selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Lado
            </label>
            <div className="flex gap-2">
              {(['front', 'back'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSide(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedSide === s
                      ? 'bg-violet-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {s === 'front' ? 'Frente' : 'Espalda'}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          {canGenerate && (
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generar diseno
                </>
              )}
            </button>
          )}
        </div>

        {/* RIGHT: Preview panel */}
        <div className="space-y-4">
          {/* Generated design */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">
                {mockupImage ? 'Mockup' : generatedImage ? 'Diseno generado' : 'Preview'}
              </span>
              {(generatedImage || mockupImage) && (
                <button
                  onClick={() => setLightboxUrl(mockupImage || generatedImage)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="aspect-square flex items-center justify-center bg-zinc-950/50">
              {generating ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-violet-500 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">Generando diseno con IA...</p>
                </div>
              ) : creatingMockup ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-violet-500 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">Creando mockup...</p>
                </div>
              ) : mockupImage ? (
                <img
                  src={mockupImage}
                  alt="Mockup"
                  className="w-full h-full object-contain"
                />
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Diseno generado"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <ImageIcon className="w-16 h-16 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-600">
                    {canGenerate
                      ? 'Escribe un prompt y genera tu diseno'
                      : 'Subi una imagen para crear mockups'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mockup button */}
          {generatedImage && !creatingMockup && (
            <button
              onClick={handleCreateMockup}
              disabled={creatingMockup}
              className="w-full py-3 bg-zinc-800 text-zinc-100 rounded-xl font-medium hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 border border-zinc-700"
            >
              <Shirt className="w-5 h-5" />
              Crear mockup en{' '}
              {garments.find((g) => g.key === selectedGarment)?.name || 'prenda'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Gallery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">Mis generaciones</h2>
          <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
            {(['all', 'design', 'mockup'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setGalleryFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  galleryFilter === f
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'design' ? 'Disenos' : 'Mockups'}
              </button>
            ))}
          </div>
        </div>

        {galleryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-zinc-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <ImageIcon className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">
              Todavia no generaste nada. Tu primera creacion aparecera aca.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {assets.map((a) => (
              <button
                key={a.id}
                onClick={() => setLightboxUrl(a.public_url)}
                className="group relative aspect-square bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-colors"
              >
                <img
                  src={a.public_url}
                  alt={a.type}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span
                  className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                    a.type === 'design'
                      ? 'bg-violet-600/80 text-white'
                      : 'bg-emerald-600/80 text-white'
                  }`}
                >
                  {a.type === 'design' ? 'Diseno' : 'Mockup'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
