/**
 * Email de bienvenida al dar de alta el login de un partner (self-serve
 * onboarding step 1 o alta manual por admin). Mismo look & feel (tabla 480px)
 * que ./pending-subscription-followup.ts y ./subscription-activated-email.ts.
 *
 * La contraseña temporal SIEMPRE se muestra una sola vez en pantalla (nunca en
 * este email) — el mail solo linkea al login y recuerda "¿Olvidaste tu
 * contraseña?" para el caso de pérdida.
 *
 * Separado de las rutas de onboarding para poder testear el armado del
 * HTML/subject sin mockear Supabase.
 */
export const PARTNERS_LOGIN_URL = 'https://www.novamente.ar/partners/login'

export function partnerWelcomeSubject(): string {
  return 'Tu cuenta de Novamente Partners está lista'
}

export function partnerWelcomeHtml(opts: { tenantName: string; email: string; loginUrl: string }): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
      <tr><td style="background:#111;padding:20px 28px;color:#fff;font-size:18px;font-weight:bold">Novamente</td></tr>
      <tr><td style="padding:28px">
        <p style="font-size:17px;color:#111;margin:0 0 6px"><b>¡Hola ${opts.tenantName}!</b></p>
        <p style="font-size:14px;color:#555;line-height:1.5;margin:0 0 18px">
          Tu cuenta de <b>Novamente Partners</b> ya está lista. Iniciá sesión con tu email de acceso:
        </p>
        <p style="font-size:14px;color:#111;margin:0 0 18px"><b>${opts.email}</b></p>
        <a href="${opts.loginUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 30px;border-radius:8px">
          Iniciar sesión →
        </a>
        <p style="font-size:12px;color:#999;margin:22px 0 0;line-height:1.5">
          ¿Perdiste tu contraseña? Usá la opción <b>"¿Olvidaste tu contraseña?"</b> en esa misma página
          para generar una nueva. ¿Dudas? Respondé este mail o escribinos por
          <a href="https://wa.me/5492235169720" style="color:#666">WhatsApp</a>.
        </p>
      </td></tr>
      <tr><td style="background:#fafafa;padding:14px 28px;font-size:11px;color:#aaa">
        Novamente Partners · novamente.ar
      </td></tr>
    </table>
  </td></tr></table></body></html>`
}

export function buildPartnerWelcomeEmail(opts: {
  tenantName: string
  email: string
  loginUrl?: string
}): { subject: string; html: string } {
  return {
    subject: partnerWelcomeSubject(),
    html: partnerWelcomeHtml({
      tenantName: opts.tenantName,
      email: opts.email,
      loginUrl: opts.loginUrl || PARTNERS_LOGIN_URL,
    }),
  }
}
