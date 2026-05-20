export const dynamic = 'force-dynamic'

import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import { getPartnerById } from "@/src/data/partners"
import { getStorefrontBySlug, SLUG_REDIRECTS } from "@/lib/partners/unified-directory"
import { generateOrganizationSchema, generateBreadcrumbSchema, generateFAQSchema, getDefaultPartnerFAQs } from "@/lib/partners/seo"
import { JsonLd } from "@/components/partners/json-ld"
import { FaqSection } from "@/components/partners/faq-section"
import ChatWidget from "@/components/partners/chat-widget"
import { dbProductToProduct } from "@/lib/partners/product-metadata"
import { ProductCard } from "./ProductCard"
import { BrandLandingPixel } from "./BrandLandingPixel"

interface BrandPageProps {
  params: Promise<{ brand: string }>
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { brand } = await params
  const storefront = await getStorefrontBySlug(brand)

  if (!storefront) {
    return { title: 'Marca no encontrada' }
  }

  const title = `${storefront.name} — Merch oficial en Novamente`
  const description = storefront.description
    || storefront.slogan
    || `Descubrí el merchandising oficial de ${storefront.name}. Productos únicos y diseños exclusivos.`

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url: `https://www.novamente.ar/merch/${storefront.slug}`,
      title,
      description,
      ...(storefront.logo && { images: [{ url: storefront.logo, width: 400, height: 400, alt: storefront.name }] }),
      siteName: 'Novamente',
      locale: 'es_AR',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      ...(storefront.logo && { images: [storefront.logo] }),
    },
    alternates: {
      canonical: `https://www.novamente.ar/merch/${storefront.slug}`,
    },
  }
}

