/**
 * Lightweight prompt optimizer used for tests.
 * Applies simple string heuristics synchronously without any network calls.
 */

export interface OptimizeOptions {
  layout?: "square" | "tall" | "wide"
}

const TRIGGER_WORDS = ["vector", "design", "digital", "illustration"]

/**
 * Optimises a user provided prompt by removing trigger words, prefixing the
 * description with "Illustration:" and appending composition hints and positive
 * language. The function is synchronous so that it can be used directly in the
 * tests without awaiting a Promise.
 */
export function optimizePrompt(originalPrompt: string, opts: OptimizeOptions = {}): string {
  let cleaned = originalPrompt
    // remove trigger words such as "vector" and "design"
    .replace(new RegExp(`\\b(${TRIGGER_WORDS.join("|")})\\b`, "gi"), "")
    // normalise excess white-space and commas left by the replacements
    .replace(/\s+,/g, ",")
    .replace(/,\s+/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim()

  // ensure leading/trailing commas are removed after cleanup
  cleaned = cleaned.replace(/^,\s*/, "").replace(/,\s*$/, "").trim()

  let result = `Illustration: ${cleaned}`

  // Layout specific composition hints
  switch (opts.layout) {
    case "tall":
      result += ", vertically centered composition"
      break
    case "wide":
      result += ", horizontally centered composition"
      break
    default:
      result += ", centered composition"
  }

  // Positive language without negative instructions
  result += ", isolated subject with no other elements, on a plain white background"

  return result
}

/**
 * Adds a positive emphasis used when retrying an image generation request.
 * The emphasised sentence is purposely verbose but avoids negative language.
 */
export function addRetryEmphasis(prompt: string, retryCount = 1): string {
  if (retryCount <= 0) return prompt

  const emphasis =
    "The artwork is completely isolated on a pure white backdrop with absolutely nothing else in the image, minimalist vector art, logo design style, clean graphic illustration"

  return `${prompt}, ${emphasis}`
}

