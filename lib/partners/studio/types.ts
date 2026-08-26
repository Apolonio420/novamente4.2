export interface StudioMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  imageUrl?: string
  attachedImageUrl?: string
  /** Procedencia de la imagen del mensaje: subida por el partner vs generada con IA */
  source?: 'upload' | 'ai'
  type: 'text' | 'design' | 'mockup'
  styleApplied?: string
  styleName?: string
  promptUsed?: string
  garmentKey?: string
  /** Color del garment para el mockup ('black', 'white', etc.) */
  garmentColor?: string
  /** Lado del estampado ('front' | 'back') — usado para doble estampa */
  side?: 'front' | 'back'
  /**
   * Con qué se hizo este mockup. Va a la ficha de producción: el mockup es una
   * foto, el que se imprime es este diseño en esta medida.
   */
  designImageUrl?: string
  stampMode?: 'large' | 'medium' | 'chest-logo'
  placement?: string
  stampWidthCm?: number
  moderationStatus?: 'passed' | 'blocked' | 'flagged'
  error?: string
  isLoading?: boolean
  timestamp: number
}

export interface StudioSession {
  id: string
  tenantId?: string
  title?: string
  selectedStyle?: string
  selectedGarment?: string
  messageCount?: number
  lastImageUrl?: string
  messages: StudioMessage[]
  createdAt: number
  updatedAt: number
}

export interface UsageInfo {
  used: number
  limit: number
  resetLabel: string
  percentUsed: number
  /** true en planes pagos (growth/pro) — generaciones sin tope */
  unlimited?: boolean
}

export interface ModerationResult {
  passed: boolean
  reason?: string
}

export interface BrandEssence {
  primaryColor: string | null
  secondaryColor: string | null
  accentColor: string | null
  visualMood: string | null
  brandKeywords: string[] | null
  promptSuffix: string | null
  palette: string[] | null
  tone: string | null
}

// Plan generation limits.
// starter: 20/semana (ventana rolling 7 días). growth/pro: ILIMITADO (Infinity) —
// el tope de generaciones solo aplica al plan gratis; los planes pagos generan sin límite.
export const PLAN_GENERATION_LIMITS: Record<string, number> = {
  starter: 20,
  growth: Infinity,
  pro: Infinity,
}

// Starter uses rolling 7-day window, growth/pro use calendar month
export const PLAN_USAGE_WINDOW: Record<string, 'weekly' | 'monthly'> = {
  starter: 'weekly',
  growth: 'monthly',
  pro: 'monthly',
}

export function createStudioMessage(
  role: 'user' | 'assistant' | 'system',
  content: string,
  extra: Partial<StudioMessage> = {},
): StudioMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    type: 'text',
    timestamp: Date.now(),
    ...extra,
  }
}

export function createStudioSession(title?: string): StudioSession {
  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
