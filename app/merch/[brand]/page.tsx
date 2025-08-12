import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

interface BrandPageProps {
  params: {
    brand: string
  }
}

export default function BrandPage({ params }: BrandPageProps) {
  // Por ahora solo tenemos FALCO
  if (params.brand !== "falco") {
    notFound()
  }

  const brandInfo = {
    id: "falco",
    name: "FALCO",
    slogan: "Libertad. Identidad. Argentina que avanza.",
    description:
      "FALCO es una marca nacida del espíritu de uno de los integrantes de 'Las Tres Anclas', un grupo emblemático que representa una nueva etapa para Argentina: la del renacer económico, la libertad individual y el crecimiento sostenido.",
    values:
      "Su identidad refleja valores como la lealtad, el patriotismo y la prosperidad, alineados con un momento histórico marcado por el cambio de rumbo del país: equilibrio fiscal, baja de la inflación y desarrollo real.",
    mission: "FALCO no es solo ropa: es símbolo de una visión renovadora y de un presente que proyecta futuro.",
    logo: "/falco/halcon-negro.png",
    banner: "/falco/anclas-watermark.png",
  }

  const products = [
    {
      id: "hoodie-tres-anclas",
      name: 'Hoodie "Tres Anclas" Oversized',
      price: "$65.000",
      colors: ["Crema", "Negro", "Caramel", "Gris Melange"],
      sizes: ["S", "M", "L", "XL"],
      category: "Hoodies",
      image: "/falco/products/hoodie-tres-anclas-negro-front.png",
      description:
        'Hoodie oversize con el icónico diseño "Tres Anclas" de FALCO. Símbolo de unidad, fuerza y prosperidad.',
      featured: true,
    },
    {
      id: "remera-oversize-tres-anclas",
      name: 'Remera "Tres Anclas" Oversized',
      price: "$42.000",
      colors: ["Caramel", "Negro", "Blanco"],
      sizes: ["S", "M", "L", "XL"],
      category: "Remeras",
      image: "/falco/products/remera-tres-anclas-caramel-front.png",
      description:
        'Remera oversize con el icónico diseño "Tres Anclas" de FALCO. Símbolo de unidad, fuerza y prosperidad.',
      featured: false,
    },
    {
      id: "remera-classic-tres-anclas",
      name: 'Remera "Tres Anclas" Corte Clásico',
      price: "$38.000",
      colors: ["Negro", "Blanco"],
      sizes: ["S", "M", "L", "XL", "XXL"],
      category: "Remeras",
      image: "/falco/products/remera-classic-tres-anclas-negro-front.png",
      description: 'Remera de corte clásico con el diseño "Tres Anclas". Elegancia y patriotismo en cada detalle.',
      featured: false,
    },
    {
      id: "remera-emision-falco",
      name: 'Remera "Emisión" FALCO',
      price: "$37.000",
      colors: ["Blanco", "Negro"],
      sizes: ["S", "M", "L", "XL"],
      category: "Remeras",
      image: "/falco/products/remera-emision-blanco-front.png",
      description:
        'Diseño tipográfico "EMISIÓN" con fórmula económica. Estilo callejero con conciencia política y estética disruptiva.',
      featured: false,
    },
    {
      id: "remera-classic-falco",
      name: 'Remera Classic "FALCO"',
      price: "$33.000",
      colors: ["Blanco", "Negro"],
      sizes: ["S", "M", "L", "XL"],
      category: "Remeras",
      image: "/falco/products/remera-falco-blanco-front.png",
      description: "Diseño clásico con logo FALCO centrado. Look limpio, urbano y patriótico con identidad fuerte.",
      featured: false,
    },
    {
      id: "gorra-falco",
      name: "Gorra FALCO",
      price: "$35.000",
      colors: ["Negro"],
      sizes: ["Talle único"],
      category: "Accesorios",
      image: "/falco/products/gorra-falco-frontal.png",
      description:
        "Gorra urbana con bordado del halcón FALCO. Diseño sobrio y versátil, ideal para completar cualquier conjunto.",
      featured: false,
    },
  ]

  const categories = ["Todos", "Hoodies", "Remeras", "Accesorios"]

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
        <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
          {/* Fondo con anclas sutiles */}
          <div className="absolute inset-0 opacity-10">
            <Image src="/falco/anclas-watermark.png" alt="FALCO Background" fill className="object-contain" />
          </div>

          {/* León como elemento decorativo */}
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2 opacity-20">
            <Image src="/falco/leon-tribal.png" alt="FALCO León" width={200} height={200} className="object-contain" />
          </div>

          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="flex items-center justify-center mb-4">
                <Image
                  src="/falco/halcon-negro.png"
                  alt="FALCO Logo"
                  width={80}
                  height={80}
                  className="object-contain filter invert"
                />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-wider mb-2">{brandInfo.name}</h1>
              <p className="text-lg md:text-xl opacity-90 font-medium tracking-wide">{brandInfo.slogan}</p>
            </div>
          </div>
        </div>

        {/* Brand Story */}
        <div className="bg-secondary/20 rounded-xl p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">La Historia de FALCO</h2>
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
            <Link key={product.id} href={`/merch/${params.brand}/${product.id}`} className="group">
              <div className="border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300">
                {/* Product Image */}
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Featured Badge */}
                  {product.featured && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-primary text-white">Destacado</Badge>
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                      {product.category}
                    </Badge>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold leading-tight">{product.name}</h3>
                    <span className="text-xl font-bold text-primary ml-4">{product.price}</span>
                  </div>

                  <p className="text-muted-foreground mb-4 text-sm">{product.description}</p>

                  {/* Colors */}
                  <div className="mb-3">
                    <span className="text-sm text-muted-foreground">
                      Colores: <span className="font-medium">{product.colors.join(", ")}</span>
                    </span>
                  </div>

                  {/* Sizes */}
                  <div className="mb-4">
                    <span className="text-sm text-muted-foreground">
                      Talles: <span className="font-medium">{product.sizes.join(", ")}</span>
                    </span>
                  </div>

                  <Button className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                    Ver producto
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Brand Values Footer */}
      <div className="mt-16 text-center">
        <div className="bg-secondary/30 rounded-xl p-8 relative overflow-hidden">
          {/* Fondo decorativo sutil */}
          <div className="absolute inset-0 opacity-5">
            <Image src="/falco/tres-anclas.png" alt="FALCO Anclas" fill className="object-contain" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/falco/halcon-logo.png"
                alt={`${brandInfo.name} Logo`}
                width={100}
                height={100}
                className="object-contain"
              />
            </div>
            <h3 className="text-2xl font-bold mb-2">{brandInfo.name}</h3>
            <p className="text-primary font-medium mb-4 uppercase tracking-wide">{brandInfo.slogan}</p>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Cada producto de FALCO está confeccionado con materiales de primera calidad y diseños que reflejan los
              valores de lealtad, patriotismo y prosperidad. Más que ropa, es un símbolo de la Argentina que avanza
              hacia un futuro próspero.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline">Seguir a {brandInfo.name}</Button>
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
