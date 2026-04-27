'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Loader2, Shirt, X, Send, Download, ZoomIn, ChevronDown,
} from 'lucide-react'
import {
  GARMENT_PRICING,
  formatPrice as formatGarmentPrice,
} from '@/lib/partners/garment-pricing'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StyleOption {
  key: string
  name: string
  description: string
}

interface GarmentOption {
  key: string
  name: string
  colors: string[]
}

// Garment thumbnail paths (base products without stamps)
const GARMENT_THUMBNAILS: Record<string, Record<string, string>> = {
  'aura-oversize-tshirt': {
    black: '/garments/tshirt-black-oversize-front.jpeg',
    white: '/garments/tshirt-white-oversize-front.jpeg',
  },
  'aldea-classic-tshirt': {
    black: '/garments/tshirt-black-classic-front.jpeg',
    white: '/garments/tshirt-white-classic-front.jpeg',
  },
  'buzo-hoodie-unisex': {
    black: '/garments/buzo-hoodie-unisex-black-front.png',
    cream: '/garments/buzo-hoodie-unisex-crema-front.jpeg',
    gray: '/garments/buzo-hoodie-unisex-gris-front.jpeg',
    marron: '/garments/buzo-hoodie-unisex-marron-front.jpeg',
  },
  lienzo: {
    white: '/garments/lienzo-main.png',
  },
}

const COLOR_LABELS: Record<string, string> = {
  black: 'Negro', white: 'Blanco', cream: 'Crema', gray: 'Gris', marron: 'Marron',
}

