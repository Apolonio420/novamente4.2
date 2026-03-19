'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Lock,
  Rss,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Image as ImageIcon,
  ShoppingBag,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { authFetch } from '@/lib/partners/auth-fetch'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TenantInfo {
  id: string
  name: string
  slug: string
  plan: string
}

interface ValidationResult {
  valid: boolean
  products: number
  feedReady: number
  issues: { field: string; message: string; productId?: string; productName?: string }[]
}

interface ProductPreview {
  id: string
  name: string
  slug: string
  description: string | null
  price: number | null
  images: string[]
  category: string | null
  status: string
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FeedsPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [validating, setValidating] = useState(false)
  const [products, setProducts] = useState<ProductPreview[]>([])
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [googleOpen, setGoogleOpen] = useState(false)
  const [metaOpen, setMetaOpen] = useState(false)

  // Load tenant info + products
  useEffect(() => {
    async function load() {
      try {
        const res = await authFetch('/api/partners/dashboard')
        if (!res.ok) return
        const data = await res.json()
        if (data.tenant) {
          setTenant({
            id: data.tenant.id,
            name: data.tenant.name,
            slug: data.tenant.slug,
            plan: data.tenant.plan,
          })
        }

        // Load products for preview
        const catRes = await authFetch('/api/partners/catalog')
        if (catRes.ok) {
          const catData = await catRes.json()
          setProducts(
            (catData.products || []).filter(
              (p: ProductPreview) => p.status === 'published',
            ),
          )
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleValidate = useCallback(async () => {
    if (!tenant) return
    setValidating(true)
    try {
      const res = await authFetch(`/api/partners/feed/validate/${tenant.id}`)
      if (res.ok) {
        const data = await res.json()
        setValidation(data)
      }
    } catch {
      // ignore
    } finally {
      setValidating(false)
    }
  }, [tenant])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Non-Pro locked state
  if (!tenant || tenant.plan !== 'pro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Feed Export</h2>
        <p className="text-zinc-400 max-w-md mb-6">
          Exporta tu catalogo a Google Shopping y Meta Commerce Manager.
          Disponible en plan Pro.
        </p>
        <Button className="bg-purple-600 hover:bg-purple-500">
          Actualizar a Pro
        </Button>
      </div>
    )
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const googleFeedUrl = `${baseUrl}/api/partners/feed/google/${tenant.id}`
  const metaFeedUrl = `${baseUrl}/api/partners/feed/meta/${tenant.id}`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Feed Export</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Conecta tu catalogo con Google Shopping y Meta Commerce Manager
        </p>
      </div>

      {/* Feed URL Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Google Shopping */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Rss className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Google Shopping</CardTitle>
                <p className="text-xs text-zinc-500 mt-0.5">XML / RSS 2.0</p>
              </div>
            </div>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
              Activo
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={googleFeedUrl}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono truncate"
              />
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700 shrink-0"
                onClick={() => copyToClipboard(googleFeedUrl, 'google')}
              >
                {copiedField === 'google' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <a
              href={googleFeedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 mt-2"
            >
              Ver feed <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>

        {/* Meta Commerce */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Meta Commerce</CardTitle>
                <p className="text-xs text-zinc-500 mt-0.5">TSV</p>
              </div>
            </div>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
              Activo
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={metaFeedUrl}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono truncate"
              />
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700 shrink-0"
                onClick={() => copyToClipboard(metaFeedUrl, 'meta')}
              >
                {copiedField === 'meta' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <a
              href={metaFeedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 mt-2"
            >
              Ver feed <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Validate Button + Results */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-300">
            Validacion del feed
          </CardTitle>
          <Button
            size="sm"
            onClick={handleValidate}
            disabled={validating}
            className="bg-purple-600 hover:bg-purple-500"
          >
            {validating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
            )}
            Validar feed
          </Button>
        </CardHeader>
        <CardContent>
          {validation ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-sm">Productos publicados:</span>
                  <span className="text-zinc-200 font-medium">{validation.products}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-sm">Listos para feed:</span>
                  <span className="text-zinc-200 font-medium">{validation.feedReady}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-sm">Problemas:</span>
                  <span
                    className={`font-medium ${
                      validation.issues.length === 0 ? 'text-green-400' : 'text-amber-400'
                    }`}
                  >
                    {validation.issues.length}
                  </span>
                </div>
              </div>

              {/* Issues */}
              {validation.issues.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validation.issues.map((issue, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm bg-zinc-950 rounded-lg px-3 py-2 border border-zinc-800"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-zinc-300">{issue.productName || issue.productId}</span>
                        <span className="text-zinc-500 mx-1.5">—</span>
                        <span className="text-zinc-400">{issue.message}</span>
                        <Badge
                          variant="outline"
                          className="ml-2 text-[10px] border-zinc-700 text-zinc-500"
                        >
                          {issue.field}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Todos los productos estan listos para el feed
                </div>
              )}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">
              Valida tu catalogo antes de conectar los feeds para asegurar compatibilidad con Google y Meta.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Setup Guides */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Guias de configuracion</h2>

        {/* Google Merchant Center */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <button
            onClick={() => setGoogleOpen(!googleOpen)}
            className="w-full flex items-center justify-between px-6 py-4"
          >
            <div className="flex items-center gap-3">
              <Rss className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-sm">Google Merchant Center</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform ${
                googleOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {googleOpen && (
            <CardContent className="pt-0 pb-5">
              <ol className="space-y-3 text-sm text-zinc-400">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <span>
                    Ingresa a{' '}
                    <a
                      href="https://merchants.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      Google Merchant Center
                    </a>{' '}
                    y crea una cuenta si no tenes una.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </span>
                  <span>
                    Anda a <strong className="text-zinc-300">Productos &gt; Feeds</strong> y hace clic en
                    &quot;Agregar feed de productos&quot;.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </span>
                  <span>
                    Selecciona &quot;Scheduled fetch&quot; (obtener datos programados) y pega la URL
                    del feed XML de arriba.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                    4
                  </span>
                  <span>
                    Configura la frecuencia de actualizacion (recomendamos diaria) y guarda. Google
                    procesara tu feed en minutos.
                  </span>
                </li>
              </ol>
            </CardContent>
          )}
        </Card>

        {/* Meta Commerce Manager */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <button
            onClick={() => setMetaOpen(!metaOpen)}
            className="w-full flex items-center justify-between px-6 py-4"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-pink-400" />
              <span className="font-medium text-sm">Meta Commerce Manager</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform ${
                metaOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {metaOpen && (
            <CardContent className="pt-0 pb-5">
              <ol className="space-y-3 text-sm text-zinc-400">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <span>
                    Ingresa a{' '}
                    <a
                      href="https://business.facebook.com/commerce"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      Meta Commerce Manager
                    </a>{' '}
                    y selecciona tu catalogo.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </span>
                  <span>
                    Anda a <strong className="text-zinc-300">Origenes de datos</strong> y hace clic en
                    &quot;Agregar productos&quot; &gt; &quot;Feed de datos&quot;.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </span>
                  <span>
                    Selecciona &quot;Scheduled feed&quot; (URL programada) y pega la URL del feed
                    TSV de arriba. Formato: TSV.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center text-xs font-bold shrink-0">
                    4
                  </span>
                  <span>
                    Configura la frecuencia (recomendamos cada hora) y guarda. Los productos
                    apareceran en tu tienda de Instagram y Facebook.
                  </span>
                </li>
              </ol>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Product Preview Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-300">
            Vista previa del catalogo ({products.length} productos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 text-zinc-500 font-medium w-12"></th>
                    <th className="text-left py-2 text-zinc-500 font-medium">Producto</th>
                    <th className="text-right py-2 text-zinc-500 font-medium">Precio</th>
                    <th className="text-center py-2 text-zinc-500 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const hasPrice = p.price && p.price > 0
                    const hasImage = p.images && p.images.length > 0
                    const feedReady = hasPrice && hasImage

                    return (
                      <tr key={p.id} className="border-b border-zinc-800/50">
                        <td className="py-2">
                          {hasImage ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover bg-zinc-800"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-zinc-600" />
                            </div>
                          )}
                        </td>
                        <td className="py-2">
                          <div className="text-zinc-200">{p.name}</div>
                          {p.category && (
                            <div className="text-xs text-zinc-500">{p.category}</div>
                          )}
                        </td>
                        <td className="py-2 text-right text-zinc-300">
                          {hasPrice ? `$${p.price!.toLocaleString('es-AR')}` : '—'}
                        </td>
                        <td className="py-2 text-center">
                          {feedReady ? (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                              Listo
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                              Incompleto
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[120px] flex flex-col items-center justify-center text-zinc-500 text-sm">
              <ShoppingBag className="w-6 h-6 mb-2 text-zinc-600" />
              No hay productos publicados aun
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
