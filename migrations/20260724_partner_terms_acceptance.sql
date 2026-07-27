-- Registro de aceptación de Términos y Condiciones por parte de los Partners.
-- Clickwrap: al ingresar al workspace (GET /api/partners/me) se registra la
-- versión vigente (lib/partners/terms-version.ts), la fecha y el usuario.
-- Columnas nullable, aditivas → cambio de metadata instantáneo, sin reescritura.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version     text,
  ADD COLUMN IF NOT EXISTS terms_accepted_by uuid;

COMMENT ON COLUMN public.tenants.terms_accepted_at IS 'Momento en que el Partner aceptó los T&C (clickwrap al ingresar al workspace).';
COMMENT ON COLUMN public.tenants.terms_version     IS 'Versión de T&C aceptada. Ver lib/partners/terms-version.ts.';
COMMENT ON COLUMN public.tenants.terms_accepted_by IS 'auth.users.id del usuario que registró la aceptación.';
