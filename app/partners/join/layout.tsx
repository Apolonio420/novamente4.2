import type { Metadata } from "next"

// /partners/join es un client component, así que su metadata vive acá.
// Sin este layout heredaba el canonical de app/layout.tsx (la home) y Google
// la descartaba como duplicada de la home aunque esté en el sitemap
// (GSC: "Página alternativa con etiqueta canónica adecuada", 16/09/2026).
export const metadata: Metadata = {
  title: "Creá tu tienda de merch · Novamente",
  description:
    "Sumate como partner de Novamente: tienda propia, catálogo con tus diseños, producción a pedido y envíos a todo el país. Sin stock ni inversión inicial.",
  openGraph: {
    type: "website",
    url: "https://www.novamente.ar/partners/join",
    title: "Creá tu tienda de merch · Novamente",
    description:
      "Tienda propia con tus diseños, producción a pedido y envíos a todo el país. Sin stock ni inversión inicial.",
    siteName: "Novamente",
    locale: "es_AR",
    images: [
      {
        url: "https://www.novamente.ar/novamente-logo.png",
        width: 1200,
        height: 630,
        alt: "Novamente para marcas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Creá tu tienda de merch · Novamente",
    description: "Tienda propia con tus diseños, producción a pedido y envíos a todo el país.",
    images: ["https://www.novamente.ar/novamente-logo.png"],
  },
  alternates: {
    canonical: "https://www.novamente.ar/partners/join",
  },
}

export default function PartnersJoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
