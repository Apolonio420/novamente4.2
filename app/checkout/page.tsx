"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "@/lib/cartStore"
import * as fpixel from "@/lib/fpixel"
import { formatCurrency } from "@/lib/utils"
import { Loader2, ArrowLeft, CreditCard, Smartphone, Building2, Shield, Truck, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"

interface CustomerData {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  postalCode: string
}

export default function CheckoutPage() {
  const { items, getTotalPrice, getTotalItems, clearCart } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'transferencia'>('mercadopago')
  // Estado para previsualización
  const [selectedItemIndex, setSelectedItemIndex] = useState(0)
  const selectedItem = items[selectedItemIndex] || items[0]
  const availablePreviews = [
    selectedItem?.mockupUrl,
    selectedItem?.frontMockup,
    selectedItem?.backMockup,
    selectedItem?.image,
  ].filter(Boolean) as string[]
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(availablePreviews[0] || null)
  const [customerInfo, setCustomerInfo] = useState<CustomerData>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  })

  // Calcular totales usando exactamente los precios del carrito
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const shippingThreshold = 85000
  const shippingCost = subtotal >= shippingThreshold ? 0 : 6500
  const total = subtotal + shippingCost

  console.log("💰 Checkout totals:", {
    subtotal,
    shippingCost,
    total,
    items: items.map((item) => ({ name: item.name, price: item.price, quantity: item.quantity })),
  })

  useEffect(() => {
    if (getTotalItems() === 0) {
      router.push("/cart")
    }
  }, [getTotalItems, router])

  // Sincronizar preview cuando cambia el item seleccionado o el carrito
  useEffect(() => {
    const previews = [
      items[selectedItemIndex]?.mockupUrl,
      items[selectedItemIndex]?.frontMockup,
      items[selectedItemIndex]?.backMockup,
      items[selectedItemIndex]?.image,
    ].filter(Boolean) as string[]
    setSelectedPreviewUrl(previews[0] || null)
  }, [items, selectedItemIndex])

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const required = ["email", "firstName", "lastName", "phone", "address", "city"]
    return required.every((field) => customerInfo[field as keyof typeof customerInfo].trim() !== "")
  }

  const handleCheckout = async () => {
    if (!validateForm()) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    fpixel.event("InitiateCheckout", {
      content_ids: items.map((i) => i.id),
      contents: items.map((i) => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
      num_items: getTotalItems(),
      value: total,
      currency: "ARS",
    })

    setIsProcessing(true)

    try {
      if (paymentMethod === 'mercadopago') {
        // Preparar items para MercadoPago con precios exactos del carrito
        const checkoutItems = items.map((item) => ({
          id: item.id,
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price, // PRECIO EXACTO DEL CARRITO
          currency_id: "ARS",
          description: `${item.garmentType} - ${item.color} - Talle ${item.size}${item.backDesign ? " (con estampado trasero)" : ""}`,
        }))

        // Agregar envío como item separado si aplica
        if (shippingCost > 0) {
          checkoutItems.push({
            id: "shipping",
            title: "Envío",
            quantity: 1,
            unit_price: shippingCost,
            currency_id: "ARS",
            description: "Costo de envío",
          })
        }

        console.log("🚀 Sending to MercadoPago:", {
          items: checkoutItems,
          customer: customerInfo,
          totalCalculated: total,
        })

        const requestBody = {
          items: checkoutItems,
          customer: customerInfo,
          total: total, // Total calculado para validación
          cartItems: items, // Enviar items completos del carrito
          subtotal: subtotal,
          shippingCost: shippingCost,
        }

        console.log("📤 Request body:", JSON.stringify(requestBody, null, 2))

        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("❌ API Error:", errorData)
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("✅ API Response:", data)

        if (data.success && data.init_point) {
          // Redirigir a MercadoPago
          window.location.href = data.init_point
        } else {
          throw new Error(data.error || "Error al procesar el pago")
        }
      } else {
        // Transferencia bancaria - crear pedido primero
        console.log("🔄 Creating transfer order...")
        
        const transferResponse = await fetch("/api/checkout/transfer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: customerInfo,
            items: items,
            subtotal: subtotal,
            shippingCost: shippingCost,
            total: total,
          }),
        })

        if (!transferResponse.ok) {
          const errorData = await transferResponse.json()
          console.error("❌ Transfer API Error:", errorData)
          throw new Error(errorData.error || "Error al crear el pedido")
        }

        const transferDataResponse = await transferResponse.json()
        console.log("✅ Transfer order created:", transferDataResponse)

        // Preparar datos de transferencia para mostrar en página
        const transferData = {
          bank: "MercadoPago",
          cvu: "0000003100011214870727",
          alias: "novamente",
          amount: total,
          customer: customerInfo,
          items: items,
          order_id: transferDataResponse.order_id,
          order_number: transferDataResponse.order_number,
        }
        
        // Guardar datos de transferencia en localStorage para mostrar en página de confirmación
        console.log("🔄 Guardando datos de transferencia:", transferData)
        localStorage.setItem('transferData', JSON.stringify(transferData))
        
        // Redirigir a página de transferencia
        router.push('/checkout/transfer')
      }
    } catch (error) {
      console.error("❌ Checkout error:", error)
      alert("Error al procesar el pago. Por favor intenta nuevamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (getTotalItems() === 0) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6 text-sm">
        <span className="text-muted-foreground">Carrito</span>
        <span className="text-muted-foreground">—</span>
        <span className="font-semibold text-primary">Checkout</span>
        <span className="text-muted-foreground">—</span>
        <span className="text-muted-foreground">Confirmacion</span>
      </div>

      {/* Urgency banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center mb-6">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">
            Produccion sale hoy — completa tu pedido para entrar en esta tanda
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <Link href="/cart">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Carrito
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Checkout</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Información del cliente */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    value={customerInfo.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Juan"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    value={customerInfo.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Pérez"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dirección de Envío</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Dirección *</Label>
                <Input
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Av. Corrientes 1234"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    value={customerInfo.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Buenos Aires"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Código Postal</Label>
                  <Input
                    id="postalCode"
                    value={customerInfo.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    placeholder="1000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Método de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'mercadopago' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('mercadopago')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === 'mercadopago' 
                        ? 'border-primary bg-primary' 
                        : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'mercadopago' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium">MercadoPago</h3>
                      <p className="text-sm text-muted-foreground">
                        Tarjetas de crédito, débito, efectivo y más
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'transferencia' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('transferencia')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === 'transferencia' 
                        ? 'border-primary bg-primary' 
                        : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'transferencia' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <Building2 className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium">Transferencia Bancaria</h3>
                      <p className="text-sm text-muted-foreground">
                        Transferencia directa desde tu banco
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen del pedido */}
        <div className="space-y-6">
          {/* Imagen grande de las prendas */}
          {items.length > 0 && selectedItem && (
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa de tu Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-100">
                  <Image 
                    src={selectedPreviewUrl || "/placeholder.svg"} 
                    alt={selectedItem.name} 
                    fill 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg"
                    }}
                    unoptimized={(selectedPreviewUrl || "").startsWith('/api/')}
                  />
                </div>
                <p className="text-base font-medium mt-3 text-center">
                  {selectedItem.name} - {selectedItem.color} - Talle {selectedItem.size}
                </p>

                {/* Thumbnails de la prenda seleccionada */}
                {availablePreviews.length > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    {availablePreviews.map((src, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPreviewUrl(src)}
                        className={`relative w-16 h-16 rounded-md overflow-hidden border ${selectedPreviewUrl === src ? 'border-primary' : 'border-transparent'} hover:border-primary/60`}
                        aria-label={`Vista ${idx + 1}`}
                      >
                        <Image
                          src={src}
                          alt={`Miniatura ${idx + 1}`}
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized={src.startsWith('/api/')}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg"
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex gap-4 cursor-pointer rounded-md p-2 ${idx === selectedItemIndex ? 'bg-muted/30 ring-1 ring-primary/30' : 'hover:bg-muted/20'}`}
                    onClick={() => setSelectedItemIndex(idx)}
                  >
                    <div className="w-16 h-16 relative rounded overflow-hidden flex-shrink-0">
                      <Image 
                        src={item.mockupUrl || item.frontMockup || item.backMockup || item.image || "/placeholder.svg"} 
                        alt={item.name} 
                        fill 
                        sizes="64px" 
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg"
                        }}
                        unoptimized={(item.mockupUrl || item.frontMockup || item.backMockup || item.image || "").startsWith('/api/')}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.garmentType} - {item.color} - Talle {item.size}
                      </p>
                      {item.frontStampSize && (
                        <p className="text-xs text-muted-foreground">
                          Estampado: {item.frontStampSize} {item.frontStampPosition && `(${item.frontStampPosition === 'center' ? 'Centro' : 'Izquierda'})`}
                        </p>
                      )}
                      {item.backStampSize && (
                        <p className="text-xs text-muted-foreground">
                          Estampado trasero: {item.backStampSize} {item.backStampPosition && `(${item.backStampPosition === 'center' ? 'Centro' : 'Izquierda'})`}
                        </p>
                      )}
                      {item.backDesign && !item.backStampSize && <p className="text-xs text-green-600">✓ Con estampado trasero</p>}
                      <p className="text-xs text-muted-foreground">Cantidad: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} c/u</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600 font-medium">¡Gratis!</span>
                    ) : (
                      formatCurrency(shippingCost)
                    )}
                  </span>
                </div>
                {subtotal < shippingThreshold && (
                  <div className="bg-blue-50 p-2 rounded space-y-1.5">
                    <p className="text-xs text-muted-foreground">
                      Te faltan {formatCurrency(shippingThreshold - subtotal)} para envio gratuito
                    </p>
                    <div className="w-full bg-blue-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (subtotal / shippingThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-xl text-green-600">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleCheckout} disabled={isProcessing || !validateForm()} className="w-full text-base" size="lg">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando tu pedido...
              </>
            ) : (
              <>
                {paymentMethod === 'mercadopago' ? (
                  <CreditCard className="mr-2 h-5 w-5" />
                ) : (
                  <Building2 className="mr-2 h-5 w-5" />
                )}
                {paymentMethod === 'mercadopago' ? 'Confirmar y Pagar' : 'Confirmar Pedido'} — {formatCurrency(total)}
              </>
            )}
          </Button>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground py-2">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Pago 100% seguro
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              Envio a todo el pais
            </span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {paymentMethod === 'mercadopago'
              ? 'Seras redirigido a MercadoPago para completar tu compra de forma segura.'
              : 'Veras los datos de transferencia bancaria para completar tu pago.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
