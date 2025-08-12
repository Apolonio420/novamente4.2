import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("🔍 OPTIMIZING PROMPT:", prompt)

    const { text: optimizedPrompt } = await generateText({
      model: openai("gpt-4o"),
      system: `Eres un experto en optimización de prompts para DALL-E 3. Tu trabajo es mejorar prompts para generar imágenes de alta calidad para diseños de ropa.

REGLAS IMPORTANTES:
1. SIEMPRE incluir "una única composición centrada, sin duplicados, sin versiones alternativas" si no está explícitamente mencionado que quiere múltiples imágenes
2. SIEMPRE incluir "imagen de alta resolución" 
3. Mantener el idioma original del prompt
4. Agregar detalles técnicos para mejorar la calidad
5. Especificar fondo apropiado si no está mencionado
6. Usar solo términos positivos, evitar palabras negativas
7. Optimizar para diseños que se vean bien en ropa

FORMATO DE SALIDA: Solo devuelve el prompt optimizado, sin explicaciones adicionales.`,
      prompt: `Optimiza este prompt para DALL-E 3: "${prompt}"`,
      maxTokens: 200,
    })

    console.log("✅ PROMPT OPTIMIZED:", optimizedPrompt)

    return NextResponse.json({
      optimizedPrompt: optimizedPrompt.trim(),
      fallback: false,
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
