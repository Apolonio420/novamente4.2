-- Migración para agregar columnas faltantes a las tablas orders y order_items existentes
-- Esta migración es segura de ejecutar múltiples veces

-- Agregar columnas faltantes a la tabla orders
DO $$ 
BEGIN
    -- Agregar order_number si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'order_number') THEN
        ALTER TABLE orders ADD COLUMN order_number VARCHAR(50) UNIQUE;
    END IF;

    -- Agregar user_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'user_id') THEN
        ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Agregar customer_email si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'customer_email') THEN
        ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255);
    END IF;

    -- Agregar customer_first_name si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'customer_first_name') THEN
        ALTER TABLE orders ADD COLUMN customer_first_name VARCHAR(255);
    END IF;

    -- Agregar customer_last_name si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'customer_last_name') THEN
        ALTER TABLE orders ADD COLUMN customer_last_name VARCHAR(255);
    END IF;

    -- Agregar customer_phone si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'customer_phone') THEN
        ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(50);
    END IF;

    -- Agregar shipping_address si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'shipping_address') THEN
        ALTER TABLE orders ADD COLUMN shipping_address TEXT;
    END IF;

    -- Agregar shipping_city si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'shipping_city') THEN
        ALTER TABLE orders ADD COLUMN shipping_city VARCHAR(255);
    END IF;

    -- Agregar shipping_postal_code si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'shipping_postal_code') THEN
        ALTER TABLE orders ADD COLUMN shipping_postal_code VARCHAR(20);
    END IF;

    -- Agregar payment_method si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50);
    END IF;

    -- Agregar payment_status si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
        ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
    END IF;

    -- Agregar payment_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_id') THEN
        ALTER TABLE orders ADD COLUMN payment_id VARCHAR(255);
    END IF;

    -- Agregar external_reference si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'external_reference') THEN
        ALTER TABLE orders ADD COLUMN external_reference VARCHAR(255);
    END IF;

    -- Agregar mercado_pago_preference_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'mercado_pago_preference_id') THEN
        ALTER TABLE orders ADD COLUMN mercado_pago_preference_id VARCHAR(255);
    END IF;

    -- Agregar subtotal si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
        ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2);
    END IF;

    -- Agregar shipping_cost si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'shipping_cost') THEN
        ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Agregar total si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'total') THEN
        ALTER TABLE orders ADD COLUMN total DECIMAL(10,2);
    END IF;

    -- Agregar currency si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'currency') THEN
        ALTER TABLE orders ADD COLUMN currency VARCHAR(3) DEFAULT 'ARS';
    END IF;

    -- Agregar status si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    END IF;

    -- Agregar notes si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'notes') THEN
        ALTER TABLE orders ADD COLUMN notes TEXT;
    END IF;

    -- Agregar metadata si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'metadata') THEN
        ALTER TABLE orders ADD COLUMN metadata JSONB;
    END IF;

    -- Agregar updated_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Agregar columnas faltantes a la tabla order_items
DO $$ 
BEGIN
    -- Agregar item_name si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'item_name') THEN
        ALTER TABLE order_items ADD COLUMN item_name VARCHAR(500);
    END IF;

    -- Agregar product_type si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'product_type') THEN
        ALTER TABLE order_items ADD COLUMN product_type VARCHAR(255);
    END IF;

    -- Agregar product_color si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'product_color') THEN
        ALTER TABLE order_items ADD COLUMN product_color VARCHAR(100);
    END IF;

    -- Agregar product_size si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'product_size') THEN
        ALTER TABLE order_items ADD COLUMN product_size VARCHAR(50);
    END IF;

    -- Agregar quantity si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'quantity') THEN
        ALTER TABLE order_items ADD COLUMN quantity INTEGER DEFAULT 1;
    END IF;

    -- Agregar unit_price si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'unit_price') THEN
        ALTER TABLE order_items ADD COLUMN unit_price DECIMAL(10,2);
    END IF;

    -- Agregar total_price si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'total_price') THEN
        ALTER TABLE order_items ADD COLUMN total_price DECIMAL(10,2);
    END IF;

    -- Agregar image_url si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'image_url') THEN
        ALTER TABLE order_items ADD COLUMN image_url TEXT;
    END IF;

    -- Agregar mockup_url si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'mockup_url') THEN
        ALTER TABLE order_items ADD COLUMN mockup_url TEXT;
    END IF;

    -- Agregar front_mockup_url si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'front_mockup_url') THEN
        ALTER TABLE order_items ADD COLUMN front_mockup_url TEXT;
    END IF;

    -- Agregar back_mockup_url si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'back_mockup_url') THEN
        ALTER TABLE order_items ADD COLUMN back_mockup_url TEXT;
    END IF;

    -- Agregar front_design_url si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'front_design_url') THEN
        ALTER TABLE order_items ADD COLUMN front_design_url TEXT;
    END IF;

    -- Agregar back_design_url si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'back_design_url') THEN
        ALTER TABLE order_items ADD COLUMN back_design_url TEXT;
    END IF;

    -- Agregar front_stamp_size si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'front_stamp_size') THEN
        ALTER TABLE order_items ADD COLUMN front_stamp_size VARCHAR(10);
    END IF;

    -- Agregar back_stamp_size si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'back_stamp_size') THEN
        ALTER TABLE order_items ADD COLUMN back_stamp_size VARCHAR(10);
    END IF;

    -- Agregar front_stamp_position si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'front_stamp_position') THEN
        ALTER TABLE order_items ADD COLUMN front_stamp_position VARCHAR(20);
    END IF;

    -- Agregar back_stamp_position si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'back_stamp_position') THEN
        ALTER TABLE order_items ADD COLUMN back_stamp_position VARCHAR(20);
    END IF;

    -- Agregar design_position si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'design_position') THEN
        ALTER TABLE order_items ADD COLUMN design_position JSONB;
    END IF;

    -- Agregar custom_design si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'custom_design') THEN
        ALTER TABLE order_items ADD COLUMN custom_design JSONB;
    END IF;

    -- Agregar metadata si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'metadata') THEN
        ALTER TABLE order_items ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_external_reference ON orders(external_reference);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at);

-- Crear función de trigger para updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS si no está habilitado
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para recrearlas)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;

-- Crear políticas de seguridad
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert their own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Generar order_number para registros existentes que no lo tengan
-- Usar una parte del UUID para garantizar unicidad
UPDATE orders 
SET order_number = 'NOV-' || TO_CHAR(COALESCE(created_at, NOW()), 'YYYYMMDD') || '-' || SUBSTRING(id::TEXT, 1, 8)
WHERE order_number IS NULL;

-- Después de actualizar, hacer order_number NOT NULL si es necesario
-- (Solo si no hay NULLs restantes)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number IS NULL) THEN
        ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
    END IF;
END $$;

-- Agregar comentarios si no existen
COMMENT ON TABLE orders IS 'Tabla principal de pedidos con información completa del cliente y pago';
COMMENT ON TABLE order_items IS 'Tabla de items individuales de cada pedido con detalles del producto';
COMMENT ON COLUMN orders.order_number IS 'Número único de pedido (ej: NOV-2024-001)';
COMMENT ON COLUMN orders.payment_method IS 'Método de pago: mercadopago o transferencia';
COMMENT ON COLUMN orders.payment_status IS 'Estado del pago según MercadoPago';
COMMENT ON COLUMN orders.status IS 'Estado del pedido: pending, confirmed, processing, shipped, delivered, cancelled';
COMMENT ON COLUMN orders.metadata IS 'Datos adicionales en formato JSON (webhook_data, etc)';

