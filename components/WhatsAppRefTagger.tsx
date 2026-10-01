"use client"

import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { getStoredAdAttribution } from "@/lib/attribution"
import { withAdRef } from "@/lib/wa-ref"
import { WHATSAPP_BOT_NUMBER } from "@/lib/config/links"

/**
 * Taggea client-side (post-hidratación) todos los botones de WhatsApp que
 * apuntan al número comercial de Novamente con el ad id de Meta (ver
 * lib/wa-ref.ts). Se monta una sola vez en el layout raíz, junto a
 * AttributionTracker.
 *
 * Por qué client-side y no en el server: el tag depende de `nm_attribution`
 * en localStorage, que solo existe en el navegador. Nunca toca el HTML
 * server-rendered (no hay mismatch de hidratación: el <a> ya existe con su
 * href original, acá solo se le reescribe el atributo después de montar).
 *
 * No toca links de tiendas partner (StoreWhatsAppButton) que apuntan al
 * número del propio partner — el selector ya los excluye, y withAdRef
 * además re-valida el número adentro por las dudas.
 */
const WA_SELECTOR = [
  `a[href^="https://wa.me/${WHATSAPP_BOT_NUMBER}"]`,
  `a[href^="https://api.whatsapp.com/send"]`,
].join(", ")

function rewriteAnchor(anchor: HTMLAnchorElement): void {
  const href = anchor.getAttribute("href")
  if (!href) return
  const attribution = getStoredAdAttribution()
  const next = withAdRef(href, attribution)
  if (next !== href) anchor.setAttribute("href", next)
}

function rewriteAll(root: ParentNode): void {
  root.querySelectorAll<HTMLAnchorElement>(WA_SELECTOR).forEach(rewriteAnchor)
}

/**
 * Reintentos acotados tras el mount/cada navegación. Necesarios porque
 * AttributionTracker (que escribe `nm_attribution` en localStorage) vive en
 * su propio boundary de Suspense (useSearchParams) y puede terminar de
 * capturar la atribución en un commit posterior al de este componente — un
 * <a> ya presente en el DOM no se vuelve a tocar solo (el MutationObserver
 * de abajo solo ve nodos NUEVOS, no escrituras a localStorage). Backoff
 * corto: en la práctica alcanza con el primer reintento.
 */
const RETRY_DELAYS_MS = [0, 100, 300, 800, 1500]

function WhatsAppRefTaggerInner() {
  // Mismas deps que AttributionTracker (ver components/AttributionTracker.tsx):
  // re-escanea en cada navegación, así los botones persistentes (navbar) se
  // actualizan si la atribución last-touch cambió a mitad de sesión.
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    let cancelled = false
    const timers = RETRY_DELAYS_MS.map((delay) =>
      window.setTimeout(() => {
        if (!cancelled) rewriteAll(document)
      }, delay),
    )
    return () => {
      cancelled = true
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [pathname, searchParams])

  useEffect(() => {
    // Botones que aparecen después del escaneo inicial (modales, componentes lazy, etc).
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          if (node.matches(WA_SELECTOR)) rewriteAnchor(node as HTMLAnchorElement)
          rewriteAll(node)
        })
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    // Red de seguridad: si por algún motivo un link se clickea antes de que
    // el observer o los reintentos de arriba lo procesen, lo taggeamos en el
    // captura-phase del click, antes de que el navegador siga el href.
    const handleClickCapture = (event: MouseEvent) => {
      const target = event.target as Element | null
      const anchor = target?.closest<HTMLAnchorElement>(WA_SELECTOR)
      if (anchor) rewriteAnchor(anchor)
    }
    document.addEventListener("click", handleClickCapture, true)

    return () => {
      observer.disconnect()
      document.removeEventListener("click", handleClickCapture, true)
    }
  }, [])

  return null
}

export default function WhatsAppRefTagger() {
  // useSearchParams necesita un boundary de Suspense (mismo patrón que
  // components/AttributionTracker.tsx y components/FacebookPixel.tsx).
  return (
    <Suspense fallback={null}>
      <WhatsAppRefTaggerInner />
    </Suspense>
  )
}
