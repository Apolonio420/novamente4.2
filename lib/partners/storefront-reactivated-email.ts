/**
 * Email best-effort al partner cuando el auto-publish reenciende su tienda
 * (primer producto publicado o branding minimo completado). Antes de esto,
 * el unico aviso era un toast in-app efimero — un partner con la tienda
 * pausada por vidriera vacia no se enteraba de que volvio a estar online.
 * Mismo look & feel (tabla 480px) que ./partner-welcome-email.ts.
 */
export function storefrontReactivatedSubject(tenantName: string): string {
  return `¡Tu tienda ${tenantName} ya está online de nuevo!`
}

export function storefrontReactivatedHtml(opts: { tenantName: string; slug: string }): string {
  const storeUrl = `https://www.novamente.ar/p/${opts.slug}`
  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
      <tr><td style="background:#111;padding:20px 28px;color:#fff;font-size:18px;font-weight:bold">Novamente</td></tr>
      <tr><td style="padding:28px">
        <p style="font-size:17px;color:#111;margin:0 0 6px"><b>¡Tu tienda ${opts.tenantName} ya está online de nuevo!</b></p>
        <p style="font-size:14px;color:#555;line-height:1.5;margin:0 0 18px">
          Publicaste tu primer producto o completaste tu marca, así que tu tienda pública ya está activa y visible para tus clientes.
        </p>
        <p style="font-size:14px;color:#111;margin:0 0 18px"><b>${storeUrl}</b></p>
        <a href="${storeUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 30px;border-radius:8px">
          Ver mi tienda →
        </a>
        <p style="font-size:14px;color:#555;line-height:1.5;margin:22px 0 0">
          Para tu primera venta, un buen empujón es compartir el link en la <b>bio de Instagram</b> y en tus <b>estados de WhatsApp</b>.
        </p>
        <p style="font-size:12px;color:#999;margin:22px 0 0;line-height:1.5">
          ¿Dudas o necesitás una mano? Respondé este mail o escribinos por
          <a href="https://wa.me/5492235169720" style="color:#666">WhatsApp</a>.
        </p>
      </td></tr>
      <tr><td style="background:#fafafa;padding:14px 28px;font-size:11px;color:#aaa">
        Novamente Partners · novamente.ar
      </td></tr>
    </table>
  </td></tr></table></body></html>`
}

export function buildStorefrontReactivatedEmail(input: {
  tenantName: string
  slug: string
}): { subject: string; html: string } {
  return {
    subject: storefrontReactivatedSubject(input.tenantName),
    html: storefrontReactivatedHtml({ tenantName: input.tenantName, slug: input.slug }),
  }
}
