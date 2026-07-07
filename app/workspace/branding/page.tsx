'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import NextImage from 'next/image'
import {
  Palette,
  Type,
  FileText,
  Save,
  Loader2,
  Check,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Leaf,
  Monitor,
  Sun,
  Flame,
  Moon,
  Heart,
  ImageIcon,
  PenTool,
  Megaphone,
  Layers,
  Brush,
  Trophy,
  Building2,
  Music,
  ExternalLink,
  Package,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ImageUpload } from '@/components/partners/image-upload'
import { authFetch } from '@/lib/partners/auth-fetch'

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

interface BrandingData {
  logo_url: string
  banner_url: string
  hero_url: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font_preference: string
  visual_style: string
  tagline: string
  about_text: string
  cta_text: string
  cta_url: string
}

const EMPTY_BRANDING: BrandingData = {
  logo_url: '',
  banner_url: '',
  hero_url: '',
  primary_color: '#000000',
  secondary_color: '#ffffff',
  accent_color: '#3b82f6',
  font_preference: 'inter',
  visual_style: 'minimal',
  tagline: '',
  about_text: '',
  cta_text: '',
  cta_url: '',
}

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter', family: 'Inter, system-ui, sans-serif' },
  { value: 'poppins', label: 'Poppins', family: 'Poppins, sans-serif' },
  { value: 'montserrat', label: 'Montserrat', family: 'Montserrat, sans-serif' },
  { value: 'roboto', label: 'Roboto', family: 'Roboto, sans-serif' },
  { value: 'playfair', label: 'Playfair Display', family: '"Playfair Display", serif' },
] as const

const STYLE_OPTIONS = [
  { value: 'minimal', label: 'Minimal', icon: Sparkles, desc: 'Limpio y moderno' },
  { value: 'bold', label: 'Bold', icon: Zap, desc: 'Fuerte e impactante' },
  { value: 'editorial', label: 'Editorial', icon: PenTool, desc: 'Elegante y tipografico' },
  { value: 'sport', label: 'Sport', icon: Trophy, desc: 'Dinamico y energetico' },
  { value: 'corporate', label: 'Corporate', icon: Building2, desc: 'Profesional y serio' },
  { value: 'urbano', label: 'Urbano', icon: Music, desc: 'Callejero y autentico' },
  { value: 'creativo', label: 'Creativo', icon: Brush, desc: 'Artistico y libre' },
] as const

// Curated color palettes
const COLOR_PALETTES = [
  { name: 'Minimal', primary: '#1a1a1a', secondary: '#f5f5f5', accent: '#6366f1' },
  { name: 'Bold', primary: '#dc2626', secondary: '#fef2f2', accent: '#f59e0b' },
  { name: 'Nature', primary: '#166534', secondary: '#f0fdf4', accent: '#a3e635' },
  { name: 'Tech', primary: '#0f172a', secondary: '#e2e8f0', accent: '#06b6d4' },
  { name: 'Sunset', primary: '#9a3412', secondary: '#fff7ed', accent: '#f97316' },
  { name: 'Midnight', primary: '#1e1b4b', secondary: '#eef2ff', accent: '#818cf8' },
  { name: 'Rose', primary: '#881337', secondary: '#fff1f2', accent: '#fb7185' },
  { name: 'Ocean', primary: '#164e63', secondary: '#ecfeff', accent: '#22d3ee' },
] as const

const PALETTE_ICONS = [Sparkles, Flame, Leaf, Monitor, Sun, Moon, Heart, Layers] as const

interface Toast {
  message: string
  type: 'success' | 'error'
}

// ---------------------------------------------------------------------------
// Live Preview Component
// ---------------------------------------------------------------------------

