-- Normaliza campos url y storage_key para que almacenen solo la clave limpia
-- Ejecutar una vez en la base de datos (Supabase/Postgres)

update images
set 
  url = ltrim(split_part(coalesce(url, ''), '?', 1), '/'),
  storage_key = ltrim(split_part(coalesce(storage_key, url), '?', 1), '/'),
  url_without_bg = nullif(ltrim(split_part(coalesce(url_without_bg, ''), '?', 1), '/'), '')
;


