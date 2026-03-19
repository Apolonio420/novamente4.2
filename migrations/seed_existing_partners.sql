-- =============================================================
-- Seed Existing Partners into Partners OS tables
-- Migration: seed_existing_partners.sql
-- Date: 2026-03-13
--
-- Seeds FALCO, Novamente Originals, Mindset, Novamente Mundial
-- into tenants, partner_products, and partner_product_variants.
-- Safe to re-run: uses ON CONFLICT DO NOTHING everywhere.
-- =============================================================

-- =============================================================
-- 1. TENANTS
-- =============================================================

-- FALCO
INSERT INTO tenants (
  slug, name, email, phone, country, currency, industry,
  logo_url, banner_url, primary_color, secondary_color,
  tagline, description, about_text,
  plan, status, storefront_published, visual_style, commerce_mode,
  seo_indexable, onboarding_completed, completeness_score
) VALUES (
  'falco',
  'FALCO',
  'contact@falco.ar',
  NULL,
  'AR', 'ARS', 'Streetwear',
  '/falco/halcon-negro.png',
  '/falco/anclas-watermark.png',
  '#000000', '#FFFFFF',
  'Libertad. Identidad. Argentina que avanza.',
  'FALCO es una marca nacida del espiritu de uno de los integrantes de Las Tres Anclas, un grupo emblematico que representa una nueva etapa para Argentina: la del renacer economico, la libertad individual y el crecimiento sostenido.',
  'FALCO no es solo ropa: es simbolo de una vision renovadora y de un presente que proyecta futuro.',
  'starter', 'active', true, 'urbano', 'whatsapp',
  false, true, 80
) ON CONFLICT (slug) DO NOTHING;

-- Novamente Originals
INSERT INTO tenants (
  slug, name, email, phone, country, currency, industry,
  logo_url, banner_url, instagram,
  tagline, description, about_text,
  plan, status, storefront_published, visual_style, commerce_mode,
  seo_indexable, onboarding_completed, completeness_score
) VALUES (
  'novamente-originals',
  'Novamente Originals',
  'originals@novamente.ar',
  NULL,
  'AR', 'ARS', 'Diseno',
  '/partners/novamente-originals/logo.png',
  '/partners/novamente-originals/banner.png',
  'https://www.instagram.com/novamente.ar/',
  'Diseno con proposito. Hecho en Argentina.',
  'Novamente Originals es la linea de indumentaria propia de Novamente, creada para quienes valoran el diseno local, la calidad y la identidad cultural. Cada prenda es una expresion del movimiento creativo argentino.',
  'Novamente Originals: donde el diseno se convierte en declaracion.',
  'growth', 'active', true, 'minimal', 'whatsapp',
  true, true, 75
) ON CONFLICT (slug) DO NOTHING;

-- Mindset
INSERT INTO tenants (
  slug, name, email, phone, country, currency, industry,
  logo_url, banner_url,
  tagline, description, about_text,
  plan, status, storefront_published, visual_style, commerce_mode,
  seo_indexable, onboarding_completed, completeness_score
) VALUES (
  'mindset',
  'Mindset',
  'contact@mindset.ar',
  NULL,
  'AR', 'ARS', 'Lifestyle',
  '/partners/mindset/logo.png',
  '/partners/mindset/banner.png',
  'Fe. Mentalidad. Disciplina.',
  'MINDSET es una marca de indumentaria construida sobre la conviccion de que el caracter se forja desde adentro. Cada pieza lleva una intencion: recordarte quien queres ser.',
  'MINDSET: vestir como una declaracion de principios.',
  'starter', 'active', true, 'bold', 'whatsapp',
  false, true, 70
) ON CONFLICT (slug) DO NOTHING;

-- Novamente Mundial
INSERT INTO tenants (
  slug, name, email, phone, country, currency, industry,
  logo_url, banner_url,
  tagline, description, about_text,
  plan, status, storefront_published, visual_style, commerce_mode,
  seo_indexable, onboarding_completed, completeness_score
) VALUES (
  'novamente-mundial',
  'Novamente Mundial',
  'mundial@novamente.ar',
  NULL,
  'AR', 'ARS', 'Deportes',
  '/partners/novamente-mundial/logo.png',
  '/partners/novamente-mundial/banner.png',
  'Coleccion Mundial 2026.',
  'Una capsula inspirada en la previa del Mundial 2026: diseno urbano, identidad argentina y energia de torneo.',
  'Vestir el Mundial sin disfraz: estetica, conviccion y calle.',
  'growth', 'active', true, 'sport', 'whatsapp',
  true, true, 75
) ON CONFLICT (slug) DO NOTHING;


