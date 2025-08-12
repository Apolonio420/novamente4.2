"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "@/lib/cartStore"
import { formatCurrency } from "@/lib/utils"
import { Loader2, ArrowLeft, CreditCard } from "lucide-react"
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

    setIsProcessing(true)

    try {
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

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: checkoutItems,
          customer: customerInfo,
          total: total, // Total calculado para validación
        }),
      })

      const data = await response.json()

      if (data.success && data.init_point) {
        // Redirigir a MercadoPago
        window.location.href = data.init_point
      } else {
        throw new Error(data.error || "Error al procesar el pago")
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
        </div>

        {/* Resumen del pedido */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 relative rounded overflow-hidden flex-shrink-0">
                      <Image src={item.imageUrl || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.garmentType} - {item.color} - Talle {item.size}
                      </p>
                      {item.backDesign && <p className="text-xs text-green-600">✓ Con estampado trasero</p>}
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
                  <p className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                    💡 Agrega {formatCurrency(shippingThreshold - subtotal)} más para envío gratuito
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-xl text-green-600">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleCheckout} disabled={isProcessing || !validateForm()} className="w-full" size="lg">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar {formatCurrency(total)}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Al hacer clic en "Pagar" serás redirigido a MercadoPago para completar tu compra de forma segura.
          </p>
        </div>
      </div>
    </div>
  )
}
