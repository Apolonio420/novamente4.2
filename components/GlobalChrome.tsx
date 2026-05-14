"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "./Navbar"
import { Footer } from "./Footer"
import { WhatsAppButton } from "./WhatsAppButton"
import { PublicAssistantLoader } from "./PublicAssistantLoader"
import { EmailCaptureLoader } from "./EmailCaptureLoader"

/**
 * Wraps the global chrome (navbar, footer, floating buttons) and hides them
 * when the user is inside /workspace/* (the partner workspace has its own
 * sidebar + chrome and shouldn't show the public-site chrome on top, which
 * was causing nested scrolls).
 */
export function GlobalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isWorkspace = pathname?.startsWith("/workspace") ?? false

  if (isWorkspace) {
    // En workspace mantenemos el Navbar global (para que el partner pueda volver
    // al sitio público con un click) pero ocultamos Footer + flotantes que
    // generaban scroll exterior. El workspace internamente usa
    // h-[calc(100dvh-4rem)] para descontar el navbar.
    return (
      <div className="flex flex-col h-dvh">
        <Navbar />
        <main id="main-content" className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
      <PublicAssistantLoader />
      <EmailCaptureLoader />
    </div>
  )
}
