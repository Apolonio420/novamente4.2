import { createHmac } from "crypto"

/**
 * Link firmado de confirmación EN UN CLICK de un pedido pagado por transferencia
 * (GET /api/admin/confirm-transfer). Lo usan el endpoint (verifica) y los avisos
 * a Juan (lo incluyen): el del bot cuando detecta un comprobante y el de creación
 * del pedido, para los clientes que transfieren sin mandar comprobante.
 *
 * `op` = nro de operación de MP cuando se conoce; "manual" cuando el aviso se
 * genera al crear el pedido (todavía no hay comprobante).
 */
const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://www.novamente.ar"

export function transferConfirmSig(orderNumber: string, op: string): string {
  const secret = process.env.TRANSFER_CONFIRM_SECRET || ""
  return createHmac("sha256", secret).update(`${orderNumber}|${op}`).digest("hex")
}

export function transferConfirmUrl(orderNumber: string, op = "manual"): string | null {
  if (!process.env.TRANSFER_CONFIRM_SECRET || !orderNumber) return null
  const u = new URL("/api/admin/confirm-transfer", BASE)
  u.searchParams.set("order", orderNumber)
  u.searchParams.set("op", op)
  u.searchParams.set("sig", transferConfirmSig(orderNumber, op))
  return u.toString()
}
