-- Agregar columna session_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'images' AND column_name = 'session_id') THEN
        ALTER TABLE images ADD COLUMN session_id TEXT;
        
        -- Crear índice para mejorar performance
        CREATE INDEX IF NOT EXISTS idx_images_session_id ON images(session_id);
        
        -- Crear índice compuesto para consultas por sesión y fecha
        CREATE INDEX IF NOT EXISTS idx_images_session_created ON images(session_id, created_at DESC);
        
        RAISE NOTICE 'Added session_id column and indexes to images table';
    ELSE
        RAISE NOTICE 'session_id column already exists in images table';
    END IF;
END $$;

-- Política de seguridad para permitir acceso por session_id
DROP POLICY IF EXISTS "Users can view their own images by session" ON images;
CREATE POLICY "Users can view their own images by session" ON images
    FOR SELECT USING (
        session_id IS NOT NULL AND 
        session_id != '' AND
        LENGTH(session_id) > 10
    );

-- Política para insertar imágenes
DROP POLICY IF EXISTS "Users can insert their own images" ON images;
CREATE POLICY "Users can insert their own images" ON images
    FOR INSERT WITH CHECK (
        session_id IS NOT NULL AND 
        session_id != '' AND
        LENGTH(session_id) > 10
    );

-- Política para eliminar imágenes por session_id
DROP POLICY IF EXISTS "Users can delete their own images by session" ON images;
CREATE POLICY "Users can delete their own images by session" ON images
    FOR DELETE USING (
        session_id IS NOT NULL AND 
        session_id != '' AND
        LENGTH(session_id) > 10
    );

-- Función para limpiar imágenes expiradas automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_images()
RETURNS void AS $$
BEGIN
    -- Eliminar imágenes de más de 3 días
    DELETE FROM images 
    WHERE created_at < NOW() - INTERVAL '3 days';
    
    RAISE NOTICE 'Cleaned up expired images older than 3 days';
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON COLUMN images.session_id IS 'Unique session identifier for anonymous users';
COMMENT ON FUNCTION cleanup_expired_images() IS 'Removes images older than 3 days to prevent storage bloat';
