/**
 * Guards de idempotencia / doble cobro para el webhook de MercadoPago de
 * suscripciones de partners. Viven en un módulo separado (en vez de ser
 * exports nombrados de app/api/partners/webhook/mercadopago/route.ts) porque
 * Next.js App Router valida en tiempo de build que un route.ts solo exporte
 * los HTTP method handlers (GET, POST, etc.) y algunas configs reservadas —
 * cualquier otro export nombrado rompe `.next/types/.../route.ts` con un
 * error de tsc (TS2344, index signature incompatible).
 */

/**
 * Guard de idempotencia para el pago único (one-time / anual): MP puede reenviar
 * el mismo webhook (reintento, notificación duplicada, replay manual del id viejo
 * — ver hallazgo [3] de docs/reviews/REVIEW-caminos-de-plata-2026-07-03.md). Si ya
 * procesamos este payment id para este tenant, no hay que re-ejecutar los efectos
 * (activar plan, extender vencimiento, notificar, CAPI) de nuevo.
 */
export function isPaymentAlreadyProcessed(
  tenantMetadata: Record<string, unknown> | null | undefined,
  paymentId: string,
): boolean {
  const lastProcessed = (tenantMetadata as any)?.last_mp_payment_id
  return lastProcessed != null && String(lastProcessed) === String(paymentId)
}

/**
 * Detecta sospecha de doble cobro (hallazgo [18] del review): un payment id
 * DISTINTO del último procesado llega aprobado mientras la suscripción TODAVÍA
 * está vigente (no vencida). Esto NO bloquea el cobro — solo dispara una
 * alerta para que el equipo audite manualmente (ej. reintento del cliente tras
 * un error de red, o dos pestañas de checkout abiertas). Si la suscripción ya
 * estaba vencida, un payment id nuevo es una renovación normal, no doble cobro.
 */
export function isSuspectedDoubleCharge(
  tenant: { metadata?: Record<string, unknown> | null; subscription_expires_at?: string | null },
  paymentId: string,
  nowISO: string,
): boolean {
  const lastProcessed = (tenant.metadata as any)?.last_mp_payment_id
  if (lastProcessed == null || String(lastProcessed) === String(paymentId)) return false
  const expiresAt = tenant.subscription_expires_at
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() > new Date(nowISO).getTime()
}

/**
 * Guard de idempotencia para el COBRO RECURRENTE MENSUAL (evento
 * `subscription_authorized_payment`, débito automático de la tarjeta ya
 * autorizada). Síntoma [1] de la auditoría de idempotencia de webhooks MP
 * (2026-08-29): a diferencia del pago único (isPaymentAlreadyProcessed arriba)
 * y de subscription_preapproval (isGenuinePreapprovalActivation en
 * lib/partners/subscription.ts), este evento NO tenía ningún guard — si MP
 * reenvía el mismo authorized_payment id (reintento webhook, notificación
 * duplicada), registerRecurringCharge corría de nuevo y sumaba OTRO mes a
 * subscription_expires_at sin que hubiera un segundo cobro real: un mes gratis
 * por cada reenvío. Se usa una clave de metadata separada
 * (last_mp_authorized_payment_id) de la del pago único (last_mp_payment_id)
 * porque son dos conceptos de MP distintos (payment id vs authorized_payment
 * id) y un tenant no debería mezclar ambas semánticas de idempotencia.
 */
export function isAuthorizedPaymentAlreadyProcessed(
  tenantMetadata: Record<string, unknown> | null | undefined,
  authorizedPaymentId: string,
): boolean {
  const lastProcessed = (tenantMetadata as any)?.last_mp_authorized_payment_id
  return lastProcessed != null && String(lastProcessed) === String(authorizedPaymentId)
}