-- =============================================================
-- 2. PRODUCTS
-- =============================================================

-- -----------------------------------------------
-- FALCO Products
-- -----------------------------------------------

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'falco'),
  'Hoodie "Tres Anclas" Oversized',
  'El Hoodie "Tres Anclas" Oversized representa la fuerza y los valores de FALCO: libertad, crecimiento y patriotismo. Confeccionado en algodon premium con el iconico diseno de las tres anclas en la espalda y el logo del halcon en el frente.',
  'Hoodies',
  'FALCO',
  'hoodie-tres-anclas',
  65000,
  'ARS',
  '["\/falco\/products\/hoodie-tres-anclas-negro-front.png", "\/falco\/products\/hoodie-tres-anclas-negro-back.png"]'::jsonb,
  '["Hoodies", "Streetwear", "Oversized"]'::jsonb,
  'published',
  1
) ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'falco'),
  'Remera "Tres Anclas" Oversized',
  'La Remera "Tres Anclas" Oversized combina comodidad y simbolismo en una prenda versatil. Con el iconico diseno de las tres anclas en la espalda y el halcon FALCO en el frente.',
  'Remeras',
  'FALCO',
  'remera-oversize-tres-anclas',
  42000,
  'ARS',
  '["\/falco\/products\/remera-tres-anclas-caramel-front.png", "\/falco\/products\/remera-tres-anclas-caramel-back.png"]'::jsonb,
  '["Remeras", "Streetwear", "Oversized"]'::jsonb,
  'published',
  2
) ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'falco'),
  'Remera "Tres Anclas" Corte Clasico',
  'La Remera "Tres Anclas" Corte Clasico representa la elegancia atemporal de FALCO. Con un diseno sobrio que combina el logo en el frente y las tres anclas en la espalda.',
  'Remeras',
  'FALCO',
  'remera-classic-tres-anclas',
  38000,
  'ARS',
  '["\/falco\/products\/remera-classic-tres-anclas-negro-front.png", "\/falco\/products\/remera-classic-tres-anclas-negro-back.png"]'::jsonb,
  '["Remeras", "Streetwear", "Classic"]'::jsonb,
  'published',
  3
) ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'falco'),
  'Remera "Emision" FALCO',
  'La Remera "Emision" presenta un diseno tipografico disruptivo con la formula matematica de expansion monetaria. Combina estilo callejero con conciencia politica.',
  'Remeras',
  'FALCO',
  'remera-emision-falco',
  37000,
  'ARS',
  '["\/falco\/products\/remera-emision-blanco-front.png"]'::jsonb,
  '["Remeras", "Streetwear", "Conceptual"]'::jsonb,
  'published',
  4
) ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'falco'),
  'Remera Classic "FALCO"',
  'La Remera Classic FALCO presenta el diseno mas puro de la marca: el logo del halcon centrado en el pecho. Ideal para un look limpio, urbano y patriotico.',
  'Remeras',
  'FALCO',
  'remera-classic-falco',
  33000,
  'ARS',
  '["\/falco\/products\/remera-falco-blanco-front.png"]'::jsonb,
  '["Remeras", "Streetwear", "Classic"]'::jsonb,
  'published',
  5
) ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'falco'),
  'Gorra FALCO',
  'La Gorra FALCO combina estilo urbano con inspiracion patriotica. Confeccionada en gabardina premium con bordado del iconico halcon.',
  'Accesorios',
  'FALCO',
  'gorra-falco',
  35000,
  'ARS',
  '["\/falco\/products\/gorra-falco-frontal.png", "\/falco\/products\/gorra-falco-lateral.png"]'::jsonb,
  '["Accesorios", "Gorras", "Streetwear"]'::jsonb,
  'published',
  6
) ON CONFLICT (tenant_id, slug) DO NOTHING;

