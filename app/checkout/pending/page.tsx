"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Mail, Home, RefreshCw } from "lucide-react"

export default function CheckoutPendingPage() {
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

    // Log pending payment for tracking
    console.log("⏳ Payment pending:", {
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
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-600">Pago Pendiente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-lg mb-2">Tu pago está siendo procesado</p>
              <p className="text-muted-foreground">
                Estamos esperando la confirmación del pago. Esto puede tomar unos minutos.
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-left">
                  <h4 className="font-semibold text-blue-900">Te mantendremos informado</h4>
                  <p className="text-sm text-blue-800">Recibirás un email tan pronto como se confirme tu pago.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full" size="lg" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar Estado
              </Button>

              <Link href="/" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  <Home className="mr-2 h-4 w-4" />
                  Volver al Inicio
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
