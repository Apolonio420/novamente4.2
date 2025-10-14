"use client"

import { useCart } from "@/lib/cartStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart()
  const { toast } = useToast()
  const router = useRouter()
  const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id || null)
  const selectedItem = useMemo(() => items.find(i => i.id === selectedItemId) || items[0], [items, selectedItemId])
  
  // Estados para el modal de zoom
  const [showZoomModal, setShowZoomModal] = useState(false)
  const [zoomImageUrl, setZoomImageUrl] = useState("")
  const [zoomImageAlt, setZoomImageAlt] = useState("")

  const normalizeSrc = (src?: string) => {
    if (!src) return "/placeholder.svg"
    // Si es una URL de R2 con fecha expirada, usar placeholder
    if (src.includes("X-Amz-Date") && src.includes("20250929")) {
      return "/placeholder.svg"
    }
    if (src.startsWith("http") || src.startsWith("/")) return src
    return "/placeholder.svg"
  }

  const previewImages = useMemo(() => {
    if (!selectedItem) return []
    
    console.log("🛒 Cart - selectedItem:", {
      frontMockup: selectedItem.frontMockup,
      backMockup: selectedItem.backMockup,
      frontDesign: selectedItem.frontDesign,
      backDesign: selectedItem.backDesign,
      image: selectedItem.image
    })
    
    // Priorizar mockups sobre diseños
    const mockups = [selectedItem.frontMockup, selectedItem.backMockup].filter(Boolean)
    const designs = [selectedItem.frontDesign, selectedItem.backDesign].filter(Boolean)
    
    console.log("🛒 Cart - mockups y designs:", { mockups, designs })
    
    // Si hay mockups, mostrarlos primero
    if (mockups.length > 0) {
      const result = [...mockups, ...designs].map((s) => normalizeSrc(s as string))
      console.log("🛒 Cart - previewImages (con mockups):", result)
      return result
    }
    
    // Si no hay mockups, mostrar diseños
    const result = designs.map((s) => normalizeSrc(s as string))
    console.log("🛒 Cart - previewImages (solo diseños):", result)
    return result
  }, [selectedItem])
  
  const [activePreviewIdx, setActivePreviewIdx] = useState(0)
  const activePreview = previewImages[activePreviewIdx] || normalizeSrc(selectedItem?.image)
  const isApiSrc = activePreview.startsWith('/api/')

  // Función para abrir el modal de zoom
  const openZoomModal = (imageUrl: string, alt: string) => {
    setZoomImageUrl(imageUrl)
    setZoomImageAlt(alt)
    setShowZoomModal(true)
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos antes de proceder al checkout",
        variant: "destructive",
      })
      return
    }

    console.log("🛒 Redirecting to checkout page...")
    // Redirigir a la página de checkout
    try {
      router.push('/checkout')
    } catch (error) {
      console.error("Router error, using window.location:", error)
      window.location.href = '/checkout'
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-4">Tu carrito está vacío</h1>
          <p className="text-muted-foreground mb-8">¡Agrega algunos productos increíbles para comenzar!</p>
          <Link href="/design">
            <Button size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continuar Diseñando
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Carrito de Compras</h1>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {getTotalItems()} {getTotalItems() === 1 ? "producto" : "productos"}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Visor grande */}
        <div className="lg:col-span-2 space-y-4">
          {selectedItem && (
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col">
                  <div 
                    className="relative w-full h-80 bg-black/5 rounded-xl overflow-hidden cursor-pointer hover:bg-black/10 transition-colors group"
                    onDoubleClick={() => openZoomModal(activePreview, selectedItem.name)}
                    title="Doble click para hacer zoom"
                  >
                    {selectedItem.isGeneratingMockups && !activePreview.includes('mockup') ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                          <p className="text-sm text-muted-foreground">Generando mockup...</p>
                        </div>
                      </div>
                    ) : (
                      <Image 
                        src={activePreview} 
                        alt={selectedItem.name} 
                        fill 
                        sizes="(min-width:1024px) 50vw, 100vw" 
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg"
                        }}
                        unoptimized={isApiSrc}
                      />
                    )}
                    {/* Leyenda de zoom */}
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      Doble click para zoom
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {previewImages.map((src, idx) => {
                      const isActive = idx === activePreviewIdx
                      const label = selectedItem?.frontMockup && idx === 0 ? 'Mockup Frontal' :
                                   selectedItem?.backMockup && idx === (selectedItem?.frontMockup ? 1 : 0) ? 'Mockup Trasero' :
                                   selectedItem?.frontDesign && idx === (selectedItem?.frontMockup && selectedItem?.backMockup ? 2 : selectedItem?.frontMockup ? 1 : 0) ? 'Diseño Frontal' :
                                   'Diseño Trasero'
                      
                      return (
                        <button
                          key={src + idx}
                          className={`relative h-16 w-16 rounded overflow-hidden border-2 ${isActive ? 'border-primary' : 'border-gray-200'} cursor-pointer hover:border-primary/50 transition-colors`}
                          onClick={() => setActivePreviewIdx(idx)}
                          onDoubleClick={() => openZoomModal(src, label)}
                          title={`${label} - Doble click para zoom`}
                        >
                          <Image 
                            src={src} 
                            alt={label} 
                            fill 
                            sizes="64px" 
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
                            unoptimized={src.startsWith('/api/')}
                          />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de productos */}
          <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} onClick={() => setSelectedItemId(item.id)} className={selectedItem?.id === item.id ? 'ring-1 ring-primary/40' : ''}>
              <CardContent className="p-6 cursor-pointer">
                <div className="flex gap-4">
                  {/* Imagen del producto - priorizar mockup */}
                  <div 
                    className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:bg-gray-200 transition-colors"
                    onDoubleClick={() => openZoomModal(
                      normalizeSrc(item.frontMockup) || normalizeSrc(item.backMockup) || normalizeSrc(item.image), 
                      item.name
                    )}
                    title="Doble click para hacer zoom"
                  >
                    {item.isGeneratingMockups && !item.frontMockup && !item.backMockup ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Image 
                        src={normalizeSrc(item.frontMockup) || normalizeSrc(item.backMockup) || normalizeSrc(item.image)} 
                        alt={item.name} 
                        fill 
                        sizes="96px" 
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg"
                        }}
                        unoptimized={(normalizeSrc(item.frontMockup) || normalizeSrc(item.backMockup) || normalizeSrc(item.image)).startsWith('/api/')}
                      />
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-2 truncate">{item.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline">Color: {item.color}</Badge>
                      <Badge variant="outline">Talle: {item.size}</Badge>
                      {item.garmentType && <Badge variant="outline">{item.garmentType}</Badge>}
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Precio y eliminar */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">{formatCurrency(item.price * item.quantity)}</div>
                          {item.quantity > 1 && (
                            <div className="text-sm text-muted-foreground">{formatCurrency(item.price)} c/u</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                    {/* Mockups preview dinámico */}
                    {(item.frontMockup || item.backMockup) && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {item.frontMockup && (
                          <div className="relative w-full h-20 bg-gray-100 rounded overflow-hidden">
                            <Image 
                              src={normalizeSrc(item.frontMockup)} 
                              alt="Mockup frontal" 
                              fill 
                              sizes="160px" 
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg"
                              }}
                              unoptimized={normalizeSrc(item.frontMockup).startsWith('/api/')}
                            />
                          </div>
                        )}
                        {item.backMockup && (
                          <div className="relative w-full h-20 bg-gray-100 rounded overflow-hidden">
                            <Image 
                              src={normalizeSrc(item.backMockup)} 
                              alt="Mockup trasero" 
                              fill 
                              sizes="160px" 
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg"
                              }}
                              unoptimized={normalizeSrc(item.backMockup).startsWith('/api/')}
                            />
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>

        {/* Resumen del pedido */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span className="text-green-600">{getTotalPrice() >= 50000 ? "Gratis" : formatCurrency(5000)}</span>
                </div>
                {getTotalPrice() >= 50000 && (
                  <div className="text-sm text-green-600">
                    ¡Envío gratis por compras mayores a {formatCurrency(50000)}!
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(getTotalPrice() + (getTotalPrice() >= 50000 ? 0 : 5000))}</span>
              </div>

              <div className="space-y-3 pt-4">
                <Button onClick={handleCheckout} className="w-full" size="lg">
                  Proceder al Checkout
                </Button>

                <Link href="/design" className="block">
                  <Button variant="outline" className="w-full bg-transparent">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Continuar Diseñando
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  onClick={clearCart}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Vaciar Carrito
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Zoom */}
      <Dialog open={showZoomModal} onOpenChange={setShowZoomModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-lg font-semibold">{zoomImageAlt}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[70vh] bg-black/5 rounded-lg overflow-hidden mx-6 mb-6">
            <Image
              src={zoomImageUrl}
              alt={zoomImageAlt}
              fill
              sizes="(min-width:1024px) 80vw, 100vw"
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg"
              }}
              unoptimized={zoomImageUrl.startsWith('/api/')}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
