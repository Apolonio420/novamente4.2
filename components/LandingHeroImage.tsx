/**
 * LandingHeroImage — banner image reutilizable para landings programáticas SEO.
 *
 * Va dentro del <section> hero, entre el badge y el h1 (no toca H1 ni copy SEO).
 * Aspect 16:9 desktop / 4:3 mobile. Gradiente abajo para legibilidad si hay overlay.
 *
 * Uso: pasarle solo `src` + `alt`. El parent aporta el resto del hero (badge, h1, CTAs).
 */
import Image from "next/image"

interface LandingHeroImageProps {
  src: string
  alt: string
  /** Si true, prioriza la carga (usar solo en above-the-fold) */
  priority?: boolean
  /** Aspect ratio override. Default 'aspect-[4/3] sm:aspect-[16/9]' */
  aspectClass?: string
  /** Container max-width and margin override. Default 'max-w-3xl mx-auto' */
  className?: string
}

export function LandingHeroImage({
  src,
  alt,
  priority = true,
  aspectClass = "aspect-[4/3] sm:aspect-[16/9]",
  className = "max-w-3xl mx-auto",
}: LandingHeroImageProps) {
  return (
    <div
      className={`relative ${aspectClass} ${className} mb-8 w-full overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900 shadow-2xl shadow-black/50`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        priority={priority}
        className="object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
    </div>
  )
}
