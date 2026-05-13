"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Package, Mail, Home } from "lucide-react"
import * as fpixel from "@/lib/fpixel"
import { trackPurchase as gadsPurchase } from "@/lib/gads"
import { trackPurchase as dataLayerPurchase } from "@/lib/analytics"
import { useCart } from "@/lib/cartStore"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const [paymentData, setPaymentData] = useState<any>(null)
  const items = useCart((s) => s.items)
  const getTotalPrice = useCart((s) => s.getTotalPrice)
  const clearCart = useCart((s) => s.clearCart)
  const purchaseTrackedRef = useRef(false)

  useEffect(() => {
    // Get payment data from URL parameters
    const paymentId = searchParams.get("payment_id")
    const status = searchParams.get("status")
    const externalReference = searchParams.get("external_reference")
    const merchantOrderId = searchParams.get("merchant_order_id")

    setPaymentData({
      paymentId,
      status,
      externalReference,
      merchantOrderId,
    })

    // Log successful payment for tracking
    console.log("✅ Payment successful:", {
      paymentId,
      status,
      externalReference,
      merchantOrderId,
      timestamp: new Date().toISOString(),
    })

    const paid = status === "approved" || status === "success" || !status

    // Resolver el snapshot de la compra: cart vivo (camino feliz) o sessionStorage
    // (fallback cuando el cart se perdió en el redirect a MercadoPago).
    type SnapshotItem = { id: string; name: string; garmentType?: string; price: number; quantity: number }
    let snapshotItems: SnapshotItem[] = items.map((i) => ({
      id: i.id, name: i.name, garmentType: i.garmentType, price: i.price, quantity: i.quantity,
    }))
    let snapshotValue = getTotalPrice()
    let snapshotSource: "cart" | "storage" | "none" = items.length > 0 ? "cart" : "none"

    if (paid && snapshotItems.length === 0 && externalReference) {
      try {
        const stored = sessionStorage.getItem(`nm_pending_purchase_${externalReference}`)
        if (stored) {
          const parsed = JSON.parse(stored) as { value: number; items: SnapshotItem[] }
          if (Array.isArray(parsed.items) && parsed.items.length > 0 && typeof parsed.value === "number") {
            snapshotItems = parsed.items
            snapshotValue = parsed.value
            snapshotSource = "storage"
          }
        }
      } catch {
        // snapshot inválido o sessionStorage no disponible — sigue como "none"
      }
    }

    if (paid && snapshotItems.length > 0 && !purchaseTrackedRef.current) {
      purchaseTrackedRef.current = true
      const orderId = externalReference || merchantOrderId || paymentId || undefined
      console.log(`[PIXEL] Purchase dispatching (source=${snapshotSource}, value=${snapshotValue}, items=${snapshotItems.length})`)
      fpixel.purchase(snapshotValue, "ARS", {
        content_ids: snapshotItems.map((i) => i.id),
        contents: snapshotItems.map((i) => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
        num_items: snapshotItems.reduce((n, i) => n + i.quantity, 0),
        order_id: orderId,
      })
      gadsPurchase(snapshotValue, orderId, "ARS")
      dataLayerPurchase({
        orderId: orderId ?? "",
        value: snapshotValue,
        items: snapshotItems.map((i) => ({
          item_id: i.id,
          item_name: i.name,
          item_category: i.garmentType,
          price: i.price,
          quantity: i.quantity,
        })),
      })
      // Limpiar snapshot y cart (el cart puede ya estar vacío, no es problema)
      if (externalReference) {
        try { sessionStorage.removeItem(`nm_pending_purchase_${externalReference}`) } catch {}
      }
      clearCart()
    } else if (paid && snapshotItems.length === 0) {
      console.warn("[PIXEL] Purchase skipped — no cart and no sessionStorage snapshot. external_reference:", externalReference)
    }

    // Fallback de confirmación server-side (no depende de que el webhook llegue primero)
    if (paymentId) {
      fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId }),
      })
        .then((res) => res.json())
        .then((data) => console.log("✅ Payment confirm fallback:", data))
        .catch((err) => console.warn("⚠️ Payment confirm fallback failed:", err))
    }
  }, [searchParams, items, getTotalPrice, clearCart])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">¡Pago Exitoso!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-lg mb-2">Tu pedido ha sido confirmado</p>
              <p className="text-muted-foreground">
                Recibirás un email de confirmación con todos los detalles de tu compra.
              </p>
            </div>

            {paymentData?.paymentId && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Detalles del Pago</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>ID de Pago:</strong> {paymentData.paymentId}
                  </p>
                  <p>
                    <strong>Estado:</strong> {paymentData.status}
                  </p>
                  {paymentData.externalReference && (
                    <p>
                      <strong>Referencia:</strong> {paymentData.externalReference}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Procesamiento</h4>
                  <p className="text-sm text-muted-foreground">Tu pedido será procesado en 2-3 días hábiles</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Mail className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Confirmación</h4>
                  <p className="text-sm text-muted-foreground">Te enviaremos actualizaciones por email</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full" size="lg">
                  <Home className="mr-2 h-4 w-4" />
                  Volver al Inicio
                </Button>
              </Link>

              <Link href="/#generator-section" className="block" data-cta="checkout-success-create-design">
                <Button variant="outline" className="w-full bg-transparent">
                  Crear Otro Diseño
                </Button>
              </Link>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>¿Tienes alguna pregunta? Contáctanos en:</p>
              <p>
                <a href="mailto:contact@novamente.ar" className="text-primary hover:underline">
                  contact@novamente.ar
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
