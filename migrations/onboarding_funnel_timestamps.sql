-- Funnel timestamps for onboarding metrics (TASK-016)
-- Run once in Supabase Studio. All columns are nullable and only set the first time.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS first_branding_save_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS first_design_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS first_product_draft_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS first_product_published_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS storefront_published_at TIMESTAMPTZ NULL;

-- Query to inspect funnel drop-off:
-- SELECT
--   COUNT(*) FILTER (WHERE first_login_at IS NOT NULL) AS logged_in,
--   COUNT(*) FILTER (WHERE first_branding_save_at IS NOT NULL) AS saved_branding,
--   COUNT(*) FILTER (WHERE first_design_at IS NOT NULL) AS created_design,
--   COUNT(*) FILTER (WHERE first_product_draft_at IS NOT NULL) AS created_draft,
--   COUNT(*) FILTER (WHERE first_product_published_at IS NOT NULL) AS published_product,
--   COUNT(*) FILTER (WHERE storefront_published_at IS NOT NULL) AS published_storefront
-- FROM tenants
-- WHERE status NOT IN ('suspended') AND created_at >= NOW() - INTERVAL '90 days';
