"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Package, Mail, Home } from "lucide-react"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const [paymentData, setPaymentData] = useState<any>(null)

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
  }, [searchParams])

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

              <Link href="/design" className="block">
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
