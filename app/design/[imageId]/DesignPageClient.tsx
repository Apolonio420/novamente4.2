"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface DesignPageClientProps {
  imageId: string
}

export function DesignPageClient({ imageId }: DesignPageClientProps) {
  const [imageData, setImageData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadImage = async () => {
      try {
        console.log("🔍 Loading image for ID:", imageId)

        // Try to fetch from API first
        console.log("📡 Fetching temporary image from API...")
        const response = await fetch(`/api/temp-image?id=${imageId}`)

        if (response.ok) {
          const data = await response.json()
          console.log("✅ Image data loaded:", data)
          setImageData(data)

          // Redirect to placeholder page with the image URL
          const encodedUrl = encodeURIComponent(data.imageUrl)
          router.push(`/design/placeholder?imageUrl=${encodedUrl}`)
          return
        } else {
          console.log("❌ API response not ok:", response.status)
        }

        // If API fails, redirect to placeholder without image
        console.log("🔄 Redirecting to placeholder page...")
        router.push("/design/placeholder")
      } catch (error) {
        console.error("❌ Error loading image:", error)
        setError("Error al cargar la imagen")

        // Fallback: redirect to placeholder
        router.push("/design/placeholder")
      } finally {
        setLoading(false)
      }
    }

    if (imageId) {
      loadImage()
    }
  }, [imageId, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando diseño...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href="/design">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Generador
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // This component will redirect, so we don't need to render anything
  return null
}
