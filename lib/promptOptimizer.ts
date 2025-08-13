/**
 * Cliente para optimización de prompts usando OpenAI
 * Reemplaza la optimización local con IA real
 */

export interface OptimizationOptions {
  layout?: "square" | "tall" | "wide"
  style?: string
}

export function optimizePrompt(originalPrompt: string, options: OptimizationOptions = {}): string {
  console.log("🔍 PROMPT OPTIMIZER: Using fallback optimization")
  console.log("📥 INPUT PROMPT:", originalPrompt)

  return fallbackOptimization(originalPrompt)
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
