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
import {
  generateProductSchema,
  generateBreadcrumbSchema,
} from '@/lib/partners/seo'
import { StorefrontTracker } from '@/components/partners/storefront-tracker'

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
  const NOVAMENTE_FALLBACK_WA = "5491126603080"
  const productText = encodeURIComponent(`Hola! Me interesa "${product.name}" de la tienda ${tenant.name} en Novamente. Quiero info para comprar.`)
  const ctaHref =
    tenant.commerce_mode === 'whatsapp' && tenant.phone
      ? `https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${productText}`
      : tenant.cta_url
      || (tenant.phone ? `https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${productText}` : null)
      || `https://wa.me/${NOVAMENTE_FALLBACK_WA}?text=${productText}`

  const ctaUsesFallback = ctaHref?.includes(NOVAMENTE_FALLBACK_WA) ?? false

  const features = getPlanFeatures(tenant.plan)

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
          <ImageGallery product={product} />

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
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-white">
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
                      <Badge className="bg-red-600 text-white">
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
            )}

            {/* Availability */}
            <div>
              <Badge
                variant="outline"
                className={
                  product.availability === 'out_of_stock'
                    ? 'border-red-800 text-red-400'
                    : 'border-green-800 text-green-400'
                }
              >
                {product.availability === 'out_of_stock'
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

            {/* CTA — siempre presente (fallback a WhatsApp de Novamente si el partner no cargo contacto propio) */}
            <Button
              asChild
              size="lg"
              className="mt-2 w-full text-white sm:w-auto"
              style={{ backgroundColor: tenant.primary_color }}
            >
              <a href={ctaHref!} target="_blank" rel="noopener noreferrer">
                Comprar por WhatsApp
              </a>
            </Button>
            {ctaUsesFallback && (
              <p className="mt-1 text-xs text-zinc-500">
                Te atendemos desde Novamente y coordinamos con {tenant.name}.
              </p>
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
    </main>
  )
}

// ---------------------------------------------------------------------------
// Image Gallery
// ---------------------------------------------------------------------------

function ImageGallery({ product }: { product: PartnerProduct }) {
  const images = product.images || []
  const mainImage = images[0]

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-6xl text-zinc-700">
              {product.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.slice(0, 4).map((img, i) => (
            <div
              key={i}
              className={`relative aspect-square overflow-hidden rounded-lg border bg-zinc-900 ${
                i === 0 ? 'border-[var(--partner-primary)]' : 'border-zinc-800'
              }`}
            >
              <Image
                src={img}
                alt={`${product.name} ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 25vw, 12vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
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
