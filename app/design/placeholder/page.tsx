import { Suspense } from "react"
import { DesignCustomizer } from "@/components/DesignCustomizer"

export default function PlaceholderPage({ searchParams }: { searchParams: { image?: string; imageUrl?: string } }) {
  const raw = searchParams?.image || searchParams?.imageUrl || ""
  const initialImageUrl = raw
    ? raw.includes("oaidalleapiprodscus.blob.core.windows.net")
      ? `/api/proxy-image?url=${encodeURIComponent(raw)}`
      : raw
    : ""

  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <DesignCustomizer initialImageUrl={initialImageUrl} />
    </Suspense>
  )
}
