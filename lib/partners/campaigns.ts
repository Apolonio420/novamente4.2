import { supabaseAdmin } from '@/lib/supabase-admin'

const db = () => supabaseAdmin as any

export interface PartnerCampaign {
  id: string
  tenant_id: string
  product_id: string | null
  channel: 'meta' | 'google' | 'tiktok' | 'other'
  name: string
  template_type: string | null
  status: 'draft' | 'active' | 'paused' | 'completed'
  utm_campaign: string
  utm_source: string
  utm_medium: string
  destination_url: string
  budget_daily_ars: number | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export async function listCampaigns(tenantId: string): Promise<PartnerCampaign[]> {
  const { data, error } = await db()
    .from('partner_campaigns')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error || !data) return []
  return data as PartnerCampaign[]
}

export async function createCampaign(
  tenantId: string,
  input: Omit<PartnerCampaign, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>,
): Promise<PartnerCampaign | null> {
  const { data, error } = await db()
    .from('partner_campaigns')
    .insert({ ...input, tenant_id: tenantId })
    .select()
    .single()
  if (error || !data) return null
  return data as PartnerCampaign
}

export async function updateCampaign(
  tenantId: string,
  id: string,
  updates: Partial<Pick<PartnerCampaign, 'status' | 'budget_daily_ars' | 'name'>>,
): Promise<PartnerCampaign | null> {
  const { data, error } = await db()
    .from('partner_campaigns')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .select()
    .single()
  if (error || !data) return null
  return data as PartnerCampaign
}
