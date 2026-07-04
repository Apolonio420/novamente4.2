-- Partial unique constraint to prevent duplicate order_refund reversals.
--
-- Problem this fixes (race condition, money):
--   reverseOrderMargin (lib/partners/ledger.ts, branch fix/cost-leak-and-margin-trust)
--   inserts a compensating debit entry (source: 'order_refund') into
--   partner_ledger_entries when a partner-store order gets refunded/charged
--   back, so the partner's credited margin is reversed. Its code-level guard
--   reads "does a source='order_refund' row already exist for this order_id?"
--   before inserting — but that check-then-insert is NOT atomic. Two
--   concurrent refund webhooks/retries for the SAME order (MP can resend a
--   refunded/charged_back event) can both pass the read check before either
--   insert lands, producing two reversal debits for one refund (partner loses
--   the margin twice over).
--
--   reverseOrderMargin's `cost` branch is written to rely on Postgres error
--   23505 (unique_violation) as the authoritative "already reversed, don't
--   duplicate" signal — this migration is what makes that guarantee real at
--   the database layer, closing the race the application-level SELECT alone
--   cannot close.
--
-- This migration is idempotent and additive: it only creates a partial unique
-- index. No existing rows are modified or removed. If duplicate order_refund
-- rows already exist for the same (order_id, source) in production, creating
-- the index will fail — reconcile those rows manually before applying.
--
-- Apply with: psql "$DATABASE_URL" -f migrations/20260704_partner_ledger_order_refund_unique.sql
--   (or paste into the Supabase SQL editor).
--
-- NOT applied automatically by this change — file only, per instructions.

create unique index if not exists partner_ledger_entries_order_refund_uniq
  on partner_ledger_entries (order_id, source)
  where source = 'order_refund';
