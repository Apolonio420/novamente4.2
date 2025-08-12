"use client"

import Image from "next/image"
import { motion } from "framer-motion"

export function WhatsAppButton() {
  const whatsappUrl = "https://wa.me/message/DRWR3O2HZY2JG1"

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay: 1,
        duration: 0.3,
        type: "spring",
        stiffness: 200,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-16 h-16 hover:shadow-2xl transition-all duration-300 group"
        aria-label="Contactar por WhatsApp"
      >
        <div className="relative w-full h-full">
          <Image
            src="/whatsapp-icon-v2.png"
            alt="WhatsApp"
            width={64}
            height={64}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200 filter drop-shadow-lg"
            priority
          />
        </div>
      </a>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
        ¡Chateá con nosotros!
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </motion.div>
  )
}
