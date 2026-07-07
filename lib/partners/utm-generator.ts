/**
 * UTM parameter generator for Meta Ads campaigns.
 */

export interface UtmParams {
  source: string
  medium: string
  campaign: string
  content?: string
}

/**
 * Append UTM parameters to a base URL.
 */
export function generateUtmUrl(baseUrl: string, params: UtmParams): string {
  const url = new URL(baseUrl)

  url.searchParams.set('utm_source', params.source)
  url.searchParams.set('utm_medium', params.medium)
  url.searchParams.set('utm_campaign', params.campaign)

  if (params.content) {
    url.searchParams.set('utm_content', params.content)
  }

  return url.toString()
}

/**
 * Generate a UTM URL specifically for Meta Ads, with consistent naming conventions.
 * Format: https://domain/p/{slug}?utm_source=meta&utm_medium=paid_social&utm_campaign={slug}_{templateType}&utm_content={productSlug}
 */
export function generateMetaAdUtm(
  tenantSlug: string,
  templateType: string,
  productSlug?: string,
): string {
  // Use the current origin or a placeholder for server-side
  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || 'https://novamente.ar'

  const baseUrl = `${origin}/p/${tenantSlug}`

  return generateUtmUrl(baseUrl, {
    source: 'meta',
    medium: 'paid_social',
    campaign: `${tenantSlug}_${templateType}`,
    content: productSlug || undefined,
  })
}
