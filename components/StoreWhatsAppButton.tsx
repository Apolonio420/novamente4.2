"use client"

import Image from "next/image"

// Fallback solo si la tienda no tiene número configurado.
const NOVAMENTE_FALLBACK_WA = "5492235169720"

/**
 * Botón flotante de WhatsApp para las tiendas partner (/p/[slug]).
 * A diferencia del WhatsAppButton global (que va al número comercial de
 * Novamente), este dirige la consulta al número del propio partner, así los
 * leads de su tienda le llegan directo a él/ella.
 */
export function StoreWhatsAppButton({
  phone,
  storeName,
}: {
  phone?: string | null
  storeName?: string
}) {
  const digits = (phone || "").replace(/\D/g, "")
  const target = digits || NOVAMENTE_FALLBACK_WA
  const message = digits
    ? `Hola${storeName ? ` ${storeName}` : ""}! Te escribo desde tu tienda online y quiero hacerte una consulta.`
    : "Hola! Estoy comprando en una tienda partner de Novamente y quiero contactarlos. (ref · NV-MERCH)"
  const href = `https://wa.me/${target}?text=${encodeURIComponent(message)}`

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[whatsapp-in_0.4s_ease-out_1s_both] hover:scale-110 active:scale-95 transition-transform duration-200">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-16 h-16 hover:shadow-2xl transition-all duration-300 group"
        aria-label={`Contactar a ${storeName || "la tienda"} por WhatsApp`}
      >
        <div className="relative w-full h-full">
          <Image
            src="/whatsapp-icon-v2.png"
            alt="WhatsApp"
            width={64}
            height={64}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200 filter drop-shadow-lg"
          />
        </div>
      </a>
    </div>
  )
}
