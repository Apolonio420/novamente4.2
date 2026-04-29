"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ShoppingCart, Star, Zap } from "lucide-react"
import { useCart } from "@/lib/cartStore"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import * as fpixel from "@/lib/fpixel"
import { trackViewItem } from "@/lib/analytics"
import type { Product } from "@/src/data/partners"

interface PartnerInfo {
  id: string
  name: string
  description: string
  mission: string
  banner: string
}

interface ProductDetailProps {
  product: Product
  partner: PartnerInfo
  brandSlug: string
}

export function ProductDetail({ product, partner, brandSlug }: ProductDetailProps) {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.value ?? "")
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "")
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { addItem } = useCart()
  const { toast } = useToast()
  const router = useRouter()
  const viewContentFiredRef = useRef(false)

  useEffect(() => {
    if (viewContentFiredRef.current) return
    viewContentFiredRef.current = true
    fpixel.event("ViewContent", {
      content_ids: [product.id],
      content_name: `${product.name} - ${product.brand}`,
      content_type: "product",
      content_category: product.category,
      value: product.price,
      currency: "ARS",
    })
    trackViewItem({
      item_id: product.id,
      item_name: `${product.name} - ${product.brand}`,
      item_category: product.category,
      price: product.price,
      quantity: 1,
    })
  }, [product.id, product.name, product.brand, product.category, product.price])

  const selectedColorData = product.colors.find((c) => c.value === selectedColor) || product.colors[0]

  // Separate sizing/medidas images from lifestyle images
  const isSizingImage = (src: string) => {
    const lower = src.toLowerCase()
    return lower.includes("talles") || lower.includes("medida")
  }

  // Gallery: front+back of selected color → close-up → lifestyle (no sizing, max 2) → other colors
  const lifestyleOnly = product.lifestyleImages.filter((src) => !isSizingImage(src))
  const galleryImages = [
    selectedColorData?.images.front,
    selectedColorData?.images.back,
    ...(product.closeUp ? [product.closeUp] : []),
    ...lifestyleOnly.slice(0, 2),
    ...product.colors
      .filter((c) => c.value !== selectedColor)
      .flatMap((c) => [c.images.front, c.images.back]),
  ].filter(Boolean)

  // Sizing images — shown in measurements tab
  const sizingImages = product.lifestyleImages.filter(isSizingImage)

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
      color: selectedColorData?.name || '',
      size: selectedSize,
      price: product.price,
      quantity: quantity,
      image: selectedColorData?.images.front || '',
    })

    toast({
      title: "Producto agregado",
      description: `${product.name} agregado al carrito`,
    })
  }

  const handleBuyNow = () => {
    if (!selectedColor || !selectedSize) {
      toast({
        title: "Selección incompleta",
        description: "Por favor selecciona color y talle antes de comprar",
        variant: "destructive",
      })
      return
    }

    addItem({
      id: `${product.id}-${selectedColor}-${selectedSize}-${Date.now()}`,
      name: `${product.name} - ${product.brand}`,
      garmentType: product.category,
      color: selectedColorData?.name || '',
      size: selectedSize,
      price: product.price,
      quantity: quantity,
      image: selectedColorData?.images.front || '',
    })

    toast({
      title: "Producto agregado",
      description: `${product.name} agregado al carrito`,
    })

    router.push("/checkout")
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
        <Link href={`/merch/${brandSlug}`}>
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
              alt={`${product.name} - ${selectedColorData?.name || ''}`}
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
                    className={`w-2 h-2 rounded-full transition-colors ${currentImageIndex === index ? "bg-white" : "bg-white/50"
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
                className={`aspect-square relative rounded-md overflow-hidden cursor-pointer transition-all ${currentImageIndex === index ? "ring-2 ring-primary" : "hover:opacity-80"
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
            <h3 className="font-semibold mb-3">Color: {selectedColorData?.name || ''}</h3>
            <RadioGroup value={selectedColor} onValueChange={(val) => { setSelectedColor(val); setCurrentImageIndex(0) }} className="flex flex-wrap gap-3">
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

            <Button onClick={handleBuyNow} variant="outline" className="w-full" size="lg" disabled={!selectedColor || !selectedSize}>
              <Zap className="mr-2 h-4 w-4" />
              Comprar ahora
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
                {sizingImages.length > 0 ? (
                  sizingImages.map((src, i) => (
                    <div key={i} className="relative w-full rounded-lg overflow-hidden">
                      <Image src={src} alt={`Guía de talles ${i + 1}`} width={600} height={400} className="w-full h-auto object-contain" />
                    </div>
                  ))
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {product.sizes.includes("Talle único") ? "Especificaciones técnicas" : "Medidas en centímetros (cm)"}
                    </p>
                    {Object.entries(product.sizing).map(([size, measurements]) => (
                      <div key={size} className="flex justify-between items-center py-2 border-b border-muted">
                        <span className="font-medium">{size}</span>
                        <span className="text-sm text-muted-foreground">{measurements}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Additional Info */}
          <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
            <p>• Envío gratis en compras superiores a $100.000</p>
            <p>• Producto oficial de {product.brand}</p>
            <p>• Confeccionado en Argentina con materiales premium</p>
          </div>
        </div>
      </div>

      {/* Brand Story Section */}
      <div className="mt-16 bg-secondary/20 rounded-xl p-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">{partner.name}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{partner.description}</p>
            <p className="text-sm text-muted-foreground">{partner.mission}</p>
          </div>
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src={
                lifestyleOnly[0] ||
                partner.banner ||
                "/placeholder.svg"
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
