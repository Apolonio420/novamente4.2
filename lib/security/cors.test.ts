import { describe, expect, it, afterEach } from "vitest"
import { isAllowedOrigin } from "./cors"

describe("isAllowedOrigin", () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it("allows requests without an Origin header (server-to-server / same-origin)", () => {
    expect(isAllowedOrigin(null)).toBe(true)
  })

  it("allows the production domains", () => {
    expect(isAllowedOrigin("https://www.novamente.ar")).toBe(true)
    expect(isAllowedOrigin("https://novamente.ar")).toBe(true)
  })

  it("allows the storefront Vercel project (prod + preview deploys)", () => {
    expect(isAllowedOrigin("https://v0-nova-mente-storefront.vercel.app")).toBe(true)
    expect(
      isAllowedOrigin("https://v0-nova-mente-storefront-git-fix-foo-novamente.vercel.app"),
    ).toBe(true)
  })

  it("rejects unrelated third-party origins", () => {
    expect(isAllowedOrigin("https://evil.com")).toBe(false)
    expect(isAllowedOrigin("https://novamente.ar.evil.com")).toBe(false)
    expect(isAllowedOrigin("https://some-other-project.vercel.app")).toBe(false)
  })

  it("rejects a spoofed origin that merely contains the vercel project name", () => {
    expect(isAllowedOrigin("https://v0-nova-mente-storefront.vercel.app.evil.com")).toBe(false)
  })

  it("only allows localhost when NODE_ENV=development", () => {
    process.env.NODE_ENV = "production"
    expect(isAllowedOrigin("http://localhost:3000")).toBe(false)

    process.env.NODE_ENV = "development"
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true)
  })
})
