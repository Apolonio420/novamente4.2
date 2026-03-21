import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Rocket, Package, Palette, Truck } from "lucide-react"
import { getDirectoryEntries } from "@/lib/partners/unified-directory"
import MerchFilter from "@/components/MerchFilter"

export const metadata: Metadata = {
  title: "Merch de tus marcas favoritas | Novamente",
  description: "Descubri el merchandising oficial de tus marcas favoritas. Productos unicos, disenos exclusivos y calidad premium DTG. Envios a todo el pais.",
  openGraph: {
    type: "website",
    url: "https://www.novamente.ar/merch",
    title: "Merch de tus marcas favoritas | Novamente",
    description: "Descubri el merchandising oficial de tus marcas favoritas. Productos unicos, disenos exclusivos y calidad premium DTG.",
    images: [{ url: "https://www.novamente.ar/novamente-logo.png", width: 1200, height: 630, alt: "Novamente Merch" }],
    siteName: "Novamente",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Merch de tus marcas favoritas | Novamente",
    description: "Descubri el merchandising oficial de tus marcas favoritas. Productos unicos, disenos exclusivos y calidad premium DTG.",
    images: ["https://www.novamente.ar/novamente-logo.png"],
  },
}

export default async function MerchPage() {
  const entries = await getDirectoryEntries()

  // Featured partners first, then the rest
  const sorted = [...entries].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return 0
  })

  // Extract unique categories
  const categories = Array.from(
    new Set(entries.map((e) => e.category).filter(Boolean))
  ).sort() as string[]

  // Serialize for client component
  const serialized = sorted.map((e) => ({
    slug: e.slug,
    name: e.name,
    slogan: e.slogan,
    description: e.description,
    logo: e.logo,
    cardImage: e.cardImage,
    featured: e.featured,
    productCount: e.productCount,
    category: e.category,
  }))

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4 text-center">
          <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/30">
            MARCAS OFICIALES
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Merch que{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              habla por vos
            </span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg mb-8">
            Descubri el merchandising oficial de marcas que eligen Novamente. Disenos exclusivos, calidad DTG premium y envios a todo el pais.
          </p>
          <Link href="/partners/join">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold gap-2 px-8 shadow-lg shadow-purple-500/20">
              <Rocket className="h-4 w-4" />
              Crea tu propia marca
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Brands Grid with Filters */}
      <section className="container mx-auto px-4 pb-12">
        <MerchFilter entries={serialized} categories={categories} />
      </section>

      {/* Become a Partner CTA — Prominent */}
      <section className="container mx-auto px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-gray-900 via-zinc-900 to-black">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(168,85,247,0.08),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,_rgba(236,72,153,0.06),_transparent_50%)]" />

          <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* Left: Content */}
            <div className="lg:col-span-3 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
              <Badge className="w-fit mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30">
                SUMATE A NOVAMENTE
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Tu marca,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  sin riesgos
                </span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8 max-w-lg">
                Nosotros imprimimos, stockeamos y enviamos. Vos te enfocas en crear y vender.
              </p>

              {/* Features grid */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  { icon: Package, label: 'Cero stock', desc: 'Sin inversion inicial' },
                  { icon: Palette, label: 'Disenos con IA', desc: 'Crea en minutos' },
                  { icon: Truck, label: 'Envios incluidos', desc: 'A todo el pais' },
                  { icon: Rocket, label: 'Tu tienda online', desc: 'URL personalizada' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{label}</p>
                      <p className="text-zinc-500 text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/partners/join">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-zinc-100 font-bold px-8 shadow-lg">
                    Quiero ser Partner
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                    Ver calidad de prendas
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="lg:col-span-2 relative min-h-[280px] lg:min-h-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-transparent lg:block hidden z-10" />
              <div className="relative z-0 w-full h-full flex items-center justify-center p-8">
                <div className="w-full max-w-xs border border-zinc-700/50 rounded-2xl bg-zinc-800/30 backdrop-blur-sm p-8 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl mb-5 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Rocket className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Tu Marca Aqui</h3>
                  <p className="text-zinc-500 text-sm mb-4">Unite a las marcas que ya venden con Novamente</p>
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 border-2 border-zinc-800" />
                    ))}
                    <div className="h-8 w-8 rounded-full bg-purple-600 border-2 border-zinc-800 flex items-center justify-center text-[10px] font-bold text-white">
                      +{entries.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