-- -----------------------------------------------
-- Novamente Originals Products
-- -----------------------------------------------

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'novamente-originals'),
  'Remera Oversize Novamente Originals',
  'Remera oversize premium de Novamente Originals. Algodon suave, calce amplio y estampa de alta definicion.',
  'Remeras',
  'NOVAMENTE ORIGINALS',
  'remera-novamente-originals',
  40000,
  'ARS',
  '["\/partners\/novamente-originals\/products\/remera-novamente-originals-negro-front.png", "\/partners\/novamente-originals\/products\/remera-novamente-originals-negro-back.png"]'::jsonb,
  '["Remeras", "Oversized", "Diseno"]'::jsonb,
  'published',
  1
) ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'novamente-originals'),
  'Buzo Oversize Novamente Originals',
  'Buzo oversize premium de Novamente Originals. Algodon pesado, calce amplio y estampa de alta definicion.',
  'Hoodies',
  'NOVAMENTE ORIGINALS',
  'buzo-novamente-originals',
  65000,
  'ARS',
  '["\/partners\/novamente-originals\/products\/buzo-novamente-originals-negro-front.png", "\/partners\/novamente-originals\/products\/buzo-novamente-originals-negro-back.png"]'::jsonb,
  '["Hoodies", "Oversized", "Diseno"]'::jsonb,
  'published',
  2
) ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'novamente-originals'),
  'Remera Japon Novamente Originals',
  'Remera Japon de Novamente Originals. Diseno grafico de edicion limitada, algodon suave y estampa de alta definicion.',
  'Remeras',
  'NOVAMENTE ORIGINALS',
  'japon-novamente-originals',
  40000,
  'ARS',
  '["\/partners\/novamente-originals\/products\/japon-novamente-originals-negro-front.png", "\/partners\/novamente-originals\/products\/japon-novamente-originals-negro-back.png"]'::jsonb,
  '["Remeras", "Edicion Limitada", "Diseno"]'::jsonb,
  'published',
  3
) ON CONFLICT (tenant_id, slug) DO NOTHING;

-- -----------------------------------------------
-- Mindset Products
-- -----------------------------------------------

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'mindset'),
  'Buzo ALCE Oversized',
  'Buzo Alce de MINDSET. Algodon premium, calce oversize y grafica de identidad.',
  'Hoodies',
  'MINDSET',
  'buzo-alce',
  65000,
  'ARS',
  '["\/partners\/mindset\/products\/buzo-alce-front-gris.png", "\/partners\/mindset\/products\/buzo-alce-back-gris.png"]'::jsonb,
  '["Hoodies", "Oversized", "Lifestyle"]'::jsonb,
  'published',
  1
) ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'mindset'),
  'Buzo PAN Oversized',
  'Buzo Pan de MINDSET. Tono crema, calce oversize y construccion premium.',
  'Hoodies',
  'MINDSET',
  'buzo-pan',
  65000,
  'ARS',
  '["\/partners\/mindset\/products\/buzo-pan-front-crema.png", "\/partners\/mindset\/products\/buzo-pan-back-crema.png"]'::jsonb,
  '["Hoodies", "Oversized", "Lifestyle"]'::jsonb,
  'published',
  2
) ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'mindset'),
  'Remera FE Oversized',
  'Remera Oversize Fe de MINDSET. Algodon suave, calce amplio y grafica de conviccion.',
  'Remeras',
  'MINDSET',
  'remera-oversize-fe-mindset',
  40000,
  'ARS',
  '["\/partners\/mindset\/products\/remera-oversize-fe-mindset-front-black.png", "\/partners\/mindset\/products\/remera-oversize-fe-mindset-back-black.png"]'::jsonb,
  '["Remeras", "Oversized", "Lifestyle"]'::jsonb,
  'published',
  3
) ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'mindset'),
  'Remera PAN Oversized',
  'Remera Oversize Pan de MINDSET. Blanco limpio, calce amplio y diseno grafico de identidad.',
  'Remeras',
  'MINDSET',
  'remera-oversize-pan-mindset',
  40000,
  'ARS',
  '["\/partners\/mindset\/products\/remera-oversize-pan-mindset-front-white.png", "\/partners\/mindset\/products\/remera-oversize-pan-mindset-back-white.png"]'::jsonb,
  '["Remeras", "Oversized", "Lifestyle"]'::jsonb,
  'published',
  4
) ON CONFLICT (tenant_id, slug) DO NOTHING;

