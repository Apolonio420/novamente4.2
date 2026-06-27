import { NextRequest, NextResponse } from "next/server"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"

const limiter = rateLimit({ limit: 7, windowSeconds: 600, prefix: "save-design" })

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * P6-03: Recupero de carrito abandonado por email.
 * El usuario tiene un mockup/diseño listo pero no compra. Le ofrecemos
 * guardar el diseño para que se lo mandemos. Es un lead capture suave.
 *
 * Solo envia a Telegram OPS — sin DB para mantener simple.
 */
export async function POST(req: NextRequest) {
  const { success, resetAt } = limiter.check(req)
  if (!success) return rateLimitResponse(resetAt)

  try {
    const body = await req.json()
    const email = String(body?.email ?? "").trim().toLowerCase()
    const designUrl = String(body?.designUrl ?? "")
    const mockupUrl = String(body?.mockupUrl ?? "")
    const garmentType = String(body?.garmentType ?? "")
    const garmentColor = String(body?.garmentColor ?? "")

    if (!email || !EMAIL_RX.test(email)) {
      return NextResponse.json({ error: "Email invalido" }, { status: 400 })
    }
    if (!designUrl && !mockupUrl) {
      return NextResponse.json({ error: "Falta diseño o mockup" }, { status: 400 })
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN_OPS
    const chatId = process.env.TELEGRAM_CHAT_ID_OPS
    if (botToken && chatId) {
      const text = [
        "💌 <b>Lead /crear — diseño guardado</b>",
        "",
        `📧 <b>${email}</b>`,
        `👕 ${garmentType} · ${garmentColor}`,
        "",
        designUrl ? `🎨 Diseño: ${designUrl}` : "",
        mockupUrl ? `🖼️ Mockup: ${mockupUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n")
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
        })
      } catch (e) {
        console.error("[save-design] telegram failed", e)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("[save-design] error", e)
    return NextResponse.json({ error: e?.message ?? "Error guardando diseño" }, { status: 500 })
  }
}
