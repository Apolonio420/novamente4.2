'use client'

import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'

interface QuickStartCardProps {
  logoUploaded: boolean
  hasDesign: boolean
}

export function QuickStartCard({ logoUploaded, hasDesign }: QuickStartCardProps) {
  const steps = [
    {
      title: 'Subí tu logo',
      description: 'Dale identidad visual a tu tienda.',
      cta: 'Configurar branding',
      href: '/workspace/branding',
      done: logoUploaded,
    },
    {
      title: 'Generá o subí tu primer diseño',
      description: 'Crea diseños IA o sube tu propio arte.',
      cta: 'Ir al Studio',
      href: '/workspace/design-engine',
      done: hasDesign,
    },
    {
      title: 'Publicá tu primer producto',
      description: 'Armá tu catálogo y ponelo a la venta.',
      cta: 'Crear producto',
      href: '/workspace/catalog',
      done: false,
    },
  ]

  return (
    <div className="rounded-xl border border-violet-500/20 bg-zinc-900/60 p-5">
      <h3 className="text-sm font-semibold text-zinc-100 mb-4">
        Tu primer producto en 3 pasos
      </h3>
      <div className="flex flex-col lg:flex-row gap-3">
        {steps.map((step, i) => (
          <Link
            key={i}
            href={step.href}
            className="flex-1 flex items-start gap-3 rounded-lg border border-zinc-800/60 bg-zinc-800/30 p-4 hover:bg-zinc-800/50 transition-colors group"
          >
            <div className="shrink-0 mt-0.5">
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Circle className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              )}
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium leading-snug ${step.done ? 'text-zinc-400 line-through' : 'text-zinc-100'}`}>
                {step.title}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{step.description}</p>
              {!step.done && (
                <span className="inline-block mt-2 text-xs text-violet-400 group-hover:text-violet-300 transition-colors">
                  {step.cta} →
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
