-- ---------------------------------------------------------------------------
-- Cierra la lectura pública de pedidos, tenants y productos.
--
-- QUÉ PASABA
-- La policy de `orders` era:
--     FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL)
-- Sin cláusula TO, o sea que aplica a PUBLIC (anon incluido). Y `user_id` es
-- NULL en el 100% de los pedidos, porque createOrder lo resuelve con
-- getCurrentUser() (lib/auth.ts), que lee la sesión del cliente de navegador —
-- dentro de una route handler no hay sesión que leer, así que siempre da null.
--
-- Resultado: el segundo término de la policy hacía legible la tabla ENTERA con
-- la anon key, que viaja en el bundle del browser. Verificado el 26/08/2026
-- contando filas con esa key: orders 12/12, order_items 12/12, tenants 88/195,
-- partner_products 464/502.
--
-- Quedaban expuestos email, nombre, teléfono y dirección de cada comprador de
-- cada partner; el arte de cada pedido; y en `tenants` el CBU y el alias donde
-- el partner cobra sus payouts, más el email con el que entra al workspace.
-- El INSERT tenía la misma expresión: se podían insertar pedidos falsos.
--
-- POR QUÉ ES SEGURO CERRARLO
-- Toda lectura de datos de la app pasa por supabaseAdmin (service_role), que
-- saltea RLS: lib/partners/tenant.ts, lib/partners/catalog.ts, lib/db.ts. El
-- cliente anon (lib/supabase.ts) se usa SÓLO para auth — se verificó que
-- ningún archivo que lo importa hace `.from(...)`.
--
-- Las tiendas públicas siguen andando porque se sirven desde el servidor con
-- service_role y ya tienen su propio filtro de columnas sensibles
-- (stripSensitiveMetadata en lib/partners/catalog.ts).
-- ---------------------------------------------------------------------------

-- 1. Pedidos: nadie más que el backend.
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders service_role only" ON orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "order_items service_role only" ON order_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON orders FROM anon, authenticated;
REVOKE ALL ON order_items FROM anon, authenticated;

-- 2. Tenants y productos: la lectura pública se hacía a nivel FILA, así que
--    anon podía pedir cualquier COLUMNA de las filas visibles — incluido
--    bank_cbu, bank_alias, email, y el metadata con costos y arte print-ready.
--    Como las tiendas se sirven desde el servidor, anon no necesita leer nada.
DROP POLICY IF EXISTS "Public can view published tenants" ON tenants;
DROP POLICY IF EXISTS "Public can view published products" ON partner_products;

REVOKE ALL ON tenants FROM anon;
REVOKE ALL ON partner_products FROM anon;
