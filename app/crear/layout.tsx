import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Diseñá tu prenda con IA",
  description:
    "Creá remeras, buzos y hoodies únicos con inteligencia artificial. Diseño en segundos, producción a pedido en Argentina, envío a todo el país.",
  keywords: [
    "diseño remera IA",
    "diseñar remera",
    "remera personalizada Argentina",
    "buzo personalizado",
    "merch a pedido",
    "print on demand argentina",
    "novamente",
    "diseñar con inteligencia artificial",
  ],
  openGraph: {
    type: "website",
    url: "https://www.novamente.ar/crear",
    title: "Diseñá tu prenda con IA · Novamente",
    description:
      "Creá remeras y buzos únicos con IA en minutos. Producción a pedido, envío a todo el país.",
    siteName: "Novamente",
    locale: "es_AR",
    images: [
      {
        url: "https://www.novamente.ar/og/crear-cover.png",
        width: 1200,
        height: 630,
        alt: "Diseñá tu remera con IA en Novamente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Diseñá tu prenda con IA · Novamente",
    description: "Creá remeras y buzos únicos con IA en minutos. Argentina.",
    images: ["https://www.novamente.ar/og/crear-cover.png"],
  },
  alternates: {
    canonical: "https://www.novamente.ar/crear",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
}

export default function CrearLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
