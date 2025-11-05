"use client"

import Image from "next/image"
import React from "react"
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
  

  // Cache-busting simple para forzar el refresco cuando se actualizan las imágenes del carrusel
  const VERSION = "merch-20251030"

  const base = MERCHS_GALLERY.map((x) => {
    const srcNormalized = x.src.startsWith("/merchs/") ? x.src : `/merchs/${x.src.replace(/^\//, "")}`
    const hasQuery = srcNormalized.includes("?")
    const srcWithVersion = `${srcNormalized}${hasQuery ? "&" : "?"}v=${VERSION}`
    return { ...x, src: srcWithVersion }
  })

  const items = [...base, ...base]

  return (
    <section aria-label="Galería de merch" className="mx-auto w-full px-4 md:px-6 lg:px-8">
      <div className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 ${heightClass}`}>
        <div
          className={`absolute inset-0 flex ${gapClass} animate-marquee will-change-transform`}
          style={{ ["--marquee-duration" as any]: `${speedSec}s` }}
          onMouseEnter={(e) => {
            if (!pauseOnHover) return
            ;(e.currentTarget as HTMLDivElement).style.animationPlayState = "paused"
          }}
          onMouseLeave={(e) => {
            if (!pauseOnHover) return
            ;(e.currentTarget as HTMLDivElement).style.animationPlayState = "running"
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


