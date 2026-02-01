import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Toaster } from "@/components/Toaster"
import { WhatsAppButton } from "@/components/WhatsAppButton"
import { ImageHistoryProvider } from "@/contexts/ImageHistoryContext"
import { Background } from "@/components/ui/Background"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL("https://www.novamente.ar"),
  title: { default: "Novamente | Ropa personalizada con IA", template: "%s · Novamente" },
  description:
    "Diseñá tu prenda en minutos: elegí modelo, color y estampa generada con IA. Envíos a todo el país y drops on-demand. Tu diseño, tu estilo.",
  openGraph: {
    type: "website",
    url: "https://www.novamente.ar/",
    title: "Novamente | Ropa personalizada con IA",
    description: "Diseñá tu prenda en minutos: elegí modelo, color y estampa generada con IA. Envíos a todo el país y drops on-demand. Tu diseño, tu estilo.",
    images: [{ url: "https://www.novamente.ar/novamente-logo.png", width: 1200, height: 630, alt: "Logo Novamente" }],
    siteName: "Novamente",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Novamente | Ropa personalizada con IA",
    description: "Diseñá tu prenda en minutos: elegí modelo, color y estampa generada con IA. Envíos a todo el país y drops on-demand. Tu diseño, tu estilo.",
    images: ["https://www.novamente.ar/novamente-logo.png"],
  },
  icons: {
    icon: [
      { url: "/logo.png?v=3", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo.png?v=3",
    apple: "/logo.png?v=3",
  },
  alternates: { canonical: "https://www.novamente.ar/" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.openai.com" crossOrigin="" />
        <link rel="preconnect" href="https://api.remove.bg" crossOrigin="" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" crossOrigin="" />
      </head>
      <body className={`min-h-screen bg-zinc-950 text-zinc-100 ${inter.className}`} suppressHydrationWarning>
        <Background />
        <ImageHistoryProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
          <WhatsAppButton />
        </ImageHistoryProvider>
      </body>
    </html>
  )
}
