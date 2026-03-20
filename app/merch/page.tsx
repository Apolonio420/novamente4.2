import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import { getDirectoryEntries } from "@/lib/partners/unified-directory"

export const metadata: Metadata = {
  title: "Crea, publica y vendé tu merch con Novamente",
  description: "Generá estampas con IA, ofrecé talles y colores, cobrá online. Nosotros imprimimos y enviamos directo a tus clientes.",
  openGraph: {
    type: "website",
    url: "https://www.novamente.ar/merch",
    title: "Crea, publica y vendé tu merch con Novamente",
    description: "Generá estampas con IA, ofrecé talles y colores, cobrá online. Nosotros imprimimos y enviamos directo a tus clientes.",
    images: [{ url: "https://www.novamente.ar/novamente-logo.png", width: 1200, height: 630, alt: "Logo Novamente" }],
    siteName: "Novamente",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crea, publica y vendé tu merch con Novamente",
    description: "Generá estampas con IA, ofrecé talles y colores, cobrá online. Nosotros imprimimos y enviamos directo a tus clientes.",
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="novamente-heading text-4xl md:text-5xl mb-4">PARTNERS</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
          Descubrí el merchandising oficial de tus marcas favoritas. Productos únicos, diseños exclusivos y la calidad
          que esperás, todo en un solo lugar.
        </p>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {sorted.map((brand) => (
          <Link key={brand.slug} href={`/merch/${brand.slug}`} className="group">
            <div className="border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              {/* Brand Image — solid dark bg for transparent PNGs */}
              <div className="aspect-square relative overflow-hidden bg-[#1a1a2e]">
                {brand.cardImage || brand.logo ? (
                  <Image
                    src={brand.cardImage || brand.logo || ""}
                    alt={`${brand.name} Logo`}
                    fill
                    className="object-contain p-8 group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl font-bold text-muted-foreground/30">
                      {brand.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Featured Badge */}
                {brand.featured && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-white">Destacado</Badge>
                  </div>
                )}
              </div>

              {/* Brand Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-bold tracking-wider">{brand.name}</h2>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                {/* Slogan principal */}
                {brand.slogan && (
                  <p className="text-primary font-medium mb-2 text-sm uppercase tracking-wide">{brand.slogan}</p>
                )}

                {/* Descripción */}
                {brand.description && (
                  <p className="text-muted-foreground mb-4 text-sm line-clamp-2">{brand.description}</p>
                )}

                <div className="flex items-center justify-between">
                  {brand.productCount > 0 && (
                    <span className="text-sm text-muted-foreground">{brand.productCount} productos disponibles</span>
                  )}
                  <Button
                    size="sm"
                    className="bg-zinc-700 text-zinc-100 border border-zinc-600 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 ml-auto"
                  >
                    Ver tienda
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Become a Partner Section */}
      <div className="mt-24 mb-16">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <Badge className="w-fit mb-6 bg-primary/20 text-primary border-primary/50 hover:bg-primary/30">
                SUMATE A NOVAMENTE
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                Potenciá tu marca con merchandising <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">premium y sin riesgos</span>.
              </h2>

              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-900/30 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                    <span className="text-purple-400 font-bold">01</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Cero stock, cero logística</h3>
                    <p className="text-gray-400 text-sm mt-1">Nos encargamos de la producción, el stock y los envíos. Vos solo te enfocas en crear y vender.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-pink-900/30 flex items-center justify-center flex-shrink-0 border border-pink-500/30">
                    <span className="text-pink-400 font-bold">02</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Calidad de exportación</h3>
                    <p className="text-gray-400 text-sm mt-1">Prendas de algodón premium y estampados DTG de última generación que duran para siempre.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-900/30 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                    <span className="text-blue-400 font-bold">03</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Tu propia tienda oficial</h3>
                    <p className="text-gray-400 text-sm mt-1">Un espacio exclusivo para tu marca dentro de nuestra plataforma, con URL personalizada.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/partners/join">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-gray-100 font-semibold px-8">
                    Quiero ser Partner
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
                    Ver calidad de prendas
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative h-64 lg:h-auto bg-zinc-900">
              <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full max-w-md max-h-96 p-8">
                  <div className="w-full h-full border border-gray-700/50 rounded-xl bg-gray-900/50 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full mb-4 animate-pulse"></div>
                    <h3 className="text-xl font-bold text-gray-200 mb-2">Tu Marca Aquí</h3>
                    <p className="text-gray-500 text-sm">Convertite en el próximo caso de éxito.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
