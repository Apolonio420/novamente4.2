/**
 * Email transaccional a clientes via Resend (REST, sin SDK).
 * Requiere RESEND_API_KEY y RESEND_FROM en env.
 */
export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: 'RESEND_API_KEY no configurada' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Novamente <contact@novamente.ar>',
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` }
    }
    // Resend responde { id: "..." } en éxito — se devuelve para trazabilidad
    // (ej. registrar el id del envío junto al timestamp en metadata).
    const body = await res.json().catch(() => null)
    return { ok: true, id: body?.id }
  } catch (e: any) {
    return { ok: false, error: e?.message }
  }
}
