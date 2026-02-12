"use client"

import Image from "next/image"
import React, { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { MERCHS_GALLERY } from "@/lib/merchsGallery"

type Props = {
  heightClass?: string
  gapClass?: string
  pauseOnHover?: boolean
  speedSec?: number
}

export default function AutoScrollGallery({
  heightClass = "h-64 md:h-80 lg:h-96",
  gapClass = "gap-3 md:gap-4 lg:gap-5",
  pauseOnHover = true,
  speedSec = 38,
}: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)

  // Cache-busting simple para forzar el refresco cuando se actualizan las imágenes del carrusel
  const VERSION = "merch-20251030"

  const base = MERCHS_GALLERY.map((x) => {
    const srcNormalized = x.src.startsWith("/merchs/") ? x.src : `/merchs/${x.src.replace(/^\//, "")}`
    const hasQuery = srcNormalized.includes("?")
    const srcWithVersion = `${srcNormalized}${hasQuery ? "&" : "?"}v=${VERSION}`
    return { ...x, src: srcWithVersion }
  })

  const items = [...base, ...base]

  // Verificar si se puede hacer scroll
  const checkScrollability = () => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const { scrollLeft, scrollWidth, clientWidth } = container

    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }

  // Scroll manual hacia la izquierda
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollAmount = container.clientWidth * 0.8
    container.scrollBy({ left: -scrollAmount, behavior: "smooth" })
    setIsAutoScrolling(false)

    // Reanudar auto-scroll después de un tiempo
    setTimeout(() => setIsAutoScrolling(true), 3000)
  }

  // Scroll manual hacia la derecha
  const scrollRight = () => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollAmount = container.clientWidth * 0.8
    container.scrollBy({ left: scrollAmount, behavior: "smooth" })
    setIsAutoScrolling(false)

    // Reanudar auto-scroll después de un tiempo
    setTimeout(() => setIsAutoScrolling(true), 3000)
  }

  // Manejar scroll con rueda del mouse
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return

    e.preventDefault()
    const container = scrollContainerRef.current
    container.scrollBy({ left: e.deltaY, behavior: "auto" })
    setIsAutoScrolling(false)

    // Reanudar auto-scroll después de un tiempo
    setTimeout(() => setIsAutoScrolling(true), 3000)
  }

  // Auto-scroll cuando está habilitado
  useEffect(() => {
    if (!isAutoScrolling || !scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const halfWidth = container.scrollWidth / 2 // Como duplicamos los items, la mitad es el punto de reinicio

    let animationFrameId: number
    let lastTimestamp = performance.now()
    const pixelsPerSecond = (container.scrollWidth / 2) / speedSec // Velocidad basada en el ancho total

    const animate = (timestamp: number) => {
      if (!isAutoScrolling || !scrollContainerRef.current) return

      const delta = timestamp - lastTimestamp
      lastTimestamp = timestamp

      if (container) {
        container.scrollLeft += (pixelsPerSecond * delta) / 1000

        // Si llegamos a la mitad (fin del primer conjunto duplicado), reiniciamos suavemente
        if (container.scrollLeft >= halfWidth - 10) {
          container.scrollLeft = 0
        }
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isAutoScrolling, speedSec])

  // Verificar scrollability cuando cambia el tamaño o el contenido
  useEffect(() => {
    checkScrollability()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScrollability)
      window.addEventListener("resize", checkScrollability)

      return () => {
        container.removeEventListener("scroll", checkScrollability)
        window.removeEventListener("resize", checkScrollability)
      }
    }
  }, [])

  return (
    <section aria-label="Galería de merch" className="mx-auto w-full px-4 md:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50" style={{ position: 'relative', height: 'clamp(15rem, 30vw, 24rem)' }}>
        {/* Botón de scroll izquierdo - flecha transparente */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            aria-label="Scroll izquierda"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full transition-all duration-200 hover:bg-white/20 active:bg-white/30 group"
          >
            <ChevronLeft className="h-8 w-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          </button>
        )}

        {/* Botón de scroll derecho - flecha transparente */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            aria-label="Scroll derecha"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full transition-all duration-200 hover:bg-white/20 active:bg-white/30 group"
          >
            <ChevronRight className="h-8 w-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          </button>
        )}

        {/* Contenedor con scroll manual */}
        <div
          ref={scrollContainerRef}
          className={`absolute inset-0 flex ${gapClass} overflow-x-auto overflow-y-hidden scrollbar-hide`}
          onWheel={handleWheel}
          onMouseEnter={() => {
            if (pauseOnHover) {
              setIsAutoScrolling(false)
            }
          }}
          onMouseLeave={() => {
            if (pauseOnHover) {
              setIsAutoScrolling(true)
            }
          }}
        >
          {items.map((img, i) => (
            <figure key={`${img.src}-${i}`} className={`relative shrink-0 ${getItemSize((img as any).orientation)} overflow-hidden rounded-xl`}>
              <Image
                src={img.src}
                alt={(img as any).alt ?? "Novamente merch"}
                fill
                sizes="(max-width: 768px) 70vw, (max-width: 1280px) 40vw, 33vw"
                className="object-cover"
                priority={i < 3}
                unoptimized={process.env.NODE_ENV === "development"}
                onError={(e) => {
                  const el = (e.currentTarget as unknown) as HTMLImageElement & { dataset: { triedJpg?: string } }
                  if (!el.dataset.triedJpg && el.src.endsWith(".webp")) {
                    el.dataset.triedJpg = "1"
                    el.src = el.src.replace(".webp", ".jpg")
                  }
                }}
                {...(i < 3
                  ? {
                    placeholder: "blur" as const,
                    blurDataURL:
                      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1hX9EAAAAASUVORK5CYII=",
                  }
                  : {})}
              />
            </figure>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent" />
      </div>
    </section>
  )
}

function getItemSize(orientation?: "portrait" | "landscape") {
  if (orientation === "portrait") return "aspect-[3/4] w-36 md:w-44 lg:w-56"
  if (orientation === "landscape") return "aspect-[16/9] w-56 md:w-72 lg:w-96"
  return "aspect-[4/5] w-44 md:w-56 lg:w-72"
}


