-- =============================================================
-- Partners OS — Core Tables
-- Migration: create_partners_os_tables.sql
-- Date: 2026-03-13
-- =============================================================

-- 1. TENANTS (core multi-tenant table)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT DEFAULT 'AR',
  currency TEXT DEFAULT 'ARS',
  industry TEXT,
  website TEXT,
  instagram TEXT,
  description TEXT,

  -- Branding
  logo_url TEXT,
  banner_url TEXT,
  hero_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#FFFFFF',
  accent_color TEXT,
  font_preference TEXT DEFAULT 'inter',
  tagline TEXT,
  about_text TEXT,
  cta_text TEXT DEFAULT 'Contactar',
  cta_url TEXT,

  -- Plan & status
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'pro')),
  status TEXT DEFAULT 'onboarding' CHECK (status IN ('onboarding', 'active', 'paused', 'suspended')),

  -- Config
  storefront_published BOOLEAN DEFAULT FALSE,
  design_engine_mode TEXT DEFAULT 'disabled' CHECK (design_engine_mode IN ('disabled', 'mockups_only', 'presets', 'full_brand_fit')),
  commerce_mode TEXT DEFAULT 'leads' CHECK (commerce_mode IN ('leads', 'quote', 'sample', 'whatsapp', 'external', 'checkout')),
  visual_style TEXT DEFAULT 'minimal' CHECK (visual_style IN ('minimal', 'bold', 'editorial', 'sport', 'corporate', 'urbano', 'creativo')),

  -- Limits (enforced by app logic)
  max_products INT DEFAULT 10,
  max_leads_per_month INT DEFAULT 20,

  -- SEO
  seo_indexable BOOLEAN DEFAULT FALSE,
  seo_title TEXT,
  seo_description TEXT,

  -- Metadata
  completeness_score INT DEFAULT 0,
  onboarding_step INT DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookups (storefronts)
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- 2. TENANT USERS (roles per tenant)
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'operator', 'viewer')),
  invited_by UUID,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);

-- 3. PRODUCTS (multi-tenant catalog)
CREATE TABLE IF NOT EXISTS partner_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  brand TEXT,
  slug TEXT NOT NULL,
  price DECIMAL,
  compare_at_price DECIMAL,
  currency TEXT DEFAULT 'ARS',
  availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'out_of_stock', 'preorder', 'discontinued')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'needs_review', 'ready', 'published', 'hidden', 'archived')),
  images JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  collection TEXT,
  seo_title TEXT,
  seo_description TEXT,
  metadata JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_partner_products_tenant ON partner_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_status ON partner_products(tenant_id, status);

-- 4. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS partner_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES partner_products(id) ON DELETE CASCADE,
  sku TEXT,
  color TEXT,
  size TEXT,
  material TEXT,
  price DECIMAL,
  image_url TEXT,
  availability TEXT DEFAULT 'available',
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_variants_product ON partner_product_variants(product_id);

-- 5. PARTNER ASSETS (isolated asset library)
CREATE TABLE IF NOT EXISTS partner_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('logo', 'banner', 'hero', 'product', 'mockup', 'generated', 'approved', 'other')),
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processed', 'approved', 'public', 'archived')),
  storage_key TEXT NOT NULL,
  public_url TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT,
  size_bytes INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_assets_tenant ON partner_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_assets_type ON partner_assets(tenant_id, type);

-- 6. PARTNER LEADS (leads per partner)
CREATE TABLE IF NOT EXISTS partner_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'storefront',
  product_interest TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_leads_tenant ON partner_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_leads_status ON partner_leads(tenant_id, status);

-- 7. PARTNER DESIGN CONFIG
CREATE TABLE IF NOT EXISTS partner_design_config (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  mode TEXT DEFAULT 'disabled' CHECK (mode IN ('disabled', 'mockups_only', 'presets', 'full_brand_fit')),
  palette JSONB DEFAULT '{}',
  forbidden_colors JSONB DEFAULT '[]',
  tone TEXT,
  preferred_background TEXT,
  logo_usage BOOLEAN DEFAULT TRUE,
  supported_garments JSONB DEFAULT '[]',
  supported_styles JSONB DEFAULT '[]',
  custom_prompts JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- RLS Policies
-- =============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_design_config ENABLE ROW LEVEL SECURITY;

-- Service role can do anything (idempotent)
DROP POLICY IF EXISTS "Service role full access" ON tenants;
CREATE POLICY "Service role full access" ON tenants FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON tenant_users;
CREATE POLICY "Service role full access" ON tenant_users FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON partner_products;
CREATE POLICY "Service role full access" ON partner_products FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON partner_product_variants;
CREATE POLICY "Service role full access" ON partner_product_variants FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON partner_assets;
CREATE POLICY "Service role full access" ON partner_assets FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON partner_leads;
CREATE POLICY "Service role full access" ON partner_leads FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON partner_design_config;
CREATE POLICY "Service role full access" ON partner_design_config FOR ALL USING (true) WITH CHECK (true);

-- Published storefronts are publicly readable (idempotent)
DROP POLICY IF EXISTS "Public can read published tenants" ON tenants;
CREATE POLICY "Public can read published tenants" ON tenants
  FOR SELECT USING (storefront_published = true AND status = 'active');

-- Published products are publicly readable (idempotent)
DROP POLICY IF EXISTS "Public can read published products" ON partner_products;
CREATE POLICY "Public can read published products" ON partner_products
  FOR SELECT USING (status = 'published');

-- =============================================================
-- Seed: Novamente as Tenant 0
-- =============================================================

INSERT INTO tenants (slug, name, email, phone, plan, status, storefront_published, seo_indexable, max_products, max_leads_per_month, primary_color, secondary_color, accent_color, description, tagline, completeness_score)
VALUES (
  'novamente',
  'Novamente',
  'apolonio@novamente.ar',
  '+5491126603080',
  'pro',
  'active',
  true,
  true,
  999999,
  999999,
  '#7000FF',
  '#FFFFFF',
  '#FF00FF',
  'Diseñá tu prenda en minutos: elegí modelo, color y estampa generada con IA.',
  'Ropa personalizada con IA',
  100
)
ON CONFLICT (slug) DO NOTHING;
