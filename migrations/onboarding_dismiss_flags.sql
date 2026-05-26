-- Migración: onboarding dismiss flags
-- Agrega columna para trackear el dismiss del banner explicativo del modelo de negocio.
-- TASK-013 — [AP-v4.2]
-- NO ejecutar automáticamente — correr manualmente en Supabase Studio.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS onboarding_dismissed_business_model BOOLEAN NOT NULL DEFAULT FALSE;
