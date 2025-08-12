import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, Sparkles } from "lucide-react"

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
      price: "$37.000",
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
      price: "$37.000",
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
      price: "$37.000",
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
      price: "$33.000",
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
      id: "aldea-tshirt-blanco",
      name: "Aldea Classic Fit T-Shirt - Blanco",
      price: "$33.000",
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
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="novamente-heading text-4xl md:text-5xl mb-4">CATÁLOGO DE PRODUCTOS</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
          Descubrí nuestra colección de prendas premium. Cada producto está diseñado para ser el canvas perfecto para
          tus creaciones con IA. Calidad superior, fit moderno y la base ideal para tu estilo único.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product, index) => (
          <div key={product.id} className="group">
            <div className="border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300">
              {/* Imagen principal clickeable - va a /design */}
              <Link href="/design" className="block">
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

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold leading-tight">{product.name}</h2>
                  <span className="text-2xl font-bold text-primary ml-4">{product.price}</span>
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{product.description}</p>

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
                        <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={product.images.measurements || "/placeholder.svg"}
                            alt={`${product.name} - ${product.category === "Arte" ? "Detalles de tamaños" : "Tabla de medidas"}`}
                            fill
                            sizes="300px"
                            quality={85}
                            className="object-contain p-2"
                          />
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                )}

                {/* Botón personalizar mejorado - va a /design */}
                <div className="flex gap-2">
                  {product.available ? (
                    <Link href="/design" className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium rounded-xl py-3 px-6 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Personalizar Ahora
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full rounded-xl py-3">
                      Próximamente
                    </Button>
                  )}
                </div>
              </div>
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
              <Button variant="outline" className="rounded-xl bg-transparent">
                Seguinos en Instagram
              </Button>
            </Link>
            <Link href="https://wa.me/message/DRWR3O2HZY2JG1" target="_blank">
              <Button className="rounded-xl">Consultá por WhatsApp</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
