"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ReactNode } from "react"
import * as fpixel from "@/lib/fpixel"
import { trackAddToCart } from "@/lib/analytics"

export interface CartItem {
  id: string
  name: string
  garmentType?: string
  color: string
  size: string
  price: number
  quantity: number
  image: string
  mockupUrl?: string
  frontMockup?: string
  backMockup?: string
  frontDesign?: string
  backDesign?: string
  garmentColor?: string
  isGeneratingMockups?: boolean
  frontStampSize?: 'R1' | 'R2' | 'R3'
  backStampSize?: 'R1' | 'R2' | 'R3'
  frontStampPosition?: 'center' | 'left'
  backStampPosition?: 'center' | 'left'
  /** Doble estampado (frente + espalda en la misma prenda) — va a fulfillment. */
  doble_estampa?: 'Si' | 'No'
  customDesign?: {
    image: string
    position: { x: number; y: number }
    scale: number
    side: "front" | "back"
  }
  tenantId?: string
  // Branding de la tienda partner de origen (para carrito/checkout brandeados)
  brandSlug?: string
  brandName?: string
  brandLogo?: string | null
  brandColor?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  updateItem: (id: string, updatedItem: Partial<CartItem>) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          fpixel.event("AddToCart", {
            content_ids: [item.id],
            content_name: item.name,
            content_type: "product",
            value: item.price * item.quantity,
            currency: "ARS",
          })
          trackAddToCart({
            item_id: item.id,
            item_name: item.name,
            item_category: item.garmentType,
            price: item.price,
            quantity: item.quantity,
          })
          const existingItem = state.items.find((i) => i.id === item.id)
          if (existingItem) {
            return {
              items: state.items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i)),
            }
          }
          return { items: [...state.items, item] }
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, quantity } : item)),
        })),
      updateItem: (id, updatedItem) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...updatedItem } : item)),
        })),
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.price * item.quantity, 0)
      },
      getTotalItems: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.quantity, 0)
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)

export function CartProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export const useCartStore = useCart