-- -----------------------------------------------
-- Novamente Mundial Products
-- -----------------------------------------------

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'novamente-mundial'),
  'Buzo Copa — Novamente Mundial',
  'Buzo oversize premium inspirado en la Copa y la previa mundialista.',
  'Hoodies',
  'NOVAMENTE MUNDIAL',
  'buzo-copa-novamente-mundial1',
  65000,
  'ARS',
  '["\/partners\/novamente-mundial\/products\/buzo-copa-novamente-mundial1-negro-front.png", "\/partners\/novamente-mundial\/products\/buzo-copa-novamente-mundial1-negro-back.png"]'::jsonb,
  '["Hoodies", "Oversized", "Mundial 2026"]'::jsonb,
  'published',
  1
) ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'novamente-mundial'),
  'Remera Copa — Novamente Mundial',
  'Remera Copa de la coleccion Mundial 2026. Algodon premium y estampa de alta definicion.',
  'Remeras',
  'NOVAMENTE MUNDIAL',
  'remera-copa-novamente-mundial1',
  40000,
  'ARS',
  '["\/partners\/novamente-mundial\/products\/remera-copa-novamente-mundial1-negro-front.png", "\/partners\/novamente-mundial\/products\/remera-copa-novamente-mundial1-negro-back.png"]'::jsonb,
  '["Remeras", "Mundial 2026"]'::jsonb,
  'published',
  2
) ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO partner_products (
  tenant_id, name, description, category, brand, slug, price, currency,
  images, tags, status, sort_order
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'novamente-mundial'),
  'Remera Sticker — Novamente Mundial',
  'Remera Sticker de la coleccion Mundial 2026. Grafica de impacto, algodon premium.',
  'Remeras',
  'NOVAMENTE MUNDIAL',
  'remera-sticker-novamente-mundial3',
  38000,
  'ARS',
  '["\/partners\/novamente-mundial\/products\/remera-sticker-novamente-mundial3-negro-front.png", "\/partners\/novamente-mundial\/products\/remera-sticker-novamente-mundial3-negro-back.png"]'::jsonb,
  '["Remeras", "Mundial 2026", "Sticker"]'::jsonb,
  'published',
  3
) ON CONFLICT (tenant_id, slug) DO NOTHING;


-- =============================================================
-- 3. PRODUCT VARIANTS (color x size combos)
-- =============================================================

-- -----------------------------------------------
-- FALCO Variants
-- -----------------------------------------------

-- Hoodie "Tres Anclas" Oversized — 4 colors x 4 sizes = 16 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-NEGRO-S', 'Negro', 'S', 65000, '/falco/products/hoodie-tres-anclas-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-NEGRO-M', 'Negro', 'M', 65000, '/falco/products/hoodie-tres-anclas-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-NEGRO-L', 'Negro', 'L', 65000, '/falco/products/hoodie-tres-anclas-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-NEGRO-XL', 'Negro', 'XL', 65000, '/falco/products/hoodie-tres-anclas-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-CREMA-S', 'Crema', 'S', 65000, '/falco/products/hoodie-tres-anclas-crema-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-CREMA-M', 'Crema', 'M', 65000, '/falco/products/hoodie-tres-anclas-crema-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-CREMA-L', 'Crema', 'L', 65000, '/falco/products/hoodie-tres-anclas-crema-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-CREMA-XL', 'Crema', 'XL', 65000, '/falco/products/hoodie-tres-anclas-crema-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-CARAMEL-S', 'Caramel', 'S', 65000, '/falco/products/hoodie-tres-anclas-caramel-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-CARAMEL-M', 'Caramel', 'M', 65000, '/falco/products/hoodie-tres-anclas-caramel-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-CARAMEL-L', 'Caramel', 'L', 65000, '/falco/products/hoodie-tres-anclas-caramel-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-CARAMEL-XL', 'Caramel', 'XL', 65000, '/falco/products/hoodie-tres-anclas-caramel-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-GRIS-S', 'Gris Melange', 'S', 65000, '/falco/products/hoodie-tres-anclas-gris-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-GRIS-M', 'Gris Melange', 'M', 65000, '/falco/products/hoodie-tres-anclas-gris-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-GRIS-L', 'Gris Melange', 'L', 65000, '/falco/products/hoodie-tres-anclas-gris-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'hoodie-tres-anclas'), 'FALCO-HTA-GRIS-XL', 'Gris Melange', 'XL', 65000, '/falco/products/hoodie-tres-anclas-gris-front.png')
ON CONFLICT DO NOTHING;

