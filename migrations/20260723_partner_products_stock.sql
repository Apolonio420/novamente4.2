-- Migration: partner_products_stock
-- Adds an OPTIONAL per-product stock counter to partner storefronts.
-- NULL = untracked / unlimited (behaviour unchanged for all existing products).
-- A number = finite units; the storefront shows "Quedan X" and marks "Sin stock" at 0.
-- Backward compatible: existing rows stay NULL, existing code ignores the column.
-- Run manually: npx tsx scripts/apply-migration.ts migrations/20260723_partner_products_stock.sql
--   (or paste into the Supabase SQL editor)

ALTER TABLE partner_products
  ADD COLUMN IF NOT EXISTS stock INTEGER;
