export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Circle, Package, Truck, Home, Clock } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const metadata: Metadata = {
  title: 'Seguimiento de pedido · Novamente',
  robots: { index: false, follow: false },
}

interface TrackingPageProps {
  params: Promise<{ ref: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Lookup seguro: solo por UUID del pedido o por external_reference
 * (order_<timestamp>) — identificadores no enumerables. El order_number corto
 * (NOV-XXXX) NO sirve solo, para no exponer pedidos ajenos por fuerza bruta.
 */
async function getOrder(ref: string) {
  const col = UUID_RE.test(ref) ? 'id' : 'external_reference'
  if (col === 'external_reference' && !ref.startsWith('order_')) return null
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq(col, ref)
    .maybeSingle()
  const order = data as Record<string, any> | null
  if (!order) return null
  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', order.id)
  return { ...order, items: (items ?? []) as Record<string, any>[] } as Record<string, any> & {
    items: Record<string, any>[]
  }
}

const STEPS = [
  { key: 'pending', label: 'Recibido', icon: Clock },
  { key: 'confirmed', label: 'Pago confirmado', icon: CheckCircle2 },
  { key: 'producing', label: 'En producción', icon: Package },
  { key: 'shipped', label: 'En camino', icon: Truck },
  { key: 'delivered', label: 'Entregado', icon: Home },
] as const

function stepIndex(status: string | null | undefined): number {
  const i = STEPS.findIndex((s) => s.key === status)
  // 'confirmed' implica producción inminente; estados desconocidos → recibido
  return i === -1 ? 0 : i
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default async function TrackingPage(props: TrackingPageProps) {
  const { ref } = await props.params
  const order = await getOrder(decodeURIComponent(ref))
  if (!order) notFound()

  const cancelled = order.status === 'cancelled'
  const current = stepIndex(order.status)
  const maskedEmail = (order.customer_email || '').replace(/^(.{2}).*(@.*)$/, '$1•••$2')

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Seguimiento de pedido</p>
        <h1 className="text-2xl md:text-3xl font-bold mt-1">{order.order_number}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {order.customer_first_name} · {maskedEmail}
        </p>
      </div>

      {cancelled ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-red-700 mb-8">
          <p className="font-semibold">Pedido cancelado</p>
          <p className="text-sm mt-1">Si creés que es un error, escribinos por WhatsApp y lo revisamos.</p>
        </div>
      ) : (
        <ol className="relative mb-10">
          {STEPS.map((step, i) => {
            const done = i <= current
            const Icon = step.icon
            return (
              <li key={step.key} className="flex items-start gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                      done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-300 text-zinc-400'
                    }`}
                  >
                    {done ? <Icon className="h-4.5 w-4.5" /> : <Circle className="h-4 w-4" />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-0.5 flex-1 min-h-6 ${i < current ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                  )}
                </div>
                <div className="pt-1.5">
                  <p className={`font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                  {step.key === 'shipped' && order.metadata?.tracking_code && (
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      Tracking: {order.metadata.tracking_code}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Items ({order.items.length})
      </h2>
      <div className="space-y-3 mb-8">
        {order.items.map((it: Record<string, any>, i: number) => {
          const img = it.mockup_url || it.front_mockup_url || it.image_url
          return (
            <div key={i} className="flex gap-3 rounded-xl border p-3">
              {img ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                  <Image src={img} alt={it.item_name} fill className="object-contain" sizes="80px" />
                </div>
              ) : (
                <div className="h-20 w-20 shrink-0 rounded-lg bg-zinc-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{it.item_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[it.product_color, it.product_size && `Talle ${it.product_size}`, `x${it.quantity}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p className="text-sm font-semibold mt-1">{fmt(Number(it.total_price) || 0)}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border p-4 space-y-1.5 text-sm mb-10">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{fmt(Number(order.subtotal) || 0)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Envío</span>
          <span>{Number(order.shipping_cost) > 0 ? fmt(Number(order.shipping_cost)) : 'Gratis'}</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-1">
          <span>Total</span>
          <span>{fmt(Number(order.total) || 0)}</span>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          ¿Dudas con tu pedido?{' '}
          <Link
            href={`https://wa.me/5492235169720?text=${encodeURIComponent(`Hola! Consulto por mi pedido ${order.order_number}`)}`}
            target="_blank"
            className="underline hover:text-foreground"
          >
            Escribinos por WhatsApp
          </Link>
        </p>
      </div>
    </div>
  )
}
