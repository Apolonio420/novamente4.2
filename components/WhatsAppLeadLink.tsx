"use client"

import * as fpixel from "@/lib/fpixel"

/**
 * Link a WhatsApp que además dispara el evento `Lead` del píxel al hacer clic.
 *
 * Por qué existe: en las landings donde la venta se cierra por WhatsApp (egresados,
 * empresas, mayorista), el clic al CTA es la ÚNICA conversión observable — después
 * la conversación se va a otra app y Meta la pierde de vista. Sin este evento, una
 * campaña solo puede optimizar hacia "visitas a la página", que es justamente lo que
 * nos pasó con la Serie Malvinas: 94.848 personas alcanzadas y 2 ventas.
 *
 * Deliberadamente NO bloquea la navegación: el `fbq` se dispara y el navegador sigue
 * al href igual. Si el píxel no cargó (bloqueador, red lenta), el usuario llega a
 * WhatsApp lo mismo — perder la métrica es aceptable, perder el lead no.
 */
export default function WhatsAppLeadLink({
  href,
  source,
  className,
  children,
}: {
  href: string
  /** De qué CTA salió, para distinguirlos en el reporte del píxel. */
  source: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-cta={source}
      className={className}
      onClick={() => {
        try {
          fpixel.lead({ content_name: source, content_category: "whatsapp-cta" })
        } catch {
          // Nunca romper el clic por un fallo de analytics.
        }
      }}
    >
      {children}
    </a>
  )
}