export default async function BrandPage(props: BrandPageProps) {
  const params = await props.params

  // Handle slug redirects (renamed brands)
  const redirectTo = SLUG_REDIRECTS[params.brand]
  if (redirectTo) {
    redirect(`/merch/${redirectTo}`)
  }

  const storefront = await getStorefrontBySlug(params.brand)

  if (!storefront) {
    notFound()
  }

  // DB-backed storefront — render with same layout as static partners
  if (storefront.source === 'db' && storefront.tenant) {
    const tenant = storefront.tenant
    const orgSchema = generateOrganizationSchema(tenant)
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Novamente', url: 'https://www.novamente.ar' },
      { name: 'Partners', url: 'https://www.novamente.ar/merch' },
      { name: storefront.name, url: `https://www.novamente.ar/merch/${storefront.slug}` },
    ])
    const faqs = tenant.custom_faqs?.length ? tenant.custom_faqs : getDefaultPartnerFAQs(storefront.name)
    const faqSchema = generateFAQSchema(faqs)

    // Transform DB products → static Product interface for ProductCard
    const products = storefront.products.map((p) => dbProductToProduct(p, tenant))

    // Ignore CTAs that point back to this same storefront (some partners paste
    // their own URL by mistake — a button that reloads the current page is worse
    // than no button at all, so we fall through to the WhatsApp fallback below).
    const ctaUrlNormalized = storefront.ctaUrl?.toLowerCase().replace(/\/+$/, '') ?? ''
    const selfPath = `/merch/${storefront.slug}`
    const ctaIsSelf =
      ctaUrlNormalized.endsWith(selfPath) ||
      ctaUrlNormalized === selfPath.slice(1) ||
      ctaUrlNormalized === `https://www.novamente.ar${selfPath}` ||
      ctaUrlNormalized === `https://novamente.ar${selfPath}`
    const partnerCtaUrl = storefront.ctaUrl && !ctaIsSelf ? storefront.ctaUrl : null
    const partnerCtaText = storefront.ctaText?.trim() || 'Contactar'

    return (
      <div className="container mx-auto px-4 py-8">
        <JsonLd data={orgSchema} />
        <JsonLd data={breadcrumbSchema} />
        <JsonLd data={faqSchema} />
        <div className="mb-6">
          <Link href="/merch">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al catálogo de marcas
            </Button>
          </Link>
        </div>

        {/* Brand Header — identical to static path */}
        <div className="mb-12">
          <div className="relative min-h-[200px] md:min-h-64 rounded-xl overflow-hidden mb-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
            {(storefront.hero || storefront.banner) && (
              <>
                <Image src={(storefront.hero || storefront.banner) as string} alt={`${storefront.name} banner`} fill className="object-cover opacity-25" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40" />
              </>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center py-8">
              <div className="text-center text-white w-full">
                {storefront.logo && (
                  <div className="flex items-center justify-center mb-4">
                    <Image src={storefront.logo} alt={`${storefront.name} Logo`} width={80} height={80} className="object-contain" />
                  </div>
                )}
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-wider mb-2 px-4">{storefront.name}</h1>
                {storefront.slogan && (
                  <p className="text-sm sm:text-lg md:text-xl opacity-90 font-medium tracking-wide px-4">{storefront.slogan}</p>
                )}
              </div>
            </div>
          </div>

          {/* Brand Story — partner-edited (DB path uses description; static path may also fill `values`). */}
          {(storefront.description || storefront.values) && (
            <div className="bg-secondary/20 rounded-xl p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4">La Historia de {storefront.name}</h2>
              <div className="space-y-4 text-muted-foreground">
                {storefront.description && (
                  <p className="leading-relaxed whitespace-pre-line">{storefront.description}</p>
                )}
                {storefront.values && (
                  <p className="leading-relaxed whitespace-pre-line">{storefront.values}</p>
                )}
                {storefront.slogan && (
                  <p className="leading-relaxed font-medium text-foreground">{storefront.slogan}</p>
                )}
              </div>
              {partnerCtaUrl && (
                <div className="mt-6">
                  <Link href={partnerCtaUrl} target={partnerCtaUrl.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                    <Button>{partnerCtaText}</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pixel · dispara ViewContent al cargar la landing de marca */}
        <BrandLandingPixel
          brandId={params.brand}
          brandName={storefront.name}
          productCount={products.length}
        />

        {/* Products Grid — uses ProductCard with carousel, same as static */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Productos Disponibles</h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} brandId={params.brand} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">Esta marca aún no tiene productos publicados.</p>
              <p className="text-sm mt-2">Volvé pronto para ver las novedades.</p>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 mb-16">
          <FaqSection faqs={faqs} />
        </div>

        {/* Brand Values Footer — identical to static path */}
        <div className="mt-16 text-center">
          <div className="bg-secondary/30 rounded-xl p-8">
            <div className="relative z-10">
              {storefront.logo && (
                <div className="flex items-center justify-center mb-4">
                  <Image src={storefront.logo} alt={`${storefront.name} Logo`} width={100} height={100} className="object-contain" />
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{storefront.name}</h3>
              {storefront.slogan && (
                <p className="text-primary font-medium mb-4 uppercase tracking-wide">{storefront.slogan}</p>
              )}
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Cada producto de {storefront.name} está pensado para reflejar su identidad única.{" "}
                {storefront.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {storefront.instagram && (
                  <Link href={storefront.instagram.startsWith('http') ? storefront.instagram : `https://instagram.com/${storefront.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                    <Button variant="outline">Seguir a {storefront.name}</Button>
                  </Link>
                )}
                {partnerCtaUrl ? (
                  <Link href={partnerCtaUrl} target={partnerCtaUrl.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                    <Button>{partnerCtaText}</Button>
                  </Link>
                ) : (
                  <Link href="https://wa.me/5492235169720?text=Hola!%20Estoy%20comprando%20en%20una%20tienda%20partner%20de%20Novamente%20y%20quiero%20contactarlos.%20(ref%20%C2%B7%20NV-MERCH)" target="_blank">
                    <Button>Consultá por WhatsApp</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Chat Widget for Pro plan */}
        {storefront.plan === 'pro' && (
          <ChatWidget
            tenantSlug={storefront.slug}
            tenantName={storefront.name}
            primaryColor={storefront.primaryColor}
          />
        )}
      </div>
    )
  }

  // Static/legacy partner — render with hardcoded data
  const brandInfo = getPartnerById(params.brand)
  if (!brandInfo) {
    notFound()
  }

  const products = brandInfo.products

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/merch">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo de marcas
          </Button>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="mb-12">
        {/* Banner */}
        <div className="relative min-h-[200px] md:min-h-64 rounded-xl overflow-hidden mb-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
          {brandInfo.id === "falco" ? (
            <>
              {brandInfo.banner && brandInfo.banner !== "/placeholder.svg" && (
                <div className="absolute inset-0 opacity-10">
                  <Image src={brandInfo.banner} alt={`${brandInfo.name} Background`} fill className="object-contain" />
                </div>
              )}
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2 opacity-20">
                <Image src="/falco/leon-tribal.png" alt="FALCO León" width={200} height={200} className="object-contain" />
              </div>
            </>
          ) : (
            brandInfo.banner && brandInfo.banner !== "/placeholder.svg" && (
              <>
                <Image src={brandInfo.banner} alt={`${brandInfo.name} banner`} fill className="object-cover opacity-25" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40" />
              </>
            )
          )}

          <div className="absolute inset-0 bg-black/40 flex items-center justify-center py-8">
            <div className="text-center text-white w-full">
              <div className="flex items-center justify-center mb-4">
                <Image
                  src={brandInfo.logo}
                  alt={`${brandInfo.name} Logo`}
                  width={80}
                  height={80}
                  className={`object-contain ${brandInfo.id === "falco" ? "filter invert" : ""}`}
                />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-wider mb-2 px-4">{brandInfo.name}</h1>
              <p className="text-sm sm:text-lg md:text-xl opacity-90 font-medium tracking-wide px-4">{brandInfo.slogan}</p>
            </div>
          </div>
        </div>

        {/* Brand Story */}
        <div className="bg-secondary/20 rounded-xl p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">La Historia de {brandInfo.name}</h2>
          <div className="space-y-4 text-muted-foreground">
            <p className="leading-relaxed">{brandInfo.description}</p>
            <p className="leading-relaxed">{brandInfo.values}</p>
            <p className="leading-relaxed font-medium text-foreground">{brandInfo.mission}</p>
          </div>
        </div>
      </div>

      {/* Pixel · dispara ViewContent al cargar la landing de marca (static brand) */}
      <BrandLandingPixel
        brandId={brandInfo.id}
        brandName={brandInfo.name}
        productCount={products.length}
      />

      {/* Products Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Productos Disponibles</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} brandId={params.brand} product={product} />
          ))}
        </div>
      </div>

      {/* Brand Values Footer */}
      <div className="mt-16 text-center">
        <div className="bg-secondary/30 rounded-xl p-8 relative overflow-hidden">
          {brandInfo.id === "falco" && (
            <div className="absolute inset-0 opacity-5">
              <Image src="/falco/tres-anclas.png" alt="FALCO Anclas" fill className="object-contain" />
            </div>
          )}

          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <Image
                src={brandInfo.logo}
                alt={`${brandInfo.name} Logo`}
                width={100}
                height={100}
                className="object-contain"
              />
            </div>
            <h3 className="text-2xl font-bold mb-2">{brandInfo.name}</h3>
            <p className="text-primary font-medium mb-4 uppercase tracking-wide">{brandInfo.slogan}</p>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Cada producto de {brandInfo.name} está pensado para reflejar su identidad única.{" "}
              {brandInfo.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {brandInfo.instagramUrl && (
                <Link href={brandInfo.instagramUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline">Seguir a {brandInfo.name}</Button>
                </Link>
              )}
              <Link href="https://wa.me/5492235169720?text=Hola!%20Estoy%20comprando%20en%20una%20tienda%20partner%20de%20Novamente%20y%20quiero%20contactarlos.%20(ref%20%C2%B7%20NV-MERCH)" target="_blank">
                <Button>Consultá por WhatsApp</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
