/**
 * Rollout controls shared by Partner server routes and client components.
 *
 * NEXT_PUBLIC variables are deliberately used because the same decision must
 * be available in the workspace UI. A feature is enabled by default during
 * development, while production requires an explicit `true` value.
 */
export type PartnersFeature = 'crm' | 'cockpit' | 'fulfillment'

function isEnabled(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false

  return process.env.NODE_ENV !== 'production'
}

export function isPartnersFeatureEnabled(feature: PartnersFeature): boolean {
  switch (feature) {
    case 'crm':
      return isEnabled(process.env.NEXT_PUBLIC_PARTNERS_CRM_ENABLED)
    case 'cockpit':
      return isEnabled(process.env.NEXT_PUBLIC_PARTNERS_COCKPIT_ENABLED)
    case 'fulfillment':
      return isEnabled(process.env.NEXT_PUBLIC_PARTNERS_FULFILLMENT_ENABLED)
  }
}

export const isPartnersCrmEnabled = () => isPartnersFeatureEnabled('crm')
export const isPartnersCockpitEnabled = () => isPartnersFeatureEnabled('cockpit')
export const isPartnersFulfillmentEnabled = () => isPartnersFeatureEnabled('fulfillment')
