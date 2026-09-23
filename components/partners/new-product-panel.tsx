'use client'

/**
 * Fase 3 pieza C — panel "Nuevo producto" en una sola pantalla.
 *
 * Antes: Studio (IA) → modal "Agregar al catálogo" → `/workspace/catalog` con
 * MockupPicker, hasta 2N vueltas para N colores. Ahora: subís tu diseño,
 * elegís prenda/colores/lado/tamaño, ves la vista previa en vivo (compositor
 * único, pieza B), ponés nombre y precio, publicás. Todo acá.
 *
 * No sube nada a R2 hasta el submit — la vista previa usa
 * `/api/partners/products/mockup-preview` (data URL, no persiste). El submit
 * pega a `/api/partners/products/from-design`, que ya corre TODAS las
 * validaciones de negocio (policy, precio mínimo, piso de costo, gate de
 * origen, límite de plan) — este componente solo da feedback inmediato en la
 * UI, nunca es la fuente de verdad.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Upload, X, Check, AlertTriangle, ImageIcon, Sparkles } from 'lucide-react'
import { authFetch } from '@/lib/partners/auth-fetch'
import { cn } from '@/lib/utils'
import type { PublicGarmentPricing } from '@/lib/partners/garment-pricing.server'
import type { MockupPlacement, MockupSide, MockupSize } from '@/lib/mockup/compose'
import {
  buildFromDesignPayload,
  suggestProductName,
  validatePriceLive,
  type NewProductFormState,
  type SidePick,
} from '@/lib/partners/new-product-payload'

// Nombres comerciales — CATALOG_PRODUCTS.name es descriptivo ("Buzo Hoodie
// Oversize"), pero el partner conoce la prenda por su nombre de marca.
const COMMERCIAL_NAME: Record<string, string> = {
  'aldea-classic-tshirt': 'Aldea',
  'aura-oversize-tshirt': 'Aura',
  'remera-clasica-mujer': 'Buenos Aires',
  'remera-crop-mujer': 'Bahamas',
  'musculosa-bali': 'Bali',
  'buzo-cuello-redondo': 'Berlin',
  'buzo-hoodie-unisex': 'Boston',
  'remera-infantil': 'Bambino',
  totebag: 'Bahía',
}

const SIZE_LABEL: Record<MockupSize, { label: string; front: string; back: string }> = {
  chico: { label: 'Chico', front: '~9 cm', back: '~14 cm' },
  mediano: { label: 'Mediano', front: '~24 cm', back: '~24 cm' },
  grande: { label: 'Grande', front: '~35 cm', back: '~35 cm' },
}

const PLACEMENT_LABEL: Record<MockupPlacement, string> = {
  'pecho-izq': 'Pecho (izquierda)',
  centro: 'Centro',
  nuca: 'Nuca',
}

type SideMode = 'front' | 'back' | 'both'

interface GarmentColorOption {
  key: string
  name: string
  hex: string
  front: boolean
  back: boolean
}

interface GarmentOption {
  key: string
  name: string
  category: string
  colors: GarmentColorOption[]
}

interface DesignAsset {
  id: string
  public_url: string
  created_at: string
}

interface UploadResult {
  url: string
  warnings: string[]
}

export interface NewProductPanelProps {
  open: boolean
  onClose: () => void
  onCreated: (product: any) => void
  garmentPricing?: Record<string, PublicGarmentPricing>
  initialDesignUrl?: string | null
  initialBackDesignUrl?: string | null
  initialGarmentKey?: string | null
  initialColor?: string | null
}

export function NewProductPanel({
  open,
  onClose,
  onCreated,
  garmentPricing = {},
  initialDesignUrl = null,
  initialBackDesignUrl = null,
  initialGarmentKey = null,
  initialColor = null,
}: NewProductPanelProps) {
  // ---- Diseño ------------------------------------------------------------
  const [frontDesign, setFrontDesign] = useState<UploadResult | null>(
    initialDesignUrl ? { url: initialDesignUrl, warnings: [] } : null,
  )
  const [backDesign, setBackDesign] = useState<UploadResult | null>(
    initialBackDesignUrl ? { url: initialBackDesignUrl, warnings: [] } : null,
  )
  const [sameDesignBothSides, setSameDesignBothSides] = useState(!initialBackDesignUrl)
  const [uploadingSide, setUploadingSide] = useState<MockupSide | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showLibrary, setShowLibrary] = useState<MockupSide | null>(null)
  const [designAssets, setDesignAssets] = useState<DesignAsset[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)

  // ---- Prenda y colores ---------------------------------------------------
  const [garments, setGarments] = useState<GarmentOption[]>([])
  const [loadingGarments, setLoadingGarments] = useState(true)
  const [garmentKey, setGarmentKey] = useState<string>(initialGarmentKey || '')
  const [colors, setColors] = useState<string[]>(initialColor ? [initialColor] : [])

  // ---- Dónde va ------------------------------------------------------------
  const [sideMode, setSideMode] = useState<SideMode>('both')
  const [size, setSize] = useState<MockupSize>('mediano')
  const [frontPlacement, setFrontPlacement] = useState<MockupPlacement>('centro')
  const [backPlacement, setBackPlacement] = useState<MockupPlacement>('centro')

  // ---- Nombre y precio -----------------------------------------------------
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [price, setPrice] = useState('')

  // ---- Vista previa --------------------------------------------------------
  const [previewFront, setPreviewFront] = useState<string | null>(null)
  const [previewBack, setPreviewBack] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // ---- Submit ---------------------------------------------------------------
  const [submitting, setSubmitting] = useState<'draft' | 'published' | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const selectedGarment = garments.find((g) => g.key === garmentKey) || null
  const commercialName = garmentKey ? COMMERCIAL_NAME[garmentKey] || selectedGarment?.name || garmentKey : null
  const cost = garmentKey ? garmentPricing[garmentKey]?.myPrice ?? null : null

  // ---------------------------------------------------------------------
  // Cargar prendas/colores disponibles (con base real en el compositor)
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      setLoadingGarments(true)
      try {
        const res = await authFetch('/api/partners/products/garment-options')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setGarments(Array.isArray(data.garments) ? data.garments : [])
      } catch {
        // silencioso — el panel queda sin prendas, se ve el estado vacío
      } finally {
        if (!cancelled) setLoadingGarments(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  // Auto-sugerir nombre mientras el partner no lo edite a mano
  useEffect(() => {
    if (nameTouched) return
    const designLabel = frontDesign || backDesign ? 'Diseño' : null
    setName(suggestProductName(designLabel, commercialName))
  }, [commercialName, frontDesign, backDesign, nameTouched])

  // ---------------------------------------------------------------------
  // Subida de diseño (drag & drop o click)
  // ---------------------------------------------------------------------
  const uploadFile = useCallback(async (file: File, side: MockupSide) => {
    setUploadError(null)
    setUploadingSide(side)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await authFetch('/api/partners/design/upload', { method: 'POST', body: formData })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        setUploadError(data?.error || 'No pudimos subir el diseño. Probá de nuevo.')
        return
      }
      const result: UploadResult = { url: data.url, warnings: data.warnings || [] }
      if (side === 'front') setFrontDesign(result)
      else setBackDesign(result)
    } catch {
      setUploadError('No pudimos subir el diseño. Revisá tu conexión.')
    } finally {
      setUploadingSide(null)
    }
  }, [])

  const openLibrary = useCallback(async (side: MockupSide) => {
    setShowLibrary((current) => (current === side ? null : side))
    if (designAssets.length > 0) return
    setLoadingAssets(true)
    try {
      const res = await authFetch('/api/partners/design/assets?type=design&limit=50')
      if (res.ok) {
        const data = await res.json()
        setDesignAssets(Array.isArray(data.assets) ? data.assets : [])
      }
    } catch {
      // silencioso
    } finally {
      setLoadingAssets(false)
    }
  }, [designAssets.length])

  // ---------------------------------------------------------------------
  // Vista previa en vivo (debounced ~400ms) — SIEMPRE frente y dorso lado a
  // lado, el lado sin diseño sale con la prenda lisa.
  // ---------------------------------------------------------------------
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewSeq = useRef(0)

  const effectiveBackDesign = sideMode === 'both' && sameDesignBothSides ? frontDesign : backDesign
  const wantsFront = sideMode === 'front' || sideMode === 'both'
  const wantsBack = sideMode === 'back' || sideMode === 'both'

  useEffect(() => {
    if (!open || !garmentKey || colors.length === 0) {
      setPreviewFront(null)
      setPreviewBack(null)
      return
    }
    const color = colors[0]
    const mySeq = ++previewSeq.current

    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(async () => {
      setPreviewLoading(true)
      setPreviewError(null)
      try {
        const calls: Promise<any>[] = []
        calls.push(
          authFetch('/api/partners/products/mockup-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              designUrl: wantsFront ? frontDesign?.url : undefined,
              garmentKey,
              color,
              side: 'front',
              size,
              placement: frontPlacement,
            }),
          }).then((r) => r.json()),
        )
        calls.push(
          authFetch('/api/partners/products/mockup-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              designUrl: wantsBack ? effectiveBackDesign?.url : undefined,
              garmentKey,
              color,
              side: 'back',
              size,
              placement: backPlacement,
            }),
          }).then((r) => r.json()),
        )
        const [frontRes, backRes] = await Promise.all(calls)
        if (previewSeq.current !== mySeq) return
        if (frontRes?.previewUrl) setPreviewFront(frontRes.previewUrl)
        if (backRes?.previewUrl) setPreviewBack(backRes.previewUrl)
        if (!frontRes?.previewUrl && !backRes?.previewUrl) {
          setPreviewError(frontRes?.error || backRes?.error || 'No pudimos generar la vista previa')
        }
      } catch {
        if (previewSeq.current === mySeq) setPreviewError('No pudimos generar la vista previa')
      } finally {
        if (previewSeq.current === mySeq) setPreviewLoading(false)
      }
    }, 400)

    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, garmentKey, colors, size, frontPlacement, backPlacement, frontDesign?.url, effectiveBackDesign?.url, wantsFront, wantsBack])

  // ---------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------
  const priceValidation = validatePriceLive(price, cost)

  const buildState = (status: 'draft' | 'published'): NewProductFormState => {
    const front: SidePick | null = wantsFront
      ? { designUrl: frontDesign?.url || null, size, placement: frontPlacement }
      : null
    const back: SidePick | null = wantsBack
      ? { designUrl: effectiveBackDesign?.url || null, size, placement: backPlacement }
      : null
    return { name, price, garmentKey, colors, front, back, status }
  }

  const canSubmit = !!garmentKey && colors.length > 0 && !!name.trim() && priceValidation.ok

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!canSubmit) return
    setSubmitting(status)
    setSubmitError(null)
    try {
      const payload = buildFromDesignPayload(buildState(status))
      const res = await authFetch('/api/partners/products/from-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.product) {
        setSubmitError(data?.error || 'No pudimos crear el producto. Probá de nuevo.')
        return
      }
      onCreated(data.product)
    } catch {
      setSubmitError('Falló la conexión. Probá de nuevo.')
    } finally {
      setSubmitting(null)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nuevo producto"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-zinc-950 border-l border-zinc-800/80 overflow-y-auto animate-in slide-in-from-right duration-300"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/80 sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10">
          <div>
            <h3 className="text-base font-bold text-zinc-100">Nuevo producto</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Tu diseño sobre nuestras prendas — todo en una pantalla</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 p-6">
          {/* Preview — arriba en mobile, sticky a la derecha en desktop */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-24 h-fit space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Vista previa</p>
            <div className="grid grid-cols-2 gap-2" data-testid="new-product-preview">
              <PreviewSlot label="Frente" src={previewFront} loading={previewLoading} />
              <PreviewSlot label="Dorso" src={previewBack} loading={previewLoading} />
            </div>
            {previewError && <p className="text-xs text-amber-400">{previewError}</p>}
            {!garmentKey && <p className="text-xs text-zinc-500">Elegí una prenda para ver la vista previa.</p>}
          </div>

          <div className="order-2 lg:order-1 space-y-8">
            {/* Bloque 1 — Diseño */}
            <section aria-labelledby="np-design-heading" className="space-y-3">
              <h4 id="np-design-heading" className="text-sm font-semibold text-zinc-200">1. Tu diseño</h4>
              <DesignDropzone
                side="front"
                design={frontDesign}
                uploading={uploadingSide === 'front'}
                onFile={(f) => uploadFile(f, 'front')}
                onClear={() => setFrontDesign(null)}
                onOpenLibrary={() => openLibrary('front')}
              />
              {showLibrary === 'front' && (
                <DesignLibrary
                  assets={designAssets}
                  loading={loadingAssets}
                  onPick={(url) => {
                    setFrontDesign({ url, warnings: [] })
                    setShowLibrary(null)
                  }}
                />
              )}
              {frontDesign && frontDesign.warnings.length > 0 && (
                <ul className="space-y-1">
                  {frontDesign.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              )}
              {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
            </section>

            {/* Bloque 2 — Prenda y colores */}
            <section aria-labelledby="np-garment-heading" className="space-y-3">
              <h4 id="np-garment-heading" className="text-sm font-semibold text-zinc-200">2. Prenda y colores</h4>
              {loadingGarments ? (
                <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="Prendas">
                  {garments.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      aria-pressed={garmentKey === g.key}
                      onClick={() => {
                        setGarmentKey(g.key)
                        setColors((prev) => (g.colors.some((c) => prev.includes(c.key)) ? prev : []))
                      }}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                        garmentKey === g.key
                          ? 'border-violet-500 bg-violet-500/10 text-zinc-100'
                          : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700',
                      )}
                    >
                      <span className="font-medium">{COMMERCIAL_NAME[g.key] || g.name}</span>
                      <span className="block text-[11px] text-zinc-500">{g.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedGarment && (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Colores">
                  {selectedGarment.colors.map((c) => {
                    const available = wantsFront ? c.front : true
                    const availableBack = wantsBack ? c.back : true
                    const disabled = !available || !availableBack
                    const selected = colors.includes(c.key)
                    return (
                      <button
                        key={c.key}
                        type="button"
                        disabled={disabled}
                        aria-pressed={selected}
                        title={disabled ? 'Todavía no tenemos base para este color/lado' : c.name}
                        onClick={() =>
                          setColors((prev) => (prev.includes(c.key) ? prev.filter((k) => k !== c.key) : [...prev, c.key]))
                        }
                        className={cn(
                          'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                          disabled && 'opacity-40 cursor-not-allowed',
                          selected ? 'border-violet-500 bg-violet-500/10 text-zinc-100' : 'border-zinc-800 text-zinc-300 hover:border-zinc-700',
                        )}
                      >
                        <span className="w-3 h-3 rounded-full border border-zinc-700" style={{ backgroundColor: c.hex }} />
                        {c.name}
                        {selected && <Check className="w-3 h-3" />}
                      </button>
                    )
                  })}
                </div>
              )}
              {selectedGarment && colors.length === 0 && (
                <p className="text-xs text-zinc-500">Elegí al menos un color.</p>
              )}
            </section>

            {/* Bloque 3 — Dónde va */}
            <section aria-labelledby="np-placement-heading" className="space-y-4">
              <h4 id="np-placement-heading" className="text-sm font-semibold text-zinc-200">3. Dónde va</h4>

              <div className="flex gap-2" role="radiogroup" aria-label="Lado">
                {(['front', 'back', 'both'] as SideMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={sideMode === m}
                    onClick={() => setSideMode(m)}
                    className={cn(
                      'flex-1 rounded-lg border px-3 py-2 text-sm transition-colors',
                      sideMode === m ? 'border-violet-500 bg-violet-500/10 text-zinc-100' : 'border-zinc-800 text-zinc-300 hover:border-zinc-700',
                    )}
                  >
                    {m === 'front' ? 'Frente' : m === 'back' ? 'Espalda' : 'Los dos'}
                  </button>
                ))}
              </div>

              {sideMode === 'both' && (
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={!sameDesignBothSides}
                    onChange={(e) => setSameDesignBothSides(!e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900"
                  />
                  Usar un diseño distinto en la espalda
                </label>
              )}

              {sideMode === 'both' && !sameDesignBothSides && (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-400">Diseño de la espalda</p>
                  <DesignDropzone
                    side="back"
                    design={backDesign}
                    uploading={uploadingSide === 'back'}
                    onFile={(f) => uploadFile(f, 'back')}
                    onClear={() => setBackDesign(null)}
                    onOpenLibrary={() => openLibrary('back')}
                  />
                  {showLibrary === 'back' && (
                    <DesignLibrary
                      assets={designAssets}
                      loading={loadingAssets}
                      onPick={(url) => {
                        setBackDesign({ url, warnings: [] })
                        setShowLibrary(null)
                      }}
                    />
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs text-zinc-400">Tamaño</p>
                <div className="flex gap-2" role="radiogroup" aria-label="Tamaño">
                  {(Object.keys(SIZE_LABEL) as MockupSize[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={size === s}
                      onClick={() => setSize(s)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-xs transition-colors',
                        size === s ? 'border-violet-500 bg-violet-500/10 text-zinc-100' : 'border-zinc-800 text-zinc-300 hover:border-zinc-700',
                      )}
                    >
                      {SIZE_LABEL[s].label}
                      <span className="block text-[10px] text-zinc-500">
                        {wantsFront ? SIZE_LABEL[s].front : SIZE_LABEL[s].back}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {wantsFront && (
                  <PlacementSelect
                    label="Ubicación frente"
                    value={frontPlacement}
                    options={['pecho-izq', 'centro']}
                    onChange={setFrontPlacement}
                  />
                )}
                {wantsBack && (
                  <PlacementSelect
                    label="Ubicación espalda"
                    value={backPlacement}
                    options={['nuca', 'centro']}
                    onChange={setBackPlacement}
                  />
                )}
              </div>
            </section>

            {/* Bloque 4 — Nombre y precio */}
            <section aria-labelledby="np-name-heading" className="space-y-3">
              <h4 id="np-name-heading" className="text-sm font-semibold text-zinc-200">4. Nombre y precio</h4>
              <div className="space-y-1.5">
                <label htmlFor="np-name" className="text-xs text-zinc-400">Nombre</label>
                <input
                  id="np-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setNameTouched(true)
                  }}
                  placeholder="Ej: Buho · Aldea"
                  className="w-full h-10 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="np-price" className="text-xs text-zinc-400">
                  Precio {cost ? <span className="text-zinc-600">(tu costo: ${cost.toLocaleString('es-AR')})</span> : null}
                </label>
                <input
                  id="np-price"
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ej: 32000"
                  aria-invalid={!priceValidation.ok && price.trim().length > 0}
                  className="w-full h-10 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                {price.trim().length > 0 && !priceValidation.ok && (
                  <p className="text-xs text-red-400">{priceValidation.reason}</p>
                )}
              </div>

              {submitError && <p className="text-xs text-red-400" role="alert">{submitError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={!canSubmit || submitting !== null}
                  onClick={() => handleSubmit('draft')}
                  className="flex-1 h-11 rounded-md border border-zinc-700 text-zinc-200 text-sm font-medium hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting === 'draft' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar borrador
                </button>
                <button
                  type="button"
                  disabled={!canSubmit || submitting !== null}
                  onClick={() => handleSubmit('published')}
                  className="flex-1 h-11 rounded-md bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting === 'published' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Publicar
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

function PreviewSlot({ label, src, loading }: { label: string; src: string | null; loading: boolean }) {
  return (
    <div className="relative aspect-square rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden flex items-center justify-center">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="w-full h-full object-cover" />
      ) : loading ? (
        <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
      ) : (
        <ImageIcon className="w-6 h-6 text-zinc-700" />
      )}
      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium uppercase tracking-wide bg-black/60 text-white px-1.5 py-0.5 rounded">
        {label}
      </span>
      {loading && src && (
        <div className="absolute top-1.5 right-1.5">
          <Loader2 className="w-3.5 h-3.5 text-white/80 animate-spin" />
        </div>
      )}
    </div>
  )
}

function PlacementSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: MockupPlacement
  options: MockupPlacement[]
  onChange: (p: MockupPlacement) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-zinc-400 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MockupPlacement)}
        className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-900/60 px-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {PLACEMENT_LABEL[o]}
          </option>
        ))}
      </select>
    </div>
  )
}

