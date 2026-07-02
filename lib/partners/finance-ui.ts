export type PayoutDisplayStatus = 'requested' | 'processing' | 'paid' | 'rejected'

export const PAYOUT_BADGE: Record<PayoutDisplayStatus, { label: string; cls: string }> = {
  requested: { label: 'Pendiente', cls: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  processing: { label: 'En proceso', cls: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  paid: { label: 'Pagado', cls: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  rejected: { label: 'Rechazado', cls: 'bg-red-500/15 text-red-600 border-red-500/30' },
}
