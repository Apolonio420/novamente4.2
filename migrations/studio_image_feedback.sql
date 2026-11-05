-- Feedback con caritas (😞 😐 😊) debajo de cada imagen generada o editada en
-- /crear (pedido de Juan 05/11/2026; registro R-2026-019). Lo escribe
-- app/api/public/design/feedback y lo lee el admin. Solo service role (RLS
-- prendido y sin policies): el endpoint público pasa por supabaseAdmin.
create table if not exists public.studio_image_feedback (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  rating smallint not null check (rating in (1, 2, 3)), -- 1 = 😞, 2 = 😐, 3 = 😊
  operation text not null,   -- generate | edit | edit-photo | variant | remove-bg | mockup-lifestyle | mockup-prenda
  prompt text,
  image_url text not null,
  garment_type text,
  garment_color text,
  session_id text,
  ip_hash text
);

create index if not exists studio_image_feedback_created_at_idx on public.studio_image_feedback (created_at desc);
create index if not exists studio_image_feedback_ip_hash_idx on public.studio_image_feedback (ip_hash, created_at desc);

alter table public.studio_image_feedback enable row level security;
