import { supabaseAdmin } from '@/lib/supabase-admin'

const db = () => supabaseAdmin as any

export interface OnboardingBooking {
  id: string
  tenant_id: string
  preferred_date: string
  preferred_time: string
  topic: string | null
  phone: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
}

/**
 * Create a new onboarding call booking for a tenant.
 */
export async function createBooking(
  tenantId: string,
  data: {
    preferredDate: string
    preferredTime: string
    topic?: string
    phone?: string
  },
): Promise<OnboardingBooking> {
  // Cancel any existing pending/confirmed bookings first
  await db()
    .from('partner_onboarding_calls')
    .update({ status: 'cancelled' })
    .eq('tenant_id', tenantId)
    .in('status', ['pending', 'confirmed'])

  const { data: booking, error } = await db()
    .from('partner_onboarding_calls')
    .insert({
      tenant_id: tenantId,
      preferred_date: data.preferredDate,
      preferred_time: data.preferredTime,
      topic: data.topic || null,
      phone: data.phone || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('createBooking error:', error)
    throw new Error('No se pudo agendar la llamada')
  }

  return booking
}

/**
 * Get the latest active (pending/confirmed) booking for a tenant.
 */
export async function getBooking(tenantId: string): Promise<OnboardingBooking | null> {
  const { data, error } = await db()
    .from('partner_onboarding_calls')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('status', ['pending', 'confirmed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('getBooking error:', error)
    return null
  }

  return data
}

/**
 * Cancel a booking by ID.
 */
export async function cancelBooking(bookingId: string): Promise<void> {
  const { error } = await db()
    .from('partner_onboarding_calls')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (error) {
    console.error('cancelBooking error:', error)
    throw new Error('No se pudo cancelar la llamada')
  }
}