function LivePreview({ branding, slug }: { branding: BrandingData; slug: string | null }) {
  const font = FONT_OPTIONS.find((f) => f.value === branding.font_preference)
  const fontFamily = font?.family || 'Inter, system-ui, sans-serif'
  const brandColor = branding.primary_color === '#000000' ? '#e4e4e7' : branding.primary_color

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/80 overflow-hidden shadow-2xl">
      {/* Browser chrome bar */}
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-zinc-700" />
          <span className="w-2 h-2 rounded-full bg-zinc-700" />
          <span className="w-2 h-2 rounded-full bg-zinc-700" />
        </div>
        <div className="flex-1 mx-2 h-5 rounded bg-zinc-800/80 flex items-center px-2">
          <span className="text-[9px] text-zinc-600 truncate">novamente.ar/p/{slug || 'tu-marca'}</span>
        </div>
      </div>

      {/* Mini storefront simulation */}
      <div style={{ backgroundColor: branding.secondary_color }} className="transition-colors duration-300">
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2 transition-colors duration-300"
          style={{ backgroundColor: branding.primary_color }}
        >
          {branding.logo_url ? (
            <div className="relative w-6 h-6 rounded shrink-0 overflow-hidden">
              <NextImage src={branding.logo_url} alt="Logo" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: branding.accent_color }}>
              <span className="text-[8px] font-bold" style={{ color: branding.secondary_color }}>
                {(slug || 'M').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-[10px] font-semibold truncate" style={{ fontFamily, color: branding.secondary_color }}>
            {slug?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Tu Marca'}
          </span>
        </div>

        {/* Hero banner */}
        <div
          className="relative w-full h-14 flex items-center justify-center overflow-hidden transition-colors duration-300"
          style={{ backgroundColor: branding.primary_color + '15' }}
        >
          {branding.hero_url || branding.banner_url ? (
            <NextImage
              src={branding.hero_url || branding.banner_url}
              alt="Hero"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="text-center px-2">
              <p className="text-[9px] font-semibold" style={{ fontFamily, color: brandColor }}>
                {branding.tagline || 'Tu tagline aparece aca'}
              </p>
            </div>
          )}
        </div>

        {/* Products grid */}
        <div className="px-2 py-2">
          <p className="text-[8px] font-semibold mb-1.5 px-1" style={{ fontFamily, color: brandColor }}>
            Productos
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {['Remera Oversize', 'Hoodie', 'Classic Fit', 'Canvas'].map((name) => (
              <div key={name} className="rounded border border-zinc-200/10 overflow-hidden" style={{ backgroundColor: branding.secondary_color }}>
                <div className="h-12 bg-zinc-800/30 flex items-center justify-center">
                  <Package className="w-4 h-4 text-zinc-600/50" />
                </div>
                <div className="p-1.5">
                  <p className="text-[7px] font-medium truncate" style={{ fontFamily, color: brandColor }}>{name}</p>
                  <p className="text-[7px]" style={{ color: branding.accent_color }}>$24,900</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA bar */}
        <div className="px-2 pb-2">
          <div
            className="w-full py-1.5 rounded text-center text-[8px] font-semibold transition-colors duration-300"
            style={{
              backgroundColor: branding.accent_color,
              color: branding.secondary_color,
              fontFamily,
            }}
          >
            {branding.cta_text || 'Ver catalogo completo'}
          </div>
        </div>
      </div>

      {/* Storefront link */}
      {slug && (
        <div className="px-3 py-2 border-t border-zinc-800">
          <Link
            href={`/p/${slug}`}
            target="_blank"
            className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Ver mi storefront
          </Link>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function BrandingPage() {
  const [branding, setBranding] = useState<BrandingData>(EMPTY_BRANDING)
  const [original, setOriginal] = useState<BrandingData>(EMPTY_BRANDING)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [plan, setPlan] = useState<string>('starter')
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDirty = JSON.stringify(branding) !== JSON.stringify(original)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, type })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  const fetchBranding = useCallback(async () => {
    try {
      const res = await authFetch('/api/partners/branding')
      if (!res.ok) throw new Error('Error cargando branding')
      const data = await res.json()
      if (data.plan) setPlan(data.plan)
      const brandingData = data.branding || data
      if (brandingData.slug) setTenantSlug(brandingData.slug)
      const merged: BrandingData = { ...EMPTY_BRANDING }
      for (const key of Object.keys(EMPTY_BRANDING) as (keyof BrandingData)[]) {
        if (brandingData[key] !== undefined && brandingData[key] !== null) {
          merged[key] = brandingData[key]
        }
      }
      setBranding(merged)
      setOriginal(merged)
    } catch {
      showToast('Error al cargar configuracion de marca', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchBranding()
  }, [fetchBranding])

  const handleSave = async () => {
    setSaving(true)
    try {
      const changed: Partial<BrandingData> = {}
      for (const key of Object.keys(branding) as (keyof BrandingData)[]) {
        if (branding[key] !== original[key]) {
          changed[key] = branding[key]
        }
      }

      const res = await authFetch('/api/partners/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changed),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al guardar')
      }

      const updated = await res.json()
      // El endpoint devuelve { branding: {...}, auto_published?: bool, storefront_published?: bool }
      const brandingPayload = (updated.branding ?? updated) as Record<string, unknown>
      const merged: BrandingData = { ...EMPTY_BRANDING }
      for (const key of Object.keys(EMPTY_BRANDING) as (keyof BrandingData)[]) {
        const v = brandingPayload[key as string]
        if (v !== undefined && v !== null) {
          merged[key] = v as BrandingData[typeof key]
        }
      }
      setBranding(merged)
      setOriginal(merged)
      if (updated.auto_published === true) {
        showToast('🎉 ¡Listo! Tu storefront ya está publicado y visible en novamente.ar', 'success')
      } else {
        showToast('Branding actualizado correctamente', 'success')
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar cambios', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateField = <K extends keyof BrandingData>(key: K, value: BrandingData[K]) => {
    setBranding((prev) => ({ ...prev, [key]: value }))
  }

  const applyPalette = (palette: (typeof COLOR_PALETTES)[number]) => {
    setBranding((prev) => ({
      ...prev,
      primary_color: palette.primary,
      secondary_color: palette.secondary,
      accent_color: palette.accent,
    }))
  }

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="space-y-2 mb-8">
          <div className="h-8 w-64 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-96 bg-zinc-800/60 rounded animate-pulse" />
        </div>
        <div className="flex gap-6">
          <div className="flex-1 space-y-6">
            <div className="h-12 w-full bg-zinc-800/40 rounded-lg animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
                <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-zinc-800/40 rounded-lg animate-pulse" />
                  <div className="h-32 bg-zinc-800/40 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden lg:block w-72">
            <div className="h-80 bg-zinc-800/40 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header — sticky para que el botón Guardar siempre esté accesible en mobile */}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 md:py-4 mb-6 md:mb-8 bg-zinc-950/85 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/70 border-b border-zinc-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-zinc-100">Branding</h1>
            <p className="hidden sm:block text-zinc-400 text-sm mt-1">
              Configura la identidad visual de tu marca para tu tienda y materiales.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {isDirty && (
              <span className="text-xs text-amber-400/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Sin guardar
              </span>
            )}
            {tenantSlug && (
              <Link
                href={`/p/${tenantSlug}`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ver mi storefront</span>
                <span className="sm:hidden">Ver tienda</span>
              </Link>
            )}
            <Button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="min-w-[120px] sm:min-w-[140px] bg-violet-600 hover:bg-violet-500 text-white disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile preview toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setPreviewOpen(!previewOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-sm text-zinc-300 hover:border-zinc-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-zinc-500" />
            Vista previa en vivo
          </span>
          {previewOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {previewOpen && (
          <div className="mt-3">
            <LivePreview branding={branding} slug={tenantSlug} />
          </div>
        )}
      </div>

      {/* Main content: tabs + preview */}
      <div className="flex gap-6 items-start">
        {/* Left: tabs */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="visual" className="w-full">
            <TabsList className="w-full bg-zinc-900 border border-zinc-800 rounded-xl h-12 p-1 mb-6">
              <TabsTrigger
                value="visual"
                className="flex-1 rounded-lg data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-300 data-[state=active]:shadow-none text-zinc-400 gap-2 h-full"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Identidad Visual</span>
                <span className="sm:hidden">Visual</span>
              </TabsTrigger>
              <TabsTrigger
                value="colors"
                className="flex-1 rounded-lg data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-300 data-[state=active]:shadow-none text-zinc-400 gap-2 h-full"
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Colores y tipografia</span>
                <span className="sm:hidden">Colores</span>
              </TabsTrigger>
              <TabsTrigger
                value="texts"
                className="flex-1 rounded-lg data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-300 data-[state=active]:shadow-none text-zinc-400 gap-2 h-full"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Textos de marca</span>
                <span className="sm:hidden">Textos</span>
              </TabsTrigger>
            </TabsList>

            {/* ============================================================ */}
            {/* Tab 1: Identidad Visual                                       */}
            {/* ============================================================ */}
            <TabsContent value="visual">
              <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl">
                <CardContent className="p-6 space-y-6">
                  <div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 mb-1">Imagenes de tu marca</h3>
                    <p className="text-xs text-zinc-500">
                      Subi tu logo, banner y hero. Arrastra o hace click en cada area.
                    </p>
                  </div>

                  {/* Logo */}
                  <div>
                    <Label className="text-zinc-300 mb-2 block">Logo</Label>
                    <ImageUpload
                      value={branding.logo_url || null}
                      onChange={(url) => updateField('logo_url', url || '')}
                      type="logo"
                      className="max-w-[96px] [&_div]:h-24 [&_img]:h-24"
                    />
                  </div>

                  {/* Banner */}
                  <div>
                    <Label className="text-zinc-300 mb-2 block">Banner</Label>
                    <ImageUpload
                      value={branding.banner_url || null}
                      onChange={(url) => updateField('banner_url', url || '')}
                      type="banner"
                      className="[&_div]:h-40 [&_img]:h-40"
                    />
                  </div>

                  {/* Hero */}
                  <div>
                    <Label className="text-zinc-300 mb-2 block">Imagen hero</Label>
                    <ImageUpload
                      value={branding.hero_url || null}
                      onChange={(url) => updateField('hero_url', url || '')}
                      type="hero"
                      className="[&_div]:h-[200px] [&_img]:h-[200px]"
                    />
                  </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============================================================ */}
            {/* Tab 2: Colores y tipografia                                   */}
            {/* ============================================================ */}
            <TabsContent value="colors">
              <div className="space-y-6">
                {/* Color palettes */}
                <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Paletas predefinidas</h3>
                      <p className="text-xs text-zinc-500">
                        Elegi una paleta base y personaliza los colores abajo.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {COLOR_PALETTES.map((palette, i) => {
                        const Icon = PALETTE_ICONS[i]
                        const isActive =
                          branding.primary_color === palette.primary &&
                          branding.secondary_color === palette.secondary &&
                          branding.accent_color === palette.accent
                        return (
                          <button
                            key={palette.name}
                            onClick={() => applyPalette(palette)}
                            className={`group relative flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-200 ${
                              isActive
                                ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/30'
                                : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-800/40'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
                            <div className="flex gap-1.5">
                              <span className="w-5 h-5 rounded-full border border-zinc-700/50 shadow-sm" style={{ backgroundColor: palette.primary }} />
                              <span className="w-5 h-5 rounded-full border border-zinc-700/50 shadow-sm" style={{ backgroundColor: palette.secondary }} />
                              <span className="w-5 h-5 rounded-full border border-zinc-700/50 shadow-sm" style={{ backgroundColor: palette.accent }} />
                            </div>
                            <span className={`text-xs font-medium ${isActive ? 'text-violet-300' : 'text-zinc-400'}`}>
                              {palette.name}
                            </span>
                            {isActive && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Manual color pickers */}
                <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-200">Colores personalizados</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {([
                        { key: 'primary_color' as const, label: 'Primario' },
                        { key: 'secondary_color' as const, label: 'Secundario' },
                        { key: 'accent_color' as const, label: 'Acento' },
                      ]).map(({ key, label }) => (
                        <div key={key} className="space-y-2">
                          <Label className="text-zinc-400 text-xs">{label}</Label>
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <input
                                type="color"
                                value={branding[key]}
                                onChange={(e) => updateField(key, e.target.value)}
                                className="w-10 h-10 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-md [&::-moz-color-swatch]:rounded-md"
                              />
                            </div>
                            <Input
                              value={branding[key]}
                              onChange={(e) => {
                                const val = e.target.value
                                if (/^#[0-9a-fA-F]{0,6}$/.test(val) || val === '') {
                                  updateField(key, val)
                                }
                              }}
                              maxLength={7}
                              className="bg-zinc-800/50 border-zinc-700 text-zinc-100 font-mono text-sm flex-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Font selection with preview */}
                <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Tipografia</h3>
                      <p className="text-xs text-zinc-500">Selecciona la fuente que mejor represente tu marca.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {FONT_OPTIONS.map((font) => {
                        const isActive = branding.font_preference === font.value
                        return (
                          <button
                            key={font.value}
                            onClick={() => updateField('font_preference', font.value)}
                            className={`group text-left p-4 rounded-xl border transition-all duration-200 ${
                              isActive
                                ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/30'
                                : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-800/40'
                            }`}
                          >
                            <p className={`text-xs mb-2 ${isActive ? 'text-violet-400' : 'text-zinc-500'}`}>
                              {font.label}
                            </p>
                            <p
                              className={`text-xl font-semibold ${isActive ? 'text-zinc-100' : 'text-zinc-300'}`}
                              style={{ fontFamily: font.family }}
                            >
                              Novamente
                            </p>
                            <p
                              className="text-xs text-zinc-500 mt-1"
                              style={{ fontFamily: font.family }}
                            >
                              AaBbCc 123
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Visual style */}
                <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-1">Estilo visual</h3>
                      <p className="text-xs text-zinc-500">Define la personalidad visual de tu tienda.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {STYLE_OPTIONS.map((style) => {
                        const Icon = style.icon
                        const isActive = branding.visual_style === style.value
                        return (
                          <button
                            key={style.value}
                            onClick={() => updateField('visual_style', style.value)}
                            className={`group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                              isActive
                                ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/30'
                                : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-800/40'
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-400'}`}
                            />
                            <span className={`text-sm font-medium ${isActive ? 'text-violet-300' : 'text-zinc-300'}`}>
                              {style.label}
                            </span>
                            <span className="text-xs text-zinc-500">{style.desc}</span>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ============================================================ */}
            {/* Tab 3: Textos de marca                                        */}
            {/* ============================================================ */}
            <TabsContent value="texts">
              <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 mb-1">Textos de tu marca</h3>
                    <p className="text-xs text-zinc-500">
                      Defini los textos que van a representar tu marca en la tienda.
                    </p>
                  </div>

                  {/* Tagline */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tagline" className="text-zinc-300">Tagline</Label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            updateField('tagline', 'Disenos que cuentan tu historia')
                          }}
                          className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          Generar con IA
                        </button>
                        <span className={`text-xs tabular-nums ${branding.tagline.length > 80 ? 'text-red-400' : 'text-zinc-500'}`}>
                          {branding.tagline.length}/80
                        </span>
                      </div>
                    </div>
                    <Input
                      id="tagline"
                      placeholder="Tu frase de marca que te distingue"
                      value={branding.tagline}
                      onChange={(e) => {
                        if (e.target.value.length <= 80) {
                          updateField('tagline', e.target.value)
                        }
                      }}
                      className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>

                  {/* About */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="about_text" className="text-zinc-300">Acerca de tu marca</Label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            updateField('about_text', 'Somos una marca que combina diseno, calidad y personalidad. Cada producto es una pieza unica pensada para quienes buscan expresarse a traves de lo que visten.')
                          }}
                          className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          Generar con IA
                        </button>
                        <span className={`text-xs tabular-nums ${branding.about_text.length > 500 ? 'text-red-400' : 'text-zinc-500'}`}>
                          {branding.about_text.length}/500
                        </span>
                      </div>
                    </div>
                    <Textarea
                      id="about_text"
                      placeholder="Conta la historia de tu marca, que te hace unico..."
                      value={branding.about_text}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) {
                          updateField('about_text', e.target.value)
                        }
                      }}
                      rows={5}
                      className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 resize-none"
                    />
                  </div>

                  {/* CTA text + URL side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cta_text" className="text-zinc-300">
                        <Megaphone className="w-3.5 h-3.5 inline mr-1.5 text-zinc-500" />
                        Texto del CTA
                      </Label>
                      <Input
                        id="cta_text"
                        placeholder="Ej: Escribinos por WhatsApp"
                        value={branding.cta_text}
                        onChange={(e) => updateField('cta_text', e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                      />
                      <p className="text-[11px] text-zinc-500">El texto del botón que ve el visitante en tu tienda.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cta_url" className="text-zinc-300">URL del CTA</Label>
                      <Input
                        id="cta_url"
                        placeholder="https://wa.me/549... o https://instagram.com/tumarca"
                        value={branding.cta_url}
                        onChange={(e) => updateField('cta_url', e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                      />
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        A dónde llevás al visitante que aprieta el botón. Ej: tu WhatsApp
                        (<span className="text-zinc-400">wa.me/549…</span>), tu Instagram, un formulario.
                        {tenantSlug && branding.cta_url && (branding.cta_url.toLowerCase().includes(`/p/${tenantSlug}`) || branding.cta_url.toLowerCase().includes(`/merch/${tenantSlug}`)) && (
                          <span className="block mt-1 text-amber-400">
                            ⚠️ Esta URL apunta a tu propia tienda. El botón llevaría al visitante a la misma página — usá algo externo (WhatsApp, IG, formulario).
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: live preview (desktop only) */}
        <div className="hidden lg:block w-72 shrink-0 sticky top-6">
          <LivePreview branding={branding} slug={tenantSlug} />
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all animate-in slide-in-from-bottom-4 fade-in duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-200 border border-emerald-800'
              : 'bg-red-950/95 text-red-200 border border-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-400" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  )
}
