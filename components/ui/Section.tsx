import React from 'react'
import { cn } from "@/lib/utils"

interface SectionProps {
  id?: string
  children: React.ReactNode
  className?: string
}

export function Section({ id, children, className }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full max-w-6xl px-4 md:px-6",
        className
      )}
    >
      {children}
    </section>
  )
}

