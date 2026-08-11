import type { Tenant } from './types'

/**
 * Regla compartida de "storefront listo para publicarse solo".
 *
 * Antes esta logica vivia SOLO en app/api/partners/branding/route.ts (el
 * bloque "AUTO-PUBLISH" agregado por el caso DUB SHIRTS: el partner cargaba
 * branding minimo y quedaba activo automaticamente). El problema: un partner
 * que carga su branding durante el ONBOARDING (otro endpoint) y despues
 * publica productos sin volver a tocar /workspace/branding nunca pasaba por
 * ese bloque y quedaba con storefront_published=false para siempre, invisible
 * en /p/<slug> sin que nada se lo avise (caso Orlando, 08/2026).
 *
 * Este helper es la UNICA fuente de verdad de la regla; branding/route.ts y
 * catalog/[id]/route.ts la consumen — no duplicar la condicion.
 */

type BrandingFields = Pick<Tenant, 'logo_url' | 'banner_url' | 'tagline' | 'about_text'>
type PublishState = Pick<Tenant, 'storefront_published' | 'status'>

/**
 * Branding minimo: logo + (banner O tagline O about_text). Mismo criterio
 * que ya usaba branding/route.ts.
 */
export function hasMinimumBranding(tenant: BrandingFields): boolean {
  return !!tenant.logo_url && (!!tenant.banner_url || !!tenant.tagline || !!tenant.about_text)
}

/**
 * Devuelve los campos a actualizar para auto-publicar el storefront, o null
 * si no corresponde. No corresponde cuando: el storefront YA esta publicado
 * (no re-escribimos ni pisamos storefront_published_at), o el branding
 * todavia no es el minimo necesario.
 *
 * `status: 'active'` solo se incluye si el tenant estaba en 'onboarding'
 * (nunca pisa 'paused'/'suspended' — esos son estados que un admin o el
 * propio partner eligieron a proposito).
 */
export function computeAutoPublishUpdates(
  tenant: BrandingFields & PublishState,
): { storefront_published: true; status?: 'active' } | null {
  if (tenant.storefront_published) return null
  if (!hasMinimumBranding(tenant)) return null

  const updates: { storefront_published: true; status?: 'active' } = {
    storefront_published: true,
  }
  if (tenant.status === 'onboarding') {
    updates.status = 'active'
  }
  return updates
}
