'use client'

/**
 * WorkspaceTour — product tour / onboarding walkthrough para partners.
 *
 * - Se muestra automáticamente la primera vez que un partner entra a /workspace
 *   (se persiste en localStorage por dispositivo, sin tocar backend).
 * - Se puede relanzar a demanda disparando el evento `START_TOUR_EVENT`
 *   (botón "Ver tour de nuevo" en el menú de cuenta del header).
 *
 * Anclas: cada paso apunta a un elemento con `data-tour="..."`, definidos en
 * app/workspace/layout.tsx (sidebar + menú de cuenta) y app/workspace/page.tsx
 * (Storefront Score + checklist "Primeros pasos").
 *
 * Mobile: el sidebar vive en un drawer + se renderiza duplicado (desktop oculto
 * con `display:none` y drawer mobile fuera de pantalla). Por eso resolvemos el
 * ancla VISIBLE y, en viewport chico, abrimos el drawer durante los pasos de
 * sidebar (eventos `tour-open-sidebar` / `tour-close-sidebar` que escucha el layout).
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_STORAGE_KEY = 'nv_workspace_tour_v1'
export const START_TOUR_EVENT = 'start-workspace-tour'
export const OPEN_SIDEBAR_EVENT = 'tour-open-sidebar'
export const CLOSE_SIDEBAR_EVENT = 'tour-close-sidebar'

const MOBILE_BREAKPOINT = 1024 // Tailwind `lg`
const SIDEBAR_TRANSITION_MS = 350 // matchea `duration-300` del drawer + margen

function isMobile() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

/** Devuelve el primer elemento VISIBLE que matchea el selector (ignora el duplicado oculto). */
function visibleEl(selector: string): Element | undefined {
  const els = Array.from(document.querySelectorAll(selector))
  // offsetParent === null => display:none (sidebar desktop en mobile). El drawer
  // mobile, aunque esté translateado, conserva offsetParent.
  return els.find((el) => (el as HTMLElement).offsetParent !== null) || els[0]
}

interface TourStep {
  tourId: string
  sidebar: boolean
  popover: NonNullable<DriveStep['popover']>
}

const TOUR_STEPS: TourStep[] = [
  {
    tourId: 'branding',
    sidebar: true,
    popover: {
      title: '👋 Bienvenido a tu workspace',
      description:
        'Empezá por acá: en <b>Branding</b> configurás el logo, los colores y la identidad de tu marca. Cuanto más completo, mejor se ve tu storefront.',
      side: 'right',
      align: 'start',
    },
  },
  {
    tourId: 'catalog',
    sidebar: true,
    popover: {
      title: '📦 Cargá tus productos',
      description:
        'Desde <b>Catálogo</b> agregás y administrás los productos que vas a vender en tu tienda.',
      side: 'right',
      align: 'start',
    },
  },
  {
    tourId: 'leads',
    sidebar: true,
    popover: {
      title: '📈 Seguí tus ventas',
      description:
        'En <b>Leads</b> y <b>Pedidos</b> ves a tus clientes potenciales y las compras que van entrando.',
      side: 'right',
      align: 'start',
    },
  },
  {
    tourId: 'score-card',
    sidebar: false,
    popover: {
      title: '⭐ Tu Storefront Score',
      description:
        'Mide qué tan completa está tu tienda. Sube al cargar logo, banner, descripción, colores, industria y SEO. Score 100% = lista para vender.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    tourId: 'onboarding-checklist',
    sidebar: false,
    popover: {
      title: '✅ Primeros pasos',
      description:
        'Esta checklist te guía paso a paso para dejar tu marca lista. Completá los ítems y mirá cómo sube tu progreso.',
      side: 'top',
      align: 'center',
    },
  },
  {
    tourId: 'account-menu',
    sidebar: false,
    popover: {
      title: '⚙️ Tu cuenta',
      description:
        'Acá entrás a tu configuración, ves tu storefront público y podés <b>volver a ver este tour</b> cuando quieras.',
      side: 'bottom',
      align: 'end',
    },
  },
]

function buildDriver() {
  const steps: DriveStep[] = TOUR_STEPS.map((s) => ({
    element: () => visibleEl(`[data-tour="${s.tourId}"]`) as Element,
    popover: s.popover,
  }))

  return driver({
    showProgress: true,
    progressText: '{{current}} de {{total}}',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    doneBtnText: 'Listo',
    popoverClass: 'nv-tour-popover',
    overlayOpacity: 0.65,
    smoothScroll: true,
    steps,
    onHighlightStarted: (element, _step, { driver: d }) => {
      if (!isMobile()) return
      const tourId = element?.getAttribute?.('data-tour')
      const isSidebarStep = TOUR_STEPS.some((s) => s.sidebar && s.tourId === tourId)
      window.dispatchEvent(new Event(isSidebarStep ? OPEN_SIDEBAR_EVENT : CLOSE_SIDEBAR_EVENT))
      // Reposicionar el popover una vez que el drawer terminó de animar.
      window.setTimeout(() => d.refresh(), SIDEBAR_TRANSITION_MS)
    },
    onDestroyed: () => {
      localStorage.setItem(TOUR_STORAGE_KEY, 'done')
      window.dispatchEvent(new Event(CLOSE_SIDEBAR_EVENT))
    },
  })
}

/** Espera a que el ancla del primer paso exista antes de arrancar (el layout monta async). */
function whenAnchorReady(cb: () => void) {
  const selector = '[data-tour="branding"]'
  if (document.querySelector(selector)) {
    cb()
    return
  }
  let tries = 0
  const interval = window.setInterval(() => {
    tries += 1
    if (document.querySelector(selector)) {
      window.clearInterval(interval)
      cb()
    } else if (tries > 40) {
      // ~6s sin anclas: abortamos silenciosamente
      window.clearInterval(interval)
    }
  }, 150)
}

function startTour() {
  whenAnchorReady(() => {
    const d = buildDriver()
    // En mobile el primer paso es de sidebar: abrimos el drawer ANTES de arrancar
    // para que el primer popover ya quede bien posicionado.
    if (isMobile() && TOUR_STEPS[0]?.sidebar) {
      window.dispatchEvent(new Event(OPEN_SIDEBAR_EVENT))
      window.setTimeout(() => d.drive(), SIDEBAR_TRANSITION_MS)
    } else {
      d.drive()
    }
  })
}

export default function WorkspaceTour() {
  const pathname = usePathname()

  // Auto-start: solo en el dashboard y solo la primera vez.
  useEffect(() => {
    if (pathname !== '/workspace') return
    if (localStorage.getItem(TOUR_STORAGE_KEY)) return
    startTour()
  }, [pathname])

  // Relanzar a demanda desde el menú de cuenta.
  useEffect(() => {
    const handler = () => startTour()
    window.addEventListener(START_TOUR_EVENT, handler)
    return () => window.removeEventListener(START_TOUR_EVENT, handler)
  }, [])

  return null
}
