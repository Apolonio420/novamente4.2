-- Tabla para capturar emails del popup de newsletter (novedades / lanzamientos / descuentos)
create table if not exists public.email_captures (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'popup_newsletter',
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create unique index if not exists email_captures_email_key
  on public.email_captures (lower(email));

create index if not exists email_captures_source_idx
  on public.email_captures (source);

create index if not exists email_captures_created_at_idx
  on public.email_captures (created_at desc);

alter table public.email_captures enable row level security;

-- Sin policies de SELECT/INSERT públicas: solo el service role (server) escribe/lee.
