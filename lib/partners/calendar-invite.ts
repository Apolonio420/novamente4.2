/**
 * ICS calendar invite generator for onboarding calls.
 * Argentina timezone: ART = UTC-3
 */

interface ICSParams {
  date: string       // YYYY-MM-DD
  time: string       // HH:mm
  partnerName: string
  topic?: string
  duration?: number  // minutes, defaults to 30
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatICSDate(dateStr: string, timeStr: string): string {
  // Parse date and time, treat as ART (UTC-3)
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)

  // Convert ART to UTC by adding 3 hours
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours + 3, minutes, 0))

  const y = utcDate.getUTCFullYear()
  const m = pad(utcDate.getUTCMonth() + 1)
  const d = pad(utcDate.getUTCDate())
  const h = pad(utcDate.getUTCHours())
  const min = pad(utcDate.getUTCMinutes())

  return `${y}${m}${d}T${h}${min}00Z`
}

function generateUID(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let uid = ''
  for (let i = 0; i < 32; i++) {
    uid += chars[Math.floor(Math.random() * chars.length)]
  }
  return uid
}

export function generateICS(params: ICSParams): string {
  const { date, time, partnerName, topic, duration = 30 } = params

  const dtStart = formatICSDate(date, time)

  // Calculate end time
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  const endDate = new Date(Date.UTC(year, month - 1, day, hours + 3, minutes + duration, 0))

  const dtEnd = `${endDate.getUTCFullYear()}${pad(endDate.getUTCMonth() + 1)}${pad(endDate.getUTCDate())}T${pad(endDate.getUTCHours())}${pad(endDate.getUTCMinutes())}00Z`

  const now = new Date()
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`

  const summary = `Onboarding Call — ${partnerName}`
  const description = topic
    ? `Tema: ${topic}\\nLlamada de onboarding con el equipo de Novamente.`
    : 'Llamada de onboarding con el equipo de Novamente.'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Novamente//Partners//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${generateUID()}@novamente.ar`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'ORGANIZER;CN=Novamente:mailto:partners@novamente.ar',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio: Onboarding call en 15 minutos',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}
