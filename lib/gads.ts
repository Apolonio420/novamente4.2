export const GOOGLE_ADS_ID = "AW-18028033546"
// TODO (Google Ads UI): Verify the "Purchase" conversion action is configured with
// "Use different values for each conversion" (not a fixed value).
// Path: Google Ads → Goals → Conversions → Purchase → edit → "Value" section.
// Without this, Smart Bidding ignores the dynamic value passed here and ROAS breaks.
export const GOOGLE_ADS_PURCHASE_LABEL = "mzyTCK-Z36AcEIrst5RD"

type GtagFn = (...args: unknown[]) => void

const getGtag = (): GtagFn | null => {
  if (typeof window === "undefined") return null
  return (window as unknown as { gtag?: GtagFn }).gtag ?? null
}

export const trackPurchase = (
  value: number,
  transactionId?: string,
  currency = "ARS",
) => {
  const gtag = getGtag()
  if (!gtag) return
  gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
    value,
    currency,
    transaction_id: transactionId ?? "",
  })
}
