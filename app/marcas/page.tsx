import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, ExternalLink, Store } from "lucide-react"
import { getPublishedTenants } from "@/lib/partners/tenant"
import type { Tenant, Plan } from "@/lib/partners/types"

export const revalidate = 3600 // ISR: 1h

export const metadata: Metadata = {
  title: "Marcas que producen con Novamente — Directorio de tiendas",
  description:
    "Explorá los storefronts de bandas, artistas, creadores, comunidades y emprendedores que producen su indumentaria con Novamente. Comprá directo a la marca, con producción on-demand y estampado DTG premium.",
  alternates: { canonical: "https://www.novamente.ar/marcas" },
  openGraph: {
    title: "Marcas que producen con Novamente",
    description:
      "Directorio de marcas argentinas que producen su ropa con Novamente. Bandas, artistas, creadores y emprendedores con storefronts propios.",
    url: "https://www.novamente.ar/marcas",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marcas que producen con Novamente",
    description: "Directorio de tiendas con producción on-demand y estampado DTG en Argentina.",
  },
}

// Plan order para destacar pagos arriba
const PLAN_ORDER: Record<Plan, number> = { pro: 0, growth: 1, starter: 2 }

const PLAN_BADGE: Record<Plan, { label: string; className: string }> = {
  pro: { label: "Pro", className: "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0" },
  growth: { label: "Growth", className: "bg-emerald-600/20 text-emerald-300 border-emerald-600/40" },
  starter: { label: "", className: "" }, // sin badge para starter
}

function sortTenants(tenants: Tenant[]): Tenant[] {
  return [...tenants].sort((a, b) => {
    const planDiff = PLAN_ORDER[a.plan] - PLAN_ORDER[b.plan]
    if (planDiff !== 0) return planDiff
    // Dentro del mismo plan, los más completos primero
    const scoreDiff = (b.completeness_score || 0) - (a.completeness_score || 0)
    if (scoreDiff !== 0) return scoreDiff
    return a.name.localeCompare(b.name)
  })
}

