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
    // Workspace lleva su propio chrome y full-height layout.
    return <main id="main-content" className="h-dvh">{children}</main>
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