-- Remera "Tres Anclas" Oversized — 3 colors x 4 sizes = 12 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-oversize-tres-anclas'), 'FALCO-RTA-CARAMEL-S', 'Caramel', 'S', 42000, '/falco/products/remera-tres-anclas-caramel-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-oversize-tres-anclas'), 'FALCO-RTA-CARAMEL-M', 'Caramel', 'M', 42000, '/falco/products/remera-tres-anclas-caramel-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-oversize-tres-anclas'), 'FALCO-RTA-CARAMEL-L', 'Caramel', 'L', 42000, '/falco/products/remera-tres-anclas-caramel-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-oversize-tres-anclas'), 'FALCO-RTA-CARAMEL-XL', 'Caramel', 'XL', 42000, '/falco/products/remera-tres-anclas-caramel-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-oversize-tres-anclas'), 'FALCO-RTA-NEGRO-S', 'Negro', 'S', 42000, '/falco/products/remera-tres-anclas-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-oversize-tres-anclas'), 'FALCO-RTA-NEGRO-M', 'Negro', 'M', 42000, '/falco/products/remera-tres-anclas-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-oversize-tres-anclas'), 'FALCO-RTA-NEGRO-L', 'Negro', 'L', 42000, '/falco/products/remera-tres-anclas-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-oversize-tres-anclas'), 'FALCO-RTA-NEGRO-XL', 'Negro', 'XL', 42000, '/falco/products/remera-tres-anclas-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-oversize-tres-anclas'), 'FALCO-RTA-BLANCO-S', 'Blanco', 'S', 42000, '/falco/products/remera-tres-anclas-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-oversize-tres-anclas'), 'FALCO-RTA-BLANCO-M', 'Blanco', 'M', 42000, '/falco/products/remera-tres-anclas-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-oversize-tres-anclas'), 'FALCO-RTA-BLANCO-L', 'Blanco', 'L', 42000, '/falco/products/remera-tres-anclas-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-oversize-tres-anclas'), 'FALCO-RTA-BLANCO-XL', 'Blanco', 'XL', 42000, '/falco/products/remera-tres-anclas-blanco-front.png')
ON CONFLICT DO NOTHING;

-- Remera "Tres Anclas" Corte Clasico — 2 colors x 5 sizes = 10 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-tres-anclas'), 'FALCO-RCT-NEGRO-S', 'Negro', 'S', 38000, '/falco/products/remera-classic-tres-anclas-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-tres-anclas'), 'FALCO-RCT-NEGRO-M', 'Negro', 'M', 38000, '/falco/products/remera-classic-tres-anclas-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-tres-anclas'), 'FALCO-RCT-NEGRO-L', 'Negro', 'L', 38000, '/falco/products/remera-classic-tres-anclas-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-tres-anclas'), 'FALCO-RCT-NEGRO-XL', 'Negro', 'XL', 38000, '/falco/products/remera-classic-tres-anclas-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-tres-anclas'), 'FALCO-RCT-NEGRO-XXL', 'Negro', 'XXL', 38000, '/falco/products/remera-classic-tres-anclas-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-tres-anclas'), 'FALCO-RCT-BLANCO-S', 'Blanco', 'S', 38000, '/falco/products/remera-classic-tres-anclas-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-tres-anclas'), 'FALCO-RCT-BLANCO-M', 'Blanco', 'M', 38000, '/falco/products/remera-classic-tres-anclas-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-tres-anclas'), 'FALCO-RCT-BLANCO-L', 'Blanco', 'L', 38000, '/falco/products/remera-classic-tres-anclas-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-tres-anclas'), 'FALCO-RCT-BLANCO-XL', 'Blanco', 'XL', 38000, '/falco/products/remera-classic-tres-anclas-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-tres-anclas'), 'FALCO-RCT-BLANCO-XXL', 'Blanco', 'XXL', 38000, '/falco/products/remera-classic-tres-anclas-blanco-front.png')
ON CONFLICT DO NOTHING;

-- Remera "Emision" FALCO — 2 colors x 4 sizes = 8 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-emision-falco'), 'FALCO-EMI-BLANCO-S', 'Blanco', 'S', 37000, '/falco/products/remera-emision-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-emision-falco'), 'FALCO-EMI-BLANCO-M', 'Blanco', 'M', 37000, '/falco/products/remera-emision-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-emision-falco'), 'FALCO-EMI-BLANCO-L', 'Blanco', 'L', 37000, '/falco/products/remera-emision-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-emision-falco'), 'FALCO-EMI-BLANCO-XL', 'Blanco', 'XL', 37000, '/falco/products/remera-emision-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-emision-falco'), 'FALCO-EMI-NEGRO-S', 'Negro', 'S', 37000, '/falco/products/remera-emision-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-emision-falco'), 'FALCO-EMI-NEGRO-M', 'Negro', 'M', 37000, '/falco/products/remera-emision-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-emision-falco'), 'FALCO-EMI-NEGRO-L', 'Negro', 'L', 37000, '/falco/products/remera-emision-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-emision-falco'), 'FALCO-EMI-NEGRO-XL', 'Negro', 'XL', 37000, '/falco/products/remera-emision-negro-front.png')
ON CONFLICT DO NOTHING;

