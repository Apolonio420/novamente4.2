-- Migration: increment_discount_code_uses (Fase 2 checkout)
-- Incremento ATOMICO de partner_discount_codes.uses_count al confirmarse una
-- venta con codigo de descuento aplicado — mismo patron probado que
-- decrement_partner_product_stock / decrement_garment_stock: la condicion
-- (max_uses IS NULL OR uses_count < max_uses) vive en el propio UPDATE, no en
-- una lectura previa, asi que dos confirmaciones concurrentes del mismo
-- codigo no pueden superar el tope por una carrera de lectura-y-escritura.
-- Devuelve el uses_count resultante, o NULL si el codigo ya estaba en el tope
-- (o no existe) — ese caso no debe romper una venta ya pagada, solo no suma.
-- Run: npx tsx scripts/apply-migration.ts migrations/20260829_discount_code_atomic_increment.sql

CREATE OR REPLACE FUNCTION increment_discount_code_uses(p_id UUID)
RETURNS INTEGER
LANGUAGE sql
AS $$
  UPDATE partner_discount_codes
     SET uses_count = uses_count + 1,
         updated_at = now()
   WHERE id = p_id
     AND (max_uses IS NULL OR uses_count < max_uses)
  RETURNING uses_count;
$$;

-- Sin esto la funcion queda ejecutable por anon via PostgREST (default de
-- Postgres: EXECUTE a PUBLIC): cualquiera con la anon key podria quemar los
-- usos de un cupon hasta agotarlo. Solo el service_role (el server) la llama.
REVOKE ALL ON FUNCTION increment_discount_code_uses(UUID) FROM PUBLIC, anon, authenticated;
