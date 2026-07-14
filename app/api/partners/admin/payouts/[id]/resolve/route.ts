/**
 * POST /api/partners/admin/payouts/[id]/resolve — admin-only.
 *
 * Marks a partner payout (retiro) as paid/processing/rejected. This is the
 * missing caller for the `partner_resolve_payout` RPC (see
 * migrations/20260622_partner_payout_transaction.sql and
 * docs/reviews/REVIEW-caminos-de-plata-2026-07-03.md, finding [13]): before
 * this route existed, an admin had no way to resolve a payout except a manual
 * UPDATE on partner_payouts, which skips the RPC's reversal of the debit on
 * 'rejected' and silently strands the partner's money.
 *
 * Body: { status: 'paid' | 'processing' | 'rejected' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/partners/auth'
import { resolvePayout, validatePayoutResolution } from '@/lib/partners/payouts'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 401 })
  }

  const { id: payoutId } = await params

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const status = body?.status
  if (!validatePayoutResolution(status)) {
    return NextResponse.json(
      { error: 'status debe ser "paid", "processing" o "rejected"' },
      { status: 400 },
    )
  }

  const result = await resolvePayout(payoutId, status)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ ok: true, status: result.payoutStatus, idempotent: !!result.idempotent })
}