-- Remera Classic "FALCO" — 2 colors x 4 sizes = 8 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-falco'), 'FALCO-RCF-BLANCO-S', 'Blanco', 'S', 33000, '/falco/products/remera-falco-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-falco'), 'FALCO-RCF-BLANCO-M', 'Blanco', 'M', 33000, '/falco/products/remera-falco-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-falco'), 'FALCO-RCF-BLANCO-L', 'Blanco', 'L', 33000, '/falco/products/remera-falco-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-falco'), 'FALCO-RCF-BLANCO-XL', 'Blanco', 'XL', 33000, '/falco/products/remera-falco-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-falco'), 'FALCO-RCF-NEGRO-S', 'Negro', 'S', 33000, '/falco/products/remera-falco-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-falco'), 'FALCO-RCF-NEGRO-M', 'Negro', 'M', 33000, '/falco/products/remera-falco-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-falco'), 'FALCO-RCF-NEGRO-L', 'Negro', 'L', 33000, '/falco/products/remera-falco-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'remera-classic-falco'), 'FALCO-RCF-NEGRO-XL', 'Negro', 'XL', 33000, '/falco/products/remera-falco-negro-front.png')
ON CONFLICT DO NOTHING;

-- Gorra FALCO — 1 color x 1 size = 1 variant
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'falco') AND slug = 'gorra-falco'), 'FALCO-GOR-NEGRO-TU', 'Negro', 'Talle unico', 35000, '/falco/products/gorra-falco-frontal.png')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------
-- Novamente Originals Variants
-- -----------------------------------------------

-- Remera Oversize Novamente Originals — 2 colors x 4 sizes = 8 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'remera-novamente-originals'), 'NO-REM-NEGRO-S', 'Negro', 'S', 40000, '/partners/novamente-originals/products/remera-novamente-originals-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'remera-novamente-originals'), 'NO-REM-NEGRO-M', 'Negro', 'M', 40000, '/partners/novamente-originals/products/remera-novamente-originals-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'remera-novamente-originals'), 'NO-REM-NEGRO-L', 'Negro', 'L', 40000, '/partners/novamente-originals/products/remera-novamente-originals-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'remera-novamente-originals'), 'NO-REM-NEGRO-XL', 'Negro', 'XL', 40000, '/partners/novamente-originals/products/remera-novamente-originals-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'remera-novamente-originals'), 'NO-REM-BLANCO-S', 'Blanco', 'S', 40000, '/partners/novamente-originals/products/remera-novamente-originals-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'remera-novamente-originals'), 'NO-REM-BLANCO-M', 'Blanco', 'M', 40000, '/partners/novamente-originals/products/remera-novamente-originals-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'remera-novamente-originals'), 'NO-REM-BLANCO-L', 'Blanco', 'L', 40000, '/partners/novamente-originals/products/remera-novamente-originals-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'remera-novamente-originals'), 'NO-REM-BLANCO-XL', 'Blanco', 'XL', 40000, '/partners/novamente-originals/products/remera-novamente-originals-blanco-front.png')
ON CONFLICT DO NOTHING;

-- Buzo Oversize Novamente Originals — 2 colors x 4 sizes = 8 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'buzo-novamente-originals'), 'NO-BUZ-NEGRO-S', 'Negro', 'S', 65000, '/partners/novamente-originals/products/buzo-novamente-originals-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'buzo-novamente-originals'), 'NO-BUZ-NEGRO-M', 'Negro', 'M', 65000, '/partners/novamente-originals/products/buzo-novamente-originals-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'buzo-novamente-originals'), 'NO-BUZ-NEGRO-L', 'Negro', 'L', 65000, '/partners/novamente-originals/products/buzo-novamente-originals-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'buzo-novamente-originals'), 'NO-BUZ-NEGRO-XL', 'Negro', 'XL', 65000, '/partners/novamente-originals/products/buzo-novamente-originals-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'buzo-novamente-originals'), 'NO-BUZ-GRIS-S', 'Gris', 'S', 65000, '/partners/novamente-originals/products/buzo-novamente-originals-gris-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'buzo-novamente-originals'), 'NO-BUZ-GRIS-M', 'Gris', 'M', 65000, '/partners/novamente-originals/products/buzo-novamente-originals-gris-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'buzo-novamente-originals'), 'NO-BUZ-GRIS-L', 'Gris', 'L', 65000, '/partners/novamente-originals/products/buzo-novamente-originals-gris-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'buzo-novamente-originals'), 'NO-BUZ-GRIS-XL', 'Gris', 'XL', 65000, '/partners/novamente-originals/products/buzo-novamente-originals-gris-front.png')
ON CONFLICT DO NOTHING;

