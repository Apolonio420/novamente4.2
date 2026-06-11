-- Fase 2 · Finanzas del partner: ledger de márgenes + payouts
-- Balance del partner = SUM(credit) - SUM(debit) sobre entries.
-- Un payout solicitado genera inmediatamente un debit (si se rechaza, se
-- re-acredita con un credit de concepto 'payout_rechazado').

CREATE TABLE IF NOT EXISTS partner_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID,                         -- orders.id (web) · NULL para payouts/ajustes
  payout_id UUID,                        -- partner_payouts.id cuando type proviene de un retiro
  source TEXT NOT NULL DEFAULT 'web_order',  -- web_order | whatsapp | manual | payout
  type TEXT NOT NULL CHECK (type IN ('credit','debit')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  concept TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',  -- confirmed | needs_review
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotencia: un solo crédito de margen por orden
CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_order_credit
  ON partner_ledger_entries (tenant_id, order_id)
  WHERE order_id IS NOT NULL AND type = 'credit' AND source != 'payout';

CREATE INDEX IF NOT EXISTS idx_ledger_tenant_created
  ON partner_ledger_entries (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS partner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'requested',  -- requested | paid | rejected
  method TEXT,                                -- destino: alias/CBU declarado al pedir
  notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_payouts_tenant
  ON partner_payouts (tenant_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_payouts_status
  ON partner_payouts (status) WHERE status = 'requested';
