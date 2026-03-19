-- Migration: Partners OS Feature Tables
-- Run in Supabase SQL Editor
-- Date: 2026-03-18

-- ============================================================================
-- Phase 1B: Analytics Events
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'page_view', 'product_view', 'lead_submit', 'order_created'
  event_data JSONB DEFAULT '{}',
  visitor_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_tenant_type ON partner_analytics_events(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_tenant_date ON partner_analytics_events(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON partner_analytics_events(created_at);

-- ============================================================================
-- Phase 3: Support Tickets
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
  priority TEXT NOT NULL DEFAULT 'normal', -- normal, priority
  category TEXT DEFAULT 'general', -- general, billing, technical, feature_request
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS partner_support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES partner_support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'partner' or 'admin'
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_tenant ON partner_support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON partner_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON partner_support_tickets(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON partner_support_messages(ticket_id, created_at);

-- ============================================================================
-- Phase 4: Meta Business Setup
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS meta_setup_progress JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT DEFAULT NULL;

-- ============================================================================
-- Phase 7: Onboarding Calls
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_onboarding_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  topic TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_calls_tenant ON partner_onboarding_calls(tenant_id);

-- ============================================================================
-- Phase 8 (SEO Plan): Custom FAQs
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_faqs JSONB DEFAULT NULL;

-- ============================================================================
-- Subscription Fields
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS mp_subscription_id TEXT DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_failures INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_tenants_subscription_expires ON tenants(subscription_expires_at) WHERE subscription_expires_at IS NOT NULL;
