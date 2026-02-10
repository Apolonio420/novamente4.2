import Link from "next/link"
export const metadata = { title: "Productos | Novamente" }
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Palette, Sparkles, ZoomIn } from "lucide-react"

export default function ProductsPage() {
  const products = [
    {
      id: "astra-hoodie-negro",
      name: "Astra Oversize Hoodie - Negro",
      price: "$60.000",
      description:
        "Buzo oversize unisex en color negro, confeccionado en algodón 100% premium con interior frisa suave. Nuestra composición de fibras está especialmente optimizada para estampado DTG (Direct to Garment), garantizando colores vibrantes y durabilidad excepcional en cada lavado. Fit relajado y cómodo, ideal para todos los días con tu diseño personalizado que perdurará en el tiempo.",
      images: {
        main: "/products/hoodie-negro-front.jpeg",
        lifestyle: ["/products/hoodie-negro-lifestyle-1.jpeg", "/products/hoodie-negro-lifestyle-2.jpeg"],
        measurements: "/products/hoodie-negro-medidas.png",
      },
      category: "Hoodies",
      color: "Negro",
      available: true,
    },
    {
      id: "astra-hoodie-caramel",
      name: "Astra Oversize Hoodie - Caramel",
      price: "$60.000",
      description:
        "Buzo oversize color caramelo en algodón 100% de primera calidad, con caída fluida y textura suave al tacto. La composición optimizada para DTG asegura que tu diseño se adhiera perfectamente a la fibra, creando estampados resistentes y de alta definición. Tela resistente y abrigada, perfecta para combinar con estampas contrastantes que mantendrán su intensidad.",
      images: {
        main: "/products/hoodie-caramel-front.jpeg",
        lifestyle: ["/products/hoodie-caramel-lifestyle-1.jpeg", "/products/hoodie-caramel-lifestyle-2.jpeg"],
        measurements: "/products/hoodie-caramel-medidas.png",
      },
      category: "Hoodies",
      color: "Caramel",
      available: true,
    },
    {
      id: "astra-hoodie-crema",
      name: "Astra Oversize Hoodie - Crema",
      price: "$60.000",
      description:
        "Nuestra prenda más versátil en tono crema, confeccionada en algodón 100% grueso y frizado. La estructura de fibra natural permite una absorción óptima de tintas DTG, resultando en estampados nítidos y duraderos. Base neutra que realza cualquier diseño con colores que se mantienen vibrantes lavado tras lavado.",
      images: {
        main: "/products/hoodie-crema-front.png",
        lifestyle: ["/products/hoodie-crema-lifestyle.png"],
        measurements: "/products/hoodie-crema-medidas.png",
      },
      category: "Hoodies",
      color: "Crema",
      available: true,
    },
    {
      id: "astra-hoodie-gris",
      name: "Astra Oversize Hoodie - Gris Melange",
      price: "$60.000",
      description:
        "Buzo gris melange en algodón 100% con fit holgado y textura clásica. Nuestra selección de fibras garantiza la máxima compatibilidad con tecnología DTG, logrando estampados de calidad profesional que resisten el uso diario. Confección duradera con costuras reforzadas y base perfecta para destacar tu creatividad.",
      images: {
        main: "/products/hoodie-gris-front.png",
        lifestyle: ["/products/hoodie-gris-lifestyle.png"],
        measurements: "/products/hoodie-gris-medidas.png",
      },
      category: "Hoodies",
      color: "Gris Melange",
      available: true,
    },
    {
      id: "aura-tshirt-blanco",
      name: "Aura Oversize T-Shirt - Blanco",
      price: "$31.000",
      description:
        "Remera oversize blanca en algodón 100% peinado de máxima pureza. Su composición natural es el canvas ideal para estampado DTG, ofreciendo una superficie perfecta donde los colores se expresan con máxima fidelidad. Ligera, cómoda y con excelente caída, diseñada para que tu arte digital cobre vida con durabilidad profesional.",
      images: {
        main: "/products/aura-tshirt-blanco-front.jpeg",
        lifestyle: ["/products/tshirt-blanca-lifestyle-1.jpeg", "/products/tshirt-blanca-lifestyle-2.jpeg"],
        measurements: "/products/tshirt-blanca-medidas.png",
      },
      category: "T-Shirts",
      color: "Blanco",
      available: true,
    },
    {
      id: "aura-tshirt-negro",
      name: "Aura Oversize T-Shirt - Negro",
      price: "$31.000",
      description:
        "Remera oversize negra de algodón 100% peinado premium. La fibra natural pre-tratada optimiza la adherencia de tintas DTG, creando contrastes impactantes ideales para diseños en colores vibrantes o neón. Corte amplio y moderno con base oscura que hace explotar la intensidad de cualquier estampado personalizado.",
      images: {
        main: "/products/aura-tshirt-negro-front.jpeg",
        lifestyle: ["/products/tshirt-negra-lifestyle-1.jpeg", "/products/tshirt-negra-lifestyle-2.jpeg"],
        measurements: "/products/tshirt-negra-medidas.png",
      },
      category: "T-Shirts",
      color: "Negro",
      available: true,
    },
    {
      id: "aura-tshirt-caramel",
      name: "Aura Oversize T-Shirt - Caramel",
      price: "$31.000",
      description:
        "Remera oversize color caramelo en algodón 100% de fibra larga. Su composición natural permite una penetración profunda de las tintas DTG, garantizando estampados duraderos con colores que se integran perfectamente a la tela. Ideal para un estilo urbano y sobrio, con tono cálido que potencia cualquier diseño creativo.",
      images: {
        main: "/products/aura-tshirt-caramel-front.jpeg",
        lifestyle: ["/products/tshirt-caramel-lifestyle-1.jpeg", "/products/tshirt-caramel-lifestyle-2.jpeg"],
        measurements: "/products/tshirt-caramel-medidas.png",
      },
      category: "T-Shirts",
      color: "Caramel",
      available: true,
    },
    {
      id: "aldea-tshirt-negro",
      name: "Aldea Classic Fit T-Shirt - Negro",
      price: "$28.600",
      description:
        "Remera de corte clásico en algodón 100% negro de alta densidad. La estructura de fibra natural está optimizada para tecnología DTG, asegurando estampados precisos y resistentes al desgaste. Ajuste regular con tela suave y resistente, perfecta para un look más sutil donde tu diseño se luce con elegancia profesional.",
      images: {
        main: "/products/tshirt-aldea-negro-front.jpeg",
        lifestyle: ["/products/tshirt-aldea-negro-lifestyle-1.jpeg", "/products/tshirt-aldea-negro-lifestyle-2.jpeg"],
        measurements: "/products/tshirt-aldea-negro-medidas.png",
      },
      category: "T-Shirts",
      color: "Negro",
      available: true,
    },
    {
      id: "aura-tshirt-stone-wash",
      name: "Aura Oversize T-Shirt - Stone Wash",
      price: "$31.000",
      description: "Remera oversize con efecto lavado Stone Wash. Un acabado vintage auténtico sobre nuestro algodón premium de alto gramaje.",
      images: {
        main: "/products/aura-oversize-tshirt-stone-wash/main.png",
        lifestyle: [
          "/products/aura-oversize-tshirt-stone-wash/lifestyle1.jpg",
          "/products/aura-oversize-tshirt-stone-wash/lifestyle2.jpg",
          "/products/aura-oversize-tshirt-stone-wash/lifestyle3.jpg"
        ],
        measurements: "/products/aura-oversize-tshirt-stone-wash/tshirt-blanca-medidas.png"
      },
      category: "T-Shirts",
      color: "Stone Wash",
      available: true
    },
    {
      id: "aldea-tshirt-blanco",
      name: "Aldea Classic Fit T-Shirt - Blanco",
      price: "$28.600",
      description:
        "Remera clásica blanca en algodón 100% de fibra premium con tejido liviano. La pureza del material garantiza una base perfecta para estampado DTG, donde cada detalle de tu diseño se reproduce con nitidez fotográfica. Una prenda atemporal que se adapta a cualquier estilo, con durabilidad que mantiene tu arte intacto.",
      images: {
        main: "/products/tshirt-aldea-blanco-front.jpeg",
        lifestyle: ["/products/tshirt-aldea-blanco-lifestyle-1.jpeg", "/products/tshirt-aldea-blanco-lifestyle-2.jpeg"],
        measurements: "/products/tshirt-aldea-blanco-medidas.png",
      },
      category: "T-Shirts",
      color: "Blanco",
      available: true,
    },
    {
      id: "lienzo",
      name: "Lienzo",
      price: "$59.900",
      description:
        "Obra impresa sobre lienzo textil premium. Personalizá con tu diseño IA en alta definición. Ideal para decorar espacios con identidad propia. Montaje liviano y resistente. Disponible en tres tamaños: 40x35cm, 30x20cm y 15x10cm.",
      images: {
        main: "/products/lienzo-main.png",
        lifestyle: ["/products/lienzo-medidas-1.png", "/products/lienzo-medidas-2.png"],
        measurements: "/products/lienzo-medidas-3.png",
      },
      category: "Arte",
      color: "Personalizable",
      available: true,
    },
    {
      id: "musculosa-bali-blanca",
      name: "Musculosa Bali - Blanca",
      price: "$21.800",
      description: "Musculosa de morley premium en color blanco. Confección suave y fresca, ideal para estampar tu diseño personalizado y lucirlo este verano. Corte moderno que se adapta a tu estilo.",
      images: {
        main: "/products/musculosa-bali-blanca/Musculosa_Rib_Blanca.png",
        lifestyle: ["/products/musculosa-bali-blanca/Musculosa_Rib_Blanca_Lifestyle.png", "/products/musculosa-bali-blanca/Musculosa_Urban.png"],
        measurements: "/products/musculosa-bali-blanca/Medidas3.png"
      },
      category: "Musculosas",
      color: "Blanco",
      available: true
    },
    {
      id: "musculosa-bali-negra",
      name: "Musculosa Bali - Negra",
      price: "$21.800",
      description: "Musculosa de morley premium en color negro. La base oscura perfecta para resaltar diseños en colores vibrantes o blancos. Tela elástica y cómoda para uso diario.",
      images: {
        main: "/products/musculosa-bali-negra/Musculosa_Rib_Negra.png",
        lifestyle: ["/products/musculosa-bali-negra/Musculosa_Rib_Blanca_Lifestyle.png", "/products/musculosa-bali-negra/Musculosa_Urban.png"],
        measurements: "/products/musculosa-bali-negra/Medidas3.png"
      },
      category: "Musculosas",
      color: "Negro",
      available: true
    },
    {
      id: "musculosa-bali-gris",
      name: "Musculosa Bali - Gris",
      price: "$21.800",
      description: "Musculosa de morley premium en color gris. Un tono neutro y versátil que combina con todo. Textura suave y calce perfecto.",
      images: {
        main: "/products/musculosa-bali-gris/Musculosa_Rib_Gris.png",
        lifestyle: ["/products/musculosa-bali-gris/Musculosa_Rib_Blanca_Lifestyle.png", "/products/musculosa-bali-gris/Musculosa_Urban.png"],
        measurements: "/products/musculosa-bali-gris/Medidas3.png"
      },
      category: "Musculosas",
      color: "Gris",
      available: true
    },
    {
      id: "buzo-hoodie-negro",
      name: "Buzo Hoodie Unisex - Negro",
      price: "$55.000",
      description: "Buzo hoodie clásico en color negro. El básico definitivo con fit oversize y algodón frizado premium. Ideal para estampar.",
      images: {
        main: "/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png",
        lifestyle: ["/products/buzo-hoddie-unisex-negro/Buzo_Unisex_Studio.png", "/products/buzo-hoddie-unisex-negro/Buzo_Hoodie_Negro_Hombre_Lifestyle.png"],
        measurements: "/products/buzo-hoddie-unisex-negro/Medidas4.png"
      },
      category: "Hoodies",
      color: "Negro",
      available: true
    },
    {
      id: "buzo-hoodie-stone-wash",
      name: "Buzo Hoodie Unisex - Stone Wash",
      price: "$55.000",
      description: "Buzo hoodie con efecto lavado Stone Wash. Un estilo vintage y urbano único. Algodón premium frizado para máxima comodidad y abrigo.",
      images: {
        main: "/products/buzo-hoddie-unisex-stone-wash/mockups nuevos productos-13.png",
        lifestyle: ["/products/buzo-hoddie-unisex-stone-wash/Buzo_Unisex_Studio.png", "/products/buzo-hoddie-unisex-stone-wash/Buzo_Hoodie_Negro_Hombre_Lifestyle.png"],
        measurements: "/products/buzo-hoddie-unisex-stone-wash/Medidas4.png"
      },
      category: "Hoodies",
      color: "Stone Wash",
      available: true
    },
    {
      id: "buzo-hoodie-blanco",
      name: "Buzo Hoodie Unisex - Blanco",
      price: "$55.000",
      description: "Buzo hoodie clásico en color blanco. Lienzo perfecto para tus diseños más creativos. Algodón frizado de alta calidad.",
      images: {
        main: "/products/buzo-hoddie-unisex-blanco/mockups nuevos productos-11.png",
        lifestyle: ["/products/buzo-hoddie-unisex-blanco/Buzo_Unisex_Studio.png", "/products/buzo-hoddie-unisex-blanco/Buzo_Hoodie_Negro_Hombre_Lifestyle.png"],
        measurements: "/products/buzo-hoddie-unisex-blanco/Medidas4.png"
      },
      category: "Hoodies",
      color: "Blanco",
      available: true
    },
    {
      id: "remera-crop-negra",
      name: "Remera Crop Mujer - Negra",
      price: "$23.500",
      description: "Remera crop de corte moderno en color negro. Algodón suave con calce relajado. Ideal para combinar con todo.",
      images: {
        main: "/products/remera-crop-de-mujer-negra/mockups nuevos productos-4.png",
        lifestyle: ["/products/remera-crop-de-mujer-negra/crop-lifestyle.png", "/products/remera-crop-de-mujer-negra/crop-urban.png"],
        measurements: "/products/remera-crop-de-mujer-negra/Medidas1.png"
      },
      category: "Remeras Crop",
      color: "Negro",
      available: true
    },
    {
      id: "remera-crop-chocolate",
      name: "Remera Crop Mujer - Chocolate",
      price: "$23.500",
      description: "Remera crop en color chocolate, tendencia de temporada. Tono cálido y elegante en algodón premium.",
      images: {
        main: "/products/remera-crop-de-mujer-chocolate/mockups nuevos productos-5.png",
        lifestyle: ["/products/remera-crop-de-mujer-chocolate/crop-lifestyle.png", "/products/remera-crop-de-mujer-chocolate/crop-urban.png"],
        measurements: "/products/remera-crop-de-mujer-chocolate/Medidas1.png"
      },
      category: "Remeras Crop",
      color: "Chocolate",
      available: true
    },
    {
      id: "remera-crop-gris",
      name: "Remera Crop Mujer - Gris Melange",
      price: "$23.500",
      description: "Remera crop clásica en gris melange. El básico infaltable con un toque urbano.",
      images: {
        main: "/products/remera-crop-de-mujer-gris/mockups nuevos productos-6.png",
        lifestyle: ["/products/remera-crop-de-mujer-gris/crop-lifestyle.png", "/products/remera-crop-de-mujer-gris/crop-urban.png"],
        measurements: "/products/remera-crop-de-mujer-gris/Medidas1.png"
      },
      category: "Remeras Crop",
      color: "Gris Melange",
      available: true
    },
    {
      id: "remera-crop-amarillo",
      name: "Remera Crop Mujer - Amarillo",
      price: "$23.500",
      description: "Remera crop en amarillo vibrante. Color lleno de energía para destacar tu outfit.",
      images: {
        main: "/products/remera-crop-de-mujer-amarillo/mockups nuevos productos-7.png",
        lifestyle: ["/products/remera-crop-de-mujer-amarillo/crop-lifestyle.png", "/products/remera-crop-de-mujer-amarillo/crop-urban.png"],
        measurements: "/products/remera-crop-de-mujer-amarillo/Medidas1.png"
      },
      category: "Remeras Crop",
      color: "Amarillo",
      available: true
    },
    {
      id: "buzo-cuello-redondo-negro",
      name: "Buzo Cuello Redondo - Negro",
      price: "$43.000",
      description: "Buzo de cuello redondo estilo oversize en negro. Clásico y versátil, ideal para cualquier ocasión. Algodón premium.",
      images: {
        main: "/products/buzo-cuello-redondo-unisex-negro-estilo-oversize/mockups nuevos productos-8.png",
        lifestyle: ["/products/buzo-cuello-redondo-unisex-negro-estilo-oversize/Buzo_Cuello_Redondo_Negro_Mujer_Lifestyle.png"],
        measurements: "/products/buzo-cuello-redondo-unisex-negro-estilo-oversize/Medidas5.png"
      },
      category: "Buzos (Crewneck)",
      color: "Negro",
      available: true
    },
    {
      id: "remera-clasica-mujer-blanca",
      name: "Remera Clásica Mujer - Blanca",
      price: "$28.600",
      description: "Remera clásica de mujer en blanco. Corte femenino y cómodo. Algodón suave perfecto para uso diario.",
      images: {
        main: "/products/remera-clasica-woman-blanca/mockups nuevos productos-2.png",
        lifestyle: ["/products/remera-clasica-woman-blanca/Remera_Woman_Urban.jpeg"],
        measurements: "/products/remera-clasica-woman-blanca/Medidas2.png"
      },
      category: "Remeras Mujer",
      color: "Blanca",
      available: true
    },
    {
      id: "buzo-cuello-redondo-blanco",
      name: "Buzo Cuello Redondo - Blanco",
      price: "$43.000",
      description: "Buzo de cuello redondo estilo oversize en blanco. Lienzo puro para tu creatividad. Algodón de alta calidad y fit relajado.",
      images: {
        main: "/products/buzo-cuello-redondo-unisex-blanco-estilo-oversize/mockups nuevos productos-9.png",
        lifestyle: ["/products/buzo-cuello-redondo-unisex-blanco-estilo-oversize/Buzo_Cuello_Redondo_Blanco_Mujer_Lifestyle.png"],
        measurements: "/products/buzo-cuello-redondo-unisex-blanco-estilo-oversize/Medidas5.png"
      },
      category: "Buzos (Crewneck)",
      color: "Blanco",
      available: true
    },
    {
      id: "buzo-cuello-redondo-stone-wash",
      name: "Buzo Cuello Redondo - Stone Wash",
      price: "$43.000",
      description: "Buzo de cuello redondo con efecto Stone Wash. Estilo único y textura premium frizada. Oversize y super cómodo.",
      images: {
        main: "/products/buzo-cuello-redondo-unisex-stone-wash-friza-premium-estilo-oversize/mockups nuevos productos-10.png",
        lifestyle: ["/products/buzo-cuello-redondo-unisex-stone-wash-friza-premium-estilo-oversize/Buzo_Cuello_Redondo_Negro_Mujer_Lifestyle.png"],
        measurements: "/products/buzo-cuello-redondo-unisex-stone-wash-friza-premium-estilo-oversize/Medidas5.png"
      },
      category: "Buzos (Crewneck)",
      color: "Stone Wash",
      available: true
    },
    {
      id: "remera-clasica-mujer-negra",
      name: "Remera Clásica Mujer - Negra",
      price: "$28.600",
      description: "Remera clásica de mujer en negro. El básico indispensable en algodón de alta densidad. Corte favorecedor.",
      images: {
        main: "/products/remera-clasica-woman-negra/mockups nuevos productos-3.png",
        lifestyle: ["/products/remera-clasica-woman-negra/Remera_Woman_Urban.jpeg"],
        measurements: "/products/remera-clasica-woman-negra/Medidas2.png"
      },
      category: "Remeras Mujer",
      color: "Negra",
      available: true
    }
  ]

  // Agrupar productos por categoría
  const categories = ["Hoodies", "Buzos (Crewneck)", "T-Shirts", "Remeras Crop", "Musculosas", "Remeras Mujer", "Arte"]

  const groupedProducts = categories.map(category => ({
    name: category,
    items: products.filter(product => product.category === category)
  })).filter(group => group.items.length > 0)

  return (
    <div className="container mx-auto px-4 py-8">
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
                <div key={product.id} className="group">
                  <div className="border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    {/* Imagen principal clickeable - va a #generator-section */}
                    <Link href="/#generator-section" className="block" data-cta="products-page-image-click">
                      <div className="aspect-square relative overflow-hidden cursor-pointer">
                        <Image
                          src={product.images.main || "/placeholder.svg"}
                          alt={product.name}
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
                        <h2 className="text-xl font-semibold leading-tight">{product.name}</h2>
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
                </div>
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
