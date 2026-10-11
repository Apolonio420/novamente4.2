-- partner_design_messages.meta — pendiente (dueño de viaje, no se puede correr
-- a mano ahora). NO está aplicada todavía: verificado por
-- information_schema.columns contra POSTGRES_URL_NON_POOLING el 10/10/2026,
-- la tabla no tiene ninguna columna jsonb hoy.
--
-- Por qué hace falta: partner_design_messages (migrations/
-- create_partner_studio_tables.sql) guarda role/content/image_url/type/
-- style_applied/style_name/prompt_used/garment_key/moderation_status/error —
-- pero NO guarda `side`, `garmentColor`, `designImageUrl`, `stampMode`,
-- `placement` ni `stampWidthCm` (ver saveStudioMessage en
-- lib/partners/studio/session-service.ts, y printSpecOf en
-- app/workspace/design-engine/page.tsx). Esos campos solo viven en memoria
-- del browser: al recargar la página o reabrir una sesión vieja, un mockup
-- "afianzado" para armar un producto doble estampa (handleCreateDualSideProduct)
-- pierde esa metadata — el guard agregado en handleCreateDualSideProduct
-- bloquea crear el producto en ese caso ("Volvé a aplicarlo a la prenda...")
-- en vez de crearlo con el arte de impresión vacío.
--
-- Esta migración agrega la columna para que el fix de raíz (persistir esos
-- campos en saveStudioMessage/getSessionMessages) se pueda hacer sin otra
-- migración. El código de la app TODAVÍA NO lee/escribe `meta` — aplicar
-- esta migración no cambia ningún comportamiento por sí sola. Queda como
-- pendiente explícito en el reporte de este fix.

ALTER TABLE partner_design_messages
  ADD COLUMN IF NOT EXISTS meta JSONB;

COMMENT ON COLUMN partner_design_messages.meta IS
  'Metadata de impresión del mensaje (side, garmentColor, designImageUrl, stampMode, placement, stampWidthCm) — no persistida antes de 10/2026. Escribir/leer SOLO si esta columna existe (ver guard en app/workspace/design-engine/page.tsx handleCreateDualSideProduct).';
