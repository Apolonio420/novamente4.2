-- =============================================================
-- Partners OS — Partner Orders Table
-- Migration: create_partner_orders_table.sql
-- Date: 2026-03-13
-- =============================================================

CREATE TABLE IF NOT EXISTS partner_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  items JSONB DEFAULT '[]',
  total DECIMAL,
  currency TEXT DEFAULT 'ARS',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','producing','shipped','delivered','cancelled')),
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','approved','rejected','refunded')),
  shipping_info JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE partner_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON partner_orders;
CREATE POLICY "Service role full access" ON partner_orders FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_partner_orders_tenant ON partner_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_orders_status ON partner_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_orders_created ON partner_orders(tenant_id, created_at DESC);
