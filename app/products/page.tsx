export const revalidate = 3600 // ISR: revalidate every hour

import Link from "next/link"
import type { Metadata } from "next"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Palette, Sparkles, ZoomIn } from "lucide-react"
import { PRODUCTS } from "@/lib/products"

export const metadata: Metadata = {
  title: "Catálogo de Productos — Remeras, Hoodies y Buzos personalizados",
  description:
    "Explorá el catálogo completo de Novamente: hoodies oversize desde $55.000, remeras desde $28.600, buzos crewneck, musculosas y lienzos. Algodón 100% premium con estampado DTG. Todos personalizables con diseño de IA.",
  openGraph: {
    title: "Productos Novamente — Ropa personalizada con IA",
    description: "Hoodies, remeras, buzos y más. Algodón 100% premium con estampado DTG personalizado con inteligencia artificial.",
    url: "https://www.novamente.ar/products",
  },
  twitter: {
    card: "summary_large_image",
    title: "Productos Novamente — Ropa personalizada con IA",
    description: "Hoodies, remeras, buzos y más. Algodón 100% premium con estampado DTG personalizado.",
  },
  alternates: { canonical: "https://www.novamente.ar/products" },
}

// Generate Product schema for each product
function generateProductsJsonLd() {
  const baseUrl = "https://www.novamente.ar"
  return PRODUCTS.filter(p => p.available).map((product) => {
    const numericPrice = parseInt(product.price.replace(/[$.]/g, ""), 10)
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: `${baseUrl}${product.images.main}`,
      brand: {
        "@type": "Brand",
        name: "Novamente",
      },
      category: product.category,
      color: product.color,
      material: "Algodón 100%",
      offers: {
        "@type": "Offer",
        url: `${baseUrl}/products#${product.id}`,
        priceCurrency: "ARS",
        price: numericPrice,
        availability: "https://schema.org/InStock",
        seller: { "@id": "https://www.novamente.ar/#organization" },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "AR",
          },
          shippingRate: {
            "@type": "MonetaryAmount",
            currency: "ARS",
            value: "5500",
          },
        },
      },
    }
  })
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.novamente.ar/" },
    { "@type": "ListItem", position: 2, name: "Productos", item: "https://www.novamente.ar/products" },
  ],
}

