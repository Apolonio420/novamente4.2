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
  // /crear es full-screen design tool — esconder flotantes (WhatsApp, asistente
  // publico, email capture) para no competir con la UI. Mantenemos Navbar
  // para que el carrito siga accesible.
  const isCrear = pathname?.startsWith("/crear") ?? false
  // /p/* son tiendas del partner: NINGÚN chrome flotante de Novamente va encima.
  // Es la tienda de otra marca y su superficie de venta — todo lo nuestro que se
  // monte ahí le tapa los productos o le roba el lead:
  //   · WhatsAppButton      → iría al número de Novamente (cada tienda monta su
  //                           propio StoreWhatsAppButton con el del partner).
  //   · PublicAssistantLoader → atiende a los clientes del partner como Novamente.
  //   · EmailCaptureLoader  → modal a pantalla completa que tapa la tienda y se
  //                           queda con el mail del cliente del partner.
  const isStore = pathname?.startsWith("/p/") ?? false
  // /checkout/*: el cliente está pagando. La burbuja de Nova (y el modal de
  // email) tapaban en mobile el campo CP y el recuadro con el monto a
  // transferir (QA 01/10/2026). Queda sólo el botón de WhatsApp —es la ayuda
  // si se traba— y el contenido lleva margen abajo para que nada quede debajo.
  const isCheckout = pathname?.startsWith("/checkout") ?? false

  if (isCrear) {
    // Full-screen design tool — sin navbar global, sin footer, sin flotantes.
    // /crear tiene su propio top bar con back + cart + try-on.
    return (
      <div className="min-h-screen">
        <main id="main-content">{children}</main>
      </div>
    )
  }

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
      <main id="main-content" className={isCheckout ? "flex-1 pb-24" : "flex-1"}>
        {children}
      </main>
      <Footer />
      {!isStore && (
        <>
          <WhatsAppButton />
          {!isCheckout && <PublicAssistantLoader />}
          {!isCheckout && <EmailCaptureLoader />}
        </>
      )}
    </div>
  )
}
