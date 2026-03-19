'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TenantInfo {
  name: string
  plan: string
  status: string
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const tenantId = searchParams.get('tenant_id')
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [retries, setRetries] = useState(0)

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    const checkTenant = async () => {
      try {
        const res = await fetch(`/api/partners/onboarding/status?tenant_id=${tenantId}`)
        if (res.ok) {
          const data = await res.json()
          setTenant(data.tenant)
          if (data.tenant.status === 'active') {
            setLoading(false)
            return
          }
        }
      } catch {
        // Ignore fetch errors
      }

      // If not active yet, retry up to 10 times
      if (retries < 10) {
        setTimeout(() => setRetries((r) => r + 1), 3000)
      } else {
        setLoading(false)
      }
    }

    checkTenant()
  }, [tenantId, retries])

  const isActive = tenant?.status === 'active'
  const planName = tenant?.plan
    ? tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)
    : 'Growth'

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 py-12 text-center">
        {isActive ? (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-3">
              Tu suscripcion esta activa!
            </h1>
            <p className="text-zinc-400 mb-2">
              Plan <span className="text-purple-400 font-semibold">{planName}</span> activado exitosamente.
            </p>
            {tenant?.name && (
              <p className="text-zinc-500 text-sm mb-8">
                {tenant.name} ya esta lista para recibir clientes.
              </p>
            )}
            <div className="space-y-3">
              <Link href="/workspace">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ir a mi workspace
                </Button>
              </Link>
            </div>
          </>
        ) : loading ? (
          <>
            <div className="w-20 h-20 rounded-full bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Procesando tu pago...</h1>
            <p className="text-zinc-400 mb-6">
              Estamos confirmando tu pago con MercadoPago. Esto puede tardar unos segundos.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Verificando estado...
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Pago en proceso</h1>
            <p className="text-zinc-400 mb-6">
              Tu pago esta siendo procesado. Te notificaremos cuando este confirmado.
              Podes acceder a tu workspace mientras tanto.
            </p>
            <div className="space-y-3">
              <Link href="/workspace">
                <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ir a mi workspace
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
