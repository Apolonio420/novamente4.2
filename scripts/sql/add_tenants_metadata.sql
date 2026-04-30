-- Adds the missing metadata jsonb column on tenants.
-- Used by /api/auth/tiktok/callback to persist tiktok_integration tokens
-- and by /api/partners/integrations/tiktok/* to read them.
-- Without this column the callback silently fails and the integration
-- shows open_id/scope = empty in the workspace UI.

alter table public.tenants
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists tenants_metadata_tiktok_idx
  on public.tenants ((metadata -> 'tiktok_integration'))
  where metadata ? 'tiktok_integration';
