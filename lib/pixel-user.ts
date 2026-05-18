/**
 * Pixel user identification — stores user info in localStorage and re-initializes
 * the Meta Pixel with Advanced Matching so all subsequent events carry hashed
 * user data. Boosts Event Match Quality Score from ~6/10 to 8-9/10.
 *
 * Plain values are passed to fbq('init', PIXEL_ID, userData) — Facebook hashes
 * them client-side per their docs:
 * https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching
 */

const STORAGE_KEY = 'nm_pixel_user'

export interface PixelUserData {
  em?: string         // email (plain — fbq hashes)
  ph?: string         // phone digits only
  fn?: string         // first name lowercase
  ln?: string         // last name lowercase
  ct?: string         // city lowercase
  zp?: string         // zip
  country?: string    // 2-letter country code lowercase
  external_id?: string // optional internal id
}

function normalize(data: Partial<PixelUserData>): PixelUserData {
  const out: PixelUserData = {}
  if (data.em) out.em = data.em.toLowerCase().trim()
  if (data.ph) out.ph = data.ph.replace(/\D/g, '')
  if (data.fn) out.fn = data.fn.toLowerCase().trim()
  if (data.ln) out.ln = data.ln.toLowerCase().trim()
  if (data.ct) out.ct = data.ct.toLowerCase().trim()
  if (data.zp) out.zp = data.zp.trim()
  if (data.country) out.country = data.country.toLowerCase().trim()
  if (data.external_id) out.external_id = data.external_id.trim()
  return out
}

export function getStoredPixelUser(): PixelUserData {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as PixelUserData
  } catch {
    return {}
  }
}

/**
 * Merge new user data with existing, persist to localStorage, and re-init
 * any active fbq pixel instances with the updated Advanced Matching data.
 */
export function setPixelUser(data: Partial<PixelUserData>): void {
  if (typeof window === 'undefined') return
  const current = getStoredPixelUser()
  const merged = { ...current, ...normalize(data) }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // Storage quota or disabled — non-fatal
  }

  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq
  if (!fbq) return

  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  if (pixelId) {
    // Re-init global pixel with new Advanced Matching data
    fbq('init', pixelId, merged)
  }

  // Re-init any partner pixels also loaded on page (window.__nm_partner_pixels)
  const partnerPixels =
    (window as unknown as { __nm_partner_pixels?: string[] }).__nm_partner_pixels || []
  for (const pid of partnerPixels) {
    fbq('init', pid, merged)
  }
}

export function clearPixelUser(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}
