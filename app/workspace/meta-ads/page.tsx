'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Lock,
  ArrowLeft,
  Copy,
  Check,
  Download,
  Megaphone,
  Image as ImageIcon,
  Type,
  Link2,
  Target,
  DollarSign,
  BookOpen,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authFetch } from '@/lib/partners/auth-fetch'
import {
  AD_TEMPLATES,
  generateAdCopy,
  getBudgetRecommendation,
  getTargetingSuggestions,
  type AdTemplate,
} from '@/lib/partners/ad-templates'
import { generateMetaAdUtm } from '@/lib/partners/utm-generator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Product {
  id: string
  name: string
  slug: string
  price: number | null
  images: string[]
}

interface TenantInfo {
  name: string
  slug: string
  plan: string
  industry: string | null
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MetaAdsPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Builder state
  const [selectedTemplate, setSelectedTemplate] = useState<AdTemplate | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCopyIdx, setSelectedCopyIdx] = useState(0)
  const [copiedUtm, setCopiedUtm] = useState(false)

  // Load tenant + products
  useEffect(() => {
    async function load() {
      try {
        const [dashRes, catalogRes] = await Promise.all([
          authFetch('/api/partners/dashboard'),
          authFetch('/api/partners/catalog'),
        ])

        if (dashRes.ok) {
          const dash = await dashRes.json()
          setTenant({
            name: dash.tenant?.name || '',
            slug: dash.tenant?.slug || '',
            plan: dash.tenant?.plan || 'starter',
            industry: dash.tenant?.industry || null,
          })
        }

        if (catalogRes.ok) {
          const catalog = await catalogRes.json()
          setProducts(
            (catalog.products || catalog || []).slice(0, 50).map((p: Record<string, unknown>) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              images: p.images || [],
            })),
          )
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Non-Pro locked state
  if (!loading && tenant?.plan !== 'pro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Meta Ads Templates</h2>
        <p className="text-zinc-400 max-w-md mb-6">
          Disponible en plan Pro. Crea anuncios profesionales para Meta con templates
          predefinidos, copy auto-generado y links con UTM.
        </p>
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-sm px-4 py-1">
          Disponible en plan Pro
        </Badge>
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

  if (!tenant) return null

  // If a template is selected, show the builder
  if (selectedTemplate) {
    return (
      <TemplateBuilder
        template={selectedTemplate}
        tenant={tenant}
        products={products}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        selectedCopyIdx={selectedCopyIdx}
        setSelectedCopyIdx={setSelectedCopyIdx}
        copiedUtm={copiedUtm}
        setCopiedUtm={setCopiedUtm}
        onBack={() => {
          setSelectedTemplate(null)
          setSelectedProduct(null)
          setSelectedCopyIdx(0)
        }}
      />
    )
  }

  // Template gallery
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Meta Ads Templates</h1>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
            Pro
          </Badge>
        </div>
        <p className="text-zinc-400 text-sm">
          Selecciona un template para crear tu anuncio. Generamos el copy y link de trackeo automaticamente.
        </p>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AD_TEMPLATES.map((tpl) => (
          <button
            key={tpl.type}
            onClick={() => setSelectedTemplate(tpl)}
            className="text-left rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-purple-500/50 hover:bg-zinc-900 group"
          >
            {/* Template icon area */}
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
              <TemplateIcon type={tpl.type} />
            </div>

            <h3 className="font-semibold text-zinc-100 mb-1">{tpl.name}</h3>
            <p className="text-sm text-zinc-400 mb-3">{tpl.desc}</p>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] border-zinc-700 text-zinc-500"
              >
                {tpl.dimensions}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  tpl.format === 'story'
                    ? 'border-pink-500/30 text-pink-400'
                    : 'border-blue-500/30 text-blue-400'
                }`}
              >
                {tpl.format}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      {/* Budget & Targeting Section */}
      <BudgetSection industry={tenant.industry} />

      {/* Quick Guide */}
      <QuickGuide />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Template Builder
// ---------------------------------------------------------------------------

function TemplateBuilder({
  template,
  tenant,
  products,
  selectedProduct,
  setSelectedProduct,
  selectedCopyIdx,
  setSelectedCopyIdx,
  copiedUtm,
  setCopiedUtm,
  onBack,
}: {
  template: AdTemplate
  tenant: TenantInfo
  products: Product[]
  selectedProduct: Product | null
  setSelectedProduct: (p: Product | null) => void
  selectedCopyIdx: number
  setSelectedCopyIdx: (i: number) => void
  copiedUtm: boolean
  setCopiedUtm: (v: boolean) => void
  onBack: () => void
}) {
  const product = selectedProduct || (products[0] ?? null)
  const copyVariants = product
    ? generateAdCopy(tenant, { name: product.name, price: product.price ?? undefined })
    : []
  const selectedCopy = copyVariants[selectedCopyIdx] || null

  const utmUrl = product
    ? generateMetaAdUtm(tenant.slug, template.type, product.slug)
    : ''

  const handleCopyUtm = () => {
    navigator.clipboard.writeText(utmUrl)
    setCopiedUtm(true)
    setTimeout(() => setCopiedUtm(false), 2000)
  }

  const handleDownload = () => {
    if (!product?.images?.[0]) return
    const a = document.createElement('a')
    a.href = product.images[0]
    a.download = `${template.type}-${product.slug || 'ad'}.jpg`
    a.target = '_blank'
    a.click()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{template.name}</h1>
          <p className="text-sm text-zinc-400">
            {template.desc} &middot; {template.dimensions} &middot; {template.format}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Product selector + preview */}
        <div className="space-y-4">
          {/* Product selector */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Producto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No tenes productos en tu catalogo.{' '}
                  <a href="/workspace/catalog" className="text-purple-400 hover:underline">
                    Agrega productos
                  </a>
                </p>
              ) : (
                <select
                  value={product?.id || ''}
                  onChange={(e) => {
                    const p = products.find((pr) => pr.id === e.target.value)
                    setSelectedProduct(p || null)
                    setSelectedCopyIdx(0)
                  }}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.price ? ` - $${p.price.toLocaleString('es-AR')}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </CardContent>
          </Card>

          {/* Product image preview */}
          {product?.images?.[0] && (
            <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900">
              <div
                className={`relative ${
                  template.format === 'story' ? 'aspect-[9/16]' : 'aspect-square'
                } max-h-[500px]`}
              >
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {/* Overlay with template type label */}
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-black/60 text-white border-0 backdrop-blur-sm">
                    {template.name}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Download button */}
          {product?.images?.[0] && (
            <Button
              onClick={handleDownload}
              className="w-full bg-purple-600 hover:bg-purple-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar imagen
            </Button>
          )}
        </div>

        {/* Right: Copy + UTM */}
        <div className="space-y-4">
          {/* Ad copy variants */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Copy del anuncio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {copyVariants.length === 0 ? (
                <p className="text-sm text-zinc-500">Selecciona un producto para generar copy.</p>
              ) : (
                <>
                  {/* Variant tabs */}
                  <div className="flex gap-2">
                    {copyVariants.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedCopyIdx(i)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          selectedCopyIdx === i
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Variante {i + 1}
                      </button>
                    ))}
                  </div>

                  {selectedCopy && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                          Headline
                        </label>
                        <p className="text-sm text-zinc-100 mt-1 bg-zinc-800/50 rounded-lg px-3 py-2">
                          {selectedCopy.headline}
                        </p>
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                          Texto principal
                        </label>
                        <p className="text-sm text-zinc-100 mt-1 bg-zinc-800/50 rounded-lg px-3 py-2">
                          {selectedCopy.primaryText}
                        </p>
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                          Descripcion
                        </label>
                        <p className="text-sm text-zinc-100 mt-1 bg-zinc-800/50 rounded-lg px-3 py-2">
                          {selectedCopy.description}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* UTM Link */}
          {utmUrl && (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Link con UTM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs text-purple-400 bg-zinc-800/50 rounded-lg px-3 py-2 break-all">
                    {utmUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyUtm}
                    className="border-zinc-700 text-zinc-300 shrink-0"
                  >
                    {copiedUtm ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Usa este link como URL de destino en tu anuncio para trackear conversiones.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Budget Section
// ---------------------------------------------------------------------------

function BudgetSection({ industry }: { industry: string | null }) {
  const budget = getBudgetRecommendation(industry || undefined)
  const targeting = getTargetingSuggestions(industry || undefined)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Budget */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Presupuesto recomendado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-100">
              ${budget.dailyMin.toLocaleString('es-AR')}
            </span>
            <span className="text-zinc-500">a</span>
            <span className="text-3xl font-bold text-zinc-100">
              ${budget.dailyMax.toLocaleString('es-AR')}
            </span>
            <span className="text-sm text-zinc-500">/dia</span>
          </div>
          {industry && (
            <p className="text-xs text-zinc-500">
              Basado en tu industria: {industry}
            </p>
          )}
          <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3">
            <p className="text-sm text-purple-300">
              {budget.tip}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Targeting */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Segmentacion sugerida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {targeting.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quick Guide
// ---------------------------------------------------------------------------

function QuickGuide() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Como subir tu anuncio a Meta Ads Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3 text-sm text-zinc-300 list-decimal list-inside">
          <li>
            Anda a{' '}
            <a
              href="https://www.facebook.com/adsmanager/creation"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline inline-flex items-center gap-1"
            >
              Meta Ads Manager <ExternalLink className="w-3 h-3" />
            </a>
          </li>
          <li>Elegí el objetivo de campaña (Trafico o Conversiones recomendado)</li>
          <li>Configura tu presupuesto diario segun nuestra recomendacion</li>
          <li>En &quot;Audiencia&quot;, aplica la segmentacion sugerida arriba</li>
          <li>En &quot;Ubicaciones&quot;, selecciona Feed de Instagram y/o Facebook (segun el formato del template)</li>
          <li>Subi la imagen descargada como creatividad</li>
          <li>Pega el headline, texto principal y descripcion del copy generado</li>
          <li>En &quot;URL del sitio web&quot;, pega el link con UTM para trackear resultados</li>
          <li>Revisa y publica tu anuncio</li>
        </ol>
        <div className="mt-4 rounded-lg bg-zinc-800/50 border border-zinc-700 p-3">
          <p className="text-xs text-zinc-400">
            <strong className="text-zinc-300">Tip:</strong> Crea 2-3 variantes del mismo anuncio con diferente copy
            para que Meta optimice automaticamente hacia el que mejor funcione (A/B testing).
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Template Icon
// ---------------------------------------------------------------------------

function TemplateIcon({ type }: { type: string }) {
  const iconMap: Record<string, React.ElementType> = {
    showcase: ImageIcon,
    carousel: Megaphone,
    story: ImageIcon,
    collection: ImageIcon,
    before_after: ImageIcon,
    testimonial: Type,
  }
  const Icon = iconMap[type] || Megaphone
  return <Icon className="w-6 h-6 text-purple-400" />
}
