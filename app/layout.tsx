import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Toaster } from "@/components/Toaster"
import { WhatsAppButton } from "@/components/WhatsAppButton"
import { ImageHistoryProvider } from "@/contexts/ImageHistoryContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tienda Oficial de Novamente",
  description: "Creá tu estilo único con inteligencia artificial. Prendas personalizadas de alta calidad.",
  icons: {
    icon: "/novamente-logo.png",
    shortcut: "/novamente-logo.png",
    apple: "/novamente-logo.png",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
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
