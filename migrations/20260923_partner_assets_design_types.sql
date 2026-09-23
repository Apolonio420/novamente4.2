-- partner_assets: permitir los type/status que el Studio ya escribe.
--
-- Contexto (verificado en prod 23/09/2026 con pg_constraint):
--   partner_assets_type_check   = logo|banner|hero|product|mockup|generated|approved|other
--   partner_assets_status_check = uploaded|processed|approved|public|archived
--
-- saveDesignAsset() (lib/partners/design-engine.ts) inserta type 'design' | 'mockup'
-- | 'stamp' con status 'active', y /api/partners/upload inserta type 'design' con
-- status 'active'. 'active' no está en el CHECK de status → TODOS esos inserts
-- fallaban (23514) y el error se tragaba: 0 filas de Studio en la tabla, la
-- biblioteca (/api/partners/design/library, filtra status='active') siempre vacía y
-- el límite de uploads por plan nunca contaba nada.
--
-- Solo AMPLÍA los conjuntos permitidos: toda fila existente sigue siendo válida.
-- Idempotente (drop if exists + add). Correr en Supabase SQL editor con OK de Juan.

begin;

alter table public.partner_assets drop constraint if exists partner_assets_type_check;
alter table public.partner_assets add constraint partner_assets_type_check
  check (type in (
    'logo', 'banner', 'hero', 'product', 'mockup', 'generated', 'approved', 'other',
    'design', 'stamp'
  ));

alter table public.partner_assets drop constraint if exists partner_assets_status_check;
alter table public.partner_assets add constraint partner_assets_status_check
  check (status in ('uploaded', 'processed', 'approved', 'public', 'archived', 'active'));

commit;
