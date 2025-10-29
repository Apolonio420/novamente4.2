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
  const items = [...MERCHS_GALLERY, ...MERCHS_GALLERY]

  return (
    <section aria-label="Galería de merch" className="mx-auto w-full max-w-6xl px-4 md:px-6">
      <div className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 ${heightClass}`}>
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
                alt={(img as any).alt ?? "NovaMente merch"}
                fill
                sizes="(max-width: 768px) 70vw, (max-width: 1280px) 40vw, 33vw"
                className="object-cover"
                priority={i < 3}
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
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-zinc-950/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-zinc-950/80 to-transparent" />
      </div>
    </section>
  )
}

function getItemSize(orientation?: "portrait" | "landscape") {
  if (orientation === "portrait") return "aspect-[3/4] w-36 md:w-44 lg:w-56"
  if (orientation === "landscape") return "aspect-[16/9] w-56 md:w-72 lg:w-96"
  return "aspect-[4/5] w-44 md:w-56 lg:w-72"
}