-- Remera Japon Novamente Originals — 2 colors x 4 sizes = 8 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'japon-novamente-originals'), 'NO-JAP-NEGRO-S', 'Negro', 'S', 40000, '/partners/novamente-originals/products/japon-novamente-originals-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'japon-novamente-originals'), 'NO-JAP-NEGRO-M', 'Negro', 'M', 40000, '/partners/novamente-originals/products/japon-novamente-originals-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'japon-novamente-originals'), 'NO-JAP-NEGRO-L', 'Negro', 'L', 40000, '/partners/novamente-originals/products/japon-novamente-originals-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'japon-novamente-originals'), 'NO-JAP-NEGRO-XL', 'Negro', 'XL', 40000, '/partners/novamente-originals/products/japon-novamente-originals-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'japon-novamente-originals'), 'NO-JAP-BLANCO-S', 'Blanco', 'S', 40000, '/partners/novamente-originals/products/japon-novamente-originals-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'japon-novamente-originals'), 'NO-JAP-BLANCO-M', 'Blanco', 'M', 40000, '/partners/novamente-originals/products/japon-novamente-originals-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'japon-novamente-originals'), 'NO-JAP-BLANCO-L', 'Blanco', 'L', 40000, '/partners/novamente-originals/products/japon-novamente-originals-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-originals') AND slug = 'japon-novamente-originals'), 'NO-JAP-BLANCO-XL', 'Blanco', 'XL', 40000, '/partners/novamente-originals/products/japon-novamente-originals-blanco-front.png')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------
-- Mindset Variants
-- -----------------------------------------------

-- Buzo ALCE Oversized — 1 color x 4 sizes = 4 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'buzo-alce'), 'MS-BA-GRIS-S', 'Gris', 'S', 65000, '/partners/mindset/products/buzo-alce-front-gris.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'buzo-alce'), 'MS-BA-GRIS-M', 'Gris', 'M', 65000, '/partners/mindset/products/buzo-alce-front-gris.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'buzo-alce'), 'MS-BA-GRIS-L', 'Gris', 'L', 65000, '/partners/mindset/products/buzo-alce-front-gris.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'buzo-alce'), 'MS-BA-GRIS-XL', 'Gris', 'XL', 65000, '/partners/mindset/products/buzo-alce-front-gris.png')
ON CONFLICT DO NOTHING;

-- Buzo PAN Oversized — 1 color x 4 sizes = 4 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'buzo-pan'), 'MS-BP-CREMA-S', 'Crema', 'S', 65000, '/partners/mindset/products/buzo-pan-front-crema.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'buzo-pan'), 'MS-BP-CREMA-M', 'Crema', 'M', 65000, '/partners/mindset/products/buzo-pan-front-crema.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'buzo-pan'), 'MS-BP-CREMA-L', 'Crema', 'L', 65000, '/partners/mindset/products/buzo-pan-front-crema.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'buzo-pan'), 'MS-BP-CREMA-XL', 'Crema', 'XL', 65000, '/partners/mindset/products/buzo-pan-front-crema.png')
ON CONFLICT DO NOTHING;

-- Remera FE Oversized — 2 colors x 4 sizes = 8 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'remera-oversize-fe-mindset'), 'MS-RFE-NEGRO-S', 'Negro', 'S', 40000, '/partners/mindset/products/remera-oversize-fe-mindset-front-black.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'remera-oversize-fe-mindset'), 'MS-RFE-NEGRO-M', 'Negro', 'M', 40000, '/partners/mindset/products/remera-oversize-fe-mindset-front-black.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'remera-oversize-fe-mindset'), 'MS-RFE-NEGRO-L', 'Negro', 'L', 40000, '/partners/mindset/products/remera-oversize-fe-mindset-front-black.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'remera-oversize-fe-mindset'), 'MS-RFE-NEGRO-XL', 'Negro', 'XL', 40000, '/partners/mindset/products/remera-oversize-fe-mindset-front-black.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'remera-oversize-fe-mindset'), 'MS-RFE-BLANCO-S', 'Blanco', 'S', 40000, '/partners/mindset/products/remera-oversize-fe-mindset-front-white.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'remera-oversize-fe-mindset'), 'MS-RFE-BLANCO-M', 'Blanco', 'M', 40000, '/partners/mindset/products/remera-oversize-fe-mindset-front-white.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'remera-oversize-fe-mindset'), 'MS-RFE-BLANCO-L', 'Blanco', 'L', 40000, '/partners/mindset/products/remera-oversize-fe-mindset-front-white.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'remera-oversize-fe-mindset'), 'MS-RFE-BLANCO-XL', 'Blanco', 'XL', 40000, '/partners/mindset/products/remera-oversize-fe-mindset-front-white.png')
ON CONFLICT DO NOTHING;

