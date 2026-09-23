import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTenantBySlug } from '@/lib/partners/tenant'
import { industryLabel } from '@/lib/partners/industry'
import { getPublishedProducts } from '@/lib/partners/catalog'
import { PLAN_FEATURES, getPlanFeatures, effectivePlan } from '@/lib/partners/plans'
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
import { buttonColors, isValidHex, readableTextOn } from '@/lib/color/contrast'
import { heroFocalToObjectPosition } from '@/lib/partners/hero-focal'
import { headingFontClassName } from './fonts'
import { ProductCardImage } from '@/components/partners/product-card-image'
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
    tenant.seo_description ||
    tenant.description ||
    `Tienda de ${tenant.name} en Novamente: prendas estampadas.`
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

  const allPublishedProducts = await getPublishedProducts(tenant.id)
  const features = getPlanFeatures(tenant.plan)

  // Cap freemium: la vidriera pública muestra como máximo maxProducts del
  // plan EFECTIVO (no el contratado — un tenant degradado por impago ya tiene
  // tenant.plan='starter', pero effectivePlan() es la fuente de verdad para
  // "qué puede usar hoy", igual que el resto de los gates de features). Los
  // planes con cupo ilimitado (growth/pro, PLAN_FEATURES.*.maxProducts =
  // 999999) nunca se recortan en la práctica — ningún tenant real llega a esa
  // cantidad de productos. Se muestran los primeros N según el orden actual
  // de la query (sort_order, ver getPublishedProducts).
  const maxVisibleProducts = getPlanFeatures(effectivePlan(tenant)).maxProducts
  const products = allPublishedProducts.slice(0, maxVisibleProducts)

  // SEM UTM tracking (Pro only)
  const utmRef = features.semReady
    ? [sp.utm_source, sp.utm_medium, sp.utm_campaign].filter(Boolean).join('/')
    : ''

  // FAQs en todos los planes (antes solo Growth+/geoOptimized: 85/88 tiendas
  // starter no mostraban nada). custom_faqs del partner sigue reemplazando
  // a las por defecto cuando existen. El JSON-LD de FAQ (más abajo) usa esta
  // misma variable, así que queda coherente con lo que se muestra.
  const faqs = tenant.custom_faqs?.length ? tenant.custom_faqs : getDefaultPartnerFAQs(tenant.name)

  return (
    <main
      className="min-h-screen bg-zinc-950 text-zinc-100"
      style={
        {
          '--partner-primary': tenant.primary_color,
          '--partner-secondary': tenant.secondary_color,
          // accent_color del panel (Fase 2): si no es un hex válido, cae al
          // primario — mismo comportamiento que antes de esta fase.
          '--partner-accent': isValidHex(tenant.accent_color) ? tenant.accent_color : tenant.primary_color,
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

      {/* JSON-LD: FAQ (todos los planes) */}
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

      {/* ── FAQ Section (todos los planes) ───────────────────── */}
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
  const heading = headingFontClassName(tenant.font_preference)
  const accentValid = isValidHex(tenant.accent_color)

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
          // Punto de foco elegido por el partner (metadata.hero_focal, panel de
          // branding) — default 50/50. Evita que el crop centrado se coma el
          // diseño en mobile (auditoría: 40/80 tiendas pierden ≥50% de la imagen).
          style={{ objectPosition: heroFocalToObjectPosition(tenant.metadata) }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${tenant.primary_color} 0%, ${tenant.secondary_color || '#18181b'} 100%)`,
          }}
        />
      )}

      {/* Gradient overlay. En mobile con banner, el recorte angosto pone a la
          persona/estampa justo detrás del título centrado: el texto baja al pie
          del hero y el degradado oscurece solo abajo, dejando la foto visible arriba. */}
      <div
        className={
          hasBanner
            ? 'absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-zinc-950 md:from-black/60 md:via-black/40'
            : 'absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-zinc-950'
        }
      />

      {/* Content */}
      <div
        className={`relative z-10 flex min-h-[60vh] flex-col items-center gap-6 px-6 text-center md:min-h-[70vh] md:justify-center md:py-24 ${
          hasBanner ? 'justify-end pb-12 pt-40' : 'justify-center py-24'
        }`}
      >
        {/* Hide the big hero logo when the partner opts out
            (metadata.hero_hide_logo = true). Navbar/header logo is untouched. */}
        {tenant.logo_url &&
          (tenant.metadata as { hero_hide_logo?: boolean } | null)?.hero_hide_logo !== true && (() => {
            const logoMeta = tenant.metadata as
              | { logo_tone?: 'dark' | 'light'; logo_aspect?: number }
              | null
            // Logo oscuro sobre la caja translúcida oscura de siempre = invisible
            // (auditoría). metadata.logo_tone se calcula al subir el logo
            // (app/api/partners/branding/route.ts, lib/partners/logo-tone.ts).
            const isDarkLogo = logoMeta?.logo_tone === 'dark'
            // Logos muy anchos (wordmarks, aspect > 2.2) no entran bien en una
            // caja cuadrada 120×120 — se les da una caja ancha en su lugar.
            const isWide = typeof logoMeta?.logo_aspect === 'number' && logoMeta.logo_aspect > 2.2
            const boxWidth = isWide ? 220 : 120
            const boxHeight = 120
            return (
              <Image
                src={tenant.logo_url}
                alt={`${tenant.name} logo`}
                width={boxWidth}
                height={boxHeight}
                className={`rounded-2xl border object-contain p-2 backdrop-blur-sm ${
                  isDarkLogo
                    ? 'border-black/10 bg-white/90'
                    : 'border-white/10 bg-black/30'
                }`}
              />
            )
          })()}

        {/* Hide the big brand-name heading when the partner opts out
            (metadata.hero_hide_name = true). Keeps the logo + tagline. */}
        {(tenant.metadata as { hero_hide_name?: boolean } | null)?.hero_hide_name !== true && (
          <h1 className={`max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl ${heading}`}>
            {tenant.name}
          </h1>
        )}

        {tenant.tagline && (
          <p className="max-w-xl text-lg text-zinc-300 md:text-xl">
            {tenant.tagline}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {industryLabel(tenant) && (
            <Badge
              variant="secondary"
              className={accentValid ? 'backdrop-blur-sm border-transparent' : 'border-white/10 bg-white/10 text-zinc-200 backdrop-blur-sm'}
              style={
                accentValid
                  ? {
                      backgroundColor: tenant.accent_color!,
                      color: readableTextOn(tenant.accent_color!),
                    }
                  : undefined
              }
            >
              {industryLabel(tenant)}
            </Badge>
          )}
          {tenant.instagram && (
            <a
              href={`https://instagram.com/${tenant.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-400 underline-offset-4 transition hover:text-white hover:underline"
              style={accentValid ? { textDecorationColor: tenant.accent_color! } : undefined}
            >
              @{tenant.instagram.replace('@', '')}
            </a>
          )}
        </div>

        {/* Optional hero CTA that anchors down to the products grid
            (metadata.hero_cta_label). Opt-in per-tenant. */}
        {(() => {
          const heroCtaLabel = (tenant.metadata as { hero_cta_label?: string } | null)
            ?.hero_cta_label
          const heroCtaColors = buttonColors(tenant.primary_color)
          return (
            heroCtaLabel && (
              <Button
                asChild
                size="lg"
                className="mt-2"
                style={{
                  backgroundColor: heroCtaColors.background,
                  color: heroCtaColors.color,
                  ...(heroCtaColors.borderColor && {
                    borderColor: heroCtaColors.borderColor,
                    borderWidth: 1.5,
                  }),
                }}
              >
                <a href="#productos">{heroCtaLabel}</a>
              </Button>
            )
          )
        })()}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

function AboutSection({ tenant }: { tenant: Tenant }) {
  const heading = headingFontClassName(tenant.font_preference)
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h2 className={`mb-6 text-2xl font-semibold text-white md:text-3xl ${heading}`}>
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
  // Custom heading/subheading per-tenant (metadata.products_heading /
  // metadata.products_subheading). Falls back to the hardcoded "Productos".
  const { products_heading: productsHeading, products_subheading: productsSubheading } =
    (tenant.metadata as
      | { products_heading?: string; products_subheading?: string }
      | null) || {}
  const heading = headingFontClassName(tenant.font_preference)

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      {productsSubheading && (
        <p className="mb-2 text-center text-sm uppercase tracking-wide text-zinc-500">
          {productsSubheading}
        </p>
      )}
      <h2 className={`mb-10 text-center text-2xl font-semibold text-white md:text-3xl ${heading}`}>
        {productsHeading || 'Productos'}
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            tenantSlug={tenant.slug}
            currency={tenant.currency}
            primaryColor={tenant.primary_color}
            accentColor={tenant.accent_color}
            headingClassName={heading}
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
  primaryColor,
  accentColor,
  headingClassName,
}: {
  product: PartnerProduct
  tenantSlug: string
  currency: string
  primaryColor: string
  accentColor?: string | null
  headingClassName?: string
}) {
  const comingSoon = (product.metadata as any)?.coming_soon === true
  const ctaColors = buttonColors(primaryColor)
  const accentValid = isValidHex(accentColor)

  return (
    <Link
      href={`/p/${tenantSlug}/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:border-[var(--partner-accent)] hover:shadow-lg hover:shadow-[var(--partner-accent)]/5"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-800">
        {product.images?.length ? (
          <ProductCardImage images={product.images} alt={product.name} />
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
        <h3 className={`font-medium text-zinc-100 line-clamp-2 ${headingClassName || ''}`}>
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
            <span
              className="text-lg font-bold text-white"
              style={accentValid ? { color: accentColor! } : undefined}
            >
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

        {product.stock != null && (
          <span
            className={`text-xs font-medium ${
              product.stock === 0
                ? 'text-red-400'
                : product.stock <= 5
                  ? 'text-amber-400'
                  : 'text-zinc-500'
            }`}
          >
            {product.stock === 0 ? 'Sin stock' : `Quedan ${product.stock}`}
          </span>
        )}

        <span
          className="mt-3 inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition"
          style={{
            backgroundColor: ctaColors.background,
            color: ctaColors.color,
            ...(ctaColors.borderColor && {
              border: `1.5px solid ${ctaColors.borderColor}`,
            }),
          }}
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

  // "Contactar" es el default de la columna cta_text — como título de un <h2>
  // no dice nada (auditoría: 59/88 tiendas con ese título repetido arriba de
  // "Ver productos"). Un cta_text propio del partner se sigue mostrando tal cual.
  const ctaTitle =
    tenant.cta_text && tenant.cta_text.trim() !== '' && tenant.cta_text.trim() !== 'Contactar'
      ? tenant.cta_text
      : '¿Encontraste tu próxima prenda?'

  const ctaColors = buttonColors(tenant.primary_color)
  const heading = headingFontClassName(tenant.font_preference)
  const accentValid = isValidHex(tenant.accent_color)
  const ctaButtonStyle = {
    backgroundColor: ctaColors.background,
    color: ctaColors.color,
    ...(ctaColors.borderColor && {
      borderColor: ctaColors.borderColor,
      borderWidth: 1.5,
    }),
  }

  return (
    <section className="px-6 py-20">
      <div
        className="mx-auto max-w-4xl rounded-2xl p-10 text-center md:p-16"
        style={{
          background: `linear-gradient(135deg, ${tenant.primary_color}22 0%, ${tenant.secondary_color || tenant.primary_color}11 100%)`,
          border: `1px solid ${tenant.primary_color}33`,
        }}
      >
        <h2 className={`mb-4 text-2xl font-bold text-white md:text-3xl ${heading}`}>
          {ctaTitle}
        </h2>

        {hasProducts ? (
          <>
            <Button asChild size="lg" className="mt-4" style={ctaButtonStyle}>
              <a href="#productos">Ver productos</a>
            </Button>
            {waHref && (
              <div className="mt-4">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
                  style={accentValid ? { textDecorationColor: tenant.accent_color! } : undefined}
                >
                  ¿Preferís consultar por WhatsApp? Escribinos
                </a>
              </div>
            )}
          </>
        ) : (
          waHref && (
            <Button asChild size="lg" className="mt-4" style={ctaButtonStyle}>
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
            href={BASE_URL}
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
