import { describe, it, expect } from "vitest"
import { referralCodeFor, referralEmailParagraph, buildReferralShareLink } from "./referral-code"

describe("referral-code (contrato compartido con el bot)", () => {
  it("vector fijo: mismo valor que chatbot-whastapp tests/referral.test.ts", () => {
    expect(referralCodeFor("web", "test-vector-1")).toBe("REF-5KT161C2")
  })
  it("formato y tag que lee el bot", () => {
    const code = referralCodeFor("web", "o1")
    expect(code).toMatch(/^REF-[0-9A-Z]{8}$/)
    expect(decodeURIComponent(buildReferralShareLink(code).split("?text=")[1])).toContain(`(ref · ${code})`)
  })
  it("partner → null; propio → párrafo con link", () => {
    expect(referralEmailParagraph({ id: "o1", tenant_id: "t1" })).toBeNull()
    const p = referralEmailParagraph({ id: "o1", tenant_id: null })
    expect(p?.code).toBe(referralCodeFor("web", "o1"))
    expect(p?.html).toContain("wa.me/")
  })
})
