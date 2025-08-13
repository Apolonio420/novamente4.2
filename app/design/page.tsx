"use client"

import { Suspense, useCallback } from "react"
import { ImageGenerator } from "@/components/ImageGenerator"
import { ImageHistory } from "@/components/ImageHistory"
import { StyleGallery } from "@/components/StyleGallery"
import { useEffect, useState } from "react"
import { Loader } from "lucide-react"

export default function DesignPage() {
  const [recentImages, setRecentImages] = useState([])
  const [generationCount, setGenerationCount] = useState(0)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener datos del usuario y generaciones con manejo de errores mejorado
        const response = await fetch("/api/user/session", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        let userData = { user: null }

        // Verificar si la respuesta es JSON válido
        if (response.ok) {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            userData = await response.json()
          }
        }

        if (userData.user) {
          setUser(userData.user)
          // Usuario autenticado - obtener imágenes desde la API
          try {
            const imagesResponse = await fetch("/api/images", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            })

            if (imagesResponse.ok) {
              const contentType = imagesResponse.headers.get("content-type")
              if (contentType && contentType.includes("application/json")) {
                const imagesData = await imagesResponse.json()
                setRecentImages(imagesData.images || [])
              }
            }
          } catch (error) {
            console.error("Error fetching images:", error)
            setRecentImages([])
          }
        } else {
          // Usuario no autenticado - verificar límite de generaciones
          const sessionId = document.cookie
            .split("; ")
            .find((row) => row.startsWith("novamente_session_id="))
            ?.split("=")[1]

          if (sessionId) {
            try {
              const limitResponse = await fetch("/api/user/generation-limit", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ sessionId }),
              })

              if (limitResponse.ok) {
                const contentType = limitResponse.headers.get("content-type")
                if (contentType && contentType.includes("application/json")) {
                  const limitData = await limitResponse.json()
                  setGenerationCount(limitData.count || 0)
                }
              }
            } catch (error) {
              console.error("Error fetching generation limit:", error)
              setGenerationCount(0)
            }

            // Obtener imágenes de la sesión
            try {
              const imagesResponse = await fetch("/api/images", {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              })

              if (imagesResponse.ok) {
                const contentType = imagesResponse.headers.get("content-type")
                if (contentType && contentType.includes("application/json")) {
                  const imagesData = await imagesResponse.json()
                  setRecentImages(imagesData.images?.slice(0, 6) || [])
                }
              }
            } catch (error) {
              console.error("Error fetching session images:", error)
              setRecentImages([])
            }
          }
        }
      } catch (error) {
        console.error("Error in fetchData:", error)
        // Establecer valores por defecto en caso de error
        setUser(null)
        setGenerationCount(0)
        setRecentImages([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [refreshKey])

  // Función para hacer scroll al generador
  const handleScrollToGenerator = () => {
    const generatorSection = document.getElementById("generator-section")
    if (generatorSection) {
      generatorSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  // Callback cuando se genera una nueva imagen
  const handleImageGenerated = useCallback((imageUrl: string) => {
    console.log("🔄 Image generated, refreshing history:", imageUrl)
    // Incrementar la key para forzar refresh del historial
    setRefreshKey((prev) => prev + 1)
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="container mx-auto px-4 py-12 flex-1 space-y-12">
        {/* Generador de imágenes */}
        <section id="generator-section">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Genera tu Diseño</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Describe tu idea y nuestra IA creará un diseño único para ti. Luego podrás aplicarlo a cualquier prenda.
            </p>
          </div>

          <Suspense fallback={<div className="h-96 w-full bg-muted/30 animate-pulse rounded-lg"></div>}>
            <ImageGenerator onImageGenerated={handleImageGenerated} isAuthenticated={!!user} />
          </Suspense>
        </section>

        {/* Sección de diseños */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground font-bold text-xl">
              2
            </div>
            <h2 className="novamente-heading text-3xl md:text-4xl">EXPLORAR DISEÑOS</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Historial de diseños del usuario */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Tus Diseños</h3>
              <Suspense fallback={<div className="h-64 w-full bg-muted/30 animate-pulse rounded-lg"></div>}>
                <ImageHistory
                  onImageSelect={(imageUrl) => {
                    console.log("🖼️ Image selected from history:", imageUrl)
                    // Redirigir a la página de diseño con la imagen seleccionada
                    window.location.href = `/design/placeholder?image=${encodeURIComponent(imageUrl)}`
                  }}
                  limit={6}
                />
              </Suspense>
            </div>

            {/* Galería de estilos base */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Estilos Inspiradores</h3>
              <Suspense fallback={<div className="h-64 w-full bg-muted/30 animate-pulse rounded-lg"></div>}>
                <StyleGallery
                  onStyleSelect={(styleUrl) => {
                    console.log("🎨 Style selected:", styleUrl)
                    // Redirigir a la página de diseño con el estilo seleccionado
                    window.location.href = `/design/placeholder?image=${encodeURIComponent(styleUrl)}`
                  }}
                  limit={6}
                />
              </Suspense>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
