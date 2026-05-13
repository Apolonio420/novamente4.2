-- Migration: partner_discount_codes
-- Codigos de descuento que cada partner puede crear y aplicar a sus
-- productos en el storefront publico.

CREATE TABLE IF NOT EXISTS partner_discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  -- Tipo: 'percentage' (% off) o 'fixed' (monto fijo en ARS)
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  -- Valor numerico: si percentage -> 0-100, si fixed -> ARS
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  -- Compra minima requerida en ARS (0 = sin minimo)
  min_purchase_ars NUMERIC NOT NULL DEFAULT 0 CHECK (min_purchase_ars >= 0),
  -- Maximo de usos totales (NULL = ilimitado)
  max_uses INTEGER,
  -- Usos actuales
  uses_count INTEGER NOT NULL DEFAULT 0,
  -- Fechas
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  -- Estado
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_partner_discounts_tenant
  ON partner_discount_codes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_discounts_active
  ON partner_discount_codes(tenant_id, active) WHERE active = true;

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_partner_discount_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_partner_discounts_updated_at ON partner_discount_codes;
CREATE TRIGGER trg_partner_discounts_updated_at
  BEFORE UPDATE ON partner_discount_codes
  FOR EACH ROW EXECUTE FUNCTION update_partner_discount_codes_updated_at();

-- RLS: cada tenant solo ve sus codigos
ALTER TABLE partner_discount_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partner_discounts_select ON partner_discount_codes;
CREATE POLICY partner_discounts_select ON partner_discount_codes
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS partner_discounts_insert ON partner_discount_codes;
CREATE POLICY partner_discounts_insert ON partner_discount_codes
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS partner_discounts_update ON partner_discount_codes;
CREATE POLICY partner_discounts_update ON partner_discount_codes
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS partner_discounts_delete ON partner_discount_codes;
CREATE POLICY partner_discounts_delete ON partner_discount_codes
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
  );
