'use client'

/**
 * Reporte de errores del workspace del partner (auditoría 08/10/2026): antes
 * el botón "Reportar al asistente" solo prellenaba el chat de FAQ — nada se
 * guardaba ni se avisaba, y un partner podía irse sin que nadie se enterara.
 *
 *  - useAutoReportError: manda el error UNA vez a /api/partners/assistant/bug-report
 *    (que guarda y avisa a Telegram con cooldown). Dedupe por digest (o ruta+mensaje)
 *    con un Set de módulo + sessionStorage, porque React StrictMode dispara los
 *    efectos dos veces y un re-render/reset() no debe reenviar.
 *  - createErrorTicket: crea un ticket de soporte real con el error.
 */
import { useEffect } from 'react'
import { authFetch } from '@/lib/partners/auth-fetch'

const STORAGE_KEY = 'ws-error-reported'
const reportedInMemory = new Set<string>()

export interface ReportableError extends Error {
  digest?: string
}

export function errorDedupeKey(error: ReportableError, path: string): string {
  return error.digest || `${path}|${error.message}`
}

function alreadyReported(key: string): boolean {
  if (reportedInMemory.has(key)) return true
  try {
    const list: string[] = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]')
    return list.includes(key)
  } catch {
    return false
  }
}

function markReported(key: string) {
  reportedInMemory.add(key)
  try {
    const list: string[] = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]')
    list.push(key)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-20)))
  } catch {
    /* sessionStorage no disponible: queda el Set en memoria */
  }
}

/** Manda el reporte automático. Silencioso ante cualquier falla (una sesión vencida, por ejemplo, no debe empeorar la pantalla de error). */
export async function sendAutoReport(error: ReportableError): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname
  const key = errorDedupeKey(error, path)
  if (alreadyReported(key)) return false
  markReported(key) // antes del await: dos efectos seguidos no mandan dos veces
  try {
    const res = await authFetch('/api/partners/assistant/bug-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: `Error automático en ${path}: ${error.message || 'sin mensaje'}`.slice(0, 5000),
        errorMessage: (error.message || '').slice(0, 2000),
        errorStack: error.stack?.slice(0, 5000),
        errorDigest: error.digest,
        sourceUrl: window.location.href.slice(0, 500),
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Reporta una sola vez al montar la pantalla de error. `enabled=false` lo desactiva (ej. error fuera de /workspace). */
export function useAutoReportError(error: ReportableError, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    void sendAutoReport(error)
  }, [error, enabled])
}

/** Crea un ticket de soporte con el error, la ruta y el digest. Devuelve el id o null. */
export async function createErrorTicket(error: ReportableError): Promise<string | null> {
  const path = typeof window !== 'undefined' ? window.location.pathname : 'desconocida'
  const description = [
    'El partner tocó "Avisar a Novamente" en la pantalla de error del workspace.',
    '',
    `Ruta: ${path}`,
    `Error: ${error.message || 'sin mensaje'}`,
    error.digest ? `Digest: ${error.digest}` : '',
  ]
    .filter((l) => l !== '')
    .join('\n')
  try {
    const res = await authFetch('/api/partners/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: `Error en ${path}`.slice(0, 200),
        description,
        category: 'technical',
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.ticket?.id ?? null
  } catch {
    return null
  }
}
