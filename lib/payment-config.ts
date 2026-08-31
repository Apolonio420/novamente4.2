/**
 * Config de medios de pago de la tienda.
 *
 * REGLA (Juan 08/07/2026 para el bot · extendida a la web el 31/08/2026): los
 * precios de catálogo son por TRANSFERENCIA al alias. Pagar por MercadoPago
 * (tarjeta/débito/efectivo) lleva +10% de recargo, igual que en el bot de
 * WhatsApp (lib/payments/payment-link.ts del chatbot, MP_CARD_SURCHARGE).
 * Hasta hoy la web cobraba lo mismo por ambos medios — Novamente absorbía la
 * comisión de MP en cada venta web sin que fuera una decisión (auditoría 31/08).
 *
 * El recargo se calcula UNA vez sobre el total pagable (subtotal − descuento
 * + envío) y se muestra como línea propia, para que el cliente vea exactamente
 * qué está pagando y por qué la transferencia es más barata.
 */
export const MP_CARD_SURCHARGE = 1.10

/** Total con recargo de tarjeta, redondeado a peso entero (misma cuenta que el bot). */
export function applyCardSurcharge(amount: number): number {
  return Math.round(amount * MP_CARD_SURCHARGE)
}

/** El recargo solo, listo para mostrar como línea del resumen. */
export function cardSurchargeAmount(amount: number): number {
  return applyCardSurcharge(amount) - amount
}
