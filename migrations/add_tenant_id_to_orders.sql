-- =============================================================
-- Bridgear ventas B2C → partner_orders
-- Migration: add_tenant_id_to_orders.sql
-- Date: 2026-05-20
-- TASK-005 [AP-v4.2]
-- =============================================================

-- 1. Agregar tenant_id (nullable) a orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- 2. Índice para las consultas del webhook MP
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id) WHERE tenant_id IS NOT NULL;
