-- Crear tabla de pedidos (orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL, -- Número de pedido único (ej: NOV-2024-001)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_first_name VARCHAR(255) NOT NULL,
  customer_last_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(255) NOT NULL,
  shipping_postal_code VARCHAR(20),
  payment_method VARCHAR(50) NOT NULL, -- 'mercadopago' | 'transferencia'
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled', 'refunded'
  payment_id VARCHAR(255), -- ID de pago de MercadoPago
  external_reference VARCHAR(255), -- Referencia externa (ej: order_timestamp)
  mercado_pago_preference_id VARCHAR(255), -- ID de preferencia de MercadoPago
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ARS',
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  notes TEXT, -- Notas internas del pedido
  metadata JSONB, -- Datos adicionales en formato JSON (webhook_data, etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de items del pedido (order_items)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  item_name VARCHAR(500) NOT NULL,
  product_type VARCHAR(255) NOT NULL, -- Tipo de prenda (ej: 'tshirt', 'hoodie')
  product_color VARCHAR(100) NOT NULL,
  product_size VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL, -- unit_price * quantity
  image_url TEXT, -- URL de la imagen del diseño
  mockup_url TEXT, -- URL del mockup frontal
  front_mockup_url TEXT, -- URL del mockup frontal específico
  back_mockup_url TEXT, -- URL del mockup trasero
  front_design_url TEXT, -- URL del diseño frontal
  back_design_url TEXT, -- URL del diseño trasero
  front_stamp_size VARCHAR(10), -- 'R1', 'R2', 'R3'
  back_stamp_size VARCHAR(10), -- 'R1', 'R2', 'R3'
  front_stamp_position VARCHAR(20), -- 'center', 'left'
  back_stamp_position VARCHAR(20), -- 'center', 'left'
  design_position JSONB, -- Posición del diseño (x, y, scale, rotation)
  custom_design JSONB, -- Diseño personalizado completo
  metadata JSONB, -- Datos adicionales del item
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
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

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para orders
-- Los usuarios pueden ver sus propios pedidos
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Los usuarios pueden insertar sus propios pedidos
CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Los administradores pueden ver todos los pedidos (se implementará con roles)
-- Por ahora, permitimos a usuarios ver pedidos por email si no tienen user_id

-- Políticas de seguridad para order_items
-- Los usuarios pueden ver items de sus propios pedidos
CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Los usuarios pueden insertar items de sus propios pedidos
CREATE POLICY "Users can insert their own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE orders IS 'Tabla principal de pedidos con información completa del cliente y pago';
COMMENT ON TABLE order_items IS 'Tabla de items individuales de cada pedido con detalles del producto';
COMMENT ON COLUMN orders.order_number IS 'Número único de pedido (ej: NOV-2024-001)';
COMMENT ON COLUMN orders.payment_method IS 'Método de pago: mercadopago o transferencia';
COMMENT ON COLUMN orders.payment_status IS 'Estado del pago según MercadoPago';
COMMENT ON COLUMN orders.status IS 'Estado del pedido: pending, confirmed, processing, shipped, delivered, cancelled';
COMMENT ON COLUMN orders.metadata IS 'Datos adicionales en formato JSON (webhook_data, etc)';

