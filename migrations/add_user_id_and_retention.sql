-- Añadir columna user_id a la tabla images
ALTER TABLE images ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Añadir columna session_id a la tabla images si no existe
ALTER TABLE images ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Crear índice para búsquedas rápidas por user_id
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);

-- Crear índice para búsquedas rápidas por session_id
CREATE INDEX IF NOT EXISTS idx_images_session_id ON images(session_id);

-- Crear función para eliminar imágenes antiguas (más de 15 días)
CREATE OR REPLACE FUNCTION delete_old_images() RETURNS void AS $$
BEGIN
  DELETE FROM images WHERE created_at < NOW() - INTERVAL '15 days';
END;
$$ LANGUAGE plpgsql;

-- Crear un trabajo programado para ejecutar la función cada día
SELECT cron.schedule(
  'delete-old-images', -- nombre del trabajo
  '0 0 * * *',        -- ejecutar a las 00:00 todos los días
  $$SELECT delete_old_images()$$
);

-- Comentario: Si no tienes la extensión pg_cron, puedes omitir la parte del trabajo programado
-- y ejecutar la función manualmente o mediante un servicio externo.
