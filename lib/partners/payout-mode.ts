/**
 * Cómo cobra un partner su ganancia (decisión Juan 28/09/2026):
 *  - 'cash'   (default): Novamente le transfiere el saldo una vez por semana.
 *  - 'credit': el saldo le queda A FAVOR para usarlo en un pedido propio; no se
 *              transfiere. Caso Sponsors (NOV-20260926-9852).
 * Vive en tenants.metadata.payout_mode; lo cambia un admin (RPC
 * partner_admin_set_payout_mode, platform /dashboard/partners/ventas).
 */
export type PayoutMode = 'cash' | 'credit'

export function payoutModeDe(metadata: Record<string, unknown> | null | undefined): PayoutMode {
  return (metadata as Record<string, unknown> | null | undefined)?.payout_mode === 'credit' ? 'credit' : 'cash'
}
