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
import { checkAlertCooldown, formatRepeatedSuffix, wasAlertSentRecently } from '@/lib/alerts/alert-cooldown'
import {
  WORKSPACE_ERROR_DEDUPE_WINDOW_MS,
  bugDigestKey,
  bugPathMessageKey,
  type ErrorTicketContext,
} from '@/lib/alerts/workspace-error-keys'

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

/**
 * ¿El bug-report automático de ESTE mismo error ya avisó a Urgente hace < 30 min?
 * Un crash genera dos avisos (auto-reporte + ticket "Avisar a Novamente"); el
 * segundo es ruido. Mira tenant+digest y, si no, tenant+ruta+mensaje.
 */
export async function wasErrorAlreadyAlerted(tenantId: string, ctx: ErrorTicketContext): Promise<boolean> {
  if (ctx.digest && (await wasAlertSentRecently(bugDigestKey(tenantId, ctx.digest), WORKSPACE_ERROR_DEDUPE_WINDOW_MS))) {
    return true
  }
  if (ctx.path && ctx.message) {
    return wasAlertSentRecently(bugPathMessageKey(tenantId, ctx.path, ctx.message), WORKSPACE_ERROR_DEDUPE_WINDOW_MS)
  }
  return false
}

export async function notifySupportTicketCreated(input: {
  tenantName: string
  subject: string
  description: string
  ticketId: string
  priority?: string
  /** Para tickets creados desde la pantalla de error del workspace. */
  tenantId?: string
  errorContext?: ErrorTicketContext | null
  /** Texto libre sobre dónde se originó el ticket (ej. el asistente). Se escapa. */
  originNote?: string
}) {
  const ctx = input.errorContext
  if (ctx && input.tenantId && (await wasErrorAlreadyAlerted(input.tenantId, ctx))) {
    // Mismo error que el aviso automático (ya en Urgente): el ticket queda
    // creado y visible en el admin, pero no se manda un segundo ping.
    return null
  }
  const msg = [
    `🆘 <b>TICKET DE SOPORTE — ${escapeTelegramHtml(input.tenantName || 'Partner')}</b>${input.priority === 'priority' ? ' (plan Pro, prioridad)' : ''}`,
    `<b>Asunto:</b> ${escapeTelegramHtml(snippet(input.subject))}`,
    escapeTelegramHtml(snippet(input.description)),
    ctx
      ? `<i>Viene de la pantalla de error del workspace${ctx.digest ? ` — Error ID: <code>${escapeTelegramHtml(ctx.digest)}</code>` : ''}.</i>`
      : '',
    input.originNote ? `<i>${escapeTelegramHtml(snippet(input.originNote))}</i>` : '',
    `<a href="${ticketUrl(input.ticketId)}">Abrir ticket en el admin</a>`,
  ]
    .filter(Boolean)
    .join('\n')
  return notifyUrgent(msg)
}

/** Ventana de silencio por partner para pedidos de ayuda del asistente (anti-flood). */
export const ASSISTANT_TICKET_COOLDOWN_MS = 10 * 60 * 1000

/**
 * Ticket pedido desde el asistente de Novamente (POST /api/assistant/ticket):
 * un partner (logueado) pidió ayuda humana. Mismo destino que los tickets de
 * Soporte del workspace — "🚨 Urgente", ver notifySupportTicketCreated — pero con
 * cooldown POR PARTNER (10 min): un partner que dispara el asistente en loop no
 * puede inundar el grupo. Los tickets sí se crean todos (quedan en el admin);
 * lo que se suprime es solo el ping, y el siguiente aviso cuenta cuántos se
 * silenciaron. Best-effort: nunca lanza.
 */
export async function notifyAssistantTicketCreated(input: {
  tenantId: string
  tenantName: string
  subject: string
  description: string
  ticketId: string
  priority?: string
  pageUrl?: string
}) {
  try {
    const decision = await checkAlertCooldown(`assistant-ticket:${input.tenantId}`, ASSISTANT_TICKET_COOLDOWN_MS)
    if (!decision.send) return null
    const origin = [
      'Pedido de ayuda desde el asistente',
      input.pageUrl ? `(página: ${input.pageUrl})` : '',
      decision.repeatedCount > 0 ? `— se silenciaron ${decision.repeatedCount} pedidos más de este partner en los últimos 10 min` : '',
    ]
      .filter(Boolean)
      .join(' ')
    return await notifySupportTicketCreated({
      tenantName: input.tenantName,
      subject: input.subject,
      description: input.description,
      ticketId: input.ticketId,
      priority: input.priority,
      originNote: origin,
    })
  } catch (e) {
    console.error('[support-notify] aviso de ticket del asistente falló (no bloquea):', e instanceof Error ? e.message : e)
    return null
  }
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
