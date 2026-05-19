-- Migration: partner_bank_info
-- Adds bank CBU and alias fields to tenants table for payment deposits.
-- Run manually in Supabase SQL editor.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS bank_cbu TEXT,
  ADD COLUMN IF NOT EXISTS bank_alias TEXT;
