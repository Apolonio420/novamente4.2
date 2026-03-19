'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Instagram,
  Facebook,
  LayoutGrid,
  ShoppingBag,
  Code,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { authFetch } from '@/lib/partners/auth-fetch'
import { LockedFeature } from '@/components/partners/locked-feature'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SetupProgress {
  pixel_installed: boolean
  facebook_page: boolean
  instagram_business: boolean
  business_suite: boolean
  product_catalog: boolean
}

const DEFAULT_PROGRESS: SetupProgress = {
  pixel_installed: false,
  facebook_page: false,
  instagram_business: false,
  business_suite: false,
  product_catalog: false,
}

type StepKey = keyof SetupProgress

interface StepConfig {
  key: StepKey
  title: string
  icon: React.ElementType
  content: React.ReactNode
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MetaBusinessPage() {
  const [plan, setPlan] = useState<string>('starter')
  const [progress, setProgress] = useState<SetupProgress>(DEFAULT_PROGRESS)
  const [pixelId, setPixelId] = useState('')
  const [openStep, setOpenStep] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)

  // Fetch initial data
  useEffect(() => {
    async function load() {
      try {
        // Fetch plan info
        const dashRes = await authFetch('/api/partners/dashboard')
        if (dashRes.ok) {
          const dash = await dashRes.json()
          setPlan(dash.tenant?.plan || 'starter')
          setTenantSlug(dash.tenant?.slug || null)
        }

        // Fetch meta-business data
        const metaRes = await authFetch('/api/partners/meta-business')
        if (metaRes.ok) {
          const data = await metaRes.json()
          setProgress({ ...DEFAULT_PROGRESS, ...data.meta_setup_progress })
          setPixelId(data.meta_pixel_id || '')
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Save progress to API
  const saveProgress = useCallback(
    async (key: StepKey, value: boolean) => {
      const updated = { ...progress, [key]: value }
      setProgress(updated)

      setSaving(true)
      try {
        await authFetch('/api/partners/meta-business', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meta_setup_progress: updated }),
        })
      } catch {
        // revert on error
        setProgress(progress)
      } finally {
        setSaving(false)
      }
    },
    [progress],
  )

  // Save pixel ID
  const savePixelId = useCallback(async () => {
    setSaving(true)
    try {
      const res = await authFetch('/api/partners/meta-business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta_pixel_id: pixelId.trim(),
          meta_setup_progress: { ...progress, pixel_installed: !!pixelId.trim() },
        }),
      })
      if (res.ok) {
        setProgress((prev) => ({ ...prev, pixel_installed: !!pixelId.trim() }))
      }
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }, [pixelId, progress])

  // Progress calculation
  const completedSteps = Object.values(progress).filter(Boolean).length
  const totalSteps = 5
  const progressPct = Math.round((completedSteps / totalSteps) * 100)

