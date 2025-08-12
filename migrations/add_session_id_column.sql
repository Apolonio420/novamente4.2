-- Agregar la columna session_id a la tabla images
ALTER TABLE images ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Crear índice para mejorar el rendimiento de consultas por session_id
CREATE INDEX IF NOT EXISTS idx_images_session_id ON images(session_id);

-- Actualizar registros existentes con un session_id por defecto
UPDATE images SET session_id = 'legacy' WHERE session_id IS NULL;
