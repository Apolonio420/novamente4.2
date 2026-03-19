import { supabaseAdmin } from '@/lib/supabase-admin'

const db = () => supabaseAdmin as any
import type { PartnerLead } from './types'

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
  return data as PartnerLead
}

export async function getLeads(tenantId: string, options?: {
  status?: string
  limit?: number
  offset?: number
}): Promise<PartnerLead[]> {
  let query = db()
    .from('partner_leads')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (options?.status) query = query.eq('status', options.status)
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

export async function updateLeadStatus(leadId: string, status: string): Promise<boolean> {
  const { error } = await db()
    .from('partner_leads')
    .update({ status })
    .eq('id', leadId)

  return !error
}
