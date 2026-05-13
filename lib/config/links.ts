export const INTERNAL_LINKS = {
  merchs: "/merchs", // landing B2B
  merch: "/merch", // catálogo
  generator: "/design", // generador
  styles: "/styles", // galería de estilos
  products: "/productos", // si existe
  home: "/",
} as const

// Numero comercial Novamente (Mar del Plata, +54 9 223 516-9720)
export const WHATSAPP_BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "5492235169720"
export const WHATSAPP_URL_BASE = `https://wa.me/${WHATSAPP_BOT_NUMBER}`

export const getWhatsAppLink = (text: string) => {
  return `${WHATSAPP_URL_BASE}?text=${encodeURIComponent(text)}`
}

// Mensajes con tag de origen (ref · NV-XXX) — para identificar el lead al leer el chat
export const WHATSAPP_MESSAGES = {
  GENERIC: "Hola Novamente! Quiero info de merchandising. (ref · NV-WEB)",
  HOME: "Hola Novamente! Llego desde el home de la web y quiero empezar a disenar prendas. Como arrancamos? (ref · NV-HOME)",
  FAQ: "Hola Novamente! Tengo dudas que no resolvi en la seccion de Preguntas Frecuentes. Pueden ayudarme? (ref · NV-FAQ)",
  PRODUCTS_CATALOG: "Hola Novamente! Estoy viendo el catalogo de productos y quiero mas info / cotizacion. (ref · NV-CAT)",
  PRODUCT_DETAIL: "Hola Novamente! Estoy viendo un producto en su web y quiero cotizar / comprar. (ref · NV-PDP)",
  PARTNER: "Hola Novamente! Me interesa ser partner. Me pasan info del Plan Partner y precios On Demand? (ref · NV-PARTNER)",
  MAYORISTA: "Hola Novamente! Quiero cotizacion mayorista. Como funcionan las opciones B2B, minimos y tiempos? (ref · NV-MAY)",
  B2B_2026: "Hola Novamente! Vi el catalogo B2B 2026 y quiero coordinar pedido / drop. (ref · NV-B2B26)",
  DTG_VS_SERIGRAFIA: "Hola Novamente! Vi su guia DTG vs Serigrafia y quiero asesoramiento para mi prenda. (ref · NV-DTGSER)",
  DISENA_TU_REMERA: "Hola Novamente! Quiero disenar mi remera con IA. Como sigo? (ref · NV-DISENA)",
  HOODIE_PERSONALIZADO: "Hola Novamente! Estoy interesado en un hoodie personalizado. Me pasan info? (ref · NV-HOODIE)",
  GUIA_ESTAMPADO: "Hola Novamente! Lei su guia de estampado y quiero estampar mis prendas. (ref · NV-GUIA)",
  REGALOS_EMPRESARIALES: "Hola Novamente! Quiero cotizar regalos empresariales personalizados. Somos [nombre empresa] y necesitamos [cantidad] unidades. (ref · NV-EMP)",
  COMPARAR: "Hola Novamente! Vi su pagina de comparacion y quiero asesoramiento para elegir mi prenda. (ref · NV-COMP)",
  WORKSPACE_SUPPORT: "Hola Novamente! Soy partner y necesito soporte desde el workspace. (ref · NV-WSSUP)",
  STOREFRONT_PARTNER: "Hola! Estoy comprando en una tienda partner de Novamente y quiero contactarlos. (ref · NV-MERCH)",
  COTIZADOR: "Hola Novamente! Termine de armar una cotizacion en el cotizador online y quiero avanzar. (ref · NV-COTIZ)",
  NOSOTROS: "Hola Novamente! Quiero saber mas sobre ustedes. Visite la pagina 'Nosotros'. (ref · NV-NOS)",
} as const

// Compat: link "generico"
export const WHATSAPP_URL = getWhatsAppLink(WHATSAPP_MESSAGES.GENERIC)
export const GENERATOR_URL = INTERNAL_LINKS.generator


