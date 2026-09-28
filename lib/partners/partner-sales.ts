/**
 * Ventas web del partner para SU panel (/workspace/finanzas) — partner-safe.
 *
 * Sale de los créditos 'web_order' del ledger (lib/partners/ledger.ts). Del
 * desglose se copian SOLO campos que el partner puede ver (whitelist): prenda,
 * talle, color, PVP, su costo B2B (precio del plan + recargo doble estampa),
 * descuento de su código y su ganancia. Nunca: clase de estampa del proveedor,
 * `via`, motivos internos de revisión, ítems de otros partners (`excluded`) ni
 * nada de Dreamful/márgenes (el ledger no los tiene, pero la whitelist lo
 * garantiza aunque alguien los agregue).
 *
 * Estado de cada venta: los pagos de Novamente (débitos 'payout') se aplican
 * FIFO sobre las ventas confirmadas más viejas — misma regla que el admin de
 * platform (lib/partners/ventas-partners.ts).
 */

export interface PartnerSaleLine {
  item: string
  qty: number
  unit: number
  color: string | null
  talle: string | null
  doble_estampa: boolean
  costo_base: number | null
  recargo_doble: number
  cost: number | null
  descuento: number
  ganancia: number | null
}

export type PartnerSaleEstado = 'pagado' | 'parcial' | 'a_cobrar' | 'en_revision' | 'reembolsada'

export interface PartnerSale {
  id: string
  orderNumber: string | null
  fecha: string
  /** Ganancia acreditada (lo que se le paga). */
  ganancia: number
  estado: PartnerSaleEstado
  /** Parte ya pagada (FIFO). */
  pagado: number
  pvp: number
  costo: number | null
  descuento: number
  lineas: PartnerSaleLine[]
}

export interface LedgerEntryForSales {
  id: string
  type: 'credit' | 'debit'
  amount: number | string
  status: string | null
  source: string | null
  order_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const num = (v: unknown): number => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}
const numOrNull = (v: unknown): number | null => (v == null || !Number.isFinite(Number(v)) ? null : Number(v))
const strOrNull = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)

/** Whitelist de una línea del desglose del ledger. */
export function saleLinesForPartner(breakdown: unknown): PartnerSaleLine[] {
  if (!Array.isArray(breakdown)) return []
  return breakdown.map((raw) => {
    const l = (raw || {}) as Record<string, unknown>
    return {
      item: strOrNull(l.item) || 'Producto',
      qty: num(l.qty) || 1,
      unit: num(l.unit),
      color: strOrNull(l.color),
      talle: strOrNull(l.talle),
      doble_estampa: l.doble_estampa === true,
      costo_base: numOrNull(l.costo_base),
      recargo_doble: num(l.recargo_doble),
      cost: numOrNull(l.cost),
      descuento: num(l.descuento),
      ganancia: numOrNull(l.ganancia),
    }
  })
}

export function buildPartnerSales(entries: LedgerEntryForSales[]): PartnerSale[] {
  const sorted = [...entries].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const reembolsadas = new Set(
    sorted.filter((e) => e.source === 'order_refund' && e.order_id).map((e) => e.order_id as string),
  )
  let pool =
    sorted.filter((e) => e.type === 'debit' && e.source === 'payout').reduce((s, e) => s + num(e.amount), 0) -
    sorted.filter((e) => e.type === 'credit' && e.source === 'payout_reversal').reduce((s, e) => s + num(e.amount), 0)

  const sales: PartnerSale[] = []
  for (const e of sorted) {
    if (e.type !== 'credit' || e.source !== 'web_order') continue
    const meta = (e.metadata || {}) as Record<string, unknown>
    const lineas = saleLinesForPartner(meta.breakdown)
    const amt = num(e.amount)
    let estado: PartnerSaleEstado
    let pagado = 0
    if (e.status === 'needs_review') {
      estado = 'en_revision'
    } else if (e.order_id && reembolsadas.has(e.order_id)) {
      estado = 'reembolsada'
      pagado = Math.min(Math.max(pool, 0), amt)
      pool -= pagado
    } else if (amt <= 0 || pool >= amt) {
      estado = 'pagado'
      pagado = amt
      pool -= Math.max(amt, 0)
    } else if (pool > 0) {
      estado = 'parcial'
      pagado = pool
      pool = 0
    } else {
      estado = 'a_cobrar'
    }
    sales.push({
      id: e.id,
      orderNumber: strOrNull(meta.order_number),
      fecha: e.created_at,
      ganancia: amt,
      estado,
      pagado,
      pvp: lineas.reduce((s, l) => s + l.unit * l.qty, 0),
      costo: lineas.every((l) => l.cost != null) ? lineas.reduce((s, l) => s + (l.cost as number) * l.qty, 0) : null,
      descuento: lineas.reduce((s, l) => s + l.descuento, 0),
      lineas,
    })
  }
  return sales.reverse()
}
