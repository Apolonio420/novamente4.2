'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const IMG_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
const CROSSFADE_MS = 3500

/**
 * Imagen de la card de producto en el storefront /p/[slug].
 *
 * Fase 3 pieza E1: toda card con frente+dorso alterna SOLA entre las dos
 * caras (fundido CSS, ~3.5s), para que el cliente sepa cómo es el dorso sin
 * tener que entrar al producto. Se pausa con el mouse encima o con foco de
 * teclado (mismo botón que ya mostraba el toggle en touch). Con
 * `prefers-reduced-motion: reduce` no anima: muestra el frente fijo y un
 * botón chico para mirar el dorso a pedido.
 *
 * El arranque de cada card se desfasa con un delay aleatorio para que la
 * grilla entera no titile sincronizada.
 */
export function ProductCardImage({
  images,
  alt,
}: {
  images: string[]
  alt: string
}) {
  const front = images[0]
  const back = images.length > 1 && images[1] !== images[0] ? images[1] : null
  const [showBack, setShowBack] = useState(false)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const startDelay = useRef(Math.random() * CROSSFADE_MS)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    if (!back || paused || reducedMotion) return
    let interval: ReturnType<typeof setInterval> | null = null
    const timeout = setTimeout(() => {
      setShowBack((v) => !v)
      interval = setInterval(() => setShowBack((v) => !v), CROSSFADE_MS)
    }, startDelay.current)
    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [back, paused, reducedMotion])

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

  // Con reduced-motion: frente fijo + un botón chico para mirar el dorso,
  // sin animación automática (pedido explícito de la pieza E1).
  if (reducedMotion) {
    const active = showBack ? back : front
    return (
      <div className={`absolute inset-0 ${bg}`}>
        <Image
          key={active}
          src={active}
          alt={showBack ? `${alt} — dorso` : alt}
          fill
          sizes={IMG_SIZES}
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <button
          type="button"
          aria-label={showBack ? 'Ver frente' : 'Ver dorso'}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowBack((v) => !v)
          }}
          className="absolute bottom-2 right-2 z-10 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white"
        >
          {showBack ? 'Frente' : 'Dorso'}
        </button>
      </div>
    )
  }

  return (
    <div
      className={`absolute inset-0 ${bg}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Image
        src={front}
        alt={alt}
        fill
        sizes={IMG_SIZES}
        className={`object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105 ${
          showBack ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <Image
        src={back}
        alt={`${alt} — dorso`}
        fill
        sizes={IMG_SIZES}
        className={`object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105 ${
          showBack ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Indicador discreto — visible siempre, no solo en touch. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5">
        {(['Frente', 'Dorso'] as const).map((label, i) => {
          const isBack = i === 1
          return (
            <button
              key={label}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none -m-1 p-1.5"
            >
              <span
                className={`block h-1.5 w-1.5 rounded-full transition ${
                  showBack === isBack ? 'bg-white' : 'bg-white/50'
                }`}
              />
            </button>
          )
        })}
        <span className="sr-only">{showBack ? 'Mostrando dorso' : 'Mostrando frente'}</span>
      </div>
    </div>
  )
}
