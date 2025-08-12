"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cartStore"
import { Badge } from "@/components/ui/badge"

export function CartBadge() {
  const { itemCount } = useCart()

  return (
    <Link href="/cart" className="relative">
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <Badge
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-violet-600 text-white"
          variant="secondary"
        >
          {itemCount}
        </Badge>
      )}
      <span className="sr-only">Shopping cart</span>
    </Link>
  )
}
