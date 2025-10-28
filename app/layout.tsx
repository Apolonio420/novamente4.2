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
  title: { default: "Tienda Oficial de NovaMente", template: "%s · NovaMente" },
  description:
    "Creá tu estilo único con IA. Prendas personalizadas on-demand: elegí prenda, color y tamaño, generá tu diseño y recibilo en tu casa.",
  openGraph: {
    type: "website",
    url: "https://www.novamente.ar/",
    title: "NovaMente · Moda personalizada con IA",
    description: "Generá diseños únicos y estampos on-demand. Sin stock muerto.",
    images: [{ url: "/novamente-logo.png", width: 1200, height: 630, alt: "NovaMente" }],
    siteName: "NovaMente",
  },
  twitter: {
    card: "summary_large_image",
    title: "NovaMente · Moda personalizada con IA",
    description: "Creá y estampá tu propio diseño. On-demand.",
    images: ["/novamente-logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: { canonical: "https://www.novamente.ar/" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://api.openai.com" crossOrigin="" />
        <link rel="preconnect" href="https://api.remove.bg" crossOrigin="" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://novamente.4508cc283d34b79746e7b0a6e7c61f16.r2.cloudflarestorage.com" />
      </head>
      <body className={`min-h-screen bg-zinc-950 text-zinc-100 ${inter.className}`}>
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
