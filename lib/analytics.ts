type Item = {
  item_id: string
  item_name: string
  item_category?: string
  price: number
  quantity: number
}

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

const push = (event: string, payload: Record<string, unknown>) => {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ ecommerce: null })
  window.dataLayer.push({ event, ecommerce: payload })
}

export const trackViewItem = (item: Item) =>
  push("view_item", {
    currency: "ARS",
    value: item.price,
    items: [item],
  })

export const trackAddToCart = (item: Item) =>
  push("add_to_cart", {
    currency: "ARS",
    value: item.price * item.quantity,
    items: [item],
  })

export const trackBeginCheckout = (items: Item[]) =>
  push("begin_checkout", {
    currency: "ARS",
    value: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    items,
  })

export const trackPurchase = (params: {
  orderId: string
  value: number
  items?: Item[]
}) =>
  push("purchase", {
    transaction_id: params.orderId,
    currency: "ARS",
    value: params.value,
    items: params.items ?? [],
  })
