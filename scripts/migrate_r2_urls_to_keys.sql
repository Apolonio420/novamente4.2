-- Script de migración para normalizar URLs en la tabla images
-- Convierte URLs firmadas, proxy (/api/r2-public), o URLs públicas a keys limpios
-- Ejecutar una vez en la base de datos (Supabase/Postgres)

-- Paso 1: Limpiar URLs que tienen query params (firmas temporales)
update images
set 
  url = trim(leading '/' from split_part(url, '?', 1)),
  storage_key = coalesce(
    trim(leading '/' from split_part(storage_key, '?', 1)),
    trim(leading '/' from split_part(url, '?', 1))
  )
where url like '%?%' or storage_key like '%?%';

-- Paso 2: Limpiar URLs que empiezan con /api/r2-public?key=
-- Extraer el parámetro key y usarlo como URL
update images
set 
  url = decode(uri_decode(split_part(split_part(url, 'key=', 2), '&', 1)), 'escape'),
  storage_key = coalesce(
    decode(uri_decode(split_part(split_part(storage_key, 'key=', 2), '&', 1)), 'escape'),
    decode(uri_decode(split_part(split_part(url, 'key=', 2), '&', 1)), 'escape')
  )
where url like '/api/r2-public%' or storage_key like '/api/r2-public%';

-- Paso 3: Limpiar URLs públicas de R2 (pub-*.r2.dev) extrayendo el pathname
-- Formato: https://pub-XXXXX.r2.dev/bucket/key → key
update images
set 
  url = regexp_replace(
    regexp_replace(url, '^https?://[^/]+/[^/]+/', ''),
    '^/',
    ''
  ),
  storage_key = coalesce(
    regexp_replace(
      regexp_replace(storage_key, '^https?://[^/]+/[^/]+/', ''),
      '^/',
      ''
    ),
    regexp_replace(
      regexp_replace(url, '^https?://[^/]+/[^/]+/', ''),
      '^/',
      ''
    )
  )
where url like '%r2.dev%' or storage_key like '%r2.dev%';

-- Paso 4: Limpiar URLs de cloudflarestorage.com extrayendo el pathname
-- Formato: https://XXXXX.r2.cloudflarestorage.com/bucket/key → key
update images
set 
  url = regexp_replace(
    regexp_replace(url, '^https?://[^/]+/[^/]+/', ''),
    '^/',
    ''
  ),
  storage_key = coalesce(
    regexp_replace(
      regexp_replace(storage_key, '^https?://[^/]+/[^/]+/', ''),
      '^/',
      ''
    ),
    regexp_replace(
      regexp_replace(url, '^https?://[^/]+/[^/]+/', ''),
      '^/',
      ''
    )
  )
where url like '%r2.cloudflarestorage.com%' or storage_key like '%r2.cloudflarestorage.com%';

-- Paso 5: Limpiar url_without_bg también
update images
set 
  url_without_bg = trim(leading '/' from split_part(url_without_bg, '?', 1))
where url_without_bg like '%?%';

update images
set 
  url_without_bg = decode(uri_decode(split_part(split_part(url_without_bg, 'key=', 2), '&', 1)), 'escape')
where url_without_bg like '/api/r2-public%';

update images
set 
  url_without_bg = regexp_replace(
    regexp_replace(url_without_bg, '^https?://[^/]+/[^/]+/', ''),
    '^/',
    ''
  )
where url_without_bg like '%r2.dev%' or url_without_bg like '%r2.cloudflarestorage.com%';

-- Paso 6: Asegurar que storage_key tenga el mismo valor que url si está vacío
update images
set storage_key = url
where (storage_key is null or storage_key = '') and url is not null and url != '';

-- Verificar resultados
select 
  id,
  substring(url, 1, 100) as url_preview,
  substring(storage_key, 1, 100) as storage_key_preview,
  case 
    when url like 'http%' then 'Tiene HTTP'
    when url like '/api/%' then 'Tiene /api/'
    when url like '%?%' then 'Tiene query params'
    when url like '%r2.dev%' then 'Tiene r2.dev completo'
    when url like '%r2.cloudflarestorage.com%' then 'Tiene cloudflarestorage completo'
    else 'OK'
  end as status
from images
where url is not null
order by created_at desc
limit 20;

