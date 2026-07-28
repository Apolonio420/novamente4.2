-- Migration: garment_stock — stock por talle/color para prendas de LIQUIDACION (proveedor viejo).
-- Semantica: SOLO se trackean las combinaciones (product_key, color, size) que tienen fila aca.
--   Si una combinacion no tiene fila => stock ilimitado (proveedor actual, se repone) y la venta
--   sigue como siempre. Por eso NO se cargan Negro/Blanco/Stone Wash: esos colores se reponen.
-- Compartida por los 3 repos (tienda 4.2, platform admin, chatbot) via el mismo proyecto Supabase.
-- product_key canonico: 'buzo-oversize' | 'remera-oversize'
-- color canonico:       'marron' | 'crema' | 'gris-melange'  (lowercase, sin acentos)
-- Seed: planilla "Datos de Facturacion" hoja Inventario (28/07/2026), columna "Stock actual".
-- RLS habilitado sin policies => solo service_role (los 3 repos usan service role server-side).
-- Idempotente: re-ejecutar NO pisa cantidades (ON CONFLICT DO NOTHING).
-- Run: npx tsx scripts/apply-migration.ts migrations/20260728_garment_stock_liquidation.sql

CREATE TABLE IF NOT EXISTS garment_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,                -- SKU de la planilla del proveedor viejo (005, 013, ...)
  product_key TEXT NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0 CHECK (qty >= 0),
  initial_qty INTEGER,            -- referencia historica (columna "Inicial" de la planilla)
  active BOOLEAN NOT NULL DEFAULT TRUE,  -- false = dejar de trackear sin borrar historial
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_key, color, size)
);

ALTER TABLE garment_stock ENABLE ROW LEVEL SECURITY;

-- Decremento ATOMICO (mismo patron probado de decrement_partner_product_stock):
-- clampea a 0, solo filas activas. Devuelve qty resultante, o NULL si la combinacion
-- no esta trackeada (caso normal para colores de reposicion permanente => no-op).
-- Normalizador tolerante: lowercase, sin acentos, espacios/underscores => guion.
-- Asi 'MARRÓN', 'marron' y 'Gris Melange' matchean la misma fila canonica.
CREATE OR REPLACE FUNCTION normalize_garment_term(p TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT replace(replace(translate(lower(trim(p)), 'áéíóúüñ', 'aeiouun') , ' ', '-'), '_', '-');
$$;

CREATE OR REPLACE FUNCTION decrement_garment_stock(
  p_product_key TEXT, p_color TEXT, p_size TEXT, p_qty INTEGER
)
RETURNS INTEGER
LANGUAGE sql
AS $$
  UPDATE garment_stock
     SET qty = GREATEST(qty - p_qty, 0),
         updated_at = now()
   WHERE normalize_garment_term(product_key) = normalize_garment_term(p_product_key)
     AND normalize_garment_term(color) = normalize_garment_term(p_color)
     AND upper(trim(size)) = upper(trim(p_size))
     AND active
  RETURNING qty;
$$;

-- Guard de idempotencia para descuento sobre pedidos del bot / carga manual:
-- quien confirma la venta (cron del bot O boton VENTA del admin) "reclama" el descuento
-- con UPDATE ... WHERE stock_decremented_at IS NULL antes de decrementar.
ALTER TABLE whatsapp_orders
  ADD COLUMN IF NOT EXISTS stock_decremented_at TIMESTAMPTZ;

-- Seed liquidacion proveedor viejo (solo colores SIN reposicion).
INSERT INTO garment_stock (sku, product_key, color, size, qty, initial_qty, notes) VALUES
  ('005', 'buzo-oversize',   'marron',       'S',  0, 3, 'Liquidacion proveedor viejo'),
  ('006', 'buzo-oversize',   'marron',       'M',  2, 5, 'Liquidacion proveedor viejo'),
  ('007', 'buzo-oversize',   'marron',       'L',  1, 4, 'Liquidacion proveedor viejo'),
  ('008', 'buzo-oversize',   'marron',       'XL', 1, 3, 'Liquidacion proveedor viejo'),
  ('033', 'buzo-oversize',   'crema',        'S',  1, 2, 'Liquidacion proveedor viejo'),
  ('034', 'buzo-oversize',   'crema',        'M',  1, 3, 'Liquidacion proveedor viejo'),
  ('035', 'buzo-oversize',   'crema',        'L',  0, 4, 'Liquidacion proveedor viejo'),
  ('036', 'buzo-oversize',   'crema',        'XL', 1, 3, 'Liquidacion proveedor viejo'),
  ('037', 'buzo-oversize',   'gris-melange', 'S',  2, 2, 'Liquidacion proveedor viejo'),
  ('038', 'buzo-oversize',   'gris-melange', 'M',  3, 3, 'Liquidacion proveedor viejo'),
  ('039', 'buzo-oversize',   'gris-melange', 'L',  1, 3, 'Liquidacion proveedor viejo'),
  ('040', 'buzo-oversize',   'gris-melange', 'XL', 3, 3, 'Liquidacion proveedor viejo'),
  ('013', 'remera-oversize', 'marron',       'S',  4, 4, 'Liquidacion proveedor viejo'),
  ('014', 'remera-oversize', 'marron',       'M',  7, 7, 'Liquidacion proveedor viejo'),
  ('015', 'remera-oversize', 'marron',       'L',  4, 8, 'Liquidacion proveedor viejo'),
  ('016', 'remera-oversize', 'marron',       'XL', 8, 8, 'Liquidacion proveedor viejo')
ON CONFLICT (product_key, color, size) DO NOTHING;
