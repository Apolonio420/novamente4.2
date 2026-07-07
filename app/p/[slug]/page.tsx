import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTenantBySlug } from '@/lib/partners/tenant'
import { getPublishedProducts } from '@/lib/partners/catalog'
import { PLAN_FEATURES, getPlanFeatures } from '@/lib/partners/plans'
import type { Tenant, PartnerProduct } from '@/lib/partners/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/partners/json-ld'
import {
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  getDefaultPartnerFAQs,
} from '@/lib/partners/seo'
import { PartnerFaqSection } from '@/components/partners/faq-section'
import ContactForm from './contact-form'
import ChatWidget from '@/components/partners/chat-widget'
import { StorefrontTracker } from '@/components/partners/storefront-tracker'
import { BrandLandingPixel } from '@/components/partners/brand-landing-pixel'
import { StorefrontDesigner } from '@/components/partners/storefront-designer'
import { StoreWhatsAppButton } from '@/components/StoreWhatsAppButton'

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const BASE_URL = 'https://www.novamente.ar'
type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)

  if (!tenant || tenant.status !== 'active' || !tenant.storefront_published) {
    return { title: 'Not Found' }
  }

  const features = getPlanFeatures(tenant.plan)
  const title = tenant.seo_title || tenant.name
  const description =
    tenant.seo_description || tenant.description || `${tenant.name} — storefront`
  const canonicalUrl = `${BASE_URL}/p/${slug}`
  // Dynamic OG image — falls back to tenant banner/logo if OG route unavailable
  const dynamicOgImage = `${BASE_URL}/api/og?${new URLSearchParams({
    title,
    desc: description,
    type: 'partner',
    color: tenant.primary_color,
    ...(tenant.logo_url && { logo: tenant.logo_url }),
  }).toString()}`
  const ogImage = tenant.banner_url || dynamicOgImage

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Novamente',
      locale: 'es_AR',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    ...(features.seoIndexable && {
      twitter: {
        card: 'summary_large_image',
        title,
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

export default async function PartnerStorefrontPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams
  const tenant = await getTenantBySlug(slug)

  if (!tenant || tenant.status !== 'active' || !tenant.storefront_published) {
    notFound()
  }

  const products = await getPublishedProducts(tenant.id)
  const features = getPlanFeatures(tenant.plan)

  // SEM UTM tracking (Pro only)
  const utmRef = features.semReady
    ? [sp.utm_source, sp.utm_medium, sp.utm_campaign].filter(Boolean).join('/')
    : ''

  // FAQs for Growth+ (geoOptimized). Pro can use custom FAQs.
  const faqs = features.geoOptimized
    ? (tenant.custom_faqs?.length ? tenant.custom_faqs : getDefaultPartnerFAQs(tenant.name))
    : []

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
      <StorefrontTracker tenantId={tenant.id} event="page_view" data={{ slug: tenant.slug }} />

      {/* Meta Pixel · ViewContent al cargar la landing de marca (señal para
          retargeting/optimización de campañas — portado de /merch/[brand]) */}
      <BrandLandingPixel
        brandId={tenant.slug}
        brandName={tenant.name}
        productCount={products.length}
      />

      {/* JSON-LD: Organization (ALL tiers) */}
      <JsonLd data={generateOrganizationSchema(tenant)} />

      {/* JSON-LD: LocalBusiness (Growth+) */}
      {features.seoIndexable && (
        <JsonLd data={generateLocalBusinessSchema(tenant)} />
      )}

      {/* JSON-LD: Breadcrumb (Growth+) */}
      {features.seoIndexable && (
        <JsonLd
          data={generateBreadcrumbSchema([
            { name: 'Inicio', url: BASE_URL },
            { name: 'Partners', url: `${BASE_URL}/partners` },
            { name: tenant.name, url: `${BASE_URL}/p/${tenant.slug}` },
          ])}
        />
      )}

      {/* JSON-LD: FAQ (Growth+ via geoOptimized) */}
      {faqs.length > 0 && <JsonLd data={generateFAQSchema(faqs)} />}

      {/* ── Hero ──────────────────────────────────────────────── */}
      <HeroSection tenant={tenant} />

      {/* ── About ─────────────────────────────────────────────── */}
      {(tenant.description || tenant.about_text) && (
        <AboutSection tenant={tenant} />
      )}

      {/* ── Products ──────────────────────────────────────────── */}
      {products.length > 0 && (
        <div id="productos">
          <ProductsGrid tenant={tenant} products={products} />
        </div>
      )}

      {/* ── Storefront Designer (Growth+ only) ────────────────── */}
      {features.storefrontDesigner && (
        <StorefrontDesigner
          slug={tenant.slug}
          primaryColor={tenant.primary_color}
          ctaPhone={tenant.phone}
        />
      )}

      {/* ── CTA ───────────────────────────────────────────────── */}
      <CtaSection tenant={tenant} utmRef={utmRef} hasProducts={products.length > 0} />

      {/* ── FAQ Section (Growth+) ─────────────────────────────── */}
      {faqs.length > 0 && (
        <PartnerFaqSection faqs={faqs} primaryColor={tenant.primary_color} />
      )}

      {/* ── Contact / Lead Form ───────────────────────────────── */}
      <ContactForm tenantSlug={tenant.slug} primaryColor={tenant.primary_color} />

      {/* ── Footer ────────────────────────────────────────────── */}
      <Footer tenant={tenant} />

      {/* ── Chat Widget (Pro plan only) ────────────────────── */}
      {PLAN_FEATURES[tenant.plan].chatbot && (
        <ChatWidget
          tenantSlug={tenant.slug}
          tenantName={tenant.name}
          primaryColor={tenant.primary_color}
        />
      )}

      {/* ── WhatsApp flotante → número del partner ───────────── */}
      <StoreWhatsAppButton phone={tenant.phone} storeName={tenant.name} />
    </main>
  )
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function HeroSection({ tenant }: { tenant: Tenant }) {
  const hasBanner = !!tenant.banner_url || !!tenant.hero_url
  // Prioridad alineada con /merch/[brand] (hero || banner): el partner sube su
  // portada como "Imagen hero" y debe verse igual en su panel y en el link público.
  const bannerSrc = tenant.hero_url || tenant.banner_url

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background */}
      {hasBanner ? (
        <Image
          src={bannerSrc!}
          alt={`${tenant.name} banner`}
          fill
          priority
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${tenant.primary_color} 0%, ${tenant.secondary_color || '#18181b'} 100%)`,
          }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-zinc-950" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 py-24 text-center md:min-h-[70vh]">
        {tenant.logo_url && (
          <Image
            src={tenant.logo_url}
            alt={`${tenant.name} logo`}
            width={120}
            height={120}
            className="rounded-2xl border border-white/10 bg-black/30 object-contain p-2 backdrop-blur-sm"
          />
        )}

        {/* Hide the big brand-name heading when the partner opts out
            (metadata.hero_hide_name = true). Keeps the logo + tagline. */}
        {(tenant.metadata as { hero_hide_name?: boolean } | null)?.hero_hide_name !== true && (
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl">
            {tenant.name}
          </h1>
        )}

        {tenant.tagline && (
          <p className="max-w-xl text-lg text-zinc-300 md:text-xl">
            {tenant.tagline}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {tenant.industry && (
            <Badge
              variant="secondary"
              className="border-white/10 bg-white/10 text-zinc-200 backdrop-blur-sm"
            >
              {tenant.industry}
            </Badge>
          )}
          {tenant.instagram && (
            <a
              href={`https://instagram.com/${tenant.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              @{tenant.instagram.replace('@', '')}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

function AboutSection({ tenant }: { tenant: Tenant }) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h2 className="mb-6 text-2xl font-semibold text-white md:text-3xl">
        Sobre nosotros
      </h2>
      {tenant.description && (
        <p className="mb-4 text-lg leading-relaxed text-zinc-400">
          {tenant.description}
        </p>
      )}
      {tenant.about_text && (
        <p className="text-base leading-relaxed text-zinc-500">
          {tenant.about_text}
        </p>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Products grid
// ---------------------------------------------------------------------------

function ProductsGrid({
  tenant,
  products,
}: {
  tenant: Tenant
  products: PartnerProduct[]
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="mb-10 text-center text-2xl font-semibold text-white md:text-3xl">
        Productos
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            tenantSlug={tenant.slug}
            currency={tenant.currency}
          />
        ))}
      </div>
    </section>
  )
}

function ProductCard({
  product,
  tenantSlug,
  currency,
}: {
  product: PartnerProduct
  tenantSlug: string
  currency: string
}) {
  const image = product.images?.[0]
  const comingSoon = (product.metadata as any)?.coming_soon === true

  return (
    <Link
      href={`/p/${tenantSlug}/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:border-[var(--partner-primary)] hover:shadow-lg hover:shadow-[var(--partner-primary)]/5"
    >
      {/* Image */}
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

        {comingSoon && (
          <Badge className="absolute left-3 top-3 bg-amber-500/90 text-black">
            Próximamente
          </Badge>
        )}

        {product.compare_at_price &&
          product.price &&
          product.compare_at_price > product.price && (
            <Badge className="absolute right-3 top-3 bg-red-600 text-white">
              -{Math.round(
                ((product.compare_at_price - product.price) /
                  product.compare_at_price) *
                  100
              )}
              %
            </Badge>
          )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-medium text-zinc-100 line-clamp-2">
          {product.name}
        </h3>

        {product.category && (
          <span className="text-xs text-zinc-500">{product.category}</span>
        )}

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          {(product.metadata as any)?.size_prices && product.price != null && (
            <span className="text-xs text-zinc-400">Desde</span>
          )}
          {product.price != null && (
            <span className="text-lg font-bold text-white">
              {formatPrice(product.price, currency)}
            </span>
          )}
          {product.compare_at_price != null &&
            product.price != null &&
            product.compare_at_price > product.price && (
              <span className="text-sm text-zinc-500 line-through">
                {formatPrice(product.compare_at_price, currency)}
              </span>
            )}
        </div>

        <span
          className="mt-3 inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-white transition"
          style={{ backgroundColor: 'var(--partner-primary)' }}
        >
          {comingSoon ? 'Próximamente' : 'Ver y comprar →'}
        </span>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// CTA
// ---------------------------------------------------------------------------

function CtaSection({
  tenant,
  utmRef = '',
  hasProducts = false,
}: {
  tenant: Tenant
  utmRef?: string
  hasProducts?: boolean
}) {
  // Si el partner tiene productos, el CTA principal vende — el WhatsApp queda
  // como link secundario para consultas. Esto es lo que da más conversión:
  // antes mandábamos todo a WhatsApp y se cerraba ~0,3 % de los leads.
  let waHref =
    tenant.cta_url ||
    (tenant.phone
      ? `https://wa.me/${tenant.phone.replace(/\D/g, '')}`
      : null)

  if (waHref && utmRef && waHref.includes('wa.me/')) {
    waHref = `${waHref}?text=${encodeURIComponent(`Hola! Ref: ${utmRef}`)}`
  }

  if (!hasProducts && !waHref) return null

  return (
    <section className="px-6 py-20">
      <div
        className="mx-auto max-w-4xl rounded-2xl p-10 text-center md:p-16"
        style={{
          background: `linear-gradient(135deg, ${tenant.primary_color}22 0%, ${tenant.secondary_color || tenant.primary_color}11 100%)`,
          border: `1px solid ${tenant.primary_color}33`,
        }}
      >
        <h2 className="mb-4 text-2xl font-bold text-white md:text-3xl">
          {tenant.cta_text}
        </h2>

        {hasProducts ? (
          <>
            <Button
              asChild
              size="lg"
              className="mt-4 text-white"
              style={{ backgroundColor: tenant.primary_color }}
            >
              <a href="#productos">Ver productos</a>
            </Button>
            {waHref && (
              <div className="mt-4">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
                >
                  ¿Preferís consultar por WhatsApp? Escribinos
                </a>
              </div>
            )}
          </>
        ) : (
          waHref && (
            <Button
              asChild
              size="lg"
              className="mt-4 text-white"
              style={{ backgroundColor: tenant.primary_color }}
            >
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                {tenant.cta_url ? 'Ir ahora' : 'Escribinos por WhatsApp'}
              </a>
            </Button>
          )
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer({ tenant }: { tenant: Tenant }) {
  const features = getPlanFeatures(tenant.plan)
  // Show badge only when plan does NOT allow removal (Starter)
  const showPoweredBy = !features.badgeRemovable

  return (
    <footer className="border-t border-zinc-800 px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
        <div className="text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} {tenant.name}. Todos los derechos
          reservados.
        </div>

        <div className="flex items-center gap-4">
          {tenant.website && (
            <a
              href={tenant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 transition hover:text-zinc-300"
            >
              Web
            </a>
          )}
          {tenant.instagram && (
            <a
              href={`https://instagram.com/${tenant.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 transition hover:text-zinc-300"
            >
              Instagram
            </a>
          )}
        </div>
      </div>

      {showPoweredBy && (
        <div className="mt-6 text-center">
          <a
            href="https://novamente.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-400"
          >
            Powered by{' '}
            <span className="font-semibold text-zinc-300">Novamente</span>
          </a>
        </div>
      )}
    </footer>
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
