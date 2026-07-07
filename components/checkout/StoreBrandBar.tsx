"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useCart } from "@/lib/cartStore"

/**
 * Barra de marca en carrito/checkout: si TODOS los items vienen de la misma
 * tienda partner, muestra su logo + nombre con su color y un link para seguir
 * comprando en esa tienda. Si el carrito mezcla tiendas (o es de Novamente),
 * no muestra nada.
 */
export function StoreBrandBar() {
  const items = useCart((s) => s.items)
  const branded = items.filter((i) => i.brandSlug && i.brandName)
  if (branded.length === 0 || branded.length !== items.length) return null
  const slugs = new Set(branded.map((i) => i.brandSlug))
  if (slugs.size !== 1) return null

  const { brandSlug, brandName, brandLogo, brandColor } = branded[0]

  return (
    <div
      className="rounded-xl border px-4 py-3 mb-6 flex items-center justify-between gap-3"
      style={{
        borderColor: `${brandColor || "#6366f1"}40`,
        backgroundColor: `${brandColor || "#6366f1"}0d`,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {brandLogo && (
          <Image
            src={brandLogo}
            alt={brandName || ""}
            width={36}
            height={36}
            className="object-contain rounded-md shrink-0"
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{brandName}</p>
          <p className="text-xs text-muted-foreground">Tienda oficial</p>
        </div>
      </div>
      <Link
        href={`/p/${brandSlug}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium shrink-0 hover:underline"
        style={{ color: brandColor || "#6366f1" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Seguir comprando
      </Link>
    </div>
  )
}
