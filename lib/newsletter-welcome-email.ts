/**
 * Email de bienvenida para suscriptores del popup de newsletter
 * (email_captures.source = 'popup_newsletter') — el popup promete "novedades,
 * lanzamientos y descuentos" pero hasta ahora no se mandaba nada. Mismo look
 * & feel (tabla 480px) que lib/partners/pending-subscription-followup.ts.
 *
 * `save_design` ya manda su propio email de bienvenida/recupero (ver
 * app/api/public/save-design/route.ts) — este builder es solo para el popup.
 *
 * Separado de app/api/email-capture/route.ts para poder testear el armado del
 * HTML/subject y la URL de unsubscribe sin mockear Supabase.
 */
export const NEWSLETTER_BASE_URL = 'https://www.novamente.ar'

export function newsletterWelcomeSubject(): string {
  return '¡Bienvenido a Novamente!'
}

export function newsletterUnsubscribeUrl(captureId: string, baseUrl = NEWSLETTER_BASE_URL): string {
  return `${baseUrl}/api/email-capture/unsubscribe?id=${encodeURIComponent(captureId)}`
}

export function newsletterWelcomeHtml(opts: { unsubscribeUrl: string }): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
      <tr><td style="background:#111;padding:20px 28px;color:#fff;font-size:18px;font-weight:bold">Novamente</td></tr>
      <tr><td style="padding:28px">
        <p style="font-size:17px;color:#111;margin:0 0 6px"><b>¡Bienvenido a Novamente! 🎉</b></p>
        <p style="font-size:14px;color:#555;line-height:1.5;margin:0 0 18px">
          Ya estás suscripto — de ahora en más vas a recibir nuestras <b>novedades, lanzamientos y
          beneficios</b> antes que nadie.
        </p>
        <p style="font-size:14px;color:#555;line-height:1.5;margin:0 0 18px">
          Un dato útil: el envío es <b>gratis</b> en compras desde $150.000.
        </p>
        <a href="https://www.novamente.ar" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 30px;border-radius:8px;margin:0 0 12px">
          Conocer la tienda →
        </a>
        <p style="font-size:14px;color:#555;line-height:1.5;margin:14px 0 0">
          ¿Querés diseñar la tuya? Probá nuestro generador con IA en
          <a href="https://www.novamente.ar/crear" style="color:#111;font-weight:bold">novamente.ar/crear</a>.
        </p>
      </td></tr>
      <tr><td style="background:#fafafa;padding:14px 28px;font-size:11px;color:#aaa">
        Novamente · novamente.ar ·
        <a href="${opts.unsubscribeUrl}" style="color:#aaa">No quiero recibir más novedades</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`
}

export function buildNewsletterWelcomeEmail(
  captureId: string,
  baseUrl = NEWSLETTER_BASE_URL,
): { subject: string; html: string } {
  return {
    subject: newsletterWelcomeSubject(),
    html: newsletterWelcomeHtml({ unsubscribeUrl: newsletterUnsubscribeUrl(captureId, baseUrl) }),
  }
}
