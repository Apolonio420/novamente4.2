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
import { Wand2, Check, Loader2, ImageOff } from 'lucide-react'
import { authFetch } from '@/lib/partners/auth-fetch'
import { cn } from '@/lib/utils'

interface MockupAsset {
  id: string
  public_url: string
  metadata?: { garmentType?: string; garmentColor?: string; side?: string } | null
  created_at: string
}

interface MockupPickerProps {
  value: string | null
  onChange: (url: string | null) => void
  className?: string
}

export function MockupPicker({ value, onChange, className }: MockupPickerProps) {
  const [assets, setAssets] = useState<MockupAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

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
        className="relative w-full h-28 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 flex items-center justify-center overflow-hidden hover:border-violet-500/50 transition-colors"
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
    </div>
  )
}
