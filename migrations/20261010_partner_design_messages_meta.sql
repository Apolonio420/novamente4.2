-- partner_design_messages.meta — APLICADA en prod (11/2026, verificado).
-- El código ya la usa: lib/partners/studio/message-meta.ts (sanitiza/arma el meta),
-- session-service.ts (saveStudioMessage lo envía; fetchSessionMessages lo mapea
-- de vuelta) y app/api/partners/design/sessions/[sessionId]/messages/route.ts
-- (lo inserta; si la columna falta en algún entorno — PGRST204/42703 — reintenta sin meta).
--
-- Por qué hace falta: partner_design_messages (migrations/
-- create_partner_studio_tables.sql) guardaba role/content/image_url/type/
-- style_applied/style_name/prompt_used/garment_key/moderation_status/error —
-- pero NO `side`, `garmentColor`, `designImageUrl`, `stampMode`, `placement`
-- ni `stampWidthCm` (printSpecOf en app/workspace/design-engine/page.tsx).
-- Ahora se persisten en `meta` al guardar mensajes mockup/design y se leen al
-- reabrir la sesión.
--
-- Mensajes guardados ANTES de este cambio tienen meta NULL: se mantiene el guard de
-- handleCreateDualSideProduct ("Volvé a aplicarlo a la prenda...").

ALTER TABLE partner_design_messages
  ADD COLUMN IF NOT EXISTS meta JSONB;

COMMENT ON COLUMN partner_design_messages.meta IS
  'Metadata de impresión del mensaje (side, garmentColor, designImageUrl, stampMode, placement, stampWidthCm) — persistida desde 11/2026 (mensajes anteriores: NULL, ver guard en app/workspace/design-engine/page.tsx handleCreateDualSideProduct).';