function DesignDropzone({
  side,
  design,
  uploading,
  onFile,
  onClear,
  onOpenLibrary,
}: {
  side: MockupSide
  design: UploadResult | null
  uploading: boolean
  onFile: (f: File) => void
  onClear: () => void
  onOpenLibrary: () => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const inputId = `np-dropzone-${side}`

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed p-4 text-center transition-colors',
        dragOver ? 'border-violet-500 bg-violet-500/5' : 'border-zinc-700 bg-zinc-900/30',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) onFile(file)
      }}
    >
      {design ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={design.url} alt="Diseño" className="w-16 h-16 object-contain rounded bg-zinc-800" />
          <div className="flex-1 text-left text-xs text-zinc-400">Diseño cargado</div>
          <button type="button" onClick={onClear} className="text-zinc-500 hover:text-red-400 p-1" aria-label="Quitar diseño">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : uploading ? (
        <div className="flex flex-col items-center gap-1.5 py-2">
          <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          <span className="text-xs text-zinc-500">Subiendo...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2">
          <Upload className="w-5 h-5 text-zinc-500" />
          <label htmlFor={inputId} className="text-xs font-medium text-violet-400 hover:text-violet-300 cursor-pointer">
            Arrastrá tu diseño o hacé click acá
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
            }}
          />
          <button
            type="button"
            onClick={onOpenLibrary}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200"
          >
            <Sparkles className="w-3 h-3" />
            o elegí uno tuyo del Studio
          </button>
        </div>
      )}
    </div>
  )
}

function DesignLibrary({
  assets,
  loading,
  onPick,
}: {
  assets: DesignAsset[]
  loading: boolean
  onPick: (url: string) => void
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
      {loading ? (
        <Loader2 className="w-4 h-4 text-zinc-600 animate-spin mx-auto my-2" />
      ) : assets.length === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-2">Todavía no subiste ni generaste diseños.</p>
      ) : (
        <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto">
          {assets.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onPick(a.public_url)}
              className="relative aspect-square rounded border border-zinc-800 overflow-hidden hover:border-violet-500"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.public_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
