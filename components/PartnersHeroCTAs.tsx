"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { trackGenerateLead } from "@/lib/analytics"

export function PartnersJoinLink({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      href="/partners/join"
      className={className}
      onClick={() => trackGenerateLead("partner_signup_started")}
    >
      {children}
    </Link>
  )
}

export function PartnersHeroCTAs() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link href="/partners/join" onClick={() => trackGenerateLead("partner_signup_started")}>
        <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 font-semibold px-8 h-12 text-base">
          Empezar gratis
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
      <Link
        href="https://wa.me/message/DRWR3O2HZY2JG1"
        target="_blank"
        onClick={() => trackGenerateLead("contact_advisor")}
      >
        <Button size="lg" variant="outline" className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 h-12 text-base">
          Hablar con un asesor
        </Button>
      </Link>
    </div>
  )
}