const COLOR_MAP: Record<string, string> = {
  black: '#1a1a1a', white: '#f5f5f5', cream: '#f5f0e1', gray: '#6b7280', marron: '#8B5E34',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StorefrontDesigner({
  slug,
  primaryColor,
  ctaPhone,
}: {
  slug: string
  primaryColor: string
  ctaPhone?: string | null
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [styles, setStyles] = useState<StyleOption[]>([])
  const [garments, setGarments] = useState<GarmentOption[]>([])

  // Selection state
  const [selectedGarment, setSelectedGarment] = useState('')
  const [selectedColor, setSelectedColor] = useState('black')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedSide, setSelectedSide] = useState<'front' | 'back'>('front')
  const [prompt, setPrompt] = useState('')

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [designUrl, setDesignUrl] = useState<string | null>(null)
  const [mockupUrl, setMockupUrl] = useState<string | null>(null)
  const [generatingMockup, setGeneratingMockup] = useState(false)

  // UI state
  const [step, setStep] = useState<'select' | 'design' | 'mockup' | 'done'>('select')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [stylePickerOpen, setStylePickerOpen] = useState(false)

  // Load config
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/storefront/${slug}/studio/config`)
        if (!res.ok) {
          if (res.status === 403) return // Not available for this plan
          throw new Error('Error cargando configuración')
        }
        const data = await res.json()
        setStyles(data.styles || [])
        setGarments(data.garments || [])
        if (data.garments?.length > 0) setSelectedGarment(data.garments[0].key)
        if (data.styles?.length > 0) setSelectedStyle(data.styles[0].key)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [slug])

  // Handlers
  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return
    setGenerating(true)
    setError(null)
    setDesignUrl(null)
    setMockupUrl(null)

    try {
      const res = await fetch(`/api/storefront/${slug}/studio/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle || undefined,
          garmentColor: selectedColor,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error generando diseño')
      setDesignUrl(data.imageUrl)
      setStep('design')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleMockup = async () => {
    if (!designUrl || generatingMockup) return
    setGeneratingMockup(true)
    setError(null)

    try {
      const res = await fetch(`/api/storefront/${slug}/studio/mockup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designImageUrl: designUrl,
          garmentType: selectedGarment,
          garmentColor: selectedColor,
          side: selectedSide,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error generando mockup')
      setMockupUrl(data.mockupUrl)
      setStep('done')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGeneratingMockup(false)
    }
  }

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = `mi-diseno-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  const handleReset = () => {
    setDesignUrl(null)
    setMockupUrl(null)
    setPrompt('')
    setStep('select')
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  // Current garment thumbnail
  const garmentThumb = GARMENT_THUMBNAILS[selectedGarment]?.[selectedColor]
    || GARMENT_THUMBNAILS[selectedGarment]?.black
    || '/garments/tshirt-black-oversize-front.jpeg'

  if (loading) return null // Don't show section while loading
  if (garments.length === 0) return null // No garments = feature not available

  return (
    <section className="mx-auto max-w-7xl px-6 py-20" id="disenar">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-4"
          style={{ backgroundColor: `${primaryColor}22`, color: primaryColor, border: `1px solid ${primaryColor}33` }}>
          <Sparkles className="h-4 w-4" />
          Diseñá tu propia estampa
        </div>
        <h2 className="text-2xl font-bold text-white md:text-3xl mb-3">
          Creá tu diseño único con IA
        </h2>
        <p className="text-zinc-400 max-w-xl mx-auto">
          Elegí una prenda, describí tu idea, y nuestra IA genera un diseño exclusivo para vos.
          Después podés ver el mockup y hacer tu pedido.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Left: Garment selection + preview */}
        <div className="flex flex-col gap-4">
          {/* Garment cards */}
          <div className="grid grid-cols-2 gap-3">
            {garments.map(g => (
              <button
                key={g.key}
                onClick={() => {
                  setSelectedGarment(g.key)
                  if (!g.colors.includes(selectedColor)) {
                    setSelectedColor(g.colors[0])
                  }
                }}
                className={`relative rounded-xl border-2 p-3 transition-all text-left ${
                  selectedGarment === g.key
                    ? 'border-[var(--sf-primary)] bg-zinc-800/80'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                }`}
                style={{ '--sf-primary': primaryColor } as React.CSSProperties}
              >
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-zinc-800 mb-2">
                  {GARMENT_THUMBNAILS[g.key]?.[g.colors[0]] && (
                    <img
                      src={GARMENT_THUMBNAILS[g.key][g.colors[0]]}
                      alt={g.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <p className="text-sm font-medium text-zinc-200">{g.name}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-500">{g.colors.length} color{g.colors.length > 1 ? 'es' : ''}</p>
                  {GARMENT_PRICING[g.key] && (
                    <p className="text-xs font-semibold" style={{ color: primaryColor }}>
                      {formatGarmentPrice(GARMENT_PRICING[g.key].b2c_suggested)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Color selector */}
          {selectedGarment && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">Color:</span>
              <div className="flex gap-2">
                {(garments.find(g => g.key === selectedGarment)?.colors || []).map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      selectedColor === c ? 'scale-110' : 'border-zinc-600'
                    }`}
                    style={{
                      backgroundColor: COLOR_MAP[c] || c,
                      borderColor: selectedColor === c ? primaryColor : undefined,
                    }}
                    title={COLOR_LABELS[c] || c}
                  />
                ))}
              </div>

              {/* Side toggle */}
              <div className="ml-auto flex items-center bg-zinc-800 rounded-lg overflow-hidden text-xs">
                <button
                  onClick={() => setSelectedSide('front')}
                  className={`px-3 py-1.5 transition-colors ${selectedSide === 'front' ? 'text-white' : 'text-zinc-400'}`}
                  style={selectedSide === 'front' ? { backgroundColor: primaryColor } : undefined}
                >
                  Frente
                </button>
                <button
                  onClick={() => setSelectedSide('back')}
                  className={`px-3 py-1.5 transition-colors ${selectedSide === 'back' ? 'text-white' : 'text-zinc-400'}`}
                  style={selectedSide === 'back' ? { backgroundColor: primaryColor } : undefined}
                >
                  Espalda
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Design flow */}
        <div className="flex flex-col gap-4">
          {/* Result display area */}
          <div className="aspect-square rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden relative flex items-center justify-center">
            {step === 'select' && !generating && (
              <div className="text-center p-6">
                {garmentThumb && (
                  <img src={garmentThumb} alt="Prenda" className="w-48 h-48 mx-auto object-cover rounded-lg opacity-40 mb-4" />
                )}
                <p className="text-zinc-500 text-sm">Describí tu diseño abajo y generá tu estampa</p>
              </div>
            )}

            {generating && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
                <p className="text-zinc-400 text-sm">Generando tu diseño...</p>
              </div>
            )}

            {generatingMockup && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
                <p className="text-zinc-400 text-sm">Creando mockup...</p>
              </div>
            )}

            {step === 'design' && designUrl && !generatingMockup && (
              <div className="relative w-full h-full group">
                <img src={designUrl} alt="Tu diseño" className="w-full h-full object-contain p-4" />
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setLightboxUrl(designUrl)}
                    className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white"
                    title="Ampliar"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(designUrl)}
                    className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white"
                    title="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 'done' && mockupUrl && (
              <div className="relative w-full h-full group">
                <img src={mockupUrl} alt="Mockup" className="w-full h-full object-contain p-4" />
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setLightboxUrl(mockupUrl)}
                    className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(mockupUrl)}
                    className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
              <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-300">✕</button>
            </div>
          )}

          {/* Action buttons based on step */}
          {step === 'design' && designUrl && !generatingMockup && (
            <div className="flex gap-3">
              <button
                onClick={handleMockup}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                <Shirt className="h-4 w-4" />
                Ver en la prenda
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-3 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
              >
                Nuevo diseño
              </button>
            </div>
          )}

          {step === 'done' && mockupUrl && (
            <div className="flex flex-col gap-3">
              {ctaPhone && (
                <a
                  href={`https://wa.me/${ctaPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Me gustaria pedir esta prenda con mi diseño personalizado: ${mockupUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium transition-colors"
                  style={{ backgroundColor: primaryColor }}
                >
                  Pedir esta prenda por WhatsApp
                </a>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setMockupUrl(null); setStep('design') }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
                >
                  Probar otro color/lado
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
                >
                  Nuevo diseño
                </button>
              </div>
            </div>
          )}

          {/* Prompt input (visible in select + design steps) */}
          {(step === 'select' || (step === 'design' && !generatingMockup)) && (
            <div className="flex flex-col gap-2">
              {/* Style quick-pick */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setStylePickerOpen(!stylePickerOpen)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  <Sparkles className="h-3 w-3" style={{ color: primaryColor }} />
                  {styles.find(s => s.key === selectedStyle)?.name || 'Estilo'}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describí tu diseño... (ej: un dragón japonés en acuarela)"
                  rows={1}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-1 min-h-[44px] max-h-[80px]"
                  style={{ '--tw-ring-color': `${primaryColor}80` } as React.CSSProperties}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = Math.min(target.scrollHeight, 80) + 'px'
                  }}
                />
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generating}
                  className="p-3 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ backgroundColor: primaryColor }}
                >
                  {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>

              {/* Quick prompts */}
              {step === 'select' && (
                <div className="flex flex-wrap gap-1.5">
                  {['Logo minimalista', 'Paisaje abstracto', 'Ilustración botánica', 'Pattern geométrico'].map(ex => (
                    <button
                      key={ex}
                      onClick={() => setPrompt(ex)}
                      className="px-2.5 py-1 rounded-full border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Style Picker Modal */}
      {stylePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setStylePickerOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[70vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="font-semibold text-sm">Elegí un estilo artístico</h3>
              <button onClick={() => setStylePickerOpen(false)} className="p-1 rounded-lg hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2">
                {styles.slice(0, 18).map(s => (
                  <button
                    key={s.key}
                    onClick={() => { setSelectedStyle(s.key); setStylePickerOpen(false) }}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      selectedStyle === s.key
                        ? 'bg-zinc-800'
                        : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/30'
                    }`}
                    style={selectedStyle === s.key ? { borderColor: primaryColor } : undefined}
                  >
                    <p className="font-medium text-xs">{s.name}</p>
                    <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{s.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-3xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Diseño" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            <button onClick={() => setLightboxUrl(null)} className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
