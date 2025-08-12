import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("🔍 OPTIMIZING PROMPT:", prompt)

    // Temporary fallback optimization without AI SDK
    const cleanPrompt = prompt.trim()
    const hasBackground = /\b(fondo|background)\b/i.test(cleanPrompt)
    const hasSingleComposition = /\b(única|single|one|solo|centrada|centered)\b/i.test(cleanPrompt)

    let optimizedPrompt = cleanPrompt

    if (!hasBackground) {
      optimizedPrompt += ", isolated on plain white background"
    }

    if (!hasSingleComposition) {
      optimizedPrompt += ", una única composición centrada, sin duplicados, sin versiones alternativas"
    }

    optimizedPrompt += ", imagen de alta resolución, suitable for print design"

    console.log("✅ PROMPT OPTIMIZED:", optimizedPrompt)

    return NextResponse.json({
      optimizedPrompt: optimizedPrompt,
      fallback: true,
    })
  } catch (error) {
    console.error("❌ Error optimizing prompt:", error)

    // Fallback optimization
    const cleanPrompt = prompt.trim()
    const hasBackground = /\b(fondo|background)\b/i.test(cleanPrompt)
    const hasSingleComposition = /\b(única|single|one|solo|centrada|centered)\b/i.test(cleanPrompt)

    let fallbackOptimized = cleanPrompt

    if (!hasBackground) {
      fallbackOptimized += ", isolated on plain white background"
    }

    if (!hasSingleComposition) {
      fallbackOptimized += ", una única composición centrada, sin duplicados, sin versiones alternativas"
    }

    fallbackOptimized += ", imagen de alta resolución, suitable for print design"

    return NextResponse.json({
      optimizedPrompt: fallbackOptimized,
      fallback: true,
    })
  }
}
