'use client'

import Link from 'next/link'
import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PaymentFailurePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Pago no procesado</h1>
        <p className="text-zinc-400 mb-8">
          No pudimos procesar tu pago. Esto puede pasar por fondos insuficientes,
          tarjeta rechazada u otro motivo. No se realizo ningun cobro.
        </p>
        <div className="space-y-3">
          <Link href="/partners/join">
            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </Link>
          <Link href="/partners">
            <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Partners
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
