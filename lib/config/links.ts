export const INTERNAL_LINKS = {
  merchs: "/merchs", // landing B2B
  merch: "/merch", // catálogo
  generator: "/design", // generador
  styles: "/styles", // galería de estilos
  products: "/productos", // si existe
  home: "/",
} as const

// Enlaces externos y atajos usados en varias páginas
export const WHATSAPP_URL = "https://wa.me/message/DRWR3O2HZY2JG1"
export const WHATSAPP_BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "5491162747588"
export const GENERATOR_URL = INTERNAL_LINKS.generator

export const getWhatsAppLink = (text: string) => {
  if (WHATSAPP_BOT_NUMBER) {
    return `https://wa.me/${WHATSAPP_BOT_NUMBER}?text=${encodeURIComponent(text)}`
  }
  return WHATSAPP_URL
}

export const WHATSAPP_MESSAGES = {
  PARTNER: "Hola! Me interesa ser partner de Novamente. ¿Me pasás información del Plan Partner y los precios On Demand? Gracias",
  MAYORISTA: "Hola Novamente! Quiero una cotización mayorista. ¿Cómo funcionan sus opciones B2B y cuáles son los mínimos y tiempos de producción?",
  GENERIC: "Hola! Quiero info de merchandising.",
}


