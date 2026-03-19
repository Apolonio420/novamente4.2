'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Settings,
  Save,
  Loader2,
  Globe,
  Store,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { authFetch } from '@/lib/partners/auth-fetch'

// --- Types ---

interface SettingsData {
  name: string
  slug: string
  email: string
  phone: string
  website: string
  instagram: string
  industry: string
  country: string
  currency: string
  commerce_mode: string
  storefront_published: boolean
  plan: string
  max_products: number
  max_leads_per_month: number
  status: string
  seo_title: string
  seo_description: string
  seo_indexable: boolean
  custom_faqs: { question: string; answer: string }[] | null
}

interface Toast {
  message: string
  type: 'success' | 'error'
}

// --- Constants ---

const INDUSTRY_OPTIONS = [
  { value: 'moda', label: 'Moda' },
  { value: 'deporte', label: 'Deporte' },
  { value: 'musica', label: 'Musica' },
  { value: 'gastronomia', label: 'Gastronomia' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'salud', label: 'Salud' },
  { value: 'educacion', label: 'Educacion' },
  { value: 'otro', label: 'Otro' },
]

const COUNTRY_OPTIONS = [
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'MX', label: 'Mexico' },
  { value: 'CO', label: 'Colombia' },
  { value: 'BR', label: 'Brasil' },
  { value: 'other', label: 'Otro' },
]

const CURRENCY_OPTIONS = [
  { value: 'ARS', label: 'ARS — Peso argentino' },
  { value: 'USD', label: 'USD — Dolar' },
  { value: 'CLP', label: 'CLP — Peso chileno' },
  { value: 'UYU', label: 'UYU — Peso uruguayo' },
  { value: 'MXN', label: 'MXN — Peso mexicano' },
]

const COMMERCE_MODE_OPTIONS = [
  { value: 'leads', label: 'Solo leads' },
  { value: 'quote', label: 'Cotizacion' },
  { value: 'sample', label: 'Muestra' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'external', label: 'Link externo' },
  { value: 'checkout', label: 'Checkout' },
]

const PLAN_BADGE_COLORS: Record<string, string> = {
  free: 'bg-zinc-700 text-zinc-300',
  starter: 'bg-blue-900/60 text-blue-400 border-blue-500/30',
  pro: 'bg-purple-900/60 text-purple-400 border-purple-500/30',
  enterprise: 'bg-amber-900/60 text-amber-400 border-amber-500/30',
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-emerald-900/60 text-emerald-400 border-emerald-500/30' },
  paused: { label: 'Pausado', className: 'bg-amber-900/60 text-amber-400 border-amber-500/30' },
  suspended: { label: 'Suspendido', className: 'bg-red-900/60 text-red-400 border-red-500/30' },
}

