'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus,
  Package,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  Check,
  Search,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  Wand2,
  ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ImageUpload } from '@/components/partners/image-upload'
import { authFetch } from '@/lib/partners/auth-fetch'
import {
  ALL_GARMENT_PRICING,
  formatPrice as formatGarmentPrice,
} from '@/lib/partners/garment-pricing'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductColorEntry {
  name: string
  hex: string
  frontImage: string
  backImage: string
}

interface Product {
  id: string
  tenant_id: string
  name: string
  description: string | null
  category: string | null
  slug: string
  price: number | null
  status: 'draft' | 'needs_review' | 'ready' | 'published' | 'hidden' | 'archived'
  images: string[]
  tags: string[]
  collection: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

type FormMode = 'closed' | 'create' | 'edit'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador', dot: 'bg-zinc-400' },
  { value: 'published', label: 'Publicado', dot: 'bg-emerald-400' },
  { value: 'hidden', label: 'Oculto', dot: 'bg-yellow-400' },
] as const

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-zinc-700/80 text-zinc-300',
  needs_review: 'bg-amber-900/60 text-amber-400',
  ready: 'bg-blue-900/60 text-blue-400',
  published: 'bg-emerald-900/60 text-emerald-400',
  hidden: 'bg-yellow-900/60 text-yellow-400',
  archived: 'bg-red-900/60 text-red-400',
}

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-zinc-400',
  needs_review: 'bg-amber-400',
  ready: 'bg-blue-400',
  published: 'bg-emerald-400',
  hidden: 'bg-yellow-400',
  archived: 'bg-red-400',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  needs_review: 'Revision',
  ready: 'Listo',
  published: 'Publicado',
  hidden: 'Oculto',
  archived: 'Archivado',
}

const PLACEHOLDER_GRADIENTS = [
  'from-violet-600 to-fuchsia-600',
  'from-blue-600 to-cyan-500',
  'from-emerald-600 to-teal-500',
  'from-amber-600 to-orange-500',
  'from-rose-600 to-pink-500',
  'from-indigo-600 to-violet-500',
]

const MAX_IMAGES = 5
const MAX_DESCRIPTION = 500

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Toast {
  message: string
  type: 'success' | 'error'
}

function getGradient(name: string) {
  const idx = name.charCodeAt(0) % PLACEHOLDER_GRADIENTS.length
  return PLACEHOLDER_GRADIENTS[idx]
}

