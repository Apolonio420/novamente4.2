"use client"

import Image from "next/image"

import { WHATSAPP_MESSAGES, getWhatsAppLink } from "@/lib/config/links"

export function WhatsAppButton() {
  const whatsappUrl = getWhatsAppLink(WHATSAPP_MESSAGES.GENERIC)

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[whatsapp-in_0.4s_ease-out_1s_both] hover:scale-110 active:scale-95 transition-transform duration-200">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-16 h-16 hover:shadow-2xl transition-all duration-300 group"
        aria-label="Contactar por WhatsApp para info de merchandising"
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
