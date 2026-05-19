-- TASK-008 — Fix storefront Falco assets
-- Sintoma: en https://novamente.ar/p/falco el logo del halcon y el banner
-- aparecen como broken image. Los archivos fisicos existen y responden 200:
--   public/falco/halcon-negro.png   (909 KB)
--   public/falco/anclas-watermark.png (2.2 MB)
-- pero la fila `tenants` en Supabase tiene logo_url / banner_url null o con
-- valor incorrecto. Este UPDATE realinea esos campos con el seed original
-- (ver migrations/seed_existing_partners.sql).
--
-- Idempotente. Correr en Supabase Studio o via psql.

UPDATE tenants
SET
  logo_url   = '/falco/halcon-negro.png',
  banner_url = '/falco/anclas-watermark.png'
WHERE slug = 'falco';

-- Verificacion: deberia devolver una sola fila con ambos campos seteados.
-- SELECT slug, logo_url, banner_url FROM tenants WHERE slug = 'falco';
