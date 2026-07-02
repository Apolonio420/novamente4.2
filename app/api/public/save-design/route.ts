import { NextRequest, NextResponse } from "next/server"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/email"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

const limiter = rateLimit({ limit: 7, windowSeconds: 600, prefix: "save-design" })

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function savedDesignHtml(opts: { imageUrl: string; resumeUrl: string; garment: string }): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
      <tr><td style="background:#111;padding:20px 28px;color:#fff;font-size:18px;font-weight:bold">Novamente</td></tr>
      <tr><td style="padding:28px">
        <p style="font-size:17px;color:#111;margin:0 0 6px"><b>Tu diseño quedó guardado 🎨</b></p>
        <p style="font-size:14px;color:#555;line-height:1.5;margin:0 0 18px">
          Acá lo tenés${opts.garment ? ` (${opts.garment})` : ""} — cuando quieras seguís
          editándolo o lo estampás directo en tu prenda.
        </p>
        <img src="${opts.imageUrl}" alt="Tu diseño" width="424" style="width:100%;border-radius:10px;border:1px solid #eee;margin:0 0 22px" />
        <a href="${opts.resumeUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 30px;border-radius:8px">
          Seguir con mi diseño →
        </a>
        <p style="font-size:12px;color:#999;margin:22px 0 0;line-height:1.5">
          Producción a pedido en Argentina · sale en 24-72h hábiles ·
          <a href="https://wa.me/5492235169720" style="color:#666">WhatsApp</a>
        </p>
      </td></tr>
      <tr><td style="background:#fafafa;padding:14px 28px;font-size:11px;color:#aaa">
        Prendas premium estampadas on-demand · novamente.ar
      </td></tr>
    </table>
  </td></tr></table></body></html>`
}

/**
 * P6-03: Recupero de carrito abandonado por email.
 * El usuario tiene un mockup/diseño listo pero no compra. Le mandamos el diseño
 * por email (la UI lo promete) con un CTA que restaura la sesión en /crear,
 * persistimos el lead en email_captures y avisamos a OPS por Telegram.
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

    // 1) Email real al cliente con su diseño (es lo que promete el modal).
    // El CTA restaura la sesión: /crear?image= re-carga el diseño como base.
    const imageUrl = mockupUrl || designUrl
    const resumeUrl = designUrl
      ? `https://www.novamente.ar/crear?image=${encodeURIComponent(designUrl)}`
      : "https://www.novamente.ar/crear"
    const sent = await sendEmail({
      to: email,
      subject: "Tu diseño Novamente quedó guardado 🎨",
      html: savedDesignHtml({ imageUrl, resumeUrl, garment: [garmentType, garmentColor].filter(Boolean).join(" ") }),
    })
    if (!sent.ok) console.error("[save-design] email failed:", sent.error)

    // 2) Persistir el lead para remarketing (antes solo iba a Telegram y se perdía)
    try {
      const sb = supabaseAdmin as any
      const { data: existing } = await sb.from("email_captures").select("id").eq("email", email).maybeSingle()
      if (!existing) {
        await sb.from("email_captures").insert({
          email,
          source: "save_design",
          created_at: new Date().toISOString(),
        })
      }
    } catch (dbErr: any) {
      console.error("[save-design] email_captures insert failed:", dbErr?.message)
    }

    // 3) Aviso interno a OPS (best effort, como siempre)
    const botToken = process.env.TELEGRAM_BOT_TOKEN_OPS
    const chatId = process.env.TELEGRAM_CHAT_ID_OPS
    if (botToken && chatId) {
      const text = [
        "💌 <b>Lead /crear — diseño guardado</b>",
        "",
        `📧 <b>${email}</b> ${sent.ok ? "(email enviado ✅)" : "(email FALLÓ ❌)"}`,
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
