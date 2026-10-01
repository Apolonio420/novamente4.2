/**
 * Helpers puros del checkout web (/checkout y /checkout/transfer).
 *
 * Por qué (01/10/2026, reporte partner la-blancq "la transferencia no
 * funciona"): el botón "Confirmar Pedido" quedaba `disabled` mientras faltara
 * cualquier campo, así que tocarlo no hacía NADA — ni el alert que explica qué
 * falta llegaba a dispararse. Desde afuera parecía que la opción de
 * transferencia estaba rota. Ahora el botón responde siempre y se dice
 * exactamente qué campo falta.
 */

export const CAMPOS_OBLIGATORIOS = {
  email: "email",
  firstName: "nombre",
  lastName: "apellido",
  phone: "teléfono",
  address: "dirección",
  city: "ciudad",
  postalCode: "código postal",
} as const

export type CampoObligatorio = keyof typeof CAMPOS_OBLIGATORIOS

/** Campos obligatorios vacíos, en el orden del formulario. */
export function camposFaltantes(info: Partial<Record<CampoObligatorio, string | null | undefined>>): CampoObligatorio[] {
  return (Object.keys(CAMPOS_OBLIGATORIOS) as CampoObligatorio[]).filter(
    (campo) => !String(info[campo] ?? "").trim(),
  )
}

/** Mensaje para el cliente con los campos que faltan, o null si está completo. */
export function mensajeCamposFaltantes(faltan: CampoObligatorio[]): string | null {
  if (!faltan.length) return null
  const nombres = faltan.map((c) => CAMPOS_OBLIGATORIOS[c])
  const lista = nombres.length === 1 ? nombres[0] : `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`
  return `Para confirmar el pedido completá: ${lista}. Los datos de envío los necesitamos para despachar tu pedido.`
}

/**
 * Costo de envío a mostrar en /checkout/transfer. Antes la pantalla decía
 * "Envío: Gratis" SIEMPRE aunque el "Total a transferir" lo incluyera — el
 * cliente veía subtotal + "gratis" ≠ total y desconfiaba del monto.
 * Usa el envío guardado; si no está (datos viejos en localStorage) lo deduce
 * del total.
 */
export function envioAMostrar(datos: {
  shippingCost?: number | null
  discountARS?: number | null
  amount: number
  items: Array<{ price: number; quantity: number }>
}): number {
  if (typeof datos.shippingCost === "number" && datos.shippingCost >= 0) return datos.shippingCost
  const subtotal = datos.items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0)
  return Math.max(0, Math.round(datos.amount - subtotal + (datos.discountARS || 0)))
}
