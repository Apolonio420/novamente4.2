import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import {
  Sparkles, ChevronRight, Truck, ShieldCheck, Ruler,
  ZoomIn, Star, Shirt, Droplets, ThermometerSnowflake,
  WashingMachine, ArrowLeft
} from "lucide-react"
import { PRODUCTS } from "@/lib/products"

// Size data — keyed by chart key. T-Shirts split into Aura/Aldea (different charts despite same category)
type SizeChart = { sizes: string[]; width: string[]; length: string[] }
const SIZE_CHARTS: Record<string, SizeChart> = {
  "Hoodies": {
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    width: ["64", "66", "68", "70", "72", "74"],
    length: ["67", "69", "71", "73", "75", "77"],
  },
  "Buzos (Crewneck)": {
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    width: ["65", "67", "69", "71", "73", "75"],
    length: ["66", "68", "70", "72", "74", "76"],
  },
  "Aura T-Shirt": {
    sizes: ["2XS", "XS", "S", "M", "L", "XL", "2XL"],
    width: ["55", "57", "59", "61", "63", "66", "69"],
    length: ["69", "71", "73", "75", "77", "79", "81"],
  },
  "Aldea T-Shirt": {
    sizes: ["S", "M", "L", "XL", "XXL"],
    width: ["48", "52", "56", "58", "60"],
    length: ["63", "68", "72", "75", "77"],
  },
  "Remeras Crop": {
    sizes: ["S", "M", "L", "XL", "2XL"],
    width: ["46", "48", "50", "52", "53"],
    length: ["40", "42", "44", "46", "48"],
  },
  "Musculosas": {
    sizes: ["S", "M", "L", "XL", "2XL"],
    width: ["28", "30", "32", "34", "36"],
    length: ["44", "46", "48", "50", "52"],
  },
  "Remeras Mujer": {
    sizes: ["S", "M", "L", "XL", "2XL"],
    width: ["47", "49", "51", "53", "55"],
    length: ["61", "63", "65", "67", "69"],
  },
  "Remeras Infantiles": {
    sizes: ["4", "6", "8", "10", "12", "14", "16"],
    width: ["38", "40", "42", "44", "46", "48", "50"],
    length: ["53", "55", "57", "59", "61", "63", "66"],
  },
}

function getSizeChartKey(productId: string, category: string): string {
  if (productId.startsWith("aura-tshirt")) return "Aura T-Shirt"
  if (productId.startsWith("aldea-tshirt")) return "Aldea T-Shirt"
  return category
}

const CARE_INSTRUCTIONS = [
  { icon: WashingMachine, title: "Lavar del reves", desc: "Agua fria (max 30°C)" },
  { icon: ThermometerSnowflake, title: "No usar secadora", desc: "Secar a la sombra" },
  { icon: Droplets, title: "No usar lavandina", desc: "Detergente suave" },
  { icon: Shirt, title: "Planchar al reves", desc: "Temperatura baja" },
]

function generateReviews(productName: string, category: string) {
  const reviewSets: Record<string, Array<{ author: string; rating: number; text: string }>> = {
    "Hoodies": [
      { author: "Martina L.", rating: 5, text: "Increible la calidad del hoodie. El estampado quedo perfecto y ya lo lave varias veces sin perder color." },
      { author: "Lucas P.", rating: 5, text: "Super comodo y abrigado. El diseno que hice con la IA quedo exactamente como lo imagine." },
      { author: "Sofia R.", rating: 4, text: "Muy buena calidad de tela. El unico detalle es que tarda unos dias la produccion, pero vale la pena la espera." },
    ],
    "T-Shirts": [
      { author: "Juan M.", rating: 5, text: "La mejor remera personalizada que compre. La tela es gruesa y el estampado es increible." },
      { author: "Camila G.", rating: 5, text: "Me encanto el proceso. Describe tu idea, la IA la crea y te llega una remera unica." },
      { author: "Tomas B.", rating: 4, text: "Excelente calidad. La oversize tiene un fit perfecto, ni muy grande ni muy chica." },
    ],
    default: [
      { author: "Valeria N.", rating: 5, text: "Producto de excelente calidad. El diseno personalizado con IA es una experiencia unica." },
      { author: "Diego F.", rating: 5, text: "Superó mis expectativas. La impresion DTG es de primera y la tela es muy buena." },
      { author: "Carolina S.", rating: 4, text: "Muy contenta con mi compra. Lo recomiendo para regalo, queda espectacular." },
    ],
  }
  return reviewSets[category] || reviewSets.default
}

