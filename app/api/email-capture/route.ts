import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json()

    if (!email || typeof email !== "string" || !email.includes("@")) {
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
    const { error } = await (supabaseAdmin as any).from("email_captures").insert({
      email: normalizedEmail,
      source: source || "popup_10off",
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Email capture insert error:", error)
      return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
    }

    // Send Telegram notification (fire and forget)
    notifyTelegram(normalizedEmail, source).catch(console.error)

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
