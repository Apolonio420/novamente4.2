'use client'

import { useEffect, useState, useCallback } from 'react'
import { Lock, Phone, Calendar, Clock, CheckCircle, Download, X, Loader2, AlertCircle } from 'lucide-react'
import { authFetch } from '@/lib/partners/auth-fetch'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Booking {
  id: string
  tenant_id: string
  preferred_date: string
  preferred_time: string
  topic: string | null
  phone: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
}

// ---------------------------------------------------------------------------
// Time slots (weekdays 10:00–17:30, every 30 min)
// ---------------------------------------------------------------------------

const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  // Skip weekends
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1)
  }
  return d.toISOString().split('T')[0]
}

function getMaxDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Pendiente'
    case 'confirmed': return 'Confirmada'
    default: return status
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'pending': return 'text-yellow-400'
    case 'confirmed': return 'text-green-400'
    default: return 'text-zinc-400'
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OnboardingCallPage() {
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [tenantName, setTenantName] = useState('')

  // Form state
  const [date, setDate] = useState(getTomorrow())
  const [time, setTime] = useState('10:00')
  const [topic, setTopic] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Fetch current booking + tenant name
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [bookingRes, meRes] = await Promise.all([
        authFetch('/api/partners/onboarding-call'),
        authFetch('/api/partners/me'),
      ])

      if (bookingRes.status === 403) {
        setLocked(true)
        setLoading(false)
        return
      }

      if (bookingRes.ok) {
        const data = await bookingRes.json()
        setBooking(data.booking || null)
      }

      if (meRes.ok) {
        const meData = await meRes.json()
        setTenantName(meData.tenant?.name || meData.name || '')
      }
    } catch (e) {
      console.error('fetch error:', e)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ---------------------------------------------------------------------------
  // Submit booking
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await authFetch('/api/partners/onboarding-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredDate: date,
          preferredTime: time,
          topic: topic || undefined,
          phone: phone || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al agendar')
        return
      }

      setBooking(data.booking)
    } catch (e) {
      console.error('submit error:', e)
      setError('Error al agendar la llamada')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Cancel booking
  // ---------------------------------------------------------------------------

  const handleCancel = async () => {
    if (!booking) return
    setCancelling(true)
    setError(null)

    try {
      const res = await authFetch(`/api/partners/onboarding-call?id=${booking.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setBooking(null)
      } else {
        const data = await res.json()
        setError(data.error || 'Error al cancelar')
      }
    } catch (e) {
      console.error('cancel error:', e)
      setError('Error al cancelar la llamada')
    } finally {
      setCancelling(false)
    }
  }

  // ---------------------------------------------------------------------------
  // ICS download URL
  // ---------------------------------------------------------------------------

  const icsUrl = booking
    ? `/api/partners/onboarding-call/ics?date=${encodeURIComponent(booking.preferred_date)}&time=${encodeURIComponent(booking.preferred_time)}&name=${encodeURIComponent(tenantName || 'Partner')}`
    : ''

  // ---------------------------------------------------------------------------
  // Render: Loading
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Locked (not Pro)
  // ---------------------------------------------------------------------------

  if (locked) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-8">
        <div className="max-w-lg mx-auto mt-16 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-zinc-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Onboarding Call</h1>
          <p className="text-zinc-400 mb-6">
            Disponible en plan <span className="text-purple-400 font-semibold">Pro</span>.
            Agenda una llamada de 30 minutos con un asesor para configurar tu cuenta.
          </p>
          <a
            href="/workspace/settings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Upgrade a Pro
          </a>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Existing booking
  // ---------------------------------------------------------------------------

  if (booking) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-8">
        <div className="max-w-lg mx-auto mt-8 sm:mt-16">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Llamada agendada</h1>
                <p className={`text-sm font-medium ${statusColor(booking.status)}`}>
                  {statusLabel(booking.status)}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-zinc-300">
                <Calendar className="w-5 h-5 text-purple-400 shrink-0" />
                <span className="capitalize">{formatDate(booking.preferred_date)}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <Clock className="w-5 h-5 text-purple-400 shrink-0" />
                <span>{booking.preferred_time} hs (Argentina)</span>
              </div>
              {booking.topic && (
                <div className="flex items-start gap-3 text-zinc-300">
                  <AlertCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <span>{booking.topic}</span>
                </div>
              )}
              {booking.phone && (
                <div className="flex items-center gap-3 text-zinc-300">
                  <Phone className="w-5 h-5 text-purple-400 shrink-0" />
                  <span>{booking.phone}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={icsUrl}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar .ics
              </a>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {cancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Cancelar
              </button>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Booking form
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-8">
      <div className="max-w-lg mx-auto mt-8 sm:mt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Agenda tu onboarding call
          </h1>
          <p className="text-zinc-400">
            30 minutos con un asesor para configurar tu cuenta
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1.5 text-purple-400" />
                Fecha (lunes a viernes)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={getTomorrow()}
                max={getMaxDate()}
                required
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1.5 text-purple-400" />
                Horario (Argentina)
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} hs
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Tema (opcional)
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="¿Sobre que te gustaria hablar?"
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <Phone className="w-4 h-4 inline mr-1.5 text-purple-400" />
                Telefono / WhatsApp (opcional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234 5678"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Agendando...
                </>
              ) : (
                'Agendar llamada'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
