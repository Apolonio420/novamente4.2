'use client'

/**
 * Selector de foto de producto para el catálogo (Fase 2, gate "solo nuestros
 * mockups" — ver lib/partners/product-image-origin.ts).
 *
 * Antes esta imagen se subía en libre (cualquier jpg/png) via `ImageUpload`
 * con `type="product"`, y el servidor ahora la rechaza (400) porque el
 * catálogo debe mostrar SIEMPRE nuestras prendas reales con el diseño del
 * partner. Este componente reemplaza esa subida por: (a) elegir uno de los
 * mockups ya generados en el Studio para este tenant, reusando el endpoint
 * existente `GET /api/partners/design/assets?type=mockup`, o (b) un botón que
 * lleva al Studio a generar uno nuevo.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wand2, Check, Loader2, ImageOff, Shirt } from 'lucide-react'
import { authFetch } from '@/lib/partners/auth-fetch'
import { cn } from '@/lib/utils'
import { CATALOG_PRODUCTS } from '@/lib/catalog/products'

interface MockupAsset {
  id: string
  public_url: string
  metadata?: { garmentType?: string; garmentColor?: string; side?: string } | null
  created_at: string
}

/**
 * Fase 3 pieza E3 UI — botón "Dorso liso": genera la prenda lisa de este
 * lado (`POST /api/partners/products/plain-side`) y completa el slot solo.
 * Si no se sabe la prenda/color todavía (producto viejo sin `garmentKey`),
 * el picker deja elegirla acá mismo antes de generar.
 */
interface PlainSideConfig {
  side: 'front' | 'back'
  garmentKey: string | null
  colorKey: string | null
  /** obligatorio para publicar — solo cambia el texto de ayuda. */
  required?: boolean
}

interface MockupPickerProps {
  value: string | null
  onChange: (url: string | null) => void
  className?: string
  /** Clase de alto del botón principal (default h-28). */
  heightClassName?: string
  plainSide?: PlainSideConfig
}

export function MockupPicker({ value, onChange, className, heightClassName = 'h-28', plainSide }: MockupPickerProps) {
  const [assets, setAssets] = useState<MockupAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  // Estado del selector de prenda/color cuando plainSide no trae garmentKey.
  const [pickGarmentKey, setPickGarmentKey] = useState(plainSide?.garmentKey || '')
  const [pickColorKey, setPickColorKey] = useState(plainSide?.colorKey || '')
  const [generatingPlain, setGeneratingPlain] = useState(false)
  const [plainError, setPlainError] = useState<string | null>(null)

  const pickGarment = CATALOG_PRODUCTS.find((g) => g.key === pickGarmentKey) || null

  const handleGeneratePlain = async () => {
    if (!plainSide) return
    const garmentKey = plainSide.garmentKey || pickGarmentKey
    const colorKey = plainSide.colorKey || pickColorKey
    if (!garmentKey || !colorKey) {
      setPlainError('Elegí prenda y color primero')
      return
    }
    setPlainError(null)
    setGeneratingPlain(true)
    try {
      const res = await authFetch('/api/partners/products/plain-side', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garmentKey, color: colorKey, side: plainSide.side }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.url) {
        setPlainError(data?.error || 'No pudimos generar el dorso liso')
        return
      }
      onChange(data.url)
    } catch {
      setPlainError('Falló la conexión, probá de nuevo')
    } finally {
      setGeneratingPlain(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await authFetch('/api/partners/design/assets?type=mockup&limit=50')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setAssets(Array.isArray(data.assets) ? data.assets : [])
      } catch {
        // silencioso — el picker simplemente queda vacío, con el link al Studio
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className={cn('space-y-2', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative w-full rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 flex items-center justify-center overflow-hidden hover:border-violet-500/50 transition-colors',
          heightClassName,
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Mockup elegido" className="w-full h-full object-cover" />
        ) : loading ? (
          <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-zinc-500 px-2 text-center">
            <ImageOff className="w-5 h-5" />
            <span className="text-[10px]">Elegí un mockup</span>
          </div>
        )}
      </button>

      {open && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2 space-y-2">
          <p className="text-[11px] text-zinc-500">
            Tu tienda muestra nuestras prendas reales con tu diseño. Subí tu diseño en el
            Studio, elegí prenda y color, y el mockup aparece acá.
          </p>
          {assets.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto">
              {assets.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    onChange(a.public_url)
                    setOpen(false)
                  }}
                  className={cn(
                    'relative h-16 rounded border overflow-hidden',
                    value === a.public_url ? 'border-violet-500 ring-1 ring-violet-500' : 'border-zinc-800',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.public_url} alt="" className="w-full h-full object-cover" />
                  {value === a.public_url && (
                    <span className="absolute top-0.5 right-0.5 bg-violet-600 rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : !loading ? (
            <p className="text-xs text-zinc-600">Todavía no generaste ningún mockup.</p>
          ) : null}
          <Link
            href="/workspace/design-engine"
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 rounded-md border border-violet-500/30 bg-violet-500/10 h-8"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Crear mockup en el Studio
          </Link>
        </div>
      )}

      {plainSide && !value && (
        <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 p-2 space-y-1.5">
          {(!plainSide.garmentKey || !plainSide.colorKey) && (
            <div className="flex gap-1.5">
              {!plainSide.garmentKey && (
                <select
                  value={pickGarmentKey}
                  onChange={(e) => {
                    setPickGarmentKey(e.target.value)
                    setPickColorKey('')
                  }}
                  className="flex-1 h-7 text-[11px] rounded border border-zinc-800 bg-zinc-900/60 text-zinc-300 px-1"
                >
                  <option value="">Prenda…</option>
                  {CATALOG_PRODUCTS.map((g) => (
                    <option key={g.key} value={g.key}>{g.name}</option>
                  ))}
                </select>
              )}
              {!plainSide.colorKey && (
                <select
                  value={pickColorKey}
                  onChange={(e) => setPickColorKey(e.target.value)}
                  disabled={!pickGarment}
                  className="flex-1 h-7 text-[11px] rounded border border-zinc-800 bg-zinc-900/60 text-zinc-300 px-1 disabled:opacity-40"
                >
                  <option value="">Color…</option>
                  {pickGarment?.colors.map((c) => (
                    <option key={c.key} value={c.key}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={handleGeneratePlain}
            disabled={generatingPlain}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-200 hover:text-white rounded-md border border-zinc-700 bg-zinc-900/60 h-8 disabled:opacity-50"
          >
            {generatingPlain ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shirt className="w-3.5 h-3.5" />}
            Dorso liso
          </button>
          {plainSide.required && (
            <p className="text-[10px] text-amber-400/90">
              Hace falta el dorso (liso o con estampa) para publicar.
            </p>
          )}
          {plainError && <p className="text-[10px] text-red-400">{plainError}</p>}
        </div>
      )}
    </div>
  )
}
