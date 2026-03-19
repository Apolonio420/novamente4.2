import { supabaseAdmin } from "@/lib/supabase-admin"

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0"

interface WhatsAppMessage {
  messaging_product: "whatsapp"
  to: string
  type?: "text" | "image" | "interactive" | "template"
  text?: { body: string }
  image?: { link: string; caption?: string }
  interactive?: any
  template?: any
}

export class WhatsAppClient {
  private token: string
  private phoneId: string

  constructor() {
    this.token = process.env.META_WHATSAPP_TOKEN || ""
    this.phoneId = process.env.META_PHONE_ID || ""

    if (!this.token || !this.phoneId) {
      console.warn("⚠️ WhatsApp Client missing credentials (META_WHATSAPP_TOKEN or META_PHONE_ID)")
    }
  }

  async sendMessage(to: string, message: Omit<WhatsAppMessage, "messaging_product" | "to">) {
    if (!this.token) return { error: "Missing token" }

    const payload: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to,
      ...message,
    }

    try {
      const res = await fetch(`${WHATSAPP_API_URL}/${this.phoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      
      if (!res.ok) {
        console.error("❌ WhatsApp API Error:", JSON.stringify(data, null, 2))
        throw new Error(data.error?.message || "WhatsApp API Error")
      }

      return data
    } catch (error) {
      console.error("❌ Failed to send WhatsApp message:", error)
      throw error
    }
  }

  async sendText(to: string, body: string) {
    return this.sendMessage(to, {
      type: "text",
      text: { body },
    })
  }

  async sendImage(to: string, imageUrl: string, caption?: string) {
    return this.sendMessage(to, {
      type: "image",
      image: { link: imageUrl, caption },
    })
  }
}

export const whatsAppClient = new WhatsAppClient()
