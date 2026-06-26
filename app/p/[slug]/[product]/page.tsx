import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTenantBySlug } from '@/lib/partners/tenant'
import { getProductBySlug, getPublishedProducts } from '@/lib/partners/catalog'
import { getPlanFeatures } from '@/lib/partners/plans'
import type { Tenant, PartnerProduct } from '@/lib/partners/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/partners/json-ld'
import ImageGalleryClient from './ImageGalleryClient'
import {
  generateProductSchema,
  generateBreadcrumbSchema,
} from '@/lib/partners/seo'
import { StorefrontTracker } from '@/components/partners/storefront-tracker'
import { StoreWhatsAppButton } from '@/components/StoreWhatsAppButton'
import { AddToCartButtons } from './AddToCartButtons'
import { Flame } from 'lucide-react'
import { getActiveOfferForProduct, getDiscountPercent } from '@/lib/offers'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const BASE_URL = 'https://www.novamente.ar'
type PageProps = { params: Promise<{ slug: string; product: string }> }

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, product: productSlug } = await params
  const tenant = await getTenantBySlug(slug)

  if (!tenant || tenant.status !== 'active' || !tenant.storefront_published) {
    return { title: 'Not Found' }
  }

  const product = await getProductBySlug(tenant.id, productSlug)
  if (!product || product.status !== 'published') {
    return { title: 'Not Found' }
  }

  const features = getPlanFeatures(tenant.plan)
  const title = product.seo_title || product.name
  const description =
    product.seo_description ||
    product.description ||
    `${product.name} — ${tenant.name}`
  const canonicalUrl = `${BASE_URL}/p/${slug}/${productSlug}`
  const dynamicOgImage = `${BASE_URL}/api/og?${new URLSearchParams({
    title: `${title} · ${tenant.name}`,
    desc: description,
    type: 'product',
    color: tenant.primary_color,
  }).toString()}`
  const ogImage = product.images?.[0] || dynamicOgImage
  const ogImages = product.images?.length
    ? product.images.map((url) => ({ url, width: 1200, height: 630 }))
    : [{ url: dynamicOgImage, width: 1200, height: 630 }]

  return {
    title: `${title} · ${tenant.name}`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} · ${tenant.name}`,
      description,
      url: canonicalUrl,
      siteName: 'Novamente',
      locale: 'es_AR',
      type: 'website',
      images: ogImages,
    },
    ...(features.seoIndexable && {
      twitter: {
        card: 'summary_large_image',
        title: `${title} · ${tenant.name}`,
        description,
        images: [ogImage],
      },
    }),
    ...(!features.seoIndexable && {
      robots: { index: false, follow: false },
    }),
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug, product: productSlug } = await params
  const tenant = await getTenantBySlug(slug)

  if (!tenant || tenant.status !== 'active' || !tenant.storefront_published) {
    notFound()
  }

  const product = await getProductBySlug(tenant.id, productSlug)
  if (!product || product.status !== 'published') {
    notFound()
  }

  // Hot Sale: si el producto coincide con una oferta activa de lib/offers.ts,
  // aplicamos tratamiento visual (badge sobre imagen + cinta naranja en precio).
  // Cuando la campania expira, getActiveOfferForProduct devuelve null y el look
  // vuelve solo al normal — sin tocar codigo.
  const hotSaleOffer = getActiveOfferForProduct(tenant.slug, product.slug)
  const hotSaleEndsAt = hotSaleOffer
    ? new Date(hotSaleOffer.endsAt).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
      })
    : null

  // Related products: same category, excluding current, max 4
  const allProducts = await getPublishedProducts(tenant.id)
  const relatedProducts = allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        p.category &&
        product.category &&
        p.category === product.category
    )
    .slice(0, 4)

  // Build CTA URL — siempre debe haber un CTA para comprar. Si el partner no tiene
  // phone ni cta_url propios, se cae a WhatsApp de Novamente con texto preformateado
  // que identifica al partner + producto. Antes el boton desaparecia para partners
  // sin contacto cargado y los clientes no podian comprar.
  const NOVAMENTE_FALLBACK_WA = "5492235169720"
  // Lienzos u otras piezas marcadas como "Próximamente": visibles pero no comprables.
  const comingSoon = (product.metadata as any)?.coming_soon === true
  const productText = encodeURIComponent(`Hola! Me interesa "${product.name}" de la tienda ${tenant.name} en Novamente. Quiero info para comprar.`)
  const ctaHref =
    tenant.commerce_mode === 'whatsapp' && tenant.phone
      ? `https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${productText}`
      : tenant.cta_url
      || (tenant.phone ? `https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${productText}` : null)
      || `https://wa.me/${NOVAMENTE_FALLBACK_WA}?text=${productText}`

  const ctaUsesFallback = ctaHref?.includes(NOVAMENTE_FALLBACK_WA) ?? false

  const features = getPlanFeatures(tenant.plan)

  // Colores disponibles para el selector de la tienda. El catálogo del partner
  // guarda los colores en metadata.colors ({ name, value, hex, images }); el
  // botón de compra espera { name, code }. Mapeamos acá (antes solo se leía
  // metadata.available_colors, que el catálogo nunca escribe → el selector
  // nunca aparecía y la prenda se veía "en un solo color").
  const rawColors = (product.metadata as any)?.colors
  const legacyColors = (product.metadata as any)?.available_colors
  const availableColors: { name: string; code: string }[] | undefined =
    Array.isArray(rawColors) && rawColors.length > 0
      ? rawColors
          .filter((c: any) => c && typeof c.name === 'string' && c.name.trim())
          .map((c: any) => ({ name: c.name, code: c.hex || c.code || '#000000' }))
      : Array.isArray(legacyColors) && legacyColors.length > 0
        ? legacyColors
        : undefined

  return (
    <main
      className="min-h-screen bg-zinc-950 text-zinc-100"
      style={
        {
          '--partner-primary': tenant.primary_color,
          '--partner-secondary': tenant.secondary_color,
        } as React.CSSProperties
      }
    >
      {/* Analytics tracking */}
      <StorefrontTracker tenantId={tenant.id} event="product_view" data={{ slug: tenant.slug, productSlug: product.slug }} />

      {/* JSON-LD: Product (basic for Starter, enhanced for Growth+) */}
      <JsonLd
        data={generateProductSchema(product, tenant, {
          enhanced: features.seoIndexable,
        })}
      />

      {/* JSON-LD: Breadcrumb (Growth+) */}
      {features.seoIndexable && (
        <JsonLd
          data={generateBreadcrumbSchema([
            { name: 'Inicio', url: BASE_URL },
            { name: tenant.name, url: `${BASE_URL}/p/${tenant.slug}` },
            { name: 'Productos', url: `${BASE_URL}/p/${tenant.slug}` },
            { name: product.name, url: `${BASE_URL}/p/${tenant.slug}/${product.slug}` },
          ])}
        />
      )}

      {/* Breadcrumb */}
      <nav className="mx-auto max-w-7xl px-6 py-4">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <li>
            <Link
              href={`/p/${tenant.slug}`}
              className="transition hover:text-zinc-300"
            >
              {tenant.name}
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href={`/p/${tenant.slug}#productos`}
              className="transition hover:text-zinc-300"
            >
              Productos
            </Link>
          </li>
          <li>/</li>
          <li className="text-zinc-300">{product.name}</li>
        </ol>
      </nav>

      {/* Product Detail */}
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-4">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Image Gallery */}
          <div className="relative">
            <ImageGallery product={product} />
            {hotSaleOffer && (
              <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-orange-500 to-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/30">
                  <Flame className="h-3.5 w-3.5" />
                  Hot Sale
                </span>
                <span className="inline-flex items-center rounded-md bg-black/60 px-2.5 py-1.5 text-xs font-bold text-orange-400 backdrop-blur-sm">
                  -{getDiscountPercent(hotSaleOffer)}%
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-6">
            <div>
              {product.category && (
                <span className="mb-2 inline-block text-xs uppercase tracking-wider text-zinc-500">
                  {product.category}
                </span>
              )}
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            {product.price != null && (
              <div
                className={
                  hotSaleOffer
                    ? 'rounded-xl border border-orange-500/40 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent p-4'
                    : ''
                }
              >
                {hotSaleOffer && (
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-400">
                    <Flame className="h-3.5 w-3.5" />
                    Precio Hot Sale
                  </div>
                )}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span
                    className={
                      hotSaleOffer
                        ? 'text-3xl font-bold text-orange-400 md:text-4xl'
                        : 'text-3xl font-bold text-white'
                    }
                  >
                    {formatPrice(product.price, product.currency || tenant.currency)}
                  </span>
                  {product.compare_at_price != null &&
                    product.compare_at_price > product.price && (
                      <>
                        <span className="text-lg text-zinc-500 line-through">
                          {formatPrice(
                            product.compare_at_price,
                            product.currency || tenant.currency
                          )}
                        </span>
                        <Badge
                          className={
                            hotSaleOffer
                              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white border-0'
                              : 'bg-red-600 text-white'
                          }
                        >
                          -
                          {Math.round(
                            ((product.compare_at_price - product.price) /
                              product.compare_at_price) *
                              100
                          )}
                          %
                        </Badge>
                      </>
                    )}
                </div>
                {hotSaleOffer && hotSaleEndsAt && (
                  <p className="mt-2 text-xs text-zinc-400">
                    Promo por tiempo limitado — vigente hasta el {hotSaleEndsAt}.
                  </p>
                )}
              </div>
            )}

            {/* Availability */}
            <div>
              <Badge
                variant="outline"
                className={
                  comingSoon
                    ? 'border-amber-700 text-amber-400'
                    : product.availability === 'out_of_stock'
                      ? 'border-red-800 text-red-400'
                      : 'border-green-800 text-green-400'
                }
              >
                {comingSoon
                  ? 'Próximamente'
                  : product.availability === 'out_of_stock'
                    ? 'Sin stock'
                    : product.availability === 'preorder'
                      ? 'Pre-orden'
                      : 'Disponible'}
              </Badge>
            </div>

            {/* Description */}
            {product.description && (
              <p className="leading-relaxed text-zinc-400">
                {product.description}
              </p>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="border-zinc-700 bg-zinc-800 text-zinc-400"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* CTA — carrito + buy now (Novamente checkout). El WhatsApp queda como
                fallback de consulta para clientes que prefieren ese canal.
                Para piezas "Próximamente" mostramos un aviso en vez del botón de compra. */}
            {comingSoon ? (
              <div className="rounded-lg border border-amber-700/50 bg-amber-950/20 px-4 py-4 text-center">
                <p className="text-sm font-semibold text-amber-300">Próximamente</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Esta pieza estará disponible muy pronto. Seguinos para enterarte del lanzamiento.
                </p>
              </div>
            ) : (
              <AddToCartButtons
                productId={product.id}
                productName={product.name}
                brandName={tenant.name}
                tenantId={tenant.id}
                brandSlug={tenant.slug}
                category={product.category ?? null}
                price={product.price ?? 0}
                imageUrl={product.images?.[0] ?? null}
                sizes={Array.isArray((product.metadata as any)?.sizes) ? (product.metadata as any).sizes : undefined}
                availableColors={availableColors}
                defaultColor={(product.metadata as any)?.color ?? undefined}
                fallbackWhatsappUrl={ctaHref ?? undefined}
                whatsappLabel={ctaUsesFallback ? "Consultar a Novamente por WhatsApp" : `Consultar a ${tenant.name} por WhatsApp`}
                primaryColor={tenant.primary_color}
              />
            )}

            {/* Back to storefront */}
            <Link
              href={`/p/${tenant.slug}`}
              className="mt-2 inline-flex items-center text-sm text-zinc-500 transition hover:text-zinc-300"
            >
              &larr; Volver a {tenant.name}
            </Link>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <h2 className="mb-8 text-xl font-semibold text-white">
            Productos relacionados
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <RelatedProductCard
                key={p.id}
                product={p}
                tenantSlug={tenant.slug}
                currency={tenant.currency}
              />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-sm text-zinc-500">
          <span>
            &copy; {new Date().getFullYear()} {tenant.name}
          </span>
          <Link
            href={`/p/${tenant.slug}`}
            className="transition hover:text-zinc-300"
          >
            Ver storefront
          </Link>
        </div>
      </footer>

      {/* WhatsApp flotante → número del partner */}
      <StoreWhatsAppButton phone={tenant.phone} storeName={tenant.name} />
    </main>
  )
}

// ---------------------------------------------------------------------------
// Image Gallery
// ---------------------------------------------------------------------------

function ImageGallery({ product }: { product: PartnerProduct }) {
  return <ImageGalleryClient images={product.images || []} name={product.name} />
}

// ---------------------------------------------------------------------------
// Related Product Card
// ---------------------------------------------------------------------------

function RelatedProductCard({
  product,
  tenantSlug,
  currency,
}: {
  product: PartnerProduct
  tenantSlug: string
  currency: string
}) {
  const image = product.images?.[0]

  return (
    <Link
      href={`/p/${tenantSlug}/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:border-[var(--partner-primary)] hover:shadow-lg hover:shadow-[var(--partner-primary)]/5"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-800">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-3xl text-zinc-600">
              {product.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-medium text-zinc-100 line-clamp-2">
          {product.name}
        </h3>
        {product.price != null && (
          <span className="text-lg font-bold text-white">
            {formatPrice(product.price, currency)}
          </span>
        )}
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency || 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
