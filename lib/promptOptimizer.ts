/**
 * Cliente para optimización de prompts usando OpenAI
 * Reemplaza la optimización local con IA real
 */

export async function optimizePrompt(originalPrompt: string): Promise<string> {
  console.log("🔍 PROMPT OPTIMIZER: Using OpenAI for optimization")
  console.log("📥 INPUT PROMPT:", originalPrompt)

  try {
    const response = await fetch("/api/optimize-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: originalPrompt }),
    })

    if (!response.ok) {
      console.error("❌ Optimization API failed, using fallback")
      return fallbackOptimization(originalPrompt)
    }

    const data = await response.json()

    if (data.fallback) {
      console.log("⚠️ Using fallback optimization")
      return fallbackOptimization(originalPrompt)
    }

    console.log("📤 OPTIMIZED PROMPT:", data.optimizedPrompt)
    return data.optimizedPrompt
  } catch (error) {
    console.error("❌ Error in prompt optimization:", error)
    return fallbackOptimization(originalPrompt)
  }
}

// Optimización de respaldo si falla la API
function fallbackOptimization(prompt: string): string {
  console.log("🔄 Using fallback optimization")

  const cleanPrompt = prompt.trim()
  if (!cleanPrompt) return cleanPrompt

  // Detectar si ya tiene fondo específico
  const hasBackground = /\b(fondo|background)\b/i.test(cleanPrompt)

  // Detectar si ya especifica composición única
  const hasSingleComposition = /\b(única|single|one|solo|centrada|centered)\b/i.test(cleanPrompt)

  // Optimización básica
  let optimized = cleanPrompt

  if (!hasBackground) {
    optimized += ", isolated on plain white background"
  }

  // Agregar especificación de composición única si no está presente
  if (!hasSingleComposition) {
    optimized += ", una única composición centrada, sin duplicados, sin versiones alternativas"
  }

  optimized += ", imagen de alta resolución, suitable for print design"

  console.log("📤 FALLBACK OPTIMIZED:", optimized)
  return optimized
}

// Función para retry (mantenida para compatibilidad)
export function addRetryEmphasis(prompt: string, retryCount: number): string {
  if (retryCount === 0) return prompt

  const emphasis =
    retryCount === 1
      ? ", vector illustration style, graphic design element"
      : ", minimalist vector art, logo design style, clean graphic illustration"

  return `${prompt}${emphasis}`
}
