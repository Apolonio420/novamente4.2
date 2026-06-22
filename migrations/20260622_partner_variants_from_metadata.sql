-- Backfill partner_product_variants from existing metadata (colors × sizes).
--
-- Until now variants lived only inside partner_products.metadata as
--   { "colors": [ { "name", "value", "hex", "images": { "front", "back" } } ],
--     "sizes":  [ "S", "M", "L", ... ] }
-- This materializes them into the real partner_product_variants table without
-- losing information: metadata is left untouched, and products that already have
-- variant rows are skipped (idempotent).
--
-- Apply with: psql "$DATABASE_URL" -f migrations/20260622_partner_variants_from_metadata.sql

insert into partner_product_variants (product_id, color, size, image_url, availability, attributes)
select
  p.id,
  c->>'name'                                   as color,
  s.size                                       as size,
  c->'images'->>'front'                        as image_url,
  'available'                                  as availability,
  jsonb_build_object(
    'migrated_from', 'metadata',
    'color_value', c->>'value',
    'hex', c->>'hex'
  )                                            as attributes
from partner_products p
cross join lateral jsonb_array_elements(coalesce(p.metadata->'colors', '[]'::jsonb)) as c
cross join lateral jsonb_array_elements_text(coalesce(p.metadata->'sizes', '[]'::jsonb)) as s(size)
where jsonb_typeof(p.metadata->'colors') = 'array'
  and jsonb_typeof(p.metadata->'sizes') = 'array'
  -- Idempotent: only backfill products that have no variants yet.
  and not exists (
    select 1 from partner_product_variants v where v.product_id = p.id
  );

-- Verification:
--   select count(*) from partner_product_variants where attributes->>'migrated_from' = 'metadata';
