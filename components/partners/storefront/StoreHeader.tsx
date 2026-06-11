"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingBag, Instagram } from "lucide-react"
import { useCart } from "@/lib/cartStore"

interface StoreHeaderProps {
  name: string
  slug: string
  logo: string | null
  instagram: string | null
}

/**
 * Header propio de la tienda del partner (reemplaza al navbar de Novamente
 * dentro de /merch/[brand]). Sticky, con carrito en vivo.
 */
export function StoreHeader({ name, slug, logo, instagram }: StoreHeaderProps) {
  const items = useCart((s) => s.items)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const igHref = instagram
    ? instagram.startsWith("http")
      ? instagram
      : `https://instagram.com/${instagram.replace("@", "")}`
    : null

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-black/60 border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href={`/merch/${slug}`} className="flex items-center gap-2.5 min-w-0">
          {logo && (
            <Image
              src={logo}
              alt={name}
              width={32}
              height={32}
              className="object-contain rounded-sm shrink-0"
            />
          )}
          <span className="text-white font-semibold tracking-wide truncate">{name}</span>
        </Link>
        <div className="flex items-center gap-1">
          {igHref && (
            <a
              href={igHref}
              target="_blank"
              rel="noreferrer"
              aria-label={`Instagram de ${name}`}
              className="p-2.5 text-white/70 hover:text-white transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
          )}
          <Link
            href="/cart"
            aria-label="Carrito"
            className="relative p-2.5 text-white/85 hover:text-white transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: "var(--store-primary, #6366f1)" }}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
