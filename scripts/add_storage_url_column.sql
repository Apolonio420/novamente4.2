-- Agregar columna storage_url a la tabla images
ALTER TABLE images 
ADD COLUMN storage_url TEXT,
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_images_storage_url ON images(storage_url);
CREATE INDEX IF NOT EXISTS idx_images_expires_at ON images(expires_at);

-- Comentarios para documentar las columnas
COMMENT ON COLUMN images.storage_url IS 'URL permanente de la imagen en almacenamiento (R2)';
COMMENT ON COLUMN images.expires_at IS 'Fecha de expiración de la URL original (para URLs temporales)';

