'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { trackGenerateLead } from '@/lib/analytics'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, ArrowRight, Check, Upload, Globe, Palette,
  Store, Layers, ShoppingBag, Megaphone, Eye, Sparkles,
  Instagram, MessageCircle, Mail, FileSpreadsheet, Plus,
  Image as ImageIcon, Wand2, Loader2, CreditCard, Zap,
  Crown, Rocket,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductEntry {
  name: string
  description: string
  price: string
  imageUrl: string
}

interface BrandKit {
  name: string | null
  description: string | null
  logo: string | null
  images: string[]
  colors: { primary: string | null; secondary: string | null; accent: string | null; background: string | null; text: string | null; all: string[] }
  font: string | null
  fonts: string[]
  socialLinks: Record<string, string>
  instagram: string | null
  tagline: string | null
  businessOverview: string | null
  brandTone: string | null
  suggestedStyle: string | null
  colorScheme: string | null
}

interface WizardData {
  // Step 1
  businessName: string
  email: string
  whatsapp: string
  country: string
  currency: string
  industry: string
  website: string
  instagram: string
  shortDescription: string
  seoTitle: string
  seoDescription: string
  // Step 2
  logoFile: File | null
  logoPreview: string
  bannerFile: File | null
  bannerPreview: string
  colorPrimary: string
  colorSecondary: string
  colorAccent: string
  colorBackground: string
  fontPreference: string
  tagline: string
  aboutText: string
  extractUrl: string
  inspirationUrl: string
  brandKit: BrandKit | null
  // Step 3
  partnerType: 'catalog_only' | 'catalog_mockups' | 'catalog_design_engine'
  // Step 4
  visualStyle: string
  // Step 5
  catalogMode: 'later' | 'manual' | 'csv'
  manualProduct: ProductEntry
  csvFile: File | null
  // Step 6
  channels: {
    leads: boolean
    quote: boolean
    sample: boolean
    whatsapp: boolean
    externalBuy: boolean
  }
  salesWhatsapp: string
  // Step 7 (Plan)
  selectedPlan: 'starter' | 'growth' | 'pro'
  billingCycle: 'monthly' | 'annual'
  // Step Brief
  briefBusinessType: string
  briefHasLogo: 'si' | 'no' | ''
  briefDesignStyle: string
  briefProductCount: string
  // Onboarding state
  tenantId: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEP_TITLES = [
  'Datos basicos',
  'Identidad visual',
  'Plan',
  'Brief de tu negocio',
  'Preview y publicar',
]

const STEP_ICONS = [Store, Palette, CreditCard, Layers, Eye]

const PARTNER_TYPES = [
  {
    value: 'catalog_only' as const,
    label: 'Solo catalogo fijo',
    description: 'Tus productos con fotos y precios. Sin generacion de disenos.',
  },
  {
    value: 'catalog_mockups' as const,
    label: 'Catalogo + Mockups',
    description: 'Catalogo con mockups automaticos de tus disenos sobre las prendas.',
  },
  {
    value: 'catalog_design_engine' as const,
    label: 'Catalogo + Design Engine completo',
    description: 'Todo incluido: catalogo, mockups y generacion de disenos con IA.',
  },
]

const VISUAL_STYLES = [
  { id: 'minimal', name: 'Minimal', description: 'Limpio, espacioso, tipografia fina' },
  { id: 'bold', name: 'Bold', description: 'Impactante, alto contraste, tipografia gruesa' },
  { id: 'editorial', name: 'Editorial', description: 'Elegante, inspirado en revistas de moda' },
  { id: 'sport', name: 'Sport', description: 'Dinamico, energetico, colores vibrantes' },
  { id: 'corporate', name: 'Corporate', description: 'Profesional, sobrio, confiable' },
  { id: 'urbano', name: 'Urbano', description: 'Streetwear, cultura urbana, raw' },
  { id: 'creativo', name: 'Creativo', description: 'Artistico, experimental, unico' },
]

const CHANNEL_OPTIONS = [
  { key: 'leads' as const, label: 'Captura de leads', description: 'Formulario de contacto en tu storefront' },
  { key: 'quote' as const, label: 'Pedido de presupuesto', description: 'Los clientes piden cotizacion online' },
  { key: 'sample' as const, label: 'Pedido de muestra', description: 'Opcion de pedir muestra fisica' },
  { key: 'whatsapp' as const, label: 'Boton de WhatsApp', description: 'Chat directo desde la storefront' },
  { key: 'externalBuy' as const, label: 'Compra externa', description: 'Link a tu tienda o MercadoShops' },
]

const DEFAULT_DATA: WizardData = {
  businessName: '',
  email: '',
  whatsapp: '',
  country: 'AR',
  currency: 'ARS',
  industry: '',
  website: '',
  instagram: '',
  shortDescription: '',
  seoTitle: '',
  seoDescription: '',
  logoFile: null,
  logoPreview: '',
  bannerFile: null,
  bannerPreview: '',
  colorPrimary: '#8b5cf6',
  colorSecondary: '#1e1e2e',
  colorAccent: '#ec4899',
  colorBackground: '#09090b',
  fontPreference: '',
  tagline: '',
  aboutText: '',
  extractUrl: '',
  inspirationUrl: '',
  brandKit: null,
  partnerType: 'catalog_mockups',
  visualStyle: 'minimal',
  catalogMode: 'later',
  manualProduct: { name: '', description: '', price: '', imageUrl: '' },
  csvFile: null,
  channels: { leads: true, quote: true, sample: false, whatsapp: true, externalBuy: false },
  salesWhatsapp: '',
  selectedPlan: 'starter',
  billingCycle: 'monthly',
  briefBusinessType: '',
  briefHasLogo: '',
  briefDesignStyle: '',
  briefProductCount: '',
  tenantId: null,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  const pct = ((current + 1) / total) * 100
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-400">
          Paso {current + 1} de {total}
        </span>
        <span className="text-sm font-medium text-purple-400">
          {STEP_TITLES[current]}
        </span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Step dots */}
      <div className="flex justify-between mt-3">
        {STEP_TITLES.map((_, i) => {
          const Icon = STEP_ICONS[i]
          const done = i < current
          const active = i === current
          return (
            <div
              key={i}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                done
                  ? 'bg-purple-500 text-white'
                  : active
                    ? 'bg-purple-500/20 text-purple-400 ring-2 ring-purple-500'
                    : 'bg-zinc-800 text-zinc-600'
              }`}
            >
              {done ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FileUploadBox({
  label,
  preview,
  onSelect,
  uploading,
  accept = 'image/*',
}: {
  label: string
  preview: string
  onSelect: (file: File, preview: string) => void
  uploading?: boolean
  accept?: string
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onSelect(file, url)
  }

  return (
    <label className="group cursor-pointer block">
      <div
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all h-36 ${
          preview
            ? 'border-purple-500/50 bg-purple-500/5'
            : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-900'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
            <span className="text-sm text-purple-400">Subiendo...</span>
          </div>
        ) : preview ? (
          <img
            src={preview}
            alt={label}
            className="w-full h-full object-contain rounded-xl p-2"
          />
        ) : (
          <>
            <Upload className="w-8 h-8 text-zinc-500 group-hover:text-zinc-400 mb-2 transition-colors" />
            <span className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
              {label}
            </span>
          </>
        )}
      </div>
      <input type="file" accept={accept} className="hidden" onChange={handleChange} disabled={uploading} />
    </label>
  )
}

// Upload file to R2 immediately during onboarding
async function uploadOnboardingFile(file: File, type: 'logo' | 'banner'): Promise<string | null> {
  try {
    const sessionId = sessionStorage.getItem('nv_onboarding_session')
      || Math.random().toString(36).slice(2)
    sessionStorage.setItem('nv_onboarding_session', sessionId)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    formData.append('sessionId', sessionId)

    const res = await fetch('/api/partners/onboarding/upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) return null
    const { url } = await res.json()
    return url
  } catch {
    return null
  }
}

// localStorage persistence for wizard progress
const STORAGE_KEY = 'novamente_onboarding_progress'
const STORAGE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function saveWizardProgress(step: number, data: WizardData) {
  try {
    // Exclude File objects from localStorage (not serializable)
    const serializable = {
      ...data,
      logoFile: null,
      bannerFile: null,
      csvFile: null,
      manualProduct: data.manualProduct,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      step,
      data: serializable,
      updatedAt: new Date().toISOString(),
    }))
  } catch {}
}

function loadWizardProgress(): { step: number; data: Partial<WizardData> } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const updatedAt = new Date(parsed.updatedAt).getTime()
    if (Date.now() - updatedAt > STORAGE_MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function clearWizardProgress() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="relative w-10 h-10 rounded-lg overflow-hidden cursor-pointer border border-zinc-700 hover:border-zinc-500 transition-colors">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
        />
        <div className="w-full h-full" style={{ backgroundColor: value }} />
      </label>
      <div>
        <span className="text-sm text-zinc-300">{label}</span>
        <span className="block text-xs text-zinc-500 font-mono">{value}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

function StepDatosBasicos({
  data,
  update,
}: {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}) {
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extracted, setExtracted] = useState(false)

  const handleExtractFromWebsite = async () => {
    const targetUrl = data.website.trim()
    if (!targetUrl) return
    setExtracting(true)
    setExtractError(null)
    try {
      const res = await fetch('/api/partners/onboarding/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, mode: 'brand' }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setExtractError(json.error || 'No se pudo analizar el sitio')
        return
      }
      const kit: BrandKit = json.extracted
      update({ brandKit: kit })

      // Auto-fill ALL fields from extraction
      const patch: Partial<WizardData> = {}
      if (kit.name && !data.businessName) patch.businessName = kit.name
      if (kit.description && !data.shortDescription) patch.shortDescription = kit.description.slice(0, 280)
      if (kit.instagram && !data.instagram) patch.instagram = `@${kit.instagram}`
      if (kit.colors.primary) patch.colorPrimary = kit.colors.primary
      if (kit.colors.secondary) patch.colorSecondary = kit.colors.secondary
      if (kit.colors.accent) patch.colorAccent = kit.colors.accent
      if (kit.colors.background) patch.colorBackground = kit.colors.background
      if (kit.logo) patch.logoPreview = kit.logo
      if (kit.font) patch.fontPreference = kit.font
      if (kit.tagline) patch.tagline = kit.tagline
      if (kit.businessOverview) patch.aboutText = kit.businessOverview
      if (kit.suggestedStyle) patch.visualStyle = kit.suggestedStyle
      if (kit.businessOverview && !data.seoDescription) patch.seoDescription = kit.businessOverview.slice(0, 160)

      update(patch)
      setExtracted(true)
    } catch {
      setExtractError('Error de conexion')
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Brand DNA extraction — prominent at the top */}
      <div className={`p-5 rounded-2xl border-2 border-dashed transition-all ${
        extracted
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5'
      }`}>
        <h3 className="text-base font-semibold text-zinc-100 mb-1 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-purple-400" />
          {extracted ? 'Identidad extraida' : '¿Ya tenes web? Extraemos todo automaticamente'}
        </h3>
        <p className="text-xs text-zinc-500 mb-3">
          {extracted
            ? 'Revisá los datos y ajustá lo que necesites. Todos los campos se llenaron con la info de tu sitio.'
            : 'Pegá la URL de tu sitio y extraemos nombre, logo, colores, tipografia, tagline, redes y mas con IA.'
          }
        </p>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://mimarca.com"
            value={data.website}
            onChange={(e) => { update({ website: e.target.value }); if (extracted) setExtracted(false) }}
            className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleExtractFromWebsite() } }}
          />
          <Button
            variant="outline"
            className={`shrink-0 ${
              extracted
                ? 'border-emerald-500/40 text-emerald-300 hover:text-white hover:bg-emerald-500/20'
                : 'border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-500/20'
            }`}
            onClick={handleExtractFromWebsite}
            disabled={extracting || !data.website.trim()}
          >
            {extracting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Analizando...
              </>
            ) : extracted ? (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Extraido
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-1.5" />
                Extraer ADN
              </>
            )}
          </Button>
        </div>
        {extractError && (
          <p className="text-xs text-amber-400 mt-2">{extractError}</p>
        )}
        {extracting && (
          <div className="mt-3 flex items-center gap-2 text-xs text-purple-300">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse [animation-delay:200ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse [animation-delay:400ms]" />
            </div>
            Sacando screenshot, leyendo contenido y analizando con IA...
          </div>
        )}
      </div>

      {/* Brand Kit Preview if extracted */}
      {data.brandKit && <BrandKitPreview kit={data.brandKit} onApply={(field, value) => update({ [field]: value } as Partial<WizardData>)} />}

      <Separator className="bg-zinc-800" />

      <div>
        <Label className="text-zinc-300">Nombre comercial *</Label>
        <Input
          placeholder="Mi Marca"
          value={data.businessName}
          onChange={(e) => update({ businessName: e.target.value })}
          className="mt-1.5 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-zinc-300">
            <Mail className="inline w-3.5 h-3.5 mr-1" />
            Email *
          </Label>
          <Input
            type="email"
            placeholder="hola@mimarca.com"
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
            className="mt-1.5 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
          />
        </div>
        <div>
          <Label className="text-zinc-300">
            <MessageCircle className="inline w-3.5 h-3.5 mr-1" />
            WhatsApp *
          </Label>
          <Input
            type="tel"
            placeholder="+54 11 1234 5678"
            value={data.whatsapp}
            onChange={(e) => update({ whatsapp: e.target.value })}
            className="mt-1.5 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-zinc-300">Pais</Label>
          <Input
            value={data.country}
            onChange={(e) => update({ country: e.target.value })}
            className="mt-1.5 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
          />
        </div>
        <div>
          <Label className="text-zinc-300">Moneda</Label>
          <Input
            value={data.currency}
            onChange={(e) => update({ currency: e.target.value })}
            className="mt-1.5 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
          />
        </div>
      </div>

      <div>
        <Label className="text-zinc-300">Rubro / Industria</Label>
        <Input
          placeholder="Ej: Cerveceria artesanal, Gym, Estudio creativo..."
          value={data.industry}
          onChange={(e) => update({ industry: e.target.value })}
          className="mt-1.5 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
        />
      </div>

      <div>
        <Label className="text-zinc-300">
          <Instagram className="inline w-3.5 h-3.5 mr-1" />
          Instagram
        </Label>
        <Input
          placeholder="@mimarca"
          value={data.instagram}
          onChange={(e) => update({ instagram: e.target.value })}
          className="mt-1.5 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
        />
      </div>

      <div>
        <Label className="text-zinc-300">Descripcion corta</Label>
        <Textarea
          placeholder="Conta en una o dos oraciones de que se trata tu marca..."
          value={data.shortDescription}
          onChange={(e) => update({ shortDescription: e.target.value })}
          className="mt-1.5 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500 min-h-[80px]"
          maxLength={280}
        />
        <span className="text-xs text-zinc-600 mt-1 block text-right">
          {data.shortDescription.length}/280
        </span>
      </div>

      <Separator className="bg-zinc-800" />

      <div>
        <Label className="text-zinc-300">Titulo para buscadores (opcional)</Label>
        <Input
          placeholder={data.businessName ? `${data.businessName} — Merch en Novamente` : 'Mi Marca — Merch en Novamente'}
          value={data.seoTitle}
          onChange={(e) => update({ seoTitle: e.target.value.slice(0, 60) })}
          maxLength={60}
          className="mt-1.5 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
        />
        <span className={`text-xs mt-1 block text-right ${data.seoTitle.length > 50 ? 'text-amber-400' : 'text-zinc-600'}`}>
          {data.seoTitle.length}/60
        </span>
      </div>

      <div>
        <Label className="text-zinc-300">Descripcion para buscadores (opcional)</Label>
        <Textarea
          placeholder={data.businessName ? `Descubri los productos de ${data.businessName} en Novamente. Merch premium con diseno unico.` : ''}
          value={data.seoDescription}
          onChange={(e) => update({ seoDescription: e.target.value.slice(0, 160) })}
          maxLength={160}
          className="mt-1.5 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500 min-h-[60px]"
        />
        <span className={`text-xs mt-1 block text-right ${data.seoDescription.length > 140 ? 'text-amber-400' : 'text-zinc-600'}`}>
          {data.seoDescription.length}/160
        </span>
      </div>
    </div>
  )
}

function BrandKitPreview({ kit, onApply }: { kit: BrandKit; onApply: (field: string, value: string) => void }) {
  return (
    <div className="space-y-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
      <div className="flex items-center gap-2 mb-1">
        <Check className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-emerald-300">Brand Kit extraido</h3>
      </div>

      {/* Colors row */}
      {kit.colors.all.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-2">Colores detectados — click para aplicar</p>
          <div className="flex flex-wrap gap-2">
            {kit.colors.all.map((color, i) => (
              <button
                key={`${color}-${i}`}
                type="button"
                onClick={() => {
                  if (i === 0) onApply('colorPrimary', color)
                  else if (i === 1) onApply('colorSecondary', color)
                  else if (i === 2) onApply('colorAccent', color)
                }}
                className="group relative w-10 h-10 rounded-lg border border-zinc-700 hover:border-zinc-500 transition-all hover:scale-110"
                style={{ backgroundColor: color }}
                title={color}
              >
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {color}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Font */}
      {kit.font && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">Tipografia:</span>
          <button
            type="button"
            onClick={() => onApply('fontPreference', kit.font!)}
            className="text-sm text-zinc-200 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            {kit.font}
          </button>
        </div>
      )}

      {/* Tagline */}
      {kit.tagline && (
        <div className="flex items-start gap-3">
          <span className="text-xs text-zinc-500 shrink-0 pt-0.5">Tagline:</span>
          <button
            type="button"
            onClick={() => onApply('tagline', kit.tagline!)}
            className="text-sm text-zinc-300 text-left hover:text-zinc-100 transition-colors"
          >
            &ldquo;{kit.tagline}&rdquo;
          </button>
        </div>
      )}

      {/* Business overview */}
      {kit.businessOverview && (
        <div className="flex items-start gap-3">
          <span className="text-xs text-zinc-500 shrink-0 pt-0.5">Resumen:</span>
          <button
            type="button"
            onClick={() => onApply('aboutText', kit.businessOverview!)}
            className="text-sm text-zinc-400 text-left hover:text-zinc-200 transition-colors line-clamp-3"
          >
            {kit.businessOverview}
          </button>
        </div>
      )}

      {/* Brand tone + suggested style */}
      <div className="flex flex-wrap gap-3">
        {kit.brandTone && (
          <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            Tono: {kit.brandTone}
          </span>
        )}
        {kit.suggestedStyle && (
          <button
            type="button"
            onClick={() => onApply('visualStyle', kit.suggestedStyle!)}
            className="text-xs px-2 py-1 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20 hover:bg-pink-500/20 transition-colors"
          >
            Estilo sugerido: {kit.suggestedStyle}
          </button>
        )}
      </div>

      {/* Instagram */}
      {kit.instagram && (
        <div className="flex items-center gap-3">
          <Instagram className="w-3.5 h-3.5 text-zinc-500" />
          <button
            type="button"
            onClick={() => onApply('instagram', `@${kit.instagram}`)}
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            @{kit.instagram}
          </button>
        </div>
      )}

      {/* Logo preview */}
      {kit.logo && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">Logo:</span>
          <button
            type="button"
            onClick={() => onApply('logoPreview', kit.logo!)}
            className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-500 overflow-hidden transition-all hover:scale-105"
          >
            <img src={kit.logo} alt="Logo" className="w-full h-full object-contain p-1" />
          </button>
        </div>
      )}
    </div>
  )
}

function StepIdentidadVisual({
  data,
  update,
}: {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}) {
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extractingInspiration, setExtractingInspiration] = useState(false)

  const handleLogoSelect = async (file: File, preview: string) => {
    update({ logoFile: file, logoPreview: preview })
    setUploadingLogo(true)
    const url = await uploadOnboardingFile(file, 'logo')
    setUploadingLogo(false)
    if (url) update({ logoPreview: url })
  }

  const handleBannerSelect = async (file: File, preview: string) => {
    update({ bannerFile: file, bannerPreview: preview })
    setUploadingBanner(true)
    const url = await uploadOnboardingFile(file, 'banner')
    setUploadingBanner(false)
    if (url) update({ bannerPreview: url })
  }

  const handleExtract = async (urlField: 'extractUrl' | 'inspirationUrl') => {
    const targetUrl = urlField === 'extractUrl' ? data.extractUrl : data.inspirationUrl
    if (!targetUrl.trim()) return
    const mode = urlField === 'inspirationUrl' ? 'inspiration' : 'brand'
    const setLoading = urlField === 'extractUrl' ? setExtracting : setExtractingInspiration
    setLoading(true)
    setExtractError(null)
    try {
      const res = await fetch('/api/partners/onboarding/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, mode }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setExtractError(json.error || 'No se pudo extraer')
        return
      }
      const kit: BrandKit = json.extracted
      update({ brandKit: kit })

      // Auto-apply key fields
      const patch: Partial<WizardData> = {}
      if (kit.colors.primary) patch.colorPrimary = kit.colors.primary
      if (kit.colors.secondary) patch.colorSecondary = kit.colors.secondary
      if (kit.colors.accent) patch.colorAccent = kit.colors.accent
      if (kit.colors.background) patch.colorBackground = kit.colors.background
      if (kit.logo) patch.logoPreview = kit.logo
      if (kit.font) patch.fontPreference = kit.font
      if (kit.tagline) patch.tagline = kit.tagline
      if (kit.businessOverview) patch.aboutText = kit.businessOverview
      if (kit.suggestedStyle) patch.visualStyle = kit.suggestedStyle

      if (mode === 'brand') {
        if (kit.name && !data.businessName) patch.businessName = kit.name
        if (kit.description && !data.shortDescription) patch.shortDescription = kit.description.slice(0, 280)
        if (kit.instagram && !data.instagram) patch.instagram = `@${kit.instagram}`
      }

      update(patch)
    } catch {
      setExtractError('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  const handleKitApply = (field: string, value: string) => {
    update({ [field]: value } as Partial<WizardData>)
  }

  return (
    <div className="space-y-6">
      {/* Brand Kit Preview if already extracted in Step 1 */}
      {data.brandKit && <BrandKitPreview kit={data.brandKit} onApply={handleKitApply} />}

      {/* Inspiration URL — copy style from another page */}
      <div className="p-4 rounded-xl border border-dashed border-pink-500/20 bg-pink-500/5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-1">
          <Sparkles className="w-4 h-4 inline mr-1.5 text-pink-400" />
          Copiar estética de otra página
        </h3>
        <p className="text-xs text-zinc-500 mb-3">
          Pega la URL de una pagina que te guste y copiamos su estilo visual para tu storefront.
        </p>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="pagina-que-me-gusta.com"
            value={data.inspirationUrl}
            onChange={(e) => update({ inspirationUrl: e.target.value })}
            className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-pink-500"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleExtract('inspirationUrl') } }}
          />
          <Button
            variant="outline"
            className="border-pink-500/30 text-pink-300 hover:text-white hover:bg-pink-500/20 shrink-0"
            onClick={() => handleExtract('inspirationUrl')}
            disabled={extractingInspiration || !data.inspirationUrl.trim()}
          >
            {extractingInspiration ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
            {extractingInspiration ? 'Analizando...' : 'Copiar estilo'}
          </Button>
        </div>
      </div>

      {extractError && (
        <p className="text-xs text-amber-400 px-1">{extractError}</p>
      )}

      <Separator className="bg-zinc-800" />

      {/* Logo + Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FileUploadBox
          label="Subir logo"
          preview={data.logoPreview}
          onSelect={handleLogoSelect}
          uploading={uploadingLogo}
        />
        <FileUploadBox
          label="Subir banner / hero"
          preview={data.bannerPreview}
          onSelect={handleBannerSelect}
          uploading={uploadingBanner}
        />
      </div>

      <Separator className="bg-zinc-800" />

      {/* Colors */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">Colores de marca</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ColorPicker label="Primario" value={data.colorPrimary} onChange={(v) => update({ colorPrimary: v })} />
          <ColorPicker label="Secundario" value={data.colorSecondary} onChange={(v) => update({ colorSecondary: v })} />
          <ColorPicker label="Acento" value={data.colorAccent} onChange={(v) => update({ colorAccent: v })} />
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Font + Tagline */}
      <div className="space-y-4">
        <div>
          <Label className="text-zinc-300">Tipografia preferida</Label>
          <Input
            placeholder="Inter, Roboto, Poppins..."
            value={data.fontPreference}
            onChange={(e) => update({ fontPreference: e.target.value })}
            className="mt-1.5 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
          />
        </div>
        <div>
          <Label className="text-zinc-300">Tagline / eslogan</Label>
          <Input
            placeholder="Tu frase que resume la marca"
            value={data.tagline}
            onChange={(e) => update({ tagline: e.target.value })}
            className="mt-1.5 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
            maxLength={120}
          />
        </div>
        <div>
          <Label className="text-zinc-300">Sobre tu marca (aparece en tu storefront)</Label>
          <Textarea
            placeholder="Conta de que se trata tu marca, tu propuesta de valor..."
            value={data.aboutText}
            onChange={(e) => update({ aboutText: e.target.value })}
            className="mt-1.5 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500 min-h-[80px]"
            maxLength={500}
          />
          <span className="text-xs text-zinc-600 mt-1 block text-right">{data.aboutText.length}/500</span>
        </div>
      </div>
    </div>
  )
}

function StepTipoPartner({
  data,
  update,
}: {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400 mb-2">
        Selecciona el tipo de storefront que mejor se adapte a tu marca.
      </p>
      <RadioGroup
        value={data.partnerType}
        onValueChange={(v) => update({ partnerType: v as WizardData['partnerType'] })}
        className="grid gap-4"
      >
        {PARTNER_TYPES.map((pt) => {
          const selected = data.partnerType === pt.value
          return (
            <label
              key={pt.value}
              className={`flex items-start gap-4 p-5 rounded-xl border cursor-pointer transition-all ${
                selected
                  ? 'border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/5'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <RadioGroupItem value={pt.value} className="mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-100">{pt.label}</span>
                <p className="text-sm text-zinc-400 mt-1">{pt.description}</p>
              </div>
            </label>
          )
        })}
      </RadioGroup>
    </div>
  )
}

