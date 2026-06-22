'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, BadgeAlert, CircleAlert, Package, UserRound, Wallet } from 'lucide-react'
import { authFetch } from '@/lib/partners/auth-fetch'

type AttentionItem = {
  id: string
  priority: 'critical' | 'warning' | 'info'
  entity: 'lead' | 'order' | 'catalog' | 'finance' | 'feed'
  title: string
  reason: string
  dueAt: string | null
  actionUrl: string
  actionLabel: string
}

const priorityStyles = {
  critical: 'border-red-500/30 bg-red-500/5 text-red-300',
  warning: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
  info: 'border-zinc-700 bg-zinc-900/50 text-zinc-300',
}

function iconFor(entity: AttentionItem['entity']) {
  if (entity === 'lead') return UserRound
  if (entity === 'order') return Package
  if (entity === 'finance') return Wallet
  return entity === 'feed' ? BadgeAlert : CircleAlert
}

export function DailyAttention() {
  const [items, setItems] = useState<AttentionItem[] | null>(null)

  useEffect(() => {
    let cancelled = false
    authFetch('/api/partners/dashboard/attention')
      .then((res) => res.ok ? res.json() : Promise.reject(new Error('attention unavailable')))
      .then((data) => !cancelled && setItems(data.items || []))
      .catch(() => !cancelled && setItems([]))
    return () => { cancelled = true }
  }, [])

  if (items === null) {
    return <div className="h-28 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
  }

  return (
    <section className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/70">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Mi día</h2>
            <p className="text-xs text-zinc-500">Acciones que necesitan tu atención</p>
          </div>
        </div>
        <span className="text-xs text-zinc-500">{items.length} pendiente{items.length === 1 ? '' : 's'}</span>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm font-medium text-emerald-300">Todo en orden</p>
          <p className="text-xs text-zinc-500 mt-1">No hay leads, pedidos ni productos que requieran una acción urgente.</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/60">
          {items.map((item) => {
            const Icon = iconFor(item.entity)
            return (
              <Link key={item.id} href={item.actionUrl} className="group flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/30 transition-colors">
                <div className={`w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center ${priorityStyles[item.priority]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-200 truncate">{item.title}</p>
                  <p className="text-xs text-zinc-500 truncate">{item.reason}</p>
                </div>
                <span className="hidden sm:inline text-xs text-violet-400 group-hover:text-violet-300">{item.actionLabel}</span>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
