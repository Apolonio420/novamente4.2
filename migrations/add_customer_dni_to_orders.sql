-- migrations/add_customer_dni_to_orders.sql
-- Agrega columnas para guardar el DNI/CUIT del cliente capturado
-- automaticamente desde MercadoPago al confirmar el pago.
--
-- customer_dni      → numero (string para preservar ceros a la izquierda)
-- customer_dni_type → "DNI" | "CUIT" | "CUIL" | "Otro" (capturado desde MP)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_dni text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_dni_type text;

COMMENT ON COLUMN orders.customer_dni IS 'DNI/CUIT del cliente, capturado auto desde MercadoPago al confirmar pago';
COMMENT ON COLUMN orders.customer_dni_type IS 'Tipo de identificacion: DNI, CUIT, CUIL, etc.';

CREATE INDEX IF NOT EXISTS orders_customer_dni_idx
  ON orders (customer_dni)
  WHERE customer_dni IS NOT NULL;