function buildSchema(tenants: Tenant[]) {
  const baseUrl = "https://www.novamente.ar"

  const itemList = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${baseUrl}/marcas#webpage`,
    name: "Marcas que producen con Novamente",
    description:
      "Directorio público de tiendas y storefronts que producen su indumentaria con Novamente: bandas, artistas, creadores, comunidades y emprendedores.",
    url: `${baseUrl}/marcas`,
    isPartOf: { "@id": `${baseUrl}/#website` },
    about: { "@id": `${baseUrl}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: tenants.length,
      itemListElement: tenants.map((t, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Organization",
          "@id": `${baseUrl}/p/${t.slug}#organization`,
          name: t.name,
          url: `${baseUrl}/p/${t.slug}`,
          ...(t.logo_url ? { logo: t.logo_url } : {}),
          ...(t.description ? { description: t.description } : t.tagline ? { description: t.tagline } : {}),
          ...(t.instagram
            ? {
                sameAs: [
                  t.instagram.startsWith("http")
                    ? t.instagram
                    : `https://instagram.com/${t.instagram.replace(/^@/, "")}`,
                ],
              }
            : {}),
        },
      })),
    },
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${baseUrl}/` },
      { "@type": "ListItem", position: 2, name: "Marcas", item: `${baseUrl}/marcas` },
    ],
  }

  return { itemList, breadcrumb }
}

export default async function MarcasPage() {
  const allTenants = await getPublishedTenants()
  const tenants = sortTenants(allTenants)
  const { itemList, breadcrumb } = buildSchema(tenants)

  // Agrupar por industry para filtros (informacional)
  const industriesSet = new Set<string>()
  tenants.forEach(t => {
    if (t.industry) industriesSet.add(t.industry)
  })
  const industries = Array.from(industriesSet).sort()

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* Header */}
      <header className="text-center mb-12 md:mb-16">
        <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase border-primary/30 text-primary">
          <Sparkles className="w-3 h-3 mr-1.5" />
          Directorio público
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" data-speakable>
          Marcas que producen con Novamente
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed" data-speakable>
          Bandas, artistas, creadores, comunidades y emprendedores que tienen su tienda online y producen su ropa con
          nosotros. Estampado DTG, producción on-demand y envíos a todo el país. Comprá directo a la marca.
        </p>

        {tenants.length > 0 && (
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <div>
              <span className="text-2xl font-bold text-foreground">{tenants.length}+</span>
              <span className="ml-2">marcas activas</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <span className="text-2xl font-bold text-foreground">{industries.length}</span>
              <span className="ml-2">rubros distintos</span>
            </div>
          </div>
        )}
      </header>

      {/* Empty state */}
      {tenants.length === 0 ? (
        <div className="text-center py-20 max-w-xl mx-auto">
          <Store className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Pronto vas a poder ver marcas acá</h2>
          <p className="text-muted-foreground mb-6">
            Estamos sumando bandas, artistas y emprendedores que producen con nosotros. Si querés ser uno de ellos,
            lanzá tu marca gratis.
          </p>
          <Link href="/lanza-tu-marca">
            <Button>Lanzá tu marca gratis</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Grid de marcas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {tenants.map(tenant => {
              const planBadge = PLAN_BADGE[tenant.plan]
              const isPaid = tenant.plan !== "starter"
              return (
                <article
                  key={tenant.id}
                  className="group relative rounded-2xl border border-border/40 bg-card/50 hover:bg-card hover:border-primary/30 transition-all overflow-hidden flex flex-col"
                >
                  {/* Hero/banner */}
                  <Link href={`/p/${tenant.slug}`} className="block aspect-[16/9] relative overflow-hidden bg-gradient-to-br from-zinc-800/40 to-zinc-900/60">
                    {tenant.hero_url || tenant.banner_url ? (
                      <Image
                        src={tenant.hero_url || tenant.banner_url || "/placeholder.svg"}
                        alt={`${tenant.name} — storefront Novamente`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${tenant.primary_color}40, ${tenant.secondary_color || tenant.primary_color}20)`,
                        }}
                      >
                        {tenant.logo_url ? (
                          <Image
                            src={tenant.logo_url}
                            alt={`${tenant.name} logo`}
                            width={120}
                            height={120}
                            className="object-contain max-h-24 opacity-90"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-white/80">{tenant.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                    )}
                    {planBadge.label && (
                      <div className="absolute top-3 right-3">
                        <Badge className={`text-[10px] uppercase tracking-widest ${planBadge.className}`}>
                          {planBadge.label}
                        </Badge>
                      </div>
                    )}
                  </Link>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      {tenant.logo_url && (
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border border-border/40 shrink-0 relative">
                          <Image
                            src={tenant.logo_url}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-lg leading-tight truncate">
                          <Link href={`/p/${tenant.slug}`} className="hover:text-primary transition-colors">
                            {tenant.name}
                          </Link>
                        </h2>
                        {tenant.industry && (
                          <p className="text-xs text-muted-foreground mt-0.5">{tenant.industry}</p>
                        )}
                      </div>
                    </div>

                    {tenant.tagline && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{tenant.tagline}</p>
                    )}

                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border/30">
                      <Link href={`/p/${tenant.slug}`} className="flex-1">
                        <Button variant={isPaid ? "default" : "outline"} size="sm" className="w-full">
                          Ver tienda
                        </Button>
                      </Link>
                      {tenant.instagram && (
                        <a
                          href={tenant.instagram.startsWith("http") ? tenant.instagram : `https://instagram.com/${tenant.instagram.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          aria-label={`Instagram de ${tenant.name}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {/* CTA al final */}
          <section className="mt-16 md:mt-20 text-center max-w-2xl mx-auto">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-600/5 p-8 md:p-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">¿Querés tu marca en este directorio?</h2>
              <p className="text-muted-foreground mb-6">
                Lanzá tu storefront gratis con Novamente Studio. Producción on-demand, sin stock ni inversión inicial.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/lanza-tu-marca">
                  <Button size="lg">Lanzá tu marca gratis</Button>
                </Link>
                <Link href="/partners">
                  <Button size="lg" variant="outline">
                    Conocer Novamente Studio
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