export default function ProductsPage() {
  const products = PRODUCTS
  const productsJsonLd = generateProductsJsonLd()


  // Agrupar productos por categoría
  const categories = ["Hoodies", "Buzos (Crewneck)", "T-Shirts", "Remeras Crop", "Musculosas", "Remeras Mujer", "Arte"]

  const groupedProducts = categories.map(category => ({
    name: category,
    items: products.filter(product => product.category === category)
  })).filter(group => group.items.length > 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="text-center mb-12">
        <h1 className="novamente-heading text-4xl md:text-5xl mb-4">CATÁLOGO DE PRODUCTOS</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
          Descubrí nuestra colección de prendas premium. Cada producto está diseñado para ser el canvas perfecto para
          tus creaciones con IA. Calidad superior, fit moderno y la base ideal para tu estilo único.
        </p>
      </div>

      {/* Índice de Categorías */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 mb-8 -mx-4 px-4 overflow-x-auto border-b border-border/10 shadow-sm">
        <div className="flex gap-2 min-w-max justify-center md:flex-wrap">
          {groupedProducts.map((group) => (
            <Link key={group.name} href={`#category-${group.name.replace(/\s+/g, '-').toLowerCase()}`}>
              <Badge variant="secondary" className="text-sm py-2 px-4 hover:bg-primary hover:text-white transition-colors cursor-pointer rounded-md">
                {group.name}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-16">
        {groupedProducts.map((group) => (
          <div key={group.name} id={`category-${group.name.replace(/\s+/g, '-').toLowerCase()}`} className="scroll-mt-32">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b pb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {group.name}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {group.items.map((product, index) => (
                <article key={product.id} className="group" aria-label={product.name}>
                  <div className="border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    {/* Imagen principal clickeable - va a #generator-section */}
                    <Link href="/#generator-section" className="block" data-cta="products-page-image-click">
                      <div className="aspect-square relative overflow-hidden cursor-pointer">
                        <Image
                          src={product.images.main || "/placeholder.svg"}
                          alt={`${product.name} — prenda personalizable de Novamente`}
                          fill
                          priority={index < 3}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          quality={80}

                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Overlay sutil al hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                              <Palette className="w-6 h-6 text-primary" />
                            </div>
                          </div>
                        </div>

                        {/* Badge de disponibilidad */}
                        <div className="absolute top-4 left-4">
                          {product.available ? (
                            <Badge className="bg-green-500 text-white">Disponible</Badge>
                          ) : (
                            <Badge variant="secondary">Próximamente</Badge>
                          )}
                        </div>

                        {/* Badge de categoría con color violeta NovaMente */}
                        <div className="absolute top-4 right-4">
                          <Badge
                            variant="outline"
                            className="bg-white/90 backdrop-blur-sm border-primary text-primary font-medium"
                          >
                            {product.category}
                          </Badge>
                        </div>
                      </div>
                    </Link>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-semibold leading-tight">{product.name}</h3>
                        <span className="text-2xl font-bold text-primary ml-4 whitespace-nowrap">{product.price}</span>
                      </div>

                      <p className="text-muted-foreground mb-4 text-sm leading-relaxed flex-1">{product.description}</p>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">
                          Color: <span className="font-medium">{product.color}</span>
                        </span>
                      </div>

                      {/* Galería de imágenes adicionales */}
                      {product.available && (product.images.lifestyle.length > 0 || product.images.measurements) && (
                        <Tabs defaultValue="lifestyle" className="mb-4">
                          <TabsList className="grid w-full grid-cols-2">
                            {product.images.lifestyle.length > 0 && (
                              <TabsTrigger value="lifestyle">
                                {product.category === "Arte" ? "Tamaños" : "Lifestyle"}
                              </TabsTrigger>
                            )}
                            {product.images.measurements && (
                              <TabsTrigger value="medidas">
                                {product.category === "Arte" ? "Detalles" : "Medidas"}
                              </TabsTrigger>
                            )}
                          </TabsList>

                          {product.images.lifestyle.length > 0 && (
                            <TabsContent value="lifestyle" className="mt-4">
                              <div className="grid grid-cols-2 gap-2">
                                {product.images.lifestyle.map((img, imgIndex) => (
                                  <div key={imgIndex} className="aspect-square relative rounded-lg overflow-hidden">
                                    <Image
                                      src={img || "/placeholder.svg"}
                                      alt={`${product.name} - ${product.category === "Arte" ? `Tamaño ${imgIndex + 1}` : `Lifestyle ${imgIndex + 1}`}`}
                                      fill
                                      sizes="150px"
                                      quality={70}
            
                                      className="object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
                          )}

                          {product.images.measurements && (
                            <TabsContent value="medidas" className="mt-4">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <div className="aspect-square relative rounded-lg overflow-hidden bg-muted cursor-zoom-in group/zoom">
                                    <Image
                                      src={product.images.measurements || "/placeholder.svg"}
                                      alt={`${product.name} - ${product.category === "Arte" ? "Detalles de tamaños" : "Tabla de medidas"}`}
                                      fill
                                      sizes="300px"
                                      quality={85}
            
                                      className="object-contain p-2"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/zoom:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                      <ZoomIn className="w-8 h-8 text-primary opacity-0 group-hover/zoom:opacity-100 transition-opacity duration-300" />
                                    </div>
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-white/95">
                                  <DialogTitle className="sr-only">Tabla de medidas - {product.name}</DialogTitle>
                                  <div className="relative w-full aspect-[4/3]">
                                    <Image
                                      src={product.images.measurements || "/placeholder.svg"}
                                      alt={`Medidas ${product.name}`}
                                      fill
                                      quality={100}
            
                                      className="object-contain p-4"
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TabsContent>
                          )}
                        </Tabs>
                      )}

                      {/* Botón personalizar mejorado - va a #generator-section */}
                      <div className="flex gap-2 mt-auto">
                        {product.available ? (
                          <Link href="/#generator-section" className="flex-1" data-cta="products-page-personalize">
                            <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium rounded-lg py-3 px-6 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Personalizar Ahora
                            </Button>
                          </Link>
                        ) : (
                          <Button disabled className="w-full rounded-lg py-3">
                            Próximamente
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Información adicional */}
      <div className="mt-16 text-center">
        <div className="bg-gradient-to-br from-primary/5 to-purple-600/5 rounded-xl p-8 border border-primary/10">
          <h3 className="novamente-heading text-2xl mb-4">¡CATÁLOGO COMPLETO!</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Nuestro catálogo está completo con todas las prendas y productos disponibles. Desde hoodies oversize hasta
            lienzos personalizados, tenés todo lo que necesitás para expresar tu creatividad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://www.instagram.com/novamente.ar/" target="_blank">
              <Button variant="outline" className="rounded-lg bg-transparent">
                Seguinos en Instagram
              </Button>
            </Link>
            <Link href="https://wa.me/message/DRWR3O2HZY2JG1" target="_blank">
              <Button className="rounded-lg">Consultá por WhatsApp</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
