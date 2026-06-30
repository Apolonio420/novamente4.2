export const GOOGLE_ADS_ID = "AW-18028033546"
// NOTE (Google Ads UI): The "Purchase" conversion action is configured to use a
// dynamic value (always_use_default_value=false, confirmed via API 2026-06-29), so
// the per-conversion value passed below is respected by Smart Bidding. Keep it this
// way — switching to a fixed value would flatten ROAS.
export const GOOGLE_ADS_PURCHASE_LABEL = "mzyTCK-Z36AcEIrst5RD"
export const GOOGLE_ADS_PARTNER_LEAD_LABEL = "ZmzbCID34qgcEIrst5RD"

type GtagFn = (...args: unknown[]) => void

const getGtag = (): GtagFn | null => {
  if (typeof window === "undefined") return null
  return (window as unknown as { gtag?: GtagFn }).gtag ?? null
}

/**
 * Enhanced Conversions user data. Plain (unhashed) values — the Google tag
 * normalizes and SHA-256 hashes them client-side when Enhanced Conversions is
 * enabled on the account. Only first-party data the user actively submitted in
 * a transactional form (checkout / partner signup) is ever passed here.
 */
export interface AdsUserData {
  email?: string
  phone?: string
}

/**
 * Best-effort E.164 phone normalization. Email is the primary match key (always
 * present in our flows); phone is a secondary signal, so we skip ambiguous input
 * rather than emit a malformed number. Defaults to Argentina (+54) when neither a
 * "+" prefix nor a country code is present.
 */
const toE164 = (raw: string, defaultCc = "54"): string | null => {
  const trimmed = raw.trim()
  const hasPlus = trimmed.startsWith("+")
  const digits = trimmed.replace(/\D/g, "")
  if (digits.length < 8) return null
  if (hasPlus) return `+${digits}`
  if (digits.startsWith(defaultCc) && digits.length >= 11) return `+${digits}`
  return `+${defaultCc}${digits.replace(/^0+/, "")}`
}

/**
 * Sets Enhanced Conversions user_data on the Google tag. MUST run before the
 * conversion event so gtag attaches it to the in-page conversion. No-op when no
 * usable data is present. Docs: https://support.google.com/google-ads/answer/13258081
 */
const setUserData = (gtag: GtagFn, user?: AdsUserData): void => {
  if (!user) return
  const userData: { email?: string; phone_number?: string } = {}
  const email = user.email?.toLowerCase().trim()
  if (email) userData.email = email
  if (user.phone) {
    const phone = toE164(user.phone)
    if (phone) userData.phone_number = phone
  }
  if (!userData.email && !userData.phone_number) return
  gtag("set", "user_data", userData)
}

export const trackPurchase = (
  value: number,
  transactionId?: string,
  currency = "ARS",
  user?: AdsUserData,
) => {
  const gtag = getGtag()
  if (!gtag) return
  setUserData(gtag, user)
  gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
    value,
    currency,
    transaction_id: transactionId ?? "",
  })
}

export const trackPartnerLead = (user?: AdsUserData) => {
  const gtag = getGtag()
  if (!gtag) return
  setUserData(gtag, user)
  gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PARTNER_LEAD_LABEL}`,
  })
}