// --- Component ---

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [confirmingStatusChange, setConfirmingStatusChange] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)

  const initialRef = useRef<SettingsData | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await authFetch('/api/partners/settings')
      if (!res.ok) throw new Error('Error cargando configuracion')
      const data: SettingsData = await res.json()
      setSettings(data)
      initialRef.current = { ...data }
    } catch {
      showToast('Error al cargar configuracion', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const isDirty = (): boolean => {
    if (!settings || !initialRef.current) return false
    const editable: (keyof SettingsData)[] = [
      'name', 'email', 'phone', 'website', 'instagram',
      'industry', 'country', 'currency', 'commerce_mode', 'storefront_published',
      'seo_title', 'seo_description',
    ]
    if (editable.some((key) => settings[key] !== initialRef.current![key])) return true
    // Deep compare custom_faqs
    if (JSON.stringify(settings.custom_faqs) !== JSON.stringify(initialRef.current.custom_faqs)) return true
    return false
  }

  const updateField = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleSave = async () => {
    if (!settings || !isDirty()) return
    setSaving(true)
    try {
      const res = await authFetch('/api/partners/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settings.name,
          email: settings.email,
          phone: settings.phone,
          website: settings.website,
          instagram: settings.instagram,
          industry: settings.industry,
          country: settings.country,
          currency: settings.currency,
          commerce_mode: settings.commerce_mode,
          storefront_published: settings.storefront_published,
          seo_title: settings.seo_title,
          seo_description: settings.seo_description,
          custom_faqs: settings.custom_faqs,
        }),
      })
      if (!res.ok) throw new Error('Error guardando')
      const updated: SettingsData = await res.json()
      setSettings(updated)
      initialRef.current = { ...updated }
      showToast('Configuracion guardada', 'success')
    } catch {
      showToast('Error al guardar configuracion', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async () => {
    if (!settings) return
    const newStatus = settings.status === 'active' ? 'paused' : 'active'
    setStatusChanging(true)
    try {
      const res = await authFetch('/api/partners/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Error cambiando estado')
      const updated: SettingsData = await res.json()
      setSettings(updated)
      initialRef.current = { ...updated }
      setConfirmingStatusChange(false)
      showToast(
        newStatus === 'paused' ? 'Cuenta pausada' : 'Cuenta reactivada',
        'success',
      )
    } catch {
      showToast('Error al cambiar estado de la cuenta', 'error')
    } finally {
      setStatusChanging(false)
    }
  }

  // --- Skeleton ---

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-zinc-800 animate-pulse" />
          <div className="h-7 w-48 rounded bg-zinc-800 animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 space-y-4"
          >
            <div className="h-5 w-40 rounded bg-zinc-800 animate-pulse" />
            <div className="h-10 w-full rounded bg-zinc-800/50 animate-pulse" />
            <div className="h-10 w-full rounded bg-zinc-800/50 animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-3 text-red-400">
          <XCircle className="h-5 w-5" />
          <span>No se pudo cargar la configuracion.</span>
        </div>
      </div>
    )
  }

  const dirty = isDirty()

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all ${
            toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-300'
              : 'border-red-500/30 bg-red-950/90 text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-zinc-400" />
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">
            Configuracion
          </h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar
        </Button>
      </div>

      {/* 1. Informacion basica */}
      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base font-medium text-zinc-100 flex items-center gap-2">
            <Globe className="h-5 w-5 text-zinc-400" />
            Informacion basica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">Nombre</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Mi marca"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="contacto@marca.com"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-zinc-300">Telefono</Label>
              <Input
                id="phone"
                type="tel"
                value={settings.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+54 11 1234 5678"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="text-zinc-300">Sitio web</Label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://mimarca.com"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram" className="text-zinc-300">Instagram</Label>
              <Input
                id="instagram"
                value={settings.instagram}
                onChange={(e) => updateField('instagram', e.target.value)}
                placeholder="@mimarca"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-zinc-300">Industria</Label>
              <select
                id="industry"
                value={settings.industry}
                onChange={(e) => updateField('industry', e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Seleccionar</option>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-zinc-300">Pais</Label>
              <select
                id="country"
                value={settings.country}
                onChange={(e) => updateField('country', e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Seleccionar</option>
                {COUNTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-zinc-300">Moneda</Label>
              <select
                id="currency"
                value={settings.currency}
                onChange={(e) => updateField('currency', e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Seleccionar</option>
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Configuracion de comercio */}
      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base font-medium text-zinc-100 flex items-center gap-2">
            <Store className="h-5 w-5 text-zinc-400" />
            Configuracion de comercio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="commerce_mode" className="text-zinc-300">
              Modo de comercio
            </Label>
            <select
              id="commerce_mode"
              value={settings.commerce_mode}
              onChange={(e) => updateField('commerce_mode', e.target.value)}
              className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {COMMERCE_MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-1">
              Define como los clientes interactuan con tus productos en el storefront.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Storefront */}
      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base font-medium text-zinc-100 flex items-center gap-2">
            <Globe className="h-5 w-5 text-zinc-400" />
            Storefront
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-zinc-300">Publicar storefront</Label>
              <p className="text-xs text-zinc-500 max-w-md">
                Al publicar, tu storefront sera visible publicamente. Los visitantes
                podran ver tus productos y contactarte segun el modo de comercio
                configurado.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.storefront_published}
              onClick={() =>
                updateField('storefront_published', !settings.storefront_published)
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                settings.storefront_published ? 'bg-emerald-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                  settings.storefront_published ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {settings.storefront_published && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tu storefront esta publicado y visible al publico.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. SEO / Posicionamiento */}
      <Card className="bg-zinc-900/60 border-zinc-800 relative">
        <CardHeader>
          <CardTitle className="text-base font-medium text-zinc-100 flex items-center gap-2">
            <Search className="h-5 w-5 text-zinc-400" />
            SEO / Posicionamiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {settings.plan === 'starter' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-zinc-900/80 backdrop-blur-sm">
              <div className="text-center px-6">
                <Search className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 max-w-sm">
                  Tu storefront no aparece en buscadores. Actualiza a Growth para activar SEO y aparecer en Google.
                </p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="seo_title" className="text-zinc-300">
              Titulo SEO
            </Label>
            <Input
              id="seo_title"
              value={settings.seo_title || ''}
              onChange={(e) => updateField('seo_title', e.target.value.slice(0, 60))}
              placeholder={`${settings.name} — Merch en Novamente`}
              maxLength={60}
              disabled={settings.plan === 'starter'}
              className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
            <div className="flex justify-end">
              <span
                className={`text-xs ${
                  (settings.seo_title || '').length > 60
                    ? 'text-red-400'
                    : (settings.seo_title || '').length > 50
                      ? 'text-amber-400'
                      : 'text-zinc-500'
                }`}
              >
                {(settings.seo_title || '').length}/60
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo_description" className="text-zinc-300">
              Descripcion SEO
            </Label>
            <textarea
              id="seo_description"
              value={settings.seo_description || ''}
              onChange={(e) => updateField('seo_description', e.target.value.slice(0, 160))}
              placeholder={settings.name ? `Descubri los productos de ${settings.name} en Novamente. Merch premium con diseno unico.` : ''}
              maxLength={160}
              rows={3}
              disabled={settings.plan === 'starter'}
              className="flex w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
            <div className="flex justify-end">
              <span
                className={`text-xs ${
                  (settings.seo_description || '').length > 160
                    ? 'text-red-400'
                    : (settings.seo_description || '').length > 140
                      ? 'text-amber-400'
                      : 'text-zinc-500'
                }`}
              >
                {(settings.seo_description || '').length}/160
              </span>
            </div>
          </div>
          {/* SERP Preview */}
          <div className="rounded-lg border border-zinc-700/50 bg-zinc-950 p-4 space-y-1">
            <p className="text-xs text-zinc-500 mb-2">Vista previa en Google</p>
            <p className="text-[#8ab4f8] text-base leading-tight truncate">
              {settings.seo_title || settings.name || 'Titulo'} · Novamente
            </p>
            <p className="text-[#bdc1c6] text-xs">
              novamente.ar/p/{settings.slug || '...'}
            </p>
            <p className="text-[#9aa0a6] text-sm leading-snug line-clamp-2">
              {settings.seo_description || settings.name ? `Descubri los productos de ${settings.name} en Novamente.` : 'Descripcion...'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4b. Preguntas Frecuentes (Pro only) */}
      {settings.plan === 'pro' && (
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-medium text-zinc-100 flex items-center gap-2">
              <Globe className="h-5 w-5 text-zinc-400" />
              Preguntas Frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-zinc-500">
              Personalizá las preguntas frecuentes que aparecen en tu storefront. Máximo 10.
            </p>
            {(settings.custom_faqs || []).map((faq, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-zinc-800 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={faq.question}
                      onChange={(e) => {
                        const updated = [...(settings.custom_faqs || [])]
                        updated[i] = { ...updated[i], question: e.target.value }
                        updateField('custom_faqs', updated)
                      }}
                      placeholder="Pregunta"
                      className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={(e) => {
                        const updated = [...(settings.custom_faqs || [])]
                        updated[i] = { ...updated[i], answer: e.target.value }
                        updateField('custom_faqs', updated)
                      }}
                      placeholder="Respuesta"
                      rows={2}
                      className="flex w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (settings.custom_faqs || []).filter((_, idx) => idx !== i)
                      updateField('custom_faqs', updated.length > 0 ? updated : null)
                    }}
                    className="mt-1 text-zinc-500 hover:text-red-400 transition-colors text-lg"
                    title="Eliminar"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
            {(settings.custom_faqs || []).length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const updated = [...(settings.custom_faqs || []), { question: '', answer: '' }]
                  updateField('custom_faqs', updated)
                }}
                className="border-zinc-700 text-zinc-400 hover:text-zinc-200 gap-1"
              >
                + Agregar pregunta
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 5. Plan actual */}
      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base font-medium text-zinc-100 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-zinc-400" />
            Plan actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-zinc-500">Plan</span>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    PLAN_BADGE_COLORS[settings.plan] || PLAN_BADGE_COLORS.free
                  }
                >
                  {settings.plan.charAt(0).toUpperCase() + settings.plan.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-zinc-500">Estado</span>
              <div>
                <Badge
                  className={
                    STATUS_BADGE[settings.status]?.className ||
                    'bg-zinc-700 text-zinc-300'
                  }
                >
                  {STATUS_BADGE[settings.status]?.label || settings.status}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-zinc-500">Productos maximos</span>
              <p className="text-sm text-zinc-200 font-medium">
                {settings.max_products}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-zinc-500">Leads por mes</span>
              <p className="text-sm text-zinc-200 font-medium">
                {settings.max_leads_per_month}
              </p>
            </div>
            {/* Badge status */}
            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs text-zinc-500">Badge &quot;Powered by Novamente&quot;</span>
              {settings.plan === 'starter' ? (
                <p className="text-sm text-amber-400">
                  Visible en tu storefront. Actualiza a Growth para removerlo.
                </p>
              ) : (
                <p className="text-sm text-emerald-400">
                  Oculto en tu storefront.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Zona de peligro */}
      {(settings.status === 'active' || settings.status === 'paused') && (
        <Card className="bg-zinc-900/60 border-red-900/40">
          <CardHeader>
            <CardTitle className="text-base font-medium text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Zona de peligro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.status === 'active' ? (
              <>
                <p className="text-sm text-zinc-400">
                  Pausar tu cuenta desactivara el storefront y dejara de recibir
                  leads. Podes reactivarla en cualquier momento.
                </p>
                {!confirmingStatusChange ? (
                  <Button
                    variant="outline"
                    onClick={() => setConfirmingStatusChange(true)}
                    className="border-amber-600/50 text-amber-400 hover:bg-amber-950/40 hover:text-amber-300 gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Pausar cuenta
                  </Button>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-600/30 bg-amber-950/20">
                    <span className="text-sm text-amber-300">
                      Estas seguro de pausar tu cuenta?
                    </span>
                    <Button
                      size="sm"
                      onClick={handleStatusChange}
                      disabled={statusChanging}
                      className="bg-amber-600 hover:bg-amber-700 text-white gap-1"
                    >
                      {statusChanging ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Pause className="h-3.5 w-3.5" />
                      )}
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmingStatusChange(false)}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-400">
                  Tu cuenta esta pausada. El storefront no esta visible y no se
                  reciben leads. Podes reactivarla ahora.
                </p>
                {!confirmingStatusChange ? (
                  <Button
                    variant="outline"
                    onClick={() => setConfirmingStatusChange(true)}
                    className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Reactivar cuenta
                  </Button>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-600/30 bg-emerald-950/20">
                    <span className="text-sm text-emerald-300">
                      Reactivar tu cuenta?
                    </span>
                    <Button
                      size="sm"
                      onClick={handleStatusChange}
                      disabled={statusChanging}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      {statusChanging ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmingStatusChange(false)}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
