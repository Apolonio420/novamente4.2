-- Add source column to partner_assets to distinguish uploaded vs AI-generated designs
-- Run manually in Supabase Studio. Part of TASK-020.

ALTER TABLE partner_assets
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ai_generated'
CHECK (source IN ('ai_generated', 'uploaded'));

-- Index to speed up limit count queries
CREATE INDEX IF NOT EXISTS idx_partner_assets_tenant_source
  ON partner_assets (tenant_id, source)
  WHERE source = 'uploaded';
