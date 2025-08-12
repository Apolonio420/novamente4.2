import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"

export default function MerchPage() {
  const brands = [
    {
      id: "falco",
      name: "FALCO",
      description: "Libertad. Identidad. Argentina que avanza.",
      fullDescription:
        "Marca nacida del espíritu de 'Las Tres Anclas', símbolo de una visión renovadora y de un presente que proyecta futuro.",
      image: "/falco/halcon-logo.png",
      productCount: 6,
      featured: true,
    },
    // Aquí se pueden agregar más marcas en el futuro
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="novamente-heading text-4xl md:text-5xl mb-4">MERCH</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
          Descubrí el merchandising oficial de tus marcas favoritas. Productos únicos, diseños exclusivos y la calidad
          que esperás, todo en un solo lugar.
        </p>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {brands.map((brand) => (
          <Link key={brand.id} href={`/merch/${brand.id}`} className="group">
            <div className="border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              {/* Brand Image */}
              <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-background to-secondary/30">
                <Image
                  src={brand.image || "/placeholder.svg"}
                  alt={`${brand.name} Logo`}
                  fill
                  className="object-contain p-8 group-hover:scale-110 transition-transform duration-300"
                />

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
                <p className="text-primary font-medium mb-2 text-sm uppercase tracking-wide">{brand.description}</p>

                {/* Descripción extendida */}
                <p className="text-muted-foreground mb-4 text-sm">{brand.fullDescription}</p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{brand.productCount} productos disponibles</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="group-hover:bg-primary group-hover:text-white transition-colors"
                  >
                    Ver catálogo
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Coming Soon Section */}
      <div className="text-center">
        <div className="bg-secondary/30 rounded-xl p-8">
          <h3 className="novamente-heading text-2xl mb-4">MÁS MARCAS PRÓXIMAMENTE</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Estamos trabajando para traerte el merchandising de más marcas increíbles. Mantente atento a las próximas
            incorporaciones a nuestra plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://www.instagram.com/novamente.ar/" target="_blank">
              <Button variant="outline">Seguinos para novedades</Button>
            </Link>
            <Link href="https://wa.me/message/DRWR3O2HZY2JG1" target="_blank">
              <Button>¿Querés vender tu merch?</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
