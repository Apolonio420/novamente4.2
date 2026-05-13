import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  ARTISTIC_STYLES,
  TEXTILE_COLOR_PALETTES,
  optimizePromptForNovaMente,
} from '@/lib/advanced-prompt-optimizer'
import type { Plan, DesignEngineMode } from './types'
import { PLAN_FEATURES } from './plans'

// Cast helper (same pattern as tenant.ts, catalog.ts)
const db = () => supabaseAdmin as any

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PartnerDesignConfig {
  tenant_id: string
  mode: DesignEngineMode
  palette: string[] | null
  forbidden_colors: string[] | null
  tone: string | null
  preferred_background: string | null
  logo_usage: string | null
  supported_garments: string[] | null
  supported_styles: string[] | null
  custom_prompts: Record<string, string> | null
}

export interface PartnerAsset {
  id: string
  tenant_id: string
  type: 'design' | 'mockup' | 'logo' | 'stamp'
  status: string
  storage_key: string
  public_url: string
  metadata: Record<string, unknown>
  created_at: string
}

// Available garment types — derivado de lib/catalog/products.ts (source of truth).
// Esto reemplaza el listado hardcodeado anterior que solo tenia 4 garments e
// incluia colores inexistentes (cream/gray para Aldea no existian fisicamente).
// Mantener esta forma como mapping plano para retrocompatibilidad con el codigo
// que ya hace `GARMENT_TYPES[key].colors`.
import { CATALOG_PRODUCTS } from '@/lib/catalog/products'

export const GARMENT_TYPES: Record<string, { name: string; colors: string[] }> = Object.fromEntries(
  CATALOG_PRODUCTS.map(p => [p.key, { name: p.name, colors: p.colors.map(c => c.key) }]),
)

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: PartnerDesignConfig = {
  tenant_id: '',
  mode: 'disabled',
  palette: null,
  forbidden_colors: null,
  tone: null,
  preferred_background: null,
  logo_usage: null,
  supported_garments: null,
  supported_styles: null,
  custom_prompts: null,
}

// ---------------------------------------------------------------------------
// getDesignConfig
// ---------------------------------------------------------------------------

export async function getDesignConfig(tenantId: string): Promise<PartnerDesignConfig> {
  const { data, error } = await db()
    .from('partner_design_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) {
    return { ...DEFAULT_CONFIG, tenant_id: tenantId }
  }

  return data as PartnerDesignConfig
}

// ---------------------------------------------------------------------------
// getAvailableStyles
// ---------------------------------------------------------------------------

export function getAvailableStyles(config: PartnerDesignConfig) {
  const allStyles = Object.entries(ARTISTIC_STYLES).map(([key, value]) => ({
    key,
    ...value,
  }))

  // If supported_styles is empty/null, return all
  if (!config.supported_styles || config.supported_styles.length === 0) {
    return allStyles
  }

  return allStyles.filter((s) => config.supported_styles!.includes(s.key))
}

// ---------------------------------------------------------------------------
// getAvailableGarments
// ---------------------------------------------------------------------------

export function getAvailableGarments(config: PartnerDesignConfig) {
  const allGarments = Object.entries(GARMENT_TYPES).map(([key, value]) => ({
    key,
    ...value,
  }))

  if (!config.supported_garments || config.supported_garments.length === 0) {
    return allGarments
  }

  return allGarments.filter((g) => config.supported_garments!.includes(g.key))
}

// ---------------------------------------------------------------------------
// validateDesignAccess
// ---------------------------------------------------------------------------

export type DesignAccessResult =
  | { allowed: true; mode: DesignEngineMode }
  | { allowed: false; reason: string }

