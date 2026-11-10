/**
 * referral-code.ts — pedido de referido en el mail "Recibimos tu pago" (Ruta $100M,
 * decisión de Juan 09/11/2026: el referido se pide SOLO en la respuesta del bot a
 * "Llegó bien" y en una línea de este mail; sin plantilla nueva).
 *
 * COPIA del contrato del bot (chatbot-whastapp lib/postventa/referral.ts): mismo
 * algoritmo de código y mismo tag "(ref · REF-XXXXXXXX)". El bot es quien lee el
 * tag cuando el amigo escribe y lo guarda en sale_attributions.referred_by. Si se
 * cambia acá, se cambia allá: hay un vector de test fijo en los dos repos.
 *
 * Incentivo aprobado: reconocimiento + boceto extra sin cargo. NO: descuentos,
 * cupones, prendas gratis, prioridad de producción ni escasez.
 */
import { createHash } from "crypto"
import { WHATSAPP_BOT_NUMBER } from "@/lib/config/links"

export type ReferralSourceKind = "wa" | "web"

/** REF- + 8 base36 (40 bits del sha256 de `kind:id`). No revela teléfono ni id. */
export function referralCodeFor(kind: ReferralSourceKind, orderId: string): string {
  const digest = createHash("sha256").update(`${kind}:${String(orderId)}`).digest()
  let n = BigInt(0)
  for (let i = 0; i < 5; i++) n = (n << BigInt(8)) | BigInt(digest[i])
  return "REF-" + n.toString(36).toUpperCase().padStart(8, "0").slice(-8)
}

export function referralPrefilledText(code: string): string {
  return `Hola Novamente! Me pasaron su contacto y quiero ver un boceto para mi pedido. (ref · ${code})`
}

export function buildReferralShareLink(code: string): string {
  return `https://wa.me/${WHATSAPP_BOT_NUMBER}?text=${encodeURIComponent(referralPrefilledText(code))}`
}

/**
 * Párrafo para el mail de pago confirmado. null = no corresponde:
 * - pedido de una tienda PARTNER (tenant_id): el comprador es cliente del partner;
 *   mandarlo a nuestro WhatsApp le quitaría la venta al partner.
 */
export function referralEmailParagraph(order: { id: string; tenant_id?: string | null }): { code: string; html: string } | null {
  if (!order?.id || order.tenant_id) return null
  const code = referralCodeFor("web", order.id)
  const link = buildReferralShareLink(code)
  return {
    code,
    html: `<p>¿Quién de tu grupo, curso o equipo se copa con algo así? <a href="${link}">Pasale este link</a> y nos escribe directo: le armamos el boceto sin cargo y, cuando nos escriba, a vos te hacemos un boceto extra de regalo y te agradecemos en nuestras historias (si querés) 🙌</p>`,
  }
}
