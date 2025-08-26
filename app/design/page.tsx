import { Suspense } from "react"
import { ImageGenerator } from "@/components/ImageGenerator"
import { ImageHistoryProvider } from "@/contexts/ImageHistoryContext"

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
