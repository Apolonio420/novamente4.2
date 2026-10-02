-- ---------------------------------------------------------------------------
-- Embudo de checkout: hoy no hay forma de medir cuánta gente se traba antes de
-- pagar. Los logs de Vercel retienen minutos, no días, y `orders` solo tiene
-- 22 filas porque recién ahí aparece un pedido — todo lo que pasa ANTES
-- (entrar a /checkout, tocar "Confirmar" con datos incompletos, abandonar) se
-- pierde. Dos bugs reales que esto hubiera detectado el mismo día: el botón
-- "Confirmar" quedó mudo desde 08/2025 (nadie veía el alert porque el botón
-- estaba disabled), y desde el 03/09/2026 el form pasó a exigir 7 campos sin
-- que bajara la tasa de conversión visible en ningún lado — resultado: CERO
-- pedidos web entre el 27/09 y el 01/10.
--
-- Por qué una tabla de eventos (no una columna en `orders`, a diferencia de
-- migrations/20260918_orders_transfer_page_viewed_at.sql): acá el evento
-- "checkout_view" y "confirm_click" pasan ANTES de que exista una orden —
-- no hay fila de `orders` todavía a la cual colgarle un timestamp. Necesita
-- su propia identidad (session_id de browser) para poder armar el embudo
-- completo vista → click → pedido → pago.
--
-- Fail-soft en todo el camino: lib/checkout/funnel.ts#registrarEventoCheckout
-- nunca tira, solo console.warn con prefijo "[checkout-funnel]". Si esta
-- migración no corrió todavía, el insert falla contra una tabla inexistente,
-- se loguea y se ignora — nunca afecta a un cliente pagando.
--
-- Run manual en Supabase Studio, o: npx tsx scripts/apply-migration.ts
-- migrations/20261001_checkout_events.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS checkout_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Id random generado client-side (sessionStorage) por pestaña/sesión de
  -- browser — NO es un user id, solo sirve para unir los eventos de una misma
  -- visita. Ver lib/checkout/funnel.ts#sanitizarEvento (regex /^[A-Za-z0-9_-]{8,64}$/).
  session_id TEXT NOT NULL CHECK (char_length(session_id) <= 64),
  event TEXT NOT NULL CHECK (event IN ('checkout_view', 'confirm_click', 'order_created', 'payment_approved')),
  -- Solo aplica a 'confirm_click': true si pasó la validación de campos.
  valid BOOLEAN NULL,
  -- Solo aplica a 'confirm_click' con valid=false: qué campos faltaban/eran
  -- inválidos (allowlist de 7 ids — ver CAMPOS_OBLIGATORIOS en lib/checkout/form-checkout.ts).
  missing_fields TEXT[] NULL,
  payment_method TEXT NULL CHECK (payment_method IS NULL OR payment_method IN ('mercadopago', 'transferencia')),
  order_id UUID NULL,
  tenant_id UUID NULL,
  -- Monto del carrito en ARS al momento del evento (no necesariamente lo que
  -- termina pagando — eso lo da `orders.total`).
  cart_value INTEGER NULL CHECK (cart_value IS NULL OR cart_value >= 0),
  items INTEGER NULL CHECK (items IS NULL OR items >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_checkout_events_created_at ON checkout_events (created_at);
CREATE INDEX IF NOT EXISTS idx_checkout_events_event_created_at ON checkout_events (event, created_at);
CREATE INDEX IF NOT EXISTS idx_checkout_events_order_id ON checkout_events (order_id);

-- RLS habilitado, SIN policies: solo accesible con la service_role key
-- (supabaseAdmin), igual que el resto de las tablas de operación interna —
-- ver migrations/20260827_cerrar_tablas_sin_rls.sql. El cliente nunca lee esta
-- tabla directo, solo escribe vía POST /api/checkout/events.
ALTER TABLE checkout_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON checkout_events FROM anon;
REVOKE ALL ON checkout_events FROM authenticated;

COMMENT ON TABLE checkout_events IS
  'Embudo de checkout web: checkout_view → confirm_click (valid/missing_fields) → order_created → payment_approved. Insertado fail-soft desde app/checkout/page.tsx (cliente, solo view/confirm_click) y server (order_created/payment_approved). Ver lib/checkout/funnel.ts.';

-- Embudo diario en hora de Argentina — sesiones únicas por etapa + pedidos y
-- pagos (estos por order_id, no por session_id, porque pueden confirmarse
-- días después de la sesión que originó la compra).
CREATE OR REPLACE VIEW checkout_funnel_daily WITH (security_invoker = true) AS
SELECT
  (date_trunc('day', created_at AT TIME ZONE 'America/Argentina/Buenos_Aires'))::date AS day,
  COUNT(DISTINCT session_id) FILTER (WHERE event = 'checkout_view') AS sessions_view,
  COUNT(DISTINCT session_id) FILTER (WHERE event = 'confirm_click') AS sessions_click,
  COUNT(DISTINCT session_id) FILTER (WHERE event = 'confirm_click' AND valid = false) AS sessions_click_invalid,
  COUNT(DISTINCT session_id) FILTER (WHERE event = 'confirm_click' AND valid = true) AS sessions_click_valid,
  COUNT(DISTINCT order_id) FILTER (WHERE event = 'order_created') AS orders_created,
  COUNT(DISTINCT order_id) FILTER (WHERE event = 'payment_approved') AS payments_approved
FROM checkout_events
GROUP BY 1
ORDER BY 1 DESC;

COMMENT ON VIEW checkout_funnel_daily IS
  'Embudo diario (hora AR) de checkout_events: sesiones que vieron el checkout, que tocaron Confirmar (válido/inválido), pedidos creados y pagos aprobados. order_created/payments_approved cuentan order_id distinto, no sesiones.';

-- Qué campo falta más seguido cuando "Confirmar" sale inválido — para saber
-- si el problema es el form (ej. todos fallan en "phone") o abandono real.
CREATE OR REPLACE VIEW checkout_missing_fields_daily WITH (security_invoker = true) AS
SELECT
  (date_trunc('day', created_at AT TIME ZONE 'America/Argentina/Buenos_Aires'))::date AS day,
  campo AS field,
  COUNT(*) AS count
FROM checkout_events, unnest(missing_fields) AS campo
WHERE event = 'confirm_click' AND valid = false
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC;

COMMENT ON VIEW checkout_missing_fields_daily IS
  'Desglose diario de qué campo obligatorio falta más seguido en los confirm_click inválidos (unnest de missing_fields). Útil para decidir si hay que sacar/simplificar un campo del form.';

-- Las vistas nuevas en public quedan con GRANT a anon/authenticated por los
-- default privileges de Supabase: cerrarlas igual que la tabla (solo service_role).
REVOKE ALL ON checkout_funnel_daily FROM anon, authenticated;
REVOKE ALL ON checkout_missing_fields_daily FROM anon, authenticated;

-- Query de ejemplo — embudo de los últimos 14 días:
-- SELECT * FROM checkout_funnel_daily WHERE day >= CURRENT_DATE - INTERVAL '14 days';
--
-- Y el campo que más frena en ese mismo rango:
-- SELECT field, SUM(count) AS total
-- FROM checkout_missing_fields_daily
-- WHERE day >= CURRENT_DATE - INTERVAL '14 days'
-- GROUP BY field ORDER BY total DESC;
