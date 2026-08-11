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
type MetadataField = { metadata?: Record<string, unknown> | null }

/**
 * Branding minimo: logo + (banner O tagline O about_text). Mismo criterio
 * que ya usaba branding/route.ts.
 */
export function hasMinimumBranding(tenant: BrandingFields): boolean {
  return !!tenant.logo_url && (!!tenant.banner_url || !!tenant.tagline || !!tenant.about_text)
}

/**
 * Un partner puede apagar su storefront A PROPOSITO desde Configuracion. Esa
 * decision se marca en metadata.storefront_hidden_manually (ver
 * app/api/partners/settings/route.ts) y el auto-publish la tiene que
 * respetar: publicar un producto o editar branding despues de eso NO debe
 * volver a prender la tienda sin que el partner lo pida de nuevo.
 */
export function isHiddenManually(metadata: Record<string, unknown> | null | undefined): boolean {
  return metadata?.storefront_hidden_manually === true
}

/**
 * Devuelve los campos a actualizar para auto-publicar el storefront, o null
 * si no corresponde. No corresponde cuando: el storefront YA esta publicado
 * (no re-escribimos ni pisamos storefront_published_at), el partner lo apago
 * a proposito, o el branding todavia no es el minimo necesario.
 *
 * `status: 'active'` solo se incluye si el tenant estaba en 'onboarding'
 * (nunca pisa 'paused'/'suspended' — esos son estados que un admin o el
 * propio partner eligieron a proposito).
 */
export function computeAutoPublishUpdates(
  tenant: BrandingFields & PublishState & MetadataField,
): { storefront_published: true; status?: 'active' } | null {
  if (tenant.storefront_published) return null
  if (isHiddenManually(tenant.metadata)) return null
  if (!hasMinimumBranding(tenant)) return null

  const updates: { storefront_published: true; status?: 'active' } = {
    storefront_published: true,
  }
  if (tenant.status === 'onboarding') {
    updates.status = 'active'
  }
  return updates
}

/**
 * Motivo por el que el storefront no esta visible, para que el UI del
 * workspace pueda explicarselo al partner en vez de solo avisar "esta
 * oculta". null cuando el storefront YA esta publicado (nada que mostrar).
 *
 * Prioridad: si lo oculto a proposito, ese es el motivo — no lo regañamos
 * por branding incompleto encima. Despues, branding faltante (logo primero,
 * es el requisito duro; portada/tagline/descripcion despues). Si tiene todo
 * y no lo oculto el mismo, es un estado raro (el auto-publish deberia haberlo
 * cubierto) pero lo cubrimos igual con 'ready_not_published'.
 */
export type StorefrontHiddenReason =
  | 'hidden_manually'
  | 'missing_logo'
  | 'missing_cover_or_description'
  | 'ready_not_published'

export function computeStorefrontHiddenReason(
  tenant: BrandingFields & PublishState & MetadataField,
): StorefrontHiddenReason | null {
  if (tenant.storefront_published) return null
  if (isHiddenManually(tenant.metadata)) return 'hidden_manually'
  if (!tenant.logo_url) return 'missing_logo'
  if (!tenant.banner_url && !tenant.tagline && !tenant.about_text) return 'missing_cover_or_description'
  return 'ready_not_published'
}
