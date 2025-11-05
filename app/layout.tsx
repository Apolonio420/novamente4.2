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
  title: { default: "Novamente | Potenciá tu marca con merchandising sin inversión inicial", template: "%s · Novamente" },
  description:
    "Diseñá, lanzá y vendé tu línea de indumentaria con Novamente. Sin inversión inicial, sin complicaciones.",
  openGraph: {
    type: "website",
    url: "https://www.novamente.ar/",
    title: "Novamente",
    description: "Potenciá tu marca con merchandising sin inversión inicial.",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Logo Novamente" }],
    siteName: "Novamente",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Novamente",
    description: "Potenciá tu marca con merchandising sin inversión inicial.",
    images: ["/logo.png"],
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
