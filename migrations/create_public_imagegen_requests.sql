-- Rate-limit + tope diario global para endpoints publicos/anonimos de
-- generacion de imagen (Gemini). Ver lib/security/public-image-guard.ts.
--
-- Una fila por request ALLOWED (se inserta ANTES de llamar a Gemini, luego
-- de pasar los chequeos de rate-limit + cap). La misma tabla sirve para:
--   1. Contar requests por IP (hasheada) + familia de endpoint en ventanas
--      deslizantes de 1 minuto y 1 dia.
--   2. Contar el total global del dia (tope PUBLIC_IMAGEGEN_DAILY_CAP).
--
-- Auditoria 2026-07-11: reemplaza el rate-limiter viejo (lib/rate-limit.ts,
-- Map en memoria por instancia serverless — sin techo real en Vercel).
--
-- IMPORTANTE: esta tabla crece sin limite si no se purga. No tiene TTL/cron
-- de limpieza todavia (fuera de alcance de esta migracion) — filas de mas
-- de ~2 dias no sirven para nada (ni el rate-limit por minuto/dia ni el cap
-- diario las necesitan). TODO: agregar cron de purga si el volumen lo
-- justifica (ver vercel.json crons existentes como referencia de patron).

CREATE TABLE IF NOT EXISTS public_imagegen_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  endpoint_family text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_imagegen_requests_ip_family_created
  ON public_imagegen_requests (ip_hash, endpoint_family, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_public_imagegen_requests_created
  ON public_imagegen_requests (created_at DESC);

COMMENT ON TABLE public_imagegen_requests IS
  'Rate-limit + tope diario global para endpoints publicos de generacion de imagen (Gemini). Purgar filas > 2 dias periodicamente (sin cron todavia).';
