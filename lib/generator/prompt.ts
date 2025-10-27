// lib/generator/prompt.ts
export type StyleId = "linear-min" | "line-art" | "sticker" | "watercolor" | "geometric" | "vintage" | "neon" | "sketch";

const STYLE_SNIPPETS: Record<StyleId, string> = {
  "linear-min": "minimal line art, clean lines, high contrast, vector look",
  "line-art": "fine line art, tattoo-like style, monochrome emphasis",
  "sticker": "sticker style, bold outline, flat colors, clean thick border",
  "watercolor": "watercolor painting, soft brushstrokes, diluted colors",
  "geometric": "geometric abstract art, geometric patterns, clean shapes",
  "vintage": "vintage style, retro colors, sepia tones",
  "neon": "neon bright colors, glowing effects, vibrant",
  "sketch": "pencil sketch, loose lines, sketchy style"
};

export function buildPrompt(base: string, style?: StyleId): string {
  if (!style || !STYLE_SNIPPETS[style]) {
    return base.trim()
  }
  
  const styleText = STYLE_SNIPPETS[style]
  return `${base.trim()}, ${styleText}`.trim()
}

export function getStyleDescription(styleId: StyleId): string {
  return STYLE_SNIPPETS[styleId] || ""
}

