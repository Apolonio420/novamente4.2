import { describe, it, expect } from "vitest"
import { optimizePrompt, addRetryEmphasis } from "../lib/promptOptimizer"

describe("promptOptimizer v8", () => {
  it("uses positive language instead of negative instructions", () => {
    const userPrompt = "dragon breathing fire"
    const optimized = optimizePrompt(userPrompt)

    expect(optimized).toContain("on a plain white background")
    expect(optimized).toContain("isolated subject with no other elements")
    expect(optimized).not.toContain("DO NOT SHOW")
    expect(optimized).not.toContain("NO UI")
    expect(optimized).toMatchSnapshot()
  })

  it("starts with 'Illustration:' to set context", () => {
    const userPrompt = "cute cat"
    const optimized = optimizePrompt(userPrompt)

    expect(optimized).toMatch(/^Illustration: cute cat/)
    expect(optimized).toMatchSnapshot()
  })

  it("removes all trigger words from user prompt", () => {
    const userPrompt = "vector design of a dragon, digital illustration style"
    const optimized = optimizePrompt(userPrompt)

    expect(optimized).not.toContain("vector")
    expect(optimized).not.toContain("design")
    expect(optimized).not.toContain("digital")
    expect(optimized).not.toContain("illustration")
    expect(optimized).toContain("Illustration: of a dragon, style")
    expect(optimized).toMatchSnapshot()
  })

  it("uses composition hints based on layout", () => {
    const userPrompt = "sunset over mountains"

    const squareOptimized = optimizePrompt(userPrompt, { layout: "square" })
    expect(squareOptimized).toContain("centered composition")
    expect(squareOptimized).toMatchSnapshot()

    const tallOptimized = optimizePrompt(userPrompt, { layout: "tall" })
    expect(tallOptimized).toContain("vertically centered composition")
    expect(tallOptimized).toMatchSnapshot()

    const wideOptimized = optimizePrompt(userPrompt, { layout: "wide" })
    expect(wideOptimized).toContain("horizontally centered composition")
    expect(wideOptimized).toMatchSnapshot()
  })

  it("adds subtle emphasis for retry without negative language", () => {
    const optimized = optimizePrompt("cute cat")
    const withEmphasis = addRetryEmphasis(optimized)

    expect(withEmphasis).toContain(
      "The artwork is completely isolated on a pure white backdrop with absolutely nothing else in the image",
    )
    expect(withEmphasis).not.toContain("NO SOFTWARE")
    expect(withEmphasis).not.toContain("DO NOT")
    expect(withEmphasis).toMatchSnapshot()
  })
})
