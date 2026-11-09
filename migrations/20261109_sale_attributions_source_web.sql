-- Migration: sale_attributions acepta ventas de la tienda web (09/11/2026).
--
-- Problema: solo el bot escribía en sale_attributions (CHECK source IN
-- ('bot','operator')), así que las ventas del checkout web no dejaban fila y
-- quedaban sin atribuir (NOV-20261105-9051, $41.030, única venta cobrada de
-- noviembre). Ver chatbot/reuniones/growth/atribucion-verificacion-2026-11-09.md.
--
-- Qué hace:
--   1. Amplía el CHECK de `source` con 'web' (= venta confirmada en la tienda,
--      escrita por lib/payments/web-sale-attribution.ts). No toca filas.
--   2. Índice único parcial: una sola fila 'web' por pedido (order_ref =
--      orders.order_number). Cubre el reintento concurrente del webhook de MP y
--      el fallback /api/payments/confirm. Las filas del bot no se ven afectadas.
--
-- Idempotente. Orden de despliegue: ESTA migración primero, código después (sin
-- la migración, el insert falla por el CHECK, se loguea y el pago sigue igual).
-- Run: Supabase SQL Editor (tabla compartida con chatbot-whastapp, que tiene sus
-- migraciones en scripts/migrations/20260720_sale_attributions.sql y
-- 20261103_sale_attributions_origin.sql).

DO $$
DECLARE
  c record;
BEGIN
  -- El CHECK inline de 20260720 se llama sale_attributions_source_check (nombre
  -- automático de Postgres); se busca por definición por si tiene otro nombre.
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.sale_attributions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%source%'
      AND pg_get_constraintdef(oid) NOT ILIKE '%''web''%'
  LOOP
    EXECUTE format('ALTER TABLE public.sale_attributions DROP CONSTRAINT %I', c.conname);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sale_attributions_source_check'
      AND conrelid = 'public.sale_attributions'::regclass
  ) THEN
    ALTER TABLE public.sale_attributions
      ADD CONSTRAINT sale_attributions_source_check
      CHECK (source IN ('bot','operator','web'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_sale_attributions_web_order_ref
  ON public.sale_attributions (order_ref)
  WHERE source = 'web';

COMMENT ON COLUMN public.sale_attributions.source IS
  'bot = cotización/venta del bot de WhatsApp · operator = venta confirmada a mano sin fila previa · web = venta confirmada en la tienda web (order_ref = orders.order_number).';
