-- Agrega columnas opcionales de metadata a public_imagegen_requests para
-- poder sacar estadisticas de que le piden los visitantes al generador de
-- imagen publico (/crear y el studio de storefront). La tabla original
-- (create_public_imagegen_requests.sql, 2026-08-05) solo guardaba
-- ip_hash/endpoint_family/created_at para el rate-limit — nunca tuvo el
-- prompt. Ver lib/security/public-image-guard.ts.
--
-- Additive y nullable a proposito: no rompe los inserts existentes (3
-- columnas) ni requiere backfill. Run: npx tsx scripts/apply-migration.ts
-- migrations/20260909_public_imagegen_requests_prompt.sql

ALTER TABLE public_imagegen_requests
  ADD COLUMN IF NOT EXISTS prompt text,
  ADD COLUMN IF NOT EXISTS style text,
  ADD COLUMN IF NOT EXISTS meta jsonb;

COMMENT ON COLUMN public_imagegen_requests.prompt IS
  'Prompt del visitante (truncado a 1000 caracteres), cuando el endpoint lo tiene. NULL para familias sin prompt (remove-bg, try-on, etc).';
COMMENT ON COLUMN public_imagegen_requests.style IS
  'Estilo/opcion elegida por el visitante, cuando aplica.';
COMMENT ON COLUMN public_imagegen_requests.meta IS
  'Metadata adicional por request (ej. tenant_slug del storefront que origino el pedido).';
