import Image from "next/image"
import Link from "next/link"

interface StoreFooterProps {
  name: string
  slug: string
  logo: string | null
  slogan: string | null
  instagram: string | null
  website: string | null
}

/** Footer propio de la tienda del partner. */
export function StoreFooter({ name, slug, logo, slogan, instagram, website }: StoreFooterProps) {
  const igHref = instagram
    ? instagram.startsWith("http")
      ? instagram
      : `https://instagram.com/${instagram.replace("@", "")}`
    : null

  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 text-center">
        {logo && (
          <Image
            src={logo}
            alt={name}
            width={56}
            height={56}
            className="object-contain mx-auto mb-3"
          />
        )}
        <p className="text-lg font-semibold tracking-wide">{name}</p>
        {slogan && <p className="text-sm text-white/60 mt-1">{slogan}</p>}

        <div className="flex items-center justify-center gap-5 mt-5 text-sm text-white/70">
          <Link href={`/merch/${slug}`} className="hover:text-white transition-colors">
            Tienda
          </Link>
          {igHref && (
            <a href={igHref} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              Instagram
            </a>
          )}
          {website && (
            <a href={website} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              Web
            </a>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-xs text-white/40">
          <p>
            Producción y envíos por{" "}
            <a href="https://www.novamente.ar" className="underline hover:text-white/70" target="_blank" rel="noreferrer">
              Novamente
            </a>{" "}
            · prendas premium estampadas on-demand en Argentina
          </p>
          <p className="mt-2">
            <a href="https://www.novamente.ar/lanza-tu-marca" className="hover:text-white/70" target="_blank" rel="noreferrer">
              ¿Querés tu propia tienda como esta? Creala gratis →
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
