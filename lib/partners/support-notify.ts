/**
 * Avisos de Telegram para soporte de partners (auditoría workspace 08/10/2026):
 * un ticket o mensaje del partner solo se INSERTABA — el admin lo veía recién
 * en el dashboard, o por el web push de las 30 min. El dueño quiere enterarse
 * cuando un partner pide ayuda, pero con POCAS alertas, siempre accionables:
 *
 *  - Ticket nuevo → siempre avisa a "🚨 Urgente".
 *  - Mensaje de seguimiento del partner → a lo sumo UN aviso por ticket cada
 *    30 min (checkAlertCooldown con clave por ticket). Diez mensajes seguidos
 *    no son diez pings.
 *  - Mensajes de staff → nunca avisan (el caller solo llama con 'partner').
 *
 * Todo es best-effort: nunca lanza ni rompe la creación del ticket.
 */
import { after } from 'next/server'
import { notifyUrgent, escapeTelegramHtml } from '@/lib/notifications'
import { checkAlertCooldown, formatRepeatedSuffix } from '@/lib/alerts/alert-cooldown'

const ADMIN_TICKETS_URL = 'https://admin.novamente.ar/dashboard/tickets'
const SNIPPET_MAX = 200

function snippet(text: string): string {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim()
  return clean.length > SNIPPET_MAX ? `${clean.slice(0, SNIPPET_MAX)}…` : clean
}

function ticketUrl(ticketId: string): string {
  return `${ADMIN_TICKETS_URL}?selected=${encodeURIComponent(ticketId)}`
}

/**
 * Corre `fn` después de responder (after()) para que el aviso no se pierda
 * cuando Vercel congela la función, con fallback a fire-and-forget si no hay
 * contexto de request (tests, scripts).
 */
export function runAfterResponse(fn: () => Promise<unknown>): void {
  const safe = async () => {
    try {
      await fn()
    } catch (e) {
      console.error('[support-notify] aviso falló (no bloquea):', e instanceof Error ? e.message : e)
    }
  }
  try {
    after(safe)
  } catch {
    void safe()
  }
}

export async function notifySupportTicketCreated(input: {
  tenantName: string
  subject: string
  description: string
  ticketId: string
  priority?: string
}) {
  const msg = [
    `🆘 <b>TICKET DE SOPORTE — ${escapeTelegramHtml(input.tenantName || 'Partner')}</b>${input.priority === 'priority' ? ' (plan Pro, prioridad)' : ''}`,
    `<b>Asunto:</b> ${escapeTelegramHtml(snippet(input.subject))}`,
    escapeTelegramHtml(snippet(input.description)),
    `<a href="${ticketUrl(input.ticketId)}">Abrir ticket en el admin</a>`,
  ].join('\n')
  return notifyUrgent(msg)
}

export async function notifySupportPartnerMessage(input: {
  tenantName: string
  subject: string
  message: string
  ticketId: string
}) {
  const decision = await checkAlertCooldown(`support-msg:${input.ticketId}`)
  if (!decision.send) return null // ya avisamos de este ticket hace < 30 min
  const msg = [
    `💬 <b>Respuesta del partner en un ticket — ${escapeTelegramHtml(input.tenantName || 'Partner')}</b>`,
    `<b>Asunto:</b> ${escapeTelegramHtml(snippet(input.subject))}`,
    escapeTelegramHtml(snippet(input.message)),
    `<a href="${ticketUrl(input.ticketId)}">Abrir ticket en el admin</a>${formatRepeatedSuffix(decision.repeatedCount)}`,
  ].join('\n')
  return notifyUrgent(msg)
}

export async function notifySuperActionRequested(input: {
  tenantName: string
  actionType: string
  description: string
  requestId?: string
}) {
  const msg = [
    `⚡ <b>SUPER ACCIÓN pedida — ${escapeTelegramHtml(input.tenantName || 'Partner')}</b>`,
    `<b>Tipo:</b> ${escapeTelegramHtml(input.actionType)}`,
    escapeTelegramHtml(snippet(input.description)),
    input.requestId ? `<i>Solicitud ${escapeTelegramHtml(input.requestId)}</i>` : '',
  ]
    .filter(Boolean)
    .join('\n')
  return notifyUrgent(msg)
}
