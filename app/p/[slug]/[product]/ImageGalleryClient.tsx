'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  images: string[]
  name: string
}

export default function ImageGalleryClient({ images, name }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const mainImage = images[activeIdx]

  return (
    <div className="flex flex-col gap-4">
      {/* Main image · clickable to open zoom modal */}
      <button
        type="button"
        onClick={() => mainImage && setZoomed(true)}
        className="relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 cursor-zoom-in group"
        aria-label={`Ampliar imagen ${activeIdx + 1}`}
      >
        {mainImage ? (
          <>
            <Image
              src={mainImage}
              alt={`${name} - imagen ${activeIdx + 1}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform group-hover:scale-[1.02]"
            />
            {images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md pointer-events-none">
                {activeIdx + 1} / {images.length}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-6xl text-zinc-700">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </button>

      {/* Thumbnails · clickables */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.slice(0, 4).map((img, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`relative aspect-square overflow-hidden rounded-lg border bg-zinc-900 transition-all cursor-pointer hover:scale-105 ${
                i === activeIdx ? 'border-[var(--partner-primary)] ring-2 ring-[var(--partner-primary)]/40' : 'border-zinc-800 hover:border-zinc-600'
              }`}
              aria-label={`Ver imagen ${i + 1}`}
            >
              <Image
                src={img}
                alt={`${name} ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 25vw, 12vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom modal */}
      {zoomed && mainImage && (
        <div
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute top-6 right-6 text-white/80 hover:text-white text-3xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
          <div className="relative w-full max-w-5xl aspect-square">
            <Image
              src={mainImage}
              alt={`${name} - ampliado`}
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === activeIdx ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
