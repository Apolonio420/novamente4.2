import { Suspense } from "react"
import { ImageGenerator } from "@/components/ImageGenerator"
import { ImageHistory } from "@/components/ImageHistory"
import { StyleGallery } from "@/components/StyleGallery"
import { ImagePreloader } from "@/components/ImagePreloader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Zap, Shirt, Star, Sparkles, Palette, Wand2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getUserImages } from "@/lib/db"
import { cookies } from "next/headers"
import { getCurrentUser, checkGenerationLimit, setupImageRetentionPolicy } from "@/lib/auth"
import { ScrollButton } from "@/components/scroll-button"

// Marcamos esta página como dinámica para asegurar que siempre se obtengan los datos más recientes
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Home() {
  // Ejecutar la política de retención de imágenes (eliminar imágenes de más de 15 días)
  await setupImageRetentionPolicy()

  // Obtener el store de cookies
  const cookieStore = cookies()

  let user = null
  try {
    user = await getCurrentUser()
  } catch (error) {
    console.error("Error getting current user:", error)
    // Continuar sin usuario si hay error
  }

  // Obtener el ID de sesión
  const sessionId = cookieStore.get("novamente_session_id")?.value

  // Obtener el conteo de generaciones para usuarios no autenticados
  let generationCount = 0
  if (!user && sessionId) {
    try {
      const { count } = await checkGenerationLimit(sessionId)
      generationCount = count
    } catch (error) {
      console.error("Error checking generation limit:", error)
      // Continuar con count = 0 si hay un error
    }
  }

  // Use try/catch to handle any potential errors with fetching images
  let recentImages = []
  try {
    // Si el usuario está autenticado, obtener sus imágenes
    // Si no, obtener las imágenes de la sesión actual
    if (user) {
      recentImages = await getUserImages(user.id)
    } else {
      recentImages = await getUserImages() // Sin userId para usuarios anónimos
    }
    console.log("Server-side fetched images:", recentImages.length)
  } catch (error) {
    console.error("Error fetching recent images:", error)
    // Continue with empty array if there's an error
  }

  // Imágenes críticas para preload
  const criticalImages = [
    "/novamente-logo.png",
    "/products/hoodie-negro-front.jpeg",
    "/products/aura-tshirt-blanco-front.jpeg",
    "/products/hoodie-caramel-front.jpeg",
  ]

  return (
    <div>
      {/* Precargar imágenes críticas */}
      <ImagePreloader images={criticalImages} priority />

      {/* Hero Section con estética de Novamente */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 py-20 bg-novamente-black">
        <div className="absolute inset-0 bg-gradient-to-b from-novamente-blue/10 to-novamente-magenta/10 opacity-30"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="novamente-heading text-lg md:text-xl mb-4 text-white/80">CREÁ TU ESTILO ÚNICO</h2>
          <h1 className="text-5xl md:text-7xl font-light tracking-[0.2em] mb-8">
            <span className="novamente-gradient-text">novamente</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-12">
            La primera marca de indumentaria que te permite crear tu diseño, tu moda, tu estilo.
            <br />
            <span className="italic">Hecho por vos, para vos.</span>
          </p>

          {/* Botones actualizados */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <ScrollButton className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 transition-colors">
              <Zap className="h-5 w-5" />
              Empezar a Diseñar
            </ScrollButton>
            <Link href="/products">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-black bg-transparent"
              >
                <Shirt className="mr-2 h-5 w-5" />
                Ver Productos
              </Button>
            </Link>
          </div>

          {/* Stats más pequeñas con nueva estadística */}
          <div className="flex justify-center gap-8 pt-4">
            <div>
              <div className="text-lg font-bold text-white">1.2K+</div>
              <div className="text-sm text-white/60">Diseños creados</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">95+</div>
              <div className="text-sm text-white/60">Clientes satisfechos</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-white">
                4.8 <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="text-sm text-white/60">Rating promedio</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo Funciona - de v88 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">¿CÓMO FUNCIONA?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Tres pasos simples para crear tu prenda personalizada con inteligencia artificial
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Palette className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">1. Describí tu idea</h3>
                <p className="text-muted-foreground">
                  Contanos qué querés en tu diseño. Podés ser tan específico o creativo como quieras.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wand2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">2. IA genera tu diseño</h3>
                <p className="text-muted-foreground">
                  Nuestra inteligencia artificial crea un diseño único basado en tu descripción.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shirt className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">3. Elegí tu prenda</h3>
                <p className="text-muted-foreground">
                  Seleccioná el producto que más te guste y personalizá la posición de tu diseño.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Generador de Imágenes */}
      <section id="generator" className="py-20 px-4 bg-gradient-to-b from-novamente-black to-background">
        <div className="container mx-auto">
          <h2 className="novamente-heading text-3xl md:text-4xl mb-12 text-center">GENERADOR DE DISEÑOS</h2>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-lg border border-white/10">
            <Suspense fallback={<div className="h-96 w-full bg-muted/30 animate-pulse rounded-lg"></div>}>
              <ImageGenerator initialGenerationCount={generationCount} isAuthenticated={!!user} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Diseños Recientes - con scroll al generador */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="mb-12">
            <h2 className="novamente-heading text-3xl">TUS DISEÑOS RECIENTES</h2>
          </div>
          <Suspense fallback={<div className="h-64 w-full bg-muted/30 animate-pulse rounded-lg"></div>}>
            <ImageHistory images={recentImages} scrollToGenerator={true} />
          </Suspense>
        </div>
      </section>

      {/* Explorar Estilos - LIMITADO A 4 IMÁGENES */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">EXPLORÁ NUESTROS ESTILOS</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Descubrí una variedad de estilos artísticos diseñados para inspirar tus creaciones
            </p>
          </div>

          <StyleGallery limit={4} simplified={true} directToCustomization={true} />

          <div className="text-center mt-12">
            <Link href="/styles">
              <Button size="lg" variant="outline">
                Ver Más Estilos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Productos Preview - botones van a /design */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="novamente-heading text-3xl md:text-4xl mb-4">PRODUCTOS PREMIUM</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Prendas de alta calidad, perfectas para tus diseños personalizados
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Hoodie Preview */}
            <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
              <Link href="/design" className="block">
                <div className="aspect-square relative overflow-hidden cursor-pointer">
                  <Image
                    src="/products/hoodie-negro-front.jpeg"
                    alt="Astra Oversize Hoodie"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />

                  {/* Overlay sutil al hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                        <Palette className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Badge de disponibilidad */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-500 text-white">Disponible</Badge>
                  </div>

                  {/* Badge de categoría */}
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm border-primary text-primary font-medium"
                    >
                      Hoodies
                    </Badge>
                  </div>
                </div>
              </Link>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold leading-tight">Astra Oversize Hoodie</h2>
                  <span className="text-2xl font-bold text-primary ml-4">$55.500</span>
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  Buzo oversize premium en algodón 100%, ideal para estampados DTG de alta calidad.
                </p>

                {/* Botón personalizar - va a /design */}
                <div className="flex gap-2">
                  <Link href="/design" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium rounded-xl py-3 px-6 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Personalizar Ahora
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* T-Shirt Preview */}
            <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
              <Link href="/design" className="block">
                <div className="aspect-square relative overflow-hidden cursor-pointer">
                  <Image
                    src="/products/aura-tshirt-blanco-front.jpeg"
                    alt="Aura Oversize T-Shirt"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />

                  {/* Overlay sutil al hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                        <Palette className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Badge de disponibilidad */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-500 text-white">Disponible</Badge>
                  </div>

                  {/* Badge de categoría */}
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm border-primary text-primary font-medium"
                    >
                      T-Shirts
                    </Badge>
                  </div>
                </div>
              </Link>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold leading-tight">Aura Oversize T-Shirt</h2>
                  <span className="text-2xl font-bold text-primary ml-4">$37.000</span>
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  Remera oversize en algodón peinado, base perfecta para diseños vibrantes.
                </p>

                {/* Botón personalizar - va a /design */}
                <div className="flex gap-2">
                  <Link href="/design" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium rounded-xl py-3 px-6 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Personalizar Ahora
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Canvas Preview */}
            <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
              <Link href="/design" className="block">
                <div className="aspect-square relative overflow-hidden cursor-pointer">
                  <Image
                    src="/products/lienzo-main.png"
                    alt="Lienzo Premium"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />

                  {/* Overlay sutil al hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                        <Palette className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Badge de disponibilidad */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-500 text-white">Disponible</Badge>
                  </div>

                  {/* Badge de categoría */}
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm border-primary text-primary font-medium"
                    >
                      Arte
                    </Badge>
                  </div>
                </div>
              </Link>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold leading-tight">Lienzo Premium</h2>
                  <span className="text-2xl font-bold text-primary ml-4">$59.900</span>
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  Obra impresa en lienzo textil, perfecta para decorar con tu arte personalizado.
                </p>

                {/* Botón personalizar - va a /design */}
                <div className="flex gap-2">
                  <Link href="/design" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium rounded-xl py-3 px-6 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Personalizar Ahora
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg">
                Ver Catálogo Completo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - de v88 */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="novamente-heading text-3xl md:text-4xl mb-4">¿LISTO PARA CREAR?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Empezá ahora y creá tu primera prenda personalizada con inteligencia artificial
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ScrollButton className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 transition-colors">
              <Sparkles className="h-5 w-5" />
              Crear Mi Diseño
            </ScrollButton>
            <Link href="https://wa.me/message/DRWR3O2HZY2JG1" target="_blank">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary bg-transparent"
              >
                Contactar por WhatsApp
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
