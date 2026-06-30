import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  trackPurchase,
  trackPartnerLead,
  GOOGLE_ADS_ID,
  GOOGLE_ADS_PURCHASE_LABEL,
  GOOGLE_ADS_PARTNER_LEAD_LABEL,
} from "@/lib/gads"

type GtagMock = ReturnType<typeof vi.fn>

const setGtag = (fn: unknown) => {
  ;(window as unknown as { gtag?: unknown }).gtag = fn
}

describe("gads Enhanced Conversions (user_data)", () => {
  let gtag: GtagMock

  beforeEach(() => {
    gtag = vi.fn()
    setGtag(gtag)
  })

  it("sets user_data BEFORE firing the purchase conversion event", () => {
    trackPurchase(1000, "order-1", "ARS", {
      email: " Foo@Bar.com ",
      phone: "+54 9 11 1234-5678",
    })
    expect(gtag).toHaveBeenCalledTimes(2)
    // user_data must be set first so gtag attaches it to the conversion
    expect(gtag.mock.calls[0]).toEqual([
      "set",
      "user_data",
      { email: "foo@bar.com", phone_number: "+5491112345678" },
    ])
    expect(gtag.mock.calls[1][0]).toBe("event")
    expect(gtag.mock.calls[1][1]).toBe("conversion")
    expect(gtag.mock.calls[1][2]).toMatchObject({
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
      value: 1000,
      currency: "ARS",
      transaction_id: "order-1",
    })
  })

  it("sets user_data before the partner lead conversion event", () => {
    trackPartnerLead({ email: "  PARTNER@X.COM", phone: "1123456789" })
    expect(gtag.mock.calls[0]).toEqual([
      "set",
      "user_data",
      { email: "partner@x.com", phone_number: "+541123456789" },
    ])
    expect(gtag.mock.calls[1][2].send_to).toBe(
      `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PARTNER_LEAD_LABEL}`,
    )
  })

  it("treats a stored digits-only AR number (country code, no +) as E.164", () => {
    trackPurchase(2000, "o4", "ARS", { phone: "5492235169720" })
    expect(gtag.mock.calls[0]).toEqual([
      "set",
      "user_data",
      { phone_number: "+5492235169720" },
    ])
  })

  it("strips a national trunk 0 prefix before adding the country code", () => {
    trackPartnerLead({ phone: "011 1234-5678" })
    expect(gtag.mock.calls[0]).toEqual([
      "set",
      "user_data",
      { phone_number: "+541112345678" },
    ])
  })

  it("preserves an explicit + prefix (foreign number), stripping formatting only", () => {
    trackPartnerLead({ phone: "+1 (202) 555-0143" })
    expect(gtag.mock.calls[0]).toEqual([
      "set",
      "user_data",
      { phone_number: "+12025550143" },
    ])
  })

  it("skips an ambiguous/too-short phone but still sends email", () => {
    trackPartnerLead({ email: "a@b.com", phone: "123" })
    expect(gtag.mock.calls[0]).toEqual([
      "set",
      "user_data",
      { email: "a@b.com" },
    ])
  })

  it("does NOT set user_data when no usable data is present", () => {
    trackPartnerLead({})
    expect(gtag).toHaveBeenCalledTimes(1)
    expect(gtag.mock.calls[0][0]).toBe("event")
  })

  it("stays backwards-compatible when the user arg is omitted", () => {
    trackPurchase(500, "o2")
    expect(gtag).toHaveBeenCalledTimes(1)
    expect(gtag.mock.calls[0][0]).toBe("event")
  })

  it("is a no-op when gtag is unavailable", () => {
    setGtag(undefined)
    expect(() =>
      trackPurchase(100, "o3", "ARS", { email: "a@b.com" }),
    ).not.toThrow()
  })
})
