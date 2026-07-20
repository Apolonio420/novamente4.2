import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function page(opts: { title: string; message: string }): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${opts.title} · Novamente</title>
  <meta name="robots" content="noindex, nofollow" />
  </head>
  <body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px"><tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
        <tr><td style="background:#111;padding:20px 28px;color:#fff;font-size:18px;font-weight:bold">Novamente</td></tr>
        <tr><td style="padding:28px;text-align:center">
          <p style="font-size:17px;color:#111;margin:0 0 10px"><b>${opts.title}</b></p>
          <p style="font-size:14px;color:#555;line-height:1.5;margin:0">${opts.message}</p>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`
}

const HTML_HEADERS = { "Content-Type": "text/html; charset=utf-8" }

/**
 * GET /api/email-capture/unsubscribe?id=<uuid de email_captures>
 *
 * Linkeado desde el footer del email de bienvenida del newsletter
 * ("No quiero recibir más novedades"). Idempotente: si ya estaba
 * desuscripto, muestra la misma confirmación sin error. El `id` (uuid de
 * la fila, no el email) evita que cualquiera desuscriba un email ajeno
 * adivinando la dirección.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || ""

  if (!UUID_RE.test(id)) {
    return new NextResponse(
      page({
        title: "Link inválido",
        message: "Este link de baja no es válido. Si querés dejar de recibir novedades, escribinos por WhatsApp.",
      }),
      { status: 400, headers: HTML_HEADERS },
    )
  }

  try {
    await (supabaseAdmin as any)
      .from("email_captures")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("id", id)
      .is("unsubscribed_at", null)
  } catch (e) {
    console.error("[email-capture/unsubscribe] update failed:", e)
  }

  return new NextResponse(
    page({
      title: "Listo, te dimos de baja",
      message: "No vas a recibir más novedades de Novamente por email. Si fue un error, podés volver a suscribirte cuando quieras.",
    }),
    { status: 200, headers: HTML_HEADERS },
  )
}
