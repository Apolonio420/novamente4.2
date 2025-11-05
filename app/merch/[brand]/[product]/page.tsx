"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ShoppingCart, Heart, Star } from "lucide-react"
import { useCart } from "@/lib/cartStore"
import { useToast } from "@/hooks/use-toast"
import { notFound } from "next/navigation"

interface ProductPageProps {
  params: {
    brand: string
    product: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const [selectedColor, setSelectedColor] = useState("negro")
  const [selectedSize, setSelectedSize] = useState("M")
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { addItem } = useCart()
  const { toast } = useToast()

  // Por ahora solo tenemos FALCO
  if (params.brand !== "falco") {
    notFound()
  }

  // Base de datos de productos actualizada con los nuevos productos
  const products = {
    "hoodie-tres-anclas": {
      id: "hoodie-tres-anclas",
      name: 'Hoodie "Tres Anclas" Oversized',
      price: 65000,
      colors: [
        {
          name: "Negro",
          value: "negro",
          hex: "#000000",
          images: {
            front: "/falco/products/hoodie-tres-anclas-negro-front.png",
            back: "/falco/products/hoodie-tres-anclas-negro-back.png",
          },
        },
        {
          name: "Crema",
          value: "crema",
          hex: "#F5F5DC",
          images: {
            front: "/falco/products/hoodie-tres-anclas-crema-front.png",
            back: "/falco/products/hoodie-tres-anclas-crema-back.png",
          },
        },
        {
          name: "Caramel",
          value: "caramel",
          hex: "#D2691E",
          images: {
            front: "/falco/products/hoodie-tres-anclas-caramel-front.png",
            back: "/falco/products/hoodie-tres-anclas-caramel-back.png",
          },
        },
        {
          name: "Gris Melange",
          value: "gris-melange",
          hex: "#808080",
          images: {
            front: "/falco/products/hoodie-tres-anclas-gris-front.png",
            back: "/falco/products/hoodie-tres-anclas-gris-back.png",
          },
        },
      ],
      sizes: ["S", "M", "L", "XL"],
      category: "Hoodies",
      lifestyleImages: [
        "/falco/products/hoodie-tres-anclas-lifestyle-milei.jpeg",
        "/falco/products/hoodie-tres-anclas-medidas.png",
      ],
      description:
        'El Hoodie "Tres Anclas" Oversized representa la fuerza y los valores de FALCO: libertad, crecimiento y patriotismo. Confeccionado en algodón premium con el icónico diseño de las tres anclas en la espalda y el logo del halcón en el frente.',
      detailedDescription:
        "Este hoodie oversized es más que una prenda: es un símbolo de la nueva Argentina que avanza. Las tres anclas representan la unidad, la estabilidad y la fuerza, mientras que el halcón simboliza la libertad y la visión de futuro. Cada hoodie está confeccionado con materiales de primera calidad para garantizar durabilidad y comodidad.",
      features: [
        "Algodón 100% premium de 320gsm",
        "Corte oversized unisex",
        "Interior frisa suave y abrigada",
        'Diseño "Tres Anclas" bordado en la espalda',
        "Logo halcón FALCO bordado en el frente",
        "Capucha ajustable con cordones",
        "Bolsillo canguro amplio",
        "Costuras reforzadas para mayor durabilidad",
        "Puños y dobladillo en rib elástico",
      ],
      sizing: {
        S: "Largo: 73cm | Ancho: 68cm | Manga: 55cm",
        M: "Largo: 75.5cm | Ancho: 70cm | Manga: 56cm",
        L: "Largo: 78cm | Ancho: 72cm | Manga: 57cm",
        XL: "Largo: 80.5cm | Ancho: 84cm | Manga: 58cm",
      },
      brand: "FALCO",
      brandValues: "Libertad. Identidad. Argentina que avanza.",
    },
    "remera-oversize-tres-anclas": {
      id: "remera-oversize-tres-anclas",
      name: 'Remera "Tres Anclas" Oversized',
      price: 42000,
      colors: [
        {
          name: "Caramel",
          value: "caramel",
          hex: "#D2691E",
          images: {
            front: "/falco/products/remera-tres-anclas-caramel-front.png",
            back: "/falco/products/remera-tres-anclas-caramel-back.png",
          },
        },
        {
          name: "Negro",
          value: "negro",
          hex: "#000000",
          images: {
            front: "/falco/products/remera-tres-anclas-negro-front.png",
            back: "/falco/products/remera-tres-anclas-negro-back.png",
          },
        },
        {
          name: "Blanco",
          value: "blanco",
          hex: "#FFFFFF",
          images: {
            front: "/falco/products/remera-tres-anclas-blanco-front.png",
            back: "/falco/products/remera-tres-anclas-blanco-back.png",
          },
        },
      ],
      sizes: ["S", "M", "L", "XL"],
      category: "Remeras",
      lifestyleImages: ["/falco/products/remera-tres-anclas-medidas.png"],
      description:
        'La Remera "Tres Anclas" Oversized combina comodidad y simbolismo en una prenda versátil. Con el icónico diseño de las tres anclas en la espalda y el halcón FALCO en el frente, representa los valores fundamentales de unidad, estabilidad y libertad.',
      detailedDescription:
        "Esta remera oversized es perfecta para el uso diario, confeccionada en algodón premium que garantiza comodidad y durabilidad. El diseño minimalista del halcón en el frente se complementa con el poderoso símbolo de las tres anclas en la espalda, creando una prenda que trasciende la moda para convertirse en una declaración de principios.",
      features: [
        "Algodón 100% premium de 180gsm",
        "Corte oversized unisex",
        "Cuello redondo reforzado",
        'Diseño "Tres Anclas" estampado en la espalda',
        "Logo halcón FALCO estampado en el frente",
        "Costuras laterales para mejor ajuste",
        "Dobladillo y puños en rib",
        "Tacto suave y transpirable",
        "Resistente al lavado y uso frecuente",
      ],
      sizing: {
        S: "Pecho: 53cm | Largo: 70cm",
        M: "Pecho: 55cm | Largo: 73cm",
        L: "Pecho: 58cm | Largo: 75cm",
        XL: "Pecho: 60cm | Largo: 78cm",
      },
      brand: "FALCO",
      brandValues: "Libertad. Identidad. Argentina que avanza.",
    },
    "remera-classic-tres-anclas": {
      id: "remera-classic-tres-anclas",
      name: 'Remera "Tres Anclas" Corte Clásico',
      price: 38000,
      colors: [
        {
          name: "Negro",
          value: "negro",
          hex: "#000000",
          images: {
            front: "/falco/products/remera-classic-tres-anclas-negro-front.png",
            back: "/falco/products/remera-classic-tres-anclas-negro-back.png",
          },
        },
        {
          name: "Blanco",
          value: "blanco",
          hex: "#FFFFFF",
          images: {
            front: "/falco/products/remera-classic-tres-anclas-blanco-front.png",
            back: "/falco/products/remera-classic-tres-anclas-blanco-back.png",
          },
        },
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
      category: "Remeras",
      lifestyleImages: ["/falco/products/remera-classic-tres-anclas-medidas.png"],
      description:
        'La Remera "Tres Anclas" Corte Clásico representa la elegancia atemporal de FALCO. Con un diseño sobrio que combina el logo distintivo en el frente y las tres anclas en la espalda, simboliza lealtad, orden y libertad en un corte tradicional y versátil.',
      detailedDescription:
        "Esta remera de corte clásico está diseñada para quienes buscan un estilo más tradicional sin renunciar al simbolismo de FALCO. El corte regular y la calidad premium del algodón la convierten en una prenda perfecta para el uso diario, mientras que los diseños sutiles pero significativos la distinguen como una pieza de identidad y valores.",
      features: [
        "Algodón 100% premium de 180gsm",
        "Corte clásico regular fit",
        "Cuello redondo reforzado",
        'Diseño "Tres Anclas" estampado en la espalda',
        "Logo FALCO estampado en el pecho",
        "Costuras laterales para mejor ajuste",
        "Dobladillo y puños en rib",
        "Tacto suave y transpirable",
        "Diseño atemporal y versátil",
      ],
      sizing: {
        S: "Largo: 63cm | Ancho: 48cm",
        M: "Largo: 68cm | Ancho: 52cm",
        L: "Largo: 72cm | Ancho: 56cm",
        XL: "Largo: 75cm | Ancho: 58cm",
        XXL: "Largo: 77cm | Ancho: 60cm",
      },
      brand: "FALCO",
      brandValues: "Libertad. Identidad. Argentina que avanza.",
    },
    "remera-emision-falco": {
      id: "remera-emision-falco",
      name: 'Remera "Emisión" FALCO',
      price: 37000,
      colors: [
        {
          name: "Blanco",
          value: "blanco",
          hex: "#FFFFFF",
          images: {
            front: "/falco/products/remera-emision-blanco-front.png",
            back: "/placeholder.svg?height=600&width=600&text=Emisión+Blanco+Back&bg=hsl(0,0%,95%)",
          },
        },
        {
          name: "Negro",
          value: "negro",
          hex: "#000000",
          images: {
            front: "/falco/products/remera-emision-negro-front.png",
            back: "/placeholder.svg?height=600&width=600&text=Emisión+Negro+Back&bg=hsl(0,0%,15%)",
          },
        },
      ],
      sizes: ["S", "M", "L", "XL"],
      category: "Remeras",
      lifestyleImages: [],
      description:
        'La Remera "Emisión" presenta un diseño tipográfico disruptivo con la fórmula matemática de expansión monetaria. Combina estilo callejero con conciencia política, ideal para quienes buscan una estética irónica y provocativa.',
      detailedDescription:
        'Esta remera oversize lleva estampada la fórmula "Emisión = iPR + CR - [SP + %ROx(k+i)]", representando el concepto económico de expansión monetaria con una impronta irónica. El diseño tipográfico central se complementa con el pequeño halcón FALCO en el pecho, creando una prenda que fusiona conciencia económica con identidad patriótica.',
      features: [
        "Algodón 100% premium de 180gsm",
        "Corte oversized unisex",
        "Cuello redondo reforzado",
        'Estampa tipográfica "EMISIÓN" central',
        "Fórmula económica matemática estampada",
        "Logo halcón FALCO pequeño en el pecho",
        "Diseño conceptual y disruptivo",
        "Tacto suave y transpirable",
        "Mensaje político-económico sutil",
      ],
      sizing: {
        S: "Pecho: 53cm | Largo: 70cm",
        M: "Pecho: 55cm | Largo: 73cm",
        L: "Pecho: 58cm | Largo: 75cm",
        XL: "Pecho: 60cm | Largo: 78cm",
      },
      brand: "FALCO",
      brandValues: "Libertad. Identidad. Argentina que avanza.",
    },
    "remera-classic-falco": {
      id: "remera-classic-falco",
      name: 'Remera Classic "FALCO"',
      price: 33000,
      colors: [
        {
          name: "Blanco",
          value: "blanco",
          hex: "#FFFFFF",
          images: {
            front: "/falco/products/remera-falco-blanco-front.png",
            back: "/placeholder.svg?height=600&width=600&text=FALCO+Blanco+Back&bg=hsl(0,0%,95%)",
          },
        },
        {
          name: "Negro",
          value: "negro",
          hex: "#000000",
          images: {
            front: "/falco/products/remera-falco-negro-front.png",
            back: "/placeholder.svg?height=600&width=600&text=FALCO+Negro+Back&bg=hsl(0,0%,15%)",
          },
        },
      ],
      sizes: ["S", "M", "L", "XL"],
      category: "Remeras",
      lifestyleImages: [
        "/falco/products/remera-falco-lifestyle-blanco-1.png",
        "/falco/products/remera-falco-lifestyle-blanco-2.png",
        "/falco/products/remera-falco-lifestyle-negro.png",
      ],
      description:
        "La Remera Classic FALCO presenta el diseño más puro de la marca: el logo del halcón centrado en el pecho. Ideal para quienes buscan un look limpio, urbano y patriótico con estilo minimalista e identidad fuerte.",
      detailedDescription:
        "Esta remera de corte clásico representa la esencia minimalista de FALCO. Con el logo del halcón perfectamente centrado en el pecho, transmite los valores de libertad y visión de futuro de manera sutil pero poderosa. Su diseño limpio la convierte en una pieza versátil que se adapta a cualquier ocasión, desde el uso casual hasta eventos más formales.",
      features: [
        "Algodón 100% premium de 180gsm",
        "Corte clásico regular fit",
        "Cuello redondo reforzado",
        "Logo halcón FALCO centrado en el pecho",
        "Diseño minimalista y atemporal",
        "Costuras laterales para mejor ajuste",
        "Dobladillo y puños en rib",
        "Tacto suave y transpirable",
        "Versatilidad para uso diario",
      ],
      sizing: {
        S: "Pecho: 50cm | Largo: 68cm",
        M: "Pecho: 52cm | Largo: 70cm",
        L: "Pecho: 55cm | Largo: 72cm",
        XL: "Pecho: 58cm | Largo: 74cm",
      },
      brand: "FALCO",
      brandValues: "Libertad. Identidad. Argentina que avanza.",
    },
    "gorra-falco": {
      id: "gorra-falco",
      name: "Gorra FALCO",
      price: 35000,
      colors: [
        {
          name: "Negro",
          value: "negro",
          hex: "#000000",
          images: {
            front: "/falco/products/gorra-falco-frontal.png",
            back: "/falco/products/gorra-falco-lateral.png",
          },
        },
      ],
      sizes: ["Talle único"],
      category: "Accesorios",
      lifestyleImages: [],
      description:
        "La Gorra FALCO combina estilo urbano con inspiración patriótica. Confeccionada en gabardina premium con bordado del icónico halcón en la parte frontal, representa libertad y visión de futuro en un diseño sobrio y versátil.",
      detailedDescription:
        "Esta gorra de 6 paneles está diseñada para completar cualquier conjunto del catálogo FALCO. El bordado del halcón en hilo blanco sobre fondo negro crea un contraste elegante y distintivo. Su construcción premium y cierre ajustable la convierten en el accesorio perfecto para quienes buscan calidad y simbolismo en cada detalle.",
      features: [
        "Gabardina 100% algodón premium",
        "Construcción de 6 paneles estructurados",
        "Bordado del halcón FALCO en hilo blanco",
        "Visera pre-curvada para protección solar",
        "Cierre ajustable con hebilla metálica",
        "Banda interior absorbente",
        "Ojales de ventilación bordados",
        "Diseño unisex versátil",
        "Resistente al uso diario",
      ],
      sizing: {
        "Talle único": "Circunferencia: 56-62cm ajustable | Visera: 7.5cm",
      },
      brand: "FALCO",
      brandValues: "Libertad. Identidad. Argentina que avanza.",
    },
  }

  const product = products[params.product as keyof typeof products]

  if (!product) {
    notFound()
  }

  const selectedColorData = product.colors.find((c) => c.value === selectedColor) || product.colors[0]

  // Para productos con lifestyle images, incluirlas en la galería
  const galleryImages = [selectedColorData.images.front, selectedColorData.images.back, ...product.lifestyleImages]

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) {
      toast({
        title: "Selección incompleta",
        description: "Por favor selecciona color y talle antes de agregar al carrito",
        variant: "destructive",
      })
      return
    }

    addItem({
      id: `${product.id}-${selectedColor}-${selectedSize}-${Date.now()}`,
      name: `${product.name} - ${product.brand}`,
      garmentType: product.category,
      color: selectedColorData.name,
      size: selectedSize,
      price: product.price,
      quantity: quantity,
      imageUrl: selectedColorData.images.front,
      brand: product.brand,
    })

    toast({
      title: "Producto agregado",
      description: `${product.name} agregado al carrito`,
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href={`/merch/${params.brand}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a {product.brand}
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-50">
            <Image
              src={galleryImages[currentImageIndex] || "/placeholder.svg"}
              alt={`${product.name} - ${selectedColorData.name}`}
              fill
              className="object-cover"
            />

            {/* Image Navigation */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {galleryImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentImageIndex === index ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          <div className="grid grid-cols-4 gap-2">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className={`aspect-square relative rounded-md overflow-hidden cursor-pointer transition-all ${
                  currentImageIndex === index ? "ring-2 ring-primary" : "hover:opacity-80"
                }`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${product.name} vista ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-medium">
                {product.brand}
              </Badge>
              <Badge variant="secondary">{product.category}</Badge>
              <div className="flex items-center gap-1 ml-auto">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-muted-foreground ml-1">(4.9)</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-sm text-primary font-medium uppercase tracking-wide mb-3">{product.brandValues}</p>
            <p className="text-3xl font-bold text-primary">{formatPrice(product.price)}</p>
          </div>

          {/* Description */}
          <div>
            <p className="text-muted-foreground leading-relaxed mb-4">{product.description}</p>
            <p className="text-sm leading-relaxed">{product.detailedDescription}</p>
          </div>

          {/* Color Selection */}
          <div>
            <h3 className="font-semibold mb-3">Color: {selectedColorData.name}</h3>
            <RadioGroup value={selectedColor} onValueChange={setSelectedColor} className="flex flex-wrap gap-3">
              {product.colors.map((color) => (
                <div key={color.value}>
                  <RadioGroupItem value={color.value} id={`color-${color.value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`color-${color.value}`}
                    className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                  >
                    <div
                      className="w-6 h-6 rounded-full border border-muted-foreground"
                      style={{ backgroundColor: color.hex }}
                    ></div>
                    <span className="text-sm font-medium">{color.name}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Size Selection */}
          <div>
            <h3 className="font-semibold mb-3">Talle: {selectedSize}</h3>
            <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex flex-wrap gap-3">
              {product.sizes.map((size) => (
                <div key={size}>
                  <RadioGroupItem value={size} id={`size-${size}`} className="peer sr-only" />
                  <Label
                    htmlFor={`size-${size}`}
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer min-w-[60px] transition-all"
                  >
                    <span className="text-sm font-medium">{size}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Quantity */}
          <div>
            <h3 className="font-semibold mb-3">Cantidad:</h3>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                +
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={handleAddToCart} className="w-full" size="lg" disabled={!selectedColor || !selectedSize}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Agregar al carrito - {formatPrice(product.price * quantity)}
            </Button>

            <Button variant="outline" className="w-full" size="lg">
              <Heart className="mr-2 h-4 w-4" />
              Agregar a favoritos
            </Button>
          </div>

          {/* Product Details Tabs */}
          <Tabs defaultValue="features" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="features">Características</TabsTrigger>
              <TabsTrigger value="sizing">Medidas</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="mt-4">
              <div className="space-y-2">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sizing" className="mt-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  {product.id === "gorra-falco" ? "Especificaciones técnicas" : "Medidas en centímetros (cm)"}
                </p>
                {Object.entries(product.sizing).map(([size, measurements]) => (
                  <div key={size} className="flex justify-between items-center py-2 border-b border-muted">
                    <span className="font-medium">{size}</span>
                    <span className="text-sm text-muted-foreground">{measurements}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Additional Info */}
          <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
            <p>• Envío gratis en compras superiores a $80.000</p>
            <p>• Cambios y devoluciones hasta 30 días</p>
            <p>• Producto oficial de {product.brand}</p>
            <p>• Confeccionado en Argentina con materiales premium</p>
          </div>
        </div>
      </div>

      {/* Brand Story Section */}
      <div className="mt-16 bg-secondary/20 rounded-xl p-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              {product.id === "remera-emision-falco"
                ? "Conciencia Económica y Estilo"
                : product.id === "remera-classic-falco"
                  ? "Minimalismo con Identidad"
                  : "El Símbolo de una Nueva Argentina"}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {product.id === "remera-emision-falco"
                ? 'La Remera "Emisión" fusiona conciencia política con estética urbana. Su fórmula matemática no es solo diseño: es una declaración sobre la realidad económica argentina, presentada con la ironía y el estilo que caracterizan a la nueva generación.'
                : product.id === "remera-classic-falco"
                  ? "La Remera Classic FALCO representa la esencia pura de la marca: libertad expresada a través del minimalismo. El halcón centrado simboliza la visión clara y directa hacia el futuro próspero de Argentina."
                  : product.id === "gorra-falco"
                    ? "La Gorra FALCO lleva el símbolo del halcón, representando la libertad y la visión de futuro que caracterizan a la nueva Argentina. Un accesorio que completa tu estilo con significado profundo."
                    : 'Las "Tres Anclas" no son solo un diseño: representan la unidad, la estabilidad y la fuerza de una Argentina que avanza hacia la prosperidad. Cada prenda lleva consigo los valores de libertad, crecimiento y patriotismo que definen a FALCO.'}
            </p>
            <p className="text-sm text-muted-foreground">
              {product.id === "remera-emision-falco"
                ? "Ideal para quienes combinan estilo callejero con pensamiento crítico, llevando sus convicciones económicas con orgullo y estilo."
                : product.id === "remera-classic-falco"
                  ? "Perfecta para quienes buscan elegancia sin ostentación, transmitiendo valores patrióticos con sofisticación urbana."
                  : product.id === "gorra-falco"
                    ? "Diseñada para quienes buscan un accesorio versátil que refleje sus valores y complete cualquier conjunto con elegancia urbana."
                    : product.id === "remera-classic-tres-anclas"
                      ? "La versión clásica mantiene la elegancia atemporal, perfecta para quienes buscan un estilo sobrio pero con significado profundo."
                      : "Usado por líderes y ciudadanos que creen en el futuro del país, esta prenda es más que ropa: es una declaración de principios."}
            </p>
          </div>
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src={
                product.id === "remera-emision-falco"
                  ? "/falco/products/remera-emision-blanco-front.png"
                  : product.id === "remera-classic-falco"
                    ? "/falco/products/remera-falco-lifestyle-blanco-1.png"
                    : product.id === "gorra-falco"
                      ? "/falco/products/gorra-falco-frontal.png"
                      : product.id === "remera-classic-tres-anclas"
                        ? "/falco/products/remera-classic-tres-anclas-negro-front.png"
                        : "/falco/products/hoodie-tres-anclas-lifestyle-milei.jpeg"
              }
              alt={`${product.name} - Lifestyle`}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