export function validateDesignAccess(
  tenantDesignMode: DesignEngineMode,
  plan: Plan,
  requestedAction: 'generate' | 'mockup' | 'config',
): DesignAccessResult {
  // Plan-level feature determines the floor
  const planMode = PLAN_FEATURES[plan].designEngine

  // Plan mode is the FLOOR — tenant can upgrade but not downgrade
  // priority: disabled < mockups_only < presets < full_brand_fit
  const modePriority: Record<DesignEngineMode, number> = {
    disabled: 0,
    mockups_only: 1,
    presets: 2,
    full_brand_fit: 3,
  }

  const effectivePriority = Math.max(modePriority[planMode], modePriority[tenantDesignMode])
  const effectiveMode = (Object.entries(modePriority).find(
    ([, p]) => p === effectivePriority,
  )?.[0] ?? 'disabled') as DesignEngineMode

  if (effectiveMode === 'disabled') {
    return { allowed: false, reason: 'Design Engine no esta habilitado para tu plan. Actualiza para acceder.' }
  }

  if (requestedAction === 'config') {
    return { allowed: true, mode: effectiveMode }
  }

  if (requestedAction === 'generate' && effectiveMode === 'mockups_only') {
    return { allowed: false, reason: 'Tu plan solo permite mockups. Actualiza para generar disenos.' }
  }

  return { allowed: true, mode: effectiveMode }
}

// ---------------------------------------------------------------------------
// buildTenantPrompt
// ---------------------------------------------------------------------------

export function buildTenantPrompt(
  config: PartnerDesignConfig,
  userPrompt: string,
  style?: string,
  garmentColor?: string,
): string {
  // Start with the advanced prompt optimizer
  const colorway = garmentColor as any || 'negro'
  const artisticStyle = style as any || 'vectorial'

  const result = optimizePromptForNovaMente(userPrompt, {
    artisticStyle,
    colorway,
    printArea: 'R3',
  })

  let prompt = result.optimizedPrompt

  // Apply tenant palette override
  if (config.palette && config.palette.length > 0) {
    prompt += `. Use ONLY these brand colors: ${config.palette.join(', ')}`
  }

  // Apply forbidden colors
  if (config.forbidden_colors && config.forbidden_colors.length > 0) {
    prompt += `. NEVER use these colors: ${config.forbidden_colors.join(', ')}`
  }

  // Apply tone
  if (config.tone) {
    prompt += `. Tone: ${config.tone}`
  }

  // Apply preferred background
  if (config.preferred_background) {
    prompt += `. Background: ${config.preferred_background}`
  }

  // Apply custom prompts (append any suffix)
  if (config.custom_prompts?.suffix) {
    prompt += `. ${config.custom_prompts.suffix}`
  }

  // Truncate to 500 chars max
  if (prompt.length > 500) {
    prompt = prompt.substring(0, 497) + '...'
  }

  return prompt
}

// ---------------------------------------------------------------------------
// saveDesignAsset
// ---------------------------------------------------------------------------

export async function saveDesignAsset(
  tenantId: string,
  publicUrl: string,
  storageKey: string,
  type: 'design' | 'mockup' | 'logo' | 'stamp',
  metadata: Record<string, unknown> = {},
): Promise<PartnerAsset | null> {
  const { data, error } = await db()
    .from('partner_assets')
    .insert({
      tenant_id: tenantId,
      type,
      status: 'active',
      storage_key: storageKey,
      public_url: publicUrl,
      metadata,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('saveDesignAsset error:', error)
    return null
  }

  return data as PartnerAsset
}

// ---------------------------------------------------------------------------
// getDesignAssets
// ---------------------------------------------------------------------------

export async function getDesignAssets(
  tenantId: string,
  typeFilter?: 'design' | 'mockup',
  limit = 50,
): Promise<PartnerAsset[]> {
  let query = db()
    .from('partner_assets')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (typeFilter) {
    query = query.eq('type', typeFilter)
  }

  const { data, error } = await query

  if (error || !data) return []
  return data as PartnerAsset[]
}

// ---------------------------------------------------------------------------
// updateDesignConfig
// ---------------------------------------------------------------------------

export async function updateDesignConfig(
  tenantId: string,
  updates: Partial<Omit<PartnerDesignConfig, 'tenant_id'>>,
): Promise<PartnerDesignConfig | null> {
  const { data, error } = await db()
    .from('partner_design_config')
    .upsert({
      tenant_id: tenantId,
      ...updates,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('updateDesignConfig error:', error)
    return null
  }

  return data as PartnerDesignConfig
}