function formatPrice(price: number | null) {
  if (price == null) return null
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(price)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CatalogPage() {
  // Data
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [planInfo, setPlanInfo] = useState<{ plan: string; maxProducts: number } | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Form
  const [formMode, setFormMode] = useState<FormMode>('closed')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formStatus, setFormStatus] = useState('draft')
  const [formImages, setFormImages] = useState<(string | null)[]>([null])

  // Rich metadata fields
  const [formColors, setFormColors] = useState<ProductColorEntry[]>([])
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L', 'XL'])
  const [formFeatures, setFormFeatures] = useState<string[]>([])
  const [formDetailedDesc, setFormDetailedDesc] = useState('')
  const [formCardDesc, setFormCardDesc] = useState('')
  const [formBrandValues, setFormBrandValues] = useState('')

  // AI copywriting state
  const [aiIdea, setAiIdea] = useState('')
  const [aiTone, setAiTone] = useState<'urban' | 'minimal' | 'fun' | 'premium' | 'sport' | 'romantic'>('urban')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiShowPanel, setAiShowPanel] = useState(false)

  // Bulk price edit state
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkMode, setBulkMode] = useState<'set' | 'pct'>('set')
  const [bulkValue, setBulkValue] = useState('')
  const [bulkSubmitting, setBulkSubmitting] = useState(false)

  // Toast
  const [toast, setToast] = useState<Toast | null>(null)

  // ---------- Derived ----------

  const categories = useMemo(() => {
    const cats = new Set<string>()
    products.forEach((p) => {
      if (p.category) cats.add(p.category)
    })
    return Array.from(cats).sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    let list = products
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.category === categoryFilter)
    }
    return list
  }, [products, search, categoryFilter])

  const usedCount = products.length
  const maxCount = planInfo?.maxProducts ?? 0
  const usagePercent = maxCount > 0 ? Math.round((usedCount / maxCount) * 100) : 0
  const isAmber = usagePercent >= 80
  const atLimit = planInfo != null && usedCount >= maxCount

  // ---------- Actions ----------

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  // AI copywriting — genera nombre + descripcion + tags + SEO a partir de una idea
  const handleAiGenerate = useCallback(async () => {
    if (!aiIdea.trim() || aiGenerating) return
    setAiGenerating(true)
    try {
      const res = await authFetch('/api/partners/catalog/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: aiIdea.trim(),
          category: formCategory || undefined,
          color: formColors[0]?.name || undefined,
          tone: aiTone,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Error generando copy con IA', 'error')
        return
      }
      // Solo rellena si los campos estan vacios — no pisa lo que el partner ya escribio
      if (data.name && !formName.trim()) setFormName(data.name)
      if (data.shortDescription && !formCardDesc.trim()) setFormCardDesc(data.shortDescription)
      if (data.description) {
        if (!formDescription.trim()) setFormDescription(data.description.slice(0, 600))
        if (!formDetailedDesc.trim()) setFormDetailedDesc(data.description)
      }
      setAiShowPanel(false)
      setAiIdea('')
      showToast('Copy generado — revisalo y editalo a gusto', 'success')
    } catch (err: any) {
      showToast(err.message || 'Error', 'error')
    } finally {
      setAiGenerating(false)
    }
  }, [aiIdea, aiTone, aiGenerating, formCategory, formColors, formName, formCardDesc, formDescription, formDetailedDesc, showToast])

  const fetchProducts = useCallback(async () => {
    try {
      const res = await authFetch('/api/partners/catalog')
      if (!res.ok) throw new Error('Error cargando productos')
      const data = await res.json()
      setProducts(data.products)
      setPlanInfo({ plan: data.plan, maxProducts: data.maxProducts })
    } catch {
      showToast('Error al cargar productos', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormCategory('')
    setFormPrice('')
    setFormStatus('draft')
    setFormImages([null])
    setFormColors([])
    setFormSizes(['S', 'M', 'L', 'XL'])
    setFormFeatures([])
    setFormDetailedDesc('')
    setFormCardDesc('')
    setFormBrandValues('')
    setEditingProduct(null)
    setConfirmDelete(false)
  }

  const openCreateForm = () => {
    resetForm()
    setFormMode('create')
  }

  const openEditForm = (product: Product) => {
    setFormName(product.name)
    setFormDescription(product.description || '')
    setFormCategory(product.category || '')
    setFormPrice(product.price != null ? String(product.price) : '')
    setFormStatus(product.status)
    // Fill slots: existing images + empty slots up to MAX_IMAGES
    const imgs: (string | null)[] = (product.images || []).map((u) => u as string | null)
    while (imgs.length < Math.min(MAX_IMAGES, Math.max(1, imgs.length + 1))) {
      imgs.push(null)
    }
    setFormImages(imgs)

    // Load rich metadata
    const m = product.metadata || {}
    const colors = (m.colors || []) as any[]
    setFormColors(colors.map((c: any) => ({
      name: c.name || '',
      hex: c.hex || '#000000',
      frontImage: c.images?.front || '',
      backImage: c.images?.back || '',
    })))
    setFormSizes((m.sizes as string[]) || ['S', 'M', 'L', 'XL'])
    setFormFeatures((m.features as string[]) || [])
    setFormDetailedDesc((m.detailedDescription as string) || '')
    setFormCardDesc((m.cardDescription as string) || '')
    setFormBrandValues((m.brandValues as string) || '')

    setEditingProduct(product)
    setConfirmDelete(false)
    setFormMode('edit')
  }

  const closeForm = () => {
    setFormMode('closed')
    resetForm()
  }

  const handleImageChange = (index: number, url: string | null) => {
    setFormImages((prev) => {
      const next = [...prev]
      next[index] = url
      // If user just uploaded to the last slot and we haven't hit max, add a new empty slot
      if (url && index === prev.length - 1 && prev.length < MAX_IMAGES) {
        next.push(null)
      }
      return next
    })
  }

  const removeImageSlot = (index: number) => {
    setFormImages((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) return [null]
      return next
    })
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      showToast('El nombre es obligatorio', 'error')
      return
    }

    setSaving(true)
    try {
      const images = formImages.filter((u): u is string => u !== null)

      // Build rich metadata
      const metadata: Record<string, unknown> = {}
      if (formColors.length > 0) {
        metadata.colors = formColors.map((c) => ({
          name: c.name,
          value: c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'default',
          hex: c.hex,
          images: { front: c.frontImage, back: c.backImage },
        }))
      }
      if (formSizes.length > 0) metadata.sizes = formSizes
      if (formFeatures.length > 0) metadata.features = formFeatures.filter(Boolean)
      if (formDetailedDesc.trim()) metadata.detailedDescription = formDetailedDesc.trim()
      if (formCardDesc.trim()) metadata.cardDescription = formCardDesc.trim()
      if (formBrandValues.trim()) metadata.brandValues = formBrandValues.trim()

      const body: Record<string, unknown> = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        category: formCategory.trim() || null,
        price: formPrice ? Number(formPrice) : null,
        status: formStatus,
        images,
        metadata,
      }

      if (formMode === 'create') {
        const res = await authFetch('/api/partners/catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al crear producto')
        }
        showToast('Producto creado', 'success')
      } else if (formMode === 'edit' && editingProduct) {
        const res = await authFetch(`/api/partners/catalog/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al actualizar producto')
        }
        showToast('Producto actualizado', 'success')
      }

      closeForm()
      await fetchProducts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      showToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingProduct) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    try {
      const res = await authFetch(`/api/partners/catalog/${editingProduct.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar producto')
      }
      showToast('Producto eliminado', 'success')
      closeForm()
      await fetchProducts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      showToast(message, 'error')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleBulkPriceUpdate = async () => {
    if (!bulkCategory.trim()) {
      showToast('Ingresa una categoria', 'error')
      return
    }
    const value = parseFloat(bulkValue)
    if (isNaN(value)) {
      showToast('Ingresa un valor numerico', 'error')
      return
    }
    if (bulkMode === 'set' && value < 0) {
      showToast('El precio no puede ser negativo', 'error')
      return
    }
    setBulkSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        filter: { category: bulkCategory.trim() },
      }
      if (bulkMode === 'set') body.setPrice = value
      else body.adjustPct = value

      const res = await authFetch('/api/partners/catalog/bulk-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar precios')
      }
      showToast(`${data.updated} producto(s) actualizado(s)`, 'success')
      setBulkOpen(false)
      setBulkCategory('')
      setBulkValue('')
      await fetchProducts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      showToast(message, 'error')
    } finally {
      setBulkSubmitting(false)
    }
  }

  // ---------- Render ----------

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-700/50'
              : 'bg-red-950/90 text-red-200 border border-red-700/50'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* ============================================================== */}
      {/* Header                                                         */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {/* Top row: title + add button */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Catalogo</h2>
            {!loading && (
              <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/20 text-xs font-semibold px-2.5 py-0.5">
                {products.length}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {products.length > 0 && (
              <Button
                onClick={() => setBulkOpen(true)}
                variant="outline"
                className="border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800 hover:text-white"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Cambio masivo de precios
              </Button>
            )}

          <div className="relative group">
            <Button
              onClick={openCreateForm}
              disabled={atLimit}
              className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar producto
            </Button>
            {atLimit && (
              <div className="absolute right-0 top-full mt-2 w-56 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Alcanzaste el limite de tu plan. Actualiza para agregar mas productos.
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Plan usage bar */}
        {planInfo && (
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${isAmber ? 'text-amber-400' : 'text-zinc-400'}`}>
              {usedCount} / {maxCount} productos
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden max-w-xs">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  atLimit ? 'bg-red-500' : isAmber ? 'bg-amber-500' : 'bg-violet-500'
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            <span className="text-xs text-zinc-600 capitalize">{planInfo.plan}</span>
          </div>
        )}

        {/* Search + Category filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="pl-9 bg-zinc-900/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50 h-10"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none w-full h-10 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 pr-9 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
            >
              <option value="all">Todas las categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* Loading skeleton                                                */}
      {/* ============================================================== */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-zinc-900/60 border-zinc-800/50 overflow-hidden animate-pulse">
              <div className="h-[200px] bg-zinc-800/60" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-zinc-800/60 rounded-md w-3/4" />
                <div className="h-3 bg-zinc-800/40 rounded-md w-1/2" />
                <div className="flex justify-between">
                  <div className="h-5 bg-zinc-800/40 rounded-full w-16" />
                  <div className="h-4 bg-zinc-800/40 rounded-md w-14" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* Empty state                                                     */}
      {/* ============================================================== */}
      {!loading && products.length === 0 && formMode === 'closed' && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/10 flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-violet-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-zinc-100 mb-2">
            Tu catalogo esta vacio
          </h3>
          <p className="text-sm text-zinc-500 mb-8 max-w-sm leading-relaxed">
            Agrega tu primer producto para empezar a armar tu catalogo y vender online.
          </p>
          <Button
            onClick={openCreateForm}
            className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 px-6 h-11"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar primer producto
          </Button>
        </div>
      )}

      {/* Empty search results */}
      {!loading && products.length > 0 && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-10 h-10 text-zinc-700 mb-4" />
          <p className="text-zinc-400 text-sm">No se encontraron productos</p>
          <button
            onClick={() => { setSearch(''); setCategoryFilter('all') }}
            className="text-violet-400 text-sm mt-2 hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* Base garment costs reference                                     */}
      {/* ============================================================== */}
      {!loading && products.length > 0 && (
        <details className="mb-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40">
          <summary className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors select-none">
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
            <span className="font-medium">Costo base de prendas Novamente</span>
            <span className="text-xs text-zinc-600 ml-auto">Click para ver</span>
          </summary>
          <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.values(ALL_GARMENT_PRICING).map(gp => (
              <div key={gp.key} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-800/40 text-xs">
                <span className="text-zinc-300 truncate">{gp.name}</span>
                <span className="text-emerald-400 font-semibold whitespace-nowrap">{formatGarmentPrice(gp.on_demand)}</span>
              </div>
            ))}
          </div>
          <p className="px-4 pb-3 text-[11px] text-zinc-600">
            Estos son tus costos actuales (On Demand). Vendé más y desbloqueá precios más bajos automáticamente.
          </p>
        </details>
      )}

      {/* ============================================================== */}
      {/* Product grid                                                    */}
      {/* ============================================================== */}
      {!loading && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              onClick={() => openEditForm(product)}
              className="bg-zinc-900/60 border-zinc-800/50 hover:border-zinc-700/80 cursor-pointer transition-all duration-200 overflow-hidden group hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 relative"
            >
              {/* Status dot */}
              <div className="absolute top-3 right-3 z-10">
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[product.status] || STATUS_DOT.draft} ring-2 ring-zinc-900/80`} />
              </div>

              {/* Image area */}
              <div className="h-[200px] relative overflow-hidden">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${getGradient(product.name)} flex items-center justify-center`}>
                    <span className="text-5xl font-bold text-white/30 select-none">
                      {product.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex flex-col items-center justify-center gap-2 px-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                    <Pencil className="w-4 h-4 text-white" />
                    <span className="text-sm font-medium text-white">Editar</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 delay-75">
                    <Link
                      href="/workspace/design-engine"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-600/80 hover:bg-violet-500 text-white text-xs font-medium backdrop-blur-sm transition-colors"
                    >
                      <Wand2 className="w-3 h-3" />
                      Disenar con IA
                    </Link>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-100 truncate">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[product.status] || STATUS_BADGE.draft}`}
                  >
                    {STATUS_LABELS[product.status] || product.status}
                  </span>
                  {product.category && (
                    <span className="text-xs text-zinc-500 truncate">
                      {product.category}
                    </span>
                  )}
                </div>
                {product.price != null && (
                  <p className="text-sm font-semibold text-zinc-200">
                    {formatPrice(product.price)}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* Add / Edit slide-in panel                                       */}
      {/* ============================================================== */}
      {formMode !== 'closed' && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeForm}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-950 border-l border-zinc-800/80 overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/80 sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10">
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {formMode === 'create' ? 'Nuevo producto' : 'Editar producto'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {formMode === 'create' ? 'Completa los datos de tu producto' : editingProduct?.name}
                </p>
              </div>
              <button
                onClick={closeForm}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel body */}
            <div className="p-6 space-y-6">
              {formMode === 'create' && (
                <a
                  href="/workspace/design-engine"
                  className="block rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-950/30 to-zinc-900/40 p-3 hover:border-violet-500/60 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                    <div className="text-xs leading-relaxed">
                      <p className="font-semibold text-zinc-100 mb-0.5">¿Querés diseñar sobre una prenda Novamente?</p>
                      <p className="text-zinc-400">Este formulario es para subir tu propio producto con tus imágenes. Para usar nuestras prendas base (remeras, buzos, hoodies) usá el <span className="text-violet-400 font-medium">Design Engine →</span></p>
                    </div>
                  </div>
                </a>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="product-name" className="text-zinc-300 text-sm font-medium">
                  Nombre <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="product-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Remera Clasica"
                  className="bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50 h-11"
                />
              </div>

              {/* AI Copywriting panel */}
              <div className="rounded-lg border border-violet-500/20 bg-gradient-to-br from-violet-950/20 to-zinc-900/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-violet-500/15 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <span className="text-xs font-medium text-zinc-300">Generar copy con IA</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAiShowPanel(v => !v)}
                    className="h-7 text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                  >
                    {aiShowPanel ? 'Cerrar' : 'Abrir'}
                  </Button>
                </div>
                {aiShowPanel && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={aiIdea}
                      onChange={e => setAiIdea(e.target.value)}
                      placeholder='Describi en 1-2 oraciones tu idea. Ej: "remera para fans de Boca, con escudo retro 90s, vibe vintage"'
                      rows={2}
                      maxLength={300}
                      className="bg-zinc-900/60 border-zinc-800 text-sm resize-none"
                    />
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <select
                        value={aiTone}
                        onChange={e => setAiTone(e.target.value as any)}
                        className="text-xs bg-zinc-900/60 border border-zinc-800 rounded-md px-2 py-1 text-zinc-300"
                      >
                        <option value="urban">Urbano / Streetwear</option>
                        <option value="minimal">Minimalista</option>
                        <option value="premium">Premium / Sofisticado</option>
                        <option value="fun">Divertido / Casual</option>
                        <option value="sport">Deportivo</option>
                        <option value="romantic">Romantico / Femenino</option>
                      </select>
                      <Button
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={!aiIdea.trim() || aiGenerating}
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-500 text-white"
                      >
                        {aiGenerating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            Generando
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3.5 h-3.5 mr-1" />
                            Generar
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      Genera nombre, descripcion y tags. Solo completa campos vacios — no pisa lo que ya escribiste.
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="product-description" className="text-zinc-300 text-sm font-medium">
                    Descripcion
                  </Label>
                  <span className={`text-xs tabular-nums ${formDescription.length > MAX_DESCRIPTION ? 'text-red-400' : formDescription.length > MAX_DESCRIPTION * 0.8 ? 'text-amber-400' : 'text-zinc-600'}`}>
                    {formDescription.length} / {MAX_DESCRIPTION}
                  </span>
                </div>
                <Textarea
                  id="product-description"
                  value={formDescription}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_DESCRIPTION) {
                      setFormDescription(e.target.value)
                    }
                  }}
                  placeholder="Describe tu producto..."
                  rows={3}
                  className="bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 resize-none focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="product-category" className="text-zinc-300 text-sm font-medium">
                  Categoria
                </Label>
                {categories.length > 0 ? (
                  <div className="relative">
                    <select
                      id="product-category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="appearance-none w-full h-11 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 pr-9 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                    >
                      <option value="">Sin categoria</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                ) : (
                  <Input
                    id="product-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ej: Remeras"
                    className="bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50 h-11"
                  />
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="product-price" className="text-zinc-300 text-sm font-medium">
                  Precio
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-medium">$</span>
                  <Input
                    id="product-price"
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1"
                    className="pl-7 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50 h-11"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="product-status" className="text-zinc-300 text-sm font-medium">
                  Estado
                </Label>
                <div className="relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${STATUS_DOT[formStatus] || STATUS_DOT.draft}`} />
                  <select
                    id="product-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="appearance-none w-full h-11 rounded-md border border-zinc-800 bg-zinc-900/60 pl-8 pr-9 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Images */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300 text-sm font-medium">
                    Imagenes
                  </Label>
                  <span className="text-xs text-zinc-600">
                    {formImages.filter((u) => u !== null).length} / {MAX_IMAGES}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  La primera imagen sera la portada del producto. Arrastra o hace click para subir.
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {formImages.map((url, i) => (
                    <div key={i} className="relative shrink-0 w-28">
                      {i === 0 && (
                        <span className="absolute -top-2 left-2 z-20 text-[10px] font-bold uppercase tracking-wider bg-violet-600 text-white px-1.5 py-0.5 rounded">
                          Principal
                        </span>
                      )}
                      <ImageUpload
                        value={url}
                        onChange={(newUrl) => handleImageChange(i, newUrl)}
                        type="product"
                        className="[&_div]:h-28 [&_img]:h-28"
                      />
                      {/* Remove slot button (only if not the only empty slot) */}
                      {url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeImageSlot(i)
                          }}
                          className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Rich Product Data (Colores, Talles, Features) ── */}
              <div className="border-t border-zinc-800/50 pt-6 space-y-6">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Datos avanzados del producto</p>

                {/* Colors */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-300 text-sm font-medium">Colores</Label>
                    <button
                      type="button"
                      onClick={() => setFormColors((prev) => [...prev, { name: '', hex: '#000000', frontImage: '', backImage: '' }])}
                      className="text-xs text-violet-400 hover:text-violet-300"
                    >
                      + Agregar color
                    </button>
                  </div>
                  {formColors.length === 0 && (
                    <p className="text-xs text-zinc-600">Sin colores definidos. Se usara la imagen principal como default.</p>
                  )}
                  {formColors.map((color, ci) => (
                    <div key={ci} className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/50 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color.hex}
                          onChange={(e) => {
                            const next = [...formColors]
                            next[ci] = { ...next[ci], hex: e.target.value }
                            setFormColors(next)
                          }}
                          className="w-8 h-8 rounded border border-zinc-700 cursor-pointer bg-transparent"
                        />
                        <Input
                          value={color.name}
                          onChange={(e) => {
                            const next = [...formColors]
                            next[ci] = { ...next[ci], name: e.target.value }
                            setFormColors(next)
                          }}
                          placeholder="Nombre del color"
                          className="flex-1 h-8 text-xs bg-zinc-900/60 border-zinc-800"
                        />
                        <button
                          type="button"
                          onClick={() => setFormColors((prev) => prev.filter((_, i) => i !== ci))}
                          className="text-zinc-500 hover:text-red-400 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-500 mb-1 block">Imagen frente</label>
                          <ImageUpload
                            value={color.frontImage || null}
                            onChange={(url) => {
                              const next = [...formColors]
                              next[ci] = { ...next[ci], frontImage: url || '' }
                              setFormColors(next)
                            }}
                            type="product"
                            className="[&_div]:h-20 [&_img]:h-20"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 mb-1 block">Imagen dorso</label>
                          <ImageUpload
                            value={color.backImage || null}
                            onChange={(url) => {
                              const next = [...formColors]
                              next[ci] = { ...next[ci], backImage: url || '' }
                              setFormColors(next)
                            }}
                            type="product"
                            className="[&_div]:h-20 [&_img]:h-20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sizes */}
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm font-medium">Talles</Label>
                  <div className="flex flex-wrap gap-2">
                    {['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL'].map((size) => {
                      // XXL legacy se trata como 2XL para que productos viejos sigan marcados
                      const active = formSizes.includes(size) || (size === '2XL' && formSizes.includes('XXL'))
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setFormSizes((prev) => {
                              if (size === '2XL') {
                                // Toggle ambos para mantener compat con productos legacy guardados con XXL
                                const withoutBoth = prev.filter((s) => s !== '2XL' && s !== 'XXL')
                                return active ? withoutBoth : [...withoutBoth, '2XL']
                              }
                              return active ? prev.filter((s) => s !== size) : [...prev, size]
                            })
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            active
                              ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                          }`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-300 text-sm font-medium">Caracteristicas</Label>
                    <button
                      type="button"
                      onClick={() => setFormFeatures((prev) => [...prev, ''])}
                      className="text-xs text-violet-400 hover:text-violet-300"
                      disabled={formFeatures.length >= 6}
                    >
                      + Agregar
                    </button>
                  </div>
                  {formFeatures.map((feat, fi) => (
                    <div key={fi} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                      <Input
                        value={feat}
                        onChange={(e) => {
                          const next = [...formFeatures]
                          next[fi] = e.target.value
                          setFormFeatures(next)
                        }}
                        placeholder="Ej: Estampa de alta definicion"
                        className="flex-1 h-8 text-xs bg-zinc-900/60 border-zinc-800"
                      />
                      <button
                        type="button"
                        onClick={() => setFormFeatures((prev) => prev.filter((_, i) => i !== fi))}
                        className="text-zinc-500 hover:text-red-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Card description */}
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm font-medium">Descripcion corta (card)</Label>
                  <Input
                    value={formCardDesc}
                    onChange={(e) => setFormCardDesc(e.target.value.slice(0, 100))}
                    placeholder="Se muestra en la grilla de productos (max 100 chars)"
                    maxLength={100}
                    className="bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 h-9 text-xs"
                  />
                  <span className="text-[10px] text-zinc-600">{formCardDesc.length}/100</span>
                </div>

                {/* Detailed description */}
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm font-medium">Descripcion detallada</Label>
                  <Textarea
                    value={formDetailedDesc}
                    onChange={(e) => setFormDetailedDesc(e.target.value)}
                    placeholder="Descripcion extendida para la pagina del producto..."
                    rows={3}
                    className="bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 resize-none text-xs"
                  />
                </div>

                {/* Brand values / slogan */}
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm font-medium">Slogan de marca</Label>
                  <Input
                    value={formBrandValues}
                    onChange={(e) => setFormBrandValues(e.target.value.slice(0, 60))}
                    placeholder="Ej: Diseño con identidad"
                    maxLength={60}
                    className="bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Panel footer */}
            <div className="sticky bottom-0 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-sm px-6 py-4">
              {formMode === 'edit' && (
                <div className="mb-4 pb-4 border-b border-zinc-800/50">
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`w-full justify-center ${
                      confirmDelete
                        ? 'border-red-600 bg-red-950/50 text-red-400 hover:bg-red-950'
                        : 'border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-red-400 hover:border-red-800/50'
                    }`}
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {confirmDelete ? 'Confirmar eliminacion' : 'Eliminar producto'}
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={closeForm}
                  className="flex-1 border-zinc-800 text-zinc-300 hover:bg-zinc-900 h-11"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !formName.trim()}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 h-11 disabled:opacity-40"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {formMode === 'create' ? 'Crear producto' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* Bulk price edit modal                                            */}
      {/* ============================================================== */}
      {bulkOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !bulkSubmitting && setBulkOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Cambio masivo de precios</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Actualiza el precio de todos los productos de una categoria a la vez.
                </p>
              </div>
              <button
                onClick={() => !bulkSubmitting && setBulkOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm font-medium">
                  Categoria <span className="text-red-400">*</span>
                </Label>
                {categories.length > 0 ? (
                  <div className="relative">
                    <select
                      value={bulkCategory}
                      onChange={(e) => setBulkCategory(e.target.value)}
                      className="appearance-none w-full h-11 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 pr-9 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                    >
                      <option value="">Selecciona una categoria</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__custom__">Otra (escribir manualmente)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                ) : null}
                {(categories.length === 0 || bulkCategory === '__custom__') && (
                  <Input
                    value={bulkCategory === '__custom__' ? '' : bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    placeholder="Ej: Buzo, Remera, Hoodie..."
                    className="bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 h-11 mt-2"
                  />
                )}
                <p className="text-[11px] text-zinc-500">
                  Coincide parcialmente (case-insensitive). "Buzo" matchea "Buzo Hoodie", "Buzo Oversize", etc.
                </p>
              </div>

              {/* Mode toggle */}
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm font-medium">Tipo de cambio</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkMode('set')}
                    className={`px-3 py-2.5 rounded-md text-sm font-medium border transition-colors ${
                      bulkMode === 'set'
                        ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    Precio fijo
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkMode('pct')}
                    className={`px-3 py-2.5 rounded-md text-sm font-medium border transition-colors ${
                      bulkMode === 'pct'
                        ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    Ajuste por %
                  </button>
                </div>
              </div>

              {/* Value */}
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm font-medium">
                  {bulkMode === 'set' ? 'Precio nuevo (ARS)' : 'Porcentaje de ajuste'}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-medium">
                    {bulkMode === 'set' ? '$' : '%'}
                  </span>
                  <Input
                    type="number"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    placeholder={bulkMode === 'set' ? '28500' : 'Ej: 10 = +10%, -5 = -5%'}
                    step={bulkMode === 'set' ? '1' : '0.1'}
                    className="pl-7 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 h-11"
                  />
                </div>
                {bulkMode === 'pct' && (
                  <p className="text-[11px] text-zinc-500">
                    Valor positivo aumenta, negativo descuenta. Ej: 10 = +10%, -5 = -5%.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-800/80 px-6 py-4 flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setBulkOpen(false)}
                disabled={bulkSubmitting}
                className="flex-1 border-zinc-800 text-zinc-300 hover:bg-zinc-900 h-11"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBulkPriceUpdate}
                disabled={bulkSubmitting || !bulkCategory.trim() || !bulkValue.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 h-11 disabled:opacity-40"
              >
                {bulkSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Aplicar a todos
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
