"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle, ArrowLeft, ShoppingCart } from "lucide-react"

export default function CheckoutCancelPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Pago Cancelado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-lg mb-2">Tu pago ha sido cancelado</p>
              <p className="text-muted-foreground">
                No se realizó ningún cargo. Puedes intentar nuevamente cuando estés listo.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                💡 <strong>Tip:</strong> Tu carrito se mantiene guardado. Puedes volver y completar tu compra cuando
                quieras.
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/cart" className="block">
                <Button className="w-full" size="lg">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Volver al Carrito
                </Button>
              </Link>

              <Link href="/" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continuar Comprando
                </Button>
              </Link>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>¿Necesitas ayuda? Contáctanos en:</p>
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
