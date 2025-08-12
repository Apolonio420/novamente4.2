import { MercadoPagoConfig } from "mercadopago"

// Initialize MercadoPago client
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: "abc",
  },
})

export { client }

export interface CheckoutData {
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    garmentType: string
    color: string
    size: string
    imageUrl: string
    backDesign?: string
  }>
  customer: {
    name: string
    surname?: string
    email: string
    phone?: string
    address?: string
    addressNumber?: string
    zipCode?: string
    city?: string
    state?: string
  }
  total: number
}

export interface MercadoPagoPreference {
  preferenceId: string
  initPoint: string
  sandboxInitPoint?: string
}
