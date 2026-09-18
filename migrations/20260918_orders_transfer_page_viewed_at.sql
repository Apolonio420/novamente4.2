-- Medición del embudo de "checkout por transferencia": hoy no se puede saber
-- cuántos clientes llegan a ver los datos de transferencia (/checkout/transfer)
-- y después no pagan. La orden ya se crea ANTES de esa pantalla (ver
-- app/api/checkout/transfer/route.ts), así que "orden creada" no alcanza para
-- distinguir a los que ni llegaron a ver el alias/CVU de los que los vieron y
-- abandonaron. Caso real 17/09: carrito de $111.400 impago, titular
-- desconocido al transferir → desconfianza.
--
-- Elegimos una columna nullable en `orders` en vez de una tabla de eventos
-- nueva porque: (1) el evento es 1:1 con una orden que ya existe para ese
-- momento, no necesita su propia identidad/tabla; (2) no requiere RLS ni
-- índices nuevos aparte de uno opcional; (3) es la migración más chica posible
-- (un ALTER TABLE) y sigue el mismo patrón que
-- migrations/onboarding_funnel_timestamps.sql. Additive y nullable a
-- propósito: no rompe los inserts/updates existentes.
--
-- El código que la escribe (app/api/checkout/transfer/viewed/route.ts) es
-- fail-soft: si esta columna no existe todavía (migración no aplicada), el
-- UPDATE falla, se loguea y se ignora — nunca afecta al cliente.
--
-- Run manual en Supabase Studio, o: npx tsx scripts/apply-migration.ts
-- migrations/20260918_orders_transfer_page_viewed_at.sql

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS transfer_page_viewed_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN orders.transfer_page_viewed_at IS
  'Timestamp de la primera vez que el cliente vio /checkout/transfer para esta orden (payment_method=transferencia). NULL = nunca llegó a ver los datos de transferencia. Se setea una sola vez (no se pisa).';

-- Query de embudo: creadas vs vistas vs pagadas
-- SELECT
--   COUNT(*) AS ordenes_transferencia,
--   COUNT(*) FILTER (WHERE transfer_page_viewed_at IS NOT NULL) AS vieron_datos_transferencia,
--   COUNT(*) FILTER (WHERE payment_status = 'paid') AS pagaron
-- FROM orders
-- WHERE payment_method = 'transferencia' AND created_at >= NOW() - INTERVAL '30 days';
