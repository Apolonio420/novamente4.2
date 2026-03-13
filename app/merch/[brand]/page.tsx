export const dynamic = 'force-dynamic'

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"
import { getPartnerById } from "@/src/data/partners"
import { ProductCard } from "./ProductCard"

interface BrandPageProps {
  params: Promise<{ brand: string }>
}

export default async function BrandPage(props: BrandPageProps) {
  const params = await props.params
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
            /* Falco: watermark sutil (comportamiento original) */
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
            /* Otros partners: banner como fondo real con overlay para legibilidad */
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
          {/* Fondo decorativo sutil — Solo Falco */}
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
              <Link href="https://wa.me/message/DRWR3O2HZY2JG1" target="_blank">
                <Button>Consultá por WhatsApp</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
