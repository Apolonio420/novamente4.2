import type { Metadata } from "next"
import PartnersPage from "../partners/page"

/**
 * /studio — Hub canonico de Novamente Studio (PR 6 re-arquitectura).
 *
 * Reusa el contenido de /partners para evitar duplicacion de codigo, pero con
 * metadata propia (canonical /studio, OG distinto).
 *
 * Estrategia SEO/GEO (ver docs/seo/REARQUITECTURA-2026-05.md):
 * - /studio nace con canonical propio para empezar a construir equidad
 * - /partners SIGUE como pagina viva con su canonical original
 * - Ambas URLs coexisten ~14 dias de aclimatacion para que Google las indexe
 * - PR 8 (despues de monitoreo GSC) hara 301 /partners -> /studio
 *
 * No es un redirect — sirve el HTML completo bajo su propia URL, lo que
 * permite a Google empezar a indexar /studio sin perder /partners.
 */
export const metadata: Metadata = {
  title: "Novamente Studio — Lanzá tu marca con storefront, IA y growth",
  description:
    "Novamente Studio es la plataforma para que marcas, creadores y negocios lancen su tienda online con storefront propio, diseño con IA, producción on-demand y growth comercial. Empezá gratis con plan Starter, escalá a Growth USD$50/mes con prendas a costo + $1.000 ARS, o Pro USD$100/mes con chatbot y automatización de contenido.",
  alternates: { canonical: "https://www.novamente.ar/studio" },
  openGraph: {
    title: "Novamente Studio — Storefront + IA + Growth para tu marca",
    description:
      "Lanzá tu marca con tienda propia, diseño con IA y producción sin stock. Planes desde gratis hasta USD$100/mes con chatbot y automatización de contenido.",
    url: "https://www.novamente.ar/studio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Novamente Studio — Lanzá tu marca",
    description:
      "Storefront, diseño con IA y producción on-demand. Starter gratis · Growth USD$50 · Pro USD$100.",
  },
}

export default PartnersPage
