-- TikTok scheduled posts (per-tenant queue).
-- Run in Supabase SQL editor.

create table if not exists public.tiktok_scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  video_url text not null,
  video_r2_key text,
  caption text not null default '',
  scheduled_at timestamptz not null,
  status text not null default 'pending', -- pending | sent | failed | cancelled
  publish_id text,
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tiktok_scheduled_posts_tenant_idx
  on public.tiktok_scheduled_posts(tenant_id, scheduled_at desc);

create index if not exists tiktok_scheduled_posts_due_idx
  on public.tiktok_scheduled_posts(status, scheduled_at)
  where status = 'pending';

-- Trigger to keep updated_at fresh.
create or replace function public.tiktok_scheduled_posts_set_updated()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tiktok_scheduled_posts_updated on public.tiktok_scheduled_posts;
create trigger trg_tiktok_scheduled_posts_updated
  before update on public.tiktok_scheduled_posts
  for each row execute function public.tiktok_scheduled_posts_set_updated();