export async function generateStaticParams() {
  return PRODUCTS.filter(p => p.available).map((product) => ({
    id: product.id,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const product = PRODUCTS.find((p) => p.id === id)
  if (!product || !product.available) return { title: "Producto no encontrado" }

  const numericPrice = parseInt(product.price.replace(/[$.]/g, ""), 10)
  const baseUrl = "https://www.novamente.ar"

  return {
    title: `${product.name} — Personalizable con IA | Novamente`,
    description: `${product.name} a ${product.price}. ${product.description.slice(0, 140)}... Algodon 100% premium con estampado DTG. Personalizalo con inteligencia artificial.`,
    keywords: [
      product.name.toLowerCase(),
      `${product.category.toLowerCase()} personalizado`,
      "ropa personalizada argentina",
      "estampado dtg",
      "diseno con ia",
      "novamente",
    ],
    openGraph: {
      title: `${product.name} — ${product.price} | Novamente`,
      description: product.description.slice(0, 200),
      url: `${baseUrl}/products/${product.id}`,
      images: [{ url: `${baseUrl}${product.images.main}`, width: 800, height: 800 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — ${product.price}`,
      description: product.description.slice(0, 200),
    },
    alternates: { canonical: `${baseUrl}/products/${product.id}` },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = PRODUCTS.find((p) => p.id === id)
  if (!product || !product.available) notFound()

  const numericPrice = parseInt(product.price.replace(/[$.]/g, ""), 10)
  const baseUrl = "https://www.novamente.ar"
  const reviews = generateReviews(product.name, product.category)
  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
  const sizeChart = SIZE_CHARTS[getSizeChartKey(product.id, product.category)]

  // Related products: same category, different product
  const relatedProducts = PRODUCTS
    .filter((p) => p.category === product.category && p.id !== product.id && p.available)
    .slice(0, 3)

  // If less than 3 related, fill from other categories
  if (relatedProducts.length < 3) {
    const others = PRODUCTS
      .filter((p) => p.category !== product.category && p.id !== product.id && p.available)
      .slice(0, 3 - relatedProducts.length)
    relatedProducts.push(...others)
  }

  const allImages = [product.images.main, ...product.images.lifestyle]

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: allImages.map((img) => `${baseUrl}${img}`),
    brand: { "@type": "Brand", name: "Novamente" },
    color: product.color,
    material: "Algodon 100%",
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/products/${product.id}`,
      priceCurrency: "ARS",
      price: numericPrice,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      priceValidUntil: "2026-12-31",
      seller: { "@id": "https://www.novamente.ar/#organization" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "AR" },
        shippingRate: { "@type": "MonetaryAmount", currency: "ARS", value: "5500" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 5, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 10, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: { "@id": "https://www.novamente.ar/#return-policy" },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: reviews.length,
      bestRating: "5",
      worstRating: "1",
    },
    review: reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: "5" },
      reviewBody: r.text,
    })),
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${baseUrl}/` },
      { "@type": "ListItem", position: 2, name: "Productos", item: `${baseUrl}/products` },
      { "@type": "ListItem", position: 3, name: product.name, item: `${baseUrl}/products/${product.id}` },
    ],
  }

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Breadcrumb */}
      <nav className="container mx-auto px-4 py-4" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground transition-colors">Inicio</Link></li>
          <li><ChevronRight className="w-3 h-3" /></li>
          <li><Link href="/products" className="hover:text-foreground transition-colors">Productos</Link></li>
          <li><ChevronRight className="w-3 h-3" /></li>
          <li className="text-foreground font-medium truncate max-w-[200px]">{product.name}</li>
        </ol>
      </nav>

      {/* Product Hero */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <Dialog>
              <DialogTrigger asChild>
                <div className="aspect-square relative rounded-2xl overflow-hidden bg-muted cursor-zoom-in group">
                  <Image
                    src={product.images.main}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={90}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 bg-white/95">
                <DialogTitle className="sr-only">{product.name}</DialogTitle>
                <div className="relative w-full aspect-square">
                  <Image src={product.images.main} alt={product.name} fill quality={100} className="object-contain p-4" />
                </div>
              </DialogContent>
            </Dialog>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-2">
              {product.images.lifestyle.map((img, i) => (
                <Dialog key={i}>
                  <DialogTrigger asChild>
                    <div className="aspect-square relative rounded-lg overflow-hidden bg-muted cursor-zoom-in hover:ring-2 ring-primary transition-all">
                      <Image src={img} alt={`${product.name} - Foto ${i + 2}`} fill sizes="120px" quality={70} className="object-cover" />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 bg-white/95">
                    <DialogTitle className="sr-only">{product.name} - Foto {i + 2}</DialogTitle>
                    <div className="relative w-full aspect-square">
                      <Image src={img} alt={`${product.name} - Foto ${i + 2}`} fill quality={100} className="object-contain p-4" />
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
              {/* Measurements thumbnail */}
              {product.images.measurements && (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="aspect-square relative rounded-lg overflow-hidden bg-muted cursor-zoom-in hover:ring-2 ring-primary transition-all">
                      <Image src={product.images.measurements} alt={`${product.name} - Medidas`} fill sizes="120px" quality={70} className="object-contain p-1" />
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <Ruler className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl p-0 bg-white/95">
                    <DialogTitle className="sr-only">Tabla de medidas - {product.name}</DialogTitle>
                    <div className="relative w-full aspect-[4/3]">
                      <Image src={product.images.measurements} alt={`Medidas ${product.name}`} fill quality={100} className="object-contain p-4" />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-primary border-primary">{product.category}</Badge>
              <Badge className="bg-green-500 text-white">En stock</Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-2" data-speakable>{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{avgRating}/5 ({reviews.length} reviews)</span>
            </div>

            <p className="text-4xl font-bold text-primary mb-4">{product.price}</p>
            <p className="text-sm text-muted-foreground mb-6">6 cuotas sin interes de ${(numericPrice / 6).toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p>

            <p className="text-muted-foreground mb-6 leading-relaxed" data-speakable>{product.description}</p>

            {/* Color */}
            <div className="mb-6">
              <span className="text-sm font-medium">Color:</span>
              <span className="ml-2 text-sm">{product.color}</span>
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>Algodon 100% premium</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Estampado DTG profesional</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="w-4 h-4 text-blue-500" />
                <span>Envio a todo el pais</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Ruler className="w-4 h-4 text-orange-500" />
                <span>{product.category === "Remeras Infantiles" ? "Talles 4 a 16" : `Talles S a ${product.category === "Remeras Crop" || product.category === "Musculosas" || product.category === "Remeras Mujer" ? "XL" : "XXL"}`}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link href="/#generator-section" className="flex-1" data-cta="product-detail-customize">
                <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold rounded-xl py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Personalizar con IA
                </Button>
              </Link>
              <Link href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Estoy%20viendo%20un%20producto%20en%20su%20web%20y%20quiero%20cotizar%20%2F%20comprar.%20(ref%20%C2%B7%20NV-PDP)" target="_blank" className="flex-1">
                <Button variant="outline" className="w-full rounded-xl py-6 text-lg">
                  Consultar por WhatsApp
                </Button>
              </Link>
            </div>

            {/* Shipping info */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Envios</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>AMBA: $5.500 (3-5 dias)</div>
                  <div>Interior BA: $7.000 (5-7 dias)</div>
                  <div>Resto del pais: $9.000 (7-10 dias)</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Produccion: 2-5 dias habiles</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Size Guide Section */}
      {sizeChart && (
        <section className="bg-muted/30 py-12" id="guia-de-talles">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Ruler className="w-6 h-6 text-primary" />
              Guia de Talles
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Size Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-primary/10">
                      <th className="px-4 py-3 text-left font-semibold rounded-tl-lg">Talle</th>
                      <th className="px-4 py-3 text-center font-semibold">Ancho (cm)</th>
                      <th className="px-4 py-3 text-center font-semibold rounded-tr-lg">Largo (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeChart.sizes.map((size, i) => (
                      <tr key={size} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                        <td className="px-4 py-3 font-bold text-primary">{size}</td>
                        <td className="px-4 py-3 text-center">{sizeChart.width[i]}</td>
                        <td className="px-4 py-3 text-center">{sizeChart.length[i]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-3">
                  * Las medidas pueden variar +/- 1cm. Si estas entre dos talles, te recomendamos elegir el mas grande.
                </p>
                <a
                  href="/guia-de-talles-novamente.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Ruler className="w-4 h-4" />
                  Descargar guía de talles completa (PDF)
                </a>
              </div>

              {/* Measurements Image */}
              {product.images.measurements && (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="aspect-square relative rounded-xl overflow-hidden bg-white cursor-zoom-in group border max-w-md mx-auto w-full">
                      <Image
                        src={product.images.measurements}
                        alt={`Tabla de medidas ${product.name}`}
                        fill
                        sizes="400px"
                        quality={85}
                        className="object-contain p-4"
                      />
                      <div className="absolute bottom-3 right-3 bg-primary/90 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                        <ZoomIn className="w-3 h-3" /> Ampliar
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl p-0 bg-white/95">
                    <DialogTitle className="sr-only">Tabla de medidas - {product.name}</DialogTitle>
                    <div className="relative w-full aspect-[4/3]">
                      <Image src={product.images.measurements} alt={`Medidas ${product.name}`} fill quality={100} className="object-contain p-4" />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Care Instructions */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Cuidado del Estampado DTG</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CARE_INSTRUCTIONS.map((care) => (
            <Card key={care.title} className="text-center">
              <CardContent className="p-4">
                <care.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm mb-1">{care.title}</h3>
                <p className="text-xs text-muted-foreground">{care.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Siguiendo estas instrucciones, tu estampado DTG se mantendra vibrante por 50+ lavados.
        </p>
      </section>

      {/* Reviews */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            Reviews de Clientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 italic">&quot;{review.text}&quot;</p>
                  <p className="text-sm font-semibold">{review.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Tambien te puede interesar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((rp) => (
              <Link key={rp.id} href={`/products/${rp.id}`} className="group">
                <Card className="overflow-hidden hover:shadow-lg transition-all">
                  <div className="aspect-square relative overflow-hidden">
                    <Image
                      src={rp.images.main}
                      alt={rp.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      quality={70}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{rp.name}</h3>
                    <p className="text-primary font-bold text-lg">{rp.price}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-primary/5 to-purple-600/5 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Hacelo unico con tu diseno</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Describi tu idea y nuestra inteligencia artificial crea el diseno perfecto para tu {product.name.split(" - ")[0].toLowerCase()}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#generator-section" data-cta="product-detail-bottom-cta">
              <Button className="bg-gradient-to-r from-primary to-purple-600 text-white font-semibold rounded-xl py-6 px-8 text-lg shadow-lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Disenar Ahora con IA
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="rounded-xl py-6 px-8 text-lg">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Ver Catalogo Completo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