  // Non-Pro locked state
  if (!loading && plan !== 'pro') {
    return (
      <div className="max-w-3xl">
        <LockedFeature
          title="Meta Business Setup"
          description="Configura tu presencia completa en Meta (Facebook + Instagram). Te guiamos paso a paso para conectar tu negocio con las plataformas de Meta."
          requiredPlan="pro"
          icon={Globe}
          features={[
            'Instalacion del Meta Pixel para tracking',
            'Creacion de pagina de Facebook',
            'Conversion a cuenta de Instagram Business',
            'Configuracion de Meta Business Suite',
            'Catalogo de productos en Meta',
          ]}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Step definitions
  const steps: StepConfig[] = [
    {
      key: 'pixel_installed',
      title: 'Meta Pixel',
      icon: Code,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            El Meta Pixel rastrea las visitas y conversiones de tu storefront.
            Encontra tu Pixel ID en{' '}
            <a
              href="https://business.facebook.com/events_manager2/list/pixel/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline inline-flex items-center gap-1"
            >
              Events Manager <ExternalLink className="w-3 h-3" />
            </a>
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 123456789012345"
              className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <Button
              onClick={savePixelId}
              disabled={saving || !pixelId.trim()}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Instalar'
              )}
            </Button>
          </div>
          {progress.pixel_installed && pixelId && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Check className="w-4 h-4" />
              Pixel {pixelId} instalado
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'facebook_page',
      title: 'Pagina de Facebook',
      icon: Facebook,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Necesitas una pagina de Facebook para tu marca para poder crear anuncios.
          </p>
          <ol className="text-sm text-zinc-300 space-y-2 list-decimal list-inside">
            <li>
              Anda a{' '}
              <a
                href="https://www.facebook.com/pages/create"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                facebook.com/pages/create
              </a>
            </li>
            <li>Selecciona &quot;Empresa o marca&quot;</li>
            <li>Completa el nombre de tu marca y categoria</li>
            <li>Subi tu logo como foto de perfil</li>
            <li>Agrega una foto de portada (recomendado: 820x312px)</li>
            <li>Completa la informacion de contacto y descripcion</li>
          </ol>
          <StepCheckbox
            checked={progress.facebook_page}
            onChange={(v) => saveProgress('facebook_page', v)}
            label="Ya cree mi pagina de Facebook"
          />
        </div>
      ),
    },
    {
      key: 'instagram_business',
      title: 'Instagram Business',
      icon: Instagram,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Convierte tu cuenta de Instagram a Business para acceder a estadisticas y anuncios.
          </p>
          <ol className="text-sm text-zinc-300 space-y-2 list-decimal list-inside">
            <li>Abri Instagram y anda a tu perfil</li>
            <li>Toca el menu (tres lineas) y despues &quot;Configuracion&quot;</li>
            <li>Selecciona &quot;Cuenta&quot; y luego &quot;Cambiar a cuenta profesional&quot;</li>
            <li>Elige &quot;Empresa&quot; y selecciona tu categoria</li>
            <li>Vincula tu pagina de Facebook cuando te lo pida</li>
            <li>Completa tu informacion de contacto</li>
          </ol>
          <StepCheckbox
            checked={progress.instagram_business}
            onChange={(v) => saveProgress('instagram_business', v)}
            label="Ya configure Instagram Business"
          />
        </div>
      ),
    },
    {
      key: 'business_suite',
      title: 'Meta Business Suite',
      icon: Globe,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Meta Business Suite te permite gestionar Facebook e Instagram desde un solo lugar.
          </p>
          <ol className="text-sm text-zinc-300 space-y-2 list-decimal list-inside">
            <li>
              Anda a{' '}
              <a
                href="https://business.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                business.facebook.com
              </a>
            </li>
            <li>Inicia sesion con tu cuenta de Facebook</li>
            <li>Si no tenes un Business Manager, crea uno con el nombre de tu marca</li>
            <li>Agrega tu pagina de Facebook al Business Manager</li>
            <li>Conecta tu cuenta de Instagram Business</li>
            <li>Agrega tu Meta Pixel en &quot;Origenes de datos&quot;</li>
          </ol>
          <StepCheckbox
            checked={progress.business_suite}
            onChange={(v) => saveProgress('business_suite', v)}
            label="Ya configure Meta Business Suite"
          />
        </div>
      ),
    },
    {
      key: 'product_catalog',
      title: 'Catalogo de Productos',
      icon: ShoppingBag,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            El catalogo de productos te permite crear anuncios dinamicos y etiquetar productos en Instagram.
          </p>
          {tenantSlug && (
            <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-3">
              <p className="text-xs text-zinc-500 mb-1">Tu feed de productos:</p>
              <code className="text-sm text-purple-400 break-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}/api/partners/feeds/meta?slug={tenantSlug}
              </code>
            </div>
          )}
          <ol className="text-sm text-zinc-300 space-y-2 list-decimal list-inside">
            <li>En Meta Business Suite, anda a &quot;Comercio&quot; &gt; &quot;Catalogos&quot;</li>
            <li>Crea un nuevo catalogo tipo &quot;Comercio electronico&quot;</li>
            <li>Selecciona &quot;Subir informacion del producto&quot; &gt; &quot;Feed de datos&quot;</li>
            <li>Pega la URL de tu feed de productos (arriba)</li>
            <li>Configura la actualizacion automatica (recomendado: diaria)</li>
          </ol>
          <StepCheckbox
            checked={progress.product_catalog}
            onChange={(v) => saveProgress('product_catalog', v)}
            label="Ya configure mi catalogo de productos"
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Meta Business Setup</h1>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
            Pro
          </Badge>
        </div>
        <p className="text-zinc-400 text-sm">
          Configura tu presencia en Meta paso a paso para empezar a hacer anuncios.
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">
            {completedSteps} de {totalSteps} pasos completados
          </span>
          <span className="text-sm font-medium text-purple-400">{progressPct}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Accordion steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isOpen = openStep === index
          const isCompleted = progress[step.key]
          const Icon = step.icon

          return (
            <div
              key={step.key}
              className={`rounded-xl border transition-colors ${
                isCompleted
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-zinc-800 bg-zinc-900/50'
              }`}
            >
              {/* Step header */}
              <button
                onClick={() => setOpenStep(isOpen ? null : index)}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                {/* Step number / check */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </div>

                {/* Icon + title */}
                <Icon className={`w-5 h-5 shrink-0 ${isCompleted ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span className={`flex-1 font-medium ${isCompleted ? 'text-emerald-300' : 'text-zinc-200'}`}>
                  {step.title}
                </span>

                {/* Chevron */}
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-zinc-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                )}
              </button>

              {/* Step content */}
              {isOpen && (
                <div className="px-4 pb-4 pl-16">{step.content}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Completion message */}
      {completedSteps === totalSteps && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-emerald-300 mb-1">
            Setup completo
          </h3>
          <p className="text-sm text-zinc-400">
            Tu Meta Business esta listo. Ahora podes crear anuncios desde{' '}
            <a href="/workspace/meta-ads" className="text-purple-400 hover:underline">
              Meta Ads
            </a>
            .
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          checked
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-zinc-600 group-hover:border-zinc-400'
        }`}
        onClick={() => onChange(!checked)}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span
        className={`text-sm ${checked ? 'text-emerald-300' : 'text-zinc-300'}`}
        onClick={() => onChange(!checked)}
      >
        {label}
      </span>
    </label>
  )
}