function StepEstiloVisual({
  data,
  update,
}: {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400 mb-2">
        Elegí el estilo visual que mejor represente tu marca. Esto define la estetica de tu storefront.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {VISUAL_STYLES.map((style) => {
          const selected = data.visualStyle === style.id
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => update({ visualStyle: style.id })}
              className={`p-4 rounded-xl border text-left transition-all ${
                selected
                  ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${
                  selected ? 'bg-purple-500/20' : 'bg-zinc-800'
                }`}
              >
                <Palette className={`w-5 h-5 ${selected ? 'text-purple-400' : 'text-zinc-500'}`} />
              </div>
              <h4 className={`font-semibold text-sm ${selected ? 'text-purple-300' : 'text-zinc-200'}`}>
                {style.name}
              </h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{style.description}</p>
              {selected && (
                <div className="mt-2">
                  <Check className="w-4 h-4 text-purple-400" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepCatalogo({
  data,
  update,
}: {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Carga tus productos ahora o hacelo despues desde el panel.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { mode: 'later' as const, label: 'Cargo despues', icon: ArrowRight },
          { mode: 'manual' as const, label: 'Cargar manual', icon: Plus },
          { mode: 'csv' as const, label: 'Importar CSV', icon: FileSpreadsheet },
        ].map(({ mode, label, icon: Icon }) => {
          const active = data.catalogMode === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => update({ catalogMode: mode })}
              className={`p-4 rounded-xl border text-center transition-all ${
                active
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${active ? 'text-purple-400' : 'text-zinc-500'}`} />
              <span className={`text-sm font-medium ${active ? 'text-purple-300' : 'text-zinc-300'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {data.catalogMode === 'manual' && (
        <div className="space-y-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <h4 className="text-sm font-semibold text-zinc-300">Agregar producto</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400 text-xs">Nombre</Label>
              <Input
                placeholder="Remera Classic"
                value={data.manualProduct.name}
                onChange={(e) =>
                  update({ manualProduct: { ...data.manualProduct, name: e.target.value } })
                }
                className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
              />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Precio</Label>
              <Input
                type="number"
                placeholder="15000"
                value={data.manualProduct.price}
                onChange={(e) =>
                  update({ manualProduct: { ...data.manualProduct, price: e.target.value } })
                }
                className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
              />
            </div>
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Descripcion</Label>
            <Textarea
              placeholder="Remera 100% algodon premium, corte clasico..."
              value={data.manualProduct.description}
              onChange={(e) =>
                update({ manualProduct: { ...data.manualProduct, description: e.target.value } })
              }
              className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500 min-h-[60px]"
            />
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">
              <ImageIcon className="inline w-3 h-3 mr-1" />
              URL de imagen
            </Label>
            <Input
              type="url"
              placeholder="https://..."
              value={data.manualProduct.imageUrl}
              onChange={(e) =>
                update({ manualProduct: { ...data.manualProduct, imageUrl: e.target.value } })
              }
              className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
            />
          </div>
        </div>
      )}

      {data.catalogMode === 'csv' && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <h4 className="text-sm font-semibold text-zinc-300 mb-3">Importar desde CSV</h4>
          <p className="text-xs text-zinc-500 mb-3">
            Formato: nombre, descripcion, precio, imagen_url (una fila por producto)
          </p>
          <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 cursor-pointer transition-colors">
            <FileSpreadsheet className="w-6 h-6 text-zinc-500 mb-1" />
            <span className="text-sm text-zinc-500">
              {data.csvFile ? data.csvFile.name : 'Seleccionar archivo .csv'}
            </span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) update({ csvFile: file })
              }}
            />
          </label>
        </div>
      )}
    </div>
  )
}

function StepComercializacion({
  data,
  update,
}: {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Configura como queres que tus clientes interactuen con tu storefront.
      </p>

      <div className="space-y-3">
        {CHANNEL_OPTIONS.map((ch) => (
          <div
            key={ch.key}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              data.channels[ch.key]
                ? 'border-purple-500/30 bg-purple-500/5'
                : 'border-zinc-800 bg-zinc-900/50'
            }`}
          >
            <div>
              <span className="text-sm font-medium text-zinc-200">{ch.label}</span>
              <p className="text-xs text-zinc-500 mt-0.5">{ch.description}</p>
            </div>
            <Switch
              checked={data.channels[ch.key]}
              onCheckedChange={(checked) =>
                update({ channels: { ...data.channels, [ch.key]: checked } })
              }
            />
          </div>
        ))}
      </div>

      <Separator className="bg-zinc-800" />

      <div>
        <Label className="text-zinc-300">
          <MessageCircle className="inline w-3.5 h-3.5 mr-1" />
          WhatsApp de ventas
        </Label>
        <p className="text-xs text-zinc-500 mb-2">
          Numero que recibe las consultas de tu storefront (puede ser distinto al de registro).
        </p>
        <Input
          type="tel"
          placeholder="+54 11 1234 5678"
          value={data.salesWhatsapp}
          onChange={(e) => update({ salesWhatsapp: e.target.value })}
          className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Brief step constants
// ---------------------------------------------------------------------------

const BUSINESS_TYPES = [
  { value: 'cerveceria', label: 'Cerveceria artesanal' },
  { value: 'gym', label: 'Gym / Fitness' },
  { value: 'banda', label: 'Banda / Musica' },
  { value: 'restaurante', label: 'Restaurante / Bar' },
  { value: 'agencia', label: 'Agencia / Estudio creativo' },
  { value: 'otro', label: 'Otro' },
]

const PRODUCT_COUNT_OPTIONS = [
  { value: '1-5', label: '1 a 5', sub: 'Catalogo chico' },
  { value: '5-20', label: '5 a 20', sub: 'Catalogo mediano' },
  { value: '20+', label: '20+', sub: 'Catalogo grande' },
]

function StepBrief({
  data,
  update,
}: {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}) {
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const effectiveHasLogo = data.briefHasLogo || (data.logoPreview ? 'si' : '')

  const handleLogoSelect = async (file: File, preview: string) => {
    update({ logoFile: file, logoPreview: preview, briefHasLogo: 'si' })
    setUploadingLogo(true)
    const url = await uploadOnboardingFile(file, 'logo')
    setUploadingLogo(false)
    if (url) update({ logoPreview: url })
  }

  return (
    <div className="space-y-7">
      {/* Tipo de negocio */}
      <div>
        <Label className="text-zinc-300 block mb-2">¿Qué tipo de negocio tenés?</Label>
        <select
          value={data.briefBusinessType}
          onChange={(e) => update({ briefBusinessType: e.target.value })}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="">Seleccionar...</option>
          {BUSINESS_TYPES.map((bt) => (
            <option key={bt.value} value={bt.value}>{bt.label}</option>
          ))}
        </select>
      </div>

      {/* Tiene logo */}
      <div>
        <Label className="text-zinc-300 block mb-2">¿Tenés logo?</Label>
        <div className="flex gap-3 mb-3">
          {(['si', 'no'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => update({ briefHasLogo: opt })}
              className={`px-6 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                effectiveHasLogo === opt
                  ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {opt === 'si' ? 'Sí' : 'No'}
            </button>
          ))}
        </div>

        {effectiveHasLogo === 'si' && (
          data.logoPreview ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <img
                src={data.logoPreview}
                alt="Logo"
                className="w-14 h-14 rounded-lg border border-zinc-700 object-contain bg-zinc-900 p-1"
              />
              <div>
                <p className="text-sm text-emerald-300 font-medium">Logo cargado</p>
                <p className="text-xs text-zinc-500">Subido en el paso anterior</p>
              </div>
            </div>
          ) : (
            <FileUploadBox
              label="Subir logo"
              preview={data.logoPreview}
              onSelect={handleLogoSelect}
              uploading={uploadingLogo}
            />
          )
        )}
      </div>

      {/* Estilo de diseño — top 6 de VISUAL_STYLES */}
      <div>
        <Label className="text-zinc-300 block mb-2">¿Qué estilo de diseño preferís?</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {VISUAL_STYLES.slice(0, 6).map((style) => {
            const selected = (data.briefDesignStyle || data.visualStyle) === style.id
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => update({ briefDesignStyle: style.id, visualStyle: style.id })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selected
                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg mb-2 flex items-center justify-center ${
                    selected ? 'bg-purple-500/20' : 'bg-zinc-800'
                  }`}
                >
                  <Palette className={`w-4 h-4 ${selected ? 'text-purple-400' : 'text-zinc-500'}`} />
                </div>
                <h4 className={`font-semibold text-sm ${selected ? 'text-purple-300' : 'text-zinc-200'}`}>
                  {style.name}
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{style.description}</p>
                {selected && <Check className="w-3.5 h-3.5 text-purple-400 mt-1.5" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Cantidad de productos */}
      <div>
        <Label className="text-zinc-300 block mb-2">¿Cuántos productos pensás vender?</Label>
        <div className="grid grid-cols-3 gap-3">
          {PRODUCT_COUNT_OPTIONS.map((opt) => {
            const selected = data.briefProductCount === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ briefProductCount: opt.value })}
                className={`p-4 rounded-xl border text-center transition-all ${
                  selected
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <span className={`text-lg font-bold block ${selected ? 'text-purple-300' : 'text-zinc-100'}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-zinc-500 mt-0.5 block">{opt.sub}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const PLAN_CARDS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    price: 'Gratis',
    priceDetail: 'Para siempre',
    icon: Zap,
    color: 'zinc',
    features: [
      'Storefront basica',
      'Hasta 10 productos',
      '20 leads/mes',
      'Precios mayoristas',
    ],
  },
  {
    id: 'growth' as const,
    name: 'Growth',
    price: '$25 USD',
    priceDetail: '/mes',
    icon: Rocket,
    color: 'purple',
    popular: true,
    features: [
      'Productos ilimitados',
      'Leads ilimitados',
      'SEO + Geo optimizado',
      'Design Engine (presets)',
      'Branding completo',
      'Analytics basicos',
      'Soporte por email',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$100 USD',
    priceDetail: '/mes',
    icon: Crown,
    color: 'pink',
    features: [
      'Todo de Growth +',
      'Design Engine completo',
      'Chatbot con IA',
      'Setup Meta Business',
      'Templates Meta Ads',
      'Analytics avanzados',
      'Export de feeds',
      'Llamada de onboarding',
      'Soporte WhatsApp',
    ],
  },
]

function StepPlan({
  data,
  update,
}: {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}) {
  const isAnnual = data.billingCycle === 'annual'
  const showBillingToggle = data.selectedPlan !== 'starter'

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400 mb-2">
        Selecciona el plan que mejor se adapte a tu marca. Podes cambiar en cualquier momento.
      </p>

      {/* Billing cycle toggle */}
      {showBillingToggle && (
        <div className="flex items-center justify-center gap-3 mb-2">
          <button
            type="button"
            onClick={() => update({ billingCycle: 'monthly' })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !isAnnual
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => update({ billingCycle: 'annual' })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              isAnnual
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Anual
            <span className="absolute -top-2 -right-3 bg-emerald-600 text-white text-[10px] px-1.5 py-0 rounded-full font-bold">
              -15%
            </span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLAN_CARDS.map((plan) => {
          const selected = data.selectedPlan === plan.id
          const Icon = plan.icon
          const annualPrice = plan.id === 'growth' ? '$21' : plan.id === 'pro' ? '$85' : null
          const displayPrice = isAnnual && annualPrice ? annualPrice : plan.price
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => update({ selectedPlan: plan.id })}
              className={`relative flex flex-col p-5 rounded-xl border text-left transition-all ${
                selected
                  ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Popular
                </span>
              )}
              <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${
                selected ? 'bg-purple-500/20' : 'bg-zinc-800'
              }`}>
                <Icon className={`w-5 h-5 ${selected ? 'text-purple-400' : 'text-zinc-500'}`} />
              </div>
              <h4 className={`font-bold text-lg ${selected ? 'text-purple-300' : 'text-zinc-100'}`}>
                {plan.name}
              </h4>
              <div className="mt-1 mb-4">
                <span className={`text-2xl font-bold ${selected ? 'text-purple-300' : 'text-zinc-100'}`}>
                  {displayPrice}
                </span>
                <span className="text-sm text-zinc-500 ml-1">{plan.priceDetail}</span>
                {isAnnual && annualPrice && (
                  <p className="text-xs text-emerald-400 mt-1">Ahorro anual incluido</p>
                )}
              </div>
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                    <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      selected ? 'text-purple-400' : 'text-zinc-600'
                    }`} />
                    {f}
                  </li>
                ))}
              </ul>
              {selected && (
                <div className="mt-4 pt-3 border-t border-purple-500/20 text-center">
                  <span className="text-sm font-medium text-purple-400">Seleccionado</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Fallback products (plain garments) — used while mockups generate
const PREVIEW_PRODUCTS = [
  { name: 'Remera Oversize', price: '$18.500', fallback: '/garments/tshirt-black-oversize-front.jpeg', category: 'Remeras' },
  { name: 'Buzo Hoodie Oversize', price: '$32.900', fallback: '/garments/buzo-hoodie-unisex-marron-front.jpeg', category: 'Buzos' },
  { name: 'Remera Classic', price: '$15.200', fallback: '/garments/tshirt-white-classic-front.jpeg', category: 'Remeras' },
]

function usePreviewMockups(data: WizardData) {
  const [mockups, setMockups] = useState<(string | null)[]>([null, null, null])
  const [generating, setGenerating] = useState(false)
  const generatedRef = useRef(false)

  useEffect(() => {
    if (generatedRef.current || !data.businessName) return
    generatedRef.current = true
    setGenerating(true)

    const colors = [data.colorPrimary, data.colorAccent, data.colorSecondary].filter(Boolean)

    // Generate 3 mockups in parallel
    const promises = [0, 1, 2].map(async (idx) => {
      try {
        const res = await fetch('/api/partners/onboarding/preview-mockup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandName: data.businessName,
            industry: data.industry,
            tagline: data.tagline || data.shortDescription,
            colors,
            garmentIndex: idx,
          }),
        })
        const json = await res.json()
        if (json.success && json.image) {
          setMockups((prev) => {
            const next = [...prev]
            next[idx] = json.image
            return next
          })
        }
      } catch {
        // Keep fallback for this slot
      }
    })

    Promise.allSettled(promises).then(() => setGenerating(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { mockups, generating }
}

function StepPreview({ data }: { data: WizardData }) {
  const planCard = PLAN_CARDS.find((p) => p.id === data.selectedPlan)
  const slug = data.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const { mockups, generating } = usePreviewMockups(data)

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-400">
        Asi se va a ver tu storefront. Revisa y activa.
      </p>

      {/* ── Full Storefront Preview ── */}
      <div
        className="rounded-2xl border border-zinc-700/50 overflow-hidden shadow-2xl shadow-black/50"
        style={{ '--p-primary': data.colorPrimary, '--p-secondary': data.colorSecondary || '#18181b', '--p-accent': data.colorAccent } as React.CSSProperties}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/90 border-b border-zinc-800">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/60" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
            <div className="w-2 h-2 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 mx-2 px-3 py-1 rounded-md bg-zinc-800/80 text-[11px] text-zinc-400 font-mono truncate flex items-center gap-1.5">
            <svg className="w-3 h-3 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            novamente.ar/p/{slug || 'mi-marca'}
          </div>
        </div>

        {/* ── HERO ── */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            background: data.bannerPreview
              ? undefined
              : `linear-gradient(135deg, ${data.colorPrimary} 0%, ${data.colorSecondary || '#18181b'} 60%, #09090b 100%)`,
            minHeight: 280,
          }}
        >
          {data.bannerPreview && (
            <img
              src={data.bannerPreview}
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-zinc-950" />

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          <div className="relative z-10 flex flex-col items-center justify-center gap-4 px-6 py-16 text-center min-h-[280px]">
            {data.logoPreview ? (
              <img
                src={data.logoPreview}
                alt="Logo"
                className="w-20 h-20 rounded-2xl border border-white/10 bg-black/30 object-contain p-2 backdrop-blur-sm shadow-lg"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center shadow-lg"
              >
                <span className="text-3xl font-bold text-white/80">
                  {(data.businessName || 'M')[0].toUpperCase()}
                </span>
              </div>
            )}

            <h3 className="text-3xl font-bold text-white tracking-tight">
              {data.businessName || 'Mi Marca'}
            </h3>

            {data.tagline && (
              <p className="text-base text-zinc-300/90 max-w-sm leading-relaxed">
                {data.tagline}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
              {data.industry && (
                <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-zinc-200 border border-white/10 backdrop-blur-sm">
                  {data.industry}
                </span>
              )}
              {data.instagram && (
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Instagram className="w-3 h-3" />
                  {data.instagram}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── ABOUT ── */}
        {(data.shortDescription || data.aboutText) && (
          <div className="px-6 py-8 bg-zinc-950">
            <div className="max-w-lg mx-auto">
              <h4 className="text-lg font-semibold text-white mb-3">Sobre nosotros</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {data.aboutText || data.shortDescription}
              </p>
            </div>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        <div className="px-5 py-8 bg-zinc-950 border-t border-zinc-900/50">
          <div className="flex items-center justify-center gap-2 mb-5">
            <h4 className="text-lg font-semibold text-white">Productos</h4>
            {generating && (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                <Loader2 className="w-3 h-3 animate-spin" />
                Generando mockups con IA...
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {PREVIEW_PRODUCTS.map((product, idx) => {
              const mockupImage = mockups[idx]
              const isLoading = !mockupImage && generating
              return (
                <div
                  key={product.name}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden transition-all hover:border-zinc-700"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-zinc-800">
                    {isLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10">
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin mb-2" />
                        <span className="text-[9px] text-zinc-500">Generando...</span>
                      </div>
                    )}
                    <img
                      src={mockupImage || product.fallback}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-all duration-500 ${isLoading ? 'opacity-20 blur-sm scale-105' : 'opacity-100'} group-hover:scale-105`}
                    />
                    {mockupImage && (
                      <div className="absolute top-1.5 right-1.5">
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-purple-500/80 text-white font-medium">
                          IA
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h5 className="text-xs font-medium text-zinc-100 truncate">{product.name}</h5>
                    <span className="text-[9px] text-zinc-500">{product.category}</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xs font-bold text-white">{product.price}</span>
                    </div>
                    <span className="mt-1 inline-flex text-[10px] font-medium" style={{ color: data.colorPrimary }}>
                      Ver detalle →
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-zinc-600 mt-3 text-center">
            {generating
              ? 'Generando mockups personalizados con la identidad de tu marca...'
              : mockups.some(Boolean)
                ? 'Mockups generados con IA basados en tu marca — tus productos los cargás desde el dashboard'
                : 'Ejemplo con productos de Novamente — tus productos los cargás desde el dashboard'}
          </p>
        </div>

        {/* ── CTA ── */}
        <div className="px-5 py-8 bg-zinc-950 border-t border-zinc-900/50">
          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: `linear-gradient(135deg, ${data.colorPrimary}18 0%, ${data.colorSecondary || data.colorPrimary}0a 100%)`,
              border: `1px solid ${data.colorPrimary}30`,
            }}
          >
            <h4 className="text-base font-bold text-white mb-2">
              ¿Te interesa nuestro merch?
            </h4>
            <p className="text-xs text-zinc-400 mb-4">
              Escribinos y te armamos una propuesta a medida.
            </p>
            <div
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: data.colorPrimary }}
            >
              <MessageCircle className="w-4 h-4" />
              Escribinos por WhatsApp
            </div>
          </div>
        </div>

        {/* ── CONTACT FORM ── */}
        <div className="px-5 py-8 bg-zinc-950 border-t border-zinc-900/50">
          <div className="max-w-sm mx-auto">
            <h4 className="text-base font-semibold text-white mb-4 text-center">Contacto</h4>
            <div className="space-y-3">
              <div className="h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center px-3">
                <span className="text-xs text-zinc-600">Tu nombre</span>
              </div>
              <div className="h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center px-3">
                <span className="text-xs text-zinc-600">Tu email</span>
              </div>
              <div className="h-20 rounded-lg bg-zinc-900 border border-zinc-800 flex items-start p-3">
                <span className="text-xs text-zinc-600">Mensaje...</span>
              </div>
              <div
                className="h-9 rounded-lg flex items-center justify-center text-xs font-semibold text-white"
                style={{ backgroundColor: data.colorPrimary }}
              >
                Enviar mensaje
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-5 py-5 bg-zinc-950 border-t border-zinc-800">
          <div className="flex items-center justify-between text-[10px] text-zinc-600">
            <span>&copy; 2026 {data.businessName || 'Mi Marca'}</span>
            <div className="flex items-center gap-3">
              {data.website && <span className="text-zinc-500">Web</span>}
              {data.instagram && <span className="text-zinc-500">Instagram</span>}
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-[9px] text-zinc-600">
              Powered by <span className="font-semibold text-zinc-400">Novamente</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Summary bar ── */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/30">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[data.colorPrimary, data.colorSecondary, data.colorAccent].map((c) => (
              <div
                key={c}
                className="w-4 h-4 rounded border border-zinc-700"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <span className="text-xs text-zinc-500">
            {data.fontPreference || 'Default'} · {planCard?.name || 'Starter'}
          </span>
        </div>
        <span className="text-xs font-medium" style={{ color: data.colorPrimary }}>
          {planCard ? `${planCard.price} ${planCard.priceDetail}` : 'Gratis'}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Onboarding API helpers
// ---------------------------------------------------------------------------

const PARTNER_TYPE_TO_ENGINE: Record<WizardData['partnerType'], string> = {
  catalog_only: 'disabled',
  catalog_mockups: 'mockups_only',
  catalog_design_engine: 'full_brand_fit',
}

function resolveCommerceMode(channels: WizardData['channels']): string {
  if (channels.whatsapp) return 'whatsapp'
  if (channels.externalBuy) return 'external'
  if (channels.quote) return 'quote'
  return 'leads'
}

function buildStepPayload(
  currentStep: number,
  data: WizardData,
): { step: number; tenantId?: string; data: Record<string, unknown> } | null {
  // Simplified 4-step wizard:
  // Step 0 = Datos basicos → API step 1 (creates tenant)
  // Step 1 = Identidad visual → API step 2
  // Step 2 = Plan → API step 7
  // Step 3 = Preview (no API call)

  switch (currentStep) {
    case 0:
      return {
        step: 1,
        data: {
          name: data.businessName,
          email: data.email,
          phone: data.whatsapp,
          country: data.country,
          currency: data.currency,
          industry: data.industry,
          website: data.website,
          instagram: data.instagram,
          description: data.shortDescription,
          seo_title: data.seoTitle || `${data.businessName} — Merch oficial en Novamente`.slice(0, 60),
          seo_description: data.seoDescription || (data.shortDescription || `Descubri los productos de ${data.businessName} en Novamente.`).slice(0, 160),
        },
      }
    case 1:
      return {
        step: 2,
        tenantId: data.tenantId!,
        data: {
          logo_url: data.logoPreview.startsWith('http') ? data.logoPreview : undefined,
          banner_url: data.bannerPreview.startsWith('http') ? data.bannerPreview : undefined,
          primary_color: data.colorPrimary,
          secondary_color: data.colorSecondary,
          accent_color: data.colorAccent,
          font_preference: data.fontPreference || undefined,
          tagline: data.tagline || undefined,
          about_text: data.aboutText || undefined,
          visual_style: data.visualStyle || data.brandKit?.suggestedStyle || 'minimal',
        },
      }
    case 2:
      // Plan step — save plan + billing cycle to tenant
      return {
        step: 7,
        tenantId: data.tenantId!,
        data: { plan: data.selectedPlan, billing_cycle: data.billingCycle },
      }
    case 3:
      // Brief step — save to tenant metadata
      return {
        step: 9,
        tenantId: data.tenantId!,
        data: {
          brief: {
            businessType: data.briefBusinessType || null,
            hasLogo: data.briefHasLogo || null,
            designStyle: data.briefDesignStyle || data.visualStyle || null,
            productCount: data.briefProductCount || null,
          },
        },
      }
    default:
      return null
  }
}

async function callOnboardingAPI(
  payload: Record<string, unknown>,
): Promise<{ tenant: { id: string }; error?: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch('/api/partners/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error en el servidor')
    return json
  } catch (err: unknown) {
    clearTimeout(timeout)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('El servidor tardó demasiado. Intentá de nuevo.')
    }
    throw err
  }
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PartnersJoinPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(DEFAULT_DATA)
  const [transitioning, setTransitioning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResume, setShowResume] = useState(false)
  const [credentials, setCredentials] = useState<{ email: string; password: string | null } | null>(null)

  // Check for saved progress on mount
  useEffect(() => {
    const saved = loadWizardProgress()
    if (saved && saved.step > 0) {
      setShowResume(true)
    }
  }, [])

  const handleResume = useCallback(() => {
    const saved = loadWizardProgress()
    if (saved) {
      setData((prev) => ({ ...prev, ...saved.data }))
      setStep(saved.step)
    }
    setShowResume(false)
  }, [])

  const handleStartOver = useCallback(() => {
    clearWizardProgress()
    setShowResume(false)
  }, [])

  const update = useCallback((patch: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...patch }))
  }, [])

  const goTo = useCallback((next: number) => {
    setTransitioning(true)
    setTimeout(() => {
      setStep(next)
      setTransitioning(false)
      // Save progress to localStorage after each step
      setData((current) => {
        saveWizardProgress(next, current)
        return current
      })
    }, 150)
  }, [])

  const [apiFailCount, setApiFailCount] = useState(0)

  const goNext = useCallback(async () => {
    setError(null)
    const payload = buildStepPayload(step, data)

    // If no API call needed for this step, just advance
    if (!payload) {
      goTo(step + 1)
      return
    }

    // If API already failed for this step, allow skipping
    if (apiFailCount > 0) {
      setApiFailCount(0)
      goTo(step + 1)
      return
    }

    setSubmitting(true)
    try {
      const result = await callOnboardingAPI(payload)

      // Datos basicos (step 1) returns the new tenant + credentials
      if (step === 0 && result.tenant?.id) {
        setData((prev) => ({ ...prev, tenantId: result.tenant.id }))
        // Show credentials if a new account was created
        if ((result as any).credentials?.password) {
          setCredentials((result as any).credentials)
        }
      }

      setApiFailCount(0)
      goTo(step + 1)
    } catch (err: unknown) {
      setApiFailCount((c) => c + 1)
      setError(
        (err instanceof Error ? err.message : 'Error inesperado') +
        ' — Podes tocar Siguiente de nuevo para continuar sin guardar.'
      )
    } finally {
      setSubmitting(false)
    }
  }, [step, data, goTo, apiFailCount])

  const handleActivate = useCallback(async () => {
    setError(null)
    setSubmitting(true)
    try {
      if (data.selectedPlan === 'starter') {
        // Free plan — activate immediately
        await callOnboardingAPI({
          step: 8,
          tenantId: data.tenantId,
        })
        trackGenerateLead('partner_signup_completed')
        // Fire-and-forget: generate 3 starter products with AI mockups
        if (data.tenantId) {
          fetch('/api/partners/onboarding/generate-products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId: data.tenantId,
              brandName: data.businessName,
              industry: data.industry,
              tagline: data.tagline || data.shortDescription,
              colors: [data.colorPrimary, data.colorAccent, data.colorSecondary].filter(Boolean),
            }),
          }).catch(() => {}) // Non-blocking — products can be added manually later
        }
        clearWizardProgress()
        // Auto-login + set server-side cookie so middleware detects session.
        // Without /api/auth/set-session the middleware can't see the token and
        // bounces the user back to /partners/login.
        let signedIn = false
        if (credentials?.password) {
          try {
            const { getSupabase } = await import('@/lib/supabase')
            const sb = getSupabase()
            if (sb) {
              const { data: authData, error: authErr } = await sb.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
              })
              if (!authErr && authData?.session?.access_token) {
                await fetch('/api/auth/set-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    access_token: authData.session.access_token,
                    refresh_token: authData.session.refresh_token,
                  }),
                })
                signedIn = true
              }
            }
          } catch {}
        }
        if (signedIn) {
          window.location.href = '/workspace'
        } else {
          // Existing user (no password returned) or signIn failed → send to login with prefill
          const email = credentials?.email ?? ''
          const params = new URLSearchParams({ redirect: '/workspace' })
          if (email) params.set('email', email)
          window.location.href = `/partners/login?${params.toString()}`
        }
      } else {
        // Paid plan — save plan, then redirect to MercadoPago
        await callOnboardingAPI({
          step: 8,
          tenantId: data.tenantId,
          data: { plan: data.selectedPlan },
        })
        trackGenerateLead('partner_signup_completed')
        // Fire-and-forget: generate 3 starter products with AI mockups
        if (data.tenantId) {
          fetch('/api/partners/onboarding/generate-products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId: data.tenantId,
              brandName: data.businessName,
              industry: data.industry,
              tagline: data.tagline || data.shortDescription,
              colors: [data.colorPrimary, data.colorAccent, data.colorSecondary].filter(Boolean),
            }),
          }).catch(() => {})
        }

        // Create MercadoPago subscription preference
        const res = await fetch('/api/partners/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: data.tenantId,
            plan: data.selectedPlan,
            billingCycle: data.billingCycle,
          }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Error al crear preferencia de pago')

        // Redirect to MercadoPago checkout
        window.location.href = result.init_point
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSubmitting(false)
    }
  }, [data.tenantId, data.selectedPlan])

  const TOTAL = STEP_TITLES.length

  const steps = [
    <StepDatosBasicos key={0} data={data} update={update} />,
    <StepIdentidadVisual key={1} data={data} update={update} />,
    <StepPlan key={2} data={data} update={update} />,
    <StepBrief key={3} data={data} update={update} />,
    <StepPreview key={4} data={data} />,
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/partners" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Volver a Studio</span>
          </Link>
          <h1 className="text-sm font-semibold tracking-wider uppercase text-zinc-400">
            Onboarding
          </h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Resume banner */}
      {showResume && (
        <div className="border-b border-amber-500/30 bg-amber-500/5">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-300">
              Tenes un registro sin terminar. ¿Queres continuar donde lo dejaste?
            </p>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={handleResume}
                className="bg-amber-500 text-black hover:bg-amber-400 font-medium text-xs h-7"
              >
                Continuar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleStartOver}
                className="border-zinc-700 text-zinc-400 hover:text-white text-xs h-7"
              >
                Empezar de cero
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress */}
        <StepIndicator current={step} total={TOTAL} />

        {/* Step title */}
        <div className="mt-8 mb-6">
          <h2 className="text-2xl font-bold">{STEP_TITLES[step]}</h2>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
            <span className="shrink-0 mt-0.5">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step content */}
        <div
          className={`transition-opacity duration-150 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
        >
          {steps[step]}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-zinc-800/50">
          <Button
            variant="outline"
            onClick={() => goTo(step - 1)}
            disabled={step === 0 || submitting}
            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Atras
          </Button>

          {step < TOTAL - 1 ? (
            <Button
              onClick={goNext}
              disabled={submitting}
              className="bg-purple-500 hover:bg-purple-400 text-white"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 ml-1.5" />
              )}
              {submitting ? 'Guardando...' : 'Siguiente'}
            </Button>
          ) : (
            <Button
              onClick={handleActivate}
              disabled={submitting}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold px-6"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : data.selectedPlan === 'starter' ? (
                <Sparkles className="w-4 h-4 mr-1.5" />
              ) : (
                <CreditCard className="w-4 h-4 mr-1.5" />
              )}
              {submitting
                ? 'Procesando...'
                : data.selectedPlan === 'starter'
                  ? 'Activar mi storefront'
                  : `Pagar y activar — $${data.selectedPlan === 'growth' ? (data.billingCycle === 'annual' ? '21' : '25') : (data.billingCycle === 'annual' ? '85' : '100')} USD/${data.billingCycle === 'annual' ? 'mes (anual)' : 'mes'}`}
            </Button>
          )}
        </div>

        {/* Legal links */}
        <p className="mt-6 text-center text-xs text-zinc-500">
          Al continuar, aceptas nuestros{' '}
          <Link href="/partners/terms" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
            Terminos y Condiciones
          </Link>{' '}
          y{' '}
          <Link href="/partners/privacy" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
            Politica de Privacidad
          </Link>
          .
        </p>
      </main>

      {/* Credentials modal — shown once after account creation */}
      {credentials?.password && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Cuenta creada</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Guardá estas credenciales. Las vas a necesitar para acceder a tu workspace después.
            </p>
            <div className="bg-zinc-800 rounded-xl p-4 mb-6 text-left space-y-3">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Email</p>
                <p className="text-sm text-zinc-200 font-mono select-all">{credentials.email}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Contraseña</p>
                <p className="text-sm text-zinc-200 font-mono select-all">{credentials.password}</p>
              </div>
            </div>
            <p className="text-xs text-amber-400/80 mb-4">
              Esta contraseña se muestra una sola vez. Podés cambiarla después en tu workspace.
            </p>
            <Button
              onClick={() => setCredentials(null)}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white"
            >
              Entendido, continuar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
