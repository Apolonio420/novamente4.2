-- Partner Studio: Design sessions, messages, and usage tracking
-- Migration for the chat-based partner designer feature

-- 1. Design sessions (chat conversations)
CREATE TABLE IF NOT EXISTS partner_design_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  selected_style TEXT,
  selected_garment TEXT DEFAULT 'aura-oversize-tshirt',
  message_count INT DEFAULT 0,
  last_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pds_tenant ON partner_design_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pds_user ON partner_design_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pds_updated ON partner_design_sessions(tenant_id, updated_at DESC);

-- 2. Design messages (individual chat messages)
CREATE TABLE IF NOT EXISTS partner_design_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES partner_design_sessions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  attached_image_url TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'design', 'mockup')),
  style_applied TEXT,
  style_name TEXT,
  prompt_used TEXT,
  garment_key TEXT,
  moderation_status TEXT DEFAULT 'passed' CHECK (moderation_status IN ('passed', 'blocked', 'flagged')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdm_session ON partner_design_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_pdm_tenant ON partner_design_messages(tenant_id);

-- 3. Generation usage tracking (one row per generation event)
CREATE TABLE IF NOT EXISTS partner_generation_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('design', 'mockup')),
  session_id UUID REFERENCES partner_design_sessions(id) ON DELETE SET NULL,
  asset_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pgu_tenant_date ON partner_generation_usage(tenant_id, created_at DESC);

-- 4. Extend partner_design_config with brand essence columns
ALTER TABLE partner_design_config
  ADD COLUMN IF NOT EXISTS visual_mood TEXT,
  ADD COLUMN IF NOT EXISTS brand_keywords TEXT[],
  ADD COLUMN IF NOT EXISTS prompt_suffix TEXT;

-- 5. Helper function: increment session message count
CREATE OR REPLACE FUNCTION increment_session_message_count(sid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE partner_design_sessions
  SET message_count = message_count + 1
  WHERE id = sid;
END;
$$ LANGUAGE plpgsql;
