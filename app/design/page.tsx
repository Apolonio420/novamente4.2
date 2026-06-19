// @ts-nocheck
import type { Metadata } from "next"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { ImageHistoryProvider } from "@/contexts/ImageHistoryContext"

const ImageGenerator = dynamic(() => import("@/components/ImageGenerator").then(m => m.ImageGenerator), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p>Cargando diseñador...</p>
      </div>
    </div>
  ),
})

export const metadata: Metadata = {
  title: "Diseñá tu ropa con IA — Generador de Diseños",
  description: "Creá diseños únicos para remeras, hoodies y buzos usando inteligencia artificial. 37 estilos artísticos, resultado en segundos.",
  openGraph: {
    title: "Generador de Diseños con IA — Novamente",
    description: "Diseñá tu prenda personalizada en minutos con IA.",
    url: "https://www.novamente.ar/crear",
  },
  twitter: {
    card: "summary_large_image",
    title: "Generador de Diseños con IA — Novamente",
    description: "Diseñá tu prenda personalizada en minutos con IA.",
  },
  alternates: { canonical: "https://www.novamente.ar/crear" },
}

export default function DesignRootPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Cargando diseño...</p>
            </div>
          </div>
        </div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        <ImageHistoryProvider>
          <ImageGenerator />
        </ImageHistoryProvider>
      </div>
    </Suspense>
  )
}
