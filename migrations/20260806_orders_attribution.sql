-- Migration: atribución de marketing en `orders`.
--
-- Problema: `orders` no guardaba de dónde venía la venta (0 columnas de atribución),
-- así que la plata gastada en ads a la web era inmedible. Hay campañas corriendo
-- AHORA con UTMs (Malvinas) cuyos datos se estaban perdiendo.
--
-- Qué hace: agrega 9 columnas TEXT NULLABLE. Es puramente aditivo — ninguna orden
-- existente cambia, ningún código viejo se rompe, el motor de pagos no se toca.
-- Los datos los captura el navegador (lib/attribution.ts, last-touch, TTL 30 días)
-- y viajan con el checkout hacia createOrder (lib/db.ts).
--
-- Idempotente: ADD COLUMN IF NOT EXISTS → re-ejecutar no hace nada.
-- Run: npx tsx scripts/apply-migration.ts migrations/20260806_orders_attribution.sql

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS utm_source   TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium   TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content  TEXT,
  ADD COLUMN IF NOT EXISTS utm_term     TEXT,
  ADD COLUMN IF NOT EXISTS fbclid       TEXT,
  ADD COLUMN IF NOT EXISTS gclid        TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS referrer     TEXT;

COMMENT ON COLUMN orders.utm_source   IS 'Atribución last-touch: utm_source de la URL de entrada (captura en navegador, TTL 30d)';
COMMENT ON COLUMN orders.utm_medium   IS 'Atribución last-touch: utm_medium';
COMMENT ON COLUMN orders.utm_campaign IS 'Atribución last-touch: utm_campaign — la dimensión clave para medir ROAS por campaña';
COMMENT ON COLUMN orders.utm_content  IS 'Atribución last-touch: utm_content (creativo/variante del ad)';
COMMENT ON COLUMN orders.utm_term     IS 'Atribución last-touch: utm_term (keyword en search)';
COMMENT ON COLUMN orders.fbclid       IS 'Atribución last-touch: click id de Meta Ads';
COMMENT ON COLUMN orders.gclid        IS 'Atribución last-touch: click id de Google Ads';
COMMENT ON COLUMN orders.landing_page IS 'Atribución last-touch: path+query donde aterrizó el usuario con la campaña';
COMMENT ON COLUMN orders.referrer     IS 'Atribución last-touch: document.referrer externo (null si venía de navegación interna)';

-- Las consultas de análisis filtran por campaña sobre pedidos pagos. El índice
-- parcial evita indexar las miles de filas históricas con utm_campaign NULL.
CREATE INDEX IF NOT EXISTS idx_orders_utm_campaign
  ON orders (utm_campaign)
  WHERE utm_campaign IS NOT NULL;
