-- =============================================================
-- Partners OS — daily operations (CRM, fulfillment, campaigns)
-- Migration: 20260622_partner_daily_operations.sql
-- Backwards compatible with existing partner leads and orders.
-- =============================================================

-- CRM fields stay on the lead for efficient inbox queries. Notes and changes
-- are append-only in partner_lead_activities, so the partner has an audit trail.
ALTER TABLE partner_leads
  ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS estimated_value_ars NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS lost_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_partner_leads_next_action
  ON partner_leads(tenant_id, next_action_at)
  WHERE next_action_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS partner_lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES partner_leads(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('created', 'status_changed', 'note', 'next_action_set', 'contacted', 'assignment_changed')),
  body TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_lead_activities_lead
  ON partner_lead_activities(tenant_id, lead_id, created_at DESC);

-- Detailed fulfillment augments the legacy order.status field. Existing
-- integrations can keep using status while workspace operations use the
-- more specific fulfillment_status.
ALTER TABLE partner_orders
  ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'awaiting_art_approval'
    CHECK (fulfillment_status IN (
      'awaiting_art_approval', 'queued_for_production', 'in_production',
      'quality_check', 'ready_to_ship', 'shipped', 'delivered', 'exception', 'cancelled'
    )),
  ADD COLUMN IF NOT EXISTS estimated_delivery_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS carrier TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS exception_reason TEXT,
  ADD COLUMN IF NOT EXISTS fulfillment_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE partner_orders
SET fulfillment_status = CASE status
  WHEN 'confirmed' THEN 'queued_for_production'
  WHEN 'producing' THEN 'in_production'
  WHEN 'shipped' THEN 'shipped'
  WHEN 'delivered' THEN 'delivered'
  WHEN 'cancelled' THEN 'cancelled'
  ELSE 'awaiting_art_approval'
END
WHERE fulfillment_status = 'awaiting_art_approval';

CREATE INDEX IF NOT EXISTS idx_partner_orders_fulfillment
  ON partner_orders(tenant_id, fulfillment_status, fulfillment_updated_at DESC);

CREATE TABLE IF NOT EXISTS partner_order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES partner_orders(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('created', 'status_changed', 'fulfillment_changed', 'tracking_updated', 'note', 'exception')),
  from_status TEXT,
  to_status TEXT,
  body TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_order_events_order
  ON partner_order_events(tenant_id, order_id, created_at DESC);

-- Campaigns intentionally do not buy ads. They record a launch-ready package
-- and its UTM identity so first-party analytics can attribute it.
CREATE TABLE IF NOT EXISTS partner_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES partner_products(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'meta' CHECK (channel IN ('meta', 'google', 'tiktok', 'other')),
  name TEXT NOT NULL,
  template_type TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  utm_campaign TEXT NOT NULL,
  utm_source TEXT NOT NULL,
  utm_medium TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  budget_daily_ars NUMERIC(12, 2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, utm_campaign)
);

CREATE INDEX IF NOT EXISTS idx_partner_campaigns_tenant
  ON partner_campaigns(tenant_id, status, created_at DESC);
