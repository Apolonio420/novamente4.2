import type { ModerationResult } from './types'

// Blocklist of terms that should never appear in design prompts
// Covers: violence, sexual content, hate speech, drugs, weapons, etc.
const BLOCKED_PATTERNS: RegExp[] = [
  // Violence & weapons
  /\b(arma|pistola|rifle|escopeta|metralleta|bomba|explosivo|granada|cuchillo ensangrentado|asesin|matar|muerte violenta|decapita|tortura|gore|sangre|sangriento|mutila)\b/i,
  /\b(gun|rifle|shotgun|bomb|explosive|grenade|murder|kill|death|decapitat|torture|gore|bloody|mutilat)\b/i,
  // Sexual
  /\b(porno|pornograf|desnud[oa]s?\b.*sexual|genital|orgasmo|masturba|felaci|sodomi|penetraci[oó]n sexual|hentai explicit)\b/i,
  /\b(porn|naked.*sexual|genital|orgasm|masturb|fellat|sodom|penetrat.*sexual|explicit hentai)\b/i,
  // Hate speech
  /\b(nazi|esvástica|swastika|supremac|odio racial|antisemit|holocausto.*burla|KKK|ku klux)\b/i,
  /\b(nazi|swastika|supremac|racial.*hate|antisemit|holocaust.*mock|kkk|ku klux)\b/i,
  // Drugs
  /\b(cocaína|heroína|metanfetamina|crack|droga dura|inyectarse|consumo.*droga)\b/i,
  /\b(cocaine|heroin|methamphetamine|crack pipe|hard drug|inject.*drug)\b/i,
  // Child safety
  /\b(menor.*sexual|niñ[oa].*desnud|child.*naked|child.*sexual|pedofil|pedo)\b/i,
  // Self-harm
  /\b(suicid|autolesion|cortarse las venas|self.?harm|cut.*wrist)\b/i,
]

export function checkPromptModeration(prompt: string): ModerationResult {
  const normalized = prompt.toLowerCase().trim()

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        passed: false,
        reason: 'Tu prompt contiene contenido que no está permitido. Por favor, modificalo e intentá de nuevo.',
      }
    }
  }

  return { passed: true }
}

/**
 * Returns Gemini safety settings to block harmful content.
 * Used in generateContent() calls.
 */
export function getGeminiSafetySettings() {
  return [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  ]
}
