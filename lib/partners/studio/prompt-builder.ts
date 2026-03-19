import type { BrandEssence } from './types'
import type { PartnerDesignConfig } from '../design-engine'

/**
 * Visual mood descriptors that get injected into prompts.
 */
const MOOD_DESCRIPTORS: Record<string, string> = {
  urbano: 'urban streetwear aesthetic, gritty textures, bold contrasts',
  minimalista: 'clean minimal aesthetic, lots of negative space, subtle tones',
  bold: 'bold vibrant aesthetic, high contrast, saturated colors, impactful composition',
  creativo: 'creative experimental aesthetic, mixed media feel, artistic freedom',
  elegante: 'elegant refined aesthetic, sophisticated palette, tasteful composition',
  retro: 'retro vintage aesthetic, warm tones, nostalgic feel, analog textures',
  futurista: 'futuristic aesthetic, sleek lines, neon accents, tech-inspired',
}

/**
 * Build a brand-essence-aware prompt from the user's input and their brand config.
 */
export function buildBrandAwarePrompt(
  userPrompt: string,
  essence: BrandEssence | null,
  style?: string,
): string {
  const parts: string[] = [userPrompt.trim()]

  if (essence) {
    // Visual mood
    if (essence.visualMood && MOOD_DESCRIPTORS[essence.visualMood]) {
      parts.push(MOOD_DESCRIPTORS[essence.visualMood])
    }

    // Brand keywords
    if (essence.brandKeywords && essence.brandKeywords.length > 0) {
      parts.push(`Brand identity: ${essence.brandKeywords.join(', ')}`)
    }

    // Color palette
    if (essence.palette && essence.palette.length > 0) {
      parts.push(`Use brand colors: ${essence.palette.join(', ')}`)
    } else {
      // Fallback to primary/secondary/accent
      const colors = [essence.primaryColor, essence.secondaryColor, essence.accentColor].filter(Boolean)
      if (colors.length > 0) {
        parts.push(`Incorporate brand colors: ${colors.join(', ')}`)
      }
    }

    // Tone
    if (essence.tone) {
      parts.push(`Tone: ${essence.tone}`)
    }

    // Custom suffix (last priority — gets truncated first)
    if (essence.promptSuffix) {
      parts.push(essence.promptSuffix)
    }
  }

  // Join and truncate to 500 chars (leaving room for style keywords in the optimizer)
  let result = parts.join('. ')
  if (result.length > 500) {
    result = result.substring(0, 497) + '...'
  }

  return result
}

/**
 * Extract brand essence from tenant + design config data.
 */
export function extractBrandEssence(
  tenant: { primary_color?: string; secondary_color?: string; accent_color?: string },
  config: PartnerDesignConfig & {
    visual_mood?: string
    brand_keywords?: string[]
    prompt_suffix?: string
  },
): BrandEssence {
  return {
    primaryColor: tenant.primary_color || null,
    secondaryColor: tenant.secondary_color || null,
    accentColor: tenant.accent_color || null,
    visualMood: config.visual_mood || null,
    brandKeywords: config.brand_keywords || null,
    promptSuffix: config.prompt_suffix || null,
    palette: config.palette || null,
    tone: config.tone || null,
  }
}
