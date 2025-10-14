-- Crear tabla para almacenar comprobantes de pago
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_customer_email ON receipts(customer_email);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_upload_date ON receipts(upload_date);

-- Comentarios para documentación
COMMENT ON TABLE receipts IS 'Tabla para almacenar comprobantes de pago de transferencias bancarias';
COMMENT ON COLUMN receipts.order_id IS 'ID único del pedido asociado';
COMMENT ON COLUMN receipts.customer_email IS 'Email del cliente que subió el comprobante';
COMMENT ON COLUMN receipts.file_name IS 'Nombre original del archivo subido';
COMMENT ON COLUMN receipts.file_url IS 'URL del archivo almacenado en R2';
COMMENT ON COLUMN receipts.file_type IS 'Tipo MIME del archivo (image/jpeg, application/pdf, etc.)';
COMMENT ON COLUMN receipts.file_size IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN receipts.status IS 'Estado del comprobante: pending, verified, rejected';
COMMENT ON COLUMN receipts.notes IS 'Notas adicionales sobre el comprobante';
