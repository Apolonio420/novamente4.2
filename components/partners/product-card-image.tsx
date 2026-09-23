'use client'

import Image from 'next/image'
import { useState } from 'react'

const IMG_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'

/**
 * Imagen de la card de producto en el storefront /p/[slug].
 * Si el producto tiene una 2ª imagen (por convención = dorso), la revela:
 *  - Desktop: al hacer hover (crossfade, CSS puro vía el `.group` del <Link> padre).
 *  - Touch: con dos puntitos (frente/dorso) — el hover no existe en mobile.
 * Con una sola imagen se comporta EXACTAMENTE igual que antes (sin overlay ni puntitos).
 */
export function ProductCardImage({
  images,
  alt,
}: {
  images: string[]
  alt: string
}) {
  const front = images[0]
  const back = images.length > 1 ? images[1] : null
  const [showBack, setShowBack] = useState(false)

  // Fondo claro fijo detrás de la imagen: los PNG con alpha (remeras oscuras
  // sobre fondo transparente) quedaban "flotando" sobre la card oscura del
  // storefront (bg-zinc-900/bg-zinc-800) — auditoría, click-online y otros.
  const bg = 'bg-zinc-100'

  // Un solo lado: markup casi idéntico al original, solo se agrega el fondo.
  if (!back) {
    return (
      <div className={`absolute inset-0 ${bg}`}>
        <Image
          src={front}
          alt={alt}
          fill
          sizes={IMG_SIZES}
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
    )
  }

  return (
    <div className={`absolute inset-0 ${bg}`}>
      <Image
        src={front}
        alt={alt}
        fill
        sizes={IMG_SIZES}
        className={`object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-0 ${
          showBack ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <Image
        src={back}
        alt={`${alt} — dorso`}
        fill
        sizes={IMG_SIZES}
        className={`object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-100 ${
          showBack ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Puntitos frente/dorso — solo en dispositivos sin hover (touch). */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center gap-2 [@media(hover:hover)]:hidden">
        {[false, true].map((isBack) => (
          <button
            key={String(isBack)}
            type="button"
            aria-label={isBack ? 'Ver dorso' : 'Ver frente'}
            aria-pressed={showBack === isBack}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowBack(isBack)
            }}
            className="pointer-events-auto -m-1 p-1.5"
          >
            <span
              className={`block h-1.5 w-1.5 rounded-full transition ${
                showBack === isBack ? 'bg-white' : 'bg-white/50'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
