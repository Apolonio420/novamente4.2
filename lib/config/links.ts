/**
 * Centralized configuration for external links and URLs
 * Reads from environment variables and provides fallbacks
 */

// WhatsApp URL for B2B inquiries
export const WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/message/DRWR3O2HZY2JG1"

// Generator URL (home + scroll to generator section)
export const GENERATOR_URL = process.env.NEXT_PUBLIC_GENERATOR_URL || "/#generator-section"

// Social media links
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/novamente.ar/",
  twitter: "https://x.com/Novamentear",
  facebook: "https://www.facebook.com/share/1CevJ8w7hK/?mibextid=wwXIfr",
  email: "mailto:contact@novamente.ar"
} as const

// Internal navigation paths
export const INTERNAL_LINKS = {
  home: "/",
  products: "/products",
  styles: "/styles",
  merch: "/merch",
  merchs: "/merchs", // B2B landing
  cart: "/cart",
  generator: GENERATOR_URL
} as const

// Validate required environment variables
if (process.env.NODE_ENV === "production") {
  const required = ["NEXT_PUBLIC_WHATSAPP_URL", "NEXT_PUBLIC_GENERATOR_URL"]
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}
