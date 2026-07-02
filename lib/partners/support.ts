import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Plan } from './types'

const db = () => supabaseAdmin as any

// --- Types ---

export interface SupportTicket {
  id: string
  tenant_id: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'normal' | 'priority'
  category: 'general' | 'billing' | 'technical' | 'feature_request'
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface SupportMessage {
  id: string
  ticket_id: string
  sender_type: 'partner' | 'admin'
  sender_name: string
  message: string
  created_at: string
}

export interface TicketWithMessages extends SupportTicket {
  messages: SupportMessage[]
}

// --- Service functions ---

export async function createTicket(
  tenantId: string,
  subject: string,
  description: string,
  category: SupportTicket['category'] = 'general',
  plan?: Plan
): Promise<SupportTicket | null> {
  const priority: SupportTicket['priority'] = plan === 'pro' ? 'priority' : 'normal'

  const { data, error } = await db()
    .from('partner_support_tickets')
    .insert({
      tenant_id: tenantId,
      subject,
      description,
      category,
      priority,
      status: 'open',
    })
    .select()
    .single()

  if (error) {
    console.error('createTicket error:', error)
    return null
  }
  return data
}

export async function getTickets(
  tenantId: string,
  status?: SupportTicket['status']
): Promise<SupportTicket[]> {
  let query = db()
    .from('partner_support_tickets')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) {
    console.error('getTickets error:', error)
    return []
  }
  return data || []
}

export async function getTicketById(
  ticketId: string,
  tenantId?: string
): Promise<TicketWithMessages | null> {
  let query = db()
    .from('partner_support_tickets')
    .select('*')
    .eq('id', ticketId)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data: ticket, error: ticketError } = await query.single()
  if (ticketError || !ticket) {
    console.error('getTicketById error:', ticketError)
    return null
  }

  const { data: messages, error: msgError } = await db()
    .from('partner_support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (msgError) {
    console.error('getTicketById messages error:', msgError)
  }

  return { ...ticket, messages: messages || [] }
}

export async function addMessage(
  tenantId: string,
  ticketId: string,
  senderType: SupportMessage['sender_type'],
  senderName: string,
  message: string
): Promise<SupportMessage | null> {
  const { data, error } = await db()
    .from('partner_support_messages')
    .insert({
      ticket_id: ticketId,
      sender_type: senderType,
      sender_name: senderName,
      message,
    })
    .select()
    .single()

  if (error) {
    console.error('addMessage error:', error)
    return null
  }

  // Update ticket's updated_at
  await db()
    .from('partner_support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('tenant_id', tenantId)

  return data
}

export async function updateTicketStatus(
  tenantId: string,
  ticketId: string,
  status: SupportTicket['status']
): Promise<SupportTicket | null> {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'resolved') {
    updates.resolved_at = new Date().toISOString()
  }

  const { data, error } = await db()
    .from('partner_support_tickets')
    .update(updates)
    .eq('id', ticketId)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) {
    console.error('updateTicketStatus error:', error)
    return null
  }
  return data
}

export async function getAdminTickets(
  status?: SupportTicket['status'],
  priority?: SupportTicket['priority']
): Promise<(SupportTicket & { tenant_name?: string })[]> {
  let query = db()
    .from('partner_support_tickets')
    .select('*, tenants(name)')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (priority) {
    query = query.eq('priority', priority)
  }

  const { data, error } = await query
  if (error) {
    console.error('getAdminTickets error:', error)
    return []
  }

  return (data || []).map((t: any) => ({
    ...t,
    tenant_name: t.tenants?.name || null,
    tenants: undefined,
  }))
}
