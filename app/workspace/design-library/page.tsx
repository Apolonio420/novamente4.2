"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { authFetch } from "@/lib/partners/auth-fetch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Wand2, Image as ImageIcon, Shirt, ExternalLink, Copy, Check, AlertTriangle, RotateCw } from "lucide-react"

interface AssetItem {
  id: string
  type: 'design' | 'mockup'
  url: string
  metadata?: Record<string, any> | null
  createdAt: string
}

type Filter = 'all' | 'design' | 'mockup'

type LoadError = 'auth' | 'server' | null

export default function DesignLibraryPage() {
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  // Antes un 401/500 nunca se distinguía de "no hay diseños" — la pantalla
  // vacía ("Todavía no generaste ningún diseño") se mostraba igual que una
  // sesión vencida o un error real de Supabase (auditoría workspace 10/10).
  const [loadError, setLoadError] = useState<LoadError>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    authFetch(`/api/partners/design/library?type=${filter}&limit=120`)
      .then(async (r) => {
        if (cancelled) return
        if (!r.ok) {
          setAssets([])
          setLoadError(r.status === 401 ? 'auth' : 'server')
          return
        }
        const data = await r.json()
        setAssets(Array.isArray(data?.assets) ? data.assets : [])
      })
      .catch(() => {
        if (cancelled) return
        setAssets([])
        setLoadError('server')
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [filter, reloadKey])

  const handleCopyUrl = async (asset: AssetItem) => {
    try {
      await navigator.clipboard.writeText(window.location.origin + asset.url)
      setCopiedId(asset.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }

  const totalDesigns = assets.filter(a => a.type === 'design').length
  const totalMockups = assets.filter(a => a.type === 'mockup').length

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-zinc-500">
          <Sparkles className="w-3 h-3" />
          Workspace
        </div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">Biblioteca de diseños</h1>
            <p className="text-sm text-zinc-400 max-w-xl">
              Todos los diseños y mockups generados con el Studio. Reusalos en productos del catálogo
              o descargá la imagen para tus campañas.
            </p>
          </div>
          <Link href="/workspace/design-engine">
            <Button>
              <Wand2 className="w-4 h-4 mr-2" />
              Generar nuevo
            </Button>
          </Link>
        </div>

        {/* Stats + filter */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-3 border-y border-zinc-800 py-3">
          <div className="flex items-center gap-4 text-sm">
            <span>
              <strong className="text-foreground">{assets.length}</strong>
              <span className="text-zinc-500 ml-1">total</span>
            </span>
            <span>
              <strong className="text-foreground">{totalDesigns}</strong>
              <span className="text-zinc-500 ml-1">diseños</span>
            </span>
            <span>
              <strong className="text-foreground">{totalMockups}</strong>
              <span className="text-zinc-500 ml-1">mockups</span>
            </span>
          </div>
          <div className="flex gap-2">
            {(['all', 'design', 'mockup'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded-md border transition ${
                  filter === f
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'design' ? 'Diseños' : 'Mockups'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <ErrorState kind={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : assets.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map(a => (
            <article
              key={a.id}
              className="group rounded-lg border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition overflow-hidden"
            >
              <div className="relative aspect-square bg-zinc-950">
                <Image
                  src={a.url}
                  alt={a.metadata?.prompt || 'Diseño Novamente'}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-contain"
                />
                <Badge
                  className={`absolute top-2 left-2 text-[10px] uppercase tracking-widest ${
                    a.type === 'design'
                      ? 'bg-primary/15 text-primary border-primary/30'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {a.type === 'design' ? (
                    <>
                      <Wand2 className="w-2.5 h-2.5 mr-1" />
                      Diseño
                    </>
                  ) : (
                    <>
                      <Shirt className="w-2.5 h-2.5 mr-1" />
                      Mockup
                    </>
                  )}
                </Badge>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {a.metadata?.prompt && (
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-snug">
                    {a.metadata.prompt}
                  </p>
                )}
                <div className="flex items-center gap-1">
                  <a href={a.url} target="_blank" rel="noopener" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Abrir
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyUrl(a)}
                    title="Copiar URL"
                  >
                    {copiedId === a.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                <span className="text-[10px] text-zinc-600">
                  {new Date(a.createdAt).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function ErrorState({ kind, onRetry }: { kind: 'auth' | 'server'; onRetry: () => void }) {
  if (kind === 'auth') {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Tu sesión venció</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Volvé a entrar para ver tu biblioteca de diseños.
        </p>
        <Link href="/partners/login?redirect=/workspace/design-library">
          <Button>Volver a entrar</Button>
        </Link>
      </div>
    )
  }
  return (
    <div className="text-center py-20 max-w-md mx-auto">
      <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">No pudimos cargar tu biblioteca</h2>
      <p className="text-sm text-zinc-400 mb-6">
        Hubo un error de conexión. Puede ser algo pasajero — probá de nuevo.
      </p>
      <Button onClick={onRetry}>
        <RotateCw className="w-4 h-4 mr-2" />
        Reintentar
      </Button>
    </div>
  )
}

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className="text-center py-20 max-w-md mx-auto">
      <ImageIcon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">
        {filter === 'all'
          ? 'Todavía no generaste ningún diseño'
          : filter === 'design'
          ? 'No hay diseños guardados'
          : 'No hay mockups guardados'}
      </h2>
      <p className="text-sm text-zinc-400 mb-6">
        Abrí el Studio y generá tu primer diseño con IA. Se guarda automáticamente acá para que lo
        reuses en tus productos.
      </p>
      <Link href="/workspace/design-engine">
        <Button>
          <Wand2 className="w-4 h-4 mr-2" />
          Ir al Studio
        </Button>
      </Link>
    </div>
  )
}
