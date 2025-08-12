import { Suspense } from "react"
import { DesignPageClient } from "./DesignPageClient"

interface PageProps {
  params: {
    imageId: string
  }
}

export default function DesignPage({ params }: PageProps) {
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
      <DesignPageClient imageId={params.imageId} />
    </Suspense>
  )
}
