import { supabaseAdmin } from '@/lib/supabase-admin'
import type { PartnerLead } from './types'

const db = () => supabaseAdmin as any

export interface PartnerLeadActivity {
  id: string
  tenant_id: string
  lead_id: string
  actor_user_id: string | null
  type: 'created' | 'status_changed' | 'note' | 'next_action_set' | 'contacted' | 'assignment_changed'
  body: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface LeadUpdateInput {
  status?: string
  assigned_user_id?: string | null
  next_action_at?: string | null
  last_contacted_at?: string | null
  estimated_value_ars?: number | null
  lost_reason?: string | null
}

export async function createLead(tenantId: string, input: {
  name?: string
  email?: string
  phone?: string
  message?: string
  source?: string
  product_interest?: string
}): Promise<PartnerLead | null> {
  const { data, error } = await db()
    .from('partner_leads')
    .insert({
      tenant_id: tenantId,
      name: input.name || null,
      email: input.email || null,
      phone: input.phone || null,
      message: input.message || null,
      source: input.source || 'storefront',
      product_interest: input.product_interest || null,
      status: 'new',
    })
    .select()
    .single()

  if (error || !data) return null
  await addLeadActivity(tenantId, data.id, null, 'created').catch(() => {})
  return data as PartnerLead
}

export async function getLeads(tenantId: string, options?: {
  status?: string
  limit?: number
  offset?: number
  attentionOnly?: boolean
}): Promise<PartnerLead[]> {
  let query = db()
    .from('partner_leads')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (options?.status) query = query.eq('status', options.status)
  if (options?.attentionOnly) {
    query = query.or(`next_action_at.lt.${new Date().toISOString()},and(status.eq.new,created_at.lt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()})`)
  }
  if (options?.limit) query = query.limit(options.limit)
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1)

  const { data, error } = await query
  if (error || !data) return []
  return data as PartnerLead[]
}

export async function countLeadsThisMonth(tenantId: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error } = await db()
    .from('partner_leads')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', startOfMonth.toISOString())

  if (error) return 0
  return count || 0
}

export async function getLeadById(tenantId: string, leadId: string): Promise<PartnerLead | null> {
  const { data, error } = await db()
    .from('partner_leads')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', leadId)
    .single()

  if (error || !data) return null
  return data as PartnerLead
}

export async function updateLead(
  tenantId: string,
  leadId: string,
  updates: LeadUpdateInput,
): Promise<PartnerLead | null> {
  const { data, error } = await db()
    .from('partner_leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('id', leadId)
    .select()
    .single()

  if (error || !data) return null
  return data as PartnerLead
}

/** Backward-compatible status-only updater, always tenant-scoped. */
export async function updateLeadStatus(tenantId: string, leadId: string, status: string): Promise<boolean> {
  const { data, error } = await db()
    .from('partner_leads')
    .update({ status })
    .eq('tenant_id', tenantId)
    .eq('id', leadId)
    .select('id')
  return !error && Array.isArray(data) && data.length > 0
}

export async function getLeadActivities(
  tenantId: string,
  leadId: string,
  limit = 80,
): Promise<PartnerLeadActivity[]> {
  const { data, error } = await db()
    .from('partner_lead_activities')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as PartnerLeadActivity[]
}

export async function addLeadActivity(
  tenantId: string,
  leadId: string,
  actorUserId: string | null,
  type: PartnerLeadActivity['type'],
  body?: string | null,
  metadata: Record<string, unknown> = {},
): Promise<PartnerLeadActivity | null> {
  const { data, error } = await db()
    .from('partner_lead_activities')
    .insert({
      tenant_id: tenantId,
      lead_id: leadId,
      actor_user_id: actorUserId,
      type,
      body: body || null,
      metadata,
    })
    .select()
    .single()

  if (error || !data) return null
  return data as PartnerLeadActivity
}
