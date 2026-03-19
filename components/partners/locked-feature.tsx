'use client'

import { Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface LockedFeatureProps {
  title: string
  description: string
  requiredPlan: 'growth' | 'pro'
  icon: LucideIcon
  features?: string[]
  children?: React.ReactNode
}

export function LockedFeature({
  title,
  description,
  requiredPlan,
  icon: Icon,
  features,
  children,
}: LockedFeatureProps) {
  const planLabel = requiredPlan === 'pro' ? 'Pro' : 'Growth'
  const isPro = requiredPlan === 'pro'

  return (
    <div className="space-y-6">
      {/* Lock banner */}
      <div className={cn(
        'rounded-xl border p-6',
        isPro ? 'border-amber-500/20 bg-amber-500/5' : 'border-violet-500/20 bg-violet-500/5'
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
            isPro ? 'bg-amber-500/10' : 'bg-violet-500/10'
          )}>
            <Lock className={cn('w-6 h-6', isPro ? 'text-amber-400' : 'text-violet-400')} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
              <span className={cn(
                'inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                isPro ? 'bg-amber-500/20 text-amber-400' : 'bg-violet-500/20 text-violet-400'
              )}>
                Plan {planLabel}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mb-4">{description}</p>
            {features && features.length > 0 && (
              <ul className="space-y-1.5 mb-4">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className={cn('w-1 h-1 rounded-full', isPro ? 'bg-amber-400' : 'bg-violet-400')} />
                    {f}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/workspace/billing"
              className={cn(
                'inline-flex items-center gap-2 rounded-lg text-white font-medium px-4 py-2 text-sm transition-colors',
                isPro ? 'bg-amber-600 hover:bg-amber-500' : 'bg-violet-600 hover:bg-violet-500'
              )}
            >
              Actualizar a {planLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Preview content (blurred/faded) */}
      {children && (
        <div className="relative">
          <div className="opacity-30 pointer-events-none select-none blur-[1px]">
            {children}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/80" />
        </div>
      )}
    </div>
  )
}