-- Remera PAN Oversized — 1 color x 4 sizes = 4 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'remera-oversize-pan-mindset'), 'MS-RPAN-BLANCO-S', 'Blanco', 'S', 40000, '/partners/mindset/products/remera-oversize-pan-mindset-front-white.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'remera-oversize-pan-mindset'), 'MS-RPAN-BLANCO-M', 'Blanco', 'M', 40000, '/partners/mindset/products/remera-oversize-pan-mindset-front-white.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'remera-oversize-pan-mindset'), 'MS-RPAN-BLANCO-L', 'Blanco', 'L', 40000, '/partners/mindset/products/remera-oversize-pan-mindset-front-white.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mindset') AND slug = 'remera-oversize-pan-mindset'), 'MS-RPAN-BLANCO-XL', 'Blanco', 'XL', 40000, '/partners/mindset/products/remera-oversize-pan-mindset-front-white.png')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------
-- Novamente Mundial Variants
-- -----------------------------------------------

-- Buzo Copa — 2 colors x 4 sizes = 8 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'buzo-copa-novamente-mundial1'), 'NM-BC-NEGRO-S', 'Negro', 'S', 65000, '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'buzo-copa-novamente-mundial1'), 'NM-BC-NEGRO-M', 'Negro', 'M', 65000, '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'buzo-copa-novamente-mundial1'), 'NM-BC-NEGRO-L', 'Negro', 'L', 65000, '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'buzo-copa-novamente-mundial1'), 'NM-BC-NEGRO-XL', 'Negro', 'XL', 65000, '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'buzo-copa-novamente-mundial1'), 'NM-BC-GRIS-S', 'Gris', 'S', 65000, '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-gris-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'buzo-copa-novamente-mundial1'), 'NM-BC-GRIS-M', 'Gris', 'M', 65000, '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-gris-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'buzo-copa-novamente-mundial1'), 'NM-BC-GRIS-L', 'Gris', 'L', 65000, '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-gris-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'buzo-copa-novamente-mundial1'), 'NM-BC-GRIS-XL', 'Gris', 'XL', 65000, '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-gris-front.png')
ON CONFLICT DO NOTHING;

-- Remera Copa — 2 colors x 4 sizes = 8 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-copa-novamente-mundial1'), 'NM-RC-NEGRO-S', 'Negro', 'S', 40000, '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-copa-novamente-mundial1'), 'NM-RC-NEGRO-M', 'Negro', 'M', 40000, '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-copa-novamente-mundial1'), 'NM-RC-NEGRO-L', 'Negro', 'L', 40000, '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-copa-novamente-mundial1'), 'NM-RC-NEGRO-XL', 'Negro', 'XL', 40000, '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-copa-novamente-mundial1'), 'NM-RC-BLANCO-S', 'Blanco', 'S', 40000, '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-copa-novamente-mundial1'), 'NM-RC-BLANCO-M', 'Blanco', 'M', 40000, '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-copa-novamente-mundial1'), 'NM-RC-BLANCO-L', 'Blanco', 'L', 40000, '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-copa-novamente-mundial1'), 'NM-RC-BLANCO-XL', 'Blanco', 'XL', 40000, '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-blanco-front.png')
ON CONFLICT DO NOTHING;

-- Remera Sticker — 2 colors x 4 sizes = 8 variants
INSERT INTO partner_product_variants (product_id, sku, color, size, price, image_url) VALUES
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-sticker-novamente-mundial3'), 'NM-RS-NEGRO-S', 'Negro', 'S', 38000, '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-sticker-novamente-mundial3'), 'NM-RS-NEGRO-M', 'Negro', 'M', 38000, '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-sticker-novamente-mundial3'), 'NM-RS-NEGRO-L', 'Negro', 'L', 38000, '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-sticker-novamente-mundial3'), 'NM-RS-NEGRO-XL', 'Negro', 'XL', 38000, '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-sticker-novamente-mundial3'), 'NM-RS-BLANCO-S', 'Blanco', 'S', 38000, '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-sticker-novamente-mundial3'), 'NM-RS-BLANCO-M', 'Blanco', 'M', 38000, '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-sticker-novamente-mundial3'), 'NM-RS-BLANCO-L', 'Blanco', 'L', 38000, '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-blanco-front.png'),
  ((SELECT id FROM partner_products WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'novamente-mundial') AND slug = 'remera-sticker-novamente-mundial3'), 'NM-RS-BLANCO-XL', 'Blanco', 'XL', 38000, '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-blanco-front.png')
ON CONFLICT DO NOTHING;
