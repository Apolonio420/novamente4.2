import type { Tenant } from './types'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { countPublishedProducts } from './catalog'
import { updateTenant } from './tenant'
import { sendEmail } from '@/lib/email'
import { buildStorefrontReactivatedEmail } from './storefront-reactivated-email'

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
 * a proposito, el branding todavia no es el minimo necesario, o el tenant
 * tiene 0 productos publicados (auditoría 22/09: 6 tiendas + e2e-partner-test
 * quedaron publicadas sin un solo producto cargado — vidriera vacía).
 *
 * `publishedCount` lo cuenta el caller (countPublishedProducts) — este
 * helper es puro y no toca la base.
 *
 * `status: 'active'` solo se incluye si el tenant estaba en 'onboarding'
 * (nunca pisa 'paused'/'suspended' — esos son estados que un admin o el
 * propio partner eligieron a proposito).
 */
export function computeAutoPublishUpdates(
  tenant: BrandingFields & PublishState & MetadataField,
  publishedCount: number,
): { storefront_published: true; status?: 'active' } | null {
  if (tenant.storefront_published) return null
  if (isHiddenManually(tenant.metadata)) return null
  if (!hasMinimumBranding(tenant)) return null
  if (publishedCount < 1) return null

  const updates: { storefront_published: true; status?: 'active' } = {
    storefront_published: true,
  }
  if (tenant.status === 'onboarding') {
    updates.status = 'active'
  }
  return updates
}

/**
 * Contraparte de computeAutoPublishUpdates: si una tienda YA publicada se
 * queda sin ningún producto publicado (se despublicó/borró/pasó a draft el
 * último), se apaga sola — nunca queda una vidriera vacía en /p/<slug>.
 *
 * A propósito NO toca metadata.storefront_hidden_manually: al volver a tener
 * un producto publicado, computeAutoPublishUpdates la vuelve a prender sin
 * que el partner tenga que hacer nada — a diferencia de cuando el partner
 * la apaga él mismo desde Configuración.
 */
export function computeAutoUnpublishUpdates(
  tenant: PublishState,
  publishedCount: number,
): { storefront_published: false } | null {
  if (!tenant.storefront_published) return null
  if (publishedCount > 0) return null
  return { storefront_published: false }
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
  | 'suspended'
  | 'hidden_manually'
  | 'missing_logo'
  | 'missing_cover_or_description'
  | 'no_products'
  | 'ready_not_published'

/**
 * `status==='suspended'` es SOLO la suspensión MANUAL (fraude/abuso, acción
 * de admin) — el impago dejó de suspender cuentas (cron
 * check-subscriptions degrada a Starter en vez de suspender), así que llegar
 * acá con status suspended ya no puede ser por falta de pago. Se chequea
 * primero: ni el branding ni el apagado manual importan si la cuenta está
 * suspendida, y app/p/[slug]/page.tsx igual hace notFound() para
 * status !== 'active', así que este motivo nunca compite con storefront_published.
 *
 * `publishedCount` se suma DESPUÉS del branding: a un partner sin logo hay
 * que pedirle el logo, no "cargá un producto" (aunque también le falten los
 * dos). `no_products` es el motivo cuando el branding YA está completo — el
 * caso que agrega la auditoría 22/09 (6 tiendas + e2e-partner-test vacías).
 */
export function computeStorefrontHiddenReason(
  tenant: BrandingFields & PublishState & MetadataField,
  publishedCount: number,
): StorefrontHiddenReason | null {
  if (tenant.status === 'suspended') return 'suspended'
  if (tenant.storefront_published) return null
  if (isHiddenManually(tenant.metadata)) return 'hidden_manually'
  if (!tenant.logo_url) return 'missing_logo'
  if (!tenant.banner_url && !tenant.tagline && !tenant.about_text) return 'missing_cover_or_description'
  if (publishedCount < 1) return 'no_products'
  return 'ready_not_published'
}

/**
 * Efecto compartido cuando un producto partner nace o pasa a 'published':
 * marca `first_product_published_at` y corre la regla de auto-publish del
 * storefront (computeAutoPublishUpdates arriba) — si corresponde, prende
 * `storefront_published` + `storefront_published_at` y manda el email de
 * reactivacion.
 *
 * A diferencia de computeAutoPublishUpdates (puro), ESTE helper SI toca la
 * base. Es la extraccion del bloque que antes vivia solo en
 * catalog/[id]/route.ts (PUT, draft->published desde el panel) — el POST de
 * products/from-design (crea el producto YA publicado, flow "Aplicar a
 * prenda" de Studio) nunca lo corria, asi que un tenant podia tener 4
 * productos publicados + branding completo y seguir con storefront_published
 * = false, invisible en /p/<slug> sin aviso (caso lumina, detectado por el
 * healthcheck como "tienda muerta silenciosa", 10/2026).
 *
 * Devuelve si el storefront se auto-publico, para que el caller lo refleje
 * en su response (`auto_published`).
 */
export async function onProductPublished(tenant: Tenant): Promise<boolean> {
  // Fire-and-forget: set first_product_published_at once.
  ;(supabaseAdmin as any)
    .from('tenants')
    .update({ first_product_published_at: new Date().toISOString() })
    .eq('id', tenant.id)
    .is('first_product_published_at', null)

  const publishedCount = await countPublishedProducts(tenant.id)
  const autoPublishUpdates = computeAutoPublishUpdates(tenant, publishedCount)
  if (!autoPublishUpdates) return false

  const updatedTenant = await updateTenant(tenant.id, autoPublishUpdates)
  if (!updatedTenant) return false

  const now = new Date().toISOString()
  ;(supabaseAdmin as any)
    .from('tenants')
    .update({ storefront_published_at: now })
    .eq('id', tenant.id)
    .is('storefront_published_at', null)

  // Best-effort: avisar al partner que su tienda volvio a estar online.
  // Nunca debe romper la respuesta del endpoint si falla el envio.
  try {
    const { subject, html } = buildStorefrontReactivatedEmail({
      tenantName: tenant.name,
      slug: tenant.slug,
    })
    await sendEmail({ to: tenant.email, subject, html })
  } catch (emailError) {
    console.error('Error enviando email de reactivacion de tienda:', emailError)
  }

  return true
}
