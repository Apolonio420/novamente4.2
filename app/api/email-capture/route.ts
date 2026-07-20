import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/email"
import { buildNewsletterWelcomeEmail } from "@/lib/newsletter-welcome-email"

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const limiter = rateLimit({ limit: 10, windowSeconds: 600, prefix: "email-capture" })

export async function POST(req: NextRequest) {
  const { success, resetAt } = limiter.check(req)
  if (!success) return rateLimitResponse(resetAt)

  try {
    const { email, source } = await req.json()

    if (!email || typeof email !== "string" || !EMAIL_RX.test(email)) {
      return NextResponse.json({ error: "Email invalido" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if already exists
    const { data: existing } = await (supabaseAdmin as any)
      .from("email_captures")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ ok: true, message: "Ya estas registrado" })
    }

    // Insert new capture
    const effectiveSource = source || "popup_newsletter"
    const { data: inserted, error } = await (supabaseAdmin as any)
      .from("email_captures")
      .insert({
        email: normalizedEmail,
        source: effectiveSource,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("Email capture insert error:", error)
      return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
    }

    // Send Telegram notification (fire and forget)
    notifyTelegram(normalizedEmail, source).catch(console.error)

    // Bienvenida solo para el popup de newsletter (save_design ya manda el
    // suyo, ver app/api/public/save-design/route.ts). Solo se llega acá en el
    // INSERT de una fila nueva — el chequeo de `existing` arriba ya cortó el
    // camino para emails que ya estaban capturados, así que nunca se duplica.
    // Aislado en su propio try/catch: un mail caído no debe romper la captura.
    if (effectiveSource === "popup_newsletter" && inserted?.id) {
      try {
        const { subject, html } = buildNewsletterWelcomeEmail(inserted.id)
        await sendEmail({ to: normalizedEmail, subject, html })
      } catch (e) {
        console.error("[email-capture] welcome email failed:", e)
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

async function notifyTelegram(email: string, source: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN_OPS
  const chatId = process.env.TELEGRAM_CHAT_ID_OPS
  if (!token || !chatId) return

  const text = `📧 *Nuevo lead capturado*\n\nEmail: \`${email}\`\nFuente: ${source || "popup"}\nFecha: ${new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}`

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  })
}
