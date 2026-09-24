'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const IMG_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
const CROSSFADE_MS = 3500
// Tope de fotos que rota una card: frente, dorso y hasta 2 extras (lifestyle,
// fotos del partner). Más que eso es peso de más para una grilla.
const MAX_CARD_FRAMES = 4

function frameLabel(i: number) {
  return i === 0 ? 'Frente' : i === 1 ? 'Dorso' : 'Foto'
}

/**
 * Imagen de la card de producto en el storefront /p/[slug].
 *
 * Fase 3 pieza E1: toda card con más de una foto rota SOLA entre ellas
 * (fundido CSS, ~3.5s) — frente, dorso y las extras (lifestyle / fotos del
 * partner) — para que el cliente las vea sin tener que entrar al producto.
 * Se pausa con el mouse encima o con foco de teclado. Con
 * `prefers-reduced-motion: reduce` no anima: muestra el frente fijo y un
 * botón chico para pasar a la siguiente foto a pedido.
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
  const frames = images.filter((u, i) => u && images.indexOf(u) === i).slice(0, MAX_CARD_FRAMES)
  const count = frames.length
  const [active, setActive] = useState(0)
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
    if (count < 2 || paused || reducedMotion) return
    const next = () => setActive((v) => (v + 1) % count)
    let interval: ReturnType<typeof setInterval> | null = null
    const timeout = setTimeout(() => {
      next()
      interval = setInterval(next, CROSSFADE_MS)
    }, startDelay.current)
    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [count, paused, reducedMotion])

  // Fondo claro fijo detrás de la imagen: los PNG con alpha (remeras oscuras
  // sobre fondo transparente) quedaban "flotando" sobre la card oscura del
  // storefront (bg-zinc-900/bg-zinc-800) — auditoría, click-online y otros.
  const bg = 'bg-zinc-100'

  // Una sola foto: markup casi idéntico al original, solo se agrega el fondo.
  if (count < 2) {
    return (
      <div className={`absolute inset-0 ${bg}`}>
        <Image
          src={frames[0]}
          alt={alt}
          fill
          sizes={IMG_SIZES}
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
    )
  }

  // Con reduced-motion: frente fijo + un botón chico para pasar de foto,
  // sin animación automática (pedido explícito de la pieza E1).
  if (reducedMotion) {
    const nextIdx = (active + 1) % count
    return (
      <div className={`absolute inset-0 ${bg}`}>
        <Image
          key={frames[active]}
          src={frames[active]}
          alt={active === 0 ? alt : `${alt} — ${frameLabel(active).toLowerCase()}`}
          fill
          sizes={IMG_SIZES}
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <button
          type="button"
          aria-label={`Ver ${frameLabel(nextIdx).toLowerCase()}`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setActive(nextIdx)
          }}
          className="absolute bottom-2 right-2 z-10 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white"
        >
          {frameLabel(nextIdx)}
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
      {frames.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={i === 0 ? alt : `${alt} — ${frameLabel(i).toLowerCase()}`}
          fill
          sizes={IMG_SIZES}
          className={`object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105 ${
            active === i ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Indicador discreto — visible siempre, no solo en touch. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5">
        {frames.map((src, i) => (
          <span key={src} className="-m-1 p-1.5" aria-hidden="true">
            <span
              className={`block h-1.5 w-1.5 rounded-full transition ${
                active === i ? 'bg-white' : 'bg-white/50'
              }`}
            />
          </span>
        ))}
        <span className="sr-only">Mostrando {frameLabel(active).toLowerCase()}</span>
      </div>
    </div>
  )
}
