-- Migration: order_items_partner_product_link_and_stock_decrement (Fase 2)
-- 1) Link real venta -> producto del catálogo (hoy los items solo guardan nombre en texto).
--    UUID nullable, SIN foreign key: un producto borrado no debe bloquear pedidos viejos;
--    el decremento simplemente no encuentra la fila (0 rows) y sigue.
-- 2) Función de decremento ATÓMICO de stock (a prueba de concurrencia: dos ventas del mismo
--    producto a la vez no se pisan, cada UPDATE es atómico). Solo afecta stock finito (no null),
--    clampea a 0 (nunca negativo). Producción es on-demand → un oversell no es catastrófico.
-- Backward compatible: columna nueva nullable, pedidos existentes intactos.
-- Run: npx tsx scripts/apply-migration.ts migrations/20260723_order_items_partner_product_link_and_stock_decrement.sql

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS partner_product_id UUID;

CREATE OR REPLACE FUNCTION decrement_partner_product_stock(p_id UUID, p_qty INTEGER)
RETURNS INTEGER
LANGUAGE sql
AS $$
  UPDATE partner_products
     SET stock = GREATEST(stock - p_qty, 0),
         updated_at = now()
   WHERE id = p_id
     AND stock IS NOT NULL
  RETURNING stock;
$$;
